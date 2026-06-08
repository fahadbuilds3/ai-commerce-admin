/**
 * OrderService - Encapsulates all order-related database operations using Prisma.
 * Optimized for SaaS scalability and production use.
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const ORDER_SELECT = {
  id: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  total: true,
  // Customize relations needed for admin dashboard analytics/UI
  customer: {
    select: {
      id: true,
      email: true,
      name: true,
    },
  },
  items: {
    select: {
      id: true,
      product: {
        select: {
          id: true,
          name: true,
          sku: true,
        },
      },
      quantity: true,
      price: true,
    },
  },
  // Example: Add tenantId for SaaS multi-tenancy if present
  tenantId: true,
};

/**
 * Fetch paginated orders, optionally filter by search/tenant/status.
 * @param {Object} params - Pagination, filtering options.
 *   - take: number - limit per page
 *   - skip: number - offset
 *   - status: string - optional filter
 *   - tenantId: string|number - mandatory for SaaS
   *   - search: string - optional, search by customer/product
 */
async function getOrders({ skip = 0, take = 20, status, tenantId, search } = {}) {
  const where = {};
  if (tenantId) where.tenantId = tenantId;
  if (status) where.status = status;
  if (search) {
    // Example: simple search by customer email or product (customize as needed)
    where.OR = [
      { customer: { email: { contains: search, mode: 'insensitive' } } },
      { items: { some: { product: { name: { contains: search, mode: 'insensitive' } } } } },
    ];
  }
  return await prisma.order.findMany({
    where,
    skip,
    take,
    orderBy: { createdAt: 'desc' },
    select: ORDER_SELECT,
  });
}

/**
 * Fetch a single order by ID (+ tenancy check).
 * @param {string|number} id
 * @param {string|number} tenantId (optional, for SaaS multi-tenant enforcement)
 * @returns {Promise<Order|null>}
 */
async function getOrderById(id, tenantId) {
  const where = { id: Number(id) };
  if (tenantId) where.tenantId = tenantId;
  return await prisma.order.findUnique({
    where,
    select: ORDER_SELECT,
  });
}

/**
 * Update the status of an order (status validation occurs in controller).
 * @param {string|number} id
 * @param {string} status
 * @param {string|number} tenantId (optional, for SaaS multi-tenant enforcement)
 * @returns {Promise<Order>}
 * @throws Prisma error if not found.
 */
async function updateOrderStatus(id, status, tenantId) {
  const where = { id: Number(id) };
  if (tenantId) where.tenantId = tenantId;
  return await prisma.order.update({
    where,
    data: { status },
    select: ORDER_SELECT,
  });
}

/**
 * Delete an order by ID (soft delete recommended for production/SaaS).
 * Currently uses hard delete.
 * @param {string|number} id
 * @param {string|number} tenantId (optional, for SaaS multi-tenant enforcement)
 * @returns {Promise<Order>} - deleted order
 */
async function deleteOrder(id, tenantId) {
  const where = { id: Number(id) };
  if (tenantId) where.tenantId = tenantId;
  return await prisma.order.delete({
    where,
    select: { id: true }, // minimal response for deletion confirmation
  });
}

module.exports = {
  getOrders,
  getOrderById,
  updateOrderStatus,
  deleteOrder,
};
