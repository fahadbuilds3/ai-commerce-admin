import express from "express";
import { PrismaClient } from "@prisma/client";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();
const prisma = new PrismaClient();



router.get(
  "/",
  // authMiddleware,
  async (req, res) => {
    try {
      const orders = await prisma.order.findMany({
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          orderItems: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  price: true,
                  imageUrl: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      const formattedOrders = orders.map((order) => {
        const subtotal = Array.isArray(order.orderItems)
          ? order.orderItems.reduce(
              (sum, item) =>
                sum + Number(item.unitPrice) * item.quantity,
              0
            )
          : 0;

        return {
          ...order,
          subtotal,
          total: Number(order.totalAmount || subtotal),
        };
      });

      return res.status(200).json(formattedOrders);

    } catch (err) {
      console.error("GET ORDERS ERROR:", err);

      return res.status(500).json({
        error: "Failed to fetch orders.",
        details: err.message,
      });
    }
  }
);

export default router;