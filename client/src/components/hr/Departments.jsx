import { useState } from "react";
import { Button, Form, Table } from "react-bootstrap";
import toast from "react-hot-toast";
import api, { errMsg } from "../../api/axios";
import useApi from "../../hooks/useApi";
import { fullName } from "../../utils/format";
import Loading from "../common/Loading";
import PageHeader from "../common/PageHeader";

export default function Departments() {
  const { data, loading, reload } = useApi("/departments", []);
  const [form, setForm] = useState({ name: "", description: "" });
  const [edit, setEdit] = useState(null); // { _id, name, description }

  const create = async (e) => {
    e.preventDefault();
    try {
      await api.post("/departments", form);
      toast.success(`${form.name} added`);
      setForm({ name: "", description: "" });
      reload();
    } catch (err) {
      toast.error(errMsg(err));
    }
  };

  const save = async () => {
    try {
      await api.put(`/departments/${edit._id}`, { name: edit.name, description: edit.description });
      toast.success("Department saved");
      setEdit(null);
      reload();
    } catch (err) {
      toast.error(errMsg(err));
    }
  };

  const remove = async (d) => {
    if (!window.confirm(`Delete ${d.name}?`)) return;
    try {
      await api.delete(`/departments/${d._id}`);
      toast.success(`${d.name} deleted`);
      reload();
    } catch (err) {
      toast.error(errMsg(err));
    }
  };

  return (
    <>
      <PageHeader title="Departments" subtitle="A department can only be deleted once nobody is assigned to it." />
      <div className="grid-2">
        <section className="panel">
          <h3 className="panel-title">Add a department</h3>
          <Form onSubmit={create}>
            <Form.Group className="mb-3" controlId="d-name">
              <Form.Label>Name</Form.Label>
              <Form.Control required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </Form.Group>
            <Form.Group className="mb-3" controlId="d-desc">
              <Form.Label>Description</Form.Label>
              <Form.Control as="textarea" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </Form.Group>
            <Button type="submit">Add department</Button>
          </Form>
        </section>

        <section className="panel panel-flush">
          {loading ? (
            <Loading />
          ) : (
            <div className="table-wrap">
              <Table className="data-table">
                <thead><tr><th>Department</th><th>Head</th><th className="num">People</th><th aria-label="Actions" /></tr></thead>
                <tbody>
                  {data.map((d) =>
                    edit?._id === d._id ? (
                      <tr key={d._id}>
                        <td colSpan={3}>
                          <Form.Control size="sm" className="mb-2" aria-label="Name" value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} />
                          <Form.Control size="sm" aria-label="Description" value={edit.description || ""} onChange={(e) => setEdit({ ...edit, description: e.target.value })} />
                        </td>
                        <td className="actions">
                          <Button size="sm" onClick={save}>Save</Button>
                          <Button size="sm" variant="link" onClick={() => setEdit(null)}>Cancel</Button>
                        </td>
                      </tr>
                    ) : (
                      <tr key={d._id}>
                        <td><strong>{d.name}</strong>{d.description && <span className="sub">{d.description}</span>}</td>
                        <td>{d.head ? fullName(d.head) : "—"}</td>
                        <td className="num">{d.employeeCount}</td>
                        <td className="actions">
                          <Button size="sm" variant="outline-primary" onClick={() => setEdit({ _id: d._id, name: d.name, description: d.description })}>Edit</Button>
                          <Button size="sm" variant="outline-danger" disabled={d.employeeCount > 0} title={d.employeeCount ? "Move people out first" : undefined} onClick={() => remove(d)}>Delete</Button>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </Table>
            </div>
          )}
        </section>
      </div>
    </>
  );
}
