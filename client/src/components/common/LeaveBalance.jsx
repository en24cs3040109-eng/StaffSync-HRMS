export default function LeaveBalance({ balance }) {
  if (!balance) return null;
  return (
    <dl className="balance">
      {[
        ["casual", "Casual"],
        ["sick", "Sick"],
        ["earned", "Earned"],
      ].map(([k, label]) => (
        <div key={k}>
          <dt>{label}</dt>
          <dd>{balance[k]}</dd>
        </div>
      ))}
    </dl>
  );
}
