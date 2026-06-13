import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "react-hot-toast";
import {
  AlertTriangle,
  ArrowDownUp,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Eye,
  ImageOff,
  Loader2,
  Package,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Trash2,
  X,
} from "lucide-react";
import ProductModal from "../../components/products/ProductModal";
import {
  useCreateProduct,
  useDeleteProduct,
  useProducts,
  useUpdateProduct,
} from "../../hooks/useProducts";

const PAGE_SIZE = 10;
const STATUS_OPTIONS = ["ACTIVE", "DRAFT", "OUT_OF_STOCK"];
const SORT_OPTIONS = [
  { value: "newest", label: "Newest first" },
  { value: "name_asc", label: "Name A-Z" },
  { value: "price_desc", label: "Highest price" },
  { value: "price_asc", label: "Lowest price" },
  { value: "stock_asc", label: "Lowest stock" },
];

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

function asNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function formatCurrency(value) {
  return currencyFormatter.format(asNumber(value, 0));
}

function safeText(value, fallback = "N/A") {
  if (value === null || value === undefined) return fallback;
  const text = String(value).trim();
  return text || fallback;
}

function normalizeStatus(product) {
  const status = typeof product?.status === "string" ? product.status.toUpperCase() : "ACTIVE";
  if (asNumber(product?.stock) === 0) return "OUT_OF_STOCK";
  return STATUS_OPTIONS.includes(status) ? status : "ACTIVE";
}

function formatStatus(status) {
  return safeText(status, "Active")
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getProductImage(product) {
  return typeof product?.imageUrl === "string" ? product.imageUrl : "";
}

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function getPageNumbers(currentPage, pageCount) {
  if (pageCount <= 7) return Array.from({ length: pageCount }, (_, index) => index + 1);

  const pages = new Set([1, pageCount, currentPage]);
  if (currentPage > 2) pages.add(currentPage - 1);
  if (currentPage < pageCount - 1) pages.add(currentPage + 1);
  if (currentPage <= 3) {
    pages.add(2);
    pages.add(3);
  }
  if (currentPage >= pageCount - 2) {
    pages.add(pageCount - 1);
    pages.add(pageCount - 2);
  }

  const sorted = [...pages].filter((page) => page > 0 && page <= pageCount).sort((a, b) => a - b);
  return sorted.reduce((acc, page, index) => {
    if (index > 0 && page - sorted[index - 1] > 1) acc.push("ellipsis");
    acc.push(page);
    return acc;
  }, []);
}

function useDebouncedValue(value, delay = 250) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setDebouncedValue(value), delay);
    return () => window.clearTimeout(timeoutId);
  }, [value, delay]);

  return debouncedValue;
}

function useScrollLock(locked) {
  useEffect(() => {
    if (!locked) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [locked]);
}

function ProductImage({ product, size = "md" }) {
  const [failed, setFailed] = useState(false);
  const imageUrl = getProductImage(product);
  const dimensions = size === "sm" ? "h-10 w-10" : "h-12 w-12";

  if (!imageUrl || failed) {
    return (
      <div className={classNames("flex shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400", dimensions)}>
        <ImageOff className="h-5 w-5" />
      </div>
    );
  }

  return (
    <img
      src={imageUrl}
      alt=""
      loading="lazy"
      className={classNames("shrink-0 rounded-lg border border-slate-200 bg-slate-50 object-cover dark:border-slate-700 dark:bg-slate-800", dimensions)}
      onError={() => setFailed(true)}
    />
  );
}

function IconButton({ label, className, children, disabled, ...props }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      className={classNames(
        "icon-button",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

function StatusBadge({ product }) {
  const status = normalizeStatus(product);
  const styles = {
    ACTIVE: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-200",
    DRAFT: "border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-600 dark:bg-slate-700/70 dark:text-slate-300",
    OUT_OF_STOCK: "border-red-200 bg-red-50 text-red-700 dark:border-red-500/25 dark:bg-red-500/10 dark:text-red-200",
  };

  return (
    <span className={classNames("inline-flex min-w-[92px] justify-center rounded-full border px-2.5 py-1 text-xs font-medium", styles[status])}>
      {formatStatus(status)}
    </span>
  );
}

function StatCard({ label, value, icon: Icon, loading, tone = "zinc" }) {
  const tones = {
    emerald: "text-emerald-700 bg-emerald-50 border-emerald-200 dark:text-emerald-300 dark:bg-emerald-500/10 dark:border-emerald-500/20",
    amber: "text-amber-700 bg-amber-50 border-amber-200 dark:text-amber-300 dark:bg-amber-500/10 dark:border-amber-500/20",
    red: "text-red-700 bg-red-50 border-red-200 dark:text-red-300 dark:bg-red-500/10 dark:border-red-500/20",
    sky: "text-sky-700 bg-sky-50 border-sky-200 dark:text-sky-300 dark:bg-sky-500/10 dark:border-sky-500/20",
    zinc: "text-slate-600 bg-slate-50 border-slate-200 dark:text-slate-300 dark:bg-slate-800 dark:border-slate-700",
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</p>
          {loading ? (
            <div className="mt-3 h-7 w-20 animate-pulse rounded bg-slate-100 dark:bg-slate-700" />
          ) : (
            <p className="mt-2 text-xl font-semibold text-slate-950 dark:text-white">{value}</p>
          )}
        </div>
        <div className={classNames("rounded-xl border p-2.5", tones[tone])}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

function ProductsStats({ products, loading }) {
  const stats = useMemo(() => {
    const list = Array.isArray(products) ? products : [];
    const lowStock = list.filter((product) => asNumber(product?.stock) > 0 && asNumber(product?.stock) <= 5).length;
    const outOfStock = list.filter((product) => asNumber(product?.stock) === 0).length;
    const stockValue = list.reduce((sum, product) => sum + asNumber(product?.price) * asNumber(product?.stock), 0);
    return {
      total: list.length,
      stock: list.reduce((sum, product) => sum + asNumber(product?.stock), 0),
      lowStock,
      outOfStock,
      stockValue,
    };
  }, [products]);

  return (
    <div className="mb-6 grid grid-cols-2 gap-3 xl:grid-cols-5">
      <StatCard label="Products" value={stats.total} icon={Package} loading={loading} />
      <StatCard label="Units" value={stats.stock} icon={CheckCircle2} loading={loading} tone="sky" />
      <StatCard label="Low stock" value={stats.lowStock} icon={AlertTriangle} loading={loading} tone="amber" />
      <StatCard label="Out of stock" value={stats.outOfStock} icon={ImageOff} loading={loading} tone="red" />
      <StatCard label="Stock value" value={formatCurrency(stats.stockValue)} icon={Package} loading={loading} tone="emerald" />
    </div>
  );
}

function SelectControl({ label, icon: Icon, value, onChange, children, disabled }) {
  return (
    <label className="flex min-w-0 flex-col gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-400">
      <span>{label}</span>
      <span className="relative">
        {Icon && <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-400" />}
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          disabled={disabled}
          className={classNames(
            "control-select pr-8",
            Icon ? "pl-9" : "pl-3"
          )}
        >
          {children}
        </select>
      </span>
    </label>
  );
}

function ProductsToolbar({
  search,
  onSearchChange,
  status,
  onStatusChange,
  category,
  onCategoryChange,
  categories,
  sortBy,
  onSortChange,
  onClearFilters,
  hasFilters,
  loading,
}) {
  return (
    <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="grid gap-3 xl:grid-cols-[minmax(240px,1fr)_170px_180px_180px_auto] xl:items-end">
        <label className="flex min-w-0 flex-col gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-400">
          <span>Search products</span>
          <span className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-400" />
            <input
              type="search"
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              disabled={loading}
              className="control-input pl-9"
              placeholder="Search name, SKU, or category"
              autoComplete="off"
            />
          </span>
        </label>

        <SelectControl label="Status" icon={SlidersHorizontal} value={status} onChange={onStatusChange} disabled={loading}>
          <option value="ALL">All statuses</option>
          {STATUS_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {formatStatus(option)}
            </option>
          ))}
        </SelectControl>

        <SelectControl label="Category" icon={SlidersHorizontal} value={category} onChange={onCategoryChange} disabled={loading}>
          <option value="ALL">All categories</option>
          {categories.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </SelectControl>

        <SelectControl label="Sort" icon={ArrowDownUp} value={sortBy} onChange={onSortChange} disabled={loading}>
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </SelectControl>

        <button
          type="button"
          onClick={onClearFilters}
          disabled={!hasFilters || loading}
          className="btn btn-secondary"
        >
          Clear filters
        </button>
      </div>
    </div>
  );
}

function FilterChip({ label, value, onClear }) {
  return (
    <span className="inline-flex max-w-full items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
      <span className="truncate">
        <span className="text-slate-500 dark:text-slate-400">{label}:</span> {value}
      </span>
      <button
        type="button"
        onClick={onClear}
        className="rounded-full text-slate-500 transition hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30 dark:text-slate-400 dark:hover:text-white"
        aria-label={`Clear ${label}`}
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </span>
  );
}

function TableSkeleton({ rows = PAGE_SIZE }) {
  return (
    <div className="surface-card overflow-hidden">
      <div className="min-w-[1040px]">
        <div className="grid grid-cols-[0.7fr_1.5fr_1fr_1fr_0.9fr_0.8fr_1fr_0.8fr] gap-4 border-b border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-800/70">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="h-3 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
          ))}
        </div>
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div
            key={rowIndex}
            className="grid grid-cols-[0.7fr_1.5fr_1fr_1fr_0.9fr_0.8fr_1fr_0.8fr] gap-4 border-b border-slate-100 px-4 py-4 last:border-b-0 dark:border-slate-800"
          >
            {Array.from({ length: 8 }).map((_, cellIndex) => (
              <div key={cellIndex} className="h-4 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function EmptyState({ filtered, onCreate }) {
  return (
    <div className="surface-card px-6 py-16 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
        <Package className="h-7 w-7" />
      </div>
      <h2 className="mt-5 text-lg font-semibold text-slate-950 dark:text-white">
        {filtered ? "No matching products" : "No products yet"}
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-slate-500 dark:text-slate-400">
        {filtered
          ? "Adjust your search, filters, or sorting to find products."
          : "Create your first product to start building your catalog."}
      </p>
      {!filtered && (
        <button
          type="button"
          onClick={onCreate}
        className="btn btn-primary mt-6"
        >
          <Plus className="h-4 w-4" />
          Add product
        </button>
      )}
    </div>
  );
}

function ErrorState({ message, onRetry }) {
  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-14 text-center shadow-sm dark:border-red-900/70 dark:bg-red-950/20">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl border border-red-200 bg-red-100 text-red-600 dark:border-red-900/70 dark:bg-red-950/70 dark:text-red-300">
        <AlertTriangle className="h-7 w-7" />
      </div>
      <h2 className="mt-5 text-lg font-semibold text-red-700 dark:text-red-100">Unable to load products</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-red-600 dark:text-red-200/75">
        {message || "The products endpoint did not return a usable response."}
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="btn btn-danger mt-6"
      >
        <RefreshCw className="h-4 w-4" />
        Retry
      </button>
    </div>
  );
}

function Pagination({ currentPage, pageCount, totalCount, pageSize, onPageChange }) {
  const start = totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, totalCount);
  const pages = getPageNumbers(currentPage, pageCount);

  return (
    <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800 dark:bg-slate-800/50">
      <p className="text-xs text-slate-500 dark:text-slate-400">
        Showing <span className="text-slate-700 dark:text-slate-300">{start}</span> to{" "}
        <span className="text-slate-700 dark:text-slate-300">{end}</span> of{" "}
        <span className="text-slate-700 dark:text-slate-300">{totalCount}</span> products
      </p>
      <div className="flex items-center justify-between gap-2 sm:justify-end">
        <IconButton label="First page" disabled={currentPage === 1} onClick={() => onPageChange(1)}>
          <ChevronsLeft className="h-4 w-4" />
        </IconButton>
        <IconButton label="Previous page" disabled={currentPage === 1} onClick={() => onPageChange(currentPage - 1)}>
          <ChevronLeft className="h-4 w-4" />
        </IconButton>
        <div className="hidden items-center gap-1 sm:flex">
          {pages.map((page, index) =>
            page === "ellipsis" ? (
              <span key={`ellipsis-${index}`} className="px-2 text-sm text-slate-400 dark:text-slate-500">
                ...
              </span>
            ) : (
              <button
                key={page}
                type="button"
                onClick={() => onPageChange(page)}
                className={classNames(
                  "pagination-button",
                  page === currentPage
                    ? "pagination-button-active"
                    : ""
                )}
              >
                {page}
              </button>
            )
          )}
        </div>
        <span className="text-xs text-slate-500 dark:text-slate-400 sm:hidden">
          Page {currentPage} of {pageCount}
        </span>
        <IconButton label="Next page" disabled={currentPage === pageCount} onClick={() => onPageChange(currentPage + 1)}>
          <ChevronRight className="h-4 w-4" />
        </IconButton>
        <IconButton label="Last page" disabled={currentPage === pageCount} onClick={() => onPageChange(pageCount)}>
          <ChevronsRight className="h-4 w-4" />
        </IconButton>
      </div>
    </div>
  );
}

function ProductsTable({ products, page, pageCount, totalCount, onPageChange, onView, onEdit, onDelete }) {
  return (
    <div className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="max-w-full overflow-x-auto overscroll-x-contain">
        <table className="w-full min-w-[1040px] table-fixed border-separate border-spacing-0 text-sm xl:min-w-full">
          <thead className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-800/70">
            <tr className="text-left text-xs uppercase tracking-[0.06em] text-slate-600 dark:text-slate-300">
              <th className="w-[76px] border-b border-slate-200 px-4 py-3 font-semibold dark:border-slate-700">Image</th>
              <th className="w-[30%] min-w-[260px] border-b border-slate-200 px-4 py-3 font-semibold dark:border-slate-700">Product name</th>
              <th className="w-[120px] border-b border-slate-200 px-4 py-3 font-semibold dark:border-slate-700">SKU</th>
              <th className="w-[140px] border-b border-slate-200 px-4 py-3 font-semibold dark:border-slate-700">Category</th>
              <th className="w-[120px] border-b border-slate-200 px-4 py-3 text-right font-semibold dark:border-slate-700">Price</th>
              <th className="w-[90px] border-b border-slate-200 px-4 py-3 text-right font-semibold dark:border-slate-700">Stock</th>
              <th className="w-[130px] border-b border-slate-200 px-4 py-3 font-semibold dark:border-slate-700">Status</th>
              <th className="w-[160px] border-b border-slate-200 px-4 py-3 text-right font-semibold dark:border-slate-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id} className="group transition-colors hover:bg-slate-50 odd:bg-white even:bg-slate-50/60 dark:hover:bg-slate-800/60 dark:odd:bg-slate-900 dark:even:bg-slate-900/70">
                <td className="border-b border-slate-100 px-4 py-3.5 align-middle dark:border-slate-800">
                  <ProductImage product={product} />
                </td>
                <td className="min-w-0 border-b border-slate-100 px-4 py-3.5 align-middle dark:border-slate-800">
                  <div className="min-w-0">
                    <p className="max-w-full truncate font-medium text-slate-950 dark:text-white" title={safeText(product.name)}>
                      {safeText(product.name, "Untitled product")}
                    </p>
                    <p className="mt-1 max-w-full truncate text-xs text-slate-500 dark:text-slate-400" title={safeText(product.description, "")}>
                      {safeText(product.description, "No description")}
                    </p>
                  </div>
                </td>
                <td className="truncate border-b border-slate-100 px-4 py-3.5 align-middle font-mono text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400" title={safeText(product.sku)}>{safeText(product.sku)}</td>
                <td className="truncate border-b border-slate-100 px-4 py-3.5 align-middle text-slate-600 dark:border-slate-800 dark:text-slate-300" title={safeText(product.category, "Uncategorized")}>{safeText(product.category, "Uncategorized")}</td>
                <td className="whitespace-nowrap border-b border-slate-100 px-4 py-3.5 text-right align-middle font-semibold text-emerald-700 dark:border-slate-800 dark:text-emerald-300">
                  {formatCurrency(product.price)}
                </td>
                <td className="whitespace-nowrap border-b border-slate-100 px-4 py-3.5 text-right align-middle text-slate-800 dark:border-slate-800 dark:text-slate-200">{asNumber(product.stock)}</td>
                <td className="whitespace-nowrap border-b border-slate-100 px-4 py-3.5 align-middle dark:border-slate-800">
                  <StatusBadge product={product} />
                </td>
                <td className="whitespace-nowrap border-b border-slate-100 px-4 py-3.5 align-middle dark:border-slate-800">
                  <div className="flex items-center justify-end gap-2">
                    <IconButton label="Preview product" onClick={() => onView(product)}>
                      <Eye className="h-4 w-4" />
                    </IconButton>
                    <IconButton label="Edit product" onClick={() => onEdit(product)}>
                      <Pencil className="h-4 w-4" />
                    </IconButton>
                    <IconButton
                      label="Delete product"
                      onClick={() => onDelete(product)}
                      className="icon-button-danger"
                    >
                      <Trash2 className="h-4 w-4" />
                    </IconButton>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination
        currentPage={page}
        pageCount={pageCount}
        totalCount={totalCount}
        pageSize={PAGE_SIZE}
        onPageChange={onPageChange}
      />
    </div>
  );
}

function ProductMobileCards({ products, onView, onEdit, onDelete }) {
  return (
    <div className="space-y-3">
      {products.map((product) => (
        <div key={product.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="flex items-start gap-3">
            <ProductImage product={product} />
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-slate-950 dark:text-white">{safeText(product.name, "Untitled product")}</p>
              <p className="truncate font-mono text-xs text-slate-500 dark:text-slate-400">{safeText(product.sku)}</p>
            </div>
            <p className="shrink-0 font-semibold text-emerald-700 dark:text-emerald-300">{formatCurrency(product.price)}</p>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <StatusBadge product={product} />
            <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
              {asNumber(product.stock)} in stock
            </span>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
              {safeText(product.category, "Uncategorized")}
            </span>
          </div>
          <div className="mt-4 flex justify-end gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
            <IconButton label="Preview product" onClick={() => onView(product)}>
              <Eye className="h-4 w-4" />
            </IconButton>
            <IconButton label="Edit product" onClick={() => onEdit(product)}>
              <Pencil className="h-4 w-4" />
            </IconButton>
            <IconButton
              label="Delete product"
              onClick={() => onDelete(product)}
              className="icon-button-danger"
            >
              <Trash2 className="h-4 w-4" />
            </IconButton>
          </div>
        </div>
      ))}
    </div>
  );
}

function ProductPreviewModal({ product, open, onClose, onEdit }) {
  const closeButtonRef = useRef(null);
  useScrollLock(open);

  useEffect(() => {
    if (!open) return undefined;
    closeButtonRef.current?.focus();
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && product && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) onClose();
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="product-preview-title"
        >
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.98 }}
            transition={{ duration: 0.18 }}
            className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900 sm:rounded-2xl"
          >
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 bg-white/95 px-4 py-4 backdrop-blur dark:border-slate-700 dark:bg-slate-900/95 sm:px-6">
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Product preview</p>
                <h2 id="product-preview-title" className="mt-1 truncate text-xl font-semibold text-slate-950 dark:text-white">
                  {safeText(product.name, "Untitled product")}
                </h2>
                <p className="mt-1 truncate font-mono text-xs text-slate-500 dark:text-slate-400">{safeText(product.sku)}</p>
              </div>
              <button
                ref={closeButtonRef}
                type="button"
                onClick={onClose}
                className="icon-button"
                aria-label="Close product preview"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="grid gap-5 overflow-y-auto p-4 sm:grid-cols-[260px_1fr] sm:p-6">
              <div className="aspect-square overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800">
                {getProductImage(product) ? (
                  <img src={getProductImage(product)} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-slate-400 dark:text-slate-500">
                    <ImageOff className="h-12 w-12" />
                  </div>
                )}
              </div>
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge product={product} />
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
                    {safeText(product.category, "Uncategorized")}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="surface-subtle p-3">
                    <p className="text-xs text-slate-500 dark:text-slate-400">Price</p>
                    <p className="mt-1 text-lg font-semibold text-emerald-700 dark:text-emerald-300">{formatCurrency(product.price)}</p>
                  </div>
                  <div className="surface-subtle p-3">
                    <p className="text-xs text-slate-500 dark:text-slate-400">Stock</p>
                    <p className="mt-1 text-lg font-semibold text-slate-950 dark:text-white">{asNumber(product.stock)}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Description</p>
                  <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-300">{safeText(product.description, "No description provided.")}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Created</p>
                  <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">{formatDate(product.createdAt)}</p>
                </div>
                <button
                  type="button"
                  onClick={() => onEdit(product)}
                  className="btn btn-primary"
                >
                  <Pencil className="h-4 w-4" />
                  Edit product
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function DeleteProductModal({ product, open, deleting, onClose, onConfirm }) {
  useScrollLock(open);

  useEffect(() => {
    if (!open) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !deleting) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, deleting, onClose]);

  return (
    <AnimatePresence>
      {open && product && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !deleting) onClose();
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-product-title"
        >
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            className="w-full max-w-md rounded-2xl border border-red-200 bg-white p-5 shadow-xl dark:border-red-900/70 dark:bg-slate-900"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-red-200 bg-red-50 text-red-600 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h2 id="delete-product-title" className="text-lg font-semibold text-slate-950 dark:text-white">
                  Delete product
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
                  This will remove <span className="font-medium text-slate-900 dark:text-slate-200">{safeText(product.name, "this product")}</span> from
                  the active catalog. Existing order history remains intact.
                </p>
              </div>
            </div>
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={onClose}
                disabled={deleting}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onConfirm}
                disabled={deleting}
                className="btn btn-danger"
              >
                {deleting && <Loader2 className="h-4 w-4 animate-spin" />}
                Delete product
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function ProductsPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [previewProduct, setPreviewProduct] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [modalSubmitting, setModalSubmitting] = useState(false);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [category, setCategory] = useState("ALL");
  const [sortBy, setSortBy] = useState("newest");
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebouncedValue(search);

  const {
    data,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useProducts();

  const products = useMemo(() => (Array.isArray(data) ? data.filter((product) => !product?.isDeleted) : []), [data]);
  const categories = useMemo(() => {
    const values = new Set();
    products.forEach((product) => {
      const value = safeText(product?.category, "");
      if (value) values.add(value);
    });
    return [...values].sort((a, b) => a.localeCompare(b));
  }, [products]);

  const createMutation = useCreateProduct({
    onSuccess: () => {
      toast.success("Product created.");
      refetch();
    },
    onError: (err) => {
      toast.error(err?.message || err?.error || "Failed to create product.");
    },
  });
  const updateMutation = useUpdateProduct({
    onSuccess: () => {
      toast.success("Product updated.");
      refetch();
    },
    onError: (err) => {
      toast.error(err?.message || err?.error || "Failed to update product.");
    },
  });
  const deleteMutation = useDeleteProduct({
    onSuccess: () => {
      toast.success("Product deleted.");
      refetch();
    },
    onError: (err) => {
      toast.error(err?.message || err?.error || "Failed to delete product.");
    },
  });

  const filteredProducts = useMemo(() => {
    const query = debouncedSearch.trim().toLowerCase();
    const filtered = products.filter((product) => {
      const statusMatch = status === "ALL" || normalizeStatus(product) === status;
      const categoryMatch = category === "ALL" || safeText(product?.category, "") === category;
      if (!statusMatch || !categoryMatch) return false;
      if (!query) return true;
      return [
        product?.name,
        product?.sku,
        product?.category,
        product?.description,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query);
    });

    return [...filtered].sort((a, b) => {
      if (sortBy === "name_asc") return safeText(a?.name, "").localeCompare(safeText(b?.name, ""));
      if (sortBy === "price_desc") return asNumber(b?.price) - asNumber(a?.price);
      if (sortBy === "price_asc") return asNumber(a?.price) - asNumber(b?.price);
      if (sortBy === "stock_asc") return asNumber(a?.stock) - asNumber(b?.stock);
      return new Date(b?.createdAt || 0) - new Date(a?.createdAt || 0);
    });
  }, [products, debouncedSearch, status, category, sortBy]);

  const hasFilters = search.trim().length > 0 || status !== "ALL" || category !== "ALL" || sortBy !== "newest";
  const pageCount = Math.max(1, Math.ceil(filteredProducts.length / PAGE_SIZE));
  const visiblePage = Math.min(Math.max(page, 1), pageCount);
  const pagedProducts = useMemo(() => {
    const startIndex = (visiblePage - 1) * PAGE_SIZE;
    return filteredProducts.slice(startIndex, startIndex + PAGE_SIZE);
  }, [filteredProducts, visiblePage]);

  const resetPage = useCallback(() => setPage(1), []);
  const handleSearchChange = useCallback((value) => {
    setSearch(value);
    resetPage();
  }, [resetPage]);
  const handleStatusChange = useCallback((value) => {
    setStatus(value);
    resetPage();
  }, [resetPage]);
  const handleCategoryChange = useCallback((value) => {
    setCategory(value);
    resetPage();
  }, [resetPage]);
  const handleSortChange = useCallback((value) => {
    setSortBy(value);
    resetPage();
  }, [resetPage]);
  const handleClearFilters = useCallback(() => {
    setSearch("");
    setStatus("ALL");
    setCategory("ALL");
    setSortBy("newest");
    resetPage();
  }, [resetPage]);
  const handlePageChange = useCallback((nextPage) => {
    setPage(Math.min(Math.max(nextPage, 1), pageCount));
  }, [pageCount]);

  const openCreateModal = useCallback(() => {
    setEditingProduct(null);
    setModalOpen(true);
  }, []);

  const openEditModal = useCallback((product) => {
    setPreviewProduct(null);
    setEditingProduct(product);
    setModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setModalOpen(false);
    setEditingProduct(null);
  }, []);

  const handleSaveProduct = useCallback(async (productData) => {
    setModalSubmitting(true);
    const payload = {
      ...productData,
      price: asNumber(productData.price),
      stock: Math.max(0, Math.trunc(asNumber(productData.stock))),
      slug:
        productData.slug?.trim() ||
        productData.name?.toLowerCase?.().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
    };

    try {
      if (editingProduct?.id) {
        await updateMutation.mutateAsync({ id: editingProduct.id, data: payload });
      } else {
        await createMutation.mutateAsync(payload);
      }
      closeModal();
    } finally {
      setModalSubmitting(false);
    }
  }, [closeModal, createMutation, editingProduct, updateMutation]);

  const handleConfirmDelete = useCallback(async () => {
    if (!deleteTarget?.id || deleteMutation.isPending) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      setDeleteTarget(null);
    } catch {
      // mutation toast handles failure
    }
  }, [deleteMutation, deleteTarget]);

  return (
    <div className="w-full min-w-0 overflow-x-hidden">
      <ProductPreviewModal
        product={previewProduct}
        open={!!previewProduct}
        onClose={() => setPreviewProduct(null)}
        onEdit={openEditModal}
      />
      <DeleteProductModal
        product={deleteTarget}
        open={!!deleteTarget}
        deleting={deleteMutation.isPending}
        onClose={() => {
          if (!deleteMutation.isPending) setDeleteTarget(null);
        }}
        onConfirm={handleConfirmDelete}
      />
      <AnimatePresence>
        {modalOpen && (
          <ProductModal
            open={modalOpen}
            onClose={closeModal}
            onCreate={handleSaveProduct}
            loading={modalSubmitting || createMutation.isPending || updateMutation.isPending}
            initialValues={editingProduct || undefined}
            mode={editingProduct ? "edit" : "create"}
          />
        )}
      </AnimatePresence>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-950 dark:text-white md:text-3xl">Products</h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-600 dark:text-slate-400">
            Manage catalog items, stock levels, pricing, and storefront readiness.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="btn btn-secondary"
          >
            <RefreshCw className={classNames("h-4 w-4", isFetching && "animate-spin")} />
            Refresh
          </button>
          <button
            type="button"
            onClick={openCreateModal}
            className="btn btn-primary"
          >
            <Plus className="h-4 w-4" />
            Add product
          </button>
        </div>
      </div>

      <ProductsStats products={products} loading={isLoading} />

      <ProductsToolbar
        search={search}
        onSearchChange={handleSearchChange}
        status={status}
        onStatusChange={handleStatusChange}
        category={category}
        onCategoryChange={handleCategoryChange}
        categories={categories}
        sortBy={sortBy}
        onSortChange={handleSortChange}
        onClearFilters={handleClearFilters}
        hasFilters={hasFilters}
        loading={isLoading}
      />

      {hasFilters && (
        <div className="mb-4 flex flex-wrap gap-2">
          {search.trim() && <FilterChip label="Search" value={search.trim()} onClear={() => handleSearchChange("")} />}
          {status !== "ALL" && <FilterChip label="Status" value={formatStatus(status)} onClear={() => handleStatusChange("ALL")} />}
          {category !== "ALL" && <FilterChip label="Category" value={category} onClear={() => handleCategoryChange("ALL")} />}
          {sortBy !== "newest" && (
            <FilterChip
              label="Sort"
              value={SORT_OPTIONS.find((option) => option.value === sortBy)?.label || "Custom"}
              onClear={() => handleSortChange("newest")}
            />
          )}
        </div>
      )}

      {isLoading ? (
        <TableSkeleton />
      ) : isError ? (
        <ErrorState message={error?.message || error?.error} onRetry={() => refetch()} />
      ) : filteredProducts.length === 0 ? (
        <EmptyState filtered={hasFilters} onCreate={openCreateModal} />
      ) : (
        <>
          <div className="hidden md:block">
            <ProductsTable
              products={pagedProducts}
              page={visiblePage}
              pageCount={pageCount}
              totalCount={filteredProducts.length}
              onPageChange={handlePageChange}
              onView={setPreviewProduct}
              onEdit={openEditModal}
              onDelete={setDeleteTarget}
            />
          </div>
          <div className="md:hidden">
            <ProductMobileCards
              products={pagedProducts}
              onView={setPreviewProduct}
              onEdit={openEditModal}
              onDelete={setDeleteTarget}
            />
            <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
              <Pagination
                currentPage={visiblePage}
                pageCount={pageCount}
                totalCount={filteredProducts.length}
                pageSize={PAGE_SIZE}
                onPageChange={handlePageChange}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
