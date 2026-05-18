import { createContext, useEffect, useState, useCallback, useRef } from "react";
import { fetchCurrentUser } from "../api/authApi";

/**
 * AuthContext - Centralized authentication state and utilities for scalable SaaS dashboards.
 * Provides user info, loading state, and a robust logout that clears JWT and state.
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

  // Ref to allow immediate effects (such as ProtectedRoute responding after logout)
  const isMounted = useRef(true);

  /**
   * Immediately remove JWT and clear user session.
   * ProtectedRoute will respond instantly via context value.
   */
  const logout = useCallback(() => {
    localStorage.removeItem("token"); // Remove JWT
    setUser(null); // Clear user state
    setLoading(false); // Ensure UI updates for route guards that use loading
  }, []);

  /**
   * On mount, fire initial authentication check.
   */
  useEffect(() => {
    isMounted.current = true;
    const bootstrapAuth = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        if (isMounted.current) {
          setUser(null);
          setLoading(false);
        }
        return;
      }
      try {
        const userData = await fetchCurrentUser();
        if (isMounted.current) {
          setUser(userData.user || null);
        }
      } catch (err) {
        // If token invalid, clear everything using logout to keep logic DRY.
        if (isMounted.current) {
          logout();
        }
      } finally {
        if (isMounted.current) setLoading(false);
      }
    };
    bootstrapAuth();

    return () => {
      isMounted.current = false;
    };
  }, [logout]);

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