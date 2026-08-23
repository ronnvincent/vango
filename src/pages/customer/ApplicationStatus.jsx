import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import { useAuth } from "../../hooks/useAuth";

export default function ApplicationStatus() {
  const { session, reloadProfile } = useAuth();
  const navigate = useNavigate();
  const [app, setApp] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session?.user?.id) return;
    supabase.from("driver_applications")
      .select("*")
      .eq("applicant", session.user.id)
      .maybeSingle()
      .then(({ data }) => {
        setApp(data);
        setLoading(false);
      });
  }, [session?.user?.id]);

  if (loading) return <div className="lbl">Loading…</div>;

  if (!app) return (
    <div className="empty">No application on file.</div>
  );

  const badge =
    app.status === "approved" ? "badge-completed"
    : app.status === "rejected" ? "badge-cancelled"
    : "badge-pending";

  return (
    <div className="panel" style={{ maxWidth: "560px" }}>
      <div className="lbl" style={{ marginBottom: "1rem" }}>DRIVER APPLICATION</div>
      <span className={`badge ${badge}`}>{app.status}</span>

      <div style={{ marginTop: "1.4rem" }}>
        <div className="info-row"><span className="lbl">Submitted</span><b>{new Date(app.created_at).toLocaleDateString()}</b></div>
        <div className="info-row"><span className="lbl">License No.</span><b>{app.license_number}</b></div>
        <div className="info-row"><span className="lbl">License Expiry</span><b>{new Date(app.license_expiry).toLocaleDateString()}</b></div>
        <div className="info-row"><span className="lbl">Experience</span><b>{app.years_experience} {app.years_experience === 1 ? "year" : "years"}</b></div>
      </div>

      {app.status === "pending" && (
        <p className="lbl" style={{ textTransform: "none", marginTop: "1.4rem", color: "rgba(23,21,18,.75)" }}>
          Dispatch reviews applications within 24 hours. You'll keep full customer access meanwhile.
        </p>
      )}

      {app.status === "rejected" && (
        <>
          {app.reviewer_note && (
            <p className="lbl" style={{ textTransform: "none", marginTop: "1.4rem", color: "var(--accent)" }}>
              Note from dispatch: {app.reviewer_note}
            </p>
          )}
          <p className="lbl" style={{ textTransform: "none", marginTop: "1rem" }}>
            Questions? Call dispatch — <a href="tel:+15550000000" style={{ textDecoration: "underline", color: "var(--accent)" }}>+1 (555) 000-0000</a>.
          </p>
        </>
      )}

      {app.status === "approved" && (
        <button
          className="btn btn-solid"
          style={{ marginTop: "1.6rem", width: "100%", padding: "1rem" }}
          onClick={async () => {
            await reloadProfile();
            navigate("/driver");
          }}
        >
          Open your driver dashboard
        </button>
      )}
    </div>
  );
}
