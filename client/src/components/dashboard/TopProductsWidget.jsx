import React from "react";
import { TrendingUp } from "lucide-react";
import { motion } from "framer-motion";

const Skeleton = () => (
  <div className="h-6 bg-slate-100 dark:bg-slate-800/60 rounded animate-pulse mb-2" />
);

export default function TopProductsWidget({ products = [], loading, error, onRetry }) {
  return (
    <div className="bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 shadow p-4 sm:p-5 mt-4">
      <motion.div className="mb-3 flex items-center gap-2 text-cyan-700 dark:text-cyan-400">
        <TrendingUp size={18} />
        <span className="font-bold text-slate-900 dark:text-slate-200 tracking-tight">Top Selling Products</span>
      </motion.div>
      {loading ? (
        Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} />)
      ) : error ? (
        <p className="py-3 text-sm text-rose-600 dark:text-rose-400">
          Failed to load.{" "}
          {onRetry && (
            <button type="button" onClick={onRetry} className="btn btn-ghost h-8 px-2 text-cyan-700 dark:text-cyan-400">
              Retry
            </button>
          )}
        </p>
      ) : products.length === 0 ? (
        <p className="text-slate-500 dark:text-slate-400 text-sm py-3">No sales data yet.</p>
      ) : (
        <ul className="space-y-2">
          {products.map((row, idx) => (
            <motion.li
              key={row.productId ?? idx}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="flex items-center justify-between gap-2 py-1.5 border-b border-slate-200 dark:border-slate-700 last:border-0"
            >
              <motion.div className="flex items-center gap-2 min-w-0">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 w-5">{idx + 1}</span>
                <span className="text-sm text-slate-900 dark:text-slate-200 truncate">
                  {row.product?.name ?? "Unknown product"}
                </span>
              </motion.div>
              <span className="text-xs font-semibold text-cyan-400 bg-cyan-950/50 px-2 py-0.5 rounded-lg shrink-0">
                {row.quantitySold ?? 0} sold
              </span>
            </motion.li>
          ))}
        </ul>
      )}
    </div>
  );
}
