import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import rateLimit from "express-rate-limit";

import authRoutes from "./routes/authRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import customerRoutes from "./routes/customerRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";
import inventoryRoutes from "./routes/inventoryRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";
import errorMiddleware from "./middleware/errorMiddleware.js";


const app = express();

const isProduction = process.env.NODE_ENV === "production";

const devOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
];

const corsOptions = {
  origin: isProduction ? process.env.CLIENT_URL || false : devOrigins,
  credentials: true,
};

const rateLimitHandler = (req, res) => {
  res.status(429).json({
    message: "Too many requests",
  });
};

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});

const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});

const uploadLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});

// Core middlewares for SaaS production readiness
app.use(cors(corsOptions));
app.use(helmet());
app.use(compression());
app.use(express.json());

// HTTP request logging (development only)
if (!isProduction) {
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
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);
app.use("/api/upload", uploadLimiter);
app.use("/api/ai", aiLimiter);
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/ai", aiRoutes);


// Global, centralized error handling
app.use(errorMiddleware);

export default app;
