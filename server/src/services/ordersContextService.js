import prisma from "../config/prisma.js";

const ORDER_TRIGGER_KEYWORDS = [
  "orders",
  "pending",
  "delayed",
  "shipped",
  "cancelled",
  "canceled",
  "refunds",
  "refund",
  "fulfillment",
  "delivery",
  "deliveries",
  "customers waiting",
  "high value orders",
  "high value order",
  "high-value",
];

function normalizeText(value) {
  if (typeof value !== "string") return "";
  return value.replace(/\u0000/g, "").trim();
}

function hasOrdersTrigger(userText) {
  const text = normalizeText(userText).toLowerCase();
  if (!text) return false;

  // Small, defensive matcher: ensure keyword presence.
  return ORDER_TRIGGER_KEYWORDS.some((k) => {
    const kk = k.toLowerCase();
    return kk && text.includes(kk);
  });
}

function clampText(value, maxChars) {
  if (typeof value !== "string") return "";
  if (value.length <= maxChars) return value;
  return value.slice(0, maxChars).trimEnd();
}

function toNumber(n) {
  const num = typeof n === "number" ? n : Number(n);
  return Number.isFinite(num) ? num : 0;
}

function formatMoney(n) {
  const num = toNumber(n);
  return num.toFixed(2);
}

function buildOrdersContextSnippet({
  pendingCount,
  delayedFulfillmentCount,
  cancelledCount,
  refundedCount,
  recentOrders,
  highValuePendingOrders,
  avgOrderValue,
  recentOrderActivity,
}) {
  const lines = [];
  lines.push("Orders context (read-only):");

  // Keep lines minimal and consistent.
  lines.push(`- Pending orders: ${pendingCount}`);
  lines.push(`- Delayed fulfillment indicators: ${delayedFulfillmentCount}`);

  if (cancelledCount > 0 || refundedCount > 0) {
    lines.push(`- Cancelled orders: ${cancelledCount}`);
    lines.push(`- Refunded orders: ${refundedCount}`);
  }

  if (Array.isArray(highValuePendingOrders) && highValuePendingOrders.length) {
    lines.push("- High-value pending orders (top):");
    highValuePendingOrders.forEach((o, idx) => {
      const ord = o?.orderNumber != null ? `#${o.orderNumber}` : `#${o?.id ?? "N/A"}`;
      lines.push(`${idx + 1}) ${ord} — $${formatMoney(o?.totalAmount)}`);
    });
  }

  if (Array.isArray(recentOrders) && recentOrders.length) {
    lines.push("- Recent order activity:");
    recentOrders.forEach((o) => {
      const date = o?.createdAt ? new Date(o.createdAt) : null;
      const label = date && !Number.isNaN(date.getTime())
        ? date.toLocaleDateString(undefined, { month: "short", day: "numeric" })
        : "";
      const ord = o?.orderNumber != null ? `#${o.orderNumber}` : `#${o?.id ?? "N/A"}`;
      lines.push(`${ord} — ${o?.status ?? ""}${label ? ` (${label})` : ""}`.trim());
    });
  } else if (Array.isArray(recentOrderActivity) && recentOrderActivity.length) {
    // Fallback: include daily activity even without specific order rows.
    lines.push("- Recent order trends:");
    recentOrderActivity.forEach((t) => {
      lines.push(`${t?.label ?? ""}: ${t?.count ?? 0} orders`);
    });
  }

  lines.push(`- Avg order value (non-cancelled/refunded): $${formatMoney(avgOrderValue)}`);
  lines.push("Notes: current snapshot; AI does not perform any actions.");

  return clampText(lines.join("\n"), 900);
}

export async function buildOrdersContextIfRelevant(userText) {
  try {
    if (!hasOrdersTrigger(userText)) return null;

    // Light trigger-specific behavior: avoid extra queries if not needed.
    // Always fetch a minimal set of counts for operational questions.
    const excludedStatuses = ["CANCELLED", "REFUNDED"];

    const pendingStatuses = ["PENDING", "PROCESSING", "PAID"];
    const delayedHeuristicDays = 3;

    const now = new Date();
    const delayedCutoff = new Date(now);
    delayedCutoff.setDate(delayedCutoff.getDate() - delayedHeuristicDays);

    const [pendingCountRaw, delayedCountRaw, cancelledCountRaw, refundedCountRaw] =
      await Promise.all([
        prisma.order.count({
          where: { status: { in: pendingStatuses } },
        }),
        // Heuristic: shipped but not delivered and older than a small window.
        prisma.order.count({
          where: {
            status: "SHIPPED",
            createdAt: { lt: delayedCutoff },
          },
        }),
        prisma.order.count({
          where: { status: "CANCELLED" },
        }),
        prisma.order.count({
          where: { OR: [{ status: "REFUNDED" }, { paymentStatus: "REFUNDED" }] },
        }),
      ]);

    const pendingCount = toNumber(pendingCountRaw);
    const delayedFulfillmentCount = toNumber(delayedCountRaw);
    const cancelledCount = toNumber(cancelledCountRaw);
    const refundedCount = toNumber(refundedCountRaw);

    // Average order value (excluding cancelled/refunded) - lightweight aggregation.
    const avgAgg = await prisma.order.aggregate({
      _avg: { totalAmount: true },
      where: { status: { notIn: excludedStatuses } },
    });

    const avgOrderValue = toNumber(avgAgg?._avg?.totalAmount);

    // Recent orders: light select fields only.
    const recentOrders = await prisma.order.findMany({
      where: {
        status: { notIn: excludedStatuses },
      },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    // High value pending-ish orders: limit rows. Avoid heavy joins.
    // Approx: filter by status and sort by totalAmount desc.
    const highValuePendingOrders = await prisma.order.findMany({
      where: {
        status: { in: pendingStatuses },
      },
      select: {
        id: true,
        orderNumber: true,
        totalAmount: true,
        status: true,
      },
      orderBy: { totalAmount: "desc" },
      take: 3,
    });

    // Recent order activity trends (counts only, last 7 days)
    const recentOrderActivity = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const start = new Date(d.setHours(0, 0, 0, 0));
      const end = new Date(d.setHours(23, 59, 59, 999));

      const count = await prisma.order.count({
        where: {
          createdAt: { gte: start, lte: end },
          status: { notIn: excludedStatuses },
        },
      });

      const label = start.toLocaleDateString(undefined, { month: "short", day: "numeric" });
      recentOrderActivity.push({ label, count });
    }

    const snippet = buildOrdersContextSnippet({
      pendingCount,
      delayedFulfillmentCount,
      cancelledCount,
      refundedCount,
      recentOrders,
      highValuePendingOrders,
      avgOrderValue,
      recentOrderActivity,
    });

    // If snippet is too small, omit it to avoid wasting tokens.
    if (!snippet || snippet.length < 10) return null;

    return snippet;
  } catch {
    // Graceful fallback: on Prisma failure, omit context.
    return null;
  }
}

export default {
  buildOrdersContextIfRelevant,
};

