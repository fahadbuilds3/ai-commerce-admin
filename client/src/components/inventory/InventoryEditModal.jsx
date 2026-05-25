import React, { useState, useEffect } from "react";
import { X, Edit2, Archive, Loader, DollarSign, Tag, Hash, Package } from "lucide-react";
import * as inventoryApi from "../../api/inventoryApi";
import { toast } from "../../utils/toast";

const InventoryEditModal = ({ isOpen, onClose, item, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    stock: 0,
    price: 0,
    sku: "",
    category: "",
  });

  const id = item?.id;

  useEffect(() => {
    if (!item) return;
    const product = item?.product || item;

    setFormData({
      name: product?.name ?? "",
      stock: Number(item?.stock ?? 0) || 0,
      price: Number(product?.price ?? 0) || 0,
      sku: product?.sku ?? "",
      category: product?.category ?? "",
    });
  }, [item]);

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
  if (!id) return null;

  const product = item?.product || item;
  const imageUrl =
    product?.images?.[0]?.url ||
    item?.images?.[0]?.url ||
    item?.imageUrl;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "stock" || name === "price" ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const safeStock = Number(formData?.stock ?? 0) || 0;
    const safePrice = Number(formData?.price ?? 0) || 0;

    if (safeStock < 0) return toast.error("Stock cannot be negative");
    if (safePrice < 0) return toast.error("Price cannot be negative");

    try {
      setLoading(true);
      const payload = {
        name: formData?.name ?? "",
        sku: formData?.sku ?? "",
        category: formData?.category ?? "",
        stock: safeStock,
        price: safePrice,
      };

      await inventoryApi.updateInventoryItem(id, payload);
      toast.success("Inventory updated successfully");
      onSuccess?.();
      onClose?.();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to update inventory");
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

      <div
        className="relative w-full max-w-md bg-zinc-900 border border-zinc-800/80 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-full"
      >

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-zinc-800/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Edit2 size={20} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-zinc-100">Edit Inventory</h2>
              <p className="text-xs text-zinc-400">Update stock and product details</p>
            </div>
          </div>
          <button 
            onClick={!loading ? onClose : undefined}
            disabled={loading}
            className="p-2 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-xl transition-colors disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col min-h-0">
          {/* Body */}
          <div className="p-6 space-y-5 overflow-y-auto min-h-0 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-zinc-800 [&::-webkit-scrollbar-thumb]:rounded-full">
            
            {/* Image Preview & Name */}
            <div className="flex items-center gap-4 mb-2">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={formData.name || "Product image"}
                  className="w-16 h-16 rounded-xl object-cover bg-zinc-800 border border-zinc-700/50 shrink-0"
                />
              ) : (
                <div className="w-16 h-16 rounded-xl bg-zinc-800/50 flex items-center justify-center border border-zinc-700/50 text-zinc-600 shrink-0">
                  <Package size={24} />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                  Product Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5 flex items-center gap-2">
                <Archive size={14} className="text-zinc-400" />
                Stock Quantity
              </label>
              <input
                type="number"
                name="stock"
                min="0"
                value={formData.stock}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5 flex items-center gap-2">
                <DollarSign size={14} className="text-zinc-400" />
                Unit Price ($)
              </label>
              <input
                type="number"
                name="price"
                min="0"
                step="0.01"
                value={formData.price}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5 flex items-center gap-2">
                <Hash size={14} className="text-zinc-400" />
                SKU
              </label>
              <input
                type="text"
                name="sku"
                value={formData.sku}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5 flex items-center gap-2">
                <Tag size={14} className="text-zinc-400" />
                Category
              </label>
              <input
                type="text"
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="p-5 border-t border-zinc-800/80 bg-zinc-950/50 flex justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-sm font-medium rounded-xl transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-amber-950 text-sm font-semibold rounded-xl transition-colors shadow-lg shadow-amber-500/20 disabled:opacity-50"
            >
              {loading && <Loader size={16} className="animate-spin" />}
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InventoryEditModal;