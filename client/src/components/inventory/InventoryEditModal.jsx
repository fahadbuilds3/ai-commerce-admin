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
        className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-full"
      >

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-700 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-200 bg-amber-50 text-amber-600 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-400">
              <Edit2 size={20} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-950 dark:text-white">Edit Inventory</h2>
              <p className="text-xs text-slate-600 dark:text-slate-400">Update stock and product details</p>
            </div>
          </div>
          <button 
            onClick={!loading ? onClose : undefined}
            disabled={loading}
            className="icon-button rounded-xl"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col min-h-0">
          {/* Body */}
          <div className="p-6 space-y-5 overflow-y-auto min-h-0 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-slate-100 dark:bg-slate-800 [&::-webkit-scrollbar-thumb]:rounded-full">
            
            {/* Image Preview & Name */}
            <div className="flex items-center gap-4 mb-2">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={formData.name || "Product image"}
                  className="w-16 h-16 rounded-xl object-cover bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0"
                />
              ) : (
                <div className="w-16 h-16 rounded-xl bg-slate-100 dark:bg-slate-800/50 flex items-center justify-center border border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 shrink-0">
                  <Package size={24} />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Product Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="control-input px-4"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-2">
                <Archive size={14} className="text-slate-600 dark:text-slate-400" />
                Stock Quantity
              </label>
              <input
                type="number"
                name="stock"
                min="0"
                value={formData.stock}
                onChange={handleChange}
                required
                className="control-input px-4"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-2">
                <DollarSign size={14} className="text-slate-600 dark:text-slate-400" />
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
                className="control-input px-4"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-2">
                <Hash size={14} className="text-slate-600 dark:text-slate-400" />
                SKU
              </label>
              <input
                type="text"
                name="sku"
                value={formData.sku}
                onChange={handleChange}
                required
                className="control-input px-4"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-2">
                <Tag size={14} className="text-slate-600 dark:text-slate-400" />
                Category
              </label>
              <input
                type="text"
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
                className="control-input px-4"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="p-5 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="btn btn-secondary px-5"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary px-5"
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
