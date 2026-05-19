import React, { useState, useContext } from "react";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  BarChart2,
  Boxes,
  Bot,
  Menu,
  X,
  LogOut,
} from "lucide-react";
import clsx from "clsx";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { AuthContext } from "../../context/AuthContext";

// Navigation config: extensible/scalable
const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, to: "/dashboard" },
  { label: "Products", icon: Package, to: "/products" },
  { label: "Orders", icon: ShoppingCart, to: "/orders" },
  { label: "Customers", icon: Users, to: "/customers" },
  { label: "Analytics", icon: BarChart2, to: "/analytics" },
  { label: "Inventory", icon: Boxes, to: "/inventory" },
  { label: "AI Assistant", icon: Bot, to: "/ai-assistant" },
];

const Sidebar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useContext(AuthContext);

  // Handle navigation with mobile auto-close
  const handleNav = (to) => {
    navigate(to);
    setMobileOpen(false);
  };
  const handleLogout = () => {
    logout();
    setMobileOpen(false);
    navigate("/login", { replace: true });
  };

  // Nav Link Item
  function NavItem({ label, icon: Icon, to, active, onNavigate }) {
    return (
      <button
        type="button"
        className={clsx(
          "w-full flex items-center gap-3 rounded-md px-4 py-2 text-sm font-medium transition-colors duration-200 group select-none",
          active
            ? "bg-zinc-800 text-white shadow"
            : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
        )}
        aria-current={active ? "page" : undefined}
        aria-label={label}
        tabIndex={0}
        onClick={() => onNavigate(to)}
      >
        <Icon
          size={20}
          className={clsx(
            "transition-colors duration-200",
            active ? "text-indigo-400" : "group-hover:text-indigo-300"
          )}
        />
        <span className="truncate">{label}</span>
      </button>
    );
  }

  // Core sidebar content
  function SidebarNav({ onNavigate }) {
    return (
      <nav className="flex flex-col gap-[2px] mt-6">
        {navItems.map(({ label, icon, to }) => (
          <NavItem
            key={label}
            label={label}
            icon={icon}
            to={to}
            active={location.pathname.startsWith(to)}
            onNavigate={onNavigate}
          />
        ))}
        {/* Logout button */}
        <button
          type="button"
          onClick={handleLogout}
          className={clsx(
            "mt-6 flex items-center gap-3 rounded-md px-4 py-2 text-sm font-medium transition-colors duration-200 w-full",
            "text-zinc-400 hover:bg-zinc-900 hover:text-red-400"
          )}
          aria-label="Logout"
        >
          <LogOut size={20} className="text-red-400" />
          <span>Logout</span>
        </button>
      </nav>
    );
  }

  const Brand = ({ small }) => (
    <div className={clsx("flex items-center gap-2", small ? "mb-6" : "mb-8")}>
      <svg
        width={small ? 24 : 28}
        height={small ? 24 : 28}
        viewBox="0 0 32 32"
        fill="none"
        className="text-indigo-500"
        aria-hidden="true"
      >
        <rect
          x="4"
          y="4"
          width="24"
          height="24"
          rx="6"
          fill="currentColor"
        />
        <path
          d="M10 16h12M16 10v12"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span
        className={clsx(
          small
            ? "text-lg font-semibold text-white tracking-tight"
            : "text-xl font-semibold text-white tracking-tight"
        )}
      >
        AIC Admin
      </span>
    </div>
  );

  return (
    <>
      {/* ---------- Desktop Sidebar ---------- */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col bg-zinc-950 border-r border-zinc-900 px-6 py-7">
        <Brand />
        <SidebarNav onNavigate={handleNav} />
        <footer className="mt-auto pt-8 text-xs text-zinc-700 flex items-center gap-1">
          <span>&copy; {new Date().getFullYear()} AI Commerce</span>
        </footer>
      </aside>
      {/* ---------- Mobile/Tablet Top Bar ---------- */}
      <header className="flex lg:hidden items-center justify-between px-4 h-14 bg-zinc-950 border-b border-zinc-900">
        <Brand small />
        <button
          className="p-2 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400 transition"
          aria-label="Open sidebar"
          onClick={() => setMobileOpen(true)}
          tabIndex={0}
        >
          <Menu size={22} />
        </button>
      </header>
      {/* ---------- Mobile/Tablet Sidebar Drawer ---------- */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Overlay */}
            <motion.div
              key="sidebar-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed z-40 inset-0 bg-black/60 backdrop-blur-sm"
              aria-hidden="true"
              onClick={() => setMobileOpen(false)}
            />
            {/* Drawer */}
            <motion.aside
              key="sidebar-drawer"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 330, damping: 35 }}
              className="fixed z-50 left-0 top-0 bottom-0 w-72 max-w-full flex flex-col h-full bg-zinc-950 border-r border-zinc-900 px-6 py-7 shadow-xl"
              role="dialog"
              aria-modal="true"
              tabIndex={-1}
            >
              <button
                className="absolute top-4 right-4 p-2 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400 transition"
                onClick={() => setMobileOpen(false)}
                aria-label="Close sidebar"
              >
                <X size={22} />
              </button>
              <Brand small />
              <SidebarNav onNavigate={handleNav} />
              <footer className="mt-auto pt-8 text-xs text-zinc-700 flex items-center gap-1">
                <span>&copy; {new Date().getFullYear()} AI Commerce</span>
              </footer>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
      {/* Content offset (desktop sidebar width) */}
      <div className="lg:pl-64" />
    </>
  );
};

export default Sidebar;