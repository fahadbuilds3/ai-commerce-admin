import { mkdirSync, writeFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outputDir = path.resolve(__dirname, "../prisma/seed-data");

const PASSWORD_HASH =
  "$2b$10$abcdefghijklmnopqrstuv123456789012345678901234567890";

const categories = [
  "Electronics",
  "Smart Watches",
  "Fitness Trackers",
  "Beauty",
  "Perfumes",
  "Jewelry",
  "Home",
  "Accessories",
];

const brands = [
  "DemoCore",
  "Northline",
  "BrightNest",
  "PulseLab",
  "Aster & Co",
  "UrbanMock",
  "NovaTest",
  "ClearPeak",
];

const domains = ["example.com", "demo.test", "mail.test"];
const cities = [
  "Sampleton",
  "Testville",
  "Mockford",
  "Demoburg",
  "Faketown",
  "Seed City",
  "Preview Bay",
  "Fixture Falls",
];
const countries = ["United States", "Canada", "United Kingdom", "Australia"];

const orderStatuses = [
  "PENDING",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "REFUNDED",
];
const paymentStatuses = ["PAID", "PENDING", "FAILED", "REFUNDED"];
const movementTypes = ["STOCK_IN", "STOCK_OUT", "ADJUSTMENT", "RETURN"];

let seed = 20260608;
function rand() {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 0x100000000;
}

function int(min, max) {
  return Math.floor(rand() * (max - min + 1)) + min;
}

function pick(values) {
  return values[int(0, values.length - 1)];
}

function weightedPick(entries) {
  const total = entries.reduce((sum, entry) => sum + entry.weight, 0);
  let cursor = rand() * total;
  for (const entry of entries) {
    cursor -= entry.weight;
    if (cursor <= 0) return entry.value;
  }
  return entries[entries.length - 1].value;
}

function id(prefix, index) {
  return `${prefix}_${String(index).padStart(3, "0")}`;
}

function money(value) {
  return Number(value).toFixed(2);
}

function isoDate(date) {
  return date.toISOString();
}

function randomDateWithinLastMonths(months = 6) {
  const now = new Date();
  const start = new Date(now);
  start.setMonth(start.getMonth() - months);
  const ts = start.getTime() + rand() * (now.getTime() - start.getTime());
  return new Date(ts);
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  const now = new Date();
  return next > now ? now : next;
}

function csvEscape(value) {
  if (value === null || value === undefined) return "";
  const text = String(value);
  if (/[",\r\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function toCsv(headers, rows) {
  const lines = [headers.join(",")];
  for (const row of rows) {
    lines.push(headers.map((header) => csvEscape(row[header])).join(","));
  }
  return `${lines.join("\n")}\n`;
}

function writeCsv(fileName, headers, rows) {
  const target = path.join(outputDir, fileName);
  writeFileSync(target, toCsv(headers, rows), "utf8");
  return { fileName, count: rows.length };
}

function buildUsers() {
  const roles = ["ADMIN", "MANAGER", "MANAGER", "USER", "USER", "USER", "USER", "USER"];
  return roles.map((role, idx) => {
    const index = idx + 1;
    const createdAt = randomDateWithinLastMonths(6);
    const updatedAt = addDays(createdAt, int(1, 20));
    const label = role.toLowerCase();
    return {
      id: id("user", index),
      email: `${label}.${String(index).padStart(3, "0")}@${domains[idx % domains.length]}`,
      name: `Dashboard ${role} ${String(index).padStart(3, "0")}`,
      passwordHash: PASSWORD_HASH,
      role,
      createdAt: isoDate(createdAt),
      updatedAt: isoDate(updatedAt),
    };
  });
}

function buildCustomers() {
  return Array.from({ length: 100 }, (_, idx) => {
    const index = idx + 1;
    const createdAt = randomDateWithinLastMonths(6);
    const updatedAt = addDays(createdAt, int(1, 30));
    return {
      id: id("cust", index),
      name: `Demo Customer ${String(index).padStart(3, "0")}`,
      email: `customer.${String(index).padStart(3, "0")}@${domains[index % domains.length]}`,
      phone: `+1-555-${String(1000 + index).slice(-4)}`,
      address: `${100 + index} Example Street`,
      city: pick(cities),
      country: pick(countries),
      totalOrders: 0,
      totalSpent: "0.00",
      createdAt: isoDate(createdAt),
      updatedAt: isoDate(updatedAt),
    };
  });
}

function buildProducts() {
  return Array.from({ length: 100 }, (_, idx) => {
    const index = idx + 1;
    const category = categories[idx % categories.length];
    const brand = brands[idx % brands.length];
    const priceValue = int(1500, 25000) / 100;
    const costValue = priceValue * (0.42 + rand() * 0.28);
    const stock = int(0, 250);
    const isDeleted = index % 47 === 0;
    const createdAt = randomDateWithinLastMonths(6);
    const updatedAt = addDays(createdAt, int(1, 45));
    const status = isDeleted
      ? "DRAFT"
      : stock <= 0
      ? "OUT_OF_STOCK"
      : index % 13 === 0
      ? "DRAFT"
      : "ACTIVE";

    return {
      id: id("prod", index),
      name: `${brand} ${category} Model ${String(index).padStart(3, "0")}`,
      sku: `SKU-${String(index).padStart(5, "0")}`,
      description: `Fake ecommerce ${category.toLowerCase()} product for dashboard seed data.`,
      category,
      brand,
      price: money(priceValue),
      costPrice: money(costValue),
      stock,
      status,
      imageUrl: `https://example.com/images/${id("prod", index)}.jpg`,
      isDeleted,
      createdAt: isoDate(createdAt),
      updatedAt: isoDate(updatedAt),
    };
  });
}

function paymentStatusForOrder(status) {
  if (status === "DELIVERED" || status === "SHIPPED") return "PAID";
  if (status === "REFUNDED") return "REFUNDED";
  if (status === "CANCELLED") {
    return weightedPick([
      { value: "REFUNDED", weight: 3 },
      { value: "FAILED", weight: 1 },
      { value: "PENDING", weight: 1 },
    ]);
  }
  if (status === "PENDING") {
    return weightedPick([
      { value: "PENDING", weight: 5 },
      { value: "PAID", weight: 3 },
      { value: "FAILED", weight: 1 },
    ]);
  }
  return weightedPick([
    { value: "PAID", weight: 7 },
    { value: "PENDING", weight: 2 },
    { value: "FAILED", weight: 1 },
  ]);
}

function buildOrdersAndItems(customers, products) {
  const customerStats = new Map(
    customers.map((customer) => [customer.id, { totalOrders: 0, totalSpent: 0 }])
  );
  const orders = [];
  const orderItems = [];
  let itemIndex = 1;

  for (let orderIndex = 1; orderIndex <= 300; orderIndex += 1) {
    const customer = pick(customers);
    const status = weightedPick([
      { value: "PENDING", weight: 8 },
      { value: "PROCESSING", weight: 12 },
      { value: "SHIPPED", weight: 18 },
      { value: "DELIVERED", weight: 45 },
      { value: "CANCELLED", weight: 10 },
      { value: "REFUNDED", weight: 7 },
    ]);
    const paymentStatus = paymentStatusForOrder(status);
    const createdAt = randomDateWithinLastMonths(6);
    const updatedAt = addDays(createdAt, int(0, 14));
    const itemCount = 2 + (rand() < 0.5 ? 1 : 0);
    const orderId = id("order", orderIndex);
    let subtotal = 0;

    const usedProductIds = new Set();
    for (let offset = 0; offset < itemCount; offset += 1) {
      let product = pick(products);
      while (usedProductIds.has(product.id)) {
        product = pick(products);
      }
      usedProductIds.add(product.id);

      const quantity = int(1, 4);
      const unitPrice = Number(product.price);
      const totalPrice = quantity * unitPrice;
      subtotal += totalPrice;

      orderItems.push({
        id: id("item", itemIndex),
        orderId,
        productId: product.id,
        quantity,
        unitPrice: money(unitPrice),
        totalPrice: money(totalPrice),
        createdAt: isoDate(createdAt),
      });
      itemIndex += 1;
    }

    const shippingFee = Number(money(subtotal >= 100 ? 0 : int(499, 1499) / 100));
    const taxAmount = Number(money(subtotal * 0.0825));
    const discountAmount = Number(
      money(rand() < 0.22 ? subtotal * pick([0.05, 0.1, 0.15]) : 0)
    );
    const totalAmount = Number(money(subtotal + shippingFee + taxAmount - discountAmount));

    orders.push({
      id: orderId,
      customerId: customer.id,
      orderNumber: 1000 + orderIndex,
      status,
      paymentStatus,
      totalAmount: money(totalAmount),
      shippingFee: money(shippingFee),
      taxAmount: money(taxAmount),
      discountAmount: money(discountAmount),
      createdAt: isoDate(createdAt),
      updatedAt: isoDate(updatedAt),
    });

    const stats = customerStats.get(customer.id);
    stats.totalOrders += 1;
    if (paymentStatus === "PAID" && !["CANCELLED", "REFUNDED"].includes(status)) {
      stats.totalSpent += totalAmount;
    }
  }

  for (const customer of customers) {
    const stats = customerStats.get(customer.id);
    customer.totalOrders = stats.totalOrders;
    customer.totalSpent = money(stats.totalSpent);
  }

  return { orders, orderItems };
}

function buildInventoryMovements(products) {
  const reasons = {
    STOCK_IN: ["supplier restock", "warehouse transfer", "launch inventory"],
    STOCK_OUT: ["customer order", "bundle allocation", "sample shipment"],
    ADJUSTMENT: ["cycle count correction", "damaged unit adjustment", "manual audit"],
    RETURN: ["customer return", "carrier return", "quality review return"],
  };

  const count = int(300, 500);
  return Array.from({ length: count }, (_, idx) => {
    const type = pick(movementTypes);
    return {
      id: id("inv", idx + 1),
      productId: pick(products).id,
      type,
      quantity: int(1, type === "ADJUSTMENT" ? 20 : 80),
      reason: pick(reasons[type]),
      createdAt: isoDate(randomDateWithinLastMonths(6)),
    };
  });
}

function main() {
  mkdirSync(outputDir, { recursive: true });

  const users = buildUsers();
  const customers = buildCustomers();
  const products = buildProducts();
  const { orders, orderItems } = buildOrdersAndItems(customers, products);
  const inventoryMovements = buildInventoryMovements(products);

  const files = [
    writeCsv(
      "users.csv",
      ["id", "email", "name", "passwordHash", "role", "createdAt", "updatedAt"],
      users
    ),
    writeCsv(
      "customers.csv",
      [
        "id",
        "name",
        "email",
        "phone",
        "address",
        "city",
        "country",
        "totalOrders",
        "totalSpent",
        "createdAt",
        "updatedAt",
      ],
      customers
    ),
    writeCsv(
      "products.csv",
      [
        "id",
        "name",
        "sku",
        "description",
        "category",
        "brand",
        "price",
        "costPrice",
        "stock",
        "status",
        "imageUrl",
        "isDeleted",
        "createdAt",
        "updatedAt",
      ],
      products
    ),
    writeCsv(
      "orders.csv",
      [
        "id",
        "customerId",
        "orderNumber",
        "status",
        "paymentStatus",
        "totalAmount",
        "shippingFee",
        "taxAmount",
        "discountAmount",
        "createdAt",
        "updatedAt",
      ],
      orders
    ),
    writeCsv(
      "order_items.csv",
      ["id", "orderId", "productId", "quantity", "unitPrice", "totalPrice", "createdAt"],
      orderItems
    ),
    writeCsv(
      "inventory_movements.csv",
      ["id", "productId", "type", "quantity", "reason", "createdAt"],
      inventoryMovements
    ),
  ];

  console.log("Created CSV seed files:");
  for (const file of files) {
    console.log(`- ${file.fileName}: ${file.count} rows`);
  }
  console.log(`Output folder: ${outputDir}`);
}

main();
