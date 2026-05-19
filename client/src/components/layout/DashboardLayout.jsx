import React from "react";
import Sidebar from "./sidebar";
import Navbar from "./Navbar";

/**
 * DashboardLayout - Production-ready SaaS dashboard layout for admin panel.
 * - Prevents horizontal scrolling/root overflow
 * - Sidebar + main content handle resizing responsively
 * - Mobile-first, modern flex architecture
 * - Sticky/fixed navbar supported
 * - Preserves sidebar animations; visually robust
 */
const DashboardLayout = ({ title = "Dashboard", onLogout, children }) => {
  return (
    <div
      className="relative min-h-screen w-full bg-zinc-950 flex overflow-x-hidden"
      style={{
        // Prevents global horizontal scrolling
        minWidth: 0,
        width: "100vw",
        maxWidth: "100vw",
        overflowX: "hidden"
      }}
    >
      {/* Sidebar: handles mobile/desktop display internally */}
      <Sidebar />

      {/* Content Section */}
      <div
        className="flex flex-col flex-1 min-h-screen min-w-0 w-0"
        style={{
          // Ensures main content shrinks/grows properly and never overflows
          minWidth: 0,
          width: "100%",
          overflow: "hidden"
        }}
      >
        {/* Sticky Navbar Header */}
        <div className="sticky top-0 z-30 w-full bg-zinc-950 bg-opacity-95 backdrop-blur supports-[backdrop-filter]:bg-opacity-85">
          <Navbar title={title} onLogout={onLogout} />
        </div>

        {/* Scrollable content area */}
        <main
          className="flex-1 relative overflow-y-auto"
          style={{
            // Prevent horizontal scroll within content
            minWidth: 0,
            width: "100%",
            overflowX: "hidden",
            paddingLeft: "1rem",
            paddingRight: "1rem",
            paddingTop: "1rem",
            paddingBottom: "1rem"
          }}
        >
          <div
            className="mx-auto w-full h-full"
            style={{
              maxWidth: "80rem", // ~1280px, matches max-w-7xl (for fluid limiting)
              minWidth: 0
            }}
          >
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;