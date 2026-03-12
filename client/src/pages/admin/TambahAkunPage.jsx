import { useState } from "react";
import { Check } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../lib/api";

const initialForm = {
  name: "",
  email: "",
  password: "",
  confirmPassword: "",
  division: "",
  role: "employee",
};

const TambahAkunPage = () => {
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const next = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!form.name.trim()) next.name = "Kolom ini wajib diisi";
    if (!form.email.trim()) next.email = "Kolom ini wajib diisi";
    else if (!emailRegex.test(form.email.trim())) next.email = "Format email tidak valid";
    if (!form.password) next.password = "Kolom ini wajib diisi";
    else if (form.password.length < 8) next.password = "Password minimal 8 karakter";
    if (!form.confirmPassword) next.confirmPassword = "Kolom ini wajib diisi";
    else if (form.confirmPassword !== form.password) next.confirmPassword = "Password tidak cocok";
    if (!form.division.trim()) next.division = "Kolom ini wajib diisi";
    if (!form.role) next.role = "Kolom ini wajib diisi";

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await api.post("/admin/users", {
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        division: form.division.trim(),
        role: form.role,
      });
      toast.success("Akun berhasil dibuat");
      setForm(initialForm);
      setErrors({});
    } catch (error) {
      if (error.response?.status === 409) {
        setErrors((prev) => ({ ...prev, email: "Email sudah digunakan" }));
      } else {
        toast.error(error.response?.data?.message || "Gagal membuat akun.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mx-auto max-w-[860px]">
      <form
        className="mx-auto max-w-[640px] rounded-2xl bg-white p-8 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.04)]"
        onSubmit={submit}
      >
        <h1 className="text-[17px] font-bold text-[#0F172A] [font-family:Outfit,Plus_Jakarta_Sans,sans-serif]">Tambah Akun</h1>
        <p className="mt-1 text-[13px] text-slate-500">Buat akun baru untuk admin atau karyawan</p>
        <div className="my-5 border-b border-slate-200" />

        <div className="space-y-5">
          <div>
            <label className="mb-1.5 block text-[13px] font-semibold text-[#374151]">Nama Lengkap</label>
            <input
              className="w-full rounded-[10px] border-[1.5px] border-[#E2E8F0] bg-[#F8FAFF] px-[14px] py-[11px] text-sm text-[#0F172A] transition duration-200 focus:border-[#6C8CF5] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#6c8cf51f]"
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            />
            {errors.name && <p className="mt-1 text-xs text-rejected">{errors.name}</p>}
          </div>

          <div>
            <label className="mb-1.5 block text-[13px] font-semibold text-[#374151]">Email</label>
            <input
              type="email"
              className="w-full rounded-[10px] border-[1.5px] border-[#E2E8F0] bg-[#F8FAFF] px-[14px] py-[11px] text-sm text-[#0F172A] transition duration-200 focus:border-[#6C8CF5] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#6c8cf51f]"
              value={form.email}
              onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
            />
            {errors.email && <p className="mt-1 text-xs text-rejected">{errors.email}</p>}
          </div>

          <div>
            <label className="mb-1.5 block text-[13px] font-semibold text-[#374151]">Password</label>
            <input
              type="password"
              className="w-full rounded-[10px] border-[1.5px] border-[#E2E8F0] bg-[#F8FAFF] px-[14px] py-[11px] text-sm text-[#0F172A] transition duration-200 focus:border-[#6C8CF5] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#6c8cf51f]"
              value={form.password}
              onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
            />
            {errors.password && <p className="mt-1 text-xs text-rejected">{errors.password}</p>}
          </div>

          <div>
            <label className="mb-1.5 block text-[13px] font-semibold text-[#374151]">Konfirmasi Password</label>
            <input
              type="password"
              className="w-full rounded-[10px] border-[1.5px] border-[#E2E8F0] bg-[#F8FAFF] px-[14px] py-[11px] text-sm text-[#0F172A] transition duration-200 focus:border-[#6C8CF5] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#6c8cf51f]"
              value={form.confirmPassword}
              onChange={(e) => setForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
            />
            {errors.confirmPassword && <p className="mt-1 text-xs text-rejected">{errors.confirmPassword}</p>}
          </div>

          <div>
            <label className="mb-1.5 block text-[13px] font-semibold text-[#374151]">Divisi</label>
            <input
              className="w-full rounded-[10px] border-[1.5px] border-[#E2E8F0] bg-[#F8FAFF] px-[14px] py-[11px] text-sm text-[#0F172A] transition duration-200 focus:border-[#6C8CF5] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#6c8cf51f]"
              value={form.division}
              onChange={(e) => setForm((prev) => ({ ...prev, division: e.target.value }))}
            />
            {errors.division && <p className="mt-1 text-xs text-rejected">{errors.division}</p>}
          </div>

          <div>
            <label className="mb-1.5 block text-[13px] font-semibold text-[#374151]">Jabatan</label>
            <select
              className="w-full rounded-[10px] border-[1.5px] border-[#E2E8F0] bg-[#F8FAFF] px-[14px] py-[11px] text-sm text-[#0F172A] transition duration-200 focus:border-[#6C8CF5] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#6c8cf51f]"
              value={form.role}
              onChange={(e) => setForm((prev) => ({ ...prev, role: e.target.value }))}
            >
              <option value="employee">Karyawan</option>
              <option value="admin">Admin</option>
            </select>
            {errors.role && <p className="mt-1 text-xs text-rejected">{errors.role}</p>}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-[10px] bg-gradient-to-br from-[#6C8CF5] to-[#5A78E3] px-4 py-3 text-[15px] font-bold text-white shadow-[0_4px_16px_rgba(108,140,245,0.35)] transition duration-200 hover:-translate-y-[1px] hover:from-[#5A78E3] hover:to-[#4A68D3] disabled:opacity-70 [font-family:Outfit,Plus_Jakarta_Sans,sans-serif]"
        >
          <Check size={16} />
          {loading ? "Memproses..." : "Buat Akun"}
        </button>
      </form>
    </section>
  );
};

export default TambahAkunPage;
