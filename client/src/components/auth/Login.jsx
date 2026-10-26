import { useState } from "react";
import { Navigate, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { Form, Button, Alert } from "react-bootstrap";
import { useAuth, homeFor } from "../../context/AuthContext";
import { errMsg } from "../../api/axios";

// Seeded demo accounts (server: npm run seed)
const DEMO = [
  ["HR", "hr@staffsync.com"],
  ["Manager", "manager.eng@staffsync.com"],
  ["Employee", "amit@staffsync.com"],
];

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to={homeFor(user.role)} replace />;

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const u = await login(form.email, form.password);
      const from = location.state?.from;
      navigate(from && from.startsWith(homeFor(u.role)) ? from : homeFor(u.role), { replace: true });
    } catch (err) {
      setError(errMsg(err));
      setBusy(false);
    }
  };

  return (
    <div className="auth">
      <section className="auth-side">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">S</span>
          <span>StaffSync</span>
        </div>
        <div>
          <h1>Good to see you.</h1>
          <p>Sign in to check in for the day, manage leave and see what's new at work.</p>
        </div>
        <p className="small">Forgot your password? Ask your HR team to reset it.</p>
      </section>

      <section className="auth-main">
        <div className="auth-card">
          <h2>Sign in</h2>
          <p className="muted mb-4">Use the work email HR registered for you.</p>
          {params.get("expired") && !error && <Alert variant="warning">Your session ended. Please sign in again.</Alert>}
          {error && <Alert variant="danger">{error}</Alert>}
          <Form onSubmit={submit} noValidate={false}>
            <Form.Group className="mb-3" controlId="login-email">
              <Form.Label>Email</Form.Label>
              <Form.Control type="email" autoComplete="username" required autoFocus value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </Form.Group>
            <Form.Group className="mb-4" controlId="login-password">
              <Form.Label>Password</Form.Label>
              <Form.Control type="password" autoComplete="current-password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            </Form.Group>
            <Button type="submit" size="lg" className="w-100" disabled={busy}>
              {busy ? "Signing in…" : "Sign in"}
            </Button>
          </Form>

          <div className="demo">
            <p>Demo accounts, password <code>password123</code>:</p>
            <div className="demo-list">
              {DEMO.map(([label, email]) => (
                <button key={email} type="button" onClick={() => setForm({ email, password: "password123" })}>
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
