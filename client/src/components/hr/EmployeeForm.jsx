import { useState } from "react";
import { Form, Row, Col, Button } from "react-bootstrap";
import useApi from "../../hooks/useApi";
import { isoDay } from "../../utils/format";

const blank = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  role: "employee",
  department: "",
  manager: "",
  designation: "",
  salary: "",
  phone: "",
  address: "",
  dateOfJoining: isoDay(),
  leaveBalance: { casual: 12, sick: 10, earned: 15 },
};

const fromEmployee = (e) => ({
  firstName: e.firstName,
  lastName: e.lastName,
  email: e.user?.email || "",
  password: "",
  role: e.user?.role || "employee",
  department: e.department?._id || "",
  manager: e.manager?._id || "",
  designation: e.designation || "",
  salary: e.salary ?? "",
  phone: e.phone || "",
  address: e.address || "",
  dateOfJoining: e.dateOfJoining ? e.dateOfJoining.slice(0, 10) : "",
  leaveBalance: { ...blank.leaveBalance, ...e.leaveBalance },
});

// Used by HR to register (create) or edit an employee. onSubmit receives the API payload.
export default function EmployeeForm({ employee, onSubmit, onCancel, busy, submitLabel }) {
  const editing = Boolean(employee);
  const [f, setF] = useState(() => (editing ? fromEmployee(employee) : blank));
  const { data: departments } = useApi("/departments", []);
  const { data: managers } = useApi("/employees/managers", []);

  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const submit = (e) => {
    e.preventDefault();
    const payload = { ...f, salary: f.salary === "" ? undefined : Number(f.salary) };
    if (editing) delete payload.password;
    if (!editing) delete payload.leaveBalance;
    onSubmit(payload);
  };

  const managerOptions = managers.filter((m) => m._id !== employee?._id);

  return (
    <Form onSubmit={submit}>
      <Row className="g-3">
        <Col sm={6}>
          <Form.Group controlId="ef-first"><Form.Label>First name</Form.Label><Form.Control required value={f.firstName} onChange={set("firstName")} /></Form.Group>
        </Col>
        <Col sm={6}>
          <Form.Group controlId="ef-last"><Form.Label>Last name</Form.Label><Form.Control required value={f.lastName} onChange={set("lastName")} /></Form.Group>
        </Col>
        <Col sm={editing ? 12 : 6}>
          <Form.Group controlId="ef-email"><Form.Label>Work email</Form.Label><Form.Control type="email" required value={f.email} onChange={set("email")} /></Form.Group>
        </Col>
        {!editing && (
          <Col sm={6}>
            <Form.Group controlId="ef-pass">
              <Form.Label>Temporary password</Form.Label>
              <Form.Control type="text" required minLength={6} value={f.password} onChange={set("password")} />
              <Form.Text>Share it with them; they can change it from their profile.</Form.Text>
            </Form.Group>
          </Col>
        )}
        <Col sm={4}>
          <Form.Group controlId="ef-role">
            <Form.Label>Role</Form.Label>
            <Form.Select value={f.role} onChange={set("role")}>
              <option value="employee">Employee</option>
              <option value="manager">Manager</option>
              <option value="hr">HR</option>
            </Form.Select>
          </Form.Group>
        </Col>
        <Col sm={4}>
          <Form.Group controlId="ef-dept">
            <Form.Label>Department</Form.Label>
            <Form.Select value={f.department} onChange={set("department")}>
              <option value="">Not assigned</option>
              {departments.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}
            </Form.Select>
          </Form.Group>
        </Col>
        <Col sm={4}>
          <Form.Group controlId="ef-mgr">
            <Form.Label>Reports to</Form.Label>
            <Form.Select value={f.manager} onChange={set("manager")}>
              <option value="">No manager</option>
              {managerOptions.map((m) => <option key={m._id} value={m._id}>{m.firstName} {m.lastName}</option>)}
            </Form.Select>
          </Form.Group>
        </Col>
        <Col sm={6}>
          <Form.Group controlId="ef-desig"><Form.Label>Designation</Form.Label><Form.Control value={f.designation} onChange={set("designation")} /></Form.Group>
        </Col>
        <Col sm={3}>
          <Form.Group controlId="ef-salary"><Form.Label>Monthly salary (₹)</Form.Label><Form.Control type="number" min="0" value={f.salary} onChange={set("salary")} /></Form.Group>
        </Col>
        <Col sm={3}>
          <Form.Group controlId="ef-doj"><Form.Label>Joining date</Form.Label><Form.Control type="date" value={f.dateOfJoining} onChange={set("dateOfJoining")} /></Form.Group>
        </Col>
        <Col sm={6}>
          <Form.Group controlId="ef-phone"><Form.Label>Phone</Form.Label><Form.Control value={f.phone} onChange={set("phone")} /></Form.Group>
        </Col>
        <Col sm={6}>
          <Form.Group controlId="ef-addr"><Form.Label>Address</Form.Label><Form.Control value={f.address} onChange={set("address")} /></Form.Group>
        </Col>
        {editing && (
          <Col sm={12}>
            <Form.Label as="p" className="mb-1">Leave balance (days)</Form.Label>
            <Row className="g-2">
              {["casual", "sick", "earned"].map((k) => (
                <Col key={k} xs={4}>
                  <Form.Group controlId={`ef-lb-${k}`}>
                    <Form.Label className="small fw-normal text-capitalize">{k}</Form.Label>
                    <Form.Control type="number" min="0" value={f.leaveBalance[k]} onChange={(e) => setF({ ...f, leaveBalance: { ...f.leaveBalance, [k]: e.target.value } })} />
                  </Form.Group>
                </Col>
              ))}
            </Row>
          </Col>
        )}
      </Row>
      <div className="d-flex gap-2 justify-content-end mt-4">
        {onCancel && <Button variant="link" onClick={onCancel}>Cancel</Button>}
        <Button type="submit" disabled={busy}>{submitLabel || (editing ? "Save changes" : "Register employee")}</Button>
      </div>
    </Form>
  );
}
