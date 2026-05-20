import React, { useCallback, useMemo, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import DashboardLayout from "../../components/layout/DashboardLayout";
import ProductTable from "../../components/products/ProductTable";
import ProductModal from "../../components/products/ProductModal";
import {
  Plus,
  Search,
  Package,
  Layers,
  Store,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { toast } from "react-hot-toast";
import {
  useProducts,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
} from "../../hooks/useProducts";

// stat card loading skeleton
function StatCardSkeleton() {
  return (
    <div
      className={`
        flex flex-col bg-zinc-900 border border-zinc-800 p-4 sm:p-5 rounded-xl shadow 
        min-w-[150px] animate-pulse
      `}
    >
      <div className="flex items-center mb-3 space-x-3">
        <span className="inline-flex w-10 h-10 rounded-lg bg-zinc-800 border border-zinc-700" />
        <span className="h-5 w-12 rounded bg-zinc-800" />
      </div>
      <span className="h-3 w-24 rounded bg-zinc-800" />
    </div>
  );
}

// ConfirmDialog now accepts loading and disables delete button while deleting
function ConfirmDialog({ open, onCancel, onConfirm, productName, loading }) {
  if (!open) return null;
  return (
    <div className="fixed z-[90] top-0 left-0 w-full h-full flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-zinc-950 border border-zinc-800 rounded-lg shadow-2xl max-w-sm w-full p-6 text-zinc-100"
      >
        <h2 className="text-lg font-semibold mb-2">Delete Product</h2>
        <p className="mb-5 text-zinc-400 text-sm leading-relaxed">
          Are you sure you want to permanently delete{" "}
          <span className="font-bold text-zinc-200">{productName}</span>?
          <br />
          <span className="text-zinc-500">This action cannot be undone.</span>
        </p>
        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            className="px-4 py-2 rounded transition bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-transparent focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-600"
            onClick={onCancel}
            autoFocus
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="button"
            className={`px-4 py-2 bg-red-600 text-white font-semibold rounded hover:bg-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400 border border-red-700 transition flex items-center gap-2 disabled:opacity-60`}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading && (
              <Loader2 className="w-4 h-4 mr-1 animate-spin" />
            )}
            Delete
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, bg, fg }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 30 }}
      className={`flex flex-col bg-zinc-900 border border-zinc-800 p-4 sm:p-5 rounded-xl shadow transition min-w-[135px] ${bg} ${fg}`}
    >
      <div className="flex items-center mb-2 sm:mb-3">
        <span className="inline-flex w-9 h-9 sm:w-10 sm:h-10 items-center justify-center rounded-lg bg-zinc-800 border border-zinc-700 mr-2 sm:mr-3">
          <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
        </span>
        <span className="text-base sm:text-lg font-bold tracking-tight">{value}</span>
      </div>
      <span className="text-xs text-zinc-400 truncate">{label}</span>
    </motion.div>
  );
}

const ProductsPage = () => {
  // --- UI State ---
  const [modalOpen, setModalOpen] = useState(false);
  const [modalSubmitting, setModalSubmitting] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [search, setSearch] = useState("");

  // extra state to prevent double delete
  const [deleting, setDeleting] = useState(false);
  const lastDeleteIdRef = useRef(null);

  // --- Data/Query Setup ---
  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useProducts();

  // --- Normalize product data ---
  const products = useMemo(() => {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.products)) return data.products;
    if (Array.isArray(data?.data)) return data.data;
    return [];
  }, [data]);

  // --- Filter on search ---
  const filteredProducts = useMemo(() => {
    if (!products || !Array.isArray(products)) return [];
    const query = search?.trim().toLowerCase() || "";
    if (!query) return products;
    return products.filter((product) => {
      if (!product) return false;
      const name = product?.name?.toString().toLowerCase() || "";
      const category = product?.category?.toString().toLowerCase() || "";
      const sku = product?.sku?.toString().toLowerCase() || "";
      return (
        name.includes(query) ||
        category.includes(query) ||
        sku.includes(query)
      );
    });
  }, [products, search]);

  // --- Stats (always from full product list, not filtered) ---
  const stats = useMemo(() => {
    const total = products.length;
    const totalStock = products.reduce((sum, p) => sum + (p?.stock || 0), 0);
    const outOfStock = products.filter((p) => Number(p?.stock) === 0).length;
    const lowStock = products.filter(
      (p) => Number(p?.stock) > 0 && Number(p?.stock) <= 5
    ).length;
    return [
      {
        icon: Store,
        label: "Total Products",
        value: total,
        bg: "",
        fg: "",
      },
      {
        icon: Layers,
        label: "Units In Stock",
        value: totalStock,
        bg: "",
        fg: "",
      },
      {
        icon: Package,
        label: "Low Stock",
        value: lowStock,
        bg: "bg-yellow-950",
        fg: "text-yellow-400",
      },
      {
        icon: CheckCircle2,
        label: "Out of Stock",
        value: outOfStock,
        bg: "bg-red-950",
        fg: "text-red-400",
      },
    ];
  }, [products]);

  // --- Mutations ---
  const createMutation = useCreateProduct({
    onSuccess: () => {
      toast.success("Product created successfully.");
      refetch();
    },
    onError: (err) => {
      toast.error(
        err?.code === "P2002"
          ? "A product with this slug already exists."
          : typeof err === "string"
          ? err
          : err?.message || "Failed to create product."
      );
    },
  });

  const updateMutation = useUpdateProduct({
    onSuccess: () => {
      toast.success("Product updated successfully.");
      refetch();
    },
    onError: (err) => {
      toast.error(
        err?.code === "P2002"
          ? "A product with this slug already exists."
          : typeof err === "string"
          ? err
          : err?.message || "Failed to update product."
      );
    },
  });

  const deleteMutation = useDeleteProduct({
    onSuccess: () => {
      toast.success("Product deleted successfully.");
      // After success, always refetch once to avoid any UI ghosts
      refetch();
    },
    onError: (err) => {
      // If server responded 404, treat as already deleted: refresh, no toast
      if (
        (typeof err === "object" && err?.status === 404) ||
        (typeof err === "object" &&
          (err?.message?.toLowerCase?.()?.includes?.("not found") ||
            err?.message?.toLowerCase?.()?.includes?.("404")))
      ) {
        refetch();
        return;
      }
      toast.error(
        typeof err === "string"
          ? err
          : err?.message || "Failed to delete product."
      );
    },
  });

  // --- CRUD Handlers ---
  const handleOpenModal = useCallback(() => {
    setModalOpen(true);
    setEditingProduct(null);
  }, []);

  const handleEditClick = useCallback((product) => {
    setEditingProduct(product);
    setModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setModalOpen(false);
    setEditingProduct(null);
  }, []);

  const handleSaveProduct = async (productData) => {
    setModalSubmitting(true);
    try {
      if (editingProduct && editingProduct.id) {
        // Edit mode
        const updatePayload = {
          ...productData,
          slug:
            productData.slug && productData.slug.trim().length > 0
              ? productData.slug
              : editingProduct.slug,
        };
        if (
          updatePayload.slug !== editingProduct.slug &&
          products.some(
            (p) => p.slug === updatePayload.slug && p.id !== editingProduct.id
          )
        ) {
          toast.error("Slug must be unique. Another product uses this slug.");
          setModalSubmitting(false);
          return;
        }
        await updateMutation.mutateAsync({
          id: editingProduct.id,
          data: updatePayload,
        });
      } else {
        // Create mode
        if (
          productData.slug &&
          products.some((p) => p.slug === productData.slug)
        ) {
          toast.error("Slug must be unique. Another product uses this slug.");
          setModalSubmitting(false);
          return;
        }
        await createMutation.mutateAsync(productData);
      }
      setModalOpen(false);
      setEditingProduct(null);
    } finally {
      setModalSubmitting(false);
    }
  };

  // --- DELETE FLOW: improved to prevent multiple deletes ---
  const handleDeleteClick = useCallback(
    (productOrId) => {
      let toDelete = null;
      if (
        typeof productOrId === "string" ||
        typeof productOrId === "number"
      ) {
        toDelete = products.find((p) => String(p.id) === String(productOrId));
      } else if (productOrId && productOrId.id) {
        toDelete = productOrId;
      }
      if (!toDelete || !toDelete.id) {
        toast.error("Could not resolve product to delete.");
        return;
      }
      // Prevent new dialog if already opened for same id and deleting
      if (
        deleting &&
        deleteDialogOpen &&
        lastDeleteIdRef.current === toDelete.id
      ) {
        return;
      }
      setProductToDelete(toDelete);
      setDeleteDialogOpen(true);
    },
    [products, deleting, deleteDialogOpen]
  );

  const handleCancelDelete = () => {
    // prevent cancel while actively deleting
    if (deleting) return;
    setDeleteDialogOpen(false);
    setProductToDelete(null);
  };

  const handleConfirmDelete = async () => {
    if (!productToDelete?.id) {
      setDeleteDialogOpen(false);
      setProductToDelete(null);
      toast.error("Product ID missing for deletion.");
      return;
    }
    // Prevent duplicate requests
    if (deleting) return;
    setDeleting(true);
    lastDeleteIdRef.current = productToDelete.id;
    try {
      await deleteMutation.mutateAsync(productToDelete.id);
      // Either remove from UI state (if desired) or refetch
      // We'll use refetch to avoid race/ghost issues and ensure data is current
    } catch (err) {
      // do nothing; deleteMutation already handles toast and 404 refresh
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
      setProductToDelete(null);
      lastDeleteIdRef.current = null;
    }
  };

  // --- Product Table Props ---
  const productTableProps = {
    products: filteredProducts,
    loading: isLoading,
    onEdit: (product) => handleEditClick(product),
    onDelete: (product) => handleDeleteClick(product),
    emptyMessage: isError
      ? "Failed to load products."
      : isLoading
      ? "Loading products..."
      : search
      ? "No products match your search."
      : "No products found.",
    isError,
    error,
  };

  // --- UI Render ---
  return (
    <DashboardLayout>
      {/* Deletion Dialog */}
      <AnimatePresence>
        <ConfirmDialog
          open={deleteDialogOpen}
          onCancel={handleCancelDelete}
          onConfirm={handleConfirmDelete}
          productName={productToDelete ? productToDelete.name : ""}
          loading={deleting}
        />
      </AnimatePresence>
      <motion.div
        initial="hidden"
        animate="visible"
        exit="exit"
        variants={{
          hidden: { opacity: 0, y: 30 },
          visible: { opacity: 1, y: 0, transition: { staggerChildren: 0.06 } },
          exit: { opacity: 0, y: 30 },
        }}
        className={`
          px-0 
          sm:px-4 
          py-4 
          sm:py-6 
          max-w-full 
          md:max-w-7xl 
          mx-auto 
          w-full 
          min-h-screen
          bg-transparent
          flex flex-col
          overflow-x-hidden
        `}
      >
        {/* Header bar */}
        <div className="mb-5 sm:mb-7 w-full flex flex-col-reverse md:flex-row md:items-center md:justify-between gap-3 sm:gap-4">
          <motion.h1
            layout
            className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-100"
          >
            Products
          </motion.h1>
          <div className="flex flex-col gap-2 md:w-auto md:flex-row md:items-center md:justify-end w-full">
            <div className="flex flex-row gap-2 w-full md:w-auto">
              {/* Mobile search */}
              <div className="flex-1 min-w-0 md:hidden">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none">
                    <Search className="w-4 h-4" />
                  </span>
                  <input
                    type="search"
                    className="w-full pl-10 pr-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow text-base placeholder-zinc-500"
                    placeholder="Search products..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
              </div>
              <button
                type="button"
                className={`inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 sm:px-5 py-2 text-sm font-semibold text-white shadow hover:bg-emerald-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 disabled:opacity-60 transition whitespace-nowrap`}
                onClick={handleOpenModal}
                disabled={isLoading}
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Add Product</span>
                <span className="inline sm:hidden">Add</span>
              </button>
            </div>
          </div>
        </div>

        {/* Desktop search bar */}
        <motion.div layout className="mb-4 hidden md:flex items-center w-full">
          <div className="relative flex-1 max-w-md">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="search"
              className="w-full pl-10 pr-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow text-base placeholder-zinc-500"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              disabled={isLoading}
            />
          </div>
        </motion.div>

        {/* API error bar */}
        {isError && (
          <motion.div
            layout
            className="my-4 px-4 py-3 rounded bg-red-950 border border-red-900 text-red-300 text-sm font-medium transition"
          >
            {typeof error?.message === "string"
              ? error.message
              : "Failed to load products. Please try again or contact support."}
          </motion.div>
        )}

        {/* Stats bar - skeleton on loading */}
        <motion.div
          layout
          className={`
            mb-5
            w-full
            overflow-x-auto
            scrollbar-thin 
            scrollbar-thumb-zinc-800
            scrollbar-track-transparent
          `}
        >
          <div
            className={`
              flex 
              flex-row 
              gap-3 
              sm:gap-5
              md:gap-6
              w-full
              min-w-[340px]
              sm:grid sm:grid-cols-2 
              md:grid md:grid-cols-4
              sm:flex-none
              transition-all
            `}
          >
            <AnimatePresence>
              {isLoading
                ? [1, 2, 3, 4].map((i) => <StatCardSkeleton key={i} />)
                : stats.map((card) => (
                  <StatCard
                    key={card.label}
                    icon={card.icon}
                    label={card.label}
                    value={card.value}
                    bg={card.bg}
                    fg={card.fg}
                  />
                ))}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Product Table (improved outer container) */}
        <motion.div
          layout
          className={`
            rounded-xl 
            overflow-x-auto
            bg-zinc-950
            border border-zinc-900
            shadow
            p-0
            flex-1
            scrollbar-thin scrollbar-thumb-zinc-900 scrollbar-track-transparent
            min-h-[342px]
            max-w-full
            transition
          `}
          style={{
            WebkitOverflowScrolling: "touch",
          }}
        >
          <div className="min-w-[410px] sm:min-w-0">
            <ProductTable {...productTableProps} />
          </div>
        </motion.div>

        {/* Product modal (create/edit) */}
        <AnimatePresence>
          {modalOpen && (
            <ProductModal
              open={modalOpen}
              onClose={handleCloseModal}
              onCreate={handleSaveProduct}
              loading={
                modalSubmitting ||
                createMutation.isLoading ||
                updateMutation.isLoading
              }
              initialValues={editingProduct || undefined}
              mode={editingProduct ? "edit" : "create"}
            />
          )}
        </AnimatePresence>
      </motion.div>
    </DashboardLayout>
  );
};

export default ProductsPage;