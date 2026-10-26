const labels = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
  cancelled: "Cancelled",
  present: "Present",
  "half-day": "Half day",
  absent: "Absent",
  leave: "On leave",
  assigned: "Assigned",
  "in-progress": "In progress",
  completed: "Completed",
  active: "Active",
  inactive: "Inactive",
};

export default function StatusBadge({ status }) {
  return <span className={`status status-${status}`}>{labels[status] || status}</span>;
}
