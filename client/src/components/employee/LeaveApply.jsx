import { useState } from "react";
import { Form, Button, Row, Col } from "react-bootstrap";
import toast from "react-hot-toast";
import api, { errMsg } from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import { inclusiveDays, isoDay } from "../../utils/format";

const blank = { type: "casual", startDate: "", endDate: "", reason: "" };

export default function LeaveApply({ onApplied }) {
  const { employee, refresh } = useAuth();
  const [f, setF] = useState(blank);
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);

  const days = inclusiveDays(f.startDate, f.endDate);
  const balance = f.type === "unpaid" ? Infinity : employee?.leaveBalance?.[f.type] ?? 0;
  const over = days > balance;

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const fd = new FormData();
      Object.entries(f).forEach(([k, v]) => fd.append(k, v));
      if (file) fd.append("attachment", file);
      await api.post("/leaves", fd);
      toast.success("Leave request sent");
      setF(blank);
      setFile(null);
      e.target.reset();
      refresh();
      onApplied?.();
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  const set = (k) => (e) => {
    const next = { ...f, [k]: e.target.value };
    if (k === "startDate" && (!f.endDate || f.endDate < e.target.value)) next.endDate = e.target.value;
    setF(next);
  };

  return (
    <section className="panel">
      <h3 className="panel-title">Apply for leave</h3>
      <Form onSubmit={submit}>
        <Form.Group className="mb-3" controlId="la-type">
          <Form.Label>Leave type</Form.Label>
          <Form.Select value={f.type} onChange={set("type")}>
            <option value="casual">Casual ({employee?.leaveBalance?.casual ?? 0} days left)</option>
            <option value="sick">Sick ({employee?.leaveBalance?.sick ?? 0} days left)</option>
            <option value="earned">Earned ({employee?.leaveBalance?.earned ?? 0} days left)</option>
            <option value="unpaid">Unpaid</option>
          </Form.Select>
        </Form.Group>
        <Row className="g-2 mb-1">
          <Col xs={6}>
            <Form.Group controlId="la-start">
              <Form.Label>From</Form.Label>
              <Form.Control type="date" required value={f.startDate} min={f.type === "sick" ? undefined : isoDay()} onChange={set("startDate")} />
            </Form.Group>
          </Col>
          <Col xs={6}>
            <Form.Group controlId="la-end">
              <Form.Label>To</Form.Label>
              <Form.Control type="date" required value={f.endDate} min={f.startDate || undefined} onChange={set("endDate")} />
            </Form.Group>
          </Col>
        </Row>
        <p className={`small mb-3 ${over ? "text-danger" : "muted"}`}>
          {days > 0
            ? over
              ? `${days} days requested, but you only have ${balance} ${f.type} days left.`
              : `${days} day${days > 1 ? "s" : ""}, weekends included.`
            : "Pick the first and last day you'll be away."}
        </p>
        <Form.Group className="mb-3" controlId="la-reason">
          <Form.Label>Reason</Form.Label>
          <Form.Control as="textarea" rows={2} required value={f.reason} onChange={set("reason")} />
        </Form.Group>
        <Form.Group className="mb-3" controlId="la-file">
          <Form.Label>Supporting document (optional)</Form.Label>
          <Form.Control type="file" accept=".pdf,.doc,.docx,image/*" onChange={(e) => setFile(e.target.files[0])} />
          <Form.Text>A medical certificate for sick leave, for example.</Form.Text>
        </Form.Group>
        <Button type="submit" disabled={busy || over || days === 0}>Send request</Button>
      </Form>
    </section>
  );
}
