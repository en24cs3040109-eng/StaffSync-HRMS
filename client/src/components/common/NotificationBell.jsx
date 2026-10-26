import { useCallback, useEffect, useState } from "react";
import { Dropdown } from "react-bootstrap";
import api from "../../api/axios";
import { timeAgo } from "../../utils/format";

// API notification links → dashboard tab keys
const tabForLink = {
  "/leaves": "leave",
  "/manager/leaves": "approvals",
  "/hr/leaves": "approvals",
  "/trainings": "training",
  "/announcements": "announcements",
};

const iconFor = { leave: "calendar2-check", announcement: "megaphone", training: "mortarboard", general: "bell" };

export default function NotificationBell({ onNavigate }) {
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get("/notifications");
      setItems(data.items);
      setUnread(data.unreadCount);
    } catch {
      /* the bell stays quiet if the request fails */
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, [load]);

  const open = async (n) => {
    if (!n.read) {
      await api.patch(`/notifications/${n._id}/read`).catch(() => {});
      load();
    }
    const tab = tabForLink[n.link];
    if (tab) onNavigate(tab);
  };

  const readAll = async () => {
    await api.patch("/notifications/read-all").catch(() => {});
    load();
  };

  return (
    <Dropdown align="end" onToggle={(show) => show && load()}>
      <Dropdown.Toggle as="button" className="icon-btn bell" aria-label={`Notifications, ${unread} unread`}>
        <i className="bi bi-bell" />
        {unread > 0 && <span className="bell-count">{unread > 9 ? "9+" : unread}</span>}
      </Dropdown.Toggle>
      <Dropdown.Menu className="notif-menu">
        <div className="notif-head">
          <strong>Notifications</strong>
          {unread > 0 && (
            <button type="button" className="link-btn" onClick={readAll}>
              Mark all as read
            </button>
          )}
        </div>
        {items.length === 0 && <p className="notif-empty">You're all caught up.</p>}
        {items.slice(0, 12).map((n) => (
          <Dropdown.Item key={n._id} as="button" className={`notif ${n.read ? "" : "unread"}`} onClick={() => open(n)}>
            <i className={`bi bi-${iconFor[n.type] || "bell"}`} aria-hidden="true" />
            <span>
              <span className="notif-msg">{n.message}</span>
              <span className="notif-time">{timeAgo(n.createdAt)}</span>
            </span>
          </Dropdown.Item>
        ))}
      </Dropdown.Menu>
    </Dropdown>
  );
}
