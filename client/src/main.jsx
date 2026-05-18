import React from "react";
import ReactDOM from "react-dom/client";

// Global stylesheet
import "./index.css";

// App routes and authentication context
import AppRoutes from "./routes/AppRoutes";
import { AuthProvider } from "./context/AuthContext";

// Notifications
import { Toaster } from "react-hot-toast";

// Clean, production-ready app bootstrap for scalable SaaS
const root = document.getElementById("root");

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <AuthProvider>
      <Toaster position="top-right" />
      <AppRoutes />
    </AuthProvider>
  </React.StrictMode>
);