import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle, ArrowRight, BriefcaseBusiness, CheckCircle2, Clock3, FilePlus2, Layers3 } from "lucide-react";
import api from "../../lib/api";
import { formatDate, getLeaveTypeLabel } from "../../lib/helpers";
import StatusBadge from "../../components/StatusBadge";

const statCards = [
  {
    key: "total",
    label: "Total Pengajuan",
    subLabel: "seluruh pengajuan",
    icon: Layers3,
    tone: "text-[#6C8CF5] bg-[#EEF2FF]",
    circle: "before:bg-[#6c8cf51f]",
    border: "border-t-[#6C8CF5]",
  },
  {
    key: "pending_count",
    label: "Pending",
    subLabel: "menunggu persetujuan",
    icon: Clock3,
    tone: "text-[#F59E0B] bg-[#FEF3C7]",
    circle: "before:bg-[#f59e0b1c]",
    border: "border-t-[#F59E0B]",
  },
  {
    key: "approved_count",
    label: "Disetujui",
    subLabel: "berhasil diproses",
    icon: CheckCircle2,
    tone: "text-[#22C55E] bg-[#DCFCE7]",
    circle: "before:bg-[#22c55e1c]",
    border: "border-t-[#22C55E]",
  },
  {
    key: "rejected_count",
    label: "Ditolak",
    subLabel: "perlu perbaikan",
    icon: AlertCircle,
    tone: "text-[#EF4444] bg-[#FEE2E2]",
    circle: "before:bg-[#ef44441c]",
    border: "border-t-[#EF4444]",
  },
];

const DashboardPage = () => {
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    const load = async () => {
      const [{ data: summaryData }, { data: requestsData }] = await Promise.all([
        api.get("/requests/summary"),
        api.get("/requests"),
      ]);
      setSummary(summaryData);
      setRequests(requestsData.requests);
    };
    load();
  }, []);

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between rounded-2xl bg-gradient-to-r from-[#6C8CF5] to-[#8B5CF6] px-8 py-7">
        <div>
          <h1 className="text-2xl font-extrabold text-white [font-family:Outfit,Plus_Jakarta_Sans,sans-serif]">
            Halo, {requests?.[0]?.employee_name?.split(" ")[0] || "Karyawan"}! 👋
          </h1>
          <p className="mt-1 text-sm text-white/80">Semua pengajuan cuti Anda dapat dikelola di sini.</p>
        </div>
        <div className="text-6xl">📅</div>
      </div>

      <div className="grid gap-[18px] xl:grid-cols-4">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          const value =
            summary?.[card.key] ??
            (card.key === "total" ? requests.length : requests.filter((item) => item.status === card.key.replace("_count", "")).length);
          return (
            <article
              key={card.key}
              className={`relative overflow-hidden rounded-[14px] border border-slate-200 border-t-[3px] ${card.border} bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.04)] transition duration-200 hover:-translate-y-[3px] hover:shadow-[0_10px_24px_rgba(15,23,42,0.12)]`}
            >
              <span className={`pointer-events-none absolute -right-6 -top-6 z-0 h-24 w-24 rounded-full ${card.circle.replace("before:bg-", "bg-")}`} />
              <div className={`relative z-[1] mb-5 flex h-9 w-9 items-center justify-center rounded-[10px] ${card.tone}`}>
                <Icon size={18} />
              </div>
              <p className="relative z-[1] text-[32px] font-extrabold leading-none text-slate-900 [font-family:Outfit,Plus_Jakarta_Sans,sans-serif]">{value ?? 0}</p>
              <p className="relative z-[1] mt-2 text-[13px] font-semibold text-slate-900">{card.label}</p>
              <p className="relative z-[1] text-[11px] text-slate-500">{card.subLabel}</p>
            </article>
          );
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <button
          type="button"
          className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-6 py-[18px] text-left shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.04)] transition duration-200 hover:-translate-y-[2px] hover:border-[#6C8CF5]"
          onClick={() => navigate("/submit-request")}
        >
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#6C8CF5] to-[#5A78E3] text-white">
              <FilePlus2 size={18} />
            </span>
            <span>
              <span className="block text-sm font-bold text-slate-900">Ajukan Cuti</span>
              <span className="block text-xs text-slate-500">Cuti tahunan, sakit, atau khusus</span>
            </span>
          </div>
          <ArrowRight size={18} className="text-slate-400" />
        </button>
        <button
          type="button"
          className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-6 py-[18px] text-left shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.04)] transition duration-200 hover:-translate-y-[2px] hover:border-[#6C8CF5]"
          onClick={() => navigate("/submit-request")}
        >
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#8B5CF6] to-[#7C3AED] text-white">
              <BriefcaseBusiness size={18} />
            </span>
            <span>
              <span className="block text-sm font-bold text-slate-900">Ajukan Izin</span>
              <span className="block text-xs text-slate-500">Izin keluar atau keperluan mendadak</span>
            </span>
          </div>
          <ArrowRight size={18} className="text-slate-400" />
        </button>
      </div>

      <div className="overflow-hidden rounded-[14px] border border-slate-200 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.04)]">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-bold [font-family:Outfit,Plus_Jakarta_Sans,sans-serif]">Pengajuan Terbaru</h2>
          <button
            type="button"
            className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-[#EEF2FF]"
          >
            Lihat Semua
          </button>
        </div>
        <div className="px-2 pb-2">
        <table className="min-w-full text-sm">
          <thead className="bg-[#F8FAFF] text-left text-[11px] uppercase tracking-[0.16em] text-slate-500">
            <tr>
              <th className="px-4 py-3">Tanggal</th>
              <th className="px-4 py-3">Jenis Cuti</th>
              <th className="px-4 py-3">Durasi</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {requests.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-center text-slate-500" colSpan={4}>
                  Tidak ada pengajuan ditemukan
                </td>
              </tr>
            ) : (
              requests.slice(0, 5).map((item, rowIndex) => (
                <tr key={item.id} className={`border-b border-[#edf2ff] transition duration-200 hover:bg-[#f7f9ff] ${rowIndex === 1 ? "anim-delay-1" : ""} ${rowIndex === 2 ? "anim-delay-2" : ""}`}>
                  <td className="px-4 py-3">{formatDate(item.created_at)}</td>
                  <td className="px-4 py-3">{getLeaveTypeLabel(item.leave_type)}</td>
                  <td className="px-4 py-3">
                    <span className="font-semibold text-slate-900">{Number(item.duration || 0)}</span>{" "}
                    <span className="text-slate-500">hari</span>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={item.status} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        </div>
      </div>
    </section>
  );
};

export default DashboardPage;
