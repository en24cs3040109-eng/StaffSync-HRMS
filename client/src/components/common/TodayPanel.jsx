import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import api, { errMsg } from "../../api/axios";
import useApi from "../../hooks/useApi";
import { fmtTime } from "../../utils/format";

const TARGET_HOURS = 8;

// The day at a glance: date, check-in state and hours worked so far
export default function TodayPanel({ onChange, children }) {
  const { data: record, setData, loading } = useApi("/attendance/today");
  const [busy, setBusy] = useState(false);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  const act = async (kind) => {
    setBusy(true);
    try {
      const { data } = await api.post(`/attendance/${kind}`);
      setData(data);
      toast.success(kind === "check-in" ? "Checked in" : "Checked out");
      onChange?.();
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  const checkedIn = Boolean(record?.checkIn);
  const checkedOut = Boolean(record?.checkOut);
  const hours = checkedOut
    ? record.workHours
    : checkedIn
      ? Math.max(0, (now - new Date(record.checkIn)) / 36e5)
      : 0;
  const pct = Math.min(100, (hours / TARGET_HOURS) * 100);

  let status = "You haven't checked in yet.";
  if (checkedIn && !checkedOut) status = `Checked in at ${fmtTime(record.checkIn)}.`;
  if (checkedOut) status = `Done for the day. ${fmtTime(record.checkIn)} to ${fmtTime(record.checkOut)}.`;

  return (
    <section className="today" aria-label="Today">
      <div className="today-date">
        <span className="today-weekday">{now.toLocaleDateString("en-IN", { weekday: "long" })}</span>
        <span className="today-day">{now.toLocaleDateString("en-IN", { day: "numeric", month: "long" })}</span>
      </div>

      <div className="today-work">
        <p className="today-status">{loading ? "Checking today's attendance…" : status}</p>
        <div className="hours" aria-label={`${hours.toFixed(1)} of ${TARGET_HOURS} hours`}>
          <div className="hours-track">
            <div className={`hours-fill ${checkedOut ? "done" : ""}`} style={{ width: `${pct}%` }} />
          </div>
          <span className="hours-label">
            <strong>{hours.toFixed(1)} h</strong> of {TARGET_HOURS} h
          </span>
        </div>
        {!loading && !checkedOut && (
          <button
            type="button"
            className={`btn ${checkedIn ? "btn-outline-light" : "btn-checkin"}`}
            disabled={busy}
            onClick={() => act(checkedIn ? "check-out" : "check-in")}
          >
            <i className={`bi bi-${checkedIn ? "box-arrow-right" : "fingerprint"} me-2`} aria-hidden="true" />
            {checkedIn ? "Check out" : "Check in"}
          </button>
        )}
      </div>

      {children && <div className="today-extra">{children}</div>}
    </section>
  );
}
