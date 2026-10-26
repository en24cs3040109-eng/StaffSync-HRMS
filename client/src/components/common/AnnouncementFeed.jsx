import { fmtDate, audienceLabel } from "../../utils/format";
import EmptyState from "./EmptyState";

export default function AnnouncementFeed({ items, compact, renderActions }) {
  if (!items?.length) {
    return <EmptyState icon="megaphone" title="No announcements yet">New company and team updates will show up here.</EmptyState>;
  }
  return (
    <ul className={`feed ${compact ? "feed-compact" : ""}`}>
      {items.map((a) => (
        <li key={a._id} className={a.pinned ? "pinned" : ""}>
          <div className="feed-head">
            <h3>
              {a.pinned && <i className="bi bi-pin-angle-fill me-2" title="Pinned" aria-label="Pinned" />}
              {a.title}
            </h3>
            {renderActions?.(a)}
          </div>
          {!compact && <p className="feed-body">{a.content}</p>}
          <p className="feed-meta">
            {a.authorName || "HR"}, {fmtDate(a.createdAt)}
            {a.audience && a.audience !== "all" && (
              <span className="tag">
                {a.audience === "department" ? a.department?.name || "Department" : audienceLabel[a.audience]}
              </span>
            )}
          </p>
        </li>
      ))}
    </ul>
  );
}
