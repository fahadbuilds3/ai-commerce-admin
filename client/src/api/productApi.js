import apiClient from "./axios";

// Get all products
export async function getProducts(params = {}) {
  try {
    const response = await apiClient.get("/products", { params });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
}

// Get single product by ID
export async function getProductById(productId) {
  try {
    const response = await apiClient.get(`/products/${productId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
}

// Create new product
export const createProduct = async (
  productData
) => {
  const response =
    await apiClient.post(
      "/products",
      productData
    );

  return response.data;
};

// Update existing product by ID
export async function updateProduct(productId, updateData) {
  try {
    const response = await apiClient.put(`/products/${productId}`, updateData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
}

// Delete a product by ID
export async function deleteProduct(productId) {
  try {
    const response = await apiClient.delete(`/products/${productId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
}