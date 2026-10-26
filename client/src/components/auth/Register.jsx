import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api, { errMsg } from "../../api/axios";
import EmployeeForm from "../hr/EmployeeForm";

// HR-only: registers a new employee, manager or HR account
export default function Register() {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  const submit = async (payload) => {
    setBusy(true);
    try {
      const { data } = await api.post("/employees", payload);
      toast.success(`${data.firstName} ${data.lastName} registered as ${data.employeeId}`);
      navigate("/hr?tab=employees");
    } catch (err) {
      toast.error(errMsg(err));
      setBusy(false);
    }
  };

  return (
    <div className="register">
      <Link to="/hr?tab=employees" className="back-link"><i className="bi bi-arrow-left" aria-hidden="true" /> Back to employees</Link>
      <div className="page-header">
        <div>
          <h2>Register a new employee</h2>
          <p>This creates their sign-in and their employee record. They can sign in straight away with the temporary password.</p>
        </div>
      </div>
      <section className="panel">
        <EmployeeForm onSubmit={submit} busy={busy} onCancel={() => navigate("/hr?tab=employees")} />
      </section>
    </div>
  );
}
