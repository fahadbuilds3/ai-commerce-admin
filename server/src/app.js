import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";

import authRoutes from "./routes/authRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import customerRoutes from "./routes/customerRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";
import inventoryRoutes from "./routes/inventoryRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";
import errorMiddleware from "./middleware/errorMiddleware.js";


const app = express();

// Core middlewares for SaaS production readiness
app.use(cors());
app.use(helmet());
app.use(compression());
app.use(express.json());

// HTTP request logging (development only)
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Healthy",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// Friendly root endpoint
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "AI Commerce Admin API Running",
  });
});

// API routes (modular, production-ready structure)
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/ai", aiRoutes);


// Global, centralized error handling
app.use(errorMiddleware);

export default app;
