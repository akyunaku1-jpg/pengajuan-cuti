import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Check, CheckCircle2, Search, X, X as XIcon } from "lucide-react";
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

const filters = ["all", "pending", "approved", "rejected"];
const filterLabelMap = {
  all: "Semua",
  pending: "Pending",
  approved: "Disetujui",
  rejected: "Ditolak",
};

const AllRequestsPage = () => {
  const [activeFilter, setActiveFilter] = useState("all");
  const [requests, setRequests] = useState([]);
  const [modalState, setModalState] = useState({ open: false, requestId: null });
  const [loadingReject, setLoadingReject] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);

  const load = async () => {
    const { data } = await api.get("/requests");
    setRequests(data.requests);
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (selectedRequest) {
      console.log("[AllRequestsPage] selectedRequest", selectedRequest);
    }
  }, [selectedRequest]);

  const filtered = useMemo(() => {
    if (activeFilter === "all") return requests;
    return requests.filter((item) => item.status === activeFilter);
  }, [activeFilter, requests]);

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

  const getSupportingDocumentUrl = (value) => {
    if (typeof value !== "string") return "";
    return value.trim();
  };

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-bold [font-family:Outfit,Plus_Jakarta_Sans,sans-serif]">Data Pengajuan</h1>
      <div className="overflow-hidden rounded-[14px] border border-slate-200 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.04)]">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h2 className="text-lg font-bold [font-family:Outfit,Plus_Jakarta_Sans,sans-serif]">Daftar Pengajuan</h2>
          <button
            type="button"
            className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:-translate-y-[1px] hover:bg-[#EEF2FF]"
          >
            Lihat Semua
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 px-5 py-3">
          {filters.map((filter) => {
            const activeClassMap = {
              all: "bg-[#6C8CF5] text-white border-[#6C8CF5]",
              pending: "bg-[#F59E0B] text-white border-[#F59E0B]",
              approved: "bg-[#22C55E] text-white border-[#22C55E]",
              rejected: "bg-[#EF4444] text-white border-[#EF4444]",
            };
            return (
              <button
                key={filter}
                type="button"
                onClick={() => setActiveFilter(filter)}
                className={`rounded-full border px-4 py-2 text-sm font-semibold transition duration-200 ${
                  activeFilter === filter
                    ? activeClassMap[filter]
                    : "border-slate-200 bg-white text-slate-500 hover:bg-[#EEF2FF] hover:text-slate-900"
                }`}
              >
                {filterLabelMap[filter]}
              </button>
            );
          })}
          <div className="ml-auto flex items-center gap-2 rounded-full border border-slate-200 bg-[#f8faff] px-3 py-2 text-sm text-slate-500">
            <Search size={15} />
            <input className="bg-transparent outline-none placeholder:text-slate-400" placeholder="Cari karyawan..." />
          </div>
        </div>
        <table className="min-w-full text-sm">
          <thead className="bg-[#F8FAFF] text-left text-[11px] uppercase tracking-[0.16em] text-slate-500">
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
            {filtered.length === 0 ? (
              <tr>
                <td className="px-4 py-8 text-center text-slate-500" colSpan={8}>
                  Tidak ada pengajuan ditemukan
                </td>
              </tr>
            ) : (
              filtered.map((item, rowIndex) => (
                <tr
                  key={item.id}
                  className={`border-b border-[#edf2ff] transition duration-200 hover:cursor-pointer hover:bg-[#EEF2FF66] ${rowIndex % 4 === 1 ? "anim-delay-1" : ""} ${rowIndex % 4 === 2 ? "anim-delay-2" : ""} ${rowIndex % 4 === 3 ? "anim-delay-3" : ""}`}
                  onClick={() => setSelectedRequest(item)}
                >
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
                          className="inline-flex items-center gap-1 rounded-xl border border-[#86efac] bg-[#f0fdf4] px-3 py-1.5 text-xs font-semibold text-[#166534] transition hover:bg-[#22C55E] hover:text-white"
                          onClick={(event) => {
                            event.stopPropagation();
                            approveRequest(item.id);
                          }}
                        >
                          <Check size={14} /> Setujui
                        </button>
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 rounded-xl border border-[#fecaca] bg-[#fef2f2] px-3 py-1.5 text-xs font-semibold text-[#991b1b] transition hover:bg-[#EF4444] hover:text-white"
                          onClick={(event) => {
                            event.stopPropagation();
                            setModalState({ open: true, requestId: item.id });
                          }}
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
        <div className="flex items-center justify-between border-t border-slate-200 px-5 py-3 text-xs text-slate-500">
          <p>
            Menampilkan <span className="font-semibold text-slate-900">{filtered.length}</span> dari{" "}
            <span className="font-semibold text-slate-900">{requests.length}</span> data
          </p>
          <div className="flex items-center gap-2">
            <button type="button" className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-[#EEF2FF]">
              Sebelumnya
            </button>
            <button type="button" className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-[#EEF2FF]">
              Berikutnya
            </button>
          </div>
        </div>
      </div>

      {selectedRequest ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-[rgba(15,23,42,0.4)] backdrop-blur-[4px] p-4">
          <div className="relative w-full max-w-[420px] rounded-2xl bg-white p-8 shadow-[0_8px_40px_rgba(0,0,0,0.15)] transition duration-200 animate-[fadeIn_0.2s_ease]">
            <button
              type="button"
              onClick={() => setSelectedRequest(null)}
              className="absolute right-4 top-4 rounded-lg p-1 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
            >
              <XIcon size={18} />
            </button>

            <div className="mb-5 flex items-center gap-3">
              <div
                className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${getAvatarGradientClass(
                  selectedRequest.employee_name,
                )} text-sm font-bold text-white`}
              >
                {getInitials(selectedRequest.employee_name)}
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 [font-family:Outfit,Plus_Jakarta_Sans,sans-serif]">
                  {selectedRequest.employee_name}
                </h3>
                <p className="text-sm text-slate-500">{selectedRequest.employee_division}</p>
              </div>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-slate-500">Jenis Cuti</span>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getLeaveTypeTagClass(selectedRequest.leave_type)}`}>
                  {getLeaveTypeLabel(selectedRequest.leave_type)}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-slate-500">Tanggal Mulai</span>
                <span className="font-semibold text-slate-900">{formatDate(selectedRequest.start_date)}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-slate-500">Tanggal Selesai</span>
                <span className="font-semibold text-slate-900">{formatDate(selectedRequest.end_date)}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-slate-500">Durasi</span>
                <span className="font-semibold text-slate-900">{Number(selectedRequest.duration || 0)} hari</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-slate-500">Status</span>
                <StatusBadge status={selectedRequest.status} />
              </div>
              <div className="pt-2">
                <p className="mb-1 text-slate-500">Alasan</p>
                <p className="rounded-xl bg-slate-50 p-3 text-slate-700">{selectedRequest.reason || "-"}</p>
              </div>
              <div>
                <p className="mb-1 text-slate-500">Dokumen Pendukung</p>
                {(() => {
                  const supportingDocumentUrl = getSupportingDocumentUrl(selectedRequest.file_url);
                  if (!supportingDocumentUrl) {
                    return <p className="rounded-xl bg-slate-50 p-3 text-slate-700">-</p>;
                  }
                  return (
                  <a
                    href={supportingDocumentUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center rounded-xl border border-[#c7d2fe] bg-[#eef2ff] px-3 py-2 text-sm font-semibold text-[#4f46e5] transition hover:bg-[#dbeafe]"
                  >
                    Lihat / Unduh Dokumen
                  </a>
                  );
                })()}
              </div>
              <div>
                <p className="mb-1 text-slate-500">Catatan Admin</p>
                <p className="rounded-xl bg-slate-50 p-3 text-slate-700">{selectedRequest.admin_notes || "-"}</p>
              </div>
            </div>

            {selectedRequest.status === "pending" ? (
              <div className="mt-5 flex gap-2">
                <button
                  type="button"
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#22C55E] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#16a34a]"
                  onClick={async () => {
                    await approveRequest(selectedRequest.id);
                    setSelectedRequest((prev) => (prev ? { ...prev, status: "approved", admin_notes: "" } : prev));
                  }}
                >
                  <Check size={15} />
                  Approve
                </button>
                <button
                  type="button"
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#EF4444] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#dc2626]"
                  onClick={() => setModalState({ open: true, requestId: selectedRequest.id })}
                >
                  <X size={15} />
                  Reject
                </button>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      <RejectModal
        open={modalState.open}
        loading={loadingReject}
        onClose={() => setModalState({ open: false, requestId: null })}
        onConfirm={rejectRequest}
      />
    </section>
  );
};

export default AllRequestsPage;
