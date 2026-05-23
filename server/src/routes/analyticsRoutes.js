import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import {
  getOverview,
  getRevenue,
  getOrders,
  getCustomers,
  getTopProducts
} from "../controllers/analyticsController.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/overview", getOverview);
router.get("/revenue", getRevenue);
router.get("/orders", getOrders);
router.get("/customers", getCustomers);
router.get("/top-products", getTopProducts);

// Deprecated or redirect old /dashboard?
import { getDashboardAnalytics } from "../controllers/analyticsController.js";
router.get("/dashboard", getDashboardAnalytics);

export default router;
