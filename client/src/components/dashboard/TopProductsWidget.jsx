import React from "react";
import { TrendingUp } from "lucide-react";
import { motion } from "framer-motion";

const Skeleton = () => (
  <div className="h-6 bg-zinc-800/60 rounded animate-pulse mb-2" />
);

export default function TopProductsWidget({ products = [], loading, error, onRetry }) {
  return (
    <div className="bg-zinc-900/80 rounded-xl border border-zinc-800 shadow p-4 sm:p-5 mt-4">
      <motion.div className="flex items-center gap-2 text-cyan-400 mb-3">
        <TrendingUp size={18} />
        <span className="font-bold text-zinc-200 tracking-tight">Top Selling Products</span>
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
        <p className="text-zinc-500 text-sm py-3">No sales data yet.</p>
      ) : (
        <ul className="space-y-2">
          {products.map((row, idx) => (
            <motion.li
              key={row.productId ?? idx}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="flex items-center justify-between gap-2 py-1.5 border-b border-zinc-800/60 last:border-0"
            >
              <motion.div className="flex items-center gap-2 min-w-0">
                <span className="text-xs font-bold text-zinc-500 w-5">{idx + 1}</span>
                <span className="text-sm text-zinc-200 truncate">
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
