import useApi from "../hooks/useApi";
import { useAuth } from "../context/AuthContext";
import DashboardLayout from "../components/common/DashboardLayout";
import TodayPanel from "../components/common/TodayPanel";
import LeaveBalance from "../components/common/LeaveBalance";
import AnnouncementFeed from "../components/common/AnnouncementFeed";
import ProfilePanel from "../components/common/ProfilePanel";
import Attendance from "../components/employee/Attendance";
import LeavePage from "../components/employee/LeavePage";
import Announcements from "../components/employee/Announcements";
import MyTrainings from "../components/employee/MyTrainings";

function Overview({ goTo }) {
  const { employee } = useAuth();
  const { data: s, reload } = useApi("/dashboard/stats");

  return (
    <div className="stack">
      <TodayPanel onChange={reload}>
        <LeaveBalance balance={employee?.leaveBalance} />
      </TodayPanel>

      <dl className="stats">
        <div className="stat"><dt>Days present this month</dt><dd>{s?.daysPresentThisMonth ?? "–"}</dd></div>
        <div className={`stat ${s?.myPendingLeaves ? "attention" : ""}`}><dt>Leave requests waiting</dt><dd>{s?.myPendingLeaves ?? "–"}</dd></div>
        <div className="stat"><dt>Training to finish</dt><dd>{s ? s.trainingStatus.assigned + s.trainingStatus["in-progress"] : "–"}</dd></div>
        <div className="stat"><dt>Training completed</dt><dd>{s?.trainingStatus.completed ?? "–"}</dd></div>
      </dl>

      <div className="grid-even">
        <section className="panel">
          <div className="panel-head">
            <h3>Latest announcements</h3>
            <button type="button" className="link-btn" onClick={() => goTo("announcements")}>See all</button>
          </div>
          <AnnouncementFeed items={s?.announcements} compact />
        </section>
        <section className="panel">
          <h3 className="panel-title">Shortcuts</h3>
          <div className="d-grid gap-2">
            <button type="button" className="btn btn-outline-primary text-start" onClick={() => goTo("leave")}><i className="bi bi-calendar-plus me-2" aria-hidden="true" />Apply for leave</button>
            <button type="button" className="btn btn-outline-primary text-start" onClick={() => goTo("attendance")}><i className="bi bi-clock-history me-2" aria-hidden="true" />See my attendance</button>
            <button type="button" className="btn btn-outline-primary text-start" onClick={() => goTo("training")}><i className="bi bi-mortarboard me-2" aria-hidden="true" />Update training progress</button>
            <button type="button" className="btn btn-outline-primary text-start" onClick={() => goTo("profile")}><i className="bi bi-person me-2" aria-hidden="true" />Update my contact details</button>
          </div>
        </section>
      </div>
    </div>
  );
}

const NAV = [
  { key: "overview", label: "Overview", icon: "grid" },
  { key: "attendance", label: "Attendance", icon: "clock-history" },
  { key: "leave", label: "Leave", icon: "calendar2-week" },
  { key: "announcements", label: "Announcements", icon: "megaphone" },
  { key: "training", label: "Training", icon: "mortarboard" },
  { key: "profile", label: "My profile", icon: "person" },
];

const EmployeeDashboard = () => (
  <DashboardLayout
    nav={NAV}
    render={(tab, goTo) =>
      ({
        overview: <Overview goTo={goTo} />,
        attendance: <Attendance />,
        leave: <LeavePage />,
        announcements: <Announcements />,
        training: <MyTrainings />,
        profile: <ProfilePanel />,
      })[tab]
    }
  />
);

export default EmployeeDashboard;
