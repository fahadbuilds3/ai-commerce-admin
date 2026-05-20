import React from "react";
import { motion } from "framer-motion";

const statusStyles = {
  PENDING: "bg-yellow-950/80 text-yellow-400",
  PROCESSING: "bg-blue-950/80 text-blue-400",
  PAID: "bg-emerald-950/80 text-emerald-400",
  SHIPPED: "bg-indigo-950/80 text-indigo-400",
  DELIVERED: "bg-green-950/80 text-green-400",
  CANCELLED: "bg-red-950/80 text-red-400",
  REFUNDED: "bg-violet-950/80 text-violet-400",
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
  <div className="h-6 bg-zinc-800/60 rounded animate-pulse mb-2" />
);

export default function RecentOrdersTable({ orders = [], loading, error, onRetry }) {
  return (
    <div className="bg-zinc-900/80 rounded-xl border border-zinc-800 shadow p-4 sm:p-5 mt-4 overflow-x-auto">
      <h3 className="font-bold text-zinc-200 mb-3 tracking-tight text-base sm:text-lg">
        Recent Orders
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full text-zinc-300 text-xs sm:text-sm min-w-[480px]">
          <thead>
            <tr className="text-zinc-400 border-b border-zinc-800 font-semibold">
              <th className="py-2 px-2 text-left">Order #</th>
              <th className="py-2 px-2 text-left">Customer</th>
              <th className="py-2 px-2 text-left">Date</th>
              <th className="py-2 px-2 text-left">Status</th>
              <th className="py-2 px-2 text-right">Total</th>
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
                <td colSpan={5} className="py-6 text-rose-400 text-center text-sm">
                  Failed to load orders.{" "}
                  {onRetry && (
                    <button
                      type="button"
                      onClick={onRetry}
                      className="text-cyan-400 hover:underline"
                    >
                      Retry
                    </button>
                  )}
                </td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-6 text-zinc-500 text-center text-sm">
                  No orders yet.
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <motion.tr
                  key={order.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="border-b border-zinc-800/70 last:border-b-0 hover:bg-zinc-800/40 transition"
                >
                  <td className="py-2 px-2 font-semibold text-white">
                    #{order.orderNumber ?? order.id?.slice(0, 8)}
                  </td>
                  <td className="py-2 px-2">
                    {order.customer?.name || order.customer?.email || "—"}
                  </td>
                  <td className="py-2 px-2">
                    {order.createdAt
                      ? new Date(order.createdAt).toLocaleDateString()
                      : "—"}
                  </td>
                  <td className="py-2 px-2">
                    <span
                      className={`px-2 py-0.5 rounded-lg text-xs font-semibold uppercase ${
                        statusStyles[order.status] ?? "bg-zinc-800 text-zinc-300"
                      }`}
                    >
                      {formatStatus(order.status)}
                    </span>
                  </td>
                  <td className="py-2 px-2 text-right font-mono text-emerald-400">
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
