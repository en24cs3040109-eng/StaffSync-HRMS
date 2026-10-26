import { Table } from "react-bootstrap";
import useApi from "../../hooks/useApi";
import { fmtTime, fullName, isoDay } from "../../utils/format";
import Avatar from "../common/Avatar";
import StatusBadge from "../common/StatusBadge";
import EmptyState from "../common/EmptyState";
import Loading from "../common/Loading";
import PageHeader from "../common/PageHeader";

export default function TeamMembers() {
  const today = isoDay();
  const team = useApi("/employees?status=active", []);
  const att = useApi(`/attendance?from=${today}&to=${today}`, []);
  const leaves = useApi("/leaves?status=approved", []);

  const todayRecord = (id) => att.data.find((r) => r.employee?._id === id);
  const onLeave = (id) =>
    leaves.data.some((l) => l.employee?._id === id && l.startDate.slice(0, 10) <= today && l.endDate.slice(0, 10) >= today);

  return (
    <>
      <PageHeader title="My team" subtitle="The people who report to you, and where they are today." />
      <section className="panel panel-flush">
        {team.loading || att.loading ? (
          <Loading />
        ) : team.data.length === 0 ? (
          <EmptyState icon="people" title="No one reports to you yet">HR assigns team members to managers.</EmptyState>
        ) : (
          <div className="table-wrap">
            <Table className="data-table">
              <thead><tr><th>Name</th><th>Designation</th><th>Phone</th><th>Today</th><th>Checked in</th><th className="num">Leave left</th></tr></thead>
              <tbody>
                {team.data.map((e) => {
                  const r = todayRecord(e._id);
                  const away = onLeave(e._id);
                  return (
                    <tr key={e._id}>
                      <td>
                        <div className="person">
                          <Avatar employee={e} size={34} />
                          <div><strong>{fullName(e)}</strong><span className="sub">{e.user?.email}</span></div>
                        </div>
                      </td>
                      <td>{e.designation || "—"}</td>
                      <td className="nowrap">{e.phone || "—"}</td>
                      <td>{away ? <StatusBadge status="leave" /> : r ? <StatusBadge status={r.status} /> : <span className="muted small">Not in yet</span>}</td>
                      <td>{r ? fmtTime(r.checkIn) : "—"}</td>
                      <td className="num nowrap">{e.leaveBalance.casual + e.leaveBalance.sick + e.leaveBalance.earned} days</td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </div>
        )}
      </section>
    </>
  );
}
