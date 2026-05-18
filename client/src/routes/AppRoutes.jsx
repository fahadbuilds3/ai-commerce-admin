import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";

import Login from "../pages/auth/Login";
import DashboardHome from "../pages/dashboard/DashboardHome";
import ProductsPage from "../pages/products/ProductsPage";
import ProtectedRoute from "../components/auth/ProtectedRoute";

/**
 * AppRoutes - Organizes all routes for the admin dashboard in a clean, scalable structure.
 * - Authentication routes remain public.
 * - Protected dashboard section supports nested structure.
 */
const DashboardRoutes = () => (
  <ProtectedRoute>
    <Outlet />
  </ProtectedRoute>
);

const AppRoutes = () => (
  <BrowserRouter>
    <Routes>
      {/* Public Auth Route */}
      <Route path="/login" element={<Login />} />
      {/* Protected Dashboard Routes - nest future dashboard screens here */}
      <Route path="/" element={<DashboardRoutes />}>
        <Route index element={<DashboardHome />} />
        <Route path="products" element={<ProductsPage />} />
        {/* Example: <Route path="users" element={<UsersPage />} /> */}
      </Route>
    </Routes>
  </BrowserRouter>
);

export default AppRoutes;