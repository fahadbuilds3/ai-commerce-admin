import { BrowserRouter, Routes, Route, Outlet, Navigate } from "react-router-dom";

// Import production modules
import Login from "../pages/auth/Login";
import DashboardHome from "../pages/dashboard/DashboardHome";
import ProductsPage from "../pages/products/ProductsPage";
import OrdersPage from "../pages/orders/OrdersPage";
import ProtectedRoute from "../components/auth/ProtectedRoute";

// --- TEMPORARY PLACEHOLDER PAGES FOR MISSING MODULES --- //
const CustomersPage = () => (
  <div className="flex flex-col items-center justify-center min-h-screen text-zinc-400">
    <h1 className="text-xl font-bold mb-2">Customers</h1>
    <p>This is the Customers module. (Placeholder)</p>
  </div>
);

const AnalyticsPage = () => (
  <div className="flex flex-col items-center justify-center min-h-screen text-zinc-400">
    <h1 className="text-xl font-bold mb-2">Analytics</h1>
    <p>This is the Analytics module. (Placeholder)</p>
  </div>
);

// Minimal NotFound for demonstration; customize as needed
const NotFound = () => (
  <div className="flex flex-col items-center justify-center min-h-screen text-zinc-400">
    <h1 className="text-2xl font-bold mb-2">404</h1>
    <p>Page Not Found</p>
  </div>
);

// DashboardLayout keeps protected layout structure and preserves sidebar/navbar
const DashboardLayout = () => (
  <ProtectedRoute>
    <Outlet />
  </ProtectedRoute>
);

const AppRoutes = () => (
  <BrowserRouter>
    <Routes>
      {/* Public Auth Route */}
      <Route path="/login" element={<Login />} />

      {/* Protected admin dashboard & modules */}
      <Route element={<DashboardLayout />}>
        {/* Redirect "/" to "/dashboard" for root access */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardHome />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/orders" element={<OrdersPage />} />
        <Route path="/customers" element={<CustomersPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
      </Route>

      {/* Fallback 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  </BrowserRouter>
);

export default AppRoutes;