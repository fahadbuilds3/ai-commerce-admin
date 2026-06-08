import { existsSync, readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import prisma from "../src/config/prisma.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const seedDataDir = path.resolve(__dirname, "seed-data");

const files = {
  users: "users.csv",
  customers: "customers.csv",
  products: "products.csv",
  orders: "orders.csv",
  orderItems: "order_items.csv",
  inventoryMovements: "inventory_movements.csv",
};

const orderStatuses = new Set([
  "PENDING",
  "PROCESSING",
  "PAID",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "REFUNDED",
]);
const paymentStatuses = new Set(["PENDING", "PAID", "REFUNDED", "FAILED"]);
const productStatuses = new Set(["ACTIVE", "DRAFT", "OUT_OF_STOCK"]);
const userRoles = new Set(["USER", "ADMIN", "MANAGER"]);

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (char === '"' && next === '"') {
        field += '"';
        i += 1;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (char !== "\r") {
      field += char;
    }
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  const nonEmptyRows = rows.filter((items) => items.some((value) => value.trim() !== ""));
  if (nonEmptyRows.length === 0) return [];

  const headers = nonEmptyRows[0].map((header) => header.trim());
  return nonEmptyRows.slice(1).map((items) => {
    const record = {};
    headers.forEach((header, index) => {
      record[header] = items[index] ?? "";
    });
    return record;
  });
}

function readRequiredCsv(fileName) {
  const filePath = path.join(seedDataDir, fileName);
  if (!existsSync(filePath)) {
    throw new Error(`Required CSV file missing: ${filePath}`);
  }
  return parseCsv(readFileSync(filePath, "utf8"));
}

function readOptionalCsv(fileName) {
  const filePath = path.join(seedDataDir, fileName);
  if (!existsSync(filePath)) return [];
  return parseCsv(readFileSync(filePath, "utf8"));
}

function required(value, label) {
  const text = String(value ?? "").trim();
  if (!text) throw new Error(`Missing required value: ${label}`);
  return text;
}

function nullable(value) {
  const text = String(value ?? "").trim();
  return text ? text : null;
}

function toInt(value, label) {
  const number = Number(value);
  if (!Number.isInteger(number)) throw new Error(`Invalid integer for ${label}: ${value}`);
  return number;
}

function toNumber(value, label) {
  const number = Number(value);
  if (!Number.isFinite(number)) throw new Error(`Invalid number for ${label}: ${value}`);
  return number;
}

function toBoolean(value) {
  const text = String(value ?? "").trim().toLowerCase();
  return text === "true" || text === "1" || text === "yes";
}

function toDate(value, label) {
  const date = new Date(required(value, label));
  if (Number.isNaN(date.getTime())) throw new Error(`Invalid date for ${label}: ${value}`);
  return date;
}

function slugify(value, fallback) {
  const slug = String(value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || fallback;
}

function assertEnum(value, allowed, label) {
  const normalized = required(value, label).toUpperCase();
  if (!allowed.has(normalized)) {
    throw new Error(`Invalid ${label}: ${value}`);
  }
  return normalized;
}

function indexById(rows, label) {
  const map = new Map();
  for (const row of rows) {
    const id = required(row.id, `${label}.id`);
    if (map.has(id)) throw new Error(`Duplicate id in ${label}: ${id}`);
    map.set(id, row);
  }
  return map;
}

function validateRelations({ customersById, productsById, ordersById, orders, orderItems, inventoryMovements }) {
  for (const order of orders) {
    const customerId = required(order.customerId, `orders.${order.id}.customerId`);
    if (!customersById.has(customerId)) {
      throw new Error(`Order ${order.id} references missing customerId ${customerId}`);
    }
  }

  for (const item of orderItems) {
    const orderId = required(item.orderId, `order_items.${item.id}.orderId`);
    const productId = required(item.productId, `order_items.${item.id}.productId`);
    if (!ordersById.has(orderId)) {
      throw new Error(`Order item ${item.id} references missing orderId ${orderId}`);
    }
    if (!productsById.has(productId)) {
      throw new Error(`Order item ${item.id} references missing productId ${productId}`);
    }
  }

  for (const movement of inventoryMovements) {
    const productId = required(movement.productId, `inventory_movements.${movement.id}.productId`);
    if (!productsById.has(productId)) {
      throw new Error(`Inventory movement ${movement.id} references missing productId ${productId}`);
    }
  }
}

async function importUsers(rows) {
  let count = 0;
  for (const row of rows) {
    const id = required(row.id, "users.id");
    await prisma.user.upsert({
      where: { id },
      create: {
        id,
        email: required(row.email, `users.${id}.email`),
        name: required(row.name, `users.${id}.name`),
        password: required(row.passwordHash, `users.${id}.passwordHash`),
        role: assertEnum(row.role, userRoles, `users.${id}.role`),
        createdAt: toDate(row.createdAt, `users.${id}.createdAt`),
        updatedAt: toDate(row.updatedAt, `users.${id}.updatedAt`),
      },
      update: {
        email: required(row.email, `users.${id}.email`),
        name: required(row.name, `users.${id}.name`),
        password: required(row.passwordHash, `users.${id}.passwordHash`),
        role: assertEnum(row.role, userRoles, `users.${id}.role`),
        updatedAt: toDate(row.updatedAt, `users.${id}.updatedAt`),
      },
    });
    count += 1;
  }
  return count;
}

async function importCustomers(rows) {
  let count = 0;
  for (const row of rows) {
    const id = required(row.id, "customers.id");
    await prisma.customer.upsert({
      where: { id },
      create: {
        id,
        name: required(row.name, `customers.${id}.name`),
        email: required(row.email, `customers.${id}.email`),
        status: nullable(row.status) ?? "ACTIVE",
        createdAt: toDate(row.createdAt, `customers.${id}.createdAt`),
        updatedAt: toDate(row.updatedAt, `customers.${id}.updatedAt`),
      },
      update: {
        name: required(row.name, `customers.${id}.name`),
        email: required(row.email, `customers.${id}.email`),
        status: nullable(row.status) ?? "ACTIVE",
        updatedAt: toDate(row.updatedAt, `customers.${id}.updatedAt`),
      },
    });
    count += 1;
  }
  return count;
}

async function importProducts(rows) {
  let count = 0;
  for (const row of rows) {
    const id = required(row.id, "products.id");
    const name = required(row.name, `products.${id}.name`);
    await prisma.product.upsert({
      where: { id },
      create: {
        id,
        name,
        slug: slugify(name, id),
        description: nullable(row.description),
        price: toNumber(row.price, `products.${id}.price`),
        stock: toInt(row.stock, `products.${id}.stock`),
        sku: required(row.sku, `products.${id}.sku`),
        category: required(row.category, `products.${id}.category`),
        status: assertEnum(row.status, productStatuses, `products.${id}.status`),
        imageUrl: nullable(row.imageUrl),
        isDeleted: toBoolean(row.isDeleted),
        createdAt: toDate(row.createdAt, `products.${id}.createdAt`),
        updatedAt: toDate(row.updatedAt, `products.${id}.updatedAt`),
      },
      update: {
        name,
        slug: slugify(name, id),
        description: nullable(row.description),
        price: toNumber(row.price, `products.${id}.price`),
        stock: toInt(row.stock, `products.${id}.stock`),
        sku: required(row.sku, `products.${id}.sku`),
        category: required(row.category, `products.${id}.category`),
        status: assertEnum(row.status, productStatuses, `products.${id}.status`),
        imageUrl: nullable(row.imageUrl),
        isDeleted: toBoolean(row.isDeleted),
        updatedAt: toDate(row.updatedAt, `products.${id}.updatedAt`),
      },
    });
    count += 1;
  }
  return count;
}

async function importOrders(rows, customersById) {
  let count = 0;
  for (const row of rows) {
    const id = required(row.id, "orders.id");
    const customer = customersById.get(required(row.customerId, `orders.${id}.customerId`));
    await prisma.order.upsert({
      where: { id },
      create: {
        id,
        customerId: required(row.customerId, `orders.${id}.customerId`),
        orderNumber: toInt(row.orderNumber, `orders.${id}.orderNumber`),
        status: assertEnum(row.status, orderStatuses, `orders.${id}.status`),
        paymentStatus: assertEnum(row.paymentStatus, paymentStatuses, `orders.${id}.paymentStatus`),
        totalAmount: toNumber(row.totalAmount, `orders.${id}.totalAmount`),
        shippingAddress: {
          name: customer?.name ?? "Unknown customer",
          email: customer?.email ?? null,
          phone: nullable(customer?.phone),
          address: nullable(customer?.address),
          city: nullable(customer?.city),
          country: nullable(customer?.country),
        },
        createdAt: toDate(row.createdAt, `orders.${id}.createdAt`),
        updatedAt: toDate(row.updatedAt, `orders.${id}.updatedAt`),
      },
      update: {
        customerId: required(row.customerId, `orders.${id}.customerId`),
        orderNumber: toInt(row.orderNumber, `orders.${id}.orderNumber`),
        status: assertEnum(row.status, orderStatuses, `orders.${id}.status`),
        paymentStatus: assertEnum(row.paymentStatus, paymentStatuses, `orders.${id}.paymentStatus`),
        totalAmount: toNumber(row.totalAmount, `orders.${id}.totalAmount`),
        shippingAddress: {
          name: customer?.name ?? "Unknown customer",
          email: customer?.email ?? null,
          phone: nullable(customer?.phone),
          address: nullable(customer?.address),
          city: nullable(customer?.city),
          country: nullable(customer?.country),
        },
        updatedAt: toDate(row.updatedAt, `orders.${id}.updatedAt`),
      },
    });
    count += 1;
  }
  return count;
}

async function importOrderItems(rows, productsById) {
  let count = 0;
  for (const row of rows) {
    const id = required(row.id, "order_items.id");
    const product = productsById.get(required(row.productId, `order_items.${id}.productId`));
    await prisma.orderItem.upsert({
      where: { id },
      create: {
        id,
        orderId: required(row.orderId, `order_items.${id}.orderId`),
        productId: required(row.productId, `order_items.${id}.productId`),
        quantity: toInt(row.quantity, `order_items.${id}.quantity`),
        unitPrice: toNumber(row.unitPrice, `order_items.${id}.unitPrice`),
        productSnapshot: {
          id: product?.id,
          name: product?.name,
          sku: product?.sku,
          category: product?.category,
          price: toNumber(row.unitPrice, `order_items.${id}.unitPrice`),
        },
        createdAt: toDate(row.createdAt, `order_items.${id}.createdAt`),
      },
      update: {
        orderId: required(row.orderId, `order_items.${id}.orderId`),
        productId: required(row.productId, `order_items.${id}.productId`),
        quantity: toInt(row.quantity, `order_items.${id}.quantity`),
        unitPrice: toNumber(row.unitPrice, `order_items.${id}.unitPrice`),
        productSnapshot: {
          id: product?.id,
          name: product?.name,
          sku: product?.sku,
          category: product?.category,
          price: toNumber(row.unitPrice, `order_items.${id}.unitPrice`),
        },
      },
    });
    count += 1;
  }
  return count;
}

async function importInventoryMovements(rows) {
  if (!("inventoryMovement" in prisma)) {
    return {
      count: 0,
      skipped: rows.length,
      reason: "InventoryMovement model is not present in schema.prisma",
    };
  }

  let count = 0;
  for (const row of rows) {
    const id = required(row.id, "inventory_movements.id");
    await prisma.inventoryMovement.upsert({
      where: { id },
      create: {
        id,
        productId: required(row.productId, `inventory_movements.${id}.productId`),
        type: required(row.type, `inventory_movements.${id}.type`),
        quantity: toInt(row.quantity, `inventory_movements.${id}.quantity`),
        reason: nullable(row.reason),
        createdAt: toDate(row.createdAt, `inventory_movements.${id}.createdAt`),
      },
      update: {
        productId: required(row.productId, `inventory_movements.${id}.productId`),
        type: required(row.type, `inventory_movements.${id}.type`),
        quantity: toInt(row.quantity, `inventory_movements.${id}.quantity`),
        reason: nullable(row.reason),
      },
    });
    count += 1;
  }

  return { count, skipped: 0, reason: null };
}

async function main() {
  const users = readRequiredCsv(files.users);
  const customers = readRequiredCsv(files.customers);
  const products = readRequiredCsv(files.products);
  const orders = readRequiredCsv(files.orders);
  const orderItems = readRequiredCsv(files.orderItems);
  const inventoryMovements = readOptionalCsv(files.inventoryMovements);

  const customersById = indexById(customers, "customers");
  const productsById = indexById(products, "products");
  const ordersById = indexById(orders, "orders");

  validateRelations({
    customersById,
    productsById,
    ordersById,
    orders,
    orderItems,
    inventoryMovements,
  });

  console.log(`Reading CSV seed data from: ${seedDataDir}`);

  const usersCount = await importUsers(users);
  const customersCount = await importCustomers(customers);
  const productsCount = await importProducts(products);
  const ordersCount = await importOrders(orders, customersById);
  const orderItemsCount = await importOrderItems(orderItems, productsById);
  const inventoryResult = await importInventoryMovements(inventoryMovements);

  console.log("CSV import complete:");
  console.log(`- imported users count: ${usersCount}`);
  console.log(`- imported customers count: ${customersCount}`);
  console.log(`- imported products count: ${productsCount}`);
  console.log(`- imported orders count: ${ordersCount}`);
  console.log(`- imported order items count: ${orderItemsCount}`);
  console.log(`- imported inventory movements count: ${inventoryResult.count}`);
  if (inventoryResult.skipped > 0) {
    console.log(
      `- skipped inventory movements: ${inventoryResult.skipped} (${inventoryResult.reason})`
    );
  }

  console.log("Schema mapping notes:");
  console.log("- customers.csv phone/address/city/country are used for order shippingAddress only.");
  console.log("- customers.csv totalOrders/totalSpent are generated aggregates, not stored on Customer.");
  console.log("- products.csv brand/costPrice are not present on Product and are ignored.");
  console.log("- orders.csv shippingFee/taxAmount/discountAmount are not present on Order and are ignored.");
  console.log("- Product.slug is required by schema and is derived from product name.");
  console.log("- Order.shippingAddress is required by schema and is derived from customer CSV fields.");
  console.log("- OrderItem.productSnapshot is required by schema and is derived from product CSV fields.");
}

main()
  .catch((error) => {
    console.error("CSV import failed:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
