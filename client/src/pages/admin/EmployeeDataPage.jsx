import { useEffect, useState } from "react";
import api from "../../lib/api";
import { Search } from "lucide-react";
import { formatDate, getAvatarGradientClass, getInitials } from "../../lib/helpers";

const EmployeeDataPage = () => {
  const [employees, setEmployees] = useState([]);

  useEffect(() => {
    const load = async () => {
      const { data } = await api.get("/employees");
      setEmployees(data.employees);
    };
    load();
  }, []);

  return (
    <section className="space-y-4">
      <div>
        <h1 className="font-heading text-2xl font-bold">Data Karyawan</h1>
        <p className="text-sm text-mutedText">Semua karyawan yang terdaftar di sistem.</p>
      </div>
      <div className="fade-up table-wrap">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h2 className="font-heading text-lg font-bold">Daftar Karyawan</h2>
          <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-[#f8faff] px-3 py-2 text-sm text-mutedText">
            <Search size={15} />
            <input className="bg-transparent outline-none placeholder:text-muted-text-light" placeholder="Cari karyawan..." />
          </div>
        </div>
        <table className="min-w-full text-sm">
          <thead className="table-head">
            <tr>
              <th className="px-4 py-3">Karyawan</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Divisi</th>
              <th className="px-4 py-3">Jabatan</th>
              <th className="px-4 py-3">Bergabung</th>
            </tr>
          </thead>
          <tbody>
            {employees.length === 0 ? (
              <tr>
                <td className="px-4 py-8 text-center text-mutedText" colSpan={5}>
                  Tidak ada data tersedia
                </td>
              </tr>
            ) : (
              employees.map((employee, rowIndex) => (
                <tr key={employee.id} className={`table-row fade-up ${rowIndex % 4 === 1 ? "anim-delay-1" : ""} ${rowIndex % 4 === 2 ? "anim-delay-2" : ""} ${rowIndex % 4 === 3 ? "anim-delay-3" : ""}`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br ${getAvatarGradientClass(employee.name)} text-[11px] font-bold text-white`}
                      >
                        {getInitials(employee.name)}
                      </div>
                      <p className="font-semibold text-mainText">{employee.name}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">{employee.email}</td>
                  <td className="px-4 py-3">{employee.division}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary">
                      {employee.role === "admin" ? "Admin" : "Karyawan"}
                    </span>
                  </td>
                  <td className="px-4 py-3">{formatDate(employee.created_at)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <div className="flex items-center justify-between border-t border-slate-200 px-5 py-3 text-xs text-mutedText">
          <p>
            Menampilkan <span className="font-semibold text-mainText">{employees.length}</span> data karyawan
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

export default EmployeeDataPage;
