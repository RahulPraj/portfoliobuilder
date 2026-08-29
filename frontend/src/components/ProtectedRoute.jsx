import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export const RequireUser = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? children : <Navigate to="/login" replace />;
};

export const RequireAdmin = ({ children }) => {
  const { admin, loading } = useAuth();
  if (loading) return null;
  return admin ? children : <Navigate to="/admin/login" replace />;
};
