import asyncHandler from "express-async-handler";

import {
  createProduct as createProductService,
  getProducts as getProductsService,
  getProductById as getProductByIdService,
  updateProduct as updateProductService,
  deleteProduct as deleteProductService,
} from "../services/productService.js";

import ApiError from "../utils/ApiError.js";

// CREATE PRODUCT CONTROLLER
export const createProduct = asyncHandler(async (req, res, next) => {
  try {
    const product = await createProductService(req.body);

    res.status(201).json({
      success: true,
      product,
      message: "Product created successfully",
    });
  } catch (err) {
    next(
      new ApiError(400, err.message || "Failed to create product")
    );
  }
});

// GET ALL PRODUCTS CONTROLLER
export const getProducts = asyncHandler(async (req, res, next) => {
  try {
    const products = await getProductsService();

    res.status(200).json({
      success: true,
      products,
    });
  } catch (err) {
    next(
      new ApiError(500, err.message || "Failed to fetch products")
    );
  }
});

// GET PRODUCT BY ID CONTROLLER
export const getProductById = asyncHandler(async (req, res, next) => {
  try {
    const product = await getProductByIdService(req.params.id);

    if (!product) {
      return next(
        new ApiError(404, "Product not found")
      );
    }

    res.status(200).json({
      success: true,
      product,
    });
  } catch (err) {
    next(
      new ApiError(500, err.message || "Failed to fetch product")
    );
  }
});

// UPDATE PRODUCT CONTROLLER
export const updateProduct = asyncHandler(async (req, res, next) => {
  try {
    const product = await updateProductService(
      req.params.id,
      req.body
    );

    res.status(200).json({
      success: true,
      product,
    });
  } catch (err) {
    next(
      new ApiError(400, err.message || "Failed to update product")
    );
  }
});

// DELETE PRODUCT CONTROLLER (DEBUGGED & PRODUCTION-READY)
export const deleteProduct = asyncHandler(async (req, res, next) => {
  try {
    const { id } = req.params;

    // Temporary logging for debugging
    console.log(`[DELETE PRODUCT] Received id:`, id);

    // Check if id is present and a string/number
    if (!id) {
      return next(new ApiError(400, "Product id parameter is required"));
    }

    // Optionally: validate UUID/format if needed for DB

    // Delete operation through service, expect service to throw if not found
    const result = await deleteProductService(id);

    // If service returns some indicator for not-found
    if (result === null || result === undefined) {
      return next(new ApiError(404, "Product not found or already deleted"));
    }

    res.status(200).json({
      success: true,
      message: "Product deleted successfully",
      id,
    });
  } catch (err) {
    // Prisma "not found" error code handling
    if (
      err.code === "P2025" ||
      err.message?.includes?.("Record to delete does not exist")
    ) {
      return next(new ApiError(404, "Product not found"));
    }
    // General Prisma error
    if (err.name === "PrismaClientKnownRequestError") {
      return next(
        new ApiError(400, "Failed to delete product (Prisma error): " + err.message)
      );
    }
    next(
      new ApiError(400, err.message || "Failed to delete product")
    );
  }
});