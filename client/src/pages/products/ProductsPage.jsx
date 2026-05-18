import React, { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import DashboardLayout from "../../components/layout/DashboardLayout";
import ProductTable from "../../components/products/ProductTable";
import ProductModal from "../../components/products/ProductModal";
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct
} from "../../api/productApi";
import {
  Plus,
  Search,
  Package,
  Layers,
  Store,
  CheckCircle2
} from "lucide-react";
import { toast } from "react-hot-toast";

// Confirm deletion dialog (simple inline component)
function ConfirmDialog({ open, onCancel, onConfirm, productName }) {
  if (!open) return null;
  return (
    <div className="fixed z-30 inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm transition">
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.97 }}
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

// Statistics card helper
function StatCard({ icon: Icon, label, value, bg, fg }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 30 }}
      className={`flex flex-col bg-zinc-900 border border-zinc-800 p-5 rounded-xl shadow transition ${bg} ${fg} min-w-[160px]`}
    >
      <div className="flex items-center mb-3">
        <span className="inline-flex w-10 h-10 items-center justify-center rounded-lg bg-zinc-800 border border-zinc-700 mr-3">
          <Icon className="w-5 h-5" />
        </span>
        <span className="text-lg font-bold tracking-tight">{value}</span>
      </div>
      <span className="text-xs text-zinc-400">{label}</span>
    </motion.div>
  );
}

const ProductsPage = () => {
  // State
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalSubmitting, setModalSubmitting] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null); // null for create mode
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [search, setSearch] = useState("");
  const [filtered, setFiltered] = useState([]);
  const [refreshFlag, setRefreshFlag] = useState(0);

  // Fetch products
  const fetchProducts = useCallback(async () => {
    setProductsLoading(true);
    setProductsError(null);
    try {
      const response = await getProducts();
      setProducts(response.products || []);
    } catch (err) {
      setProductsError(
        typeof err === "string"
          ? err
          : err?.message || "Failed to load products."
      );
      toast.error(err?.message || "Failed to load products.");
    } finally {
      setProductsLoading(false);
    }
  }, []);

  // Load products on mount and when refreshFlag changes
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts, refreshFlag]);

  // Search filter effect
  useEffect(() => {
    const q = search.trim().toLowerCase();
    if (!q) {
      setFiltered(products);
    } else {
      setFiltered(
        products.filter(
          (item) =>
            item.name?.toLowerCase().includes(q) ||
            item.sku?.toLowerCase().includes(q) ||
            item.category?.toLowerCase().includes(q)
        )
      );
    }
  }, [products, search]);

  // Statistics
  const stats = useMemo(() => {
    const total = products.length;
    const totalStock = products.reduce((sum, p) => sum + (p.stock || 0), 0);
    const outOfStock = products.filter((p) => p.stock === 0).length;
    const lowStock = products.filter((p) => p.stock > 0 && p.stock <= 5).length;
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

  // ------------ Modal and CRUD Handlers ------------

  // Open modal for create
  const handleOpenModal = useCallback(() => {
    setModalOpen(true);
    setEditingProduct(null);
  }, []);

  // Open modal for edit
  const handleEditClick = useCallback(
    (product) => {
      setEditingProduct(product);
      setModalOpen(true);
    },
    []
  );

  // Close modal and reset editing
  const handleCloseModal = useCallback(() => {
    setModalOpen(false);
    setEditingProduct(null);
  }, []);

  // Unified save handler for both create and update
  const handleSaveProduct = async (productData) => {
    setModalSubmitting(true);
    try {
      let updatedProduct = null;

      // Detect if editing mode (Prisma/Postgres: editingProduct?.id)
      if (editingProduct && editingProduct.id) {
        // Editing product (use PUT/updateProduct, preserve slug)
        const prevProducts = products;
        // Preserve slug: if not provided, fallback to existing
        const updatePayload = {
          ...productData,
          slug:
            productData.slug && productData.slug.trim().length > 0
              ? productData.slug
              : editingProduct.slug
        };

        // Check for duplicate slug creation (only if changed)
        if (
          updatePayload.slug !== editingProduct.slug &&
          products.some(
            (p) =>
              p.slug === updatePayload.slug &&
              p.id !== editingProduct.id
          )
        ) {
          toast.error("Slug must be unique. Another product uses this slug.");
          setModalSubmitting(false);
          return;
        }

        // Optimistic update
        setProducts((curr) =>
          curr.map((p) => (p.id === editingProduct.id ? { ...p, ...updatePayload } : p))
        );
        try {
          // Product update: Prisma expects id, API must use PUT
          updatedProduct = await updateProduct(editingProduct.id, updatePayload);
          setProducts((curr) =>
            curr.map((p) =>
              p.id === editingProduct.id ? { ...p, ...updatedProduct } : p
            )
          );
          toast.success("Product updated successfully.");
        } catch (err) {
          setProducts(prevProducts); // rollback UI
          toast.error(
            // Prisma error could be unique constraint error here
            err?.code === "P2002"
              ? "A product with this slug already exists."
              : typeof err === "string"
              ? err
              : err?.message || "Failed to update product."
          );
        }
      } else {
        // Creating new product (use POST/createProduct, check slug)
        // Prevent duplicate slug error before API call
        if (
          productData.slug &&
          products.some((p) => p.slug === productData.slug)
        ) {
          toast.error("Slug must be unique. Another product uses this slug.");
          setModalSubmitting(false);
          return;
        }
        // Create new temp product (id: 'temp_' + Date.now()) for optimistic UI
        const tempId = "temp_" + Date.now();
        const newProduct = { ...productData, id: tempId };
        setProducts((curr) => [newProduct, ...curr]);
        try {
          updatedProduct = await createProduct(productData);
          setProducts((curr) =>
            curr.map((p) => (p.id === tempId ? updatedProduct : p))
          );
          toast.success("Product created successfully.");
        } catch (err) {
          setProducts((curr) => curr.filter((p) => p.id !== tempId));
          toast.error(
            err?.code === "P2002"
              ? "A product with this slug already exists."
              : typeof err === "string"
              ? err
              : err?.message || "Failed to create product."
          );
        }
      }
      setModalOpen(false);
      setEditingProduct(null);
      setRefreshFlag((f) => f + 1);
    } finally {
      setModalSubmitting(false);
    }
  };

  // Confirm delete UI/flow trigger
  const handleDeleteClick = useCallback(
    (productOrId) => {
      let productObj = null;
      if (typeof productOrId === "string" || typeof productOrId === "number") {
        productObj = products.find(
          (p) => String(p.id) === String(productOrId)
        );
      } else if (productOrId && productOrId.id) {
        productObj = productOrId;
      }
      if (!productObj || !productObj.id) {
        toast.error("Could not resolve product to delete.");
        return;
      }
      setProductToDelete(productObj);
      setDeleteDialogOpen(true);
    },
    [products]
  );

  // ConfirmDialog - Cancel
  const handleCancelDelete = () => {
    setDeleteDialogOpen(false);
    setProductToDelete(null);
  };

  // ConfirmDialog - Confirm deletion and perform
  const handleConfirmDelete = async () => {
    if (!productToDelete?.id) {
      setDeleteDialogOpen(false);
      setProductToDelete(null);
      toast.error("Product ID missing for deletion.");
      return;
    }
    const deletedId = productToDelete.id;
    const prevProducts = products;
    // Optimistically remove from UI
    setProducts((curr) => curr.filter((p) => p.id !== deletedId));
    setDeleteDialogOpen(false);
    setProductToDelete(null);
    try {
      // Call deleteProduct with Prisma product.id
      await deleteProduct(deletedId);
      setRefreshFlag((f) => f + 1);
      toast.success("Product deleted successfully.");
    } catch (err) {
      setProducts(prevProducts);
      toast.error(
        typeof err === "string"
          ? err
          : err?.message || "Failed to delete product."
      );
    }
  };

  // ------------------ UI Layout -------------------

  return (
    <DashboardLayout>
      {/* Confirm delete dialog */}
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
        className="px-4 py-8 max-w-7xl mx-auto w-full"
      >
        {/* Header section */}
        <div className="mb-6 flex flex-col-reverse gap-4 md:flex-row md:items-center md:justify-between">
          <motion.h1
            layout
            className="text-3xl font-extrabold tracking-tight text-zinc-100"
          >
            Products
          </motion.h1>
          <div className="w-full flex flex-col gap-2 md:w-auto md:flex-row md:items-center md:justify-end">
            <div className="flex flex-row gap-2 w-full">
              <div className="flex-1 md:hidden">
                <div className="relative flex-1 max-w-md">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none">
                    <Search className="w-4 h-4" />
                  </span>
                  <input
                    type="search"
                    className="w-full pl-10 pr-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow"
                    placeholder="Search products..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </div>
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow hover:bg-emerald-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 disabled:opacity-60 transition"
                onClick={handleOpenModal}
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Add Product</span>
                <span className="inline sm:hidden">Add</span>
              </button>
            </div>
          </div>
        </div>

        {/* For >= md, search bar is shown below header */}
        <motion.div
          layout
          className="mb-4 hidden md:flex items-center"
        >
          <div className="relative flex-1 max-w-md">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="search"
              className="w-full pl-10 pr-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </motion.div>

        {/* Statistics Cards */}
        <motion.div
          layout
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5 mb-7"
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
        </motion.div>

        {/* Product Table */}
        <motion.div layout className="rounded-xl transition">
          <ProductTable
            products={filtered}
            loading={productsLoading}
            onEdit={handleEditClick}
            onDelete={handleDeleteClick}
            emptyMessage={
              productsLoading
                ? "Loading products..."
                : search
                ? "No products match your search."
                : "No products found."
            }
          />
        </motion.div>

        {/* Product Modal */}
        <AnimatePresence>
          {modalOpen && (
            <ProductModal
              open={modalOpen}
              onClose={handleCloseModal}
              onCreate={handleSaveProduct}
              loading={modalSubmitting}
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