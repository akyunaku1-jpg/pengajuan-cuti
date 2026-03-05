const statusClassMap = {
  pending: "bg-pendingBg text-[#92400e]",
  approved: "bg-approvedBg text-[#166534]",
  rejected: "bg-rejectedBg text-[#991b1b]",
};

const dotClassMap = {
  pending: "bg-pending",
  approved: "bg-approved",
  rejected: "bg-rejected",
};

const StatusBadge = ({ status }) => {
  const normalized = (status || "pending").toLowerCase();
  const statusLabelMap = {
    pending: "Pending",
    approved: "Disetujui",
    rejected: "Ditolak",
  };
  return (
    <span
      className={`status-badge ${statusClassMap[normalized] || statusClassMap.pending}`}
    >
      <span className={`status-dot ${dotClassMap[normalized] || dotClassMap.pending}`} />
      <span>{statusLabelMap[normalized] || "Pending"}</span>
    </span>
  );
};

export default StatusBadge;
