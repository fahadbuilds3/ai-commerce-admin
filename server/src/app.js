import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";

import authRoutes from "./routes/authRoutes.js";

import errorMiddleware from "./middleware/errorMiddleware.js";

const app = express();

app.use(cors());

app.use(express.json());

app.use(helmet());

app.use(compression());

if (
  process.env.NODE_ENV ===
  "development"
) {
  app.use(morgan("dev"));
}

app.get("/", (req, res) => {
  res.json({
    success: true,
    message:
      "AI Commerce Admin API Running",
  });
});

app.use("/api/auth", authRoutes);

app.use(errorMiddleware);

export default app;