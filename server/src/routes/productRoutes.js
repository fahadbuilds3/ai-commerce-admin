import express from "express";

import authMiddleware from "../middleware/authMiddleware.js";
import authorizeRoles from "../middleware/authorize.js";

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
const requireAdminOrManager = authorizeRoles("ADMIN", "MANAGER");

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
  requireAdminOrManager,
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
  requireAdminOrManager,
  productValidationRules,
  validateProduct,
  updateProduct
);

// DELETE product
router.delete(
  "/:id",
  authMiddleware,
  requireAdminOrManager,
  deleteProduct
);

export default router;
