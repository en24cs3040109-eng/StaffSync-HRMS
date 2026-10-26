import { useState } from "react";
import { Form, Table } from "react-bootstrap";
import useApi from "../../hooks/useApi";
import { fmtDate, fmtTime, isoMonth } from "../../utils/format";
import TodayPanel from "../common/TodayPanel";
import StatusBadge from "../common/StatusBadge";
import EmptyState from "../common/EmptyState";
import Loading from "../common/Loading";

export default function Attendance() {
  const [month, setMonth] = useState(isoMonth());
  const { data, loading, error, reload } = useApi(`/attendance/my?month=${month}`, []);

  const present = data.filter((r) => r.status === "present").length;
  const half = data.filter((r) => r.status === "half-day").length;
  const hours = data.reduce((s, r) => s + (r.workHours || 0), 0);

  return (
    <div className="stack">
      <TodayPanel onChange={reload} />

      <dl className="stats">
        <div className="stat"><dt>Days present</dt><dd>{present}</dd></div>
        <div className="stat"><dt>Half days</dt><dd>{half}</dd></div>
        <div className="stat"><dt>Hours logged</dt><dd>{hours.toFixed(1)}<small>h</small></dd></div>
      </dl>

      <section className="panel panel-flush">
        <div className="panel-bar">
          <h3 className="me-auto">Attendance history</h3>
          <Form.Control type="month" size="sm" className="w-auto" aria-label="Month" value={month} max={isoMonth()} onChange={(e) => setMonth(e.target.value || isoMonth())} />
        </div>
        {loading ? (
          <Loading />
        ) : error ? (
          <p className="text-danger p-3">{error}</p>
        ) : data.length === 0 ? (
          <EmptyState icon="calendar3" title="No attendance this month">Days you check in will be listed here.</EmptyState>
        ) : (
          <div className="table-wrap">
            <Table className="data-table">
              <thead>
                <tr><th>Date</th><th>Checked in</th><th>Checked out</th><th className="num">Hours</th><th>Status</th></tr>
              </thead>
              <tbody>
                {data.map((r) => (
                  <tr key={r._id}>
                    <td className="nowrap">{fmtDate(r.date, { weekday: "short" })}</td>
                    <td>{fmtTime(r.checkIn)}</td>
                    <td>{fmtTime(r.checkOut)}</td>
                    <td className="num">{r.workHours ? r.workHours.toFixed(1) : "—"}</td>
                    <td><StatusBadge status={r.status} />{r.note && <span className="sub">{r.note}</span>}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        )}
      </section>
    </div>
  );
}
