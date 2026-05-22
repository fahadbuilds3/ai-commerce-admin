import { useContext } from "react";
import { LogOut, Search, User, Menu } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";

/**
 * Navbar - Fully responsive e-commerce admin dashboard topbar.
 * - Mobile sidebar toggle, responsive search & controls
 * - Modern SaaS production-ready design with Tailwind
 */
const Navbar = ({
  title = "Dashboard",
  onSidebarToggle, // Receives a function to open mobile sidebar
}) => {
  const { logout } = useContext(AuthContext);
  const navigate = useNavigate();

  // Handles secure logout: remove JWT, clear auth state, and redirect.
  const handleLogout = () => {
    localStorage.removeItem("token");
    if (typeof logout === "function") logout();
    navigate("/login", { replace: true });
  };

  return (
    <nav className="sticky top-0 z-30 w-full border-b border-zinc-800 bg-zinc-950/95 shadow-sm backdrop-blur">
      <div className="mx-auto max-w-7xl px-2 sm:px-4 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-2 sm:gap-4">
          {/* Mobile Sidebar Button */}
          <div className="flex items-center">
            <button
              type="button"
              aria-label="Open Sidebar"
              className="inline-flex items-center justify-center rounded-md text-zinc-400 transition hover:text-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 lg:hidden"
              onClick={onSidebarToggle}
            >
              <Menu size={26} />
            </button>
            {/* Title - responsive font */}
            <span className="ml-3 text-lg sm:text-xl md:text-2xl font-bold tracking-tight text-white select-none">
              {title}
            </span>
          </div>

          {/* Center - Search */}
          <div className="flex-1 hidden md:flex justify-center px-2 lg:max-w-lg">
            <div className="relative w-full max-w-xs">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-400 pointer-events-none">
                <Search className="w-5 h-5" />
              </span>
              <input
                type="text"
                placeholder="Search…"
                className="block w-full rounded-lg bg-zinc-900 py-2 pl-10 pr-4 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
              />
            </div>
          </div>
          {/* Right - User/Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Search icon on mobile */}
            <button
              className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-800 text-zinc-400 hover:text-indigo-400 transition focus:outline-none focus:ring-2 focus:ring-indigo-500 md:hidden"
              tabIndex={0}
              aria-label="Open search"
              // Optionally open mobile search modal
            >
              <Search size={20} />
            </button>
            {/* Notification badge (stub) */}
            {/* <button className="relative flex h-9 w-9 items-center justify-center rounded-full bg-zinc-800 text-zinc-400 hover:text-indigo-400 transition focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <Bell size={20} />
              <span className="absolute -top-1 -right-1 inline-flex h-2 w-2 rounded-full bg-red-500"></span>
            </button> */}
            {/* Avatar/Profile */}
            <button
              className="relative flex h-9 w-9 items-center justify-center rounded-full bg-zinc-800 text-zinc-400 hover:text-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
              tabIndex={0}
              aria-label="User Profile"
            >
              <User size={20} />
              {/* Optionally: user dropdown */}
            </button>
            {/* Logout Button */}
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-2 rounded-lg px-2 py-2 sm:px-3 text-xs sm:text-sm font-medium text-zinc-300 hover:bg-zinc-900 hover:text-red-400 transition focus:outline-none focus:ring-2 focus:ring-indigo-500"
              aria-label="Logout"
            >
              <LogOut size={18} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
        {/* Search input for mobile (shows under nav, sticky, etc.) */}
        <div className="block md:hidden mt-2">
          <div className="relative w-full max-w-full">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-400 pointer-events-none">
              <Search className="w-5 h-5" />
            </span>
            <input
              type="text"
              placeholder="Search…"
              className="block w-full rounded-lg bg-zinc-900 py-2 pl-10 pr-4 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
            />
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
