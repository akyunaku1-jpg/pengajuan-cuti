import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import TopBar from "../components/TopBar";
import { useAuth } from "../context/AuthContext";
import { ClipboardCheck, LayoutDashboard, LogOut, SquareUserRound, UserPlus } from "lucide-react";

const AdminLayout = () => {
  const { user } = useAuth();
  const items = [
    { to: "/admin/dashboard", label: "Dashboard", end: true, icon: LayoutDashboard },
    { to: "/admin/requests", label: "Data Pengajuan", icon: ClipboardCheck },
    { to: "/admin/employees", label: "Data Karyawan", icon: SquareUserRound },
    { to: "/admin/tambah-akun", label: "Tambah Akun", icon: UserPlus },
    { to: "/logout", label: "Keluar", icon: LogOut },
  ];

  return (
    <div className="min-h-screen bg-[#f0f4ff]">
      <Sidebar title="HR Admin" items={items} />
      <main className="min-h-screen md:ml-[260px]">
        <TopBar user={user} roleLabel="Admin" />
        <div className="px-8 pb-8 pt-7">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
