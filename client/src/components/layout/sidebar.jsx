import { useContext } from "react";
import {
  BarChart2,
  Bot,
  Boxes,
  LayoutDashboard,
  LogOut,
  Package,
  ShoppingCart,
  Users,
  X,
} from "lucide-react";
import clsx from "clsx";
import { useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { AuthContext } from "../../context/AuthContext";

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, to: "/dashboard" },
  { label: "Products", icon: Package, to: "/products" },
  { label: "Orders", icon: ShoppingCart, to: "/orders" },
  { label: "Customers", icon: Users, to: "/customers" },
  { label: "Analytics", icon: BarChart2, to: "/analytics" },
  { label: "Inventory", icon: Boxes, to: "/inventory" },
  { label: "AI Assistant", icon: Bot, to: "/ai-assistant" },
];

function Brand({ compact = false }) {
  return (
    <div className={clsx("flex items-center gap-2", compact ? "mb-6" : "mb-8")}>
      <svg
        width={compact ? 24 : 28}
        height={compact ? 24 : 28}
        viewBox="0 0 32 32"
        fill="none"
        className="shrink-0 text-indigo-500"
        aria-hidden="true"
      >
        <rect x="4" y="4" width="24" height="24" rx="6" fill="currentColor" />
        <path
          d="M10 16h12M16 10v12"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className="truncate text-xl font-semibold tracking-tight text-content-primary">
        AIC Admin
      </span>
    </div>
  );
}

function NavItem({ label, icon: Icon, to, active, onNavigate }) {
  return (
    <button
      type="button"
      className={clsx(
        "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30 dark:focus-visible:ring-blue-400/30",
        active
          ? "bg-surface-secondary text-content-primary shadow-sm"
          : "text-content-secondary hover:bg-hover hover:text-content-primary"
      )}
      aria-current={active ? "page" : undefined}
      onClick={() => onNavigate(to)}
    >
      <Icon
        size={19}
        className={clsx(
          active ? "text-blue-700 dark:text-indigo-400" : "text-content-muted"
        )}
      />
      <span className="truncate">{label}</span>
    </button>
  );
}

function SidebarContent({ onNavigate, onLogout }) {
  const location = useLocation();

  return (
    <>
      <Brand />
      <nav className="flex flex-col gap-1">
        {navItems.map(({ label, icon, to }) => (
          <NavItem
            key={to}
            label={label}
            icon={icon}
            to={to}
            active={
              to === "/dashboard"
                ? location.pathname === to
                : location.pathname.startsWith(to)
            }
            onNavigate={onNavigate}
          />
        ))}
      </nav>

      <button
        type="button"
        onClick={onLogout}
        className="mt-6 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-content-muted transition-colors hover:bg-hover hover:text-red-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500/25 dark:hover:text-red-300"
      >
        <LogOut size={19} className="text-red-600 dark:text-red-400" />
        <span>Logout</span>
      </button>

      <footer className="mt-auto pt-8 text-xs text-content-muted">
        &copy; {new Date().getFullYear()} AI Commerce
      </footer>
    </>
  );
}

const Sidebar = ({ mobileOpen = false, onMobileClose }) => {
  const navigate = useNavigate();
  const { logout } = useContext(AuthContext);

  const handleNav = (to) => {
    navigate(to);
    onMobileClose?.();
  };

  const handleLogout = () => {
    logout?.();
    onMobileClose?.();
    navigate("/login", { replace: true });
  };

  return (
    <>
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col overflow-y-auto border-r border-line bg-surface px-5 py-6 lg:flex">
        <SidebarContent onNavigate={handleNav} onLogout={handleLogout} />
      </aside>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.button
              type="button"
              aria-label="Close sidebar overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="fixed inset-0 z-40 bg-slate-950/45 backdrop-blur-sm dark:bg-black/60 lg:hidden"
              onClick={onMobileClose}
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 330, damping: 35 }}
              className="fixed inset-y-0 left-0 z-50 flex w-72 max-w-[88vw] flex-col border-r border-line bg-surface px-5 py-6 shadow-2xl lg:hidden"
              role="dialog"
              aria-modal="true"
            >
              <button
                type="button"
                className="icon-button absolute right-4 top-4"
                onClick={onMobileClose}
                aria-label="Close sidebar"
              >
                <X size={21} />
              </button>
              <SidebarContent onNavigate={handleNav} onLogout={handleLogout} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Sidebar;
