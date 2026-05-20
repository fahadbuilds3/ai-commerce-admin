import React from "react";
import { AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";

const Skeleton = () => (
  <div className="h-6 bg-zinc-800/60 rounded animate-pulse mb-2" />
);

export default function LowStockWidget({ products = [], loading, error, onRetry }) {
  return (
    <motion.div className="bg-gradient-to-br from-rose-950/40 to-zinc-900/90 rounded-xl border border-zinc-800 shadow p-4 sm:p-5">
      <motion.div className="flex items-center gap-2 text-rose-400 mb-3">
        <AlertTriangle size={18} />
        <span className="font-bold text-zinc-200 tracking-tight">Low Stock Alerts</span>
      </motion.div>
      {loading ? (
        Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} />)
      ) : error ? (
        <p className="text-rose-400 text-sm py-3">
          Failed to load.{" "}
          {onRetry && (
            <button type="button" onClick={onRetry} className="text-cyan-400 hover:underline">
              Retry
            </button>
          )}
        </p>
      ) : products.length === 0 ? (
        <p className="text-zinc-500 text-sm py-3">All products are well stocked.</p>
      ) : (
        <ul className="space-y-1">
          {products.map((p) => (
            <motion.li
              key={p.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex justify-between items-center py-1.5 text-zinc-300 text-sm"
            >
              <span className="truncate max-w-[160px]">{p.name}</span>
              <span className="bg-rose-900/60 px-2 py-0.5 rounded-lg text-xs font-mono text-rose-200 ml-2 shrink-0">
                {p.stock} left
              </span>
            </motion.li>
          ))}
        </ul>
      )}
    </motion.div>
  );
}
