import React, { useEffect, useState } from "react";
import { Boxes, AlertCircle, RefreshCw } from "lucide-react";
import { useInventory } from "../../hooks/useInventory";
import InventoryStats from "../../components/inventory/InventoryStats";
import InventoryTable from "../../components/inventory/InventoryTable";

const InventoryPage = () => {
  const {
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
  } = useInventory();

  const [currentSearch, setCurrentSearch] = useState("");

  useEffect(() => {
    fetchStats();
    fetchInventory({ page: 1, limit: 10 });
  }, [fetchStats, fetchInventory]);

  const handlePageChange = (newPage) => {
    fetchInventory({ page: newPage, limit: pagination?.limit || 10, search: currentSearch });
  };

  const handleSearch = (searchTerm) => {
    setCurrentSearch(searchTerm);
    fetchInventory({ page: 1, limit: pagination?.limit || 10, search: searchTerm });
  };

  const handleRefresh = () => {
    fetchStats();
    fetchInventory({ page: pagination?.page || 1, limit: pagination?.limit || 10, search: currentSearch });
  };

  const hasAlerts = stats && ((stats?.lowStock || 0) > 0 || (stats?.outOfStock || 0) > 0);

  return (
    <div className="w-full max-w-full space-y-6 animate-in fade-in duration-300 min-w-0">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <div className="p-2 bg-indigo-500/10 rounded-xl">
              <Boxes className="text-indigo-400" size={24} />
            </div>
            Inventory Management
          </h1>
          <p className="text-sm sm:text-base text-zinc-400 mt-2 max-w-2xl">
            Monitor stock levels across all your products, track inventory value, and seamlessly adjust stock quantities.
          </p>
        </div>
      </div>

      {/* Global Page Error */}
      {(error || statsError) && (
        <div className="bg-red-950/30 border border-red-900/50 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between transition-all">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-900/30 rounded-full shrink-0">
              <AlertCircle className="text-red-400" size={24} />
            </div>
            <div>
               <h3 className="font-semibold text-red-400 text-base">Data Fetch Error</h3>
               <p className="text-sm mt-1 text-red-200/80">
                 {error || statsError}
               </p>
            </div>
          </div>
          <button
            onClick={() => {
              if (error) retryFetch();
              if (statsError) retryStats();
            }}
            className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors whitespace-nowrap text-sm font-medium border border-red-500/20"
          >
            <RefreshCw size={16} />
            Retry
          </button>
        </div>
      )}

      {/* Alerts Section */}
      {hasAlerts && !statsLoading && !statsError && (
        <div className="bg-red-950/30 border border-red-900/50 rounded-2xl p-4 sm:p-5 flex items-start gap-4 text-red-200 transition-all hover:bg-red-950/40">
          <div className="p-2 bg-red-900/30 rounded-full shrink-0">
            <AlertCircle className="text-red-400" size={24} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-red-400 text-base">Inventory Alerts</h3>
            <p className="text-sm mt-1 text-red-200/80 leading-relaxed">
              You have {stats?.outOfStock > 0 ? <span className="font-bold text-white bg-red-900/40 px-2 py-0.5 rounded-md mx-1">{stats.outOfStock} out of stock</span> : null}
              {stats?.outOfStock > 0 && stats?.lowStock > 0 ? " and " : ""}
              {stats?.lowStock > 0 ? <span className="font-bold text-white bg-amber-900/40 px-2 py-0.5 rounded-md mx-1">{stats.lowStock} low stock</span> : null} 
              items. Please review your inventory and restock soon to prevent missed sales.
            </p>
          </div>
        </div>
      )}

      {/* KPI Cards Section */}
      <div className="w-full overflow-hidden">
        <InventoryStats stats={stats} loading={statsLoading} />
      </div>

      {/* Inventory Table Container Section */}
      <div className="w-full overflow-hidden rounded-2xl">
        <InventoryTable
          items={items || []}
          loading={loading}
          pagination={pagination}
          onPageChange={handlePageChange}
          onSearch={handleSearch}
          onAdjustStock={adjustStock}
          onRefresh={handleRefresh}
        />
      </div>
    </div>
  );
};

export default InventoryPage;
