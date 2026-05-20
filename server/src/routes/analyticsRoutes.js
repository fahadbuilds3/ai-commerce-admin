import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { getDashboardAnalytics } from "../controllers/analyticsController.js";

const router = express.Router();

router.get("/dashboard", authMiddleware, getDashboardAnalytics);

export default router;
