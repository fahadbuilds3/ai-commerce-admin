import {
  Component,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import { format } from "date-fns";
import { toast } from "react-hot-toast";
import {
  AlertTriangle,
  ArrowDownUp,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Eye,
  Loader2,
  PackageOpen,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Trash2,
  X,
} from "lucide-react";

const API_BASE = "/api";
const PAGE_SIZE = 10;

const ORDER_STATUSES = [
  "PENDING",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
];

const PAYMENT_STATUSES = ["PENDING", "PAID", "REFUNDED", "FAILED"];

const SORT_OPTIONS = [
  { value: "date_desc", label: "Newest first" },
  { value: "date_asc", label: "Oldest first" },
  { value: "amount_desc", label: "Highest total" },
  { value: "amount_asc", label: "Lowest total" },
];

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

function safeText(value, fallback = "Unknown") {
  if (value === null || value === undefined) return fallback;
  const text = String(value).trim();
  return text || fallback;
}

function asNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function formatCurrency(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "-";
  return currencyFormatter.format(number);
}

function normalizeStatus(status, fallback = "UNKNOWN") {
  if (typeof status !== "string") return fallback;
  const normalized = status.trim().toUpperCase();
  return normalized || fallback;
}

function formatStatusLabel(status) {
  return safeText(status, "Unknown")
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getOrderIdentity(order) {
  return safeText(order?.id, "N/A");
}

function getOrderReference(order) {
  if (order?.orderNumber !== null && order?.orderNumber !== undefined) {
    return `#${order.orderNumber}`;
  }
  const id = getOrderIdentity(order);
  return id === "N/A" ? id : `#${id.slice(-8).toUpperCase()}`;
}

function getCustomerName(order) {
  return safeText(
    order?.user?.name || order?.customerName || order?.shippingAddress?.name,
    "Unknown customer"
  );
}

function getCustomerEmail(order) {
  return safeText(
    order?.user?.email || order?.customerEmail || order?.shippingAddress?.email,
    "No email"
  );
}

function getOrderTotal(order) {
  return asNumber(order?.total ?? order?.totalAmount ?? order?.subtotal, 0);
}

function getOrderDate(order) {
  if (!order?.createdAt) return null;
  const date = new Date(order.createdAt);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDate(order, pattern = "MMM d, yyyy") {
  const date = getOrderDate(order);
  return date ? format(date, pattern) : "-";
}

function readSnapshot(value) {
  if (!value) return {};
  if (typeof value === "object") return value;
  if (typeof value !== "string") return {};
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function getOrderItems(order) {
  const rawItems = Array.isArray(order?.items)
    ? order.items
    : Array.isArray(order?.orderItems)
    ? order.orderItems
    : [];

  return rawItems.map((item, index) => {
    const snapshot = readSnapshot(item?.productSnapshot);
    const product = item?.product || {};
    const quantity = asNumber(item?.quantity, 0);
    const price = asNumber(item?.price ?? item?.unitPrice ?? product?.price, 0);

    return {
      id: safeText(item?.id ?? `${index}`, `${index}`),
      name: safeText(item?.name || product?.name || snapshot?.name, "Unknown product"),
      sku: safeText(item?.sku || product?.sku || snapshot?.sku, "No SKU"),
      quantity,
      price,
      subtotal: quantity * price,
      imageUrl: item?.imageUrl || product?.imageUrl || snapshot?.imageUrl || "",
    };
  });
}

function getPageNumbers(currentPage, pageCount) {
  if (pageCount <= 7) {
    return Array.from({ length: pageCount }, (_, index) => index + 1);
  }

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

class OrdersErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    console.error("Orders module render error:", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full px-0 md:px-8 py-4 md:py-8 min-h-[90vh]">
          <div className="rounded-xl border border-red-900/70 bg-red-950/30 p-6 text-red-200">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5" />
              <h2 className="text-base font-semibold">Orders could not render</h2>
            </div>
            <p className="mt-2 text-sm text-red-200/80">
              Refresh the page and try again. Malformed order data was handled before it could break the dashboard.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function StatusBadge({ status, type = "order" }) {
  const normalized = normalizeStatus(status);
  const orderStyles = {
    PENDING: "border-amber-500/25 bg-amber-500/10 text-amber-200",
    PROCESSING: "border-sky-500/25 bg-sky-500/10 text-sky-200",
    SHIPPED: "border-indigo-500/25 bg-indigo-500/10 text-indigo-200",
    DELIVERED: "border-emerald-500/25 bg-emerald-500/10 text-emerald-200",
    CANCELLED: "border-red-500/25 bg-red-500/10 text-red-200",
    PAID: "border-emerald-500/25 bg-emerald-500/10 text-emerald-200",
    REFUNDED: "border-violet-500/25 bg-violet-500/10 text-violet-200",
    FAILED: "border-red-500/25 bg-red-500/10 text-red-200",
    UNKNOWN: "border-zinc-700 bg-zinc-800/70 text-zinc-300",
  };
  const paymentStyles = {
    PENDING: "border-amber-500/25 bg-amber-500/10 text-amber-200",
    PAID: "border-emerald-500/25 bg-emerald-500/10 text-emerald-200",
    REFUNDED: "border-violet-500/25 bg-violet-500/10 text-violet-200",
    FAILED: "border-red-500/25 bg-red-500/10 text-red-200",
    UNKNOWN: "border-zinc-700 bg-zinc-800/70 text-zinc-300",
  };
  const styles = type === "payment" ? paymentStyles : orderStyles;

  return (
    <span
      className={classNames(
        "inline-flex min-w-[86px] items-center justify-center rounded-full border px-2.5 py-1 text-xs font-medium",
        styles[normalized] || styles.UNKNOWN
      )}
      title={formatStatusLabel(normalized)}
    >
      {formatStatusLabel(normalized)}
    </span>
  );
}

function IconButton({ children, label, className, disabled, ...props }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      className={classNames(
        "inline-flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-300 transition hover:border-zinc-700 hover:bg-zinc-800 hover:text-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:pointer-events-none disabled:opacity-50",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

function SelectControl({ label, icon: Icon, value, onChange, children, disabled }) {
  return (
    <label className="flex min-w-0 flex-col gap-1.5 text-xs font-medium text-zinc-400">
      <span>{label}</span>
      <span className="relative">
        {Icon && (
          <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
        )}
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          disabled={disabled}
          className={classNames(
            "h-10 w-full rounded-xl border border-zinc-800 bg-zinc-950 py-2 pr-8 text-sm text-zinc-200 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-60",
            Icon ? "pl-9" : "pl-3"
          )}
        >
          {children}
        </select>
      </span>
    </label>
  );
}

function StatCard({ label, value, loading, tone = "default" }) {
  const tones = {
    default: "text-zinc-100",
    emerald: "text-emerald-300",
    amber: "text-amber-300",
    red: "text-red-300",
    sky: "text-sky-300",
  };

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">{label}</p>
      {loading ? (
        <div className="mt-3 h-7 w-20 animate-pulse rounded-lg bg-zinc-800" />
      ) : (
        <p className={classNames("mt-2 text-xl font-semibold", tones[tone])}>{value}</p>
      )}
    </div>
  );
}

function OrdersStats({ orders, loading }) {
  const stats = useMemo(() => {
    const list = Array.isArray(orders) ? orders : [];
    const paidOrders = list.filter((order) => normalizeStatus(order?.paymentStatus) === "PAID");
    const pendingOrders = list.filter((order) => normalizeStatus(order?.status) === "PENDING");
    const cancelledOrders = list.filter((order) => normalizeStatus(order?.status) === "CANCELLED");
    const revenue = paidOrders.reduce((sum, order) => sum + getOrderTotal(order), 0);

    return {
      total: list.length,
      revenue,
      pending: pendingOrders.length,
      paid: paidOrders.length,
      cancelled: cancelledOrders.length,
    };
  }, [orders]);

  return (
    <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-5">
      <StatCard label="Orders" value={stats.total} loading={loading} />
      <StatCard label="Revenue" value={formatCurrency(stats.revenue)} loading={loading} tone="emerald" />
      <StatCard label="Paid" value={stats.paid} loading={loading} tone="sky" />
      <StatCard label="Pending" value={stats.pending} loading={loading} tone="amber" />
      <StatCard label="Cancelled" value={stats.cancelled} loading={loading} tone="red" />
    </div>
  );
}

function FilterChip({ label, value, onClear }) {
  return (
    <span className="inline-flex max-w-full items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-300">
      <span className="truncate">
        <span className="text-zinc-500">{label}:</span> {value}
      </span>
      <button
        type="button"
        onClick={onClear}
        className="rounded-full text-zinc-500 transition hover:text-zinc-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
        aria-label={`Clear ${label}`}
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </span>
  );
}

function OrdersToolbar({
  search,
  setSearch,
  orderStatus,
  setOrderStatus,
  paymentStatus,
  setPaymentStatus,
  sortBy,
  setSortBy,
  onClearFilters,
  hasFilters,
  loading,
}) {
  return (
    <div className="mb-5 rounded-xl border border-zinc-800 bg-zinc-950 p-3 shadow-sm">
      <div className="grid gap-3 xl:grid-cols-[minmax(240px,1fr)_180px_180px_180px_auto] xl:items-end">
        <label className="flex min-w-0 flex-col gap-1.5 text-xs font-medium text-zinc-400">
          <span>Search orders</span>
          <span className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              disabled={loading}
              className="h-10 w-full rounded-xl border border-zinc-800 bg-zinc-950 py-2 pl-9 pr-3 text-sm text-zinc-100 outline-none transition placeholder:text-zinc-600 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-60"
              placeholder="Search ID, name, or email"
              autoComplete="off"
              spellCheck={false}
            />
          </span>
        </label>

        <SelectControl
          label="Order status"
          icon={SlidersHorizontal}
          value={orderStatus}
          onChange={setOrderStatus}
          disabled={loading}
        >
          <option value="ALL">All statuses</option>
          {ORDER_STATUSES.map((status) => (
            <option key={status} value={status}>
              {formatStatusLabel(status)}
            </option>
          ))}
        </SelectControl>

        <SelectControl
          label="Payment"
          icon={SlidersHorizontal}
          value={paymentStatus}
          onChange={setPaymentStatus}
          disabled={loading}
        >
          <option value="ALL">All payments</option>
          {PAYMENT_STATUSES.map((status) => (
            <option key={status} value={status}>
              {formatStatusLabel(status)}
            </option>
          ))}
        </SelectControl>

        <SelectControl label="Sort" icon={ArrowDownUp} value={sortBy} onChange={setSortBy} disabled={loading}>
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
          className="h-10 rounded-xl border border-zinc-800 bg-zinc-900 px-4 text-sm font-medium text-zinc-300 transition hover:border-zinc-700 hover:bg-zinc-800 hover:text-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Clear filters
        </button>
      </div>
    </div>
  );
}

function TableSkeleton({ rows = PAGE_SIZE }) {
  return (
    <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 shadow-sm">
      <div className="min-w-[980px]">
        <div className="grid grid-cols-[1.15fr_1.55fr_1fr_1fr_1.25fr_1fr_0.9fr] gap-4 border-b border-zinc-800 bg-zinc-900/70 px-4 py-3">
          {Array.from({ length: 7 }).map((_, index) => (
            <div key={index} className="h-3 animate-pulse rounded bg-zinc-800" />
          ))}
        </div>
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div
            key={rowIndex}
            className="grid grid-cols-[1.15fr_1.55fr_1fr_1fr_1.25fr_1fr_0.9fr] gap-4 border-b border-zinc-900 px-4 py-4 last:border-b-0"
          >
            {Array.from({ length: 7 }).map((_, cellIndex) => (
              <div
                key={cellIndex}
                className={classNames(
                  "h-4 animate-pulse rounded bg-zinc-900",
                  cellIndex === 1 ? "w-full" : "w-3/4"
                )}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function EmptyState({ filtered }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950 px-6 py-16 text-center shadow-sm">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-500">
        <PackageOpen className="h-7 w-7" />
      </div>
      <h2 className="mt-5 text-lg font-semibold text-zinc-100">
        {filtered ? "No matching orders" : "No orders yet"}
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-zinc-500">
        {filtered
          ? "Adjust your search or filters to find the orders you are looking for."
          : "Orders will appear here as soon as customers begin checking out."}
      </p>
    </div>
  );
}

function ErrorState({ message, onRetry }) {
  return (
    <div className="rounded-xl border border-red-900/70 bg-red-950/20 px-6 py-14 text-center shadow-sm">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl border border-red-900/70 bg-red-950/70 text-red-300">
        <AlertTriangle className="h-7 w-7" />
      </div>
      <h2 className="mt-5 text-lg font-semibold text-red-100">Unable to load orders</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-red-200/75">
        {message || "The orders endpoint did not return a usable response."}
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-6 inline-flex items-center gap-2 rounded-xl border border-red-800 bg-red-950 px-4 py-2 text-sm font-medium text-red-100 transition hover:bg-red-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
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
    <div className="flex flex-col gap-3 border-t border-zinc-900 bg-zinc-950 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xs text-zinc-500">
        Showing <span className="text-zinc-300">{start}</span> to{" "}
        <span className="text-zinc-300">{end}</span> of{" "}
        <span className="text-zinc-300">{totalCount}</span> orders
      </p>

      <div className="flex items-center justify-between gap-2 sm:justify-end">
        <div className="flex items-center gap-1">
          <IconButton label="First page" disabled={currentPage === 1} onClick={() => onPageChange(1)}>
            <ChevronsLeft className="h-4 w-4" />
          </IconButton>
          <IconButton
            label="Previous page"
            disabled={currentPage === 1}
            onClick={() => onPageChange(currentPage - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </IconButton>
        </div>

        <div className="hidden items-center gap-1 sm:flex">
          {pages.map((page, index) =>
            page === "ellipsis" ? (
              <span key={`ellipsis-${index}`} className="px-2 text-sm text-zinc-600">
                ...
              </span>
            ) : (
              <button
                key={page}
                type="button"
                onClick={() => onPageChange(page)}
                className={classNames(
                  "h-9 min-w-9 rounded-lg border px-3 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500",
                  page === currentPage
                    ? "border-emerald-500/50 bg-emerald-500/15 text-emerald-200"
                    : "border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-700 hover:bg-zinc-800 hover:text-zinc-100"
                )}
              >
                {page}
              </button>
            )
          )}
        </div>

        <span className="text-xs text-zinc-500 sm:hidden">
          Page {currentPage} of {pageCount}
        </span>

        <div className="flex items-center gap-1">
          <IconButton
            label="Next page"
            disabled={currentPage === pageCount}
            onClick={() => onPageChange(currentPage + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </IconButton>
          <IconButton label="Last page" disabled={currentPage === pageCount} onClick={() => onPageChange(pageCount)}>
            <ChevronsRight className="h-4 w-4" />
          </IconButton>
        </div>
      </div>
    </div>
  );
}

function StatusSelect({ order, onStatusChange, updating }) {
  const status = ORDER_STATUSES.includes(normalizeStatus(order?.status))
    ? normalizeStatus(order?.status)
    : "PENDING";

  return (
    <div className="flex items-center gap-2">
      <StatusBadge status={status} />
      <div className="relative">
        <select
          value={status}
          disabled={updating}
          onChange={(event) => onStatusChange(order, event.target.value)}
          className="h-8 rounded-lg border border-zinc-800 bg-zinc-900 px-2 pr-7 text-xs font-medium text-zinc-200 outline-none transition hover:border-zinc-700 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-60"
          aria-label={`Update status for ${getOrderReference(order)}`}
        >
          {ORDER_STATUSES.map((option) => (
            <option key={option} value={option}>
              {formatStatusLabel(option)}
            </option>
          ))}
        </select>
        {updating && (
          <Loader2 className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 animate-spin text-zinc-400" />
        )}
      </div>
    </div>
  );
}

function OrdersTable({ orders, page, pageCount, totalCount, onPageChange, onView, onDelete, onStatusChange, updatingOrderId }) {
  return (
    <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1040px] border-separate border-spacing-0 text-sm">
          <thead className="sticky top-0 z-10 bg-zinc-950/95 backdrop-blur">
            <tr className="border-b border-zinc-800 text-left text-xs uppercase tracking-wide text-zinc-500">
              <th className="border-b border-zinc-800 px-4 py-3 font-semibold">Order ID</th>
              <th className="border-b border-zinc-800 px-4 py-3 font-semibold">Customer</th>
              <th className="border-b border-zinc-800 px-4 py-3 text-right font-semibold">Total</th>
              <th className="border-b border-zinc-800 px-4 py-3 font-semibold">Payment Status</th>
              <th className="border-b border-zinc-800 px-4 py-3 font-semibold">Order Status</th>
              <th className="border-b border-zinc-800 px-4 py-3 font-semibold">Date</th>
              <th className="border-b border-zinc-800 px-4 py-3 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => {
              const id = getOrderIdentity(order);
              const customerName = getCustomerName(order);
              const customerEmail = getCustomerEmail(order);
              const orderId = String(order?.id ?? "");

              return (
                <tr
                  key={id}
                  className="group border-b border-zinc-900 transition hover:bg-zinc-900/60 odd:bg-zinc-950 even:bg-zinc-950/70"
                >
                  <td className="border-b border-zinc-900 px-4 py-4 align-middle">
                    <div className="max-w-[160px]">
                      <p className="font-medium text-zinc-100">{getOrderReference(order)}</p>
                      <p className="truncate font-mono text-xs text-zinc-500" title={id}>
                        {id}
                      </p>
                    </div>
                  </td>
                  <td className="border-b border-zinc-900 px-4 py-4 align-middle">
                    <div className="min-w-0">
                      <p className="max-w-[220px] truncate font-medium text-zinc-100" title={customerName}>
                        {customerName}
                      </p>
                      <p className="max-w-[220px] truncate text-xs text-zinc-500" title={customerEmail}>
                        {customerEmail}
                      </p>
                    </div>
                  </td>
                  <td className="border-b border-zinc-900 px-4 py-4 text-right font-semibold text-emerald-300">
                    {formatCurrency(getOrderTotal(order))}
                  </td>
                  <td className="border-b border-zinc-900 px-4 py-4">
                    <StatusBadge status={order?.paymentStatus} type="payment" />
                  </td>
                  <td className="border-b border-zinc-900 px-4 py-4">
                    <StatusSelect
                      order={order}
                      onStatusChange={onStatusChange}
                      updating={String(updatingOrderId ?? "") === orderId}
                    />
                  </td>
                  <td className="border-b border-zinc-900 px-4 py-4 text-zinc-300">
                    <span title={formatDate(order, "PPP p")}>{formatDate(order)}</span>
                  </td>
                  <td className="border-b border-zinc-900 px-4 py-4">
                    <div className="flex justify-end gap-2">
                      <IconButton label="View order" onClick={() => onView(order)}>
                        <Eye className="h-4 w-4" />
                      </IconButton>
                      <IconButton
                        label="Delete order"
                        onClick={() => onDelete(order)}
                        className="text-red-300 hover:border-red-900 hover:bg-red-950/70 hover:text-red-100"
                      >
                        <Trash2 className="h-4 w-4" />
                      </IconButton>
                    </div>
                  </td>
                </tr>
              );
            })}
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

function OrdersMobileCards({ orders, onView, onDelete, onStatusChange, updatingOrderId }) {
  return (
    <div className="space-y-3">
      {orders.map((order) => {
        const id = getOrderIdentity(order);
        const orderId = String(order?.id ?? "");
        return (
          <div key={id} className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-medium text-zinc-100">{getOrderReference(order)}</p>
                <p className="truncate font-mono text-xs text-zinc-500" title={id}>
                  {id}
                </p>
              </div>
              <p className="shrink-0 text-right font-semibold text-emerald-300">{formatCurrency(getOrderTotal(order))}</p>
            </div>

            <div className="mt-4 min-w-0">
              <p className="truncate font-medium text-zinc-100">{getCustomerName(order)}</p>
              <p className="truncate text-xs text-zinc-500">{getCustomerEmail(order)}</p>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <StatusBadge status={order?.paymentStatus} type="payment" />
              <StatusSelect
                order={order}
                onStatusChange={onStatusChange}
                updating={String(updatingOrderId ?? "") === orderId}
              />
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-zinc-900 pt-3">
              <span className="text-xs text-zinc-500">{formatDate(order, "MMM d, yyyy")}</span>
              <div className="flex gap-2">
                <IconButton label="View order" onClick={() => onView(order)}>
                  <Eye className="h-4 w-4" />
                </IconButton>
                <IconButton
                  label="Delete order"
                  onClick={() => onDelete(order)}
                  className="text-red-300 hover:border-red-900 hover:bg-red-950/70 hover:text-red-100"
                >
                  <Trash2 className="h-4 w-4" />
                </IconButton>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ProductThumbnail({ item }) {
  if (item.imageUrl) {
    return (
      <img
        src={item.imageUrl}
        alt=""
        className="h-11 w-11 rounded-lg border border-zinc-800 object-cover"
        loading="lazy"
        onError={(event) => {
          event.currentTarget.style.display = "none";
        }}
      />
    );
  }

  return (
    <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-500">
      <PackageOpen className="h-5 w-5" />
    </div>
  );
}

function OrderDetailsModal({ order, open, onClose, onStatusChange, updating }) {
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

  const items = useMemo(() => getOrderItems(order), [order]);
  const itemSubtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
  const total = getOrderTotal(order);

  return (
    <AnimatePresence>
      {open && order && (
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
          aria-labelledby="order-details-title"
        >
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.98 }}
            transition={{ duration: 0.18 }}
            className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-t-xl border border-zinc-800 bg-zinc-950 shadow-2xl sm:rounded-xl"
          >
            <div className="sticky top-0 z-10 border-b border-zinc-800 bg-zinc-950/95 px-4 py-4 backdrop-blur sm:px-6">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Order details</p>
                  <h2 id="order-details-title" className="mt-1 truncate text-xl font-semibold text-zinc-100">
                    {getOrderReference(order)}
                  </h2>
                  <p className="mt-1 truncate font-mono text-xs text-zinc-500" title={getOrderIdentity(order)}>
                    {getOrderIdentity(order)}
                  </p>
                </div>
                <button
                  ref={closeButtonRef}
                  type="button"
                  onClick={onClose}
                  className="rounded-lg border border-zinc-800 bg-zinc-900 p-2 text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                  aria-label="Close order details"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="overflow-y-auto px-4 py-5 sm:px-6">
              <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
                <section className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
                  <h3 className="text-sm font-semibold text-zinc-100">Customer</h3>
                  <div className="mt-4 space-y-3">
                    <div>
                      <p className="text-xs text-zinc-500">Name</p>
                      <p className="mt-1 text-sm font-medium text-zinc-100">{getCustomerName(order)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500">Email</p>
                      <p className="mt-1 break-all text-sm text-zinc-300">{getCustomerEmail(order)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500">Order date</p>
                      <p className="mt-1 text-sm text-zinc-300">{formatDate(order, "PPP p")}</p>
                    </div>
                  </div>
                </section>

                <section className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
                  <h3 className="text-sm font-semibold text-zinc-100">Status</h3>
                  <div className="mt-4 space-y-4">
                    <div>
                      <p className="mb-2 text-xs text-zinc-500">Payment status</p>
                      <StatusBadge status={order?.paymentStatus} type="payment" />
                    </div>
                    <div>
                      <p className="mb-2 text-xs text-zinc-500">Order status</p>
                      <StatusSelect order={order} onStatusChange={onStatusChange} updating={updating} />
                    </div>
                  </div>
                </section>
              </div>

              <section className="mt-4 rounded-xl border border-zinc-800 bg-zinc-900/40">
                <div className="border-b border-zinc-800 px-4 py-3">
                  <h3 className="text-sm font-semibold text-zinc-100">Items</h3>
                </div>
                {items.length === 0 ? (
                  <div className="px-4 py-10 text-center text-sm text-zinc-500">No items were returned for this order.</div>
                ) : (
                  <div className="divide-y divide-zinc-800">
                    {items.map((item) => (
                      <div key={item.id} className="grid gap-3 px-4 py-4 sm:grid-cols-[1fr_auto] sm:items-center">
                        <div className="flex min-w-0 items-center gap-3">
                          <ProductThumbnail item={item} />
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-zinc-100">{item.name}</p>
                            <p className="mt-1 truncate text-xs text-zinc-500">{item.sku}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-3 text-right text-sm sm:min-w-[260px]">
                          <div>
                            <p className="text-xs text-zinc-500">Qty</p>
                            <p className="mt-1 text-zinc-200">{item.quantity}</p>
                          </div>
                          <div>
                            <p className="text-xs text-zinc-500">Price</p>
                            <p className="mt-1 text-zinc-200">{formatCurrency(item.price)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-zinc-500">Subtotal</p>
                            <p className="mt-1 font-medium text-emerald-300">{formatCurrency(item.subtotal)}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section className="mt-4 rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
                <div className="ml-auto max-w-sm space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-500">Subtotal</span>
                    <span className="text-zinc-200">{formatCurrency(itemSubtotal)}</span>
                  </div>
                  <div className="flex justify-between border-t border-zinc-800 pt-3 text-base font-semibold">
                    <span className="text-zinc-100">Total</span>
                    <span className="text-emerald-300">{formatCurrency(total)}</span>
                  </div>
                </div>
              </section>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function DeleteOrderModal({ order, open, deleting, onClose, onConfirm }) {
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
      {open && order && (
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
          aria-labelledby="delete-order-title"
        >
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            className="w-full max-w-md rounded-xl border border-red-900/70 bg-zinc-950 p-5 shadow-2xl"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-red-900 bg-red-950 text-red-300">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h2 id="delete-order-title" className="text-lg font-semibold text-zinc-100">
                  Delete order
                </h2>
                <p className="mt-2 text-sm leading-6 text-zinc-400">
                  This will permanently delete <span className="font-medium text-zinc-200">{getOrderReference(order)}</span> and
                  its line items. This action cannot be undone.
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={onClose}
                disabled={deleting}
                className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-300 transition hover:bg-zinc-800 hover:text-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onConfirm}
                disabled={deleting}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-800 bg-red-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {deleting && <Loader2 className="h-4 w-4 animate-spin" />}
                Delete order
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function OrdersPageContent() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [search, setSearch] = useState("");
  const [orderStatus, setOrderStatus] = useState("ALL");
  const [paymentStatus, setPaymentStatus] = useState("ALL");
  const [sortBy, setSortBy] = useState("date_desc");
  const [page, setPage] = useState(1);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [updatingOrderId, setUpdatingOrderId] = useState(null);
  const [deletingOrderId, setDeletingOrderId] = useState(null);
  const debouncedSearch = useDebouncedValue(search);

  const selectedOrder = useMemo(
    () => orders.find((order) => String(order?.id) === String(selectedOrderId)) || null,
    [orders, selectedOrderId]
  );
  const deleteTarget = useMemo(
    () => orders.find((order) => String(order?.id) === String(deleteTargetId)) || null,
    [orders, deleteTargetId]
  );

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/orders`);
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.error || data?.message || "Failed to fetch orders.");
      }

      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.orders)
        ? data.orders
        : Array.isArray(data?.data)
        ? data.data
        : null;

      if (!Array.isArray(list)) {
        throw new Error("Orders response was malformed.");
      }

      setOrders(list.filter(Boolean));
    } catch (err) {
      setOrders([]);
      setError(err?.message || "Failed to fetch orders.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchOrders();
  }, [fetchOrders, reloadKey]);

  const filteredOrders = useMemo(() => {
    const query = debouncedSearch.trim().toLowerCase();
    const list = Array.isArray(orders) ? orders : [];

    const filtered = list.filter((order) => {
      const orderStatusMatch = orderStatus === "ALL" || normalizeStatus(order?.status) === orderStatus;
      const paymentStatusMatch = paymentStatus === "ALL" || normalizeStatus(order?.paymentStatus) === paymentStatus;

      if (!orderStatusMatch || !paymentStatusMatch) return false;
      if (!query) return true;

      const searchable = [
        getOrderIdentity(order),
        getOrderReference(order),
        order?.orderNumber,
        getCustomerName(order),
        getCustomerEmail(order),
      ]
        .filter((value) => value !== null && value !== undefined)
        .join(" ")
        .toLowerCase();

      return searchable.includes(query);
    });

    return [...filtered].sort((a, b) => {
      if (sortBy === "date_asc") {
        return (getOrderDate(a)?.getTime() || 0) - (getOrderDate(b)?.getTime() || 0);
      }
      if (sortBy === "amount_desc") return getOrderTotal(b) - getOrderTotal(a);
      if (sortBy === "amount_asc") return getOrderTotal(a) - getOrderTotal(b);
      return (getOrderDate(b)?.getTime() || 0) - (getOrderDate(a)?.getTime() || 0);
    });
  }, [orders, debouncedSearch, orderStatus, paymentStatus, sortBy]);

  const hasFilters =
    search.trim().length > 0 ||
    orderStatus !== "ALL" ||
    paymentStatus !== "ALL" ||
    sortBy !== "date_desc";
  const pageCount = Math.max(1, Math.ceil(filteredOrders.length / PAGE_SIZE));
  const visiblePage = Math.min(Math.max(page, 1), pageCount);
  const pagedOrders = useMemo(() => {
    const startIndex = (visiblePage - 1) * PAGE_SIZE;
    return filteredOrders.slice(startIndex, startIndex + PAGE_SIZE);
  }, [filteredOrders, visiblePage]);

  const handleSearchChange = useCallback((value) => {
    setSearch(value);
    setPage(1);
  }, []);

  const handleOrderStatusFilterChange = useCallback((value) => {
    setOrderStatus(value);
    setPage(1);
  }, []);

  const handlePaymentStatusFilterChange = useCallback((value) => {
    setPaymentStatus(value);
    setPage(1);
  }, []);

  const handleSortChange = useCallback((value) => {
    setSortBy(value);
    setPage(1);
  }, []);

  const handlePageChange = useCallback((nextPage) => {
    setPage(Math.min(Math.max(nextPage, 1), pageCount));
  }, [pageCount]);

  const handleClearFilters = useCallback(() => {
    setSearch("");
    setOrderStatus("ALL");
    setPaymentStatus("ALL");
    setSortBy("date_desc");
    setPage(1);
  }, []);

  const handleStatusChange = useCallback(async (order, newStatus) => {
    const orderId = order?.id;
    if (!orderId || normalizeStatus(order?.status) === newStatus || updatingOrderId) return;

    const previousOrders = orders;
    setUpdatingOrderId(orderId);
    setOrders((current) =>
      current.map((item) => (String(item?.id) === String(orderId) ? { ...item, status: newStatus } : item))
    );

    try {
      const response = await fetch(`${API_BASE}/orders/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.error || data?.message || "Failed to update order status.");
      }

      if (data && typeof data === "object" && data.id) {
        setOrders((current) =>
          current.map((item) => (String(item?.id) === String(orderId) ? { ...item, ...data } : item))
        );
      }

      toast.success(`Order marked ${formatStatusLabel(newStatus)}.`);
    } catch (err) {
      setOrders(previousOrders);
      toast.error(err?.message || "Failed to update order status.");
    } finally {
      setUpdatingOrderId(null);
    }
  }, [orders, updatingOrderId]);

  const handleConfirmDelete = useCallback(async () => {
    if (!deleteTarget?.id || deletingOrderId) return;

    const orderId = deleteTarget.id;
    const previousOrders = orders;
    setDeletingOrderId(orderId);
    setDeleteTargetId(null);
    setOrders((current) => current.filter((order) => String(order?.id) !== String(orderId)));

    if (String(selectedOrderId) === String(orderId)) {
      setSelectedOrderId(null);
    }

    try {
      const response = await fetch(`${API_BASE}/orders/${orderId}`, {
        method: "DELETE",
      });
      const data = response.status === 204 ? null : await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.error || data?.message || "Failed to delete order.");
      }

      toast.success("Order deleted.");
    } catch (err) {
      setOrders(previousOrders);
      toast.error(err?.message || "Failed to delete order.");
    } finally {
      setDeletingOrderId(null);
    }
  }, [deleteTarget, deletingOrderId, orders, selectedOrderId]);

  return (
    <div className="min-h-[90vh] w-full overflow-x-hidden px-0 py-4 md:px-8 md:py-8">
      <OrderDetailsModal
        order={selectedOrder}
        open={!!selectedOrder}
        onClose={() => setSelectedOrderId(null)}
        onStatusChange={handleStatusChange}
        updating={selectedOrder && String(updatingOrderId ?? "") === String(selectedOrder.id)}
      />

      <DeleteOrderModal
        order={deleteTarget}
        open={!!deleteTarget}
        deleting={!!deletingOrderId}
        onClose={() => {
          if (!deletingOrderId) setDeleteTargetId(null);
        }}
        onConfirm={handleConfirmDelete}
      />

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100 md:text-3xl">Orders</h1>
          <p className="mt-1 max-w-2xl text-sm text-zinc-400">
            Review orders, update fulfillment status, and manage customer purchases.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setReloadKey((key) => key + 1)}
          disabled={loading}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900 px-4 text-sm font-medium text-zinc-300 transition hover:border-zinc-700 hover:bg-zinc-800 hover:text-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw className={classNames("h-4 w-4", loading && "animate-spin")} />
          Refresh
        </button>
      </div>

      <OrdersStats orders={orders} loading={loading} />

      <OrdersToolbar
        search={search}
        setSearch={handleSearchChange}
        orderStatus={orderStatus}
        setOrderStatus={handleOrderStatusFilterChange}
        paymentStatus={paymentStatus}
        setPaymentStatus={handlePaymentStatusFilterChange}
        sortBy={sortBy}
        setSortBy={handleSortChange}
        onClearFilters={handleClearFilters}
        hasFilters={hasFilters}
        loading={loading}
      />

      {hasFilters && (
        <div className="mb-4 flex flex-wrap gap-2">
          {search.trim() && <FilterChip label="Search" value={search.trim()} onClear={() => handleSearchChange("")} />}
          {orderStatus !== "ALL" && (
            <FilterChip label="Status" value={formatStatusLabel(orderStatus)} onClear={() => handleOrderStatusFilterChange("ALL")} />
          )}
          {paymentStatus !== "ALL" && (
            <FilterChip label="Payment" value={formatStatusLabel(paymentStatus)} onClear={() => handlePaymentStatusFilterChange("ALL")} />
          )}
          {sortBy !== "date_desc" && (
            <FilterChip
              label="Sort"
              value={SORT_OPTIONS.find((option) => option.value === sortBy)?.label || "Custom"}
              onClear={() => handleSortChange("date_desc")}
            />
          )}
        </div>
      )}

      {loading ? (
        <TableSkeleton />
      ) : error ? (
        <ErrorState message={error} onRetry={() => setReloadKey((key) => key + 1)} />
      ) : filteredOrders.length === 0 ? (
        <EmptyState filtered={hasFilters} />
      ) : (
        <>
          <div className="hidden md:block">
            <OrdersTable
              orders={pagedOrders}
              page={visiblePage}
              pageCount={pageCount}
              totalCount={filteredOrders.length}
              onPageChange={handlePageChange}
              onView={(order) => setSelectedOrderId(order?.id)}
              onDelete={(order) => setDeleteTargetId(order?.id)}
              onStatusChange={handleStatusChange}
              updatingOrderId={updatingOrderId}
            />
          </div>

          <div className="md:hidden">
            <OrdersMobileCards
              orders={pagedOrders}
              onView={(order) => setSelectedOrderId(order?.id)}
              onDelete={(order) => setDeleteTargetId(order?.id)}
              onStatusChange={handleStatusChange}
              updatingOrderId={updatingOrderId}
            />
            <div className="mt-4 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950">
              <Pagination
                currentPage={visiblePage}
                pageCount={pageCount}
                totalCount={filteredOrders.length}
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

export default function OrdersPage() {
  return (
    <OrdersErrorBoundary>
      <OrdersPageContent />
    </OrdersErrorBoundary>
  );
}
