import prisma from "../config/prisma.js";

export const createProduct = async (data) => {
  return await prisma.product.create({
    data,
  });
};

export const getProducts = async () => {
  return await prisma.product.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });
};

export const getProductById = async (id) => {
  return await prisma.product.findUnique({
    where: { id },
  });
};

export const updateProduct = async (id, data) => {
  return await prisma.product.update({
    where: { id },
    data,
  });
};

export const deleteProduct = async (id) => {
  // Production note: Remove this log before deploying to production.
  console.log(`[deleteProduct] Called with id:`, id);

  // Ensure id is passed as the correct type (string or number depending on Prisma schema)
  if (!id) {
    throw new Error("Product id is required for deletion");
  }

  return await prisma.product.delete({
    where: { id },
  });
};