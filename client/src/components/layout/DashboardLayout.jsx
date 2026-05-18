import React from "react";
import Sidebar from "./sidebar";
import Navbar from "./Navbar";

/**
 * DashboardLayout - A reusable dashboard layout component for a SaaS admin panel.
 * Features:
 * - Responsive sidebar and navbar
 * - Modern dark design
 * - Scrollable and padded content area
 * - Renders children
 */
const DashboardLayout = ({ title = "Dashboard", onLogout, children }) => {
  return (
    <div className="flex min-h-screen bg-zinc-950">
      {/* Sidebar: hides on small screens, drawer in sidebar.jsx handles mobile */}
      <Sidebar />

      {/* Main Content Wrapper */}
      <div className="flex flex-col flex-1 min-h-screen">
        {/* Navbar at the top */}
        <Navbar title={title} onLogout={onLogout} />

        {/* Content */}
        <main
          className="flex-1 relative overflow-y-auto p-4 sm:p-8 bg-zinc-950"
        >
          <div className="mx-auto max-w-7xl w-full h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;