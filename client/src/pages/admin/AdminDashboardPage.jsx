import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { AlertCircle, Check, CheckCircle2, Clock3, Layers3, Search, X } from "lucide-react";
import api from "../../lib/api";
import {
  formatDate,
  getAvatarGradientClass,
  getInitials,
  getLeaveTypeLabel,
  getLeaveTypeTagClass,
} from "../../lib/helpers";
import StatusBadge from "../../components/StatusBadge";
import RejectModal from "../../components/RejectModal";

const statCards = [
  {
    key: "total",
    label: "Total Pengajuan",
    subLabel: "bulan ini",
    icon: Layers3,
    tone: "text-primary bg-primary-soft",
    circle: "before:bg-[#6c8cf51f]",
  },
  {
    key: "pending",
    label: "Pending",
    subLabel: "perlu ditinjau",
    icon: Clock3,
    tone: "text-pending bg-pendingBg",
    circle: "before:bg-[#f59e0b1c]",
  },
  {
    key: "approved",
    label: "Disetujui",
    subLabel: "diproses",
    icon: CheckCircle2,
    tone: "text-approved bg-approvedBg",
    circle: "before:bg-[#22c55e1c]",
  },
  {
    key: "rejected",
    label: "Ditolak",
    subLabel: "perlu evaluasi",
    icon: AlertCircle,
    tone: "text-rejected bg-rejectedBg",
    circle: "before:bg-[#ef44441c]",
  },
];

const cardClass = "rounded-[14px] border border-slate-200 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.04)]";
const buttonOutlineClass =
  "rounded-[12px] border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition duration-200 hover:-translate-y-[1px] hover:bg-[#eef2ff]";

const AdminDashboardPage = () => {
  const [summary, setSummary] = useState(null);
  const [requests, setRequests] = useState([]);
  const [modalState, setModalState] = useState({ open: false, requestId: null });
  const [loadingReject, setLoadingReject] = useState(false);

  const load = async () => {
    const [{ data: summaryData }, { data: requestsData }] = await Promise.all([
      api.get("/requests/summary"),
      api.get("/requests"),
    ]);
    setSummary(summaryData);
    setRequests(requestsData.requests.slice(0, 8));
  };

  useEffect(() => {
    load();
  }, []);

  const approveRequest = async (id) => {
    try {
      await api.patch(`/requests/${id}/approve`);
      toast.success("Pengajuan berhasil disetujui");
      setRequests((prev) => prev.map((item) => (item.id === id ? { ...item, status: "approved", admin_notes: "" } : item)));
    } catch (error) {
      toast.error(error.response?.data?.message || "Gagal menyetujui pengajuan.");
    }
  };

  const rejectRequest = async (notes) => {
    if (!modalState.requestId) return;
    setLoadingReject(true);
    try {
      await api.patch(`/requests/${modalState.requestId}/reject`, { admin_notes: notes });
      toast.success("Pengajuan ditolak");
      setRequests((prev) =>
        prev.map((item) =>
          item.id === modalState.requestId ? { ...item, status: "rejected", admin_notes: notes } : item,
        ),
      );
      setModalState({ open: false, requestId: null });
    } catch (error) {
      toast.error(error.response?.data?.message || "Gagal menolak pengajuan.");
    } finally {
      setLoadingReject(false);
    }
  };

  return (
    <section>
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold">Dashboard Admin</h1>
          <p className="text-sm text-mutedText">Ringkasan semua pengajuan cuti di seluruh organisasi.</p>
        </div>
        <Link to="/admin/requests" className="text-sm font-semibold text-primary hover:text-primary-hover">
          Lihat Semua
        </Link>
      </div>
      <div className="mt-6 grid grid-cols-1 gap-[18px] md:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <article
              key={card.key}
              className={`${cardClass} ${card.circle} relative h-[172px] overflow-hidden p-5 before:absolute before:-right-8 before:-top-8 before:h-28 before:w-28 before:rounded-full transition duration-200 hover:-translate-y-[3px] hover:shadow-lg`}
            >
              <div className={`mb-6 flex h-10 w-10 items-center justify-center rounded-xl ${card.tone}`}>
                <Icon size={18} />
              </div>
              <p className="text-[34px] font-extrabold leading-none text-slate-900">{summary?.[card.key] ?? 0}</p>
              <p className="mt-2 text-sm font-semibold text-slate-900">{card.label}</p>
              <p className="text-xs text-slate-500">{card.subLabel}</p>
            </article>
          );
        })}
      </div>

      <div className={`${cardClass} mt-6 w-full overflow-hidden`}>
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h2 className="font-heading text-lg font-bold">Pengajuan Terbaru</h2>
          <button type="button" className={buttonOutlineClass}>
            Lihat Semua
          </button>
        </div>
        <div className="flex items-center border-b border-slate-200 px-5 py-3">
          <div className="ml-auto flex items-center gap-2 rounded-full border border-slate-200 bg-[#f8faff] px-3 py-2 text-sm text-slate-500">
            <Search size={15} />
            <input className="bg-transparent outline-none placeholder:text-slate-400" placeholder="Cari karyawan..." />
          </div>
        </div>
        <div className="overflow-x-auto">
        <table className="min-w-[980px] w-full text-sm">
          <thead className="bg-[#f8faff] text-left text-[11px] uppercase tracking-[0.16em] text-slate-500">
            <tr>
              <th className="px-4 py-3">Karyawan</th>
              <th className="px-4 py-3">Jenis Cuti</th>
              <th className="px-4 py-3">Tanggal Mulai</th>
              <th className="px-4 py-3">Tanggal Selesai</th>
              <th className="px-4 py-3">Durasi</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {requests.length === 0 ? (
              <tr>
                <td className="px-4 py-8 text-center text-slate-500" colSpan={8}>
                  Tidak ada data tersedia
                </td>
              </tr>
            ) : (
              requests.map((item, rowIndex) => (
                <tr key={item.id} className="border-b border-[#edf2ff] transition duration-200 hover:bg-[#f7f9ff]">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br ${getAvatarGradientClass(item.employee_name)} text-[11px] font-bold text-white`}
                      >
                        {getInitials(item.employee_name)}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">{item.employee_name}</p>
                        <p className="text-xs text-slate-500">{item.employee_division}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getLeaveTypeTagClass(item.leave_type)}`}>
                        {getLeaveTypeLabel(item.leave_type)}
                      </span>
                      {item.warning ? (
                        <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                          {item.warning}
                        </span>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-4 py-3">{formatDate(item.start_date)}</td>
                  <td className="px-4 py-3">{formatDate(item.end_date)}</td>
                  <td className="px-4 py-3">
                    <span className="font-semibold text-slate-900">{Number(item.duration || 0)}</span>{" "}
                    <span className="text-slate-500">hari</span>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={item.status} />
                  </td>
                  <td className="px-4 py-3">
                    {item.status === "pending" ? (
                      <div className="flex gap-2">
                        <button
                          type="button"
                          className="app-button border border-[#86efac] bg-[#f0fdf4] px-3 py-1.5 text-xs font-semibold text-[#166534] hover:bg-approved hover:text-white"
                          onClick={() => approveRequest(item.id)}
                        >
                          <Check size={14} /> Setujui
                        </button>
                        <button
                          type="button"
                          className="app-button border border-[#fecaca] bg-[#fef2f2] px-3 py-1.5 text-xs font-semibold text-[#991b1b] hover:bg-rejected hover:text-white"
                          onClick={() => setModalState({ open: true, requestId: item.id })}
                        >
                          <X size={14} /> Tolak
                        </button>
                      </div>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                        <CheckCircle2 size={14} />
                        Diproses
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        </div>
        <div className="flex items-center justify-between border-t border-slate-200 px-5 py-3 text-xs text-mutedText">
          <p>
            Menampilkan <span className="font-semibold text-slate-900">{requests.length}</span> dari{" "}
            <span className="font-semibold text-slate-900">{summary?.total ?? requests.length}</span> data
          </p>
          <div className="flex items-center gap-2">
            <button type="button" className={buttonOutlineClass}>
              Sebelumnya
            </button>
            <button type="button" className={buttonOutlineClass}>
              Berikutnya
            </button>
          </div>
        </div>
      </div>

      <RejectModal
        open={modalState.open}
        loading={loadingReject}
        onClose={() => setModalState({ open: false, requestId: null })}
        onConfirm={rejectRequest}
      />
    </section>
  );
};

export default AdminDashboardPage;
