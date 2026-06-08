import express from "express";
import prisma from "../config/prisma.js";
import authMiddleware from "../middleware/authMiddleware.js";
import authorizeRoles from "../middleware/authorize.js";

const router = express.Router();
router.use(authMiddleware);
router.use(authorizeRoles("ADMIN", "MANAGER"));

const CUSTOMER_STATUSES = new Set(["ACTIVE", "VIP", "BLOCKED", "INACTIVE"]);

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

function formatCustomer(customer, status = customer?.status || "ACTIVE") {
  const orders = Array.isArray(customer?.orders) ? customer.orders : [];
  const totalSpent = orders.reduce(
    (sum, order) => sum + Number(order?.totalAmount || 0),
    0
  );

  return {
    id: customer?.id,
    name: customer?.name || "Unknown customer",
    email: customer?.email || "No email",
    status: CUSTOMER_STATUSES.has(status) ? status : "ACTIVE",
    createdAt: customer?.createdAt,
    updatedAt: customer?.updatedAt,
    ordersCount: orders.length,
    totalSpent,
    recentOrders: orders
      .slice()
      .sort((a, b) => new Date(b?.createdAt || 0) - new Date(a?.createdAt || 0))
      .slice(0, 5)
      .map(formatOrder),
  };
}

router.get("/", async (_req, res) => {
  try {
    const customers = await prisma.customer.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
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

    const payload = customers.map((customer) => formatCustomer(customer));

    return res.status(200).json({ customers: payload, totalCount: payload.length });
  } catch (err) {
    console.error("GET CUSTOMERS ERROR:", err);
    return res.status(500).json({ error: "Failed to fetch customers." });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const customer = await prisma.customer.findUnique({
      where: {
        id: req.params.id,
      },
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
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

    if (!customer) {
      return res.status(404).json({ error: "Customer not found." });
    }

    return res.status(200).json(formatCustomer(customer));
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

    const customer = await prisma.customer.update({
      where: {
        id: req.params.id,
      },
      data: {
        status,
      },
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
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

    return res.status(200).json(formatCustomer(customer));
  } catch (err) {
    if (err?.code === "P2025") {
      return res.status(404).json({ error: "Customer not found." });
    }

    console.error("UPDATE CUSTOMER ERROR:", err);
    return res.status(500).json({ error: "Failed to update customer." });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const dashboardUser = await prisma.user.findUnique({
      where: {
        id: req.params.id,
      },
      select: {
        id: true,
        role: true,
      },
    });

    if (dashboardUser?.role === "ADMIN" || dashboardUser?.role === "MANAGER") {
      return res.status(403).json({ error: "Dashboard users cannot be deleted from customer routes." });
    }

    if (dashboardUser?.id === req.user?.id) {
      return res.status(403).json({ error: "You cannot delete your own account from customer routes." });
    }

    const customer = await prisma.customer.findUnique({
      where: {
        id: req.params.id,
      },
      select: {
        id: true,
        _count: {
          select: {
            orders: true,
          },
        },
      },
    });

    if (!customer) {
      return res.status(404).json({ error: "Customer not found." });
    }

    if (customer._count.orders > 0) {
      return res.status(400).json({
        error: "Customer has existing orders and cannot be deleted.",
      });
    }

    await prisma.customer.delete({
      where: {
        id: req.params.id,
      },
    });

    return res.status(204).end();
  } catch (err) {
    console.error("DELETE CUSTOMER ERROR:", err);
    return res.status(500).json({ error: "Failed to delete customer." });
  }
});

export default router;
