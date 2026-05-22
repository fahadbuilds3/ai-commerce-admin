import prisma from "../config/prisma.js";

// Helper: Clean incoming payload for Prisma schema compatibility
function buildUpdateProductPayload(payload) {
  // Only allow these fields (update if your schema changes)
  const allowedFields = [
    "name",
    "description",
    "price",
    "stock",
    "sku",
    "category",
    "slug",
    "imageUrl",
  ];
  const clean = {};
  for (const key of allowedFields) {
    // Copy value if present and not undefined
    if (Object.prototype.hasOwnProperty.call(payload, key) && payload[key] !== undefined) {
      clean[key] = payload[key];
    }
  }

  // Remove invalid/legacy keys
  delete clean.productId;
  delete clean.unitPrice;
  delete clean.image; // In case legacy clients send it

  // Numeric conversions - Prisma expects proper types
  if ("price" in clean) clean.price = Number(clean.price);
  if ("stock" in clean) clean.stock = Number(clean.stock);

  // imageUrl is string or undefined (handled at controller)
  // slug, category retained as string

  return clean;
}

export const createProduct = async (data) => {
  const payload = buildUpdateProductPayload(data);
  if (!payload.slug && payload.name) {
    payload.slug = payload.name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }

  return await prisma.product.create({
    data: payload,
  });
};

export const getProducts = async () => {
  return prisma.product.findMany({
    where: {
      isDeleted: false,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};

export const getProductById = async (id) => {
  return await prisma.product.findFirst({
    where: {
      id,
      isDeleted: false,
    },
  });
};

/**
 * Update product - safely updates product by id using clean schema-aligned payload.
 * @param {string|number} id - Product id.
 * @param {object} payload - Partial product fields. Can include imageUrl, numeric fields, category etc.
 * @returns Updated product object.
 * Throws if id is invalid or Prisma throws.
 */
// export const updateProduct = async (id, payload) => {
//   // Validate id
//   if (!id || (typeof id !== "string" && typeof id !== "number")) {
//     throw new Error("Valid product id required for update.");
//   }

//   // Clean and shape payload for Prisma
//   const data = buildUpdateProductPayload(payload);

//   // Debug log
//   console.log("SERVICE UPDATE PAYLOAD:", data);

//   // Safely update and return updated product
//   const updatedProduct = await prisma.product.update({
//     where: { id },
//     data,
//   });
//   return updatedProduct;
// };

export const updateProduct = async (id, payload) => {
  const existing = await prisma.product.findUnique({
    where: { id },
  });

  if (!existing || existing.isDeleted) {
    throw new Error("Product not found");
  }

  return prisma.product.update({
    where: { id },
    data: buildUpdateProductPayload(payload),
  });
};

// export const deleteProduct = async (id) => {
//   // Production note: Remove this log before deploying to production.
//   console.log(`[deleteProduct] Called with id:`, id);

//   // Ensure id is passed as the correct type (string or number depending on Prisma schema)
//   if (!id) {
//     throw new Error("Product id is required for deletion");
//   }

//   prisma.product.update({
//     where: { id },
//     data: {
//       isDeleted: true,
//     },
//   });
// };
export const deleteProduct = async (id) => {
  const existing = await prisma.product.findUnique({
    where: { id },
  });

  if (!existing || existing.isDeleted) {
    return null;
  }

  return prisma.product.update({
    where: { id },
    data: {
      isDeleted: true,
    },
  });
};
