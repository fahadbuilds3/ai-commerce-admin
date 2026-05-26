import prisma from "../config/prisma.js";

const KEYWORDS = [
  "inventory",
  "stock",
  "sku",
  "restock",
  "low stock",
  "warehouse",
];

function normalizeText(value) {
  if (typeof value !== "string") return "";
  return value.replace(/\u0000/g, "").trim();
}

function hasInventoryTrigger(userText) {
  const text = normalizeText(userText).toLowerCase();
  if (!text) return false;

  return KEYWORDS.some((k) => text.includes(k.toLowerCase()));
}

function clampText(value, maxChars) {
  if (typeof value !== "string") return "";
  if (value.length <= maxChars) return value;
  return value.slice(0, maxChars).trimEnd();
}

function buildContextSnippet({ counts, topValueItems }) {
  const outOfStock = counts?.outOfStock ?? 0;
  const lowStock = counts?.lowStock ?? 0;
  const inStock = counts?.inStock ?? 0;

  const lines = [];
  lines.push("Inventory context (read-only):");
  lines.push(`- Out of stock (stock <= 0): ${outOfStock}`);
  lines.push(`- Low stock (1 <= stock <= 10): ${lowStock}`);
  lines.push(`- In stock (stock > 10): ${inStock}`);

  if (Array.isArray(topValueItems) && topValueItems.length) {
    lines.push("- Highest inventory value (top items stock*price):");
    topValueItems.forEach((it, idx) => {
      const sku = it?.sku ?? "N/A";
      const name = it?.name ?? "";
      const stock = typeof it?.stock === "number" ? it.stock : 0;
      const price = typeof it?.price === "number" ? it.price : 0;
      const value = typeof it?.value === "number" ? it.value : stock * price;
      const valueStr = Number.isFinite(value) ? value.toFixed(2) : "0.00";
      const namePart = name ? ` (${name})` : "";
      lines.push(`${idx + 1}) ${sku}${namePart} — stock ${stock}, price ${price}, value ${valueStr}`);
    });
  } else {
    lines.push("- Highest inventory value items: unavailable");
  }

  lines.push("Notes: current snapshot; AI does not perform any actions.");

  // Token-efficient cap (chars)
  return clampText(lines.join("\n"), 900);
}

export async function buildInventoryContextIfRelevant(userText) {
  try {
    if (!hasInventoryTrigger(userText)) return null;

    // Lightweight counts
    const [outOfStock, lowStock, inStock] = await Promise.all([
      prisma.product.count({
        where: { isDeleted: false, stock: { lte: 0 } },
      }),
      prisma.product.count({
        where: { isDeleted: false, stock: { gt: 0, lte: 10 } },
      }),
      prisma.product.count({
        where: { isDeleted: false, stock: { gt: 10 } },
      }),
    ]);

    // Lightweight top inventory value items.
    // Since ordering by stock*price isn't directly supported, we fetch a small
    // candidate set (by highest stock) and compute top by stock*price in JS.
    const candidates = await prisma.product.findMany({
      where: { isDeleted: false, stock: { gt: 0 } },
      select: {
        sku: true,
        name: true,
        stock: true,
        price: true,
      },
      take: 30,
      orderBy: { stock: "desc" },
    });

    const topValueItems = (candidates ?? [])
      .map((p) => {
        const stock = typeof p?.stock === "number" ? p.stock : 0;
        const price = typeof p?.price === "number" ? p.price : 0;
        const value = stock * price;
        return {
          sku: p?.sku ?? "N/A",
          name: p?.name ?? "",
          stock,
          price,
          value,
        };
      })
      .filter((x) => Number.isFinite(x?.value) && x.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    const snippet = buildContextSnippet({
      counts: { outOfStock, lowStock, inStock },
      topValueItems,
    });

    // Defensive: if nothing useful, still return null (avoid wasting tokens)
    if (!snippet || snippet.length < 10) return null;

    return snippet;
  } catch {
    // Graceful fallback: on Prisma failure, omit context.
    return null;
  }
}

