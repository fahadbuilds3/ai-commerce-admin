import React, { useState, useMemo, useEffect, useCallback, useRef } from "react";
import {
  //HiOutlineSearch,
  HiOutlineEye,
  HiOutlineTrash,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiXMark,
} from "react-icons/hi2";
import { FiTrash2 } from "react-icons/fi";
import { FiEdit2 } from "react-icons/fi";
import { format } from "date-fns";

/**
 * ---- PRODUCTION-READY, MODULAR ORDERS DASHBOARD PAGE (Backend Integrated) ----
 *  - Responsive, premium dark SaaS styling
 *  - All helper components kept in-file for now per requirements
 *  - Mobile horizontal scrolling, stacking, no overflows
 *  - Uses backend data from /api/orders
 *  - Handles loading, error, empty, refetch (and missing data safety)
 */

const PAGE_SIZE = 15;

// --- Premium Order Details Modal w/ Inline Order Status Editing ---
function OrderDetailsModal({
  order,
  open,
  onClose,
  onStatusChange,
  statusUpdating,
}) {
  const backdropRef = useRef();
  const closeBtnRef = useRef();
  const selectRef = useRef();

  // ESC + click outside close
  useEffect(() => {
    if (!open) return;
    function handleKey(e) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  useEffect(() => {
    // Focus the close button for a11y
    if (open && closeBtnRef.current) {
      closeBtnRef.current.focus();
    }
  }, [open]);

  // Animate modal: fade/scale in
  // (uses animate-fade-in-scale from Tailwind or custom, otherwise fallback with inline)
  // Also disables background scrolling on modal open
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open || !order) return null;

  // Defensive: find customer name/email
  let customerName = "";
  let customerEmail = "";
  if (order?.user && typeof order.user === "object") {
    if (order.user.name) customerName = String(order.user.name).trim();
    if (order.user.email) customerEmail = String(order.user.email).trim();
  }
  if (!customerName && order?.customerName) {
    customerName = String(order.customerName).trim();
  }
  if (!customerEmail && order?.customerEmail) {
    customerEmail = String(order.customerEmail).trim();
  }

  const items = Array.isArray(order?.items) ? order.items : [];
  const total = typeof order?.total === "number" ? order.total : null;

  // Defensive/derived statuses
  const orderStatus =
    typeof order?.status === "string"
      ? order.status
      : typeof order?.orderStatus === "string"
      ? order.orderStatus
      : undefined;

  const paymentStatus =
    typeof order?.paymentStatus === "string" ? order.paymentStatus : undefined;

  // Defensive: order date
  let dateStr = "-";
  if (order?.createdAt) {
    let dateObj;
    if (order.createdAt instanceof Date) dateObj = order.createdAt;
    else if (
      typeof order.createdAt === "string" &&
      !isNaN(Date.parse(order.createdAt))
    )
      dateObj = new Date(order.createdAt);
    if (dateObj) dateStr = format(dateObj, "PPP • h:mm a");
  }

  // Click outside handler
  function handleBackdrop(e) {
    if (e.target === backdropRef.current) onClose();
  }

  // --- Status Select/Dropdown (update from parent) ---
  const statusOpts = [
    { value: "PENDING", text: "Pending" },
    { value: "PROCESSING", text: "Processing" },
    { value: "SHIPPED", text: "Shipped" },
    { value: "DELIVERED", text: "Delivered" },
    { value: "CANCELLED", text: "Cancelled" },
  ];
  const currentStatusVal = (() => {
    // Defensive to support lowercase/legacy
    let val = (orderStatus || "").toString().toUpperCase();
    if (!statusOpts.find(opt => opt.value === val)) return "PENDING";
    return val;
  })();

  return (
    <div
      ref={backdropRef}
      onClick={handleBackdrop}
      className="fixed z-40 inset-0 flex items-center justify-center bg-zinc-900/70 backdrop-blur-sm transition-all"
      aria-modal="true"
      aria-labelledby="order-modal-title"
      role="dialog"
    >
      <div
        className="relative w-full max-w-xl mx-2 md:mx-0 bg-zinc-950 rounded-xl shadow-2xl border border-zinc-800 p-6 md:p-8 flex flex-col gap-5 outline-none animate-fade-in-scale"
        tabIndex={-1}
        style={{ boxShadow: "0 6px 40px 0 rgba(20,20,25,0.26)" }}
      >
        {/* Close button */}
        <button
          ref={closeBtnRef}
          onClick={onClose}
          aria-label="Close order details"
          className="absolute top-3 right-3 p-2 rounded-full text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900 transition focus-visible:ring-2 ring-blue-700"
        >
          <HiXMark className="w-6 h-6" />
        </button>
        {/* Header - Order ID + Status */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <span className="font-mono text-xs text-zinc-400">
            Order&nbsp;ID:&nbsp;
            <span className="font-semibold text-zinc-100">
              {order?.id ?? (
                <span className="italic text-zinc-500">N/A</span>
              )}
            </span>
          </span>
          {/* Status + Select */}
          <div className="flex items-center gap-2 min-w-[160px]">
            <StatusBadge status={currentStatusVal} />
            <form
              onSubmit={e => e.preventDefault()}
              className="ml-2"
              style={{ minWidth: 120 }}
              autoComplete="off"
            >
              <label htmlFor="status-select" className="sr-only">
                Update order status
              </label>
              <select
                id="status-select"
                ref={selectRef}
                className={`bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs rounded-lg px-3 py-1 focus:outline-none focus:ring-2 ring-blue-700 transition duration-200 cursor-pointer min-w-[92px] mr-2
                  ${statusUpdating ? "opacity-70 pointer-events-none" : ""}
                `}
                value={currentStatusVal}
                disabled={statusUpdating}
                style={{
                  minWidth: 88,
                  fontWeight: 500,
                  fontFamily: "inherit",
                  transition: "border .14s, background .16s",
                }}
                onChange={e => {
                  const val = e.target.value;
                  if (val !== currentStatusVal && onStatusChange) {
                    onStatusChange(val, order?.id);
                  }
                }}
              >
                {statusOpts.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.text}
                  </option>
                ))}
              </select>
              {statusUpdating && (
                <span className="ml-1 align-middle inline-block">
                  <svg
                    className="animate-spin h-4 w-4 text-zinc-400"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx={12}
                      cy={12}
                      r={10}
                      stroke="currentColor"
                      strokeWidth={4}
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4z"
                    />
                  </svg>
                </span>
              )}
            </form>
          </div>
        </div>
        {/* Customer */}
        <div className="flex flex-col gap-0.5">
          <span className="text-sm text-zinc-500">Customer</span>
          <span className="text-base text-zinc-100 font-semibold truncate">
            {customerName || (
              <span className="italic text-zinc-500">Unknown</span>
            )}
          </span>
          <span className="text-xs text-zinc-400 truncate">
            {customerEmail || (
              <span className="italic text-zinc-700">No email</span>
            )}
          </span>
        </div>
        {/* Details Row: Payment, Order Date */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-6">
          <div>
            <span className="text-sm text-zinc-500">Payment</span>
            <div className="mt-0.5">
              <PaymentBadge status={paymentStatus} />
            </div>
          </div>
          <div>
            <span className="text-sm text-zinc-500">Order Date</span>
            <div className="mt-0.5 text-zinc-100 text-sm">{dateStr}</div>
          </div>
          <div>
            <span className="text-sm text-zinc-500">Total</span>
            <div className="mt-0.5 text-green-300 text-base font-medium">
              {typeof total === "number" ? (
                `$${total.toLocaleString()}`
              ) : (
                <span className="text-zinc-500">-</span>
              )}
            </div>
          </div>
        </div>
        {/* Items List */}
        <div>
          <span className="text-sm text-zinc-500 mb-1 block">Items</span>
          {items.length === 0 ? (
            <div className="text-zinc-500 text-sm italic py-5 flex items-center justify-center border border-zinc-900 rounded-lg bg-zinc-900">
              No products in this order.
            </div>
          ) : (
            <div className="rounded-lg border border-zinc-900 bg-zinc-900 overflow-x-auto">
              <table className="w-full min-w-[350px] text-sm">
                <thead>
                  <tr className="text-xs text-zinc-500 bg-zinc-900/70">
                    <th className="px-4 py-2 text-left font-semibold">Product</th>
                    <th className="px-4 py-2 text-right font-semibold">Qty</th>
                    <th className="px-4 py-2 text-right font-semibold">Price</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => {
                    // Defensive: support nullish or incomplete item objects
                    const name =
                      typeof item === "object" && item?.name
                        ? String(item.name)
                        : (
                          <span className="italic text-zinc-500">Unknown</span>
                        );
                    const qty =
                      typeof item === "object" && typeof item?.quantity === "number"
                        ? item.quantity
                        : "--";
                    const price =
                      typeof item === "object" && typeof item?.price === "number"
                        ? `$${item.price.toLocaleString()}`
                        : "--";
                    return (
                      <tr
                        key={idx}
                        className={`border-b last:border-none border-zinc-900 hover:bg-zinc-950 transition`}
                      >
                        <td className="px-4 py-2 text-zinc-100 whitespace-nowrap max-w-[160px] truncate">
                          {name}
                        </td>
                        <td className="px-4 py-2 text-right text-zinc-300">{qty}</td>
                        <td className="px-4 py-2 text-right text-green-300">{price}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// --- Helper Components ---
function StatusBadge({ status }) {
  // Only support: PROCESSING, PENDING, SHIPPED, DELIVERED, CANCELLED
  // Defensive: accept also fulfilled, refunded, failed, unknown
  const map = {
    processing: "bg-indigo-900 text-indigo-200",
    pending: "bg-yellow-900 text-yellow-300",
    shipped: "bg-blue-900 text-blue-200",
    delivered: "bg-green-900 text-green-300",
    cancelled: "bg-red-900 text-red-300",
    fulfilled: "bg-green-900 text-green-300",
    refunded: "bg-purple-900 text-purple-200",
    failed: "bg-red-950 text-red-300",
    unknown: "bg-zinc-800 text-zinc-200",
  };
  let key = "unknown";
  if (typeof status === "string") {
    key = status.toLowerCase();
    // map aliases
    if (key === "complete") key = "delivered";
    if (key === "cancel") key = "cancelled";
    if (!map[key]) key = "unknown";
  }
  return (
    <span
      className={`inline-block px-2 py-0.5 min-w-[80px] text-center rounded-full font-medium text-xs transition-all whitespace-nowrap ${
        map[key] || map.unknown
      }`}
      title={key.charAt(0).toUpperCase() + key.slice(1)}
    >
      {key.charAt(0).toUpperCase() + key.slice(1)}
    </span>
  );
}

function PaymentBadge({ status }) {
  const map = {
    paid: "bg-green-950 text-green-300",
    refunded: "bg-purple-950 text-purple-200",
    pending: "bg-yellow-950 text-yellow-300",
    failed: "bg-red-950 text-red-300",
    unknown: "bg-zinc-800 text-zinc-200",
  };
  const key = typeof status === "string" ? status.toLowerCase() : "unknown";
  return (
    <span
      className={`inline-block px-2 py-0.5 min-w-[66px] text-center rounded-full font-medium text-xs transition-all whitespace-nowrap ${map[key] || map.unknown}`}
      title={key.charAt(0).toUpperCase() + key.slice(1)}
    >
      {key.charAt(0).toUpperCase() + key.slice(1)}
    </span>
  );
}

function StatsCard({ title, value, loading, colorClass }) {
  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-2xl flex flex-col gap-2 p-4 min-w-[112px]">
      <span className="text-sm text-zinc-400">{title}</span>
      {loading ? (
        <span className="h-7 bg-zinc-800 w-14 rounded animate-pulse block" />
      ) : (
        <span className={`text-xl font-bold ${colorClass || "text-zinc-100"}`}>{value}</span>
      )}
    </div>
  );
}

// --- Stats Section ---
function OrdersStats({ orders, loading }) {
  // Sum up stats on-demand, safety against missing data
  const stats = useMemo(() => {
    if (loading) return { total: 0, paid: 0, pending: 0, refunded: 0, cancelled: 0, revenue: 0 };
    let total = 0, paid = 0, pending = 0, refunded = 0, cancelled = 0, revenue = 0;
    orders.forEach((o) => {
      total += 1;
      const payment = (o?.paymentStatus || "").toLowerCase();
      const status = (o?.status || "").toLowerCase();
      if (payment === "paid") {
        paid += 1;
        revenue += Number(typeof o?.total === "number" ? o.total : 0);
      } else if (payment === "pending") pending += 1;
      else if (payment === "refunded") refunded += 1;
      if (status === "cancelled") cancelled += 1;
    });
    return { total, paid, pending, refunded, cancelled, revenue };
  }, [orders, loading]);
  return (
    <div className="mb-7 grid grid-cols-2 md:grid-cols-5 gap-4">
      <StatsCard title="Total Orders" value={stats.total} loading={loading} />
      <StatsCard
        title="Paid Orders"
        value={stats.paid}
        loading={loading}
        colorClass="text-green-400"
      />
      <StatsCard
        title="Pending Payment"
        value={stats.pending}
        loading={loading}
        colorClass="text-yellow-300"
      />
      <StatsCard
        title="Revenue"
        value={loading ? null : `$${stats.revenue.toLocaleString()}`}
        loading={loading}
        colorClass="text-blue-200"
      />
      <StatsCard
        title="Cancelled"
        value={stats.cancelled}
        loading={loading}
        colorClass="text-red-300"
      />
    </div>
  );
}

function ErrorState({ onRetry }) {
  return (
    <div className="py-20 flex flex-col items-center justify-center border border-zinc-800 bg-zinc-950 rounded-2xl w-full">
      <svg
        width={52}
        height={52}
        fill="none"
        viewBox="0 0 48 48"
        className="mb-5 text-red-900"
      >
        <circle cx={24} cy={24} r={22} fill="currentColor" fillOpacity={0.13} />
        <path
          d="M16 16L32 32M32 16L16 32"
          stroke="#ef4444"
          strokeWidth={2.5}
          strokeLinecap="round"
        />
      </svg>
      <div className="font-semibold text-lg text-red-300 mb-2">
        Unable to load orders
      </div>
      <div className="text-sm text-zinc-500 text-center mb-5">
        We couldn't fetch your orders. Please try again or check your network.
      </div>
      <button
        className="px-5 py-2 bg-zinc-900 hover:bg-zinc-800 rounded-xl text-zinc-200 border border-zinc-700 transition"
        onClick={onRetry}
        aria-label="Retry"
      >
        Retry
      </button>
    </div>
  );
}

function TableSkeleton({ rows = 7 }) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950 overflow-hidden animate-pulse">
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr>
              {Array.from({ length: 7 }).map((_, idx) => (
                <th key={idx} className="px-4 py-4 bg-zinc-900" />
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }).map((_, r) => (
              <tr key={r} className="border-b border-zinc-900">
                {Array.from({ length: 7 }).map((_, c) => (
                  <td key={c} className="px-4 py-4">
                    <div className="h-3.5 bg-zinc-800 rounded w-3/5" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// --- Orders Table (Desktop) ---
function OrdersTable({
  orders,
  page,
  pageSize,
  totalCount,
  onPageChange,
  onView,
  onEdit,
  onDelete,
}) {
  return (
    <div className="rounded-2xl overflow-x-auto border border-zinc-800 bg-zinc-950 relative">
      <table className="min-w-full border-separate border-spacing-0 text-sm">
        <thead className="sticky top-0 z-10">
          <tr className="bg-zinc-900">
            <th className="px-4 py-3 text-left text-xs text-zinc-500 font-semibold whitespace-nowrap">
              Order ID
            </th>
            <th className="px-4 py-3 text-left text-xs text-zinc-500 font-semibold whitespace-nowrap">
              Customer
            </th>
            <th className="px-4 py-3 text-left text-xs text-zinc-500 font-semibold whitespace-nowrap">
              Total
            </th>
            <th className="px-4 py-3 text-left text-xs text-zinc-500 font-semibold whitespace-nowrap">
              Payment Status
            </th>
            <th className="px-4 py-3 text-left text-xs text-zinc-500 font-semibold whitespace-nowrap">
              Order Status
            </th>
            <th className="px-4 py-3 text-left text-xs text-zinc-500 font-semibold whitespace-nowrap">
              Date
            </th>
            <th className="px-4 py-3 text-center text-xs text-zinc-500 font-semibold whitespace-nowrap">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {(orders || []).map((order) => {
            let customerName = "";
            if (order?.user && typeof order.user === "object") {
              customerName =
                (order.user.name && String(order.user.name).trim()) ||
                (order.user.email && String(order.user.email).trim()) ||
                "";
            }
            if (!customerName && order?.customerName) {
              customerName = order.customerName;
            }
            customerName = customerName || null;
            const orderStatus =
              typeof order?.status === "string"
                ? order.status
                : typeof order?.orderStatus === "string"
                ? order.orderStatus
                : undefined;

            return (
              <tr
                key={order?.id ?? Math.random()}
                className="border-b border-zinc-900 hover:bg-zinc-900 transition group"
              >
                <td className="px-4 py-3 font-mono text-zinc-300 truncate max-w-[90px]">
                  {order?.id ?? <span className="italic text-zinc-500">N/A</span>}
                </td>
                <td className="px-4 py-3 text-zinc-100 whitespace-nowrap">
                  {customerName ? (
                    customerName
                  ) : (
                    <span className="italic text-zinc-500">N/A</span>
                  )}
                </td>
                <td className="px-4 py-3 text-green-300 font-semibold">
                  {typeof order?.total === "number" ? (
                    `$${order.total.toLocaleString()}`
                  ) : (
                    <span>-</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <PaymentBadge status={order?.paymentStatus} />
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={orderStatus} />
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  {order?.createdAt
                    ? (() => {
                        let dateObj;
                        if (order.createdAt instanceof Date)
                          dateObj = order.createdAt;
                        else if (
                          typeof order.createdAt === "string" &&
                          !isNaN(Date.parse(order.createdAt))
                        )
                          dateObj = new Date(order.createdAt);
                        else return "-";
                        return format(dateObj, "MMM d, yyyy");
                      })()
                    : "-"}
                </td>
                <td className="px-4 py-3 flex gap-1 items-center justify-center min-w-[110px]">
                  <button
                    onClick={() => onView(order)}
                    title="View"
                    className="p-1 rounded hover:bg-zinc-800 text-zinc-100 focus-visible:ring-1 ring-zinc-700"
                  >
                    <HiOutlineEye className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => onEdit(order)}
                    title="Edit"
                    className="p-1 rounded hover:bg-zinc-800 text-zinc-100 focus-visible:ring-1 ring-zinc-700"
                  >
                    <FiEdit2 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => onDelete(order)}
                    title="Delete"
                    disabled
                    className="p-1 rounded hover:bg-zinc-950 text-red-400 focus-visible:ring-1 ring-zinc-700"
                  >
                    <HiOutlineTrash className="w-5 h-5" />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {totalCount > pageSize && (
        <div className="py-3 px-4 flex items-center justify-between bg-zinc-950 border-t border-zinc-900">
          <span className="text-zinc-500 text-xs">
            Showing {1 + page * pageSize}&ndash;
            {Math.min((page + 1) * pageSize, totalCount)} of {totalCount}
          </span>
          <div className="flex gap-1">
            <button
              className="p-1 rounded disabled:opacity-40 bg-zinc-900 hover:bg-zinc-800 transition"
              disabled={page === 0}
              onClick={() => onPageChange(page - 1)}
              aria-label="Prev page"
            >
              <HiOutlineChevronLeft className="w-5 h-5 text-zinc-400" />
            </button>
            <button
              className="p-1 rounded disabled:opacity-40 bg-zinc-900 hover:bg-zinc-800 transition"
              disabled={(page + 1) * pageSize >= totalCount}
              onClick={() => onPageChange(page + 1)}
              aria-label="Next page"
            >
              <HiOutlineChevronRight className="w-5 h-5 text-zinc-400" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// --- Mobile Orders Cards (Stacked) ---
function OrdersMobileCards({ orders, onView, onEdit, onDelete }) {
  return (
    <div className="space-y-4 w-full">
      {(orders || []).map((order) => {
        let customerName = "";
        if (order?.user && typeof order.user === "object") {
          customerName =
            (order.user.name && String(order.user.name).trim()) ||
            (order.user.email && String(order.user.email).trim()) ||
            "";
        }
        if (!customerName && order?.customerName) {
          customerName = order.customerName;
        }
        customerName = customerName || null;
        const orderStatus =
          typeof order?.status === "string"
            ? order.status
            : typeof order?.orderStatus === "string"
            ? order.orderStatus
            : undefined;

        return (
          <div
            key={order?.id ?? Math.random()}
            className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4 flex flex-col gap-2"
          >
            <div className="flex items-center justify-between">
              <div className="font-mono text-xs text-zinc-500">
                ID: {order?.id ?? <span className="italic text-zinc-500">N/A</span>}
              </div>
              <StatusBadge status={orderStatus} />
            </div>
            <div className="text-zinc-100 font-semibold">
              {customerName ? (
                customerName
              ) : (
                <span className="italic text-zinc-500">N/A</span>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="font-bold text-green-300">
                {typeof order?.total === "number" ? (
                  `$${order.total.toLocaleString()}`
                ) : (
                  <span>-</span>
                )}
              </span>
              <PaymentBadge status={order?.paymentStatus} />
            </div>
            <div className="text-xs text-zinc-400 flex items-center gap-1">
              <span>
                {Array.isArray(order?.items)
                  ? order.items.length
                  : "--"}{" "}
                item
                {Array.isArray(order?.items) && order.items.length === 1
                  ? ""
                  : "s"}
              </span>
              <span>&middot;</span>
              <span>
                {order?.createdAt
                  ? (() => {
                      let dateObj;
                      if (order.createdAt instanceof Date)
                        dateObj = order.createdAt;
                      else if (
                        typeof order.createdAt === "string" &&
                        !isNaN(Date.parse(order.createdAt))
                      )
                        dateObj = new Date(order.createdAt);
                      else return "-";
                      return format(dateObj, "MMM d, yyyy");
                    })()
                  : "-"}
              </span>
            </div>
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => onView(order)}
                title="View"
                className="p-1 rounded hover:bg-zinc-800 text-zinc-100 focus-visible:ring-1 ring-zinc-700"
              >
                <HiOutlineEye className="w-5 h-5" />
              </button>
              <button
                onClick={() => onEdit(order)}
                title="Edit"
                className="p-1 rounded hover:bg-zinc-800 text-zinc-100 focus-visible:ring-1 ring-zinc-700"
              >
                <FiEdit2 className="w-5 h-5" />
              </button>
              <button
                onClick={() => onDelete(order)}
                title="Delete"
                disabled
                className="p-1 rounded hover:bg-zinc-950 text-red-400 focus-visible:ring-1 ring-zinc-700"
              >
                <HiOutlineTrash className="w-5 h-5" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// --- Empty State ---
function EmptyState() {
  return (
    <div className="py-20 flex flex-col items-center justify-center border border-zinc-800 bg-zinc-950 rounded-2xl w-full">
      <svg
        width={52}
        height={52}
        fill="none"
        viewBox="0 0 48 48"
        className="mb-5 text-zinc-700"
      >
        <rect x={8} y={18} width={32} height={22} rx={4} fill="currentColor" />
        <rect
          x={13}
          y={8}
          width={22}
          height={10}
          rx={2.5}
          fill="currentColor"
          fillOpacity={0.3}
        />
      </svg>
      <div className="font-semibold text-lg text-zinc-300 mb-2">
        No orders found
      </div>
      <div className="text-sm text-zinc-500 text-center">
        Orders will appear here when created in your store.
      </div>
    </div>
  );
}

// --- Main Orders Page ---
export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const [reloadFlag, setReloadFlag] = useState(0);

  // Order Details Modal state
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [updatingOrder, setUpdatingOrder] = useState(null); // id being updated

  // --- Fetch Orders from Backend ---
  const fetchOrders = useCallback(() => {
    setLoading(true);
    setError(null);

    fetch("http://localhost:5000/api/orders")
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data?.error || "Failed request");
        }
        if (!Array.isArray(data)) {
          throw new Error("Response is not an array");
        }
        setOrders(data);
      })
      .catch((err) => {
        setOrders([]);
        setError(err.message || "Unable to load orders.");
      })
      .finally(() => setLoading(false));
  }, []);

  // Initial + refetch on reloadFlag
  useEffect(() => {
    fetchOrders();
  }, [fetchOrders, reloadFlag]);

  // Filter and paged data (safe against missing fields)
  const filteredOrders = useMemo(() => {
    if (!query.trim()) return orders;
    const q = query.trim().toLowerCase();
    return (orders || []).filter((o) => {
      let customer = "";
      if (o?.user && typeof o.user === "object") {
        customer =
          (o.user.name && String(o.user.name).toLowerCase()) ||
          (o.user.email && String(o.user.email).toLowerCase()) ||
          "";
      } else if (o?.customerName) {
        customer = String(o.customerName).toLowerCase();
      }
      const id = typeof o?.id !== "undefined" ? String(o.id) : "";
      return customer.includes(q) || id.includes(q);
    });
  }, [orders, query]);

  const paged = useMemo(
    () =>
      filteredOrders.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE),
    [filteredOrders, page]
  );

  // On orders/filter reset page if query or orders change
  useEffect(() => {
    setPage(0);
  }, [query, orders.length]);

  // Table actions
  function handleView(order) {
    setSelectedOrder(order);
  }
  function handleEdit(order) {}
  function handleDelete(order) {}

  function handleCloseModal() {
    setSelectedOrder(null);
  }

  // --- Status Change Handler ---
  const handleOrderStatusChange = (newStatus, orderId) => {
    if (!orderId) return;
    setUpdatingOrder(orderId);

    // Simulate status update with local UI update and loading UX (prod: PUT/PATCH API here)
    setOrders((prev) =>
      prev.map((o) =>
        String(o.id) === String(orderId)
          ? {
              ...o,
              status: newStatus,
            }
          : o
      )
    );
    // Also update modal if it's on this order
    setSelectedOrder((cur) =>
      cur && String(cur.id) === String(orderId)
        ? {
            ...cur,
            status: newStatus,
          }
        : cur
    );

    // Fake network request for polished feedback!
    setTimeout(() => {
      setUpdatingOrder(null);
      // Would re-sync/reload here if needed.
    }, 900);
  };

  const handleRetry = () => setReloadFlag((flag) => flag + 1);

  return (
    <div className="w-full px-0 md:px-8 py-4 md:py-8 min-h-[90vh]">
      {/* Order Details Modal */}
      <OrderDetailsModal
        order={selectedOrder}
        open={!!selectedOrder}
        onClose={handleCloseModal}
        onStatusChange={handleOrderStatusChange}
        statusUpdating={
          selectedOrder && updatingOrder
            ? String(selectedOrder.id) === String(updatingOrder)
            : false
        }
      />
      {/* Page header */}
      <div className="mb-2">
        <h1 className="text-2xl md:text-3xl font-bold text-zinc-100 mb-1">
          Orders
        </h1>
        <p className="text-zinc-400 mb-5 md:mb-7">
          All ecommerce sales and order management in real time.
        </p>
      </div>
      {/* Stats */}
      <OrdersStats orders={orders} loading={loading} />
      {/* Search/Filter bar */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mb-7 items-stretch sm:items-end max-w-full">
        <div className="relative flex-1 max-w-[400px]">
          <FiTrash2 className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 w-5 h-5" />
          <input
            className="bg-zinc-900 border border-zinc-800 pl-10 pr-4 py-2 w-full rounded-xl text-zinc-200 placeholder:text-zinc-500 focus:outline-none"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            spellCheck={false}
            placeholder="Search by customer or order ID…"
            autoComplete="off"
            aria-label="Search by customer or order ID"
          />
        </div>
        {/* Possible additional filters */}
      </div>
      {/* Table or states */}
      {loading ? (
        <>
          <div className="hidden md:block">
            <TableSkeleton />
          </div>
          <div className="block md:hidden">
            <TableSkeleton rows={4} />
          </div>
        </>
      ) : error ? (
        <ErrorState onRetry={handleRetry} />
      ) : filteredOrders.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <div className="hidden md:block">
            <OrdersTable
              orders={paged}
              page={page}
              pageSize={PAGE_SIZE}
              totalCount={filteredOrders.length}
              onPageChange={setPage}
              onView={handleView}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          </div>
          <div className="block md:hidden">
            <OrdersMobileCards
              orders={paged}
              onView={handleView}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
            {filteredOrders.length > PAGE_SIZE && (
              <div className="flex items-center justify-between mt-4 px-2">
                <span className="text-zinc-500 text-xs">
                  Showing {1 + page * PAGE_SIZE}&ndash;
                  {Math.min(
                    (page + 1) * PAGE_SIZE,
                    filteredOrders.length
                  )}{" "}
                  of {filteredOrders.length}
                </span>
                <div className="flex gap-1">
                  <button
                    className="p-1 rounded disabled:opacity-40 bg-zinc-900 hover:bg-zinc-800 transition"
                    disabled={page === 0}
                    onClick={() => setPage(page - 1)}
                    aria-label="Prev page"
                  >
                    <HiOutlineChevronLeft className="w-5 h-5 text-zinc-400" />
                  </button>
                  <button
                    className="p-1 rounded disabled:opacity-40 bg-zinc-900 hover:bg-zinc-800 transition"
                    disabled={
                      (page + 1) * PAGE_SIZE >= filteredOrders.length
                    }
                    onClick={() => setPage(page + 1)}
                    aria-label="Next page"
                  >
                    <HiOutlineChevronRight className="w-5 h-5 text-zinc-400" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}