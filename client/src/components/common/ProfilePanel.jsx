import { useState } from "react";
import { Form, Button, Row, Col } from "react-bootstrap";
import toast from "react-hot-toast";
import api, { errMsg } from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import { fmtDate, fmtMoney, fullName, roleLabel, fileUrl } from "../../utils/format";
import Avatar from "./Avatar";
import PageHeader from "./PageHeader";

export default function ProfilePanel() {
  const { user, employee, refresh } = useAuth();
  const [contact, setContact] = useState({ phone: employee?.phone || "", address: employee?.address || "" });
  const [pw, setPw] = useState({ currentPassword: "", newPassword: "", confirm: "" });
  const [doc, setDoc] = useState({ name: "", file: null });
  const [busy, setBusy] = useState("");

  if (!employee) return <p>No employee profile is linked to this account. Ask HR to create one.</p>;

  const saveContact = async (e) => {
    e.preventDefault();
    setBusy("contact");
    try {
      await api.put(`/employees/${employee._id}`, contact);
      await refresh();
      toast.success("Contact details saved");
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setBusy("");
    }
  };

  const uploadAvatar = async (file) => {
    if (!file) return;
    const fd = new FormData();
    fd.append("avatar", file);
    try {
      await api.put(`/employees/${employee._id}`, fd);
      await refresh();
      toast.success("Photo updated");
    } catch (err) {
      toast.error(errMsg(err));
    }
  };

  const uploadDoc = async (e) => {
    e.preventDefault();
    if (!doc.file) return toast.error("Choose a file to upload");
    const fd = new FormData();
    fd.append("file", doc.file);
    if (doc.name) fd.append("name", doc.name);
    setBusy("doc");
    try {
      await api.post(`/employees/${employee._id}/documents`, fd);
      await refresh();
      setDoc({ name: "", file: null });
      e.target.reset();
      toast.success("Document uploaded");
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setBusy("");
    }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    if (pw.newPassword !== pw.confirm) return toast.error("The new passwords don't match");
    setBusy("pw");
    try {
      await api.put("/auth/change-password", { currentPassword: pw.currentPassword, newPassword: pw.newPassword });
      setPw({ currentPassword: "", newPassword: "", confirm: "" });
      toast.success("Password changed");
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setBusy("");
    }
  };

  const facts = [
    ["Employee ID", employee.employeeId],
    ["Email", user.email],
    ["Role", roleLabel[user.role]],
    ["Department", employee.department?.name || "Not assigned"],
    ["Designation", employee.designation || "—"],
    ["Reports to", employee.manager ? fullName(employee.manager) : "—"],
    ["Joined", fmtDate(employee.dateOfJoining)],
    ["Salary", employee.salary ? `${fmtMoney(employee.salary)} / month` : "—"],
  ];

  return (
    <>
      <PageHeader title={fullName(employee)} subtitle="Your details as HR has them on record. You can update your contact details and documents." />
      <div className="grid-2">
        <section className="panel">
          <div className="profile-id">
            <Avatar employee={employee} size={72} />
            <label className="btn btn-sm btn-outline-secondary">
              Change photo
              <input type="file" accept="image/*" hidden onChange={(e) => uploadAvatar(e.target.files[0])} />
            </label>
          </div>
          <dl className="facts">
            {facts.map(([k, v]) => (
              <div key={k}>
                <dt>{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
        </section>

        <div className="stack">
          <section className="panel">
            <h3 className="panel-title">Contact details</h3>
            <Form onSubmit={saveContact}>
              <Form.Group className="mb-3" controlId="p-phone">
                <Form.Label>Phone</Form.Label>
                <Form.Control value={contact.phone} onChange={(e) => setContact({ ...contact, phone: e.target.value })} />
              </Form.Group>
              <Form.Group className="mb-3" controlId="p-address">
                <Form.Label>Address</Form.Label>
                <Form.Control as="textarea" rows={2} value={contact.address} onChange={(e) => setContact({ ...contact, address: e.target.value })} />
              </Form.Group>
              <Button type="submit" disabled={busy === "contact"}>Save contact details</Button>
            </Form>
          </section>

          <section className="panel">
            <h3 className="panel-title">Documents</h3>
            {employee.documents?.length ? (
              <ul className="doc-list">
                {employee.documents.map((d) => (
                  <li key={d._id}>
                    <i className="bi bi-file-earmark-text" aria-hidden="true" />
                    <a href={fileUrl(d.url)} target="_blank" rel="noreferrer">{d.name}</a>
                    <span>{fmtDate(d.uploadedAt)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="muted">No documents uploaded yet.</p>
            )}
            <Form onSubmit={uploadDoc}>
              <Row className="g-2">
                <Col sm={5}>
                  <Form.Control placeholder="Name, e.g. PAN card" aria-label="Document name" value={doc.name} onChange={(e) => setDoc({ ...doc, name: e.target.value })} />
                </Col>
                <Col sm={7}>
                  <Form.Control type="file" aria-label="Document file" accept=".pdf,.doc,.docx,image/*" onChange={(e) => setDoc({ ...doc, file: e.target.files[0] })} />
                </Col>
              </Row>
              <Button type="submit" variant="outline-primary" className="mt-2" disabled={busy === "doc"}>Upload document</Button>
            </Form>
          </section>

          <section className="panel">
            <h3 className="panel-title">Password</h3>
            <Form onSubmit={changePassword}>
              <Form.Group className="mb-2" controlId="p-cur">
                <Form.Label>Current password</Form.Label>
                <Form.Control type="password" autoComplete="current-password" required value={pw.currentPassword} onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} />
              </Form.Group>
              <Row className="g-2 mb-3">
                <Col sm={6}>
                  <Form.Group controlId="p-new">
                    <Form.Label>New password</Form.Label>
                    <Form.Control type="password" autoComplete="new-password" minLength={6} required value={pw.newPassword} onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} />
                  </Form.Group>
                </Col>
                <Col sm={6}>
                  <Form.Group controlId="p-confirm">
                    <Form.Label>Repeat new password</Form.Label>
                    <Form.Control type="password" autoComplete="new-password" minLength={6} required value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} />
                  </Form.Group>
                </Col>
              </Row>
              <Button type="submit" variant="outline-primary" disabled={busy === "pw"}>Change password</Button>
            </Form>
          </section>
        </div>
      </div>
    </>
  );
}
