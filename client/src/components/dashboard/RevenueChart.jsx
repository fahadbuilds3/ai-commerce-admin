import React from "react";
import { motion } from "framer-motion";

function formatMonthLabel(monthKey) {
  if (!monthKey) return "";
  const [year, month] = monthKey.split("-");
  const date = new Date(Number(year), Number(month) - 1, 1);
  return date.toLocaleString("default", { month: "short" });
}

function formatCurrency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value ?? 0);
}

const Skeleton = () => (
  <motion.div className="h-48 sm:h-56 w-full bg-zinc-800/60 rounded-lg animate-pulse" />
);

export default function RevenueChart({ data = [], loading, error, onRetry }) {
  const maxRevenue = Math.max(...data.map((d) => d.revenue ?? 0), 1);

  if (loading) {
    return (
      <div className="bg-zinc-900/80 rounded-xl border border-zinc-800 shadow p-4 sm:p-5">
        <h3 className="font-bold text-zinc-200 mb-4 text-base sm:text-lg">
          Revenue by Month
        </h3>
        <Skeleton />
      </div>
    );
  }

  if (error) {
    return (
      <motion.div className="bg-zinc-900/80 rounded-xl border border-zinc-800 shadow p-4 sm:p-5">
        <h3 className="font-bold text-zinc-200 mb-2">Revenue by Month</h3>
        <p className="text-rose-400 text-sm py-8 text-center">
          Failed to load chart.{" "}
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="text-cyan-400 hover:underline ml-1"
            >
              Retry
            </button>
          )}
        </p>
      </motion.div>
    );
  }

  if (!data.length) {
    return (
      <div className="bg-zinc-900/80 rounded-xl border border-zinc-800 shadow p-4 sm:p-5">
        <h3 className="font-bold text-zinc-200 mb-2">Revenue by Month</h3>
        <p className="text-zinc-500 text-sm py-12 text-center">
          No sales data yet.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-zinc-900/80 rounded-xl border border-zinc-800 shadow p-4 sm:p-5">
      <h3 className="font-bold text-zinc-200 mb-4 tracking-tight text-base sm:text-lg">
        Revenue by Month
      </h3>
      <div className="flex items-end gap-1 sm:gap-2 h-48 sm:h-56">
        {data.map((point, idx) => {
          const revenue = point.revenue ?? 0;
          const heightPct = Math.max((revenue / maxRevenue) * 100, revenue > 0 ? 4 : 0);
          return (
            <motion.div
              key={point.month}
              initial={{ opacity: 0, scaleY: 0 }}
              animate={{ opacity: 1, scaleY: 1 }}
              transition={{ delay: idx * 0.04, type: "spring", stiffness: 120 }}
              className="flex flex-col items-center flex-1 min-w-0 h-full justify-end group"
              title={`${formatMonthLabel(point.month)}: ${formatCurrency(revenue)}`}
            >
              <span className="text-[10px] sm:text-xs text-zinc-500 mb-1 opacity-0 group-hover:opacity-100 transition truncate max-w-full">
                {formatCurrency(revenue)}
              </span>
              <div
                className="w-full rounded-t-md bg-gradient-to-t from-cyan-700 to-cyan-400/90 min-h-[2px]"
                style={{ height: `${heightPct}%` }}
              />
              <span className="text-[10px] sm:text-xs text-zinc-500 mt-2 truncate w-full text-center">
                {formatMonthLabel(point.month)}
              </span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
