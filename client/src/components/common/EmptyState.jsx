export default function EmptyState({ icon = "inbox", title, children }) {
  return (
    <div className="empty">
      <i className={`bi bi-${icon}`} aria-hidden="true" />
      <p className="empty-title">{title}</p>
      {children && <div className="empty-body">{children}</div>}
    </div>
  );
}
