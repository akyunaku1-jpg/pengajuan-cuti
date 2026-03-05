import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import api from "../../lib/api";
import { formatDate, getLeaveTypeLabel, getLeaveTypeTagClass } from "../../lib/helpers";
import StatusBadge from "../../components/StatusBadge";

const filters = ["all", "pending", "approved", "rejected"];
const filterLabelMap = {
  all: "Semua",
  pending: "Pending",
  approved: "Disetujui",
  rejected: "Ditolak",
};

const RequestHistoryPage = () => {
  const [activeFilter, setActiveFilter] = useState("all");
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    const load = async () => {
      const { data } = await api.get("/requests");
      setRequests(data.requests);
    };
    load();
  }, []);

  const filtered = useMemo(() => {
    if (activeFilter === "all") return requests;
    return requests.filter((item) => item.status === activeFilter);
  }, [activeFilter, requests]);

  return (
    <section className="space-y-4">
      <div>
        <h1 className="font-heading text-2xl font-bold">Riwayat Pengajuan</h1>
        <p className="text-sm text-mutedText">Semua pengajuan cuti dan izin Anda.</p>
      </div>

      <div className="fade-up table-wrap">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h2 className="font-heading text-lg font-bold">Data Pengajuan</h2>
          <button type="button" className="app-button-outline py-2 text-xs">
            Lihat Semua
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 px-5 py-3">
          {filters.map((filter) => {
            const activeClassMap = {
              all: "bg-primary text-white border-primary",
              pending: "bg-pending text-white border-pending",
              approved: "bg-approved text-white border-approved",
              rejected: "bg-rejected text-white border-rejected",
            };
            return (
              <button
                key={filter}
                type="button"
                onClick={() => setActiveFilter(filter)}
                className={`rounded-full border px-4 py-2 text-sm font-semibold transition duration-200 ${
                  activeFilter === filter
                    ? activeClassMap[filter]
                    : "border-slate-200 bg-white text-mutedText hover:bg-primary-soft hover:text-mainText"
                }`}
              >
                {filterLabelMap[filter]}
              </button>
            );
          })}
          <div className="ml-auto flex items-center gap-2 rounded-full border border-slate-200 bg-[#f8faff] px-3 py-2 text-sm text-mutedText">
            <Search size={15} />
            <input className="bg-transparent outline-none placeholder:text-muted-text-light" placeholder="Cari karyawan..." />
          </div>
        </div>

        <table className="min-w-full text-sm">
          <thead className="table-head">
            <tr>
              <th className="px-4 py-3">Tanggal Pengajuan</th>
              <th className="px-4 py-3">Jenis Cuti</th>
              <th className="px-4 py-3">Tanggal Mulai</th>
              <th className="px-4 py-3">Tanggal Selesai</th>
              <th className="px-4 py-3">Durasi</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Catatan Admin</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td className="px-4 py-8 text-center text-mutedText" colSpan={7}>
                  Tidak ada pengajuan ditemukan
                </td>
              </tr>
            ) : (
              filtered.map((item) => (
                <tr key={item.id} className="table-row fade-up">
                  <td className="px-4 py-3">{formatDate(item.created_at)}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getLeaveTypeTagClass(item.leave_type)}`}>
                      {getLeaveTypeLabel(item.leave_type)}
                    </span>
                  </td>
                  <td className="px-4 py-3">{formatDate(item.start_date)}</td>
                  <td className="px-4 py-3">{formatDate(item.end_date)}</td>
                  <td className="px-4 py-3">
                    <span className="font-semibold text-mainText">{Number(item.duration || 0)}</span>{" "}
                    <span className="text-mutedText">hari</span>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={item.status} />
                  </td>
                  <td className="px-4 py-3">{item.admin_notes || "-"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <div className="flex items-center justify-between border-t border-slate-200 px-5 py-3 text-xs text-mutedText">
          <p>
            Menampilkan <span className="font-semibold text-mainText">{filtered.length}</span> dari{" "}
            <span className="font-semibold text-mainText">{requests.length}</span> data
          </p>
          <div className="flex items-center gap-2">
            <button type="button" className="app-button-outline px-3 py-1.5 text-xs">
              Sebelumnya
            </button>
            <button type="button" className="app-button-outline px-3 py-1.5 text-xs">
              Berikutnya
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default RequestHistoryPage;
