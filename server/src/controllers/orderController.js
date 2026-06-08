// controllers/orderController.js

import prisma from "../config/prisma.js";

// Service layer for clean separation of business logic
const orderService = {
  async getOrders() {
    const orders = await prisma.order.findMany({
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        orderItems: {
          include: {
            product: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    return orders.map(formatOrderCustomerAliases);
  },

  async getOrderById(id) {
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        orderItems: {
          include: {
            product: true
          }
        }
      }
    });
    return formatOrderCustomerAliases(order);
  },

  async updateOrderStatus(id, status) {
    const order = await prisma.order.update({
      where: { id },
      data: { status },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        orderItems: {
          include: {
            product: true
          }
        }
      }
    });
    return formatOrderCustomerAliases(order);
  },

  async deleteOrder(id) {
    return prisma.order.delete({
      where: { id }
    });
  }
};

// Controllers

// export const getOrders = async (req, res, next) => {
//   try {
//     const orders = await orderService.getOrders();
//     res.json(orders);
//   } catch (error) {
//     next({
//       status: 500,
//       message: "Failed to fetch orders",
//       error
//     });
//   }
// };

export const getOrders = async (req, res) => {
  try {
    const orders = await orderService.getOrders();

    return res.status(200).json(orders);

  } catch (error) {
    console.error("GET ORDERS ERROR:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

function formatOrderCustomerAliases(order) {
  if (!order) return order;
  return {
    ...order,
    customer: order.customer ?? null,
    user: order.customer ?? null,
  };
}

export const getOrderById = async (req, res, next) => {
  try {
    const order = await orderService.getOrderById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }
    res.json(order);
  } catch (error) {
    next({
      status: 500,
      message: "Failed to fetch order",
      error
    });
  }
};

export const updateOrderStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ error: "Status is required" });
    }

    let updatedOrder;
    try {
      updatedOrder = await orderService.updateOrderStatus(req.params.id, status);
    } catch (prismaErr) {
      // Prisma error codes, e.g., P2025 = record not found
      if (prismaErr.code === 'P2025') {
        return res.status(404).json({ error: "Order not found" });
      }
      throw prismaErr;
    }
    res.json(updatedOrder);
  } catch (error) {
    next({
      status: 500,
      message: "Failed to update order status",
      error
    });
  }
};

export const deleteOrder = async (req, res, next) => {
  try {
    try {
      await orderService.deleteOrder(req.params.id);
    } catch (prismaErr) {
      if (prismaErr.code === 'P2025') {
        return res.status(404).json({ error: "Order not found" });
      }
      throw prismaErr;
    }
    res.status(204).end();
  } catch (error) {
    next({
      status: 500,
      message: "Failed to delete order",
      error
    });
  }
};
