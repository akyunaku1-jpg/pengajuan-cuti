import { useMemo, useState } from "react";
import { ChevronDown, ClipboardPenLine, CloudUpload, Lock, Send } from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../../lib/api";
import { calculateDuration, leaveTypeOptions } from "../../lib/helpers";
import { useAuth } from "../../context/AuthContext";

const RequestFormPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    leave_type: "",
    start_date: "",
    end_date: "",
    reason: "",
    file: null,
  });
  const [errors, setErrors] = useState({});

  const duration = useMemo(
    () => Math.max(0, calculateDuration(form.start_date, form.end_date)),
    [form.start_date, form.end_date],
  );

  const fieldClass =
    "w-full rounded-[10px] border-[1.5px] border-[#E2E8F0] bg-[#F8FAFF] px-[14px] py-[11px] text-sm text-[#0F172A] transition duration-200 placeholder:text-[#94A3B8] focus:border-[#6C8CF5] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#6c8cf51f]";
  const labelClass = "mb-1.5 block text-[13px] font-semibold text-[#374151]";
  const readOnlyClass =
    "w-full cursor-not-allowed rounded-[10px] border-[1.5px] border-[#E2E8F0] bg-[#F0F4FF] px-[14px] py-[11px] pr-10 text-sm text-[#64748B]";

  const validate = () => {
    const next = {};
    if (!form.leave_type) next.leave_type = "Kolom ini wajib diisi";
    if (!form.start_date) next.start_date = "Kolom ini wajib diisi";
    if (!form.end_date) next.end_date = "Kolom ini wajib diisi";
    if (!form.reason.trim()) next.reason = "Kolom ini wajib diisi";
    if (duration <= 0) next.duration = "Tanggal selesai harus setelah tanggal mulai";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const payload = new FormData();
      payload.append("leave_type", form.leave_type);
      payload.append("start_date", form.start_date);
      payload.append("end_date", form.end_date);
      payload.append("reason", form.reason.trim());
      if (form.file) payload.append("file", form.file);
      await api.post("/requests", payload);
      toast.success("Pengajuan berhasil dikirim! Status: Pending");
      navigate("/history");
    } catch (error) {
      toast.error(error.response?.data?.message || "Gagal mengirim pengajuan.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mx-auto max-w-[660px] pt-9">
      <div className="rounded-2xl bg-white p-10 shadow-[0_4px_32px_rgba(108,140,245,0.12)]">
        <div className="flex items-center gap-4">
          <div className="flex h-[46px] w-[46px] items-center justify-center rounded-xl bg-gradient-to-br from-[#6C8CF5] to-[#8B5CF6]">
            <ClipboardPenLine size={21} className="text-white" />
          </div>
          <div>
            <h2 className="font-heading text-[20px] font-extrabold text-[#0F172A]">Ajukan Cuti</h2>
            <p className="text-[13px] text-[#64748B]">Lengkapi formulir berikut untuk mengajukan cuti</p>
          </div>
        </div>

        <div className="my-6 border-b-[1.5px] border-[#E2E8F0]" />

        <form onSubmit={submit} className="space-y-5">
        <div>
          <label className={labelClass}>Nama Lengkap</label>
          <div className="relative">
            <input readOnly value={user?.name || ""} className={readOnlyClass} />
            <Lock size={14} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
          </div>
        </div>
        <div>
          <label className={labelClass}>Divisi</label>
          <div className="relative">
            <input readOnly value={user?.division || "-"} className={readOnlyClass} />
            <Lock size={14} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
          </div>
        </div>
        <div>
          <label className={labelClass}>Jenis Cuti</label>
          <div className="relative">
            <select
              value={form.leave_type}
              onChange={(e) => setForm((prev) => ({ ...prev, leave_type: e.target.value }))}
              className={`${fieldClass} appearance-none pr-10`}
            >
              <option value="">Pilih jenis cuti</option>
              {leaveTypeOptions.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
            <ChevronDown size={16} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
          </div>
          {errors.leave_type && <p className="mt-1 text-xs text-rejected">{errors.leave_type}</p>}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className={labelClass}>Tanggal Mulai</label>
            <input
              type="date"
              value={form.start_date}
              onChange={(e) => setForm((prev) => ({ ...prev, start_date: e.target.value }))}
              className={fieldClass}
            />
            {errors.start_date && <p className="mt-1 text-xs text-rejected">{errors.start_date}</p>}
          </div>
          <div>
            <label className={labelClass}>Tanggal Selesai</label>
            <input
              type="date"
              value={form.end_date}
              onChange={(e) => setForm((prev) => ({ ...prev, end_date: e.target.value }))}
              className={fieldClass}
            />
            {errors.end_date && <p className="mt-1 text-xs text-rejected">{errors.end_date}</p>}
          </div>
        </div>
        <div>
          <label className={labelClass}>Durasi (hari)</label>
          <input
            readOnly
            value={duration}
            className={readOnlyClass}
          />
          <p className="mt-[5px] text-[11px] text-[#94A3B8]">Dihitung otomatis berdasarkan tanggal yang dipilih</p>
          {errors.duration && <p className="mt-1 text-xs text-rejected">{errors.duration}</p>}
        </div>
        <div>
          <label className={labelClass}>Alasan</label>
          <textarea
            value={form.reason}
            onChange={(e) => setForm((prev) => ({ ...prev, reason: e.target.value }))}
            className={`${fieldClass} min-h-[100px] resize-y`}
          />
          {errors.reason && <p className="mt-1 text-xs text-rejected">{errors.reason}</p>}
        </div>
        <div>
          <label className={labelClass}>Dokumen Pendukung (opsional)</label>
          <label className="block cursor-pointer rounded-xl border-2 border-dashed border-[#C7D2FE] bg-[#F8FAFF] px-5 py-8 text-center transition duration-200 hover:border-[#6C8CF5] hover:bg-[#EEF2FF]">
            <CloudUpload size={36} className="mx-auto text-[#6C8CF5]" />
            <p className="mt-[10px] text-[13px] font-semibold text-[#1E293B]">Klik untuk unggah atau seret file ke sini</p>
            <p className="mt-1 text-xs text-[#94A3B8]">PDF, JPG, PNG — Maks. 5MB</p>
            {form.file ? <p className="mt-2 text-xs font-semibold text-[#6C8CF5]">{form.file.name}</p> : null}
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              className="hidden"
              onChange={(e) => setForm((prev) => ({ ...prev, file: e.target.files?.[0] || null }))}
            />
          </label>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-[10px] border-0 bg-gradient-to-br from-[#6C8CF5] to-[#5A78E3] p-[13px] font-heading text-[15px] font-bold text-white shadow-[0_4px_16px_rgba(108,140,245,0.35)] transition duration-200 hover:-translate-y-[1px] hover:from-[#5A78E3] hover:to-[#4A68D3] hover:shadow-[0_6px_20px_rgba(108,140,245,0.45)] active:translate-y-0 disabled:opacity-70"
        >
          <Send size={16} />
          {loading ? "Memproses..." : "Kirim Pengajuan"}
        </button>
      </form>
      </div>
    </section>
  );
};

export default RequestFormPage;
