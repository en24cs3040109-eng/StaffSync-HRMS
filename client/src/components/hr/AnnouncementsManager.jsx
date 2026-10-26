import { useState } from "react";
import { Button, Form, Modal } from "react-bootstrap";
import toast from "react-hot-toast";
import api, { errMsg } from "../../api/axios";
import useApi from "../../hooks/useApi";
import { useAuth } from "../../context/AuthContext";
import AnnouncementFeed from "../common/AnnouncementFeed";
import Loading from "../common/Loading";
import PageHeader from "../common/PageHeader";

const blank = { title: "", content: "", audience: "all", department: "", pinned: false };

// Used by HR (manage everything) and managers (manage their own posts)
export default function AnnouncementsManager() {
  const { user } = useAuth();
  const { data, loading, reload } = useApi("/announcements", []);
  const { data: departments } = useApi("/departments", []);
  const [form, setForm] = useState(blank);
  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState(false);

  const canEdit = (a) => user.role === "hr" || a.postedBy === user._id;

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (editing) await api.put(`/announcements/${editing}`, form);
      else await api.post("/announcements", form);
      toast.success(editing ? "Announcement updated" : "Announcement posted");
      setForm(blank);
      setEditing(null);
      reload();
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  const remove = async (a) => {
    if (!window.confirm(`Delete "${a.title}"?`)) return;
    try {
      await api.delete(`/announcements/${a._id}`);
      toast.success("Announcement deleted");
      reload();
    } catch (err) {
      toast.error(errMsg(err));
    }
  };

  const startEdit = (a) => {
    setEditing(a._id);
    setForm({ title: a.title, content: a.content, audience: a.audience, department: a.department?._id || "", pinned: a.pinned });
  };

  const formBody = (
    <Form onSubmit={submit}>
      <Form.Group className="mb-3" controlId="an-title">
        <Form.Label>Title</Form.Label>
        <Form.Control required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
      </Form.Group>
      <Form.Group className="mb-3" controlId="an-content">
        <Form.Label>Message</Form.Label>
        <Form.Control as="textarea" rows={4} required value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} />
      </Form.Group>
      <Form.Group className="mb-3" controlId="an-aud">
        <Form.Label>Who should see it</Form.Label>
        <Form.Select value={form.audience} onChange={(e) => setForm({ ...form, audience: e.target.value })}>
          <option value="all">Everyone</option>
          <option value="employees">Employees only</option>
          <option value="managers">Managers only</option>
          <option value="department">One department</option>
        </Form.Select>
      </Form.Group>
      {form.audience === "department" && (
        <Form.Group className="mb-3" controlId="an-dept">
          <Form.Label>Department</Form.Label>
          <Form.Select required value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })}>
            <option value="">Choose a department</option>
            {departments.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}
          </Form.Select>
        </Form.Group>
      )}
      <Form.Check className="mb-3" id="an-pin" label="Pin to the top" checked={form.pinned} onChange={(e) => setForm({ ...form, pinned: e.target.checked })} />
      <div className="d-flex gap-2">
        <Button type="submit" disabled={busy}>{editing ? "Save changes" : "Post announcement"}</Button>
        {editing && <Button variant="link" onClick={() => { setEditing(null); setForm(blank); }}>Cancel</Button>}
      </div>
    </Form>
  );

  return (
    <>
      <PageHeader title="Announcements" subtitle="Everyone in the audience you pick gets a notification when you post." />
      <div className="grid-2">
        <section className="panel">
          <h3 className="panel-title">New announcement</h3>
          {editing ? <p className="muted">Editing an announcement in the window above.</p> : formBody}
        </section>
        <section className="panel">
          {loading ? (
            <Loading />
          ) : (
            <AnnouncementFeed
              items={data}
              renderActions={(a) =>
                canEdit(a) && (
                  <span className="d-flex gap-1 flex-shrink-0">
                    <Button size="sm" variant="link" onClick={() => startEdit(a)}>Edit</Button>
                    <Button size="sm" variant="link" className="text-danger" onClick={() => remove(a)}>Delete</Button>
                  </span>
                )
              }
            />
          )}
        </section>
      </div>
      <Modal show={Boolean(editing)} onHide={() => { setEditing(null); setForm(blank); }} centered>
        <Modal.Header closeButton><Modal.Title as="h3">Edit announcement</Modal.Title></Modal.Header>
        <Modal.Body>{formBody}</Modal.Body>
      </Modal>
    </>
  );
}
