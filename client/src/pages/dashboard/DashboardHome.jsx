import React from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import StatCard from "../../components/ui/statcard";
import { motion } from "framer-motion";
import { DollarSign, ShoppingBag, Users, Boxes } from "lucide-react";

const analyticsCards = [
  {
    key: "revenue",
    title: "Total Revenue",
    value: "$--,--",
    icon: <DollarSign className="w-6 h-6" />,
    trend: { value: "+0.0%", isUp: true },
    delay: 0,
  },
  {
    key: "orders",
    title: "Orders",
    value: "--",
    icon: <ShoppingBag className="w-6 h-6" />,
    trend: { value: "-0.0%", isUp: false },
    delay: 0.05,
  },
  {
    key: "customers",
    title: "Customers",
    value: "--",
    icon: <Users className="w-6 h-6" />,
    trend: { value: "+0.0%", isUp: true },
    delay: 0.10,
  },
  {
    key: "inventory",
    title: "Inventory",
    value: "--",
    icon: <Boxes className="w-6 h-6" />,
    trend: { value: "+0", isUp: true },
    delay: 0.15,
  },
];

const cardSpring = {
  type: "spring",
  stiffness: 60,
  damping: 16,
  mass: 0.5,
};

const DashboardHome = () => (
  <DashboardLayout title="Dashboard">
    <div className="py-6 px-2 sm:px-0">
      {/* Header */}
      <header className="mb-8">
        <h1 className="text-4xl font-bold text-white tracking-tight">
          Dashboard
        </h1>
        <p className="mt-2 text-zinc-400 text-lg max-w-2xl">
          Welcome back! Here’s an at-a-glance look at your SaaS performance.
        </p>
      </header>
      {/* Analytics Stat Cards */}
      <section>
        <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-6">
          {analyticsCards.map(({ key, title, value, trend, icon, delay }) => (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 24, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{
                ...cardSpring,
                delay,
              }}
            >
              <StatCard title={title} value={value} icon={icon} trend={trend} />
            </motion.div>
          ))}
        </div>
      </section>
      {/* Placeholder for future analytics/charts */}
      <section className="mt-14 flex flex-col items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.97, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.48, delay: 0.2 }}
          className="w-full max-w-2xl bg-zinc-900/80 rounded-2xl shadow-lg border border-zinc-800 p-8 flex flex-col items-center"
        >
          <span className="text-zinc-400 text-lg font-semibold mb-2">
            Coming Soon
          </span>
          <p className="text-zinc-500 text-center">
            Rich analytics, charts, and management insights will appear here as your SaaS grows.
          </p>
        </motion.div>
      </section>
    </div>
  </DashboardLayout>
);

export default DashboardHome;