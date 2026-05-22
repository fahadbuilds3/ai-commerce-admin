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
};

const DashboardLayout = () => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const location = useLocation();
  const title = routeTitles[location.pathname] || "Dashboard";

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-zinc-950 text-zinc-100">
      <div className="flex min-h-screen w-full min-w-0">
        <Sidebar
          mobileOpen={mobileSidebarOpen}
          onMobileClose={() => setMobileSidebarOpen(false)}
        />

        <div className="flex min-h-screen min-w-0 flex-1 flex-col">
          <Navbar
            title={title}
            onSidebarToggle={() => setMobileSidebarOpen(true)}
          />

          <main className="min-w-0 flex-1 overflow-x-hidden px-4 py-4 sm:px-6 lg:px-8">
            <div className="mx-auto w-full max-w-7xl min-w-0">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;
