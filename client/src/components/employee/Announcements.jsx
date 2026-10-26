import useApi from "../../hooks/useApi";
import AnnouncementFeed from "../common/AnnouncementFeed";
import Loading from "../common/Loading";
import PageHeader from "../common/PageHeader";

export default function Announcements() {
  const { data, loading, error } = useApi("/announcements", []);
  return (
    <>
      <PageHeader title="Announcements" subtitle="Company news and updates for you and your department." />
      <section className="panel">
        {loading ? <Loading /> : error ? <p className="text-danger">{error}</p> : <AnnouncementFeed items={data} />}
      </section>
    </>
  );
}
