import useApi from "../hooks/useApi";
import { useAuth } from "../context/AuthContext";
import DashboardLayout from "../components/common/DashboardLayout";
import TodayPanel from "../components/common/TodayPanel";
import LeaveBalance from "../components/common/LeaveBalance";
import AnnouncementFeed from "../components/common/AnnouncementFeed";
import ProfilePanel from "../components/common/ProfilePanel";
import LeaveApplications from "../components/manager/LeaveApplications";
import TrainingManagement from "../components/manager/TrainingManagement";
import TeamMembers from "../components/manager/TeamMembers";
import AnnouncementsManager from "../components/hr/AnnouncementsManager";
import Attendance from "../components/employee/Attendance";
import LeavePage from "../components/employee/LeavePage";

function Overview({ stats, reload, goTo }) {
  const { employee } = useAuth();
  const s = stats;
  return (
    <div className="stack">
      <TodayPanel onChange={reload}>
        <LeaveBalance balance={employee?.leaveBalance} />
      </TodayPanel>

      <dl className="stats">
        <div className="stat"><dt>People in your team</dt><dd>{s?.teamSize ?? "–"}</dd></div>
        <div className="stat"><dt>In today</dt><dd>{s ? s.teamPresentToday : "–"}{s && <small>of {s.teamSize}</small>}</dd></div>
        <div className="stat"><dt>On leave today</dt><dd>{s?.teamOnLeaveToday ?? "–"}</dd></div>
        <div className={`stat ${s?.pendingTeamLeaves ? "attention" : ""}`}><dt>Leave to review</dt><dd>{s?.pendingTeamLeaves ?? "–"}</dd></div>
      </dl>

      <div className="grid-even">
        <section className="panel">
          <div className="panel-head"><h3>Needs your attention</h3></div>
          {s?.pendingTeamLeaves ? (
            <p>
              {s.pendingTeamLeaves} leave request{s.pendingTeamLeaves > 1 ? "s are" : " is"} waiting for you.{" "}
              <button type="button" className="link-btn" onClick={() => goTo("approvals")}>Review now</button>
            </p>
          ) : (
            <p className="muted">No leave requests waiting. You're up to date.</p>
          )}
          <p className="mb-0">
            {s?.activeTrainingsCreated ? `${s.activeTrainingsCreated} training program${s.activeTrainingsCreated > 1 ? "s" : ""} running or coming up.` : "No training planned yet."}{" "}
            <button type="button" className="link-btn" onClick={() => goTo("training")}>Open training</button>
          </p>
        </section>
        <section className="panel">
          <div className="panel-head">
            <h3>Latest announcements</h3>
            <button type="button" className="link-btn" onClick={() => goTo("announcements")}>See all</button>
          </div>
          <AnnouncementFeed items={s?.announcements} compact />
        </section>
      </div>
    </div>
  );
}

export default function ManagerDashboard() {
  const { data: stats, reload } = useApi("/dashboard/stats");

  const nav = [
    { key: "overview", label: "Overview", icon: "grid" },
    { key: "approvals", label: "Leave applications", icon: "calendar2-check", badge: stats?.pendingTeamLeaves },
    { key: "team", label: "My team", icon: "people" },
    { key: "training", label: "Training", icon: "mortarboard" },
    { key: "announcements", label: "Announcements", icon: "megaphone" },
    { key: "attendance", label: "My attendance", icon: "clock-history" },
    { key: "leave", label: "My leave", icon: "calendar2-week" },
    { key: "profile", label: "My profile", icon: "person" },
  ];

  return (
    <DashboardLayout
      nav={nav}
      render={(tab, goTo) =>
        ({
          overview: <Overview stats={stats} reload={reload} goTo={goTo} />,
          approvals: <LeaveApplications onReviewed={reload} />,
          team: <TeamMembers />,
          training: <TrainingManagement />,
          announcements: <AnnouncementsManager />,
          attendance: <Attendance />,
          leave: <LeavePage />,
          profile: <ProfilePanel />,
        })[tab]
      }
    />
  );
}
