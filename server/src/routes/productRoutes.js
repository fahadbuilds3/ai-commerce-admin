import express from "express";

import authMiddleware from "../middleware/authMiddleware.js";

import {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
} from "../controllers/productController.js";

import {
  productValidationRules,
  validateProduct,
} from "../validations/productValidation.js";

const router = express.Router();

// GET all products
router.get(
  "/",
  authMiddleware,
  getProducts
);

// CREATE product
router.post(
  "/",
  authMiddleware,
  productValidationRules,
  validateProduct,
  createProduct
);

// GET single product
router.get(
  "/:id",
  authMiddleware,
  getProductById
);

// UPDATE product
router.put(
  "/:id",
  authMiddleware,
  productValidationRules,
  validateProduct,
  updateProduct
);

// DELETE product
router.delete(
  "/:id",
  authMiddleware,
  deleteProduct
);

export default router;