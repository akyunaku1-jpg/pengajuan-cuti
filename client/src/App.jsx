import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { AdminRoute, EmployeeRoute, ProtectedRoute } from "./components/ProtectedRoute";
import EmployeeLayout from "./layouts/EmployeeLayout";
import AdminLayout from "./layouts/AdminLayout";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/employee/DashboardPage";
import RequestFormPage from "./pages/employee/RequestFormPage";
import RequestHistoryPage from "./pages/employee/RequestHistoryPage";
import ProfilePage from "./pages/employee/ProfilePage";
import AdminDashboardPage from "./pages/admin/AdminDashboardPage";
import AllRequestsPage from "./pages/admin/AllRequestsPage";
import EmployeeDataPage from "./pages/admin/EmployeeDataPage";
import TambahAkunPage from "./pages/admin/TambahAkunPage";
import LogoutPage from "./pages/LogoutPage";

const HomeRedirect = () => {
  const { user, loadingAuth } = useAuth();
  if (loadingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-appBg px-4">
        <div className="app-card fade-up w-full max-w-sm p-6 text-center">
          <p className="font-heading text-lg font-bold text-mainText">Memuat aplikasi...</p>
          <p className="mt-1 text-sm text-mutedText">Menyiapkan sesi pengguna</p>
        </div>
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={user.role === "admin" ? "/admin/dashboard" : "/dashboard"} replace />;
};

const App = () => (
  <Routes>
    <Route path="/" element={<HomeRedirect />} />
    <Route path="/login" element={<LoginPage />} />
    <Route path="/logout" element={<LogoutPage />} />

    <Route element={<ProtectedRoute />}>
      <Route element={<EmployeeRoute />}>
        <Route element={<EmployeeLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/submit-request" element={<RequestFormPage />} />
          <Route path="/history" element={<RequestHistoryPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>
      </Route>
    </Route>

    <Route element={<AdminRoute />}>
      <Route element={<AdminLayout />}>
        <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
        <Route path="/admin/requests" element={<AllRequestsPage />} />
        <Route path="/admin/employees" element={<EmployeeDataPage />} />
        <Route path="/admin/tambah-akun" element={<TambahAkunPage />} />
      </Route>
    </Route>

    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

export default App;
