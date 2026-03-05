export const leaveTypeOptions = [
  { value: "annual", label: "Cuti Tahunan" },
  { value: "sick", label: "Cuti Sakit" },
  { value: "special", label: "Cuti Khusus" },
];

export const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  const months = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
  ];
  const day = String(date.getDate()).padStart(2, "0");
  return `${day} ${months[date.getMonth()]} ${date.getFullYear()}`;
};

export const getLeaveTypeLabel = (value) =>
  leaveTypeOptions.find((item) => item.value === value)?.label || value;

export const getInitials = (name = "") =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "U";

export const calculateDuration = (startDate, endDate) => {
  if (!startDate || !endDate) return 0;
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0;
  return Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;
};

export const formatDuration = (value) => `${Number(value || 0)} hari`;

const avatarThemes = [
  "from-[#60a5fa] to-[#3b82f6]",
  "from-[#34d399] to-[#059669]",
  "from-[#f472b6] to-[#db2777]",
  "from-[#f59e0b] to-[#d97706]",
  "from-[#a78bfa] to-[#7c3aed]",
  "from-[#22d3ee] to-[#0891b2]",
];

export const getAvatarGradientClass = (name = "") => {
  const hash = name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return avatarThemes[hash % avatarThemes.length];
};

export const getLeaveTypeTagClass = (type = "") => {
  const normalized = type.toLowerCase();
  if (normalized === "sick") return "bg-pendingBg text-[#92400e]";
  if (normalized === "special") return "bg-[#ede9fe] text-[#6d28d9]";
  return "bg-primary-soft text-primary";
};
