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
    emerald: "text-emerald-300 bg-emerald-500/10 border-emerald-500/20",
    sky: "text-sky-300 bg-sky-500/10 border-sky-500/20",
    amber: "text-amber-300 bg-amber-500/10 border-amber-500/20",
    violet: "text-violet-300 bg-violet-500/10 border-violet-500/20",
    zinc: "text-zinc-300 bg-zinc-900 border-zinc-800",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 shadow-sm transition hover:border-zinc-700"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">{label}</p>
          {loading ? (
            <div className="mt-3 h-8 w-24 animate-pulse rounded-lg bg-zinc-800" />
          ) : (
            <p className="mt-2 text-2xl font-semibold tracking-tight text-zinc-100">{value}</p>
          )}
        </div>
        <div className={classNames("rounded-xl border p-2.5", toneMap[tone])}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <p className="mt-4 text-sm text-zinc-500">{loading ? "Loading..." : detail}</p>
    </motion.div>
  );
}

function Panel({ title, action, children, className }) {
  return (
    <section className={classNames("rounded-2xl border border-zinc-800 bg-zinc-950 shadow-sm flex flex-col", className)}>
      <div className="flex items-center justify-between gap-3 border-b border-zinc-800 px-4 py-3 shrink-0">
        <h2 className="text-sm font-semibold text-zinc-100">{title}</h2>
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
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100 md:text-3xl">Analytics</h1>
          <p className="mt-1 max-w-2xl text-sm text-zinc-400">
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
            <Link to="/products" className="inline-flex items-center gap-1 text-xs font-medium text-emerald-300 hover:text-emerald-200">
              View <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          }
        >
          <div className="space-y-3">
            {loadingTopProducts ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-16 animate-pulse rounded-xl bg-zinc-900" />
                ))
            ) : topProductsData?.topProducts?.length > 0 ? (
                <div className="space-y-3">
                    {topProductsData.topProducts.map((product) => (
                        <div key={product.id} className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/50 p-3">
                            <div className="flex items-center gap-3">
                                {product.imageUrl ? (
                                    <img src={product.imageUrl} alt={product.name} className="h-10 w-10 rounded-lg object-cover bg-zinc-800" />
                                ) : (
                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-800">
                                        <Package className="h-5 w-5 text-zinc-500" />
                                    </div>
                                )}
                                <div>
                                    <p className="text-sm font-medium text-zinc-200 line-clamp-1">{product.name}</p>
                                    <p className="text-xs text-zinc-500">{product.sales} sales</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-semibold text-zinc-200">{formatCurrency(product.revenue)}</p>
                                <p className="text-xs text-emerald-400">{product.stock} in stock</p>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-zinc-500">
                <Package className="h-6 w-6 mb-2 text-zinc-700" />
                <p className="text-sm">No product data available</p>
              </div>
            )}
          </div>
        </Panel>

        <Panel
          title="Recent Orders"
          action={
            <Link to="/orders" className="inline-flex items-center gap-1 text-xs font-medium text-emerald-300 hover:text-emerald-200">
              View <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          }
        >
          <div className="space-y-3">
              {loadingTopProducts ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-16 animate-pulse rounded-xl bg-zinc-900" />
                ))
            ) : topProductsData?.recentOrders?.length > 0 ? (
                <div className="space-y-3">
                    {topProductsData.recentOrders.map((order) => (
                        <div key={order.id} className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/50 p-3">
                            <div className="flex flex-col">
                                <p className="text-sm font-medium text-zinc-200">#{order.orderNumber}</p>
                                <p className="text-xs text-zinc-500 truncate max-w-[120px]">{order.customerName}</p>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className={classNames(
                                    "px-2 py-1 rounded-md text-[10px] font-medium uppercase tracking-wider",
                                    order.status === 'DELIVERED' ? "bg-emerald-500/10 text-emerald-400" :
                                    order.status === 'SHIPPED' ? "bg-sky-500/10 text-sky-400" :
                                    order.status === 'PENDING' ? "bg-amber-500/10 text-amber-400" :
                                    "bg-zinc-800 text-zinc-400"
                                )}>
                                    {order.status}
                                </span>
                                <p className="text-sm font-semibold text-zinc-200">{formatCurrency(order.total)}</p>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-zinc-500">
                <ShoppingCart className="h-6 w-6 mb-2 text-zinc-700" />
                <p className="text-sm">No recent orders</p>
              </div>
            )}
          </div>
        </Panel>
      </div>
    </div>
  );
}
