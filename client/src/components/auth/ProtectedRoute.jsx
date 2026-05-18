import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";

/**
 * ProtectedRoute - Guards routes and ensures only authenticated users can access them.
 * Redirects unauthenticated users to /login. Shows a loading indicator during auth check.
 *
 * @param {React.ReactNode} children - Components to render if authenticated
 * @returns {React.ReactNode}
 */
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <span>Loading...</span>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;