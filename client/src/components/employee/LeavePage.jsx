import { useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import LeaveApply from "./LeaveApply";
import LeaveList from "./LeaveList";
import LeaveBalance from "../common/LeaveBalance";

// Leave tab: balance, the request form and the request history
export default function LeavePage() {
  const { employee } = useAuth();
  const list = useRef(null);
  return (
    <div className="stack">
      <section className="panel">
        <div className="panel-head"><h3>Leave balance</h3><span className="muted small">Days left this year</span></div>
        <LeaveBalance balance={employee?.leaveBalance} />
      </section>
      <div className="grid-2">
        <LeaveApply onApplied={() => list.current?.reload()} />
        <LeaveList ref={list} />
      </div>
    </div>
  );
}
