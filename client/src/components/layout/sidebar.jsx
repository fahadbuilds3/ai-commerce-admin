import React, { useState } from "react";
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
} from "lucide-react";
import clsx from "clsx";

// Navigation config for scalability
const navItems = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    to: "/dashboard",
  },
  // Added navigation to /products
  {
    label: "Products",
    icon: Package,
    to: "/products",
  },
  {
    label: "Orders",
    icon: ShoppingCart,
    to: "/orders",
  },
  {
    label: "Customers",
    icon: Users,
    to: "/customers",
  },
  {
    label: "Analytics",
    icon: BarChart2,
    to: "/analytics",
  },
  {
    label: "Inventory",
    icon: Boxes,
    to: "/inventory",
  },
  {
    label: "AI Assistant",
    icon: Bot,
    to: "/ai-assistant",
  },
];

// Dummy current path for demonstration; replace with router logic in production
const useCurrentPath = () => {
  // You might use: import { useLocation } from "react-router-dom";
  // return useLocation().pathname;
  return window.location.pathname;
};

const Sidebar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const currentPath = useCurrentPath();

  const NavItem = ({ label, icon: Icon, to, active }) => (
    <a
      href={to}
      className={clsx(
        "flex items-center gap-3 rounded-md px-4 py-2 text-sm font-medium transition-colors duration-200 group",
        active
          ? "bg-zinc-800 text-white shadow"
          : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
      )}
      aria-current={active ? "page" : undefined}
    >
      <Icon
        size={20}
        className={clsx(
          "transition-colors duration-200",
          active ? "text-indigo-400" : "group-hover:text-indigo-300"
        )}
      />
      <span className="truncate">{label}</span>
    </a>
  );

  // Sidebar content for both desktop and mobile
  const sidebarContent = (
    <nav className="flex flex-col gap-1 mt-6">
      {navItems.map(({ label, icon, to }) => (
        <NavItem
          key={label}
          label={label}
          icon={icon}
          to={to}
          active={currentPath.startsWith(to)}
        />
      ))}
    </nav>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col bg-zinc-950 border-r border-zinc-900 p-6">
        <div className="flex items-center gap-2 mb-8">
          <svg
            width="28"
            height="28"
            viewBox="0 0 32 32"
            fill="none"
            className="text-indigo-500"
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
          <span className="text-xl font-semibold text-white tracking-tight">AIC Admin</span>
        </div>
        {sidebarContent}
        <div className="mt-auto pt-8 text-xs text-zinc-700">
          <span>&copy; {new Date().getFullYear()} AI Commerce</span>
        </div>
      </aside>

      {/* Mobile Top Bar */}
      <header className="flex lg:hidden items-center justify-between px-4 h-14 bg-zinc-950 border-b border-zinc-900">
        <div className="flex items-center gap-2">
          <svg
            width="24"
            height="24"
            viewBox="0 0 32 32"
            fill="none"
            className="text-indigo-500"
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
          <span className="text-lg font-semibold text-white tracking-tight">AIC Admin</span>
        </div>
        <button
          className="p-2 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
          aria-label="Open sidebar"
          onClick={() => setMobileOpen(true)}
        >
          <Menu size={22} />
        </button>
      </header>

      {/* Mobile Sidebar Overlay and Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 flex lg:hidden">
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          {/* Drawer */}
          <aside className="relative z-50 w-72 max-w-full flex flex-col h-full bg-zinc-950 border-r border-zinc-900 p-6 animate-slide-in-left">
            <button
              className="absolute top-4 right-4 p-2 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
              onClick={() => setMobileOpen(false)}
              aria-label="Close sidebar"
            >
              <X size={22} />
            </button>
            <div className="flex items-center gap-2 mb-8">
              <svg
                width="24"
                height="24"
                viewBox="0 0 32 32"
                fill="none"
                className="text-indigo-500"
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
              <span className="text-lg font-semibold text-white tracking-tight">AIC Admin</span>
            </div>
            {sidebarContent}
            <div className="mt-auto pt-8 text-xs text-zinc-700">
              <span>&copy; {new Date().getFullYear()} AI Commerce</span>
            </div>
          </aside>
        </div>
      )}
      {/* Spacing box for content offset when sidebar present */}
      <div className="lg:pl-64" />
    </>
  );
};

export default Sidebar;

// TailwindCSS custom animation for drawer (add in your tailwind.config.js):
// theme: {
//   extend: {
//     keyframes: {
//       "slide-in-left": {
//         "0%": { transform: "translateX(-100%)" },
//         "100%": { transform: "translateX(0)" },
//       },
//     },
//     animation: {
//       "slide-in-left": "slide-in-left 250ms cubic-bezier(.4,0,.2,1)"
//     }
//   }
// }