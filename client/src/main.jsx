import React from "react";
import ReactDOM from "react-dom/client";

// Global stylesheet
import "./index.css";

// App routes and authentication context
import AppRoutes from "./routes/AppRoutes";
import { AuthProvider } from "./context/AuthContext";

// Notifications
import { Toaster } from "react-hot-toast";

// React Query setup
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Initialize QueryClient once, outside the render for proper caching and devtools support
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 2,
      staleTime: 1000 * 60, // 1 minute
      suspense: false,
    },
    mutations: {
      retry: 1,
    },
  },
});

// Production-ready app bootstrap for scalable SaaS
const root = document.getElementById("root");

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Toaster position="top-right" />
        <AppRoutes />
      </AuthProvider>
    </QueryClientProvider>
  </React.StrictMode>
);