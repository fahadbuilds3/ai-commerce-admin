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
      <span className="truncate text-xl font-semibold tracking-tight text-white">
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
        "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-200",
        active
          ? "bg-zinc-800 text-white shadow-sm"
          : "text-zinc-400 hover:bg-zinc-900 hover:text-white"
      )}
      aria-current={active ? "page" : undefined}
      onClick={() => onNavigate(to)}
    >
      <Icon
        size={19}
        className={clsx(active ? "text-indigo-400" : "text-zinc-500")}
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
        className="mt-6 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-zinc-400 transition-colors hover:bg-zinc-900 hover:text-red-300"
      >
        <LogOut size={19} className="text-red-400" />
        <span>Logout</span>
      </button>

      <footer className="mt-auto pt-8 text-xs text-zinc-700">
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
      <aside className="hidden min-h-screen w-64 shrink-0 flex-col border-r border-zinc-900 bg-zinc-950 px-5 py-6 lg:flex">
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
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
              onClick={onMobileClose}
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 330, damping: 35 }}
              className="fixed inset-y-0 left-0 z-50 flex w-72 max-w-[88vw] flex-col border-r border-zinc-900 bg-zinc-950 px-5 py-6 shadow-2xl lg:hidden"
              role="dialog"
              aria-modal="true"
            >
              <button
                type="button"
                className="absolute right-4 top-4 rounded-lg p-2 text-zinc-400 transition hover:bg-zinc-900 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
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
