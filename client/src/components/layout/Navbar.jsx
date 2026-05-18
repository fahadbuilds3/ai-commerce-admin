import React from "react";
import { LogOut, Search, User } from "lucide-react";

const Navbar = ({ title = "Dashboard", onLogout }) => (
  <nav className="sticky top-0 z-40 w-full bg-zinc-950 border-b border-zinc-800 shadow-sm">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="flex h-16 items-center justify-between">
        {/* Left - Page Title */}
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold tracking-tight text-white">{title}</span>
        </div>
        {/* Center - Search */}
        <div className="flex-1 flex justify-center max-w-lg">
          <div className="relative w-full max-w-xs">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-400">
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
        <div className="flex items-center gap-3">
          {/* Avatar Placeholder */}
          <button className="relative flex h-9 w-9 items-center justify-center rounded-full bg-zinc-800 text-zinc-400 hover:text-indigo-400 transition focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <User size={20} />
          </button>
          {/* Logout Button */}
          <button
            type="button"
            onClick={onLogout}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-zinc-300 hover:bg-zinc-900 hover:text-red-400 transition focus:outline-none focus:ring-2 focus:ring-indigo-500"
            aria-label="Logout"
          >
            <LogOut size={18} />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </div>
  </nav>
);

export default Navbar;