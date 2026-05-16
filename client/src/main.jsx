import React from "react";
import ReactDOM from "react-dom/client";

import "./index.css";

import AppRoutes from "./routes/AppRoutes";
import { AuthProvider } from "./context/AuthContext";

import { Toaster } from "react-hot-toast";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      <Toaster position="top-right" />
      <AppRoutes />
    </AuthProvider>
  </React.StrictMode>
);