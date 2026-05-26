import prisma from "../config/prisma.js";

const KEYWORDS = [
  "analytics",
  "revenue",
  "sales",
  "profit",
  "orders",
  "top products",
  "performance",
  "trends",
];

function normalizeText(value) {
  if (typeof value !== "string") return "";
  return value.replace(/\u0000/g, "").trim();
}

function hasAnalyticsTrigger(userText) {
  const text = normalizeText(userText).toLowerCase();
  if (!text) return false;

  return KEYWORDS.some((k) => {
    const kk = k.toLowerCase();
    return text.includes(kk);
  });
}

function clampText(value, maxChars) {
  if (typeof value !== "string") return "";
  if (value.length <= maxChars) return value;
  return value.slice(0, maxChars).trimEnd();
}

function formatMoney(n) {
  const num = typeof n === "number" ? n : Number(n);
  if (!Number.isFinite(num)) return "0.00";
  return num.toFixed(2);
}

function safePct(n) {
  const num = typeof n === "number" ? n : Number(n);
  if (!Number.isFinite(num)) return null;
  if (Math.abs(num) > 1e6) return null;
  return num;
}

function buildAnalyticsContextSnippet({
  totalOrders,
  totalRevenue,
  avgOrderValue,
  topProducts,
  recentOrderTrends,
}) {
  const lines = [];
  lines.push("Analytics context (read-only):");

  lines.push(`- Total orders: ${totalOrders}`);
  lines.push(`- Total revenue: $${formatMoney(totalRevenue)}`);
  lines.push(`- Avg order value: $${formatMoney(avgOrderValue)}`);

  if (Array.isArray(topProducts) && topProducts.length) {
    lines.push("- Top-selling products (by quantity):");
    topProducts.forEach((p, idx) => {
      const name = p?.name ? String(p.name) : "Unknown Product";
      const qty = typeof p?.quantity === "number" ? p.quantity : 0;
      const revenue = typeof p?.revenue === "number" ? p.revenue : 0;
      lines.push(`${idx + 1}) ${name} — qty ${qty}, revenue $${formatMoney(revenue)}`);
    });
  } else {
    lines.push("- Top-selling products: unavailable");
  }

  if (Array.isArray(recentOrderTrends) && recentOrderTrends.length) {
    lines.push("- Recent order trends (last 7 days):");
    recentOrderTrends.forEach((t) => {
      lines.push(`${t?.label ?? ""}: ${t?.orders ?? 0} orders`);
    });
  } else {
    lines.push("- Recent order trends: unavailable");
  }

  lines.push("Notes: current snapshot; AI does not perform any actions.");

  return clampText(lines.join("\n"), 900);
}

export async function buildAnalyticsContextIfRelevant(userText) {
  try {
    if (!hasAnalyticsTrigger(userText)) return null;

    // Lightweight boundaries
    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    // Revenue/order should generally ignore cancelled/refunded.
    const excludedStatuses = ["CANCELLED", "REFUNDED"];

    // Totals
    const [totalOrdersRaw, totalRevenueAgg] = await Promise.all([
      prisma.order.count({
        where: { status: { notIn: excludedStatuses } },
      }),
      prisma.order.aggregate({
        _sum: { totalAmount: true },
        where: { status: { notIn: excludedStatuses } },
      }),
    ]);

    const totalOrders = typeof totalOrdersRaw === "number" ? totalOrdersRaw : 0;
    const totalRevenue = parseFloat(totalRevenueAgg?._sum?.totalAmount || 0);
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Top products by quantity (lightweight)
    // orderItem quantities give best "top products" signal without heavy joins.
    const topQty = await prisma.orderItem.groupBy({
      by: ["productId"],
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 5,
    });

    // Fetch minimal product details for those productIds
    const productIds = (topQty ?? []).map((g) => g?.productId).filter(Boolean);

    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true, price: true },
      take: 5,
    });

    const topProducts = (topQty ?? [])
      .slice(0, 5)
      .map((g) => {
        const qty = typeof g?._sum?.quantity === "number" ? g._sum.quantity : 0;
        const product = (products ?? []).find((p) => p?.id === g?.productId);
        const name = product?.name ?? "Unknown Product";
        const unitPrice = typeof product?.price === "number" ? product.price : 0;
        const revenue = unitPrice * qty; // approximate using current product price (cheap)
        return { name, quantity: qty, revenue };
      })
      .filter((p) => p?.quantity > 0);

    // Recent trends (last 7 days): order counts per day
    const recentOrderTrends = [];
    // Keep to 7 small queries (counts only)
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const start = new Date(d.setHours(0, 0, 0, 0));
      const end = new Date(d.setHours(23, 59, 59, 999));

      const cnt = await prisma.order.count({
        where: {
          createdAt: { gte: start, lte: end },
          status: { notIn: excludedStatuses },
        },
      });

      const label = start.toLocaleDateString(undefined, { month: "short", day: "numeric" });
      recentOrderTrends.push({ label, orders: cnt });
    }

    const snippet = buildAnalyticsContextSnippet({
      totalOrders,
      totalRevenue,
      avgOrderValue,
      topProducts,
      recentOrderTrends,
    });

    if (!snippet || snippet.length < 10) return null;
    return snippet;
  } catch {
    return null;
  }
}

