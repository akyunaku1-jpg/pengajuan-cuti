import { useState } from "react";
import { ClipboardList, Eye, EyeOff } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import api from "../lib/api";

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetStep, setResetStep] = useState("email");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetForm, setResetForm] = useState({
    email: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [resetErrors, setResetErrors] = useState({});

  const validate = () => {
    const next = {};
    if (!form.email) next.email = "Kolom ini wajib diisi";
    if (!form.password) next.password = "Kolom ini wajib diisi";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      toast.success("Berhasil masuk.");
      navigate(user.role === "admin" ? "/admin/dashboard" : "/dashboard", { replace: true });
    } catch (error) {
      toast.error(error.response?.data?.message || "Email atau kata sandi tidak valid.");
    } finally {
      setLoading(false);
    }
  };

  const closeResetModal = () => {
    setShowResetModal(false);
    setResetStep("email");
    setResetLoading(false);
    setResetErrors({});
    setResetForm({ email: "", newPassword: "", confirmPassword: "" });
  };

  const submitResetEmail = async (e) => {
    e.preventDefault();
    const next = {};
    if (!resetForm.email.trim()) next.email = "Kolom ini wajib diisi";
    setResetErrors(next);
    if (Object.keys(next).length > 0) return;

    setResetLoading(true);
    try {
      await api.post("/auth/reset-password", {
        email: resetForm.email,
        verifyOnly: true,
      });
      setResetStep("password");
      setResetErrors({});
    } catch (error) {
      const message = error.response?.data?.message || "Gagal memverifikasi email.";
      setResetErrors({ email: message });
    } finally {
      setResetLoading(false);
    }
  };

  const submitResetPassword = async (e) => {
    e.preventDefault();
    const next = {};
    const email = resetForm.email.trim().toLowerCase();
    const newPassword = resetForm.newPassword;
    const confirmPassword = resetForm.confirmPassword;

    if (!newPassword) next.newPassword = "Kolom ini wajib diisi";
    if (newPassword && newPassword.length < 8) next.newPassword = "Minimal 8 karakter";
    if (!confirmPassword) next.confirmPassword = "Kolom ini wajib diisi";
    if (newPassword && confirmPassword && newPassword !== confirmPassword) {
      next.confirmPassword = "Konfirmasi kata sandi tidak sama";
    }
    setResetErrors(next);
    if (Object.keys(next).length > 0) return;

    setResetLoading(true);
    try {
      await api.post("/auth/reset-password", { email, newPassword });
      toast.success("Kata sandi berhasil direset. Silakan login.");
      closeResetModal();
    } catch (error) {
      const message = error.response?.data?.message || "Gagal mereset kata sandi.";
      if (message.toLowerCase().includes("email")) {
        setResetStep("email");
        setResetErrors({ email: message });
      } else {
        setResetErrors({ newPassword: message });
      }
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[linear-gradient(135deg,#EEF2FF_0%,#F0F4FF_50%,#E8EDFF_100%)] px-4">
      <span className="pointer-events-none absolute -right-28 -top-24 h-[400px] w-[400px] rounded-full bg-[radial-gradient(circle,rgba(108,140,245,0.2)_0%,transparent_70%)] blur-[60px]" />
      <span className="pointer-events-none absolute -bottom-24 -left-24 h-[400px] w-[400px] rounded-full bg-[radial-gradient(circle,rgba(139,92,246,0.15)_0%,transparent_70%)] blur-[60px]" />

      <div className="relative z-10 w-full max-w-[420px] rounded-[20px] border border-[rgba(108,140,245,0.15)] bg-white px-11 py-12 shadow-[0_20px_60px_rgba(108,140,245,0.15),0_4px_16px_rgba(0,0,0,0.06)]">
        <div className="mx-auto flex h-[52px] w-[52px] items-center justify-center rounded-[14px] bg-gradient-to-br from-[#6C8CF5] to-[#8B5CF6] text-white shadow-[0_6px_20px_rgba(108,140,245,0.35)]">
          <ClipboardList size={26} />
        </div>
        <h1 className="mt-5 text-center text-[20px] font-extrabold leading-[1.3] text-[#0F172A] [font-family:Outfit,Plus_Jakarta_Sans,sans-serif]">
          Sistem Pengajuan Cuti & Izin Karyawan
        </h1>
        <p className="mb-8 mt-1.5 text-center text-[13px] text-[#64748B]">Masuk untuk mengakses dashboard Anda</p>

        <form className="space-y-[18px]" onSubmit={submit}>
          <div>
            <label className="mb-1.5 block text-[13px] font-semibold text-[#374151]">Email atau NIP</label>
            <input
              type="text"
              value={form.email}
              onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
              className="w-full rounded-[10px] border-[1.5px] border-[#E2E8F0] bg-[#F8FAFF] px-[14px] py-3 text-sm text-[#0F172A] transition duration-200 focus:border-[#6C8CF5] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#6c8cf51f]"
              placeholder="admin@company.com"
            />
            {errors.email && <p className="mt-1 text-xs text-rejected">{errors.email}</p>}
          </div>
          <div>
            <label className="mb-1.5 block text-[13px] font-semibold text-[#374151]">Kata Sandi</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
                className="w-full rounded-[10px] border-[1.5px] border-[#E2E8F0] bg-[#F8FAFF] px-[14px] py-3 pr-11 text-sm text-[#0F172A] transition duration-200 focus:border-[#6C8CF5] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#6c8cf51f]"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-700"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && <p className="mt-1 text-xs text-rejected">{errors.password}</p>}
          </div>

          <button
            type="submit"
            className="mt-6 w-full rounded-[10px] bg-gradient-to-br from-[#6C8CF5] to-[#5A78E3] py-[13px] text-[15px] font-bold text-white shadow-[0_4px_16px_rgba(108,140,245,0.35)] transition duration-200 hover:-translate-y-[1px] hover:from-[#5A78E3] hover:to-[#4A68D3] hover:shadow-[0_6px_20px_rgba(108,140,245,0.45)] disabled:opacity-70 [font-family:Outfit,Plus_Jakarta_Sans,sans-serif]"
            disabled={loading}
          >
            {loading ? "Memproses..." : "Masuk"}
          </button>
        </form>

        <div className="mt-[18px] text-center">
          <Link
            className="text-[13px] text-[#6C8CF5] hover:underline"
            to="#"
            onClick={(e) => {
              e.preventDefault();
              setShowResetModal(true);
            }}
          >
            Lupa Kata Sandi?
          </Link>
        </div>
      </div>

      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-slate-800">Reset Kata Sandi</h2>
            {resetStep === "email" ? (
              <form className="mt-4 space-y-4" onSubmit={submitResetEmail}>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">Email</label>
                  <input
                    type="email"
                    value={resetForm.email}
                    onChange={(e) => setResetForm((prev) => ({ ...prev, email: e.target.value }))}
                    className="w-full rounded-[10px] border-[1.5px] border-[#E2E8F0] bg-[#F8FAFF] px-[14px] py-3 text-sm text-[#0F172A] focus:border-[#6C8CF5] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#6c8cf51f]"
                    placeholder="admin@company.com"
                  />
                  {resetErrors.email && <p className="mt-1 text-xs text-rejected">{resetErrors.email}</p>}
                </div>
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={closeResetModal}
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={resetLoading}
                    className="rounded-lg bg-[#6C8CF5] px-3 py-2 text-sm font-semibold text-white hover:bg-[#5A78E3] disabled:opacity-70"
                  >
                    {resetLoading ? "Memproses..." : "Lanjut"}
                  </button>
                </div>
              </form>
            ) : (
              <form className="mt-4 space-y-4" onSubmit={submitResetPassword}>
                <p className="text-sm text-slate-600">
                  Email terverifikasi: <span className="font-semibold text-slate-800">{resetForm.email}</span>
                </p>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">Kata Sandi Baru</label>
                  <input
                    type="password"
                    value={resetForm.newPassword}
                    onChange={(e) => setResetForm((prev) => ({ ...prev, newPassword: e.target.value }))}
                    className="w-full rounded-[10px] border-[1.5px] border-[#E2E8F0] bg-[#F8FAFF] px-[14px] py-3 text-sm text-[#0F172A] focus:border-[#6C8CF5] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#6c8cf51f]"
                    placeholder="Minimal 8 karakter"
                  />
                  {resetErrors.newPassword && <p className="mt-1 text-xs text-rejected">{resetErrors.newPassword}</p>}
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">Konfirmasi Kata Sandi</label>
                  <input
                    type="password"
                    value={resetForm.confirmPassword}
                    onChange={(e) => setResetForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                    className="w-full rounded-[10px] border-[1.5px] border-[#E2E8F0] bg-[#F8FAFF] px-[14px] py-3 text-sm text-[#0F172A] focus:border-[#6C8CF5] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#6c8cf51f]"
                    placeholder="Ulangi kata sandi baru"
                  />
                  {resetErrors.confirmPassword && (
                    <p className="mt-1 text-xs text-rejected">{resetErrors.confirmPassword}</p>
                  )}
                </div>
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={closeResetModal}
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={resetLoading}
                    className="rounded-lg bg-[#6C8CF5] px-3 py-2 text-sm font-semibold text-white hover:bg-[#5A78E3] disabled:opacity-70"
                  >
                    {resetLoading ? "Memproses..." : "Simpan Kata Sandi"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginPage;
