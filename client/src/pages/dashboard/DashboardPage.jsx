import React, { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  CartesianGrid,
} from "recharts";
import {
  FiArrowUpRight,
  FiDollarSign,
  FiShoppingCart,
  FiPackage,
  FiUsers,
  FiAlertTriangle,
} from "react-icons/fi";
import clsx from "clsx";

// --- Reusable Skeleton Loader ---
const Skeleton = ({ className = "" }) => (
  <div className={clsx("animate-pulse rounded bg-zinc-800/60", className)} />
);

// --- Statistic Card with Animation ---
const StatCard = ({
  icon: Icon,
  label,
  value,
  delta,
  loading,
  gradientFrom,
  gradientTo,
}) => (
  <motion.div
    initial={{ opacity: 0, y: 40 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ type: "spring", duration: 0.5 }}
    className="flex flex-col gap-3 p-4 sm:p-5 rounded-xl shadow bg-gradient-to-br min-w-0"
    style={{
      backgroundImage: `linear-gradient(135deg, ${gradientFrom}, ${gradientTo})`,
    }}
  >
    <div className="flex items-center gap-2 text-zinc-200">
      <span className="bg-zinc-900/40 p-2 rounded-lg">
        <Icon size={22} className="text-emerald-400" />
      </span>
      <span className="text-sm uppercase tracking-wide">{label}</span>
    </div>
    <div className="flex items-end justify-between w-full">
      {loading ? (
        <Skeleton className="w-24 h-8" />
      ) : (
        <motion.div
          key={value}
          animate={{ scale: [1.1, 1] }}
          transition={{ type: "spring", duration: 0.45 }}
          className="text-3xl font-bold text-white select-text truncate"
        >
          {value}
        </motion.div>
      )}
      {typeof delta === "number" && !loading && (
        <span className="flex items-center ml-1 text-[13px] text-emerald-300 font-semibold bg-emerald-900/40 px-2 py-1 rounded-lg">
          <FiArrowUpRight size={16} className="mr-1" />
          +{delta}%
        </span>
      )}
    </div>
  </motion.div>
);

// --- Recent Orders Table ---
const RecentOrdersTable = ({ orders, loading }) => (
  <div className="bg-zinc-900/80 rounded-xl shadow p-3 sm:p-4 mt-4 overflow-x-auto w-full">
    <h3 className="font-bold text-zinc-200 mb-2 tracking-tight text-base sm:text-lg">
      Recent Orders
    </h3>
    <div className="w-full overflow-x-auto">
      <table className="w-full text-zinc-300 text-xs sm:text-sm min-w-[480px]">
        <thead>
          <tr className="text-zinc-400 border-b border-zinc-800 font-semibold">
            <th className="py-2 px-2 text-left">Order #</th>
            <th className="py-2 px-2 text-left">Customer</th>
            <th className="py-2 px-2 text-left">Date</th>
            <th className="py-2 px-2 text-left">Status</th>
            <th className="py-2 px-2 text-left">Total</th>
          </tr>
        </thead>
        <tbody>
          {loading
            ? Array.from({ length: 6 }).map((_, idx) => (
                <tr key={idx}>
                  <td colSpan={5}>
                    <Skeleton className="w-full h-6 mb-2" />
                  </td>
                </tr>
              ))
            : orders?.length > 0
            ? orders.map((order) => (
                <tr
                  key={order.id}
                  className="border-b border-zinc-800/70 last:border-b-0 hover:bg-zinc-800/40 transition"
                >
                  <td className="py-2 px-2 font-semibold text-white">
                    #{order.id}
                  </td>
                  <td className="py-2 px-2">
                    {order.user?.name || order.user?.email}
                  </td>
                  <td className="py-2 px-2">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-2 px-2">
                    <span
                      className={clsx(
                        "px-2 py-1 rounded-xl text-xs font-bold",
                        {
                          "bg-emerald-800/40 text-emerald-300":
                            order.status === "PAID",
                          "bg-zinc-800/60 text-zinc-300":
                            order.status === "PENDING",
                          "bg-rose-700/50 text-rose-200":
                            order.status === "CANCELLED",
                        }
                      )}
                    >
                      {order.status}
                    </span>
                  </td>
                  <td className="py-2 px-2 font-mono">
                    ${(order.total / 100).toFixed(2)}
                  </td>
                </tr>
              ))
            : (
              <tr>
                <td colSpan={5} className="py-5 text-zinc-400 text-center">
                  No orders found.
                </td>
              </tr>
            )}
        </tbody>
      </table>
    </div>
  </div>
);

// --- Low Stock Widget ---
const LowStockWidget = ({ products, loading }) => (
  <div className="bg-gradient-to-br from-rose-900/40 to-zinc-900/90 rounded-xl shadow p-3 sm:p-4 mt-4 w-full">
    <div className="flex items-center gap-2 text-rose-400 mb-3">
      <FiAlertTriangle size={18} />
      <span className="font-bold text-zinc-200 tracking-tight text-md">
        Low Stock
      </span>
    </div>
    {loading
      ? Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-6 w-full mb-2" />
        ))
      : products?.length > 0
      ? (
        <ul>
          {products.map((p) => (
            <li
              key={p.id}
              className="flex justify-between items-center py-1 text-zinc-300"
            >
              <span className="truncate max-w-[130px] sm:max-w-[140px]">
                {p.name}
              </span>
              <span className="bg-rose-800/60 px-2 py-0.5 rounded-lg text-xs font-mono text-rose-200 ml-2">
                {p.stock}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <div className="text-zinc-400 text-sm py-3">
          No low stock products 🎉
        </div>
      )}
  </div>
);

// --- Revenue Chart Area ---
const RevenueChart = ({ data, loading, chartHeight }) => (
  <div className="bg-zinc-900/80 rounded-xl shadow p-3 sm:p-4 mt-4 flex-1 min-w-0 min-h-[260px] sm:min-h-[340px]">
    <h3 className="font-bold text-zinc-200 mb-2 tracking-tight text-base sm:text-lg">
      Revenue (Last 30 Days)
    </h3>
    {loading ? (
      <Skeleton className="w-full h-[180px] sm:h-[240px] mt-6" />
    ) : (
      <ResponsiveContainer width="100%" height={chartHeight}>
        <BarChart data={data} margin={{ left: -12, right: 8 }}>
          <defs>
            <linearGradient id="revenue-bar" x1="0" y1="0" x2="0" y2="1">
              <stop offset="6%" stopColor="#06b6d4" stopOpacity={0.85} />
              <stop offset="95%" stopColor="#64748b" stopOpacity={0.8} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#27272a" />
          <XAxis
            dataKey="date"
            stroke="#b3bacb"
            tickLine={false}
            fontSize={11}
            minTickGap={8}
            hide={typeof window !== "undefined" ? window.innerWidth < 480 : false}
          />
          <YAxis
            stroke="#b3bacb"
            fontSize={11}
            tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#18181b",
              border: "none",
              color: "#fff",
              borderRadius: 8,
              fontSize: "13px",
            }}
            cursor={{ fill: "#33415544" }}
            formatter={(value) => `$${(value / 100).toLocaleString()}`}
          />
          <Bar dataKey="revenue" fill="url(#revenue-bar)" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    )}
  </div>
);

// --- Fetch utils (simulate API for demo) ---
const fetchDashboard = async () => {
  await new Promise((r) => setTimeout(r, 1200));
  return {
    totalRevenue: 12850432,
    revenueDelta: 8.9,
    totalOrders: 9187,
    orderDelta: 2.2,
    totalProducts: 162,
    productDelta: 1.4,
    totalCustomers: 4580,
    customerDelta: 5.5,
    orders: Array.from({ length: 7 }).map((_, i) => ({
      id: 9180 + i,
      status: ["PAID", "PENDING", "PAID", "CANCELLED"][i % 4],
      createdAt: Date.now() - i * 60 * 60 * 1000 * 6,
      total: Math.round(10000 + Math.random() * 20000),
      user: {
        name: ["Jerry", "Rae", "Sophia", "Kai", "Taylor", "Morgan", "Evelyn"][i],
        email: `${["jerry", "rae", "soph", "kai", "tay", "morgan", "evie"][i]}@sample.dev`,
      },
    })),
    lowStockProducts: [
      { id: 1, name: "SuperYoga Mat", stock: 2 },
      { id: 2, name: "Eco Bottle - Blue", stock: 3 },
      { id: 3, name: "Travel Backpack", stock: 1 },
    ],
    revenueSeries: Array.from({ length: 30 }).map((_, i) => ({
      date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toLocaleDateString(
        "en-US",
        { month: "short", day: "numeric" }
      ),
      revenue: Math.round((90000 + Math.random() * 20000) * (1 + Math.sin(i / 4))),
    })),
  };
};

// --- Dashboard Page ---
const DashboardPage = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chartHeight, setChartHeight] = useState(260);

  // Make SSR-safe
  useEffect(() => {
    const updateChartHeight = () => {
      if (typeof window !== "undefined" && window.innerWidth < 640) setChartHeight(180);
      else setChartHeight(260);
    };
    updateChartHeight();
    if (typeof window !== "undefined") {
      window.addEventListener("resize", updateChartHeight);
      return () => window.removeEventListener("resize", updateChartHeight);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    fetchDashboard().then((data) => {
      if (mounted) {
        setAnalytics(data);
        setLoading(false);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  const stats = useMemo(
    () => [
      {
        icon: FiDollarSign,
        label: "Total Revenue",
        value: analytics ? `$${(analytics.totalRevenue / 100).toLocaleString()}` : "",
        delta: analytics?.revenueDelta,
        loading,
        gradientFrom: "#0f766e44", // teal-800
        gradientTo: "#27272aa3", // zinc-900
      },
      {
        icon: FiShoppingCart,
        label: "Total Orders",
        value: analytics ? analytics.totalOrders.toLocaleString() : "",
        delta: analytics?.orderDelta,
        loading,
        gradientFrom: "#9333ea22", // violet-600
        gradientTo: "#0f172aa0", // zinc-900
      },
      {
        icon: FiPackage,
        label: "Total Products",
        value: analytics ? analytics.totalProducts.toLocaleString() : "",
        delta: analytics?.productDelta,
        loading,
        gradientFrom: "#2563eba1", // blue-600
        gradientTo: "#18181b94", // zinc-900
      },
      {
        icon: FiUsers,
        label: "Total Customers",
        value: analytics ? analytics.totalCustomers.toLocaleString() : "",
        delta: analytics?.customerDelta,
        loading,
        gradientFrom: "#bef26433", // lime-200
        gradientTo: "#101A1300", // transparent
      },
    ],
    [analytics, loading]
  );

  // --- Responsive Dashboard Layout ---
  return (
    <main className="min-h-screen w-full bg-gradient-to-br from-[#09090b] to-[#24243e] px-2 sm:px-4 md:px-8 lg:px-14 xl:px-20 2xl:px-0 py-6 sm:py-10">
      <div className="mx-auto w-full max-w-screen-2xl">
        <header className="mb-8 px-1 sm:px-0">
          <h1 className="font-extrabold tracking-tight bg-gradient-to-r from-emerald-400 via-teal-200 to-blue-500 bg-clip-text text-transparent
              text-2xl xs:text-3xl sm:text-4xl lg:text-5xl
          ">
            Dashboard
          </h1>
        </header>
        {/* Analytics Cards - Responsive */}
        <section
          className="
            grid 
            grid-cols-1
            sm:grid-cols-2
            lg:grid-cols-4
            gap-3 sm:gap-5
            mb-4
            w-full
          "
        >
          {stats.map((stat) => (
            <StatCard key={stat.label} {...stat} />
          ))}
        </section>
        {/* Responsive Lower Grid: Chart, Orders, Low Stock Widget */}
        <section
          className="
              grid
              grid-cols-1
              xl:grid-cols-[2fr_1fr]
              gap-4 md:gap-6
              w-full
              max-w-full
              items-stretch
              mb-2
              xl:overflow-x-visible
          "
        >
          {/* Left: Chart & Orders */}
          <div className="flex flex-col min-w-0 max-w-full">
            <RevenueChart
              data={analytics?.revenueSeries ?? []}
              loading={loading}
              chartHeight={chartHeight}
            />
            <RecentOrdersTable
              orders={analytics?.orders ?? []}
              loading={loading}
            />
          </div>
          {/* Right: Low Stock Widget */}
          <div
            className="
              flex flex-col min-w-0 max-w-full xl:max-w-[340px]
              w-full h-fit
            "
          >
            <LowStockWidget
              products={analytics?.lowStockProducts ?? []}
              loading={loading}
            />
          </div>
        </section>
        <footer className="mt-12 pb-4 flex justify-center text-xs md:text-sm text-zinc-600/80">
          © {new Date().getFullYear()} Your SaaS - Powered by React, Tailwind,
          Framer Motion, Recharts.
        </footer>
      </div>
    </main>
  );
};

export default DashboardPage;