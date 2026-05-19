// controllers/orderController.js

// Assumes you have prisma client initialized and exported from prisma.js
import prisma from '../prisma';

// Service layer for clean separation of business logic
const orderService = {
  async getOrders() {
    return prisma.order.findMany({
      include: {
        user: {
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
  },

  async getOrderById(id) {
    return prisma.order.findUnique({
      where: { id: Number(id) },
      include: {
        user: {
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
  },

  async updateOrderStatus(id, status) {
    return prisma.order.update({
      where: { id: Number(id) },
      data: { status },
      include: {
        user: {
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
  },

  async deleteOrder(id) {
    return prisma.order.delete({
      where: { id: Number(id) }
    });
  }
};

// Controllers

export const getOrders = async (req, res, next) => {
  try {
    const orders = await orderService.getOrders();
    res.json(orders);
  } catch (error) {
    next({
      status: 500,
      message: "Failed to fetch orders",
      error
    });
  }
};

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