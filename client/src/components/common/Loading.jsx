import { Spinner } from "react-bootstrap";

export default function Loading({ full, label = "Loading" }) {
  return (
    <div className={full ? "loading loading-full" : "loading"} role="status">
      <Spinner animation="border" size="sm" />
      <span>{label}…</span>
    </div>
  );
}
