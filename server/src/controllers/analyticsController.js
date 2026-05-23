import asyncHandler from "../utils/asyncHandler.js";
import {
  getAnalyticsOverview,
  getRevenueAnalytics,
  getOrderAnalytics,
  getCustomerAnalytics,
  getTopProductsAnalytics,
  getDashboardMetrics
} from "../services/analyticsService.js";

/**
 * @desc    Get complete analytics overview (KPIs)
 * @route   GET /api/analytics/overview
 * @access  Private/Admin
 */
export const getOverview = asyncHandler(async (req, res) => {
  const data = await getAnalyticsOverview();
  res.status(200).json({ success: true, data });
});

/**
 * @desc    Get revenue trends and sales data
 * @route   GET /api/analytics/revenue
 * @access  Private/Admin
 */
export const getRevenue = asyncHandler(async (req, res) => {
  const data = await getRevenueAnalytics();
  res.status(200).json({ success: true, data });
});

/**
 * @desc    Get order volume and payment statistics
 * @route   GET /api/analytics/orders
 * @access  Private/Admin
 */
export const getOrders = asyncHandler(async (req, res) => {
  const data = await getOrderAnalytics();
  res.status(200).json({ success: true, data });
});

/**
 * @desc    Get customer growth trends
 * @route   GET /api/analytics/customers
 * @access  Private/Admin
 */
export const getCustomers = asyncHandler(async (req, res) => {
  const data = await getCustomerAnalytics();
  res.status(200).json({ success: true, data });
});

/**
 * @desc    Get top products and recent orders
 * @route   GET /api/analytics/top-products
 * @access  Private/Admin
 */
export const getTopProducts = asyncHandler(async (req, res) => {
  const data = await getTopProductsAnalytics();
  res.status(200).json({ success: true, data });
});

/**
 * @desc    Get consolidated dashboard metrics
 * @route   GET /api/analytics/dashboard
 * @access  Private/Admin
 */
export const getDashboardAnalytics = asyncHandler(async (req, res) => {
  const data = await getDashboardMetrics();
  res.status(200).json({ success: true, data });
});
