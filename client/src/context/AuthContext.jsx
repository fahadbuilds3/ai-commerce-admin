import { createContext, useEffect, useState, useCallback } from "react";
import { fetchCurrentUser } from "../api/authApi";

/**
 * AuthContext - Provides authentication state and utilities.
 * Ensures a production-grade, scalable architecture for modern SaaS dashboards.
 */
export const AuthContext = createContext({
  user: null,
  setUser: () => {},
  loading: true,
  logout: () => {},
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  /**
   * Handles token invalidation and cleanup.
   */
  const handleTokenInvalidation = useCallback(() => {
    localStorage.removeItem("token");
    setUser(null);
  }, []);

  /**
   * Load the current user as soon as the app initializes, if a token exists.
   */
  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setLoading(false);
        setUser(null);
        return;
      }
      try {
        const userData = await fetchCurrentUser();
        setUser(userData.user || null);
      } catch (error) {
        // On authentication failure or network error, remove invalid token.
        handleTokenInvalidation();
      } finally {
        setLoading(false);
      }
    };
    initializeAuth();
    // No dependencies ensures it runs once on mount.
    // handleTokenInvalidation reference is stable due to useCallback.
  }, [handleTokenInvalidation]);

  /**
   * Logout - clears token and user state.
   */
  const logout = useCallback(() => {
    handleTokenInvalidation();
  }, [handleTokenInvalidation]);

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        loading,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};