import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  DollarSign,
  ShoppingCart,
  Users,
  TrendingUp,
  Package,
  ArrowRight
} from "lucide-react";
import { Link } from "react-router-dom";
import { 
  RevenueLineChart, 
  OrdersBarChart, 
  SalesAreaChart, 
  PaymentStatusPieChart, 
  CustomerGrowthChart 
} from "../../components/analytics/ChartComponents";
import { 
  fetchAnalyticsOverview, 
  fetchRevenueAnalytics, 
  fetchOrderAnalytics, 
  fetchCustomerAnalytics, 
  fetchTopProductsAnalytics 
} from "../../api/analyticsApi";
import toast from "react-hot-toast";

function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

function KpiCard({ icon: Icon, label, value, detail, loading, tone = "zinc" }) {
  const toneMap = {
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300",
    sky: "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-500/20 dark:bg-sky-500/10 dark:text-sky-300",
    amber: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300",
    violet: "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-500/20 dark:bg-violet-500/10 dark:text-violet-300",
    zinc: "border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      className="surface-card p-4 transition-colors hover:border-slate-300 dark:hover:border-slate-600"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</p>
          {loading ? (
            <div className="mt-3 h-8 w-24 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" />
          ) : (
            <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">{value}</p>
          )}
        </div>
        <div className={classNames("rounded-xl border p-2.5", toneMap[tone])}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">{loading ? "Loading..." : detail}</p>
    </motion.div>
  );
}

function Panel({ title, action, children, className }) {
  return (
    <section className={classNames("surface-card flex flex-col", className)}>
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 dark:border-slate-700">
        <h2 className="text-sm font-semibold text-slate-950 dark:text-white">{title}</h2>
        {action}
      </div>
      <div className="p-4 flex-1">
        {children}
      </div>
    </section>
  );
}

export default function AnalyticsPage() {
  const [overview, setOverview] = useState(null);
  const [revenueData, setRevenueData] = useState(null);
  const [orderData, setOrderData] = useState(null);
  const [customerData, setCustomerData] = useState(null);
  const [topProductsData, setTopProductsData] = useState(null);

  const [loadingOverview, setLoadingOverview] = useState(true);
  const [loadingRevenue, setLoadingRevenue] = useState(true);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [loadingTopProducts, setLoadingTopProducts] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      // Fetch overview
      fetchAnalyticsOverview()
        .then(data => setOverview(data))
        .catch(() => toast.error("Failed to load overview data"))
        .finally(() => setLoadingOverview(false));

      // Fetch revenue
      fetchRevenueAnalytics()
        .then(data => setRevenueData(data))
        .catch(() => toast.error("Failed to load revenue data"))
        .finally(() => setLoadingRevenue(false));

      // Fetch orders
      fetchOrderAnalytics()
        .then(data => setOrderData(data))
        .catch(() => toast.error("Failed to load order data"))
        .finally(() => setLoadingOrders(false));

      // Fetch customers
      fetchCustomerAnalytics()
        .then(data => setCustomerData(data))
        .catch(() => toast.error("Failed to load customer data"))
        .finally(() => setLoadingCustomers(false));

      // Fetch top products
      fetchTopProductsAnalytics()
        .then(data => setTopProductsData(data))
        .catch(() => toast.error("Failed to load top products"))
        .finally(() => setLoadingTopProducts(false));
    };

    loadData();
  }, []);

  const formatCurrency = (value) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value || 0);

  const formatNumber = (value) =>
    new Intl.NumberFormat('en-US').format(value || 0);

  return (
    <div className="w-full min-w-0 overflow-x-hidden space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-950 dark:text-white md:text-3xl">Analytics</h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-600 dark:text-slate-300">
            Deep dive into your store's performance metrics and growth trends.
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          icon={DollarSign}
          label="Revenue"
          value={formatCurrency(overview?.revenue?.total)}
          detail={`vs last month (${overview?.revenue?.growth > 0 ? '+' : ''}${(overview?.revenue?.growth || 0).toFixed(1)}%)`}
          loading={loadingOverview}
          tone="emerald"
        />
        <KpiCard
          icon={ShoppingCart}
          label="Orders"
          value={formatNumber(overview?.orders?.total)}
          detail={`vs last month (${overview?.orders?.growth > 0 ? '+' : ''}${(overview?.orders?.growth || 0).toFixed(1)}%)`}
          loading={loadingOverview}
          tone="sky"
        />
        <KpiCard
          icon={Users}
          label="Customers"
          value={formatNumber(overview?.customers?.total)}
          detail={`vs last month (${overview?.customers?.growth > 0 ? '+' : ''}${(overview?.customers?.growth || 0).toFixed(1)}%)`}
          loading={loadingOverview}
          tone="violet"
        />
        <KpiCard
          icon={TrendingUp}
          label="Growth"
          value={`${overview?.growth?.monthly > 0 ? '+' : ''}${(overview?.growth?.monthly || 0).toFixed(1)}%`}
          detail="Monthly active growth"
          loading={loadingOverview}
          tone="amber"
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Panel title="Revenue Overview">
          <RevenueLineChart data={revenueData?.revenueChart || []} loading={loadingRevenue} />
        </Panel>
        <Panel title="Order Volume (This Week)">
          <OrdersBarChart data={orderData?.orderVolume || []} loading={loadingOrders} />
        </Panel>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
         <Panel title="Sales Trends">
           <SalesAreaChart data={revenueData?.salesTrends || []} loading={loadingRevenue} />
         </Panel>
         <Panel title="Customer Growth">
           <CustomerGrowthChart data={customerData?.customerGrowth || []} loading={loadingCustomers} />
         </Panel>
         <Panel title="Payment Status">
           <PaymentStatusPieChart data={orderData?.paymentStatus || []} loading={loadingOrders} />
         </Panel>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Panel
          title="Top Products"
          action={
            <Link to="/products" className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 hover:text-emerald-800 dark:text-emerald-300 dark:hover:text-emerald-200">
              View <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          }
        >
          <div className="space-y-3">
            {loadingTopProducts ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-16 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
                ))
            ) : topProductsData?.topProducts?.length > 0 ? (
                <div className="space-y-3">
                    {topProductsData.topProducts.map((product) => (
                        <div key={product.id} className="surface-subtle flex items-center justify-between p-3">
                            <div className="flex items-center gap-3">
                                {product.imageUrl ? (
                                    <img src={product.imageUrl} alt={product.name} className="h-10 w-10 rounded-lg border border-slate-200 bg-slate-100 object-cover dark:border-slate-700 dark:bg-slate-800" />
                                ) : (
                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
                                        <Package className="h-5 w-5 text-slate-500 dark:text-slate-400" />
                                    </div>
                                )}
                                <div>
                                    <p className="line-clamp-1 text-sm font-medium text-slate-900 dark:text-white">{product.name}</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">{product.sales} sales</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-semibold text-slate-900 dark:text-white">{formatCurrency(product.revenue)}</p>
                                <p className="text-xs text-emerald-600 dark:text-emerald-400">{product.stock} in stock</p>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-slate-500 dark:text-slate-400">
                <Package className="mb-2 h-6 w-6 text-slate-400 dark:text-slate-500" />
                <p className="text-sm">No product data available</p>
              </div>
            )}
          </div>
        </Panel>

        <Panel
          title="Recent Orders"
          action={
            <Link to="/orders" className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 hover:text-emerald-800 dark:text-emerald-300 dark:hover:text-emerald-200">
              View <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          }
        >
          <div className="space-y-3">
              {loadingTopProducts ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-16 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
                ))
            ) : topProductsData?.recentOrders?.length > 0 ? (
                <div className="space-y-3">
                    {topProductsData.recentOrders.map((order) => (
                        <div key={order.id} className="surface-subtle flex items-center justify-between p-3">
                            <div className="flex flex-col">
                                <p className="text-sm font-medium text-slate-900 dark:text-white">#{order.orderNumber}</p>
                                <p className="max-w-[120px] truncate text-xs text-slate-500 dark:text-slate-400">{order.customerName}</p>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className={classNames(
                                    "px-2 py-1 rounded-md text-[10px] font-medium uppercase tracking-wider",
                                    order.status === 'DELIVERED' ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400" :
                                    order.status === 'SHIPPED' ? "bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-400" :
                                    order.status === 'PENDING' ? "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400" :
                                    "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                                )}>
                                    {order.status}
                                </span>
                                <p className="text-sm font-semibold text-slate-900 dark:text-white">{formatCurrency(order.total)}</p>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-slate-500 dark:text-slate-400">
                <ShoppingCart className="mb-2 h-6 w-6 text-slate-400 dark:text-slate-500" />
                <p className="text-sm">No recent orders</p>
              </div>
            )}
          </div>
        </Panel>
      </div>
    </div>
  );
}
