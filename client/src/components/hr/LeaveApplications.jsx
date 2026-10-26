import LeaveReviewTable from "../common/LeaveReviewTable";
import PageHeader from "../common/PageHeader";

// HR sees every request in the company
export default function LeaveApplications({ onReviewed }) {
  return (
    <>
      <PageHeader title="Leave applications" subtitle="Every leave request in the company. Approving deducts the days from the employee's balance." />
      <LeaveReviewTable showDepartment onReviewed={onReviewed} />
    </>
  );
}
