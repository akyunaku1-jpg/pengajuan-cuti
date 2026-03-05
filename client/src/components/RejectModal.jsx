import { useState } from "react";

const RejectModal = ({ open, onClose, onConfirm, loading }) => {
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  if (!open) return null;

  const submit = () => {
    if (!notes.trim()) {
      setError("Kolom ini wajib diisi");
      return;
    }
    setError("");
    onConfirm(notes.trim());
    setNotes("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0f172a80] px-4 backdrop-blur-sm">
      <div className="app-card w-full max-w-md p-6">
        <h3 className="mb-2 text-lg font-bold">Tolak Pengajuan</h3>
        <p className="mb-4 text-sm text-mutedText">Berikan alasan penolakan pengajuan ini.</p>
        <label className="mb-1 block text-sm font-semibold">Catatan Admin</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="app-input min-h-[120px]"
          placeholder="Tulis catatan..."
        />
        {error && <p className="mt-2 text-xs text-rejected">{error}</p>}
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            className="app-button-outline"
            onClick={onClose}
            disabled={loading}
          >
            Batal
          </button>
          <button
            type="button"
            className="app-button bg-rejected text-white hover:bg-[#dc2626]"
            onClick={submit}
            disabled={loading}
          >
            {loading ? "Memproses..." : "Konfirmasi Tolak"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RejectModal;
