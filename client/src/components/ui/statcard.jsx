import React from "react";

/**
 * StatCard - A reusable, responsive analytics stat card for SaaS dashboards.
 *
 * Props:
 * - title (string): Descriptor of the stat (e.g., "Revenue")
 * - value (string|number): Main stat value (e.g., "$12,420")
 * - icon (JSX): Icon element (e.g., <DollarSign />)
 * - trend (object): { value: string|number, isUp: boolean }
 *      Ex: { value: "+8.2%", isUp: true }
 */
const StatCard = ({ title, value, icon, trend }) => {
  // color for trend
  const trendColor = trend?.isUp
    ? "text-green-400 bg-green-900/20"
    : "text-red-400 bg-red-900/20";

  return (
    <div
      className="flex flex-1 min-w-[220px] max-w-full rounded-2xl bg-zinc-900 shadow-lg border border-zinc-800 transition-transform hover:-translate-y-1 hover:shadow-xl hover:border-indigo-700/70 duration-200 group"
    >
      <div className="flex items-center p-5 w-full">
        {/* Icon */}
        <div
          className="flex items-center justify-center h-12 w-12 rounded-xl bg-zinc-800 text-indigo-400 shadow-inner mr-5 group-hover:bg-indigo-950 transition"
        >
          {icon}
        </div>
        {/* Stat Content */}
        <div className="flex-1 min-w-0">
          {/* Value */}
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white truncate">{value}</span>
            {trend && (
              <span
                className={`flex items-center px-2 py-0.5 ml-1 rounded-full text-xs font-medium ${trendColor}`}
                title={trend.isUp ? "Up" : "Down"}
              >
                {trend.isUp ? (
                  <svg
                    className="h-4 w-4 mr-0.5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 20 20"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 10l5-5 5 5"
                    />
                  </svg>
                ) : (
                  <svg
                    className="h-4 w-4 mr-0.5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 20 20"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 10l5 5 5-5"
                    />
                  </svg>
                )}
                {trend.value}
              </span>
            )}
          </div>
          {/* Title */}
          <div className="text-sm font-medium text-zinc-400 mt-1 truncate">{title}</div>
        </div>
      </div>
    </div>
  );
};

export default StatCard;