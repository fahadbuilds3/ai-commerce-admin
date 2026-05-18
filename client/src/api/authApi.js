import apiClient from "./axios";

/**
 * Auth API Service - Handles user authentication requests.
 * Functions are individually exported for modular consumption.
 */

/**
 * Log in a user.
 * @param {Object} credentials - User login data (e.g. email, password)
 * @returns {Promise<Object>} - Auth and user data
 */
export const loginUser = async (credentials) => {
  const response = await apiClient.post("/auth/login", credentials);
  return response.data;
};

/**
 * Register a new user.
 * @param {Object} userData - Registration data (e.g. name, email, password)
 * @returns {Promise<Object>} - User and auth data
 */
export const registerUser = async (userData) => {
  const response = await apiClient.post("/auth/register", userData);
  return response.data;
};

/**
 * Fetch the current authenticated user's info.
 * @returns {Promise<Object>} - User data
 */
export const fetchCurrentUser = async () => {
  const response = await apiClient.get("/auth/me");
  return response.data;
};