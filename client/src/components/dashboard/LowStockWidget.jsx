import React from "react";
import { AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";

const Skeleton = () => (
  <div className="h-6 bg-slate-100 dark:bg-slate-800/60 rounded animate-pulse mb-2" />
);

export default function LowStockWidget({ products = [], loading, error, onRetry }) {
  return (
    <motion.div className="bg-gradient-to-br from-rose-950/40 to-zinc-900/90 rounded-xl border border-slate-200 dark:border-slate-700 shadow p-4 sm:p-5">
      <motion.div className="mb-3 flex items-center gap-2 text-rose-600 dark:text-rose-400">
        <AlertTriangle size={18} />
        <span className="font-bold text-slate-900 dark:text-slate-200 tracking-tight">Low Stock Alerts</span>
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
        <p className="text-slate-500 dark:text-slate-400 text-sm py-3">All products are well stocked.</p>
      ) : (
        <ul className="space-y-1">
          {products.map((p) => (
            <motion.li
              key={p.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex justify-between items-center py-1.5 text-slate-700 dark:text-slate-300 text-sm"
            >
              <span className="truncate max-w-[160px]">{p.name}</span>
              <span className="ml-2 shrink-0 rounded-lg border border-red-200 bg-red-50 px-2 py-0.5 font-mono text-xs text-red-700 dark:border-rose-900/60 dark:bg-rose-900/60 dark:text-rose-200">
                {p.stock} left
              </span>
            </motion.li>
          ))}
        </ul>
      )}
    </motion.div>
  );
}
