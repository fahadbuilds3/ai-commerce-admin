import { useState, useCallback } from "react";
import * as inventoryApi from "../api/inventoryApi";
import { toast } from "../utils/toast";

export const useInventory = () => {
  const [items, setItems] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [statsError, setStatsError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });

  const fetchInventory = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);
    try {
      const response = await inventoryApi.getInventoryItems(params);
      
      // Defensively parse items array and pagination object
      const itemsData = response?.data || response?.items || [];
      const paginationData = response?.pagination || {
        page: params.page || 1,
        limit: params.limit || 10,
        total: itemsData.length || 0,
        totalPages: Math.ceil((itemsData.length || 0) / (params.limit || 10)) || 1
      };
      
      setItems(Array.isArray(itemsData) ? itemsData : []);
      setPagination(paginationData);
    } catch (err) {
      const errorMessage = err?.response?.data?.message || err?.message || "Failed to fetch inventory";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    setStatsError(null);
    try {
      const response = await inventoryApi.getInventoryStats();
      
      // Defensively parse stats
      const statsData = response?.data || response || null;
      if (statsData) {
        setStats({
          totalProducts: statsData?.totalProducts || 0,
          inStock: statsData?.inStock || 0,
          lowStock: statsData?.lowStock || 0,
          outOfStock: statsData?.outOfStock || 0,
          inventoryValue: statsData?.inventoryValue || 0,
          inventoryHealth: statsData?.inventoryHealth || 100,
        });
      } else {
         setStats({
          totalProducts: 0,
          inStock: 0,
          lowStock: 0,
          outOfStock: 0,
          inventoryValue: 0,
          inventoryHealth: 100,
        });
      }
    } catch (err) {
      const errorMessage = err?.response?.data?.message || err?.message || "Failed to fetch inventory stats";
      setStatsError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const adjustStock = async (id, newStock) => {
    if (!id) return false;
    
    try {
      await inventoryApi.adjustStock(id, newStock);
      toast.success("Stock adjusted successfully");
      
      // Optimistic update with defensive rendering support
      setItems((prevItems) => {
        if (!Array.isArray(prevItems)) return [];
        return prevItems.map((item) => {
          if (item?.id === id) {
             const safePrice = item?.product?.price || item?.price || 0;
             return {
               ...item,
               stock: newStock,
               inventoryValue: newStock * safePrice,
             };
          }
          return item;
        });
      });
      
      fetchStats();
      return true;
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to adjust stock");
      return false;
    }
  };

  const retryFetch = useCallback(() => {
    fetchInventory({ page: pagination.page, limit: pagination.limit });
  }, [fetchInventory, pagination.page, pagination.limit]);

  const retryStats = useCallback(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    items,
    stats,
    loading,
    statsLoading,
    error,
    statsError,
    pagination,
    fetchInventory,
    fetchStats,
    adjustStock,
    retryFetch,
    retryStats
  };
};
