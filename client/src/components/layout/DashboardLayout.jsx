import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./sidebar";
import Navbar from "./Navbar";

const routeTitles = {
  "/dashboard": "Dashboard",
  "/products": "Products",
  "/orders": "Orders",
  "/customers": "Customers",
  "/analytics": "Analytics",
  "/inventory": "Inventory",
  "/ai-assistant": "AI Assistant",
};

const DashboardLayout = () => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const location = useLocation();
  const title = routeTitles[location.pathname] || "Dashboard";

  return (
    <div className="h-dvh min-h-screen w-full overflow-hidden bg-app text-content-primary transition-colors duration-200">
      <div className="flex h-full w-full min-w-0 overflow-hidden">
        <Sidebar
          mobileOpen={mobileSidebarOpen}
          onMobileClose={() => setMobileSidebarOpen(false)}
        />

        <div className="flex h-full min-w-0 flex-1 flex-col overflow-hidden">
          <Navbar
            title={title}
            onSidebarToggle={() => setMobileSidebarOpen(true)}
          />

          <main className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden px-4 py-4 sm:px-6 lg:px-8">
            <div className="mx-auto h-full w-full max-w-7xl min-w-0">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;
