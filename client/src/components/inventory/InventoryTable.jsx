import React, { useState } from "react";
import { 
  Search, 
  Package, 
  Eye, 
  Edit2, 
  Trash2, 
  ArrowLeft, 
  ArrowRight,
  Filter
} from "lucide-react";
import InventoryDetailsModal from "./InventoryDetailsModal";
import InventoryEditModal from "./InventoryEditModal";
import InventoryDeleteModal from "./InventoryDeleteModal";

const InventoryTable = ({ 
  items = [], 
  loading, 
  pagination, 
  onPageChange, 
  onSearch,
  onAdjustStock,
  onRefresh // to trigger refresh after edit/delete
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  // Modal States
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const handleSearch = (e) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(searchTerm);
    }
  };

  const openViewModal = (item) => {
    setSelectedItem(item);
    setViewModalOpen(true);
  };

  const openEditModal = (item) => {
    setSelectedItem(item);
    setEditModalOpen(true);
  };

  const openDeleteModal = (item) => {
    setSelectedItem(item);
    setDeleteModalOpen(true);
  };

  const getItemStatus = (item) => {
    if (item?.stock <= 0) return "Out of Stock";
    const threshold = item?.lowStockThreshold || item?.product?.lowStockThreshold || 10;
    if (item?.stock <= threshold) return "Low Stock";
    return "In Stock";
  };

  const filteredItems = items.filter(item => {
    if (statusFilter === "All") return true;
    return getItemStatus(item) === statusFilter;
  });

  const renderStatusBadge = (status) => {
    let color = "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600";
    if (status === "In Stock") color = "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20";
    if (status === "Low Stock") color = "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20";
    if (status === "Out of Stock") color = "bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20";

    return (
      <span className={`px-2.5 py-1 text-xs font-medium rounded-full border ${color} whitespace-nowrap`}>
        {status}
      </span>
    );
  };

  const page = pagination?.page || 1;
  const limit = pagination?.limit || 10;
  const total = pagination?.total || items.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const startItem = ((page - 1) * limit) + 1;
  const endItem = Math.min(page * limit, total);

  return (
    <>
      <div className="surface-card flex w-full min-w-0 flex-col overflow-hidden">
        
        {/* Table Toolbar */}
        <div className="flex flex-col items-start justify-between gap-4 border-b border-slate-100 p-4 dark:border-slate-700 sm:p-5 lg:flex-row lg:items-center">
          
          {/* Search */}
          <form onSubmit={handleSearch} className="relative w-full lg:max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search inventory by product or SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="control-input pl-10 pr-4"
            />
          </form>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full lg:w-auto">
            <div className="flex items-center gap-2 px-1 text-sm font-medium text-slate-500 dark:text-slate-400">
              <Filter size={16} />
              <span className="hidden sm:inline">Status:</span>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              {["All", "In Stock", "Low Stock", "Out of Stock"].map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setStatusFilter(status)}
                  className={`btn h-9 whitespace-nowrap rounded-lg px-3.5 ${
                    statusFilter === status
                      ? "pagination-button-active"
                      : "btn-secondary"
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Table Container */}
        <div className="max-w-full min-w-0 overflow-x-auto overscroll-x-contain">
          <table className="w-full min-w-[1040px] table-fixed border-collapse text-left text-sm">
            <thead>
              <tr className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-[0.06em] text-slate-600 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-300">
                <th className="w-[280px] whitespace-nowrap px-5 py-3.5">Product</th>
                <th className="w-[150px] whitespace-nowrap px-5 py-3.5">SKU</th>
                <th className="w-[90px] whitespace-nowrap px-5 py-3.5 text-right">Stock</th>
                <th className="w-[140px] whitespace-nowrap px-5 py-3.5">Status</th>
                <th className="w-[110px] whitespace-nowrap px-5 py-3.5 text-right">Price</th>
                <th className="w-[130px] whitespace-nowrap px-5 py-3.5 text-right">Inv. Value</th>
                <th className="w-[150px] whitespace-nowrap px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800 dark:divide-slate-800 dark:text-slate-200">
              {loading ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse bg-slate-50/50 dark:bg-slate-800/20">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-lg shrink-0"></div>
                        <div className="space-y-2">
                          <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-24"></div>
                          <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-16"></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4"><div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-16"></div></td>
                    <td className="px-5 py-4"><div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-12"></div></td>
                    <td className="px-5 py-4"><div className="h-6 bg-slate-100 dark:bg-slate-800 rounded-full w-20"></div></td>
                    <td className="px-5 py-4"><div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-12"></div></td>
                    <td className="px-5 py-4"><div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-16"></div></td>
                    <td className="px-5 py-4"><div className="h-8 bg-slate-100 dark:bg-slate-800 rounded w-24 ml-auto"></div></td>
                  </tr>
                ))
              ) : filteredItems?.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-16 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-500 dark:text-slate-400">
                      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800">
                        <Package size={28} className="text-slate-400" />
                      </div>
                      <p className="text-base font-medium text-slate-900 dark:text-white">No inventory matches found</p>
                      <p className="text-sm mt-1">Try adjusting your filters or search terminology.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const status = getItemStatus(item);
                  const price = item?.product?.price || item?.price || 0;
                  const value = (item?.stock || 0) * price;
                  const imageUrl = item?.product?.images?.[0]?.url || item?.images?.[0]?.url || item?.imageUrl;
                  
                  return (
                    <tr 
                      key={item?.id || Math.random()} 
                      className="group transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40"
                    >
                      <td className="px-5 py-3.5 align-middle">
                        <div className="flex min-w-0 items-center gap-3">
                          {imageUrl ? (
                            <img
                              src={imageUrl}
                              alt={item?.product?.name || item?.name || "Product image"}
                          className="h-10 w-10 shrink-0 rounded-lg border border-slate-200 bg-slate-100 object-cover dark:border-slate-700 dark:bg-slate-800"
                            />
                          ) : (
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800">
                              <Package size={18} className="text-slate-400" />
                            </div>
                          )}
                          <div className="flex min-w-0 max-w-[210px] flex-col">
                            <span className="truncate text-sm font-medium text-slate-900 dark:text-white">
                              {item?.product?.name || item?.name || "Unknown Product"}
                            </span>
                            <span className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
                              {item?.product?.category || item?.category || "No Category"}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 align-middle">
                        <span className="block max-w-[120px] truncate rounded-md border border-slate-200 bg-slate-50 px-2 py-1 font-mono text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300" title={item?.product?.sku || item?.sku || "N/A"}>
                          {item?.product?.sku || item?.sku || "N/A"}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-5 py-3.5 text-right align-middle">
                        <span className={`text-sm font-semibold ${item?.stock <= 0 ? 'text-red-500 dark:text-red-400' : 'text-slate-900 dark:text-slate-200'}`}>
                          {item?.stock || 0}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-5 py-3.5 align-middle">
                        {renderStatusBadge(status)}
                      </td>
                      <td className="whitespace-nowrap px-5 py-3.5 text-right align-middle">
                        <span className="text-sm text-slate-600 dark:text-slate-300">
                          ${price.toFixed(2)}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-5 py-3.5 text-right align-middle">
                        <span className="text-sm font-medium text-slate-900 dark:text-slate-200">
                          ${value.toFixed(2)}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-5 py-3.5 text-right align-middle">
                        <div className="flex items-center justify-end gap-1.5 opacity-100 transition-opacity lg:opacity-0 lg:group-hover:opacity-100 lg:group-focus-within:opacity-100">
                          <button 
                            onClick={() => openViewModal(item)}
                            className="icon-button"
                            title="View Details"
                          >
                            <Eye size={16} />
                          </button>
                          <button 
                            onClick={() => openEditModal(item)}
                            className="icon-button"
                            title="Edit Inventory"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            onClick={() => openDeleteModal(item)}
                            className="icon-button icon-button-danger"
                            title="Delete Entry"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {!loading && filteredItems?.length > 0 && pagination && (
          <div className="flex flex-col items-center justify-between gap-4 border-t border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-800/50 sm:flex-row">
            <span className="text-sm text-slate-500 dark:text-slate-400">
              Showing <span className="font-medium text-slate-900 dark:text-slate-200">{startItem}</span> to{" "}
              <span className="font-medium text-slate-900 dark:text-slate-200">{endItem}</span> of{" "}
              <span className="font-medium text-slate-900 dark:text-slate-200">{total}</span> results
            </span>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => onPageChange && onPageChange(page - 1)}
                disabled={page <= 1}
                className="icon-button"
                aria-label="Previous page"
              >
                <ArrowLeft size={16} />
              </button>
              <div className="rounded-lg border border-slate-200 bg-white px-4 py-1.5 text-sm font-medium text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                Page {page} of {totalPages}
              </div>
              <button
                onClick={() => onPageChange && onPageChange(page + 1)}
                disabled={page >= totalPages}
                className="icon-button"
                aria-label="Next page"
              >
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      <InventoryDetailsModal 
        isOpen={viewModalOpen} 
        onClose={() => setViewModalOpen(false)} 
        item={selectedItem} 
      />

      <InventoryEditModal 
        isOpen={editModalOpen} 
        onClose={() => setEditModalOpen(false)} 
        item={selectedItem}
        onSuccess={() => {
          if (onRefresh) onRefresh();
          // Fallback if no refresh function
        }}
      />

      <InventoryDeleteModal 
        isOpen={deleteModalOpen} 
        onClose={() => setDeleteModalOpen(false)} 
        item={selectedItem}
        onSuccess={() => {
          if (onRefresh) onRefresh();
        }}
      />
    </>
  );
};

export default InventoryTable;
