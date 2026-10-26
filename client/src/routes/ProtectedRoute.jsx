import { Navigate, useLocation } from "react-router-dom";
import { useAuth, homeFor } from "../context/AuthContext";
import Loading from "../components/common/Loading";

// allowedRoles uses the API's role names: "hr", "manager", "employee"
export default function ProtectedRoute({ allowedRoles, children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <Loading full />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to={homeFor(user.role)} replace />;
  return children;
}
