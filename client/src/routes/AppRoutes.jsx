import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Import production modules
import Login from "../pages/auth/Login";
import DashboardHome from "../pages/dashboard/DashboardHome";
import ProductsPage from "../pages/products/ProductsPage";
import OrdersPage from "../pages/orders/OrdersPage";
import CustomersPage from "../pages/customers/CustomersPage";
import DashboardLayout from "../components/layout/DashboardLayout";
import ProtectedRoute from "../components/auth/ProtectedRoute";
import AnalyticsPage from "../pages/analytics/AnalyticsPage";

// Minimal NotFound for demonstration; customize as needed
const NotFound = () => (
  <div className="flex flex-col items-center justify-center min-h-screen text-zinc-400">
    <h1 className="text-2xl font-bold mb-2">404</h1>
    <p>Page Not Found</p>
  </div>
);

const AppRoutes = () => (
  <BrowserRouter>
    <Routes>
      {/* Public Auth Route */}
      <Route path="/login" element={<Login />} />

      {/* Protected admin dashboard & modules */}
      <Route
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
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
