import axios from "axios";

const apiClient = axios.create({
  baseURL: "/api",
});

apiClient.interceptors.request.use(
  (config) => {
    const url = config.url || "";
    const isAuthEndpoint =
      url.includes("/auth/login") ||
      url.includes("/auth/register");

    if (isAuthEndpoint) {
      return config;
    }

    const token =
      localStorage.getItem("token");

    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization =
        `Bearer ${token}`;
    }

    return config;
  }
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      error.response.data = {
        ...(error.response.data || {}),
        message: "Your session has expired. Please sign in again.",
      };
    }

    return Promise.reject(error);
  }
);

export default apiClient;
