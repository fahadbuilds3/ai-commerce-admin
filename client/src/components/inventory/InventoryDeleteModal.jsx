import React, { useState, useEffect } from "react";
import { X, Trash2, AlertTriangle, Loader } from "lucide-react";
import * as inventoryApi from "../../api/inventoryApi";
import { toast } from "../../utils/toast";

const InventoryDeleteModal = ({ isOpen, onClose, item, onSuccess }) => {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e) => {
      if (e?.key === "Escape" && !loading) onClose?.();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose, loading]);

  if (!isOpen) return null;
  if (!item) return null;

  const id = item?.id;
  if (!id) return null;


  const product = item?.product || item;

  const handleDelete = async () => {
    try {
      setLoading(true);
      await inventoryApi.deleteInventoryItem(id);
      toast.success("Inventory item deleted successfully");
      onSuccess?.();
      onClose?.();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to delete inventory item");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
        onClick={!loading ? () => onClose?.() : undefined}
      ></div>
      
      <div className="relative w-full max-w-sm bg-zinc-900 border border-zinc-800/80 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 pb-0">
          <button 
            onClick={!loading ? onClose : undefined}
            disabled={loading}
            className="absolute right-4 top-4 p-2 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-xl transition-colors disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 pt-2 flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 mb-4">
            <AlertTriangle size={32} />
          </div>
          <h2 className="text-xl font-semibold text-zinc-100 mb-2">Delete Inventory Item?</h2>
          <p className="text-sm text-zinc-400 mb-6">
            Are you sure you want to delete <span className="font-semibold text-zinc-200">"{product?.name}"</span>? This action cannot be undone.
          </p>
          
          <div className="flex items-center gap-3 w-full">
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-sm font-medium rounded-xl transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold rounded-xl transition-colors shadow-lg shadow-red-500/20 disabled:opacity-50"
            >
              {loading ? <Loader size={16} className="animate-spin" /> : <Trash2 size={16} />}
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InventoryDeleteModal;