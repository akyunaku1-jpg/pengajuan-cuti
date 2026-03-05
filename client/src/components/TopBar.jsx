import { Bell, CheckCircle2, Info, XCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { getInitials } from "../lib/helpers";

const titleMap = {
  "/dashboard": "Dashboard Karyawan",
  "/submit-request": "Ajukan Cuti",
  "/history": "Riwayat Pengajuan",
  "/profile": "Profil Saya",
  "/admin/dashboard": "Dashboard Admin",
  "/admin/requests": "Data Pengajuan",
  "/admin/employees": "Data Karyawan",
  "/admin/tambah-akun": "Tambah Akun",
};

const TopBar = ({ user, roleLabel }) => {
  const { pathname } = useLocation();
  const title = titleMap[pathname] || "Employee Leave System";
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(true);
  const notifRef = useRef(null);

  useEffect(() => {
    const onClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setIsNotifOpen(false);
      }
    };

    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const notifications = [
    {
      id: 1,
      title: "Pengajuan Disetujui",
      desc: "Cuti Sakit Anda pada 11 Feb telah disetujui oleh HRD",
      time: "2 jam yang lalu",
      icon: CheckCircle2,
      box: "bg-[#DCFCE7]",
      iconColor: "text-[#22C55E]",
    },
    {
      id: 2,
      title: "Pengajuan Ditolak",
      desc: "Cuti Tahunan Anda pada 20 Mar telah ditolak",
      time: "1 hari yang lalu",
      icon: XCircle,
      box: "bg-[#FEE2E2]",
      iconColor: "text-[#EF4444]",
    },
    {
      id: 3,
      title: "Pengajuan Diterima",
      desc: "Pengajuan Cuti Khusus Anda sedang ditinjau oleh HRD",
      time: "3 hari yang lalu",
      icon: Info,
      box: "bg-[#EEF2FF]",
      iconColor: "text-[#6C8CF5]",
    },
  ];

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white/80 px-8 backdrop-blur-xl">
      <div>
        <h1 className="text-lg font-bold text-slate-900">{title}</h1>
        <p className="text-xs text-slate-500">Selamat datang kembali, {user?.name || "User"}</p>
      </div>

      <div className="flex items-center gap-3">
        <div ref={notifRef} className="relative">
          <button
            type="button"
            onClick={() => setIsNotifOpen((prev) => !prev)}
            className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition duration-200 hover:-translate-y-[1px] hover:bg-[#eef2ff] hover:text-[#6c8cf5]"
            aria-label="Notifikasi"
          >
            <Bell size={18} />
            {hasUnread ? <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-[#ef4444]" /> : null}
          </button>

          <div
            className={`absolute right-0 top-[calc(100%+10px)] z-[999] w-[320px] overflow-hidden rounded-[14px] border border-slate-200 bg-white shadow-[0_8px_32px_rgba(0,0,0,0.12)] transition duration-200 ${
              isNotifOpen ? "visible translate-y-0 opacity-100" : "invisible -translate-y-2 opacity-0"
            }`}
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-[18px] py-4">
              <p className="font-heading text-[15px] font-bold text-[#0F172A]">Notifikasi</p>
              <button
                type="button"
                onClick={() => setHasUnread(false)}
                className="text-xs text-[#6C8CF5] transition hover:underline"
              >
                Tandai semua dibaca
              </button>
            </div>

            <div>
              {notifications.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    className="flex w-full cursor-pointer items-start gap-3 border-b border-[#F1F5F9] px-[18px] py-[14px] text-left transition hover:bg-[#F8FAFF]"
                  >
                    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[9px] ${item.box}`}>
                      <Icon size={16} className={item.iconColor} />
                    </span>
                    <span className="block">
                      <span className="block text-[13px] font-semibold text-[#0F172A]">{item.title}</span>
                      <span className="mt-[2px] block text-xs text-[#64748B]">{item.desc}</span>
                      <span className="mt-1 block text-[11px] text-[#94A3B8]">{item.time}</span>
                    </span>
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              className="w-full border-t border-slate-200 bg-[#FAFBFF] p-[14px] text-center text-[13px] font-semibold text-[#6C8CF5] transition hover:bg-[#EEF2FF]"
            >
              Lihat semua notifikasi
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-full border border-slate-200 bg-white px-2 py-1.5 transition duration-200 hover:bg-[#eef2ff]">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#6c8cf5] to-[#7c3aed] text-xs font-bold text-white">
            {getInitials(user?.name)}
          </div>
          <div className="pr-2">
            <p className="text-sm font-semibold">{user?.name}</p>
            <p className="text-xs text-slate-500">{roleLabel}</p>
          </div>
        </div>
      </div>
    </header>
  );
};

export default TopBar;
