import { Link } from "react-router-dom";
import useApi from "../hooks/useApi";
import DashboardLayout from "../components/common/DashboardLayout";
import TodayPanel from "../components/common/TodayPanel";
import AnnouncementFeed from "../components/common/AnnouncementFeed";
import ProfilePanel from "../components/common/ProfilePanel";
import EmployeeCRUD from "../components/hr/EmployeeCRUD";
import Departments from "../components/hr/Departments";
import LeaveApplications from "../components/hr/LeaveApplications";
import AttendanceSummary from "../components/hr/AttendanceSummary";
import AnnouncementsManager from "../components/hr/AnnouncementsManager";
import TrainingManagement from "../components/manager/TrainingManagement";
import LeavePage from "../components/employee/LeavePage";
import { leaveTypeLabel } from "../utils/format";

const YEAR = new Date().getFullYear();
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function Bars({ rows }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <div className="bars">
      {rows.map((r) => (
        <div className="bar-row" key={r.label}>
          <span>{r.label}</span>
          <div className="bar-track"><div className="bar-fill" style={{ width: `${(r.value / max) * 100}%` }} /></div>
          <span className="bar-val">{r.value}</span>
        </div>
      ))}
    </div>
  );
}

function Overview({ stats: s, reload, goTo }) {
  const { data: report } = useApi(`/leaves/report?year=${YEAR}`);

  return (
    <div className="stack">
      <TodayPanel onChange={reload} />

      <dl className="stats">
        <div className="stat"><dt>Active employees</dt><dd>{s?.totalEmployees ?? "–"}</dd></div>
        <div className="stat"><dt>In today</dt><dd>{s?.presentToday ?? "–"}{s && <small>of {s.totalEmployees}</small>}</dd></div>
        <div className="stat"><dt>On leave today</dt><dd>{s?.onLeaveToday ?? "–"}</dd></div>
        <div className={`stat ${s?.pendingLeaves ? "attention" : ""}`}><dt>Leave to review</dt><dd>{s?.pendingLeaves ?? "–"}</dd></div>
        <div className="stat"><dt>Departments</dt><dd>{s?.departments ?? "–"}</dd></div>
      </dl>

      <div className="grid-even">
        <section className="panel">
          <div className="panel-head">
            <h3>Leave taken this year</h3>
            <span className="muted small">Approved days by type</span>
          </div>
          {report?.byType?.length ? (
            <Bars rows={report.byType.map((t) => ({ label: leaveTypeLabel[t.type], value: t.days }))} />
          ) : (
            <p className="muted mb-0">No approved leave yet this year.</p>
          )}
          {report?.byDepartment?.length > 0 && (
            <>
              <div className="panel-head mt-4"><h3>By department</h3></div>
              <Bars rows={report.byDepartment.map((d) => ({ label: d.department, value: d.days }))} />
            </>
          )}
        </section>

        <section className="panel">
          <div className="panel-head"><h3>Leave by month</h3><span className="muted small">Approved days</span></div>
          {report?.byMonth?.length ? (
            <Bars rows={report.byMonth.map((m) => ({ label: MONTHS[m.month - 1], value: m.days }))} />
          ) : (
            <p className="muted mb-0">Nothing to show yet.</p>
          )}
          <div className="panel-head mt-4"><h3>Team mix</h3></div>
          {s && (
            <Bars rows={[["Employees", "employee"], ["Managers", "manager"], ["HR", "hr"]].map(([label, k]) => ({ label, value: s.byRole[k] || 0 }))} />
          )}
        </section>
      </div>

      <div className="grid-even">
        <section className="panel">
          <div className="panel-head"><h3>Quick actions</h3></div>
          <div className="d-grid gap-2">
            <Link to="/register" className="btn btn-outline-primary text-start"><i className="bi bi-person-plus me-2" aria-hidden="true" />Register a new employee</Link>
            <button type="button" className="btn btn-outline-primary text-start" onClick={() => goTo("approvals")}><i className="bi bi-calendar2-check me-2" aria-hidden="true" />Review leave requests</button>
            <button type="button" className="btn btn-outline-primary text-start" onClick={() => goTo("announcements")}><i className="bi bi-megaphone me-2" aria-hidden="true" />Post an announcement</button>
          </div>
        </section>
        <section className="panel">
          <div className="panel-head">
            <h3>Latest announcements</h3>
            <button type="button" className="link-btn" onClick={() => goTo("announcements")}>Manage</button>
          </div>
          <AnnouncementFeed items={s?.announcements} compact />
        </section>
      </div>
    </div>
  );
}

export default function HrDashboard() {
  const { data: stats, reload } = useApi("/dashboard/stats");

  const nav = [
    { key: "overview", label: "Overview", icon: "grid" },
    { key: "employees", label: "Employees", icon: "people" },
    { key: "approvals", label: "Leave applications", icon: "calendar2-check", badge: stats?.pendingLeaves },
    { key: "attendance", label: "Attendance", icon: "clock-history" },
    { key: "announcements", label: "Announcements", icon: "megaphone" },
    { key: "training", label: "Training", icon: "mortarboard" },
    { key: "departments", label: "Departments", icon: "diagram-3" },
    { key: "leave", label: "My leave", icon: "calendar2-week" },
    { key: "profile", label: "My profile", icon: "person" },
  ];

  return (
    <DashboardLayout
      nav={nav}
      render={(tab, goTo) =>
        ({
          overview: <Overview stats={stats} reload={reload} goTo={goTo} />,
          employees: <EmployeeCRUD />,
          approvals: <LeaveApplications onReviewed={reload} />,
          attendance: <AttendanceSummary />,
          announcements: <AnnouncementsManager />,
          training: <TrainingManagement />,
          departments: <Departments />,
          leave: <LeavePage />,
          profile: <ProfilePanel />,
        })[tab]
      }
    />
  );
}
