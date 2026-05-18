import apiClient from "./axios";

/**
 * Fetch all products with optional query parameters.
 * @param {Object} params
 * @returns {Promise<any>}
 */
export async function getProducts(params = {}) {
  try {
    const response = await apiClient.get("/products", { params });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
}

/**
 * Fetch a single product by ID.
 * @param {string} productId
 * @returns {Promise<any>}
 */
export async function getProductById(productId) {
  try {
    const response = await apiClient.get(`/products/${productId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
}

/**
 * Create a new product.
 * @param {Object} productData
 * @returns {Promise<any>}
 */
export async function createProduct(productData) {
  try {
    const response = await apiClient.post("/products", productData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
}

/**
 * Update a product by ID.
 * @param {string} productId
 * @param {Object} updateData
 * @returns {Promise<any>}
 */
export async function updateProduct(productId, updateData) {
  try {
    const response = await apiClient.put(`/products/${productId}`, updateData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
}

/**
 * Delete a product by ID.
 * @param {string} productId
 * @returns {Promise<any>}
 */
export async function deleteProduct(productId) {
  try {
    const response = await apiClient.delete(`/products/${productId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
}