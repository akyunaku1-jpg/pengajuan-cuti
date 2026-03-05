import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import TopBar from "../components/TopBar";
import { useAuth } from "../context/AuthContext";
import { ClipboardList, LayoutDashboard, LogOut, UserRound } from "lucide-react";

const EmployeeLayout = () => {
  const { user } = useAuth();

  const items = [
    { to: "/dashboard", label: "Dashboard", end: true, icon: LayoutDashboard },
    { to: "/submit-request", label: "Ajukan Cuti", icon: ClipboardList },
    { to: "/history", label: "Riwayat Pengajuan", icon: ClipboardList },
    { to: "/profile", label: "Profil", icon: UserRound },
    { to: "/logout", label: "Keluar", icon: LogOut },
  ];

  return (
    <div className="min-h-screen bg-[#f0f4ff]">
      <Sidebar title="Sistem Cuti" items={items} />
      <main className="min-h-screen md:ml-[260px]">
        <TopBar user={user} roleLabel={user?.division || "Karyawan"} />
        <div className="px-8 pb-8 pt-7">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default EmployeeLayout;
