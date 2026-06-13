import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Boxes,
  DollarSign,
  Package,
  RefreshCw,
  ShoppingCart,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import apiClient from "../../api/axios";

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

function asArray(value) {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.products)) return value.products;
  if (Array.isArray(value?.customers)) return value.customers;
  if (Array.isArray(value?.orders)) return value.orders;
  if (Array.isArray(value?.data)) return value.data;
  return [];
}

function asNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function formatCurrency(value) {
  return currencyFormatter.format(asNumber(value, 0));
}

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function getOrderTotal(order) {
  return asNumber(order?.total ?? order?.totalAmount ?? order?.subtotal, 0);
}

function getCustomerName(order) {
  return order?.user?.name || order?.customer?.name || order?.user?.email || "Guest customer";
}

function normalizeStatus(status) {
  return typeof status === "string" ? status.toUpperCase() : "UNKNOWN";
}

function StatusBadge({ status }) {
  const normalized = normalizeStatus(status);
  const styles = {
    PAID: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-200",
    PENDING: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-200",
    PROCESSING: "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-500/25 dark:bg-sky-500/10 dark:text-sky-200",
    SHIPPED: "border-blue-200 bg-blue-50 text-blue-700 dark:border-indigo-500/25 dark:bg-indigo-500/10 dark:text-indigo-200",
    DELIVERED: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-200",
    CANCELLED: "border-red-200 bg-red-50 text-red-700 dark:border-red-500/25 dark:bg-red-500/10 dark:text-red-200",
    REFUNDED: "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-500/25 dark:bg-violet-500/10 dark:text-violet-200",
    UNKNOWN: "border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-600 dark:bg-slate-700/70 dark:text-slate-300",
  };

  return (
    <span
      className={classNames(
        "inline-flex rounded-full border px-2 py-0.5 text-xs font-medium",
        styles[normalized] || styles.UNKNOWN
      )}
    >
      {normalized.toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase())}
    </span>
  );
}

function KpiCard({ icon: Icon, label, value, detail, loading, tone = "zinc" }) {
  const toneMap = {
    emerald: "text-emerald-700 bg-emerald-50 border-emerald-200 dark:text-emerald-300 dark:bg-emerald-500/10 dark:border-emerald-500/20",
    sky: "text-sky-700 bg-sky-50 border-sky-200 dark:text-sky-300 dark:bg-sky-500/10 dark:border-sky-500/20",
    amber: "text-amber-700 bg-amber-50 border-amber-200 dark:text-amber-300 dark:bg-amber-500/10 dark:border-amber-500/20",
    violet: "text-violet-700 bg-violet-50 border-violet-200 dark:text-violet-300 dark:bg-violet-500/10 dark:border-violet-500/20",
    zinc: "text-slate-600 bg-slate-50 border-slate-200 dark:text-slate-300 dark:bg-slate-800 dark:border-slate-700",
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
            <div className="mt-3 h-8 w-24 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-700" />
          ) : (
            <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">{value}</p>
          )}
        </div>
        <div className={classNames("rounded-xl border p-2.5", toneMap[tone])}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">{loading ? "Syncing live data..." : detail}</p>
    </motion.div>
  );
}

function Panel({ title, action, children, className }) {
  return (
    <section className={classNames("surface-card", className)}>
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 dark:border-slate-700">
        <h2 className="text-sm font-semibold text-slate-950 dark:text-white">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function RevenueBars({ data, loading }) {
  const maxRevenue = Math.max(...data.map((item) => item.revenue), 1);

  return (
    <Panel title="Sales analytics" className="lg:col-span-2">
      <div className="p-4">
        {loading ? (
          <div className="h-72 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
        ) : (
          <div className="surface-subtle flex h-72 items-end gap-2 overflow-hidden p-4">
            {data.map((item) => (
              <div key={item.label} className="flex min-w-0 flex-1 flex-col items-center gap-2">
                <div className="flex h-52 w-full items-end">
                  <div
                    className="w-full rounded-t-md bg-gradient-to-t from-emerald-700 to-sky-400 transition-all hover:from-emerald-500 hover:to-sky-300"
                    style={{
                      height: `${Math.max(8, (item.revenue / maxRevenue) * 100)}%`,
                    }}
                    title={`${item.label}: ${formatCurrency(item.revenue)}`}
                  />
                </div>
                <span className="truncate text-[10px] text-slate-500 dark:text-slate-500 sm:text-xs">{item.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </Panel>
  );
}

function RecentOrders({ orders, loading }) {
  return (
    <Panel
      title="Recent orders"
      action={
        <Link to="/orders" className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 hover:text-blue-800 dark:text-emerald-300 dark:hover:text-emerald-200">
          View all <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      }
    >
      <div className="max-w-full overflow-x-auto overscroll-x-contain">
        <table className="w-full min-w-[560px] text-sm">
          <thead className="bg-slate-50 dark:bg-slate-800/70">
            <tr className="text-left text-xs uppercase tracking-[0.06em] text-slate-600 dark:text-slate-300">
              <th className="border-b border-slate-200 px-4 py-3 font-semibold dark:border-slate-700">Order</th>
              <th className="border-b border-slate-200 px-4 py-3 font-semibold dark:border-slate-700">Customer</th>
              <th className="border-b border-slate-200 px-4 py-3 font-semibold dark:border-slate-700">Status</th>
              <th className="border-b border-slate-200 px-4 py-3 text-right font-semibold dark:border-slate-700">Total</th>
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: 5 }).map((_, index) => (
                  <tr key={index}>
                    <td colSpan={4} className="px-4 py-3">
                      <div className="h-5 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
                    </td>
                  </tr>
                ))
              : orders.length === 0
              ? (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-sm text-slate-500 dark:text-slate-400">
                    No orders yet.
                  </td>
                </tr>
              )
              : orders.map((order) => (
                <tr key={order.id} className="border-t border-slate-100 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/60">
                  <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-800 dark:text-slate-200">
                    #{order.orderNumber ?? String(order.id).slice(-8)}
                  </td>
                  <td className="max-w-[180px] truncate px-4 py-3 text-slate-600 dark:text-slate-400" title={getCustomerName(order)}>{getCustomerName(order)}</td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <StatusBadge status={order.status} />
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right font-semibold text-emerald-700 dark:text-emerald-300">
                    {formatCurrency(getOrderTotal(order))}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

function TopProducts({ products, loading }) {
  return (
    <Panel
      title="Top products"
      action={
        <Link to="/products" className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 hover:text-blue-800 dark:text-emerald-300 dark:hover:text-emerald-200">
          Manage <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      }
    >
      <div className="space-y-3 p-4">
        {loading
          ? Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="h-12 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
            ))
          : products.length === 0
          ? (
            <p className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">No products found.</p>
          )
          : products.map((product) => (
            <div key={product.id} className="surface-subtle flex items-center justify-between gap-3 p-3 transition-colors hover:border-slate-200 hover:bg-white dark:hover:border-slate-600 dark:hover:bg-slate-700">
              <div className="flex min-w-0 items-center gap-3">
                {product.imageUrl ? (
                  <img src={product.imageUrl} alt="" className="h-10 w-10 rounded-lg border border-slate-200 object-cover dark:border-slate-700" />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
                    <Package className="h-4 w-4" />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-950 dark:text-white">{product.name || "Untitled product"}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{product.stock ?? 0} in stock</p>
                </div>
              </div>
              <p className="shrink-0 text-sm font-semibold text-slate-700 dark:text-slate-200">{formatCurrency(product.price)}</p>
            </div>
          ))}
      </div>
    </Panel>
  );
}

function ActivityFeed({ orders, products, customers, loading }) {
  const activity = useMemo(() => {
    const items = [
      ...orders.slice(0, 3).map((order) => ({
        id: `order-${order.id}`,
        icon: ShoppingCart,
        title: `Order #${order.orderNumber ?? String(order.id).slice(-8)} ${normalizeStatus(order.status).toLowerCase()}`,
        detail: `${getCustomerName(order)} - ${formatCurrency(getOrderTotal(order))}`,
      })),
      ...products.slice(0, 2).map((product) => ({
        id: `product-${product.id}`,
        icon: Boxes,
        title: `${product.name || "Product"} inventory updated`,
        detail: `${product.stock ?? 0} units available`,
      })),
      ...customers.slice(0, 2).map((customer) => ({
        id: `customer-${customer.id}`,
        icon: Users,
        title: `${customer.name || "Customer"} joined`,
        detail: formatDate(customer.createdAt),
      })),
    ];
    return items.slice(0, 6);
  }, [orders, products, customers]);

  return (
    <Panel title="Activity feed">
      <div className="space-y-3 p-4">
        {loading
          ? Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="h-12 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
            ))
          : activity.length === 0
          ? (
            <p className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">No recent activity.</p>
          )
          : activity.map((item) => (
            <div key={item.id} className="surface-subtle flex gap-3 p-3 transition-colors hover:border-slate-200 hover:bg-white dark:hover:border-slate-600 dark:hover:bg-slate-700">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
                <item.icon className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-slate-950 dark:text-white">{item.title}</p>
                <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">{item.detail}</p>
              </div>
            </div>
          ))}
      </div>
    </Panel>
  );
}

function QuickActions() {
  const actions = [
    { label: "Add product", to: "/products", icon: Package },
    { label: "Review orders", to: "/orders", icon: ShoppingCart },
    { label: "View customers", to: "/customers", icon: Users },
  ];

  return (
    <Panel title="Quick actions">
      <div className="grid gap-3 p-4 sm:grid-cols-3 lg:grid-cols-1">
        {actions.map(({ label, to, icon: Icon }) => (
          <Link
            key={label}
            to={to}
            className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition-colors hover:border-blue-200 hover:bg-blue-50 hover:text-blue-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-700"
          >
            <span className="inline-flex items-center gap-2">
              <Icon className="h-4 w-4 text-blue-700 dark:text-emerald-300" />
              {label}
            </span>
            <ArrowRight className="h-4 w-4 text-slate-400 dark:text-slate-400" />
          </Link>
        ))}
      </div>
    </Panel>
  );
}

export default function DashboardHome() {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);

    const [ordersResult, customersResult, productsResult] = await Promise.allSettled([
      apiClient.get("/orders").then((response) => response.data),
      apiClient.get("/customers").then((response) => response.data),
      apiClient.get("/products").then((response) => response.data),
    ]);

    if (ordersResult.status === "fulfilled") setOrders(asArray(ordersResult.value));
    if (customersResult.status === "fulfilled") setCustomers(asArray(customersResult.value));
    if (productsResult.status === "fulfilled") setProducts(asArray(productsResult.value));

    const failures = [ordersResult, customersResult, productsResult].filter((result) => result.status === "rejected");
    if (failures.length > 0) {
      setError("Some dashboard data could not be refreshed.");
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchDashboard();
  }, [fetchDashboard, reloadKey]);

  const analytics = useMemo(() => {
    const paidOrders = orders.filter((order) => normalizeStatus(order.paymentStatus) === "PAID");
    const revenue = paidOrders.reduce((sum, order) => sum + getOrderTotal(order), 0);
    const lowStock = products.filter((product) => asNumber(product.stock) > 0 && asNumber(product.stock) <= 5);
    const outOfStock = products.filter((product) => asNumber(product.stock) === 0);
    const averageOrderValue = paidOrders.length > 0 ? revenue / paidOrders.length : 0;

    const monthBuckets = new Map();
    orders.forEach((order) => {
      const date = order.createdAt ? new Date(order.createdAt) : null;
      if (!date || Number.isNaN(date.getTime())) return;
      const label = date.toLocaleDateString("en-US", { month: "short" });
      monthBuckets.set(label, (monthBuckets.get(label) || 0) + getOrderTotal(order));
    });

    const revenueSeries = [...monthBuckets.entries()].slice(-8).map(([label, value]) => ({
      label,
      revenue: value,
    }));

    return {
      revenue,
      ordersCount: orders.length,
      customersCount: customers.length,
      productsCount: products.length,
      lowStockCount: lowStock.length,
      outOfStockCount: outOfStock.length,
      averageOrderValue,
      revenueSeries: revenueSeries.length > 0 ? revenueSeries : [{ label: "Now", revenue: revenue || 1 }],
      recentOrders: [...orders]
        .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
        .slice(0, 6),
      topProducts: [...products]
        .sort((a, b) => asNumber(b.price) - asNumber(a.price))
        .slice(0, 5),
    };
  }, [orders, products, customers]);

  return (
    <div className="w-full min-w-0 overflow-x-hidden">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-950 dark:text-white md:text-3xl">Dashboard</h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-600 dark:text-slate-400">
            Live ecommerce performance across revenue, orders, customers, and inventory.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setReloadKey((key) => key + 1)}
          disabled={loading}
          className="btn btn-secondary"
        >
          <RefreshCw className={classNames("h-4 w-4", loading && "animate-spin")} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200">
          {error}
        </div>
      )}

      <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          icon={DollarSign}
          label="Revenue"
          value={formatCurrency(analytics.revenue)}
          detail={`AOV ${formatCurrency(analytics.averageOrderValue)}`}
          loading={loading}
          tone="emerald"
        />
        <KpiCard
          icon={ShoppingCart}
          label="Orders"
          value={analytics.ordersCount.toLocaleString()}
          detail={`${analytics.recentOrders.length} recent orders tracked`}
          loading={loading}
          tone="sky"
        />
        <KpiCard
          icon={Users}
          label="Customers"
          value={analytics.customersCount.toLocaleString()}
          detail="CRM profiles and order history"
          loading={loading}
          tone="violet"
        />
        <KpiCard
          icon={Boxes}
          label="Inventory"
          value={analytics.productsCount.toLocaleString()}
          detail={`${analytics.lowStockCount} low stock, ${analytics.outOfStockCount} out`}
          loading={loading}
          tone="amber"
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <RevenueBars data={analytics.revenueSeries} loading={loading} />
        <div className="space-y-5">
          <QuickActions />
          <ActivityFeed orders={orders} products={products} customers={customers} loading={loading} />
        </div>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1.4fr_0.9fr]">
        <RecentOrders orders={analytics.recentOrders} loading={loading} />
        <TopProducts products={analytics.topProducts} loading={loading} />
      </div>

      <div className="surface-card mt-5 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-2.5 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-950 dark:text-white">Store health</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Your admin data is synced across active modules.</p>
            </div>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
            <Zap className="h-3.5 w-3.5 text-emerald-700 dark:text-emerald-300" />
            Production workspace
          </div>
        </div>
      </div>
    </div>
  );
}
