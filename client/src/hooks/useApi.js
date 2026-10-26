import { useCallback, useEffect, useState } from "react";
import api, { errMsg } from "../api/axios";

// GET a URL and keep { data, loading, error }. Pass null to skip.
export default function useApi(url, initial = null) {
  const [data, setData] = useState(initial);
  const [loading, setLoading] = useState(Boolean(url));
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    if (!url) return;
    setLoading(true);
    setError("");
    try {
      const res = await api.get(url);
      setData(res.data);
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setLoading(false);
    }
  }, [url]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { data, setData, loading, error, reload };
}
