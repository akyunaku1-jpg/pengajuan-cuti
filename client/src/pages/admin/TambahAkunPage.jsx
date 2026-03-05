import { useState } from "react";
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
    <section className="space-y-4">
      <h1 className="font-heading text-2xl font-bold">Tambah Akun</h1>
      <form className="fade-up mx-auto max-w-[600px] space-y-4 app-card p-6" onSubmit={submit}>
        <div>
          <label className="mb-1 block text-sm font-semibold">Nama Lengkap</label>
          <input
            className="app-input"
            value={form.name}
            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
          />
          {errors.name && <p className="mt-1 text-xs text-rejected">{errors.name}</p>}
        </div>

        <div>
          <label className="mb-1 block text-sm font-semibold">Email</label>
          <input
            type="email"
            className="app-input"
            value={form.email}
            onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
          />
          {errors.email && <p className="mt-1 text-xs text-rejected">{errors.email}</p>}
        </div>

        <div>
          <label className="mb-1 block text-sm font-semibold">Password</label>
          <input
            type="password"
            className="app-input"
            value={form.password}
            onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
          />
          {errors.password && <p className="mt-1 text-xs text-rejected">{errors.password}</p>}
        </div>

        <div>
          <label className="mb-1 block text-sm font-semibold">Konfirmasi Password</label>
          <input
            type="password"
            className="app-input"
            value={form.confirmPassword}
            onChange={(e) => setForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
          />
          {errors.confirmPassword && <p className="mt-1 text-xs text-rejected">{errors.confirmPassword}</p>}
        </div>

        <div>
          <label className="mb-1 block text-sm font-semibold">Divisi</label>
          <input
            className="app-input"
            value={form.division}
            onChange={(e) => setForm((prev) => ({ ...prev, division: e.target.value }))}
          />
          {errors.division && <p className="mt-1 text-xs text-rejected">{errors.division}</p>}
        </div>

        <div>
          <label className="mb-1 block text-sm font-semibold">Jabatan</label>
          <select
            className="app-input"
            value={form.role}
            onChange={(e) => setForm((prev) => ({ ...prev, role: e.target.value }))}
          >
            <option value="employee">Karyawan</option>
            <option value="admin">Admin</option>
          </select>
          {errors.role && <p className="mt-1 text-xs text-rejected">{errors.role}</p>}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="app-button-primary font-heading w-full font-bold shadow-[0_10px_24px_rgba(108,140,245,0.28)] hover:shadow-primary-lift disabled:opacity-70"
        >
          {loading ? "Memproses..." : "Buat Akun"}
        </button>
      </form>
    </section>
  );
};

export default TambahAkunPage;
