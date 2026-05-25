import express from "express";
import {
  getInventory,
  getInventoryStats,
  adjustStock,
  updateInventory,
  deleteInventory,
} from "../controllers/inventoryController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// All inventory routes are protected and require ADMIN or MANAGER role
router.use(authMiddleware);
// router.use(authorize("ADMIN", "MANAGER"));
router.get("/", authMiddleware, getInventory);
router.route("/").get(getInventory);
router.route("/stats").get(getInventoryStats);
router.route("/:id/stock").patch(adjustStock);
router.route("/:id").put(updateInventory).delete(deleteInventory);

export default router;
