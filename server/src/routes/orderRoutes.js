import express from "express";
import { PrismaClient } from "@prisma/client";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/orders - Get all orders
router.get(
  "/",
  authMiddleware,
  async (req, res, next) => {
    try {
      const orders = await prisma.order.findMany({
        include: {
          user: true,
          orderItems: true,
        },
        orderBy: { createdAt: "desc" },
      });
      res.json(orders);
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/orders/:id - Get a single order by ID
router.get(
  "/:id",
  authMiddleware,
  async (req, res, next) => {
    try {
      const order = await prisma.order.findUnique({
        where: { id: Number(req.params.id) },
        include: {
          user: true,
          orderItems: true,
        },
      });

      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      res.json(order);
    } catch (error) {
      next(error);
    }
  }
);

// PATCH /api/orders/:id/status - Update order status
router.patch(
  "/:id/status",
  authMiddleware,
  async (req, res, next) => {
    try {
      const { status } = req.body;
      if (!status) {
        return res.status(400).json({ error: "Status is required" });
      }

      const updatedOrder = await prisma.order.update({
        where: { id: Number(req.params.id) },
        data: { status },
      });

      res.json(updatedOrder);
    } catch (error) {
      if (error.code === "P2025") {
        // Prisma: Record not found
        return res.status(404).json({ error: "Order not found" });
      }
      next(error);
    }
  }
);

// DELETE /api/orders/:id - Delete order by ID
router.delete(
  "/:id",
  authMiddleware,
  async (req, res, next) => {
    try {
      await prisma.order.delete({
        where: { id: Number(req.params.id) },
      });
      res.status(204).end();
    } catch (error) {
      if (error.code === "P2025") {
        return res.status(404).json({ error: "Order not found" });
      }
      next(error);
    }
  }
);

export default router;