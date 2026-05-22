import express from "express";
import { Prisma } from "@prisma/client";
import prisma from "../config/prisma.js";

const router = express.Router();

const CUSTOMER_STATUSES = new Set(["ACTIVE", "VIP", "BLOCKED", "INACTIVE"]);

async function ensureCustomerStatusColumn() {
  await prisma.$executeRaw`
    ALTER TABLE "users"
    ADD COLUMN IF NOT EXISTS "customerStatus" TEXT NOT NULL DEFAULT 'ACTIVE'
  `;
}

function formatOrder(order) {
  return {
    id: order?.id,
    orderNumber: order?.orderNumber,
    status: order?.status,
    paymentStatus: order?.paymentStatus,
    total: Number(order?.totalAmount || 0),
    createdAt: order?.createdAt,
  };
}

function formatCustomer(user, status = "ACTIVE") {
  const orders = Array.isArray(user?.orders) ? user.orders : [];
  const totalSpent = orders.reduce(
    (sum, order) => sum + Number(order?.totalAmount || 0),
    0
  );

  return {
    id: user?.id,
    name: user?.name || "Unknown customer",
    email: user?.email || "No email",
    status: CUSTOMER_STATUSES.has(status) ? status : "ACTIVE",
    createdAt: user?.createdAt,
    updatedAt: user?.updatedAt,
    ordersCount: orders.length,
    totalSpent,
    recentOrders: orders
      .slice()
      .sort((a, b) => new Date(b?.createdAt || 0) - new Date(a?.createdAt || 0))
      .slice(0, 5)
      .map(formatOrder),
  };
}

async function readStatusesByUserId(userIds) {
  if (!Array.isArray(userIds) || userIds.length === 0) return new Map();

  try {
    await ensureCustomerStatusColumn();
    const rows = await prisma.$queryRaw`
      SELECT id, "customerStatus"
      FROM "users"
      WHERE id IN (${Prisma.join(userIds)})
    `;

    return new Map(
      rows.map((row) => [
        row.id,
        CUSTOMER_STATUSES.has(row.customerStatus) ? row.customerStatus : "ACTIVE",
      ])
    );
  } catch (err) {
    console.error("READ CUSTOMER STATUSES ERROR:", err);
    return new Map();
  }
}

router.get("/", async (_req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        updatedAt: true,
        orders: {
          select: {
            id: true,
            orderNumber: true,
            status: true,
            paymentStatus: true,
            totalAmount: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const statuses = await readStatusesByUserId(users.map((user) => user.id));
    const customers = users.map((user) =>
      formatCustomer(user, statuses.get(user.id) || "ACTIVE")
    );

    return res.status(200).json({ customers, totalCount: customers.length });
  } catch (err) {
    console.error("GET CUSTOMERS ERROR:", err);
    return res.status(500).json({ error: "Failed to fetch customers." });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: {
        id: req.params.id,
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        updatedAt: true,
        orders: {
          select: {
            id: true,
            orderNumber: true,
            status: true,
            paymentStatus: true,
            totalAmount: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ error: "Customer not found." });
    }

    const statuses = await readStatusesByUserId([user.id]);
    return res.status(200).json(formatCustomer(user, statuses.get(user.id)));
  } catch (err) {
    console.error("GET CUSTOMER ERROR:", err);
    return res.status(500).json({ error: "Failed to fetch customer." });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const status = String(req.body?.status || "").toUpperCase();

    if (!CUSTOMER_STATUSES.has(status)) {
      return res.status(400).json({ error: "Invalid customer status." });
    }

    await ensureCustomerStatusColumn();

    const updated = await prisma.$executeRaw`
      UPDATE "users"
      SET "customerStatus" = ${status}, "updatedAt" = NOW()
      WHERE id = ${req.params.id}
    `;

    if (Number(updated) === 0) {
      return res.status(404).json({ error: "Customer not found." });
    }

    const user = await prisma.user.findUnique({
      where: {
        id: req.params.id,
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        updatedAt: true,
        orders: {
          select: {
            id: true,
            orderNumber: true,
            status: true,
            paymentStatus: true,
            totalAmount: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    return res.status(200).json(formatCustomer(user, status));
  } catch (err) {
    console.error("UPDATE CUSTOMER ERROR:", err);
    return res.status(500).json({ error: "Failed to update customer." });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: {
        id: req.params.id,
      },
      select: {
        id: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: "Customer not found." });
    }

    await prisma.$transaction(async (tx) => {
      const orders = await tx.order.findMany({
        where: {
          userId: req.params.id,
        },
        select: {
          id: true,
        },
      });
      const orderIds = orders.map((order) => order.id);

      if (orderIds.length > 0) {
        await tx.orderItem.deleteMany({
          where: {
            orderId: {
              in: orderIds,
            },
          },
        });
      }

      await tx.order.deleteMany({
        where: {
          userId: req.params.id,
        },
      });

      await tx.user.delete({
        where: {
          id: req.params.id,
        },
      });
    });

    return res.status(204).end();
  } catch (err) {
    console.error("DELETE CUSTOMER ERROR:", err);
    return res.status(500).json({ error: "Failed to delete customer." });
  }
});

export default router;
