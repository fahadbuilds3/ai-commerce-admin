import apiClient from "./axios";

/**
 * Fetch consolidated dashboard analytics.
 * GET /api/analytics/dashboard
 */
export async function fetchDashboardAnalytics() {
  const res = await apiClient.get("/analytics/dashboard");
  return res?.data?.data ?? res?.data ?? {};
}
