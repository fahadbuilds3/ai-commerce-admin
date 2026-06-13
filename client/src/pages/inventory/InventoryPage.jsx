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
          <h1 className="flex items-center gap-3 text-2xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-3xl">
            <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-2 dark:border-indigo-500/20 dark:bg-indigo-500/10">
              <Boxes className="text-indigo-600 dark:text-indigo-300" size={24} />
            </div>
            Inventory Management
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-300 sm:text-base">
            Monitor stock levels across all your products, track inventory value, and seamlessly adjust stock quantities.
          </p>
        </div>
      </div>

      {/* Global Page Error */}
      {(error || statsError) && (
        <div className="flex flex-col items-start justify-between gap-4 rounded-2xl border border-red-200 bg-red-50 p-4 transition-colors dark:border-red-900/60 dark:bg-red-950/30 sm:flex-row sm:items-center sm:p-5">
          <div className="flex items-center gap-3">
            <div className="shrink-0 rounded-full bg-red-100 p-2 dark:bg-red-900/30">
              <AlertCircle className="text-red-600 dark:text-red-400" size={24} />
            </div>
            <div>
               <h3 className="text-base font-semibold text-red-700 dark:text-red-400">Data Fetch Error</h3>
               <p className="mt-1 text-sm text-red-600 dark:text-red-200/80">
                 {error || statsError}
               </p>
            </div>
          </div>
          <button
            onClick={() => {
              if (error) retryFetch();
              if (statsError) retryStats();
            }}
            className="btn btn-danger h-9 whitespace-nowrap rounded-lg"
          >
            <RefreshCw size={16} />
            Retry
          </button>
        </div>
      )}

      {/* Alerts Section */}
      {hasAlerts && !statsLoading && !statsError && (
        <div className="flex items-start gap-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700 transition-colors hover:bg-red-100 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-200 dark:hover:bg-red-950/40 sm:p-5">
          <div className="shrink-0 rounded-full bg-red-100 p-2 dark:bg-red-900/30">
            <AlertCircle className="text-red-600 dark:text-red-400" size={24} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-red-700 dark:text-red-400">Inventory Alerts</h3>
            <p className="mt-1 text-sm leading-relaxed text-red-600 dark:text-red-200/80">
              You have {stats?.outOfStock > 0 ? <span className="mx-1 rounded-md bg-red-100 px-2 py-0.5 font-bold text-red-700 dark:bg-red-900/40 dark:text-white">{stats.outOfStock} out of stock</span> : null}
              {stats?.outOfStock > 0 && stats?.lowStock > 0 ? " and " : ""}
              {stats?.lowStock > 0 ? <span className="mx-1 rounded-md bg-amber-100 px-2 py-0.5 font-bold text-amber-800 dark:bg-amber-900/40 dark:text-white">{stats.lowStock} low stock</span> : null}
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
