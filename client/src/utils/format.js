import { API_ORIGIN } from "../api/axios";

// Dates like leave days are stored as midnight UTC, so format them in UTC
export const fmtDate = (d, opts = {}) =>
  d
    ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC", ...opts })
    : "—";

export const fmtShort = (d) => fmtDate(d, { year: undefined });

export const fmtTime = (d) =>
  d ? new Date(d).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true }) : "—";

export const fmtDateTime = (d) =>
  d ? new Date(d).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", hour12: true }) : "";

export const fmtMoney = (n) =>
  n || n === 0 ? new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n) : "—";

export const timeAgo = (d) => {
  const s = Math.floor((Date.now() - new Date(d)) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  if (s < 7 * 86400) return `${Math.floor(s / 86400)} d ago`;
  return fmtDateTime(d);
};

export const fullName = (e) => (e ? `${e.firstName} ${e.lastName}` : "—");
export const initials = (e) => (e ? `${e.firstName?.[0] || ""}${e.lastName?.[0] || ""}`.toUpperCase() : "?");

export const fileUrl = (path) => (path ? `${API_ORIGIN}${path}` : null);

// local calendar date as YYYY-MM-DD (for <input type="date">)
export const isoDay = (d = new Date()) => {
  const x = new Date(d);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`;
};
export const isoMonth = (d = new Date()) => isoDay(d).slice(0, 7);

export const inclusiveDays = (start, end) => {
  if (!start || !end) return 0;
  const n = Math.round((new Date(end) - new Date(start)) / 86400000) + 1;
  return n > 0 ? n : 0;
};

export const roleLabel = { hr: "HR", manager: "Manager", employee: "Employee" };
export const leaveTypeLabel = { casual: "Casual", sick: "Sick", earned: "Earned", unpaid: "Unpaid" };
export const audienceLabel = { all: "Everyone", department: "Department", employees: "Employees", managers: "Managers" };
