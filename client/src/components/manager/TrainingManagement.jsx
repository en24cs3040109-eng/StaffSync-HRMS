import { useState } from "react";
import { Button, Form, Modal, Row, Col } from "react-bootstrap";
import toast from "react-hot-toast";
import api, { errMsg } from "../../api/axios";
import useApi from "../../hooks/useApi";
import { useAuth } from "../../context/AuthContext";
import { fmtShort, fullName, isoDay } from "../../utils/format";
import StatusBadge from "../common/StatusBadge";
import EmptyState from "../common/EmptyState";
import Loading from "../common/Loading";
import PageHeader from "../common/PageHeader";

const blank = { title: "", description: "", trainer: "", startDate: isoDay(), endDate: isoDay(), participants: [] };

// Managers plan programs for their team; HR sees and can manage all of them
export default function TrainingManagement() {
  const { user } = useAuth();
  const { data, loading, reload } = useApi("/trainings", []);
  const { data: people } = useApi("/employees?status=active", []);
  const [modal, setModal] = useState(null); // { mode: "create" | "edit" | "assign", training? }
  const [form, setForm] = useState(blank);
  const [busy, setBusy] = useState(false);

  const isHr = user.role === "hr";
  const mine = (t) => isHr || t.createdBy?._id === user._id;

  const open = (mode, training) => {
    setModal({ mode, training });
    if (mode === "create") setForm(blank);
    if (mode === "edit")
      setForm({ title: training.title, description: training.description || "", trainer: training.trainer || "", startDate: training.startDate.slice(0, 10), endDate: training.endDate.slice(0, 10), participants: [] });
    if (mode === "assign") setForm({ ...blank, participants: [] });
  };

  const toggle = (id) =>
    setForm((f) => ({ ...f, participants: f.participants.includes(id) ? f.participants.filter((x) => x !== id) : [...f.participants, id] }));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (modal.mode === "create") await api.post("/trainings", form);
      if (modal.mode === "edit") await api.put(`/trainings/${modal.training._id}`, form);
      if (modal.mode === "assign") await api.post(`/trainings/${modal.training._id}/assign`, { employees: form.participants });
      toast.success({ create: "Training created", edit: "Training saved", assign: "People assigned" }[modal.mode]);
      setModal(null);
      reload();
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  const remove = async (t) => {
    if (!window.confirm(`Delete "${t.title}"? Participants will lose it from their list.`)) return;
    try {
      await api.delete(`/trainings/${t._id}`);
      toast.success("Training deleted");
      reload();
    } catch (err) {
      toast.error(errMsg(err));
    }
  };

  const removePerson = async (t, employeeId) => {
    try {
      await api.delete(`/trainings/${t._id}/participants/${employeeId}`);
      reload();
    } catch (err) {
      toast.error(errMsg(err));
    }
  };

  const assigned = modal?.training ? modal.training.participants.map((p) => p.employee?._id) : [];
  const pickable = people.filter((p) => !assigned.includes(p._id));

  return (
    <>
      <PageHeader title="Training" subtitle={isHr ? "All training programs across the company." : "Plan programs for your team and follow their progress."}>
        <Button onClick={() => open("create")}><i className="bi bi-plus-lg me-2" aria-hidden="true" />New training</Button>
      </PageHeader>

      {loading ? (
        <Loading />
      ) : data.length === 0 ? (
        <section className="panel"><EmptyState icon="mortarboard" title="No training planned">Create a program and pick who should attend.</EmptyState></section>
      ) : (
        data.map((t) => {
          const done = t.participants.filter((p) => p.status === "completed").length;
          const pct = t.participants.length ? (done / t.participants.length) * 100 : 0;
          return (
            <section key={t._id} className="panel training-card">
              <div className="panel-head">
                <h3>{t.title}</h3>
                {mine(t) && (
                  <span className="d-flex gap-1 flex-shrink-0">
                    <Button size="sm" variant="outline-primary" onClick={() => open("assign", t)}>Assign people</Button>
                    <Button size="sm" variant="link" onClick={() => open("edit", t)}>Edit</Button>
                    <Button size="sm" variant="link" className="text-danger" onClick={() => remove(t)}>Delete</Button>
                  </span>
                )}
              </div>
              <div className="training-meta">
                <span><i className="bi bi-calendar-event" aria-hidden="true" />{fmtShort(t.startDate)} to {fmtShort(t.endDate)}</span>
                {t.trainer && <span><i className="bi bi-person-video3" aria-hidden="true" />{t.trainer}</span>}
                <span><i className="bi bi-check2-circle" aria-hidden="true" />{done} of {t.participants.length} completed</span>
              </div>
              {t.description && <p className="mb-2">{t.description}</p>}
              <div className="progress-line" aria-hidden="true"><div style={{ width: `${pct}%` }} /></div>
              {t.participants.length === 0 ? (
                <p className="muted small mb-0">Nobody assigned yet.</p>
              ) : (
                <ul className="participants">
                  {t.participants.map((p) => (
                    <li key={p._id}>
                      <span>{fullName(p.employee)}</span>
                      <span className="muted small">{p.employee?.employeeId}</span>
                      <StatusBadge status={p.status} />
                      {mine(t) && (
                        <button type="button" className="icon-btn" style={{ width: 28, height: 28, fontSize: "0.9rem" }} aria-label={`Remove ${fullName(p.employee)}`} onClick={() => removePerson(t, p.employee?._id)}>
                          <i className="bi bi-x" />
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          );
        })
      )}

      <Modal show={Boolean(modal)} onHide={() => setModal(null)} centered size={modal?.mode === "assign" ? undefined : "lg"}>
        {modal && (
          <Form onSubmit={submit}>
            <Modal.Header closeButton>
              <Modal.Title as="h3">
                {modal.mode === "create" ? "New training" : modal.mode === "edit" ? "Edit training" : `Assign people to ${modal.training.title}`}
              </Modal.Title>
            </Modal.Header>
            <Modal.Body>
              {modal.mode !== "assign" && (
                <Row className="g-3 mb-3">
                  <Col sm={8}>
                    <Form.Group controlId="tr-title"><Form.Label>Title</Form.Label><Form.Control required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></Form.Group>
                  </Col>
                  <Col sm={4}>
                    <Form.Group controlId="tr-trainer"><Form.Label>Trainer</Form.Label><Form.Control value={form.trainer} onChange={(e) => setForm({ ...form, trainer: e.target.value })} /></Form.Group>
                  </Col>
                  <Col sm={12}>
                    <Form.Group controlId="tr-desc"><Form.Label>What it covers</Form.Label><Form.Control as="textarea" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Form.Group>
                  </Col>
                  <Col xs={6}>
                    <Form.Group controlId="tr-start"><Form.Label>Starts</Form.Label><Form.Control type="date" required value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value, endDate: form.endDate < e.target.value ? e.target.value : form.endDate })} /></Form.Group>
                  </Col>
                  <Col xs={6}>
                    <Form.Group controlId="tr-end"><Form.Label>Ends</Form.Label><Form.Control type="date" required min={form.startDate} value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} /></Form.Group>
                  </Col>
                </Row>
              )}
              {modal.mode !== "edit" && (
                <>
                  <Form.Label as="p" className="mb-1">{isHr ? "Participants" : "Participants from your team"}</Form.Label>
                  {pickable.length === 0 ? (
                    <p className="muted small">{people.length === 0 ? "You have no team members to assign." : "Everyone is already assigned."}</p>
                  ) : (
                    <div className="check-list">
                      {pickable.map((p) => (
                        <Form.Check key={p._id} id={`pp-${p._id}`} label={`${fullName(p)} (${p.designation || p.employeeId})`} checked={form.participants.includes(p._id)} onChange={() => toggle(p._id)} />
                      ))}
                    </div>
                  )}
                </>
              )}
            </Modal.Body>
            <Modal.Footer>
              <Button variant="link" onClick={() => setModal(null)}>Cancel</Button>
              <Button type="submit" disabled={busy || (modal.mode === "assign" && form.participants.length === 0)}>
                {modal.mode === "create" ? "Create training" : modal.mode === "edit" ? "Save training" : `Assign ${form.participants.length || ""}`.trim()}
              </Button>
            </Modal.Footer>
          </Form>
        )}
      </Modal>
    </>
  );
}
