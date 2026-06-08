import prisma from "../config/prisma.js";
import { ApiError } from "../utils/ApiError.js";

/**
 * Helper to get date boundaries
 */
const getPastDate = (daysAgo) => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date;
};

/**
 * Get core metrics for the analytics overview.
 */
export const getAnalyticsOverview = async () => {
  try {
    const thirtyDaysAgo = getPastDate(30);
    const sixtyDaysAgo = getPastDate(60);

    // Get current month metrics
    const [currentRevenue, currentOrders, currentCustomers] = await Promise.all([
      prisma.order.aggregate({
        _sum: { totalAmount: true },
        where: { createdAt: { gte: thirtyDaysAgo }, status: { notIn: ["CANCELLED", "REFUNDED"] } },
      }),
      prisma.order.count({
        where: { createdAt: { gte: thirtyDaysAgo } },
      }),
      prisma.customer.count({
        where: { createdAt: { gte: thirtyDaysAgo } },
      }),
    ]);

    const totalCustomersCount = await prisma.customer.count();

    // Get previous month metrics for growth calculation
    const [prevRevenue, prevOrders, prevCustomers] = await Promise.all([
      prisma.order.aggregate({
        _sum: { totalAmount: true },
        where: {
          createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo },
          status: { notIn: ["CANCELLED", "REFUNDED"] },
        },
      }),
      prisma.order.count({
        where: { createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } },
      }),
      prisma.customer.count({
        where: { createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } },
      }),
    ]);

    const currentRev = parseFloat(currentRevenue._sum.totalAmount || 0);
    const prevRev = parseFloat(prevRevenue._sum.totalAmount || 0);
    const revenueGrowth = prevRev === 0 ? 100 : ((currentRev - prevRev) / prevRev) * 100;

    const orderGrowth = prevOrders === 0 ? 100 : ((currentOrders - prevOrders) / prevOrders) * 100;
    
    // Overall totals
    const totalRevResult = await prisma.order.aggregate({
      _sum: { totalAmount: true },
      where: { status: { notIn: ["CANCELLED", "REFUNDED"] } },
    });
    const totalOrdersCount = await prisma.order.count();

    return {
      revenue: {
        total: parseFloat(totalRevResult._sum.totalAmount || 0),
        growth: revenueGrowth,
      },
      orders: {
        total: totalOrdersCount,
        growth: orderGrowth,
      },
      customers: {
        total: totalCustomersCount,
        growth: prevCustomers === 0 ? 100 : ((currentCustomers - prevCustomers) / prevCustomers) * 100,
      },
      growth: {
        monthly: revenueGrowth,
      }
    };
  } catch (error) {
    throw new ApiError(500, "Failed to calculate analytics overview");
  }
};

/**
 * Get revenue trends (e.g., last 7 months or last 7 weeks)
 */
export const getRevenueAnalytics = async () => {
  try {
    // Generate an array of the last 6 months for mock/real data blend
    const data = [];
    for (let i = 5; i >= 0; i--) {
      const start = new Date();
      start.setMonth(start.getMonth() - i, 1);
      start.setHours(0, 0, 0, 0);

      const end = new Date(start);
      end.setMonth(end.getMonth() + 1, 0);
      end.setHours(23, 59, 59, 999);

      const result = await prisma.order.aggregate({
        _sum: { totalAmount: true },
        where: {
          createdAt: { gte: start, lte: end },
          status: { notIn: ["CANCELLED", "REFUNDED"] },
        },
      });

      data.push({
        name: start.toLocaleString('default', { month: 'short' }),
        revenue: parseFloat(result._sum.totalAmount || 0),
        target: 5000, // mock target
      });
    }

    const salesData = [];
    for (let i = 3; i >= 0; i--) {
        const start = getPastDate((i + 1) * 7);
        const end = getPastDate(i * 7);
        const result = await prisma.order.aggregate({
            _sum: { totalAmount: true },
            where: { createdAt: { gte: start, lte: end } }
        });
        salesData.push({
            name: `Week ${4 - i}`,
            sales: parseFloat(result._sum.totalAmount || 0)
        });
    }

    return {
        revenueChart: data,
        salesTrends: salesData
    };
  } catch (error) {
    throw new ApiError(500, "Failed to calculate revenue analytics");
  }
};

/**
 * Get order volume and payment status analytics.
 */
export const getOrderAnalytics = async () => {
  try {
    const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const ordersData = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const startOfDay = new Date(date.setHours(0, 0, 0, 0));
      const endOfDay = new Date(date.setHours(23, 59, 59, 999));

      const count = await prisma.order.count({
        where: { createdAt: { gte: startOfDay, lte: endOfDay } },
      });

      ordersData.push({
        name: daysOfWeek[startOfDay.getDay()],
        orders: count,
      });
    }

    const paymentGroups = await prisma.order.groupBy({
      by: ["paymentStatus"],
      _count: true,
    });

    const paymentStatusData = paymentGroups.map((g) => ({
      name: g.paymentStatus,
      value: g._count,
    }));

    if (paymentStatusData.length === 0) {
      paymentStatusData.push(
        { name: 'Paid', value: 0 },
        { name: 'Pending', value: 0 },
        { name: 'Failed', value: 0 }
      );
    }

    return {
      orderVolume: ordersData,
      paymentStatus: paymentStatusData,
    };
  } catch (error) {
    throw new ApiError(500, "Failed to calculate order analytics");
  }
};

/**
 * Get customer growth trends.
 */
export const getCustomerAnalytics = async () => {
  try {
    const data = [];
    let runningTotal = await prisma.customer.count({
        where: {
            createdAt: { lt: getPastDate(150) }
        }
    });

    for (let i = 5; i >= 0; i--) {
      const start = new Date();
      start.setMonth(start.getMonth() - i, 1);
      start.setHours(0, 0, 0, 0);

      const end = new Date(start);
      end.setMonth(end.getMonth() + 1, 0);
      end.setHours(23, 59, 59, 999);

      const count = await prisma.customer.count({
        where: { createdAt: { gte: start, lte: end } },
      });
      
      runningTotal += count;

      data.push({
        name: start.toLocaleString('default', { month: 'short' }),
        users: runningTotal,
      });
    }

    return { customerGrowth: data };
  } catch (error) {
    throw new ApiError(500, "Failed to calculate customer analytics");
  }
};

/**
 * Get top selling products.
 */
export const getTopProductsAnalytics = async () => {
  try {
    // Top products by quantity sold
    const topProducts = await prisma.orderItem.groupBy({
      by: ["productId"],
      _sum: { quantity: true, unitPrice: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 5,
    });

    const productDetails = await Promise.all(
      topProducts.map(async (item) => {
        const product = await prisma.product.findUnique({
          where: { id: item.productId },
          select: { name: true, imageUrl: true, stock: true, price: true },
        });
        return {
          id: item.productId,
          name: product?.name || "Unknown Product",
          imageUrl: product?.imageUrl || null,
          sales: item._sum.quantity || 0,
          revenue: parseFloat(item._sum.unitPrice || 0) * (item._sum.quantity || 0),
          stock: product?.stock || 0
        };
      })
    );

    const recentOrders = await prisma.order.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
            customer: { select: { name: true, email: true } }
        }
    });

    const formattedRecentOrders = recentOrders.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        customerName: o.customer?.name || 'Guest',
        customerEmail: o.customer?.email || 'N/A',
        total: parseFloat(o.totalAmount),
        status: o.status,
        date: o.createdAt
    }));

    return { 
        topProducts: productDetails,
        recentOrders: formattedRecentOrders
    };
  } catch (error) {
    throw new ApiError(500, "Failed to fetch top products analytics");
  }
};

/**
 * Combined dashboard analytics
 */
export const getDashboardMetrics = async () => {
    try {
        const overview = await getAnalyticsOverview();
        const revenue = await getRevenueAnalytics();
        const orders = await getOrderAnalytics();
        const customers = await getCustomerAnalytics();
        const products = await getTopProductsAnalytics();

        return {
            ...overview,
            ...revenue,
            ...orders,
            ...customers,
            ...products
        };
    } catch (error) {
        throw new ApiError(500, "Failed to load dashboard metrics");
    }
};
