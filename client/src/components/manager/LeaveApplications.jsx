import LeaveReviewTable from "../common/LeaveReviewTable";
import PageHeader from "../common/PageHeader";

// Managers only see requests from people who report to them
export default function LeaveApplications({ onReviewed }) {
  return (
    <>
      <PageHeader title="Leave applications" subtitle="Requests from your team. The employee is notified as soon as you decide." />
      <LeaveReviewTable onReviewed={onReviewed} />
    </>
  );
}
