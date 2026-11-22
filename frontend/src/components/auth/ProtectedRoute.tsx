import { Navigate } from "react-router-dom";
import type { ReactNode } from "react";

import { useAuth } from "../../context/AuthContext";

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRole?: "ADMIN" | "USER";
}

function ProtectedRoute({
  children,
  allowedRole,
}: ProtectedRouteProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="auth-loading">
        <div className="loading-spinner" />
        <span>Loading workspace...</span>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (
    allowedRole &&
    user.role.toUpperCase() !== allowedRole
  ) {
    return (
      <Navigate
        to={
          user.role.toUpperCase() === "ADMIN"
            ? "/admin"
            : "/user"
        }
        replace
      />
    );
  }

  return <>{children}</>;
}

export default ProtectedRoute;