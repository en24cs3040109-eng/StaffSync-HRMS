import { useState } from "react";
import { Form, Table } from "react-bootstrap";
import useApi from "../../hooks/useApi";
import { fmtTime, fullName, isoDay, isoMonth } from "../../utils/format";
import StatusBadge from "../common/StatusBadge";
import EmptyState from "../common/EmptyState";
import Loading from "../common/Loading";
import PageHeader from "../common/PageHeader";

export default function AttendanceSummary() {
  const [month, setMonth] = useState(isoMonth());
  const [day, setDay] = useState(isoDay());
  const report = useApi(`/attendance/report?month=${month}`, []);
  const daily = useApi(`/attendance?from=${day}&to=${day}`, []);

  return (
    <>
      <PageHeader title="Attendance" subtitle="Who came in on a given day, and monthly totals for everyone." />

      <section className="panel panel-flush">
        <div className="panel-bar">
          <h3 className="me-auto">Daily log</h3>
          <Form.Control type="date" size="sm" className="w-auto" aria-label="Day" value={day} max={isoDay()} onChange={(e) => setDay(e.target.value || isoDay())} />
        </div>
        {daily.loading ? (
          <Loading />
        ) : daily.data.length === 0 ? (
          <EmptyState icon="calendar-x" title="No check-ins on this day">Pick another date, or wait for people to check in.</EmptyState>
        ) : (
          <div className="table-wrap">
            <Table className="data-table">
              <thead><tr><th>Employee</th><th>Department</th><th>Checked in</th><th>Checked out</th><th className="num">Hours</th><th>Status</th></tr></thead>
              <tbody>
                {daily.data.map((r) => (
                  <tr key={r._id}>
                    <td><strong>{fullName(r.employee)}</strong><span className="sub">{r.employee?.employeeId}</span></td>
                    <td>{r.employee?.department?.name || "—"}</td>
                    <td>{fmtTime(r.checkIn)}</td>
                    <td>{fmtTime(r.checkOut)}</td>
                    <td className="num">{r.workHours ? r.workHours.toFixed(1) : "—"}</td>
                    <td><StatusBadge status={r.status} /></td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        )}
      </section>

      <section className="panel panel-flush section-gap">
        <div className="panel-bar">
          <h3 className="me-auto">Monthly summary</h3>
          <Form.Control type="month" size="sm" className="w-auto" aria-label="Month" value={month} max={isoMonth()} onChange={(e) => setMonth(e.target.value || isoMonth())} />
        </div>
        {report.loading ? (
          <Loading />
        ) : report.data.length === 0 ? (
          <EmptyState icon="bar-chart" title="No attendance recorded this month" />
        ) : (
          <div className="table-wrap">
            <Table className="data-table">
              <thead><tr><th>Employee</th><th>Department</th><th className="num">Present</th><th className="num">Half days</th><th className="num">Absent</th><th className="num">On leave</th><th className="num">Hours</th></tr></thead>
              <tbody>
                {report.data.map((r) => (
                  <tr key={r.employee}>
                    <td><strong>{r.name}</strong><span className="sub">{r.employeeId}</span></td>
                    <td>{r.department}</td>
                    <td className="num">{r.present}</td>
                    <td className="num">{r.halfDay}</td>
                    <td className="num">{r.absent}</td>
                    <td className="num">{r.leave}</td>
                    <td className="num">{r.totalHours.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        )}
      </section>
    </>
  );
}
