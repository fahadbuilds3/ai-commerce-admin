import React, { useEffect } from "react";
import { X, Package, Tag, Hash, Archive, DollarSign, Calendar } from "lucide-react";

const InventoryDetailsModal = ({ isOpen, onClose, item }) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e) => {
      if (e?.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;
  if (!item) return null;

  const product = item?.product || item;
  const status = item?.inventoryStatus || "Out of Stock";
  const price = Number(product?.price ?? 0) || 0;
  const value = (Number(item?.stock ?? 0) || 0) * price;
  const imageUrl = product?.images?.[0]?.url || item?.images?.[0]?.url || item?.imageUrl;


  const renderStatusBadge = (status) => {
    let color = "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600";
    if (status === "In Stock") color = "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20";
    if (status === "Low Stock") color = "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20";
    if (status === "Out of Stock") color = "bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20";

    return (
      <span className={`px-3 py-1 text-xs font-medium rounded-full border ${color}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={() => onClose?.()}
        role="button"
        aria-label="Close"
        tabIndex={-1}
      ></div>

      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">

        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-indigo-200 bg-indigo-50 text-indigo-600 dark:border-indigo-500/20 dark:bg-indigo-500/10 dark:text-indigo-400">
              <Package size={20} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-950 dark:text-white">Inventory Details</h2>
              <p className="text-xs text-slate-600 dark:text-slate-400">View product stock and value information</p>
            </div>
          </div>
          <button
            onClick={() => onClose?.()}
            className="icon-button rounded-xl"
          >
            <X size={20} />
          </button>

        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          <div className="flex items-start gap-4 pb-6 border-b border-slate-200 dark:border-slate-700">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={product?.name || "Product image"}
                className="w-20 h-20 rounded-xl object-cover bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              />
            ) : (
              <div className="w-20 h-20 rounded-xl bg-slate-100 dark:bg-slate-800/50 flex items-center justify-center border border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500">
                <Package size={32} />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-medium text-slate-950 dark:text-white truncate">
                {product?.name || "Unknown Product"}
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 flex items-center gap-2">
                <Hash size={14} /> SKU: {product?.sku || "N/A"}
              </p>
              <div className="mt-3">
                {renderStatusBadge(status)}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
              <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mb-1">
                <Archive size={14} /> Current Stock
              </p>
              <p className="text-lg font-semibold text-slate-900 dark:text-slate-200">{item?.stock || 0} units</p>
            </div>
            
            <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
              <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mb-1">
                <Tag size={14} /> Category
              </p>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">
                {product?.category || "Uncategorized"}
              </p>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
              <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mb-1">
                <DollarSign size={14} /> Unit Price
              </p>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                ${price.toFixed(2)}
              </p>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
              <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mb-1">
                <DollarSign size={14} /> Total Value
              </p>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                ${value.toFixed(2)}
              </p>
            </div>
          </div>
          
          {item?.updatedAt && (
            <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 justify-end">
              <Calendar size={14} />
              Last updated: {new Date(item.updatedAt).toLocaleString()}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex justify-end">
          <button
            onClick={() => onClose?.()}
            className="btn btn-secondary px-5"
          >
            Close
          </button>

        </div>
      </div>
    </div>
  );
};

export default InventoryDetailsModal;
