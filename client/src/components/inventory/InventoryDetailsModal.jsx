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
    let color = "bg-zinc-800 text-zinc-300 border-zinc-700";
    if (status === "In Stock") color = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    if (status === "Low Stock") color = "bg-amber-500/10 text-amber-400 border-amber-500/20";
    if (status === "Out of Stock") color = "bg-red-500/10 text-red-400 border-red-500/20";

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

      <div className="relative w-full max-w-lg bg-zinc-900 border border-zinc-800/80 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">

        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-zinc-800/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Package size={20} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-zinc-100">Inventory Details</h2>
              <p className="text-xs text-zinc-400">View product stock and value information</p>
            </div>
          </div>
          <button
            onClick={() => onClose?.()}
            className="p-2 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-xl transition-colors"
          >
            <X size={20} />
          </button>

        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          <div className="flex items-start gap-4 pb-6 border-b border-zinc-800/80">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={product?.name || "Product image"}
                className="w-20 h-20 rounded-xl object-cover bg-zinc-800 border border-zinc-700/50"
              />
            ) : (
              <div className="w-20 h-20 rounded-xl bg-zinc-800/50 flex items-center justify-center border border-zinc-700/50 text-zinc-600">
                <Package size={32} />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-medium text-zinc-100 truncate">
                {product?.name || "Unknown Product"}
              </h3>
              <p className="text-sm text-zinc-400 mt-1 flex items-center gap-2">
                <Hash size={14} /> SKU: {product?.sku || "N/A"}
              </p>
              <div className="mt-3">
                {renderStatusBadge(status)}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-zinc-950/50 p-4 rounded-xl border border-zinc-800/50">
              <p className="text-xs text-zinc-500 flex items-center gap-1.5 mb-1">
                <Archive size={14} /> Current Stock
              </p>
              <p className="text-lg font-semibold text-zinc-200">{item?.stock || 0} units</p>
            </div>
            
            <div className="bg-zinc-950/50 p-4 rounded-xl border border-zinc-800/50">
              <p className="text-xs text-zinc-500 flex items-center gap-1.5 mb-1">
                <Tag size={14} /> Category
              </p>
              <p className="text-sm font-medium text-zinc-300 truncate">
                {product?.category || "Uncategorized"}
              </p>
            </div>

            <div className="bg-zinc-950/50 p-4 rounded-xl border border-zinc-800/50">
              <p className="text-xs text-zinc-500 flex items-center gap-1.5 mb-1">
                <DollarSign size={14} /> Unit Price
              </p>
              <p className="text-sm font-medium text-zinc-300">
                ${price.toFixed(2)}
              </p>
            </div>

            <div className="bg-zinc-950/50 p-4 rounded-xl border border-zinc-800/50">
              <p className="text-xs text-zinc-500 flex items-center gap-1.5 mb-1">
                <DollarSign size={14} /> Total Value
              </p>
              <p className="text-sm font-medium text-zinc-300">
                ${value.toFixed(2)}
              </p>
            </div>
          </div>
          
          {item?.updatedAt && (
            <div className="text-xs text-zinc-500 flex items-center gap-1.5 justify-end">
              <Calendar size={14} />
              Last updated: {new Date(item.updatedAt).toLocaleString()}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-zinc-800/80 bg-zinc-950/50 flex justify-end">
          <button
            onClick={() => onClose?.()}
            className="px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-sm font-medium rounded-xl transition-colors"
          >
            Close
          </button>

        </div>
      </div>
    </div>
  );
};

export default InventoryDetailsModal;