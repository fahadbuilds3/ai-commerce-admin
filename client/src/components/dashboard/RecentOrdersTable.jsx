import React from "react";
import { motion } from "framer-motion";

const statusStyles = {
  PENDING: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",
  PROCESSING: "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300",
  PAID: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
  SHIPPED: "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300",
  DELIVERED: "bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-300",
  CANCELLED: "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300",
  REFUNDED: "bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300",
};

function formatCurrency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value ?? 0);
}

function formatStatus(status) {
  if (!status) return "—";
  return String(status)
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

const Skeleton = () => (
  <div className="h-6 bg-slate-100 dark:bg-slate-800/60 rounded animate-pulse mb-2" />
);

export default function RecentOrdersTable({ orders = [], loading, error, onRetry }) {
  return (
    <div className="mt-4 min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <h3 className="border-b border-slate-200 px-4 py-3 text-base font-semibold tracking-tight text-slate-900 dark:border-slate-700 dark:text-slate-200 sm:px-5 sm:text-lg">
        Recent Orders
      </h3>
      <div className="max-w-full overflow-x-auto overscroll-x-contain">
        <table className="w-full min-w-[600px] text-xs text-slate-800 dark:text-slate-200 sm:text-sm">
          <thead className="bg-slate-50 dark:bg-slate-800/70">
            <tr className="text-xs font-semibold uppercase tracking-[0.06em] text-slate-600 dark:text-slate-300">
              <th className="border-b border-slate-200 px-4 py-3 text-left dark:border-slate-700">Order #</th>
              <th className="border-b border-slate-200 px-4 py-3 text-left dark:border-slate-700">Customer</th>
              <th className="border-b border-slate-200 px-4 py-3 text-left dark:border-slate-700">Date</th>
              <th className="border-b border-slate-200 px-4 py-3 text-left dark:border-slate-700">Status</th>
              <th className="border-b border-slate-200 px-4 py-3 text-right dark:border-slate-700">Total</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  <td colSpan={5}>
                    <Skeleton />
                  </td>
                </tr>
              ))
            ) : error ? (
              <tr>
                <td colSpan={5} className="py-6 text-center text-sm text-rose-600 dark:text-rose-400">
                  Failed to load orders.{" "}
                  {onRetry && (
                    <button
                      type="button"
                      onClick={onRetry}
                      className="btn btn-ghost h-8 px-2 text-cyan-700 dark:text-cyan-400"
                    >
                      Retry
                    </button>
                  )}
                </td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-6 text-slate-500 dark:text-slate-400 text-center text-sm">
                  No orders yet.
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <motion.tr
                  key={order.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="border-b border-slate-100 transition-colors last:border-b-0 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/60"
                >
                  <td className="whitespace-nowrap px-4 py-3 font-semibold text-slate-800 dark:text-slate-200">
                    #{order.orderNumber ?? order.id?.slice(0, 8)}
                  </td>
                  <td className="max-w-[190px] truncate px-4 py-3" title={order.customer?.name || order.customer?.email || "—"}>
                    {order.customer?.name || order.customer?.email || "—"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    {order.createdAt
                      ? new Date(order.createdAt).toLocaleDateString()
                      : "—"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <span
                      className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold uppercase ${
                        statusStyles[order.status] ?? "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      {formatStatus(order.status)}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right font-semibold text-emerald-700 dark:text-emerald-300">
                    {formatCurrency(order.totalAmount)}
                  </td>
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
