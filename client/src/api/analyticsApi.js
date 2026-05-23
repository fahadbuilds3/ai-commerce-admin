import apiClient from "./axios";

/**
 * Fetch consolidated dashboard analytics.
 * GET /api/analytics/dashboard
 */
export async function fetchDashboardAnalytics() {
  const res = await apiClient.get("/analytics/dashboard");
  return res?.data?.data ?? res?.data ?? {};
}

/**
 * Fetch analytics overview (KPIs).
 * GET /api/analytics/overview
 */
export async function fetchAnalyticsOverview() {
  const res = await apiClient.get("/analytics/overview");
  return res?.data?.data ?? res?.data ?? {};
}

/**
 * Fetch revenue trends and sales data.
 * GET /api/analytics/revenue
 */
export async function fetchRevenueAnalytics() {
  const res = await apiClient.get("/analytics/revenue");
  return res?.data?.data ?? res?.data ?? {};
}

/**
 * Fetch order volume and payment statistics.
 * GET /api/analytics/orders
 */
export async function fetchOrderAnalytics() {
  const res = await apiClient.get("/analytics/orders");
  return res?.data?.data ?? res?.data ?? {};
}

/**
 * Fetch customer growth trends.
 * GET /api/analytics/customers
 */
export async function fetchCustomerAnalytics() {
  const res = await apiClient.get("/analytics/customers");
  return res?.data?.data ?? res?.data ?? {};
}

/**
 * Fetch top products and recent orders.
 * GET /api/analytics/top-products
 */
export async function fetchTopProductsAnalytics() {
  const res = await apiClient.get("/analytics/top-products");
  return res?.data?.data ?? res?.data ?? {};
}
