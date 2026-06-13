import { useContext } from "react";
import { LogOut, Menu, Moon, Search, Sun, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { useTheme } from "../../context/useTheme";

const Navbar = ({ title = "Dashboard", onSidebarToggle }) => {
  const { logout } = useContext(AuthContext);
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    if (typeof logout === "function") logout();
    navigate("/login", { replace: true });
  };

  return (
    <nav className="sticky top-0 z-30 w-full shrink-0 border-b border-line bg-surface/95 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-surface/85">
      <div className="mx-auto max-w-7xl px-2 sm:px-4 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-2 sm:gap-4">
          <div className="flex min-w-0 items-center">
            <button
              type="button"
              aria-label="Open sidebar"
              className="icon-button h-10 w-10 lg:hidden"
              onClick={onSidebarToggle}
            >
              <Menu size={24} />
            </button>

            <span className="ml-2 truncate text-lg font-bold tracking-tight text-content-primary sm:ml-3 sm:text-xl md:text-2xl">
              {title}
            </span>
          </div>

          <div className="hidden flex-1 justify-center px-2 md:flex lg:max-w-lg">
            <div className="relative w-full max-w-xs">
              <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-content-muted">
                <Search className="h-5 w-5" />
              </span>
              <input
                type="text"
                placeholder="Search..."
                className="control-input rounded-lg pl-10 pr-4"
              />
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <button
              type="button"
              className="icon-button rounded-full md:hidden"
              aria-label="Open search"
            >
              <Search size={20} />
            </button>

            <button
              type="button"
              onClick={toggleTheme}
              className="icon-button rounded-full"
              aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
              title={isDark ? "Switch to light theme" : "Switch to dark theme"}
            >
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            <button
              type="button"
              className="icon-button relative rounded-full"
              aria-label="User profile"
            >
              <User size={20} />
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="btn btn-ghost h-9 shrink-0 rounded-lg px-2 text-xs hover:text-red-600 dark:hover:text-red-400 sm:px-3 sm:text-sm"
              aria-label="Logout"
            >
              <LogOut size={18} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>

        <div className="block pb-3 md:hidden">
          <div className="relative w-full max-w-full">
            <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-content-muted">
              <Search className="h-5 w-5" />
            </span>
            <input
              type="text"
              placeholder="Search..."
              className="control-input rounded-lg pl-10 pr-4"
            />
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
