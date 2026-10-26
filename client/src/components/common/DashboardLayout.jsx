import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Dropdown } from "react-bootstrap";
import { useAuth } from "../../context/AuthContext";
import { fullName, roleLabel } from "../../utils/format";
import NotificationBell from "./NotificationBell";
import Avatar from "./Avatar";

// nav: [{ key, label, icon, badge? }]; render(tab, goTo) returns the active screen
export default function DashboardLayout({ nav, render }) {
  const { user, employee, logout } = useAuth();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [menuOpen, setMenuOpen] = useState(false);

  const keys = nav.map((n) => n.key);
  const tab = keys.includes(params.get("tab")) ? params.get("tab") : keys[0];
  const current = nav.find((n) => n.key === tab);

  const goTo = (key) => {
    setParams(key === keys[0] ? {} : { tab: key });
    setMenuOpen(false);
  };

  useEffect(() => {
    document.title = `${current.label} · StaffSync`;
    window.scrollTo(0, 0);
  }, [current.label]);

  const signOut = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className={`shell ${menuOpen ? "menu-open" : ""}`}>
      <aside className="sidebar" aria-label="Main">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">S</span>
          <span>StaffSync</span>
        </div>
        <nav>
          {nav.map((n) => (
            <button
              key={n.key}
              type="button"
              className={`nav-item ${n.key === tab ? "active" : ""}`}
              aria-current={n.key === tab ? "page" : undefined}
              onClick={() => goTo(n.key)}
            >
              <i className={`bi bi-${n.icon}`} aria-hidden="true" />
              <span>{n.label}</span>
              {n.badge > 0 && <span className="nav-badge">{n.badge}</span>}
            </button>
          ))}
        </nav>
        <div className="sidebar-foot">
          <span className="role-chip">{roleLabel[user.role]}</span>
          {employee?.department?.name && <span>{employee.department.name}</span>}
        </div>
      </aside>
      <div className="scrim" onClick={() => setMenuOpen(false)} aria-hidden="true" />

      <div className="main">
        <header className="topbar">
          <button type="button" className="icon-btn menu-btn" aria-label="Open menu" onClick={() => setMenuOpen(true)}>
            <i className="bi bi-list" />
          </button>
          <h1 className="topbar-title">{current.label}</h1>
          <div className="topbar-right">
            <NotificationBell onNavigate={goTo} />
            <Dropdown align="end">
              <Dropdown.Toggle as="button" className="user-btn" aria-label="Account menu">
                <Avatar employee={employee} size={32} />
                <span className="user-name">{employee ? fullName(employee) : user.email}</span>
                <i className="bi bi-chevron-down" aria-hidden="true" />
              </Dropdown.Toggle>
              <Dropdown.Menu>
                <Dropdown.ItemText className="small text-secondary">{user.email}</Dropdown.ItemText>
                {keys.includes("profile") && <Dropdown.Item onClick={() => goTo("profile")}>My profile</Dropdown.Item>}
                <Dropdown.Divider />
                <Dropdown.Item onClick={signOut}>Sign out</Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </div>
        </header>
        <main className="content">{render(tab, goTo)}</main>
      </div>
    </div>
  );
}
