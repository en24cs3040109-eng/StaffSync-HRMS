import { Link, Navigate } from "react-router-dom";
import { useAuth, homeFor } from "../context/AuthContext";
import Loading from "./common/Loading";

export default function Home() {
  const { user, loading } = useAuth();
  if (loading) return <Loading full />;
  if (user) return <Navigate to={homeFor(user.role)} replace />;

  return (
    <div className="auth">
      <section className="auth-side">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">S</span>
          <span>StaffSync</span>
        </div>
        <div>
          <h1>Your workday, leave and team in one place.</h1>
          <p>StaffSync handles the everyday HR work: checking in, asking for time off, approving requests and keeping everyone informed.</p>
          <div className="home-actions">
            <Link to="/login" className="btn btn-checkin btn-lg">Sign in</Link>
          </div>
        </div>
        <p className="small">Accounts are created by your HR team.</p>
      </section>
      <section className="auth-main">
        <div className="auth-card">
          <h2>What you can do</h2>
          <ul className="auth-points" style={{ display: "flex", color: "var(--text)" }}>
            <li><i className="bi bi-fingerprint" aria-hidden="true" /><span><strong>Employees</strong> check in and out, apply for leave, see announcements and their training.</span></li>
            <li><i className="bi bi-people" aria-hidden="true" /><span><strong>Managers</strong> approve leave for their team, follow attendance and assign training.</span></li>
            <li><i className="bi bi-building" aria-hidden="true" /><span><strong>HR</strong> keeps employee records, reviews all leave, tracks attendance and posts updates.</span></li>
          </ul>
        </div>
      </section>
    </div>
  );
}
