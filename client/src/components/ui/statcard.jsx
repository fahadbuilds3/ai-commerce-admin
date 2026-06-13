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
    ? "text-green-700 bg-green-50 dark:text-green-400 dark:bg-green-900/20"
    : "text-red-700 bg-red-50 dark:text-red-400 dark:bg-red-900/20";

  return (
    <div
      className="surface-card group flex min-w-[220px] max-w-full flex-1 transition-colors duration-200 hover:border-slate-300 dark:hover:border-slate-600"
    >
      <div className="flex items-center p-5 w-full">
        {/* Icon */}
        <div
          className="mr-5 flex h-12 w-12 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-blue-700 transition-colors group-hover:bg-blue-100 dark:border-slate-700 dark:bg-slate-800 dark:text-indigo-300 dark:group-hover:bg-slate-700"
        >
          {icon}
        </div>
        {/* Stat Content */}
        <div className="flex-1 min-w-0">
          {/* Value */}
          <div className="flex items-baseline gap-2">
            <span className="truncate text-2xl font-bold text-slate-900 dark:text-white">{value}</span>
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
          <div className="mt-1 truncate text-sm font-medium text-slate-500 dark:text-slate-400">{title}</div>
        </div>
      </div>
    </div>
  );
};

export default StatCard;
