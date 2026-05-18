import asyncHandler from "express-async-handler";

import {
  createProduct as createProductService,
  getProducts as getProductsService,
  getProductById as getProductByIdService,
  updateProduct as updateProductService,
  deleteProduct as deleteProductService,
} from "../services/productService.js";

import ApiError from "../utils/ApiError.js";

export const createProduct =
  asyncHandler(async (req, res, next) => {
    try {
      const product =
        await createProductService(
          req.body
        );

      res.status(201).json({
        success: true,
        product,
        message:
          "Product created successfully",
      });
    } catch (err) {
      next(
        new ApiError(
          400,
          err.message ||
            "Failed to create product"
        )
      );
    }
  });

export const getProducts =
  asyncHandler(async (req, res, next) => {
    try {
      const products =
        await getProductsService();

      res.status(200).json({
        success: true,
        products,
      });
    } catch (err) {
      next(
        new ApiError(
          500,
          err.message ||
            "Failed to fetch products"
        )
      );
    }
  });

export const getProductById =
  asyncHandler(async (req, res, next) => {
    try {
      const product =
        await getProductByIdService(
          req.params.id
        );

      if (!product) {
        return next(
          new ApiError(
            404,
            "Product not found"
          )
        );
      }

      res.status(200).json({
        success: true,
        product,
      });
    } catch (err) {
      next(
        new ApiError(
          500,
          err.message ||
            "Failed to fetch product"
        )
      );
    }
  });

export const updateProduct =
  asyncHandler(async (req, res, next) => {
    try {
      const product =
        await updateProductService(
          req.params.id,
          req.body
        );

      res.status(200).json({
        success: true,
        product,
      });
    } catch (err) {
      next(
        new ApiError(
          400,
          err.message ||
            "Failed to update product"
        )
      );
    }
  });

export const deleteProduct =
  asyncHandler(async (req, res, next) => {
    try {
      await deleteProductService(
        req.params.id
      );

      res.status(200).json({
        success: true,
        message:
          "Product deleted successfully",
      });
    } catch (err) {
      next(
        new ApiError(
          400,
          err.message ||
            "Failed to delete product"
        )
      );
    }
  });