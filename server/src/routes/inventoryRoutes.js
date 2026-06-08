import express from "express";
import {
  getInventory,
  getInventoryStats,
  adjustStock,
  updateInventory,
  deleteInventory,
} from "../controllers/inventoryController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import authorizeRoles from "../middleware/authorize.js";

const router = express.Router();
const requireAdminOrManager = authorizeRoles("ADMIN", "MANAGER");

// All inventory routes require authentication.
router.use(authMiddleware);
router.get("/", authMiddleware, getInventory);
router.route("/").get(getInventory);
router.route("/stats").get(getInventoryStats);
router.route("/:id/stock").patch(requireAdminOrManager, adjustStock);
router
  .route("/:id")
  .put(requireAdminOrManager, updateInventory)
  .delete(requireAdminOrManager, deleteInventory);

export default router;
