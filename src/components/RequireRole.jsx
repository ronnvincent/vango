import { Navigate } from "react-router-dom";
import { useAuth, homeFor } from "../hooks/useAuth";
export default function RequireRole({ role, children }){
  const { session, profile, loading } = useAuth();
  if (loading) return <div className="main"><span className="lbl">Signing you in…</span></div>;
  if (!session) return <Navigate to="/login" replace />;
  if (!profile) return <div className="main"><span className="lbl">Profile missing — contact dispatch.</span></div>;
  if (profile.role !== role && profile.role !== "admin")
    return <Navigate to={homeFor(profile.role)} replace />;
  return children;
}