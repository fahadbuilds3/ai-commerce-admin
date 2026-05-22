import express from "express";
import { PrismaClient } from "@prisma/client";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();
const prisma = new PrismaClient();

const ADMIN_ORDER_STATUSES = new Set([
  "PENDING",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
]);

const orderInclude = {
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
          sku: true,
        },
      },
    },
  },
};

function formatOrder(order) {
  const subtotal = Array.isArray(order?.orderItems)
    ? order.orderItems.reduce(
        (sum, item) => sum + Number(item.unitPrice) * Number(item.quantity),
        0
      )
    : 0;

  return {
    ...order,
    subtotal,
    total: Number(order?.totalAmount || subtotal),
  };
}

router.get(
  "/",
  // authMiddleware,
  async (req, res) => {
    try {
      const orders = await prisma.order.findMany({
        include: orderInclude,
        orderBy: {
          createdAt: "desc",
        },
      });

      const formattedOrders = orders.map(formatOrder);

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

router.put("/:id", async (req, res) => {
  try {
    const status = String(req.body?.status || "").toUpperCase();

    if (!status) {
      return res.status(400).json({
        error: "Status is required",
      });
    }

    if (!ADMIN_ORDER_STATUSES.has(status)) {
      return res.status(400).json({
        error: "Invalid order status",
      });
    }

    const updatedOrder = await prisma.order.update({
      where: {
        id: req.params.id,
      },
      data: {
        status,
      },
      include: orderInclude,
    });

    return res.status(200).json(formatOrder(updatedOrder));

  } catch (err) {
    console.error("UPDATE ORDER ERROR:", err);

    if (err?.code === "P2025") {
      return res.status(404).json({
        error: "Order not found",
      });
    }

    return res.status(500).json({
      error: "Failed to update order status",
    });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    await prisma.$transaction([
      prisma.orderItem.deleteMany({
        where: {
          orderId: req.params.id,
        },
      }),
      prisma.order.delete({
        where: {
          id: req.params.id,
        },
      }),
    ]);

    return res.status(204).end();

  } catch (err) {
    console.error("DELETE ORDER ERROR:", err);

    if (err?.code === "P2025") {
      return res.status(404).json({
        error: "Order not found",
      });
    }

    return res.status(500).json({
      error: "Failed to delete order",
    });
  }
});

export default router;
