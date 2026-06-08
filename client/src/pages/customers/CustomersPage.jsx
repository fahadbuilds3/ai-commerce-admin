import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  RefreshCw,
  Search,
  ShieldAlert,
  SlidersHorizontal,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import apiClient from "../../api/axios";

const PAGE_SIZE = 10;
const CUSTOMER_STATUSES = ["ACTIVE", "VIP", "BLOCKED", "INACTIVE"];

const SORT_OPTIONS = [
  { value: "joined_desc", label: "Newest joined" },
  { value: "joined_asc", label: "Oldest joined" },
  { value: "spent_desc", label: "Highest spent" },
  { value: "spent_asc", label: "Lowest spent" },
  { value: "orders_desc", label: "Most orders" },
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
  return currencyFormatter.format(asNumber(value, 0));
}

function normalizeStatus(status) {
  const normalized = typeof status === "string" ? status.toUpperCase() : "ACTIVE";
  return CUSTOMER_STATUSES.includes(normalized) ? normalized : "ACTIVE";
}

function formatStatus(status) {
  return safeText(status, "Active")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getCustomerName(customer) {
  return safeText(customer?.name, "Unknown customer");
}

function getCustomerEmail(customer) {
  return safeText(customer?.email, "No email");
}

function getOrdersCount(customer) {
  return asNumber(customer?.ordersCount ?? customer?._count?.orders, 0);
}

function getTotalSpent(customer) {
  return asNumber(customer?.totalSpent, 0);
}

function getDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDate(value, pattern = "MMM d, yyyy") {
  const date = getDate(value);
  return date ? format(date, pattern) : "-";
}

function normalizeCustomers(payload) {
  const list = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.customers)
    ? payload.customers
    : Array.isArray(payload?.data)
    ? payload.data
    : [];

  return list.filter(Boolean).map((customer) => ({
    ...customer,
    status: normalizeStatus(customer?.status || customer?.customerStatus),
    ordersCount: getOrdersCount(customer),
    totalSpent: getTotalSpent(customer),
    recentOrders: Array.isArray(customer?.recentOrders) ? customer.recentOrders : [],
  }));
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

function IconButton({ label, className, children, disabled, ...props }) {
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

function StatusBadge({ status }) {
  const normalized = normalizeStatus(status);
  const styles = {
    ACTIVE: "border-emerald-500/25 bg-emerald-500/10 text-emerald-200",
    VIP: "border-amber-500/25 bg-amber-500/10 text-amber-200",
    BLOCKED: "border-red-500/25 bg-red-500/10 text-red-200",
    INACTIVE: "border-zinc-700 bg-zinc-800/70 text-zinc-300",
  };

  return (
    <span
      className={classNames(
        "inline-flex min-w-[78px] items-center justify-center rounded-full border px-2.5 py-1 text-xs font-medium",
        styles[normalized]
      )}
    >
      {formatStatus(normalized)}
    </span>
  );
}

function StatusSelect({ customer, onStatusChange, updating }) {
  const status = normalizeStatus(customer?.status);

  return (
    <div className="flex items-center gap-2">
      <StatusBadge status={status} />
      <div className="relative">
        <select
          value={status}
          disabled={updating}
          onChange={(event) => onStatusChange(customer, event.target.value)}
          className="h-8 rounded-lg border border-zinc-800 bg-zinc-900 px-2 pr-7 text-xs font-medium text-zinc-200 outline-none transition hover:border-zinc-700 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-60"
          aria-label={`Update status for ${getCustomerName(customer)}`}
        >
          {CUSTOMER_STATUSES.map((option) => (
            <option key={option} value={option}>
              {formatStatus(option)}
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

function CustomersStats({ customers, loading }) {
  const stats = useMemo(() => {
    const list = Array.isArray(customers) ? customers : [];
    return {
      total: list.length,
      vip: list.filter((customer) => normalizeStatus(customer?.status) === "VIP").length,
      blocked: list.filter((customer) => normalizeStatus(customer?.status) === "BLOCKED").length,
      revenue: list.reduce((sum, customer) => sum + getTotalSpent(customer), 0),
    };
  }, [customers]);

  return (
    <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
      <StatCard label="Customers" value={stats.total} loading={loading} />
      <StatCard label="Revenue" value={formatCurrency(stats.revenue)} loading={loading} tone="emerald" />
      <StatCard label="VIP" value={stats.vip} loading={loading} tone="amber" />
      <StatCard label="Blocked" value={stats.blocked} loading={loading} tone="red" />
    </div>
  );
}

function CustomersToolbar({
  search,
  onSearchChange,
  status,
  onStatusChange,
  sortBy,
  onSortChange,
  onClearFilters,
  hasFilters,
  loading,
}) {
  return (
    <div className="mb-5 rounded-xl border border-zinc-800 bg-zinc-950 p-3 shadow-sm">
      <div className="grid gap-3 lg:grid-cols-[minmax(240px,1fr)_180px_190px_auto] lg:items-end">
        <label className="flex min-w-0 flex-col gap-1.5 text-xs font-medium text-zinc-400">
          <span>Search customers</span>
          <span className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <input
              type="search"
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              disabled={loading}
              className="h-10 w-full rounded-xl border border-zinc-800 bg-zinc-950 py-2 pl-9 pr-3 text-sm text-zinc-100 outline-none transition placeholder:text-zinc-600 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-60"
              placeholder="Search name or email"
              autoComplete="off"
              spellCheck={false}
            />
          </span>
        </label>

        <SelectControl
          label="Status"
          icon={SlidersHorizontal}
          value={status}
          onChange={onStatusChange}
          disabled={loading}
        >
          <option value="ALL">All statuses</option>
          {CUSTOMER_STATUSES.map((option) => (
            <option key={option} value={option}>
              {formatStatus(option)}
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
          className="h-10 rounded-xl border border-zinc-800 bg-zinc-900 px-4 text-sm font-medium text-zinc-300 transition hover:border-zinc-700 hover:bg-zinc-800 hover:text-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Clear filters
        </button>
      </div>
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

function TableSkeleton({ rows = PAGE_SIZE }) {
  return (
    <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 shadow-sm">
      <div className="min-w-[940px]">
        <div className="grid grid-cols-[1.5fr_1.4fr_0.9fr_1fr_1fr_1fr_0.8fr] gap-4 border-b border-zinc-800 bg-zinc-900/70 px-4 py-3">
          {Array.from({ length: 7 }).map((_, index) => (
            <div key={index} className="h-3 animate-pulse rounded bg-zinc-800" />
          ))}
        </div>
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div
            key={rowIndex}
            className="grid grid-cols-[1.5fr_1.4fr_0.9fr_1fr_1fr_1fr_0.8fr] gap-4 border-b border-zinc-900 px-4 py-4 last:border-b-0"
          >
            {Array.from({ length: 7 }).map((_, cellIndex) => (
              <div key={cellIndex} className="h-4 animate-pulse rounded bg-zinc-900" />
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
        <UserRound className="h-7 w-7" />
      </div>
      <h2 className="mt-5 text-lg font-semibold text-zinc-100">
        {filtered ? "No matching customers" : "No customers yet"}
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-zinc-500">
        {filtered
          ? "Adjust search, status, or sort options to find a customer."
          : "Customers will appear here after users place orders or create accounts."}
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
      <h2 className="mt-5 text-lg font-semibold text-red-100">Unable to load customers</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-red-200/75">
        {message || "The customers endpoint did not return a usable response."}
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
        <span className="text-zinc-300">{totalCount}</span> customers
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

function CustomersTable({
  customers,
  page,
  pageCount,
  totalCount,
  onPageChange,
  onView,
  onDelete,
  onStatusChange,
  updatingCustomerId,
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px] border-separate border-spacing-0 text-sm">
          <thead className="sticky top-0 z-10 bg-zinc-950/95 backdrop-blur">
            <tr className="text-left text-xs uppercase tracking-wide text-zinc-500">
              <th className="border-b border-zinc-800 px-4 py-3 font-semibold">Customer</th>
              <th className="border-b border-zinc-800 px-4 py-3 font-semibold">Email</th>
              <th className="border-b border-zinc-800 px-4 py-3 text-right font-semibold">Orders count</th>
              <th className="border-b border-zinc-800 px-4 py-3 text-right font-semibold">Total spent</th>
              <th className="border-b border-zinc-800 px-4 py-3 font-semibold">Status</th>
              <th className="border-b border-zinc-800 px-4 py-3 font-semibold">Joined date</th>
              <th className="border-b border-zinc-800 px-4 py-3 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((customer) => (
              <tr key={customer.id} className="group transition hover:bg-zinc-900/60 odd:bg-zinc-950 even:bg-zinc-950/70">
                <td className="border-b border-zinc-900 px-4 py-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-400">
                      <UserRound className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="max-w-[220px] truncate font-medium text-zinc-100" title={getCustomerName(customer)}>
                        {getCustomerName(customer)}
                      </p>
                      <p className="truncate font-mono text-xs text-zinc-500" title={customer.id}>
                        {customer.id}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="border-b border-zinc-900 px-4 py-4 text-zinc-300">
                  <span className="block max-w-[220px] truncate" title={getCustomerEmail(customer)}>
                    {getCustomerEmail(customer)}
                  </span>
                </td>
                <td className="border-b border-zinc-900 px-4 py-4 text-right text-zinc-300">{getOrdersCount(customer)}</td>
                <td className="border-b border-zinc-900 px-4 py-4 text-right font-semibold text-emerald-300">
                  {formatCurrency(getTotalSpent(customer))}
                </td>
                <td className="border-b border-zinc-900 px-4 py-4">
                  <StatusSelect
                    customer={customer}
                    onStatusChange={onStatusChange}
                    updating={String(updatingCustomerId ?? "") === String(customer.id)}
                  />
                </td>
                <td className="border-b border-zinc-900 px-4 py-4 text-zinc-300">
                  {formatDate(customer.createdAt)}
                </td>
                <td className="border-b border-zinc-900 px-4 py-4">
                  <div className="flex justify-end gap-2">
                    <IconButton label="View customer" onClick={() => onView(customer)}>
                      <Eye className="h-4 w-4" />
                    </IconButton>
                    <IconButton
                      label="Delete customer"
                      onClick={() => onDelete(customer)}
                      className="text-red-300 hover:border-red-900 hover:bg-red-950/70 hover:text-red-100"
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

function CustomerMobileCards({ customers, onView, onDelete, onStatusChange, updatingCustomerId }) {
  return (
    <div className="space-y-3">
      {customers.map((customer) => (
        <div key={customer.id} className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate font-medium text-zinc-100">{getCustomerName(customer)}</p>
              <p className="truncate text-xs text-zinc-500">{getCustomerEmail(customer)}</p>
            </div>
            <p className="shrink-0 text-right font-semibold text-emerald-300">{formatCurrency(getTotalSpent(customer))}</p>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <StatusSelect
              customer={customer}
              onStatusChange={onStatusChange}
              updating={String(updatingCustomerId ?? "") === String(customer.id)}
            />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 border-t border-zinc-900 pt-3 text-sm">
            <div>
              <p className="text-xs text-zinc-500">Orders</p>
              <p className="mt-1 text-zinc-200">{getOrdersCount(customer)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-zinc-500">Joined</p>
              <p className="mt-1 text-zinc-200">{formatDate(customer.createdAt)}</p>
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <IconButton label="View customer" onClick={() => onView(customer)}>
              <Eye className="h-4 w-4" />
            </IconButton>
            <IconButton
              label="Delete customer"
              onClick={() => onDelete(customer)}
              className="text-red-300 hover:border-red-900 hover:bg-red-950/70 hover:text-red-100"
            >
              <Trash2 className="h-4 w-4" />
            </IconButton>
          </div>
        </div>
      ))}
    </div>
  );
}

function CustomerDetailsModal({ customer, open, onClose, onStatusChange, updating }) {
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

  const recentOrders = Array.isArray(customer?.recentOrders) ? customer.recentOrders : [];

  return (
    <AnimatePresence>
      {open && customer && (
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
          aria-labelledby="customer-details-title"
        >
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.98 }}
            transition={{ duration: 0.18 }}
            className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-xl border border-zinc-800 bg-zinc-950 shadow-2xl sm:rounded-xl"
          >
            <div className="sticky top-0 z-10 border-b border-zinc-800 bg-zinc-950/95 px-4 py-4 backdrop-blur sm:px-6">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Customer details</p>
                  <h2 id="customer-details-title" className="mt-1 truncate text-xl font-semibold text-zinc-100">
                    {getCustomerName(customer)}
                  </h2>
                  <p className="mt-1 truncate text-sm text-zinc-500">{getCustomerEmail(customer)}</p>
                </div>
                <button
                  ref={closeButtonRef}
                  type="button"
                  onClick={onClose}
                  className="rounded-lg border border-zinc-800 bg-zinc-900 p-2 text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                  aria-label="Close customer details"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="overflow-y-auto px-4 py-5 sm:px-6">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
                  <p className="text-xs text-zinc-500">Total orders</p>
                  <p className="mt-2 text-2xl font-semibold text-zinc-100">{getOrdersCount(customer)}</p>
                </div>
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
                  <p className="text-xs text-zinc-500">Total spent</p>
                  <p className="mt-2 text-2xl font-semibold text-emerald-300">{formatCurrency(getTotalSpent(customer))}</p>
                </div>
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
                  <p className="mb-2 text-xs text-zinc-500">Status</p>
                  <StatusSelect customer={customer} onStatusChange={onStatusChange} updating={updating} />
                </div>
              </div>

              <section className="mt-4 rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
                <h3 className="text-sm font-semibold text-zinc-100">Profile</h3>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs text-zinc-500">Customer ID</p>
                    <p className="mt-1 break-all font-mono text-xs text-zinc-300">{customer.id}</p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500">Joined date</p>
                    <p className="mt-1 text-sm text-zinc-300">{formatDate(customer.createdAt, "PPP p")}</p>
                  </div>
                </div>
              </section>

              <section className="mt-4 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/40">
                <div className="border-b border-zinc-800 px-4 py-3">
                  <h3 className="text-sm font-semibold text-zinc-100">Recent orders</h3>
                </div>
                {recentOrders.length === 0 ? (
                  <div className="px-4 py-10 text-center text-sm text-zinc-500">No recent orders for this customer.</div>
                ) : (
                  <div className="divide-y divide-zinc-800">
                    {recentOrders.map((order) => (
                      <div key={order.id} className="grid gap-3 px-4 py-4 sm:grid-cols-[1fr_auto] sm:items-center">
                        <div className="min-w-0">
                          <p className="font-medium text-zinc-100">#{order.orderNumber || String(order.id).slice(-8)}</p>
                          <p className="mt-1 text-xs text-zinc-500">{formatDate(order.createdAt, "MMM d, yyyy")}</p>
                        </div>
                        <div className="text-left sm:text-right">
                          <p className="font-semibold text-emerald-300">{formatCurrency(order.total)}</p>
                          <p className="mt-1 text-xs text-zinc-500">{safeText(order.status, "Unknown")}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function DeleteCustomerModal({ customer, open, deleting, onClose, onConfirm }) {
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
      {open && customer && (
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
          aria-labelledby="delete-customer-title"
        >
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            className="w-full max-w-md rounded-xl border border-red-900/70 bg-zinc-950 p-5 shadow-2xl"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-red-900 bg-red-950 text-red-300">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h2 id="delete-customer-title" className="text-lg font-semibold text-zinc-100">
                  Delete customer
                </h2>
                <p className="mt-2 text-sm leading-6 text-zinc-400">
                  This will permanently delete <span className="font-medium text-zinc-200">{getCustomerName(customer)}</span>,
                  including their orders and line items. This action cannot be undone.
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
                Delete customer
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [sortBy, setSortBy] = useState("joined_desc");
  const [page, setPage] = useState(1);
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [updatingCustomerId, setUpdatingCustomerId] = useState(null);
  const [deletingCustomerId, setDeletingCustomerId] = useState(null);
  const debouncedSearch = useDebouncedValue(search);

  const selectedCustomer = useMemo(
    () => customers.find((customer) => String(customer?.id) === String(selectedCustomerId)) || null,
    [customers, selectedCustomerId]
  );
  const deleteTarget = useMemo(
    () => customers.find((customer) => String(customer?.id) === String(deleteTargetId)) || null,
    [customers, deleteTargetId]
  );

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.get("/customers");
      const data = response.data;

      setCustomers(normalizeCustomers(data));
    } catch (err) {
      setCustomers([]);
      setError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          err?.message ||
          "Failed to fetch customers."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchCustomers();
  }, [fetchCustomers, reloadKey]);

  const filteredCustomers = useMemo(() => {
    const query = debouncedSearch.trim().toLowerCase();
    const list = Array.isArray(customers) ? customers : [];

    const filtered = list.filter((customer) => {
      const statusMatch = status === "ALL" || normalizeStatus(customer?.status) === status;
      if (!statusMatch) return false;
      if (!query) return true;

      return [getCustomerName(customer), getCustomerEmail(customer), customer?.id]
        .join(" ")
        .toLowerCase()
        .includes(query);
    });

    return [...filtered].sort((a, b) => {
      if (sortBy === "joined_asc") return (getDate(a?.createdAt)?.getTime() || 0) - (getDate(b?.createdAt)?.getTime() || 0);
      if (sortBy === "spent_desc") return getTotalSpent(b) - getTotalSpent(a);
      if (sortBy === "spent_asc") return getTotalSpent(a) - getTotalSpent(b);
      if (sortBy === "orders_desc") return getOrdersCount(b) - getOrdersCount(a);
      return (getDate(b?.createdAt)?.getTime() || 0) - (getDate(a?.createdAt)?.getTime() || 0);
    });
  }, [customers, debouncedSearch, status, sortBy]);

  const hasFilters = search.trim().length > 0 || status !== "ALL" || sortBy !== "joined_desc";
  const pageCount = Math.max(1, Math.ceil(filteredCustomers.length / PAGE_SIZE));
  const visiblePage = Math.min(Math.max(page, 1), pageCount);
  const pagedCustomers = useMemo(() => {
    const startIndex = (visiblePage - 1) * PAGE_SIZE;
    return filteredCustomers.slice(startIndex, startIndex + PAGE_SIZE);
  }, [filteredCustomers, visiblePage]);

  const handleSearchChange = useCallback((value) => {
    setSearch(value);
    setPage(1);
  }, []);

  const handleStatusFilterChange = useCallback((value) => {
    setStatus(value);
    setPage(1);
  }, []);

  const handleSortChange = useCallback((value) => {
    setSortBy(value);
    setPage(1);
  }, []);

  const handleClearFilters = useCallback(() => {
    setSearch("");
    setStatus("ALL");
    setSortBy("joined_desc");
    setPage(1);
  }, []);

  const handlePageChange = useCallback((nextPage) => {
    setPage(Math.min(Math.max(nextPage, 1), pageCount));
  }, [pageCount]);

  const handleStatusChange = useCallback(async (customer, nextStatus) => {
    const customerId = customer?.id;
    if (!customerId || normalizeStatus(customer?.status) === nextStatus || updatingCustomerId) return;

    const previousCustomers = customers;
    setUpdatingCustomerId(customerId);
    setCustomers((current) =>
      current.map((item) => (String(item?.id) === String(customerId) ? { ...item, status: nextStatus } : item))
    );

    try {
      const response = await apiClient.put(`/customers/${customerId}`, {
        status: nextStatus,
      });
      const data = response.data;

      const normalized = normalizeCustomers([data])[0];
      if (normalized) {
        setCustomers((current) =>
          current.map((item) => (String(item?.id) === String(customerId) ? { ...item, ...normalized } : item))
        );
      }

      toast.success(`Customer marked ${formatStatus(nextStatus)}.`);
    } catch (err) {
      setCustomers(previousCustomers);
      toast.error(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          err?.message ||
          "Failed to update customer."
      );
    } finally {
      setUpdatingCustomerId(null);
    }
  }, [customers, updatingCustomerId]);

  const handleConfirmDelete = useCallback(async () => {
    if (!deleteTarget?.id || deletingCustomerId) return;

    const customerId = deleteTarget.id;
    const previousCustomers = customers;
    setDeletingCustomerId(customerId);
    setDeleteTargetId(null);
    setCustomers((current) => current.filter((customer) => String(customer?.id) !== String(customerId)));

    if (String(selectedCustomerId) === String(customerId)) {
      setSelectedCustomerId(null);
    }

    try {
      await apiClient.delete(`/customers/${customerId}`);

      toast.success("Customer deleted.");
    } catch (err) {
      setCustomers(previousCustomers);
      toast.error(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          err?.message ||
          "Failed to delete customer."
      );
    } finally {
      setDeletingCustomerId(null);
    }
  }, [customers, deleteTarget, deletingCustomerId, selectedCustomerId]);

  return (
    <div className="min-h-[calc(100vh-8rem)] w-full min-w-0 overflow-x-hidden">
      <CustomerDetailsModal
        customer={selectedCustomer}
        open={!!selectedCustomer}
        onClose={() => setSelectedCustomerId(null)}
        onStatusChange={handleStatusChange}
        updating={selectedCustomer && String(updatingCustomerId ?? "") === String(selectedCustomer.id)}
      />

      <DeleteCustomerModal
        customer={deleteTarget}
        open={!!deleteTarget}
        deleting={!!deletingCustomerId}
        onClose={() => {
          if (!deletingCustomerId) setDeleteTargetId(null);
        }}
        onConfirm={handleConfirmDelete}
      />

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100 md:text-3xl">Customers</h1>
          <p className="mt-1 max-w-2xl text-sm text-zinc-400">
            Manage customer profiles, lifecycle status, and purchase history.
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

      <CustomersStats customers={customers} loading={loading} />

      <CustomersToolbar
        search={search}
        onSearchChange={handleSearchChange}
        status={status}
        onStatusChange={handleStatusFilterChange}
        sortBy={sortBy}
        onSortChange={handleSortChange}
        onClearFilters={handleClearFilters}
        hasFilters={hasFilters}
        loading={loading}
      />

      {hasFilters && (
        <div className="mb-4 flex flex-wrap gap-2">
          {search.trim() && <FilterChip label="Search" value={search.trim()} onClear={() => handleSearchChange("")} />}
          {status !== "ALL" && (
            <FilterChip label="Status" value={formatStatus(status)} onClear={() => handleStatusFilterChange("ALL")} />
          )}
          {sortBy !== "joined_desc" && (
            <FilterChip
              label="Sort"
              value={SORT_OPTIONS.find((option) => option.value === sortBy)?.label || "Custom"}
              onClear={() => handleSortChange("joined_desc")}
            />
          )}
        </div>
      )}

      {loading ? (
        <TableSkeleton />
      ) : error ? (
        <ErrorState message={error} onRetry={() => setReloadKey((key) => key + 1)} />
      ) : filteredCustomers.length === 0 ? (
        <EmptyState filtered={hasFilters} />
      ) : (
        <>
          <div className="hidden md:block">
            <CustomersTable
              customers={pagedCustomers}
              page={visiblePage}
              pageCount={pageCount}
              totalCount={filteredCustomers.length}
              onPageChange={handlePageChange}
              onView={(customer) => setSelectedCustomerId(customer?.id)}
              onDelete={(customer) => setDeleteTargetId(customer?.id)}
              onStatusChange={handleStatusChange}
              updatingCustomerId={updatingCustomerId}
            />
          </div>

          <div className="md:hidden">
            <CustomerMobileCards
              customers={pagedCustomers}
              onView={(customer) => setSelectedCustomerId(customer?.id)}
              onDelete={(customer) => setDeleteTargetId(customer?.id)}
              onStatusChange={handleStatusChange}
              updatingCustomerId={updatingCustomerId}
            />
            <div className="mt-4 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950">
              <Pagination
                currentPage={visiblePage}
                pageCount={pageCount}
                totalCount={filteredCustomers.length}
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
