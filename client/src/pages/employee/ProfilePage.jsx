import { useState } from "react";
import { Building2, Check, Lock, Mail } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";
import api from "../../lib/api";
import { getInitials } from "../../lib/helpers";

const ProfilePage = () => {
  const { user, refreshUser } = useAuth();
  const [form, setForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const next = {};
    if (!form.name.trim()) next.name = "Kolom ini wajib diisi";
    if (!form.email.trim()) next.email = "Kolom ini wajib diisi";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const save = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await api.patch("/auth/me", { name: form.name.trim(), email: form.email.trim() });
      await refreshUser();
      toast.success("Profil berhasil diperbarui");
    } catch (error) {
      toast.error(error.response?.data?.message || "Gagal memperbarui profil.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mx-auto max-w-[860px]">
      <div className="grid gap-5 md:grid-cols-[280px_1fr]">
        <div className="rounded-2xl bg-white p-8 text-center shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.04)]">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-[#6C8CF5] to-[#8B5CF6] text-[28px] font-bold text-white [font-family:Outfit,Plus_Jakarta_Sans,sans-serif]">
            {getInitials(user?.name)}
          </div>
          <h2 className="mt-4 text-lg font-bold text-[#0F172A] [font-family:Outfit,Plus_Jakarta_Sans,sans-serif]">{user?.name}</h2>
          <span className="mt-2 inline-flex rounded-full bg-[#EEF2FF] px-3 py-1 text-xs font-bold text-[#6C8CF5]">
            {user?.role === "admin" ? "ADMIN" : "KARYAWAN"}
          </span>
          <p className="mt-2 text-[13px] text-slate-500">{user?.division || "-"}</p>
          <div className="my-5 border-b border-slate-200" />
          <div className="space-y-3 text-left">
            <div className="flex items-center gap-2.5">
              <Mail size={15} className="text-[#6C8CF5]" />
              <p className="text-[13px] text-slate-700">{user?.email || "-"}</p>
            </div>
            <div className="flex items-center gap-2.5">
              <Building2 size={15} className="text-[#6C8CF5]" />
              <p className="text-[13px] text-slate-700">{user?.division || "-"}</p>
            </div>
          </div>
        </div>

        <form
          onSubmit={save}
          className="rounded-2xl bg-white p-8 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.04)]"
        >
          <h3 className="text-[17px] font-bold text-[#0F172A] [font-family:Outfit,Plus_Jakarta_Sans,sans-serif]">Edit Profil</h3>
          <p className="mt-1 text-[13px] text-slate-500">Perbarui informasi akun Anda</p>
          <div className="my-5 border-b border-slate-200" />

          <div className="space-y-5">
            <div>
              <label className="mb-1.5 block text-[13px] font-semibold text-[#374151]">Nama Lengkap</label>
              <input
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                className="w-full rounded-[10px] border-[1.5px] border-[#E2E8F0] bg-[#F8FAFF] px-[14px] py-[11px] text-sm text-[#0F172A] transition duration-200 focus:border-[#6C8CF5] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#6c8cf51f]"
              />
              {errors.name && <p className="mt-1 text-xs text-rejected">{errors.name}</p>}
            </div>
            <div>
              <label className="mb-1.5 block text-[13px] font-semibold text-[#374151]">Email</label>
              <input
                value={form.email}
                onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                className="w-full rounded-[10px] border-[1.5px] border-[#E2E8F0] bg-[#F8FAFF] px-[14px] py-[11px] text-sm text-[#0F172A] transition duration-200 focus:border-[#6C8CF5] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#6c8cf51f]"
              />
              {errors.email && <p className="mt-1 text-xs text-rejected">{errors.email}</p>}
            </div>
            <div>
              <label className="mb-1.5 block text-[13px] font-semibold text-[#374151]">Divisi</label>
              <div className="relative">
                <input
                  readOnly
                  value={user?.division || "-"}
                  className="w-full cursor-not-allowed rounded-[10px] border-[1.5px] border-[#E2E8F0] bg-[#F0F4FF] px-[14px] py-[11px] pr-10 text-sm text-[#64748B]"
                />
                <Lock size={14} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-[10px] bg-gradient-to-br from-[#6C8CF5] to-[#5A78E3] px-4 py-3 text-[15px] font-bold text-white shadow-[0_4px_16px_rgba(108,140,245,0.35)] transition duration-200 hover:-translate-y-[1px] hover:from-[#5A78E3] hover:to-[#4A68D3] disabled:opacity-70 [font-family:Outfit,Plus_Jakarta_Sans,sans-serif]"
          >
            <Check size={16} />
            {loading ? "Menyimpan..." : "Simpan Perubahan"}
          </button>
        </form>
      </div>
    </section>
  );
};

export default ProfilePage;
