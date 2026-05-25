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
    let color = "bg-zinc-800 text-zinc-300 border-zinc-700";
    if (status === "In Stock") color = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    if (status === "Low Stock") color = "bg-amber-500/10 text-amber-400 border-amber-500/20";
    if (status === "Out of Stock") color = "bg-red-500/10 text-red-400 border-red-500/20";

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
      <div className="bg-zinc-900/50 backdrop-blur-sm rounded-2xl border border-zinc-800/80 shadow-xl overflow-hidden flex flex-col w-full min-w-0">
        
        {/* Table Toolbar */}
        <div className="p-4 sm:p-5 border-b border-zinc-800/80 flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          
          {/* Search */}
          <form onSubmit={handleSearch} className="relative w-full lg:max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
            <input
              type="text"
              placeholder="Search inventory by product or SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-zinc-950/50 border border-zinc-800/80 rounded-xl text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all hover:bg-zinc-950/80"
            />
          </form>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full lg:w-auto">
            <div className="flex items-center gap-2 text-zinc-400 text-sm font-medium px-1">
              <Filter size={16} />
              <span className="hidden sm:inline">Status:</span>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              {["All", "In Stock", "Low Stock", "Out of Stock"].map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setStatusFilter(status)}
                  className={`px-3.5 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-all duration-200 border ${
                    statusFilter === status
                      ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/30 shadow-sm"
                      : "bg-zinc-900/50 text-zinc-400 border-zinc-800 hover:bg-zinc-800 hover:text-zinc-200"
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Table Container */}
        <div className="overflow-x-auto min-w-full">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="border-b border-zinc-800/80 bg-zinc-900/80 backdrop-blur-md sticky top-0 z-10 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                <th className="px-5 py-4 whitespace-nowrap">Product</th>
                <th className="px-5 py-4 whitespace-nowrap">SKU</th>
                <th className="px-5 py-4 whitespace-nowrap">Stock</th>
                <th className="px-5 py-4 whitespace-nowrap">Status</th>
                <th className="px-5 py-4 whitespace-nowrap">Price</th>
                <th className="px-5 py-4 whitespace-nowrap">Inv. Value</th>
                <th className="px-5 py-4 whitespace-nowrap text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {loading ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse bg-zinc-900/20">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-zinc-800 rounded-lg shrink-0"></div>
                        <div className="space-y-2">
                          <div className="h-4 bg-zinc-800 rounded w-24"></div>
                          <div className="h-3 bg-zinc-800 rounded w-16"></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4"><div className="h-4 bg-zinc-800 rounded w-16"></div></td>
                    <td className="px-5 py-4"><div className="h-4 bg-zinc-800 rounded w-12"></div></td>
                    <td className="px-5 py-4"><div className="h-6 bg-zinc-800 rounded-full w-20"></div></td>
                    <td className="px-5 py-4"><div className="h-4 bg-zinc-800 rounded w-12"></div></td>
                    <td className="px-5 py-4"><div className="h-4 bg-zinc-800 rounded w-16"></div></td>
                    <td className="px-5 py-4"><div className="h-8 bg-zinc-800 rounded w-24 ml-auto"></div></td>
                  </tr>
                ))
              ) : filteredItems?.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-16 text-center">
                    <div className="flex flex-col items-center justify-center text-zinc-500">
                      <div className="w-16 h-16 rounded-full bg-zinc-800/30 flex items-center justify-center mb-4 border border-zinc-800/50">
                        <Package size={28} className="text-zinc-500" />
                      </div>
                      <p className="text-base font-medium text-zinc-300">No inventory matches found</p>
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
                      className="hover:bg-zinc-800/40 transition-colors group"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          {imageUrl ? (
                            <img
                              src={imageUrl}
                              alt={item?.product?.name || item?.name || "Product image"}
                              className="w-10 h-10 rounded-lg object-cover bg-zinc-800 shrink-0 border border-zinc-700/50"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center shrink-0 border border-zinc-700/50">
                              <Package size={18} className="text-zinc-500" />
                            </div>
                          )}
                          <div className="flex flex-col min-w-0 max-w-[250px]">
                            <span className="text-sm font-medium text-zinc-100 truncate">
                              {item?.product?.name || item?.name || "Unknown Product"}
                            </span>
                            <span className="text-xs text-zinc-500 truncate mt-0.5">
                              {item?.product?.category || item?.category || "No Category"}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-sm text-zinc-400 font-mono bg-zinc-950 px-2 py-1 rounded-md border border-zinc-800/50">
                          {item?.product?.sku || item?.sku || "N/A"}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`text-sm font-semibold ${item?.stock <= 0 ? 'text-red-400' : 'text-zinc-200'}`}>
                          {item?.stock || 0}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        {renderStatusBadge(status)}
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-sm text-zinc-300">
                          ${price.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-sm font-medium text-zinc-200">
                          ${value.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => openViewModal(item)}
                            className="p-2 text-zinc-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors border border-transparent hover:border-indigo-500/20" 
                            title="View Details"
                          >
                            <Eye size={16} />
                          </button>
                          <button 
                            onClick={() => openEditModal(item)}
                            className="p-2 text-zinc-400 hover:text-amber-400 hover:bg-amber-500/10 rounded-lg transition-colors border border-transparent hover:border-amber-500/20" 
                            title="Edit Inventory"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            onClick={() => openDeleteModal(item)}
                            className="p-2 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors border border-transparent hover:border-red-500/20" 
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
          <div className="p-4 border-t border-zinc-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 bg-zinc-900/50">
            <span className="text-sm text-zinc-400">
              Showing <span className="font-medium text-zinc-200">{startItem}</span> to{" "}
              <span className="font-medium text-zinc-200">{endItem}</span> of{" "}
              <span className="font-medium text-zinc-200">{total}</span> results
            </span>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => onPageChange && onPageChange(page - 1)}
                disabled={page <= 1}
                className="p-2 rounded-lg border border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                aria-label="Previous page"
              >
                <ArrowLeft size={16} />
              </button>
              <div className="px-4 py-1.5 rounded-lg border border-zinc-800 bg-zinc-950 text-sm font-medium text-zinc-300 shadow-sm">
                Page {page} of {totalPages}
              </div>
              <button
                onClick={() => onPageChange && onPageChange(page + 1)}
                disabled={page >= totalPages}
                className="p-2 rounded-lg border border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
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