import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Button, Form, Modal, Table } from "react-bootstrap";
import toast from "react-hot-toast";
import api, { errMsg } from "../../api/axios";
import useApi from "../../hooks/useApi";
import { fmtMoney, fullName, roleLabel } from "../../utils/format";
import EmployeeForm from "./EmployeeForm";
import Avatar from "../common/Avatar";
import StatusBadge from "../common/StatusBadge";
import EmptyState from "../common/EmptyState";
import Loading from "../common/Loading";
import PageHeader from "../common/PageHeader";

export default function EmployeeCRUD() {
  const { data, loading, error, reload } = useApi("/employees", []);
  const { data: departments } = useApi("/departments", []);
  const [q, setQ] = useState("");
  const [dept, setDept] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("active");
  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState(false);

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    return data.filter((e) => {
      if (dept && e.department?._id !== dept) return false;
      if (role && e.user?.role !== role) return false;
      if (status === "active" && !e.user?.isActive) return false;
      if (status === "inactive" && e.user?.isActive) return false;
      if (!term) return true;
      return [fullName(e), e.employeeId, e.designation, e.user?.email].some((v) => v?.toLowerCase().includes(term));
    });
  }, [data, q, dept, role, status]);

  const save = async (payload) => {
    setBusy(true);
    try {
      await api.put(`/employees/${editing._id}`, payload);
      toast.success("Employee updated");
      setEditing(null);
      reload();
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  const setActive = async (e, active) => {
    if (!active && !window.confirm(`Deactivate ${fullName(e)}? They won't be able to sign in. Their records are kept.`)) return;
    try {
      if (active) await api.put(`/employees/${e._id}`, { isActive: true });
      else await api.delete(`/employees/${e._id}`);
      toast.success(active ? "Account reactivated" : "Account deactivated");
      reload();
    } catch (err) {
      toast.error(errMsg(err));
    }
  };

  return (
    <>
      <PageHeader title="Employees" subtitle="Everyone with a StaffSync account. Deactivated people keep their history but can't sign in.">
        <Link to="/register" className="btn btn-primary"><i className="bi bi-person-plus me-2" aria-hidden="true" />Register employee</Link>
      </PageHeader>

      <section className="panel panel-flush">
        <div className="panel-bar">
          <Form.Control size="sm" type="search" placeholder="Search name, ID, email" aria-label="Search employees" className="w-auto flex-grow-1" style={{ maxWidth: 280 }} value={q} onChange={(e) => setQ(e.target.value)} />
          <Form.Select size="sm" className="w-auto" aria-label="Department" value={dept} onChange={(e) => setDept(e.target.value)}>
            <option value="">All departments</option>
            {departments.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}
          </Form.Select>
          <Form.Select size="sm" className="w-auto" aria-label="Role" value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="">All roles</option>
            <option value="employee">Employees</option>
            <option value="manager">Managers</option>
            <option value="hr">HR</option>
          </Form.Select>
          <Form.Select size="sm" className="w-auto" aria-label="Account status" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="active">Active</option>
            <option value="inactive">Deactivated</option>
            <option value="">All</option>
          </Form.Select>
          <span className="muted small ms-auto">{rows.length} of {data.length}</span>
        </div>

        {loading ? (
          <Loading />
        ) : error ? (
          <p className="text-danger p-3">{error}</p>
        ) : rows.length === 0 ? (
          <EmptyState icon="people" title="No one matches">Clear the search or filters to see everyone.</EmptyState>
        ) : (
          <div className="table-wrap">
            <Table hover className="data-table">
              <thead>
                <tr><th>Name</th><th>Role</th><th>Department</th><th>Reports to</th><th>Phone</th><th className="num">Salary</th><th>Status</th><th aria-label="Actions" /></tr>
              </thead>
              <tbody>
                {rows.map((e) => (
                  <tr key={e._id} className={e.user?.isActive ? "" : "row-muted"}>
                    <td>
                      <div className="person">
                        <Avatar employee={e} size={34} />
                        <div>
                          <strong>{fullName(e)}</strong>
                          <span className="sub">{e.employeeId}, {e.designation || "no designation"}</span>
                        </div>
                      </div>
                    </td>
                    <td>{roleLabel[e.user?.role]}</td>
                    <td>{e.department?.name || "—"}</td>
                    <td className="nowrap">{e.manager ? fullName(e.manager) : "—"}</td>
                    <td className="nowrap">{e.phone || "—"}</td>
                    <td className="num nowrap">{fmtMoney(e.salary)}</td>
                    <td><StatusBadge status={e.user?.isActive ? "active" : "inactive"} /></td>
                    <td className="actions">
                      <Button size="sm" variant="outline-primary" onClick={() => setEditing(e)}>Edit</Button>
                      {e.user?.isActive ? (
                        <Button size="sm" variant="outline-danger" onClick={() => setActive(e, false)}>Deactivate</Button>
                      ) : (
                        <Button size="sm" variant="outline-success" onClick={() => setActive(e, true)}>Reactivate</Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        )}
      </section>

      <Modal show={Boolean(editing)} onHide={() => setEditing(null)} size="lg" centered>
        <Modal.Header closeButton><Modal.Title as="h3">Edit {editing && fullName(editing)}</Modal.Title></Modal.Header>
        <Modal.Body>
          {editing && <EmployeeForm key={editing._id} employee={editing} onSubmit={save} onCancel={() => setEditing(null)} busy={busy} />}
        </Modal.Body>
      </Modal>
    </>
  );
}
