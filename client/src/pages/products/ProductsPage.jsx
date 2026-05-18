import React, { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import DashboardLayout from "../../components/layout/DashboardLayout";
import ProductTable from "../../components/products/ProductTable";
import ProductModal from "../../components/products/ProductModal";
import {
  getProducts,
  createProduct,
} from "../../api/productApi";
import { Plus, Search, Package, Layers, Store, CheckCircle2, Loader2 } from "lucide-react";

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
  const [modalOpen, setModalOpen] = useState(false); // <- USE setModalOpen TO CLOSE MODAL
  const [modalSubmitting, setModalSubmitting] = useState(false);
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
    } finally {
      setProductsLoading(false);
    }
  }, []);

  // Refresh on mount and after create
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

  // Products statistics
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

  // Modal handlers
  const handleOpenModal = () => setModalOpen(true);
  const handleCloseModal = () => setModalOpen(false);

  // Create product
  const handleCreateProduct = async (productData) => {
    try {
      console.log(productData);

      const response = await createProduct(productData);

      console.log(response);

      await fetchProducts();

      setModalOpen(false);
    } catch (error) {
      console.error(error);

      console.log(
        error.response?.data
      );
    }
  };

  // Responsive/Animated layout
  return (
    <DashboardLayout>
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
        <div className="mb-6 flex flex-col-reverse md:flex-row md:items-center md:justify-between gap-4">
          <motion.h1
            layout
            className="text-3xl font-extrabold tracking-tight text-zinc-100"
          >
            Products
          </motion.h1>
          <motion.div layout className="flex items-center justify-end gap-3">
            <button
              className="bg-emerald-600 hover:bg-emerald-500 transition px-5 py-2 rounded-lg font-semibold text-zinc-100 flex items-center gap-2 shadow"
              onClick={handleOpenModal}
            >
              <Plus className="w-4 h-4" /> Add Product
            </button>
          </motion.div>
        </div>

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

        {/* Search Bar */}
        <motion.div layout className="mb-4 flex items-center">
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

        {/* Product Table */}
        <motion.div
          layout
          className="rounded-xl transition"
        >
          <ProductTable
            products={filtered}
            loading={productsLoading}
            // onEdit, onDelete to be implemented as needed
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
              onCreate={handleCreateProduct}
              loading={modalSubmitting}
              // initialValues can be omitted for create
            />
          )}
        </AnimatePresence>
      </motion.div>
    </DashboardLayout>
  );
};

export default ProductsPage;