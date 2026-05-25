import axiosInstance from "./axios";

export const getInventoryItems = async (params) => {
  const response = await axiosInstance.get("/inventory", { params });
  return response.data;
};

export const getInventoryStats = async () => {
  const response = await axiosInstance.get("/inventory/stats");
  return response.data;
};

export const adjustStock = async (id, stock) => {
  const response = await axiosInstance.patch(`/inventory/${id}/stock`, { stock });
  return response.data;
};

export const updateInventoryItem = async (id, data) => {
  const response = await axiosInstance.put(`/inventory/${id}`, data);
  return response.data;
};

export const deleteInventoryItem = async (id) => {
  const response = await axiosInstance.delete(`/inventory/${id}`);
  return response.data;
};
