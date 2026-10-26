import { useState } from "react";
import { Form, Button, Modal, Table } from "react-bootstrap";
import toast from "react-hot-toast";
import api, { errMsg } from "../../api/axios";
import useApi from "../../hooks/useApi";
import { fmtShort, fullName, leaveTypeLabel, fileUrl } from "../../utils/format";
import StatusBadge from "./StatusBadge";
import EmptyState from "./EmptyState";
import Loading from "./Loading";

// Shared by the HR and manager leave screens; the API scopes the list by role
export default function LeaveReviewTable({ showDepartment, onReviewed }) {
  const [status, setStatus] = useState("pending");
  const { data, loading, error, reload } = useApi(`/leaves${status ? `?status=${status}` : ""}`, []);
  const [review, setReview] = useState(null); // { leave, decision }
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    try {
      await api.patch(`/leaves/${review.leave._id}/status`, { status: review.decision, reviewComment: comment });
      toast.success(review.decision === "approved" ? "Leave approved" : "Leave rejected");
      setReview(null);
      setComment("");
      reload();
      onReviewed?.();
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="panel panel-flush">
      <div className="panel-bar">
        <Form.Select size="sm" aria-label="Filter by status" value={status} onChange={(e) => setStatus(e.target.value)} className="w-auto">
          <option value="pending">Waiting for review</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="cancelled">Cancelled</option>
          <option value="">All requests</option>
        </Form.Select>
        <span className="muted small">{data.length} request{data.length === 1 ? "" : "s"}</span>
      </div>

      {loading ? (
        <Loading />
      ) : error ? (
        <p className="text-danger p-3">{error}</p>
      ) : data.length === 0 ? (
        <EmptyState icon="check2-circle" title={status === "pending" ? "Nothing to review" : "No requests here"}>
          {status === "pending" ? "New leave requests from your people will appear here." : "Try a different filter."}
        </EmptyState>
      ) : (
        <div className="table-wrap">
          <Table hover className="data-table">
            <thead>
              <tr>
                <th>Employee</th>
                {showDepartment && <th>Department</th>}
                <th>Type</th>
                <th>Dates</th>
                <th className="num">Days</th>
                <th>Reason</th>
                <th>Status</th>
                <th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {data.map((l) => (
                <tr key={l._id}>
                  <td>
                    <strong>{fullName(l.employee)}</strong>
                    <span className="sub">{l.employee?.employeeId}</span>
                  </td>
                  {showDepartment && <td>{l.employee?.department?.name || "—"}</td>}
                  <td>{leaveTypeLabel[l.type]}</td>
                  <td className="nowrap">
                    {fmtShort(l.startDate)}
                    {l.days > 1 && <> to {fmtShort(l.endDate)}</>}
                  </td>
                  <td className="num">{l.days}</td>
                  <td className="reason">
                    {l.reason}
                    {l.attachment && (
                      <a className="sub" href={fileUrl(l.attachment)} target="_blank" rel="noreferrer">
                        <i className="bi bi-paperclip" aria-hidden="true" /> Attachment
                      </a>
                    )}
                    {l.reviewComment && <span className="sub">Note: {l.reviewComment}</span>}
                  </td>
                  <td><StatusBadge status={l.status} /></td>
                  <td className="actions">
                    {l.status === "pending" && (
                      <>
                        <Button size="sm" variant="success" onClick={() => setReview({ leave: l, decision: "approved" })}>Approve</Button>
                        <Button size="sm" variant="outline-danger" onClick={() => setReview({ leave: l, decision: "rejected" })}>Reject</Button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      )}

      <Modal show={Boolean(review)} onHide={() => setReview(null)} centered>
        {review && (
          <>
            <Modal.Header closeButton>
              <Modal.Title as="h3">{review.decision === "approved" ? "Approve" : "Reject"} leave for {fullName(review.leave.employee)}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <p>
                {review.leave.days} day{review.leave.days > 1 ? "s" : ""} of {leaveTypeLabel[review.leave.type].toLowerCase()} leave,{" "}
                {fmtShort(review.leave.startDate)}
                {review.leave.days > 1 && ` to ${fmtShort(review.leave.endDate)}`}.
              </p>
              <Form.Group controlId="review-comment">
                <Form.Label>Note to the employee (optional)</Form.Label>
                <Form.Control as="textarea" rows={2} value={comment} onChange={(e) => setComment(e.target.value)} />
              </Form.Group>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="link" onClick={() => setReview(null)}>Cancel</Button>
              <Button variant={review.decision === "approved" ? "success" : "danger"} disabled={busy} onClick={submit}>
                {review.decision === "approved" ? "Approve leave" : "Reject leave"}
              </Button>
            </Modal.Footer>
          </>
        )}
      </Modal>
    </section>
  );
}
