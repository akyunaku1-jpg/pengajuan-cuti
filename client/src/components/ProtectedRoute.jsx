import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Spinner = () => (
  <div className="flex min-h-screen items-center justify-center text-mutedText">Memuat...</div>
);

export const ProtectedRoute = () => {
  const { isAuthenticated, loadingAuth } = useAuth();
  if (loadingAuth) return <Spinner />;
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

export const EmployeeRoute = () => {
  const { user, loadingAuth, isAuthenticated } = useAuth();
  if (loadingAuth) return <Spinner />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user.role !== "employee") return <Navigate to="/admin/dashboard" replace />;
  return <Outlet />;
};

export const AdminRoute = () => {
  const { user, loadingAuth, isAuthenticated } = useAuth();
  if (loadingAuth) return <Spinner />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user.role !== "admin") return <Navigate to="/dashboard" replace />;
  return <Outlet />;
};
