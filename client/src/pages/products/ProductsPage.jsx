import React, { useCallback, useMemo, useState } from "react";
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
} from "lucide-react";
import { toast } from "react-hot-toast";
import {
  useProducts,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
} from "../../hooks/useProducts";

// Confirm deletion dialog
function ConfirmDialog({ open, onCancel, onConfirm, productName }) {
  if (!open) return null;
  return (
    <div className="fixed z-30 inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-zinc-900 border border-zinc-800 rounded-lg shadow-lg max-w-sm w-full p-6 text-zinc-100"
      >
        <h2 className="text-lg font-semibold mb-2">Delete Product</h2>
        <p className="mb-4">
          Are you sure you want to permanently delete{" "}
          <span className="font-bold">{productName}</span>?
          <br />
          This action cannot be undone.
        </p>
        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            className="px-4 py-2 bg-zinc-700 text-zinc-200 rounded hover:bg-zinc-600 transition"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            type="button"
            className="px-4 py-2 bg-red-600 text-white font-semibold rounded hover:bg-red-700 transition"
            onClick={onConfirm}
          >
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
      className={`flex flex-col bg-zinc-900 border border-zinc-800 p-4 sm:p-5 rounded-xl shadow transition ${bg} ${fg} min-w-[150px]`}
    >
      <div className="flex items-center mb-2 sm:mb-3">
        <span className="inline-flex w-9 h-9 sm:w-10 sm:h-10 items-center justify-center rounded-lg bg-zinc-800 border border-zinc-700 mr-2 sm:mr-3">
          <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
        </span>
        <span className="text-base sm:text-lg font-bold tracking-tight">{value}</span>
      </div>
      <span className="text-xs sm:text-xs text-zinc-400">{label}</span>
    </motion.div>
  );
}

const ProductsPage = () => {
  // UI State (NO old manual product state, React Query is source of truth)
  const [modalOpen, setModalOpen] = useState(false);
  const [modalSubmitting, setModalSubmitting] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [search, setSearch] = useState("");

  // --- React Query: single source of truth for products ---
  // Data from backend is expected in normalized format: { ids: [], byId: {} }
  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useProducts();

  // Normalize to product array
  const products = useMemo(() => {
    console.log("[ProductsPage] products from query:", data);
  
    if (Array.isArray(data)) {
      return data;
    }
  
    if (Array.isArray(data?.products)) {
      return data.products;
    }
  
    if (Array.isArray(data?.data)) {
      return data.data;
    }
  
    return [];
  }, [data]);

  // Filtered products using memoized search
  const filteredProducts = useMemo(() => {
    // Defensive log for debug
    console.log("[ProductsPage] products (for filtering):", products);
    console.log("[ProductsPage] search input:", search);

    if (!products || !Array.isArray(products)) {
      console.warn("[ProductsPage] products is not an array, returning empty array for filteredProducts.");
      return [];
    }

    const query = search?.trim().toLowerCase() || "";

    let result;

    if (query === "") {
      result = products;
      console.log("[ProductsPage] filteredProducts (no search):", result);
      return result;
    }

    result = products.filter((product) => {
      // Defensive: product may be null/undefined
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

    console.log("[ProductsPage] filteredProducts (with search):", result);
    return result;
  }, [products, search]);

  // For debugging: log what is passed to ProductTable
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
  };
  console.log("[ProductsPage] ProductTable props:", productTableProps);

  // --- Stats computation (use filteredProducts for view stats, or all products for global) ---
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

  // Mutations (preserved)
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
      refetch();
    },
    onError: (err) => {
      toast.error(
        typeof err === "string"
          ? err
          : err?.message || "Failed to delete product."
      );
    },
  });

  // --- CRUD Handlers (NO products setter, use React Query data directly) ---

  // Open create modal
  const handleOpenModal = useCallback(() => {
    setModalOpen(true);
    setEditingProduct(null);
  }, []);

  // Open edit modal for given product
  const handleEditClick = useCallback((product) => {
    setEditingProduct(product);
    setModalOpen(true);
  }, []);

  // Close modal
  const handleCloseModal = useCallback(() => {
    setModalOpen(false);
    setEditingProduct(null);
  }, []);

  // Create or update a product
  const handleSaveProduct = async (productData) => {
    setModalSubmitting(true);
    try {
      // Client-side unique slug validation before mutation
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

  // Delete dialog open
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
      setProductToDelete(toDelete);
      setDeleteDialogOpen(true);
    },
    [products]
  );

  // Cancel product deletion
  const handleCancelDelete = () => {
    setDeleteDialogOpen(false);
    setProductToDelete(null);
  };

  // Confirm deletion, actually delete via React Query
  const handleConfirmDelete = async () => {
    if (!productToDelete?.id) {
      setDeleteDialogOpen(false);
      setProductToDelete(null);
      toast.error("Product ID missing for deletion.");
      return;
    }
    setDeleteDialogOpen(false);
    setProductToDelete(null);
    await deleteMutation.mutateAsync(productToDelete.id);
  };

  // --- UI / Render ---
  return (
    <DashboardLayout>
      {/* Deletion Dialog */}
      <AnimatePresence>
        <ConfirmDialog
          open={deleteDialogOpen}
          onCancel={handleCancelDelete}
          onConfirm={handleConfirmDelete}
          productName={productToDelete ? productToDelete.name : ""}
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
        className="
          px-2 
          sm:px-4 
          py-6 
          sm:py-8 
          max-w-full 
          md:max-w-7xl 
          mx-auto 
          w-full 
          min-h-screen
          overflow-x-hidden
        "
      >
        {/* Header and search add bar */}
        <div className="mb-5 sm:mb-6 flex flex-col-reverse gap-3 sm:gap-4 md:flex-row md:items-center md:justify-between">
          <motion.h1
            layout
            className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-100"
          >
            Products
          </motion.h1>
          <div className="w-full flex flex-col gap-2 md:w-auto md:flex-row md:items-center md:justify-end">
            <div className="flex flex-row gap-2 w-full">
              {/* Mobile search */}
              <div className="flex-1 md:hidden">
                <div className="relative flex-1 max-w-full">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none">
                    <Search className="w-4 h-4" />
                  </span>
                  <input
                    type="search"
                    className="w-full pl-10 pr-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow text-base"
                    placeholder="Search products..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
              </div>
              {/* Add Button */}
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 sm:px-5 py-2 text-sm font-semibold text-white shadow hover:bg-emerald-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 disabled:opacity-60 transition whitespace-nowrap"
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
        <motion.div layout className="mb-4 hidden md:flex items-center">
          <div className="relative flex-1 max-w-md">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="search"
              className="w-full pl-10 pr-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow text-base"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              disabled={isLoading}
            />
          </div>
        </motion.div>

        {/* API error message */}
        {isError && (
          <div className="my-4 px-4 py-3 rounded bg-red-900/90 border border-red-800 text-red-300 text-sm font-medium">
            {typeof error?.message === "string"
              ? error.message
              : "Failed to load products. Please try again or contact support."}
          </div>
        )}

        {/* Statistics cards */}
        <motion.div
          layout
          className="
            mb-5
            sm:mb-7
            w-full 
            overflow-x-auto
            scrollbar-thin 
            scrollbar-thumb-zinc-800
            scrollbar-track-transparent
          "
        >
          <div
            className="
              flex 
              flex-row 
              gap-3 
              sm:gap-5
              md:gap-6
              w-full
              min-w-[320px]
              sm:grid sm:grid-cols-2 
              md:grid md:grid-cols-4
              sm:flex-none
            "
          >
            <AnimatePresence>
              {stats.map((card) => (
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

        {/* Product Table */}
        <motion.div
          layout
          className="
            rounded-xl 
            transition
            overflow-x-auto 
            bg-zinc-900 
            border border-zinc-800 
            shadow
            pb-2
          "
        >
          <div className="min-w-[500px] sm:min-w-0">
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