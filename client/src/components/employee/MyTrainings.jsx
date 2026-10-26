import { Form } from "react-bootstrap";
import toast from "react-hot-toast";
import api, { errMsg } from "../../api/axios";
import useApi from "../../hooks/useApi";
import { useAuth } from "../../context/AuthContext";
import { fmtShort } from "../../utils/format";
import StatusBadge from "../common/StatusBadge";
import EmptyState from "../common/EmptyState";
import Loading from "../common/Loading";
import PageHeader from "../common/PageHeader";

export default function MyTrainings() {
  const { employee } = useAuth();
  const { data, setData, loading, error } = useApi("/trainings", []);

  const myStatus = (t) => t.participants.find((p) => p.employee?._id === employee?._id)?.status;

  const update = async (t, status) => {
    try {
      const { data: updated } = await api.patch(`/trainings/${t._id}/progress`, { status });
      setData((list) => list.map((x) => (x._id === t._id ? updated : x)));
      toast.success(status === "completed" ? "Marked as completed" : "Progress updated");
    } catch (err) {
      toast.error(errMsg(err));
    }
  };

  return (
    <>
      <PageHeader title="My training" subtitle="Programs your manager has assigned to you. Update your progress as you go." />
      {loading ? (
        <Loading />
      ) : error ? (
        <p className="text-danger">{error}</p>
      ) : data.length === 0 ? (
        <section className="panel"><EmptyState icon="mortarboard" title="No training assigned">When your manager assigns a program, it will appear here.</EmptyState></section>
      ) : (
        data.map((t) => {
          const status = myStatus(t);
          return (
            <section key={t._id} className="panel training-card">
              <div className="panel-head">
                <h3>{t.title}</h3>
                <StatusBadge status={status} />
              </div>
              <div className="training-meta">
                <span><i className="bi bi-calendar-event" aria-hidden="true" />{fmtShort(t.startDate)} to {fmtShort(t.endDate)}</span>
                {t.trainer && <span><i className="bi bi-person-video3" aria-hidden="true" />{t.trainer}</span>}
              </div>
              {t.description && <p className="mb-3">{t.description}</p>}
              <Form.Group controlId={`tp-${t._id}`} className="d-flex align-items-center gap-2">
                <Form.Label className="mb-0">My progress</Form.Label>
                <Form.Select size="sm" className="w-auto" value={status} onChange={(e) => update(t, e.target.value)}>
                  <option value="assigned">Not started</option>
                  <option value="in-progress">In progress</option>
                  <option value="completed">Completed</option>
                </Form.Select>
              </Form.Group>
            </section>
          );
        })
      )}
    </>
  );
}
