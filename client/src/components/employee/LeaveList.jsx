import { forwardRef, useImperativeHandle } from "react";
import { Button, Table } from "react-bootstrap";
import toast from "react-hot-toast";
import api, { errMsg } from "../../api/axios";
import useApi from "../../hooks/useApi";
import { fmtShort, leaveTypeLabel } from "../../utils/format";
import StatusBadge from "../common/StatusBadge";
import EmptyState from "../common/EmptyState";
import Loading from "../common/Loading";

// Parent can call ref.current.reload() after a new request is sent
const LeaveList = forwardRef(function LeaveList(_, ref) {
  const { data, loading, error, reload } = useApi("/leaves/my", []);
  useImperativeHandle(ref, () => ({ reload }), [reload]);

  const cancel = async (id) => {
    if (!window.confirm("Cancel this leave request?")) return;
    try {
      await api.patch(`/leaves/${id}/cancel`);
      toast.success("Request cancelled");
      reload();
    } catch (err) {
      toast.error(errMsg(err));
    }
  };

  return (
    <section className="panel panel-flush">
      <div className="panel-bar"><h3>My requests</h3></div>
      {loading ? (
        <Loading />
      ) : error ? (
        <p className="text-danger p-3">{error}</p>
      ) : data.length === 0 ? (
        <EmptyState icon="calendar2-week" title="No leave requests yet">Requests you send will show here with their status.</EmptyState>
      ) : (
        <div className="table-wrap">
          <Table className="data-table">
            <thead>
              <tr><th>Type</th><th>Dates</th><th className="num">Days</th><th>Status</th><th aria-label="Actions" /></tr>
            </thead>
            <tbody>
              {data.map((l) => (
                <tr key={l._id} className={l.status === "cancelled" ? "row-muted" : ""}>
                  <td>
                    {leaveTypeLabel[l.type]}
                    <span className="sub">{l.reason}</span>
                  </td>
                  <td className="nowrap">{fmtShort(l.startDate)}{l.days > 1 && <> to {fmtShort(l.endDate)}</>}</td>
                  <td className="num">{l.days}</td>
                  <td>
                    <StatusBadge status={l.status} />
                    {l.reviewComment && <span className="sub">“{l.reviewComment}”</span>}
                  </td>
                  <td className="actions">
                    {l.status === "pending" && <Button size="sm" variant="outline-secondary" onClick={() => cancel(l._id)}>Cancel</Button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      )}
    </section>
  );
});

export default LeaveList;
