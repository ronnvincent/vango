import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import StatusBadge from "../../components/StatusBadge";
import { useAuth } from "../../hooks/useAuth";
import { money } from "../../lib/pricing";

export default function DriverHome() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [manifest, setManifest] = useState([]);
  const [earnings, setEarnings] = useState({ count: 0, collected: 0, outstanding: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch today's assigned manifest
    const fetchManifest = supabase.from("bookings").select(`
      *,
      locations!bookings_pickup_id_fkey(short_name),
      dropoff:locations!bookings_dropoff_id_fkey(short_name),
      vans(class)
    `)
    .eq("driver_id", session.user.id)
    .in("status", ["assigned", "en_route"])
    .order("scheduled_at", { ascending: true });

    // Fetch this month's earnings
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const fetchEarnings = supabase.from("bookings").select("*")
      .eq("driver_id", session.user.id)
      .eq("status", "completed")
      .gte("scheduled_at", firstDay);

    Promise.all([fetchManifest, fetchEarnings]).then(([mRes, eRes]) => {
      setManifest(mRes.data || []);
      
      const comp = eRes.data || [];
      const collected = comp.filter(b => b.paid).reduce((s, b) => s + Number(b.fare), 0);
      const outstanding = comp.filter(b => !b.paid && b.pay_method === 'cash').reduce((s, b) => s + Number(b.fare), 0);
      setEarnings({ count: comp.length, collected, outstanding });
      
      setLoading(false);
    });
  }, [session.user.id]);

  if (loading) return <div className="lbl">Loading…</div>;

  return (
    <>
      <div className="kpi-grid">
        <div className="panel kpi">
          <span className="lbl">Completed (This Month)</span>
          <b>{earnings.count}</b>
        </div>
        <div className="panel kpi">
          <span className="lbl">Fares Collected</span>
          <b>{money(earnings.collected)}</b>
        </div>
        <div className="panel kpi" style={{ borderColor: earnings.outstanding > 0 ? "var(--accent)" : "var(--ink)" }}>
          <span className="lbl" style={{ color: earnings.outstanding > 0 ? "var(--accent)" : "inherit" }}>Outstanding Cash</span>
          <b><em style={{ color: earnings.outstanding > 0 ? "var(--accent)" : "inherit" }}>{money(earnings.outstanding)}</em></b>
        </div>
      </div>

      <h2 className="section-title">Today's Manifest</h2>

      {manifest.length === 0 ? (
        <div className="empty">Nothing assigned yet — dispatch will call.</div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table className="table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Route</th>
                <th>Pax</th>
                <th>Class</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {manifest.map(b => (
                <tr key={b.id} style={{ cursor: "pointer" }} onClick={() => navigate(`/driver/trips/${b.id}`)}>
                  <td style={{ fontFamily: "'IBM Plex Mono'", fontWeight: 500 }}>
                    {new Date(b.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td>{b.locations?.short_name} → {b.dropoff?.short_name}</td>
                  <td>{String(b.passengers).padStart(2, "0")}</td>
                  <td>{b.vans?.class.toUpperCase()}</td>
                  <td><StatusBadge status={b.status} /></td>
                  <td style={{ textAlign: "right", color: "var(--accent)" }}>OPEN →</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}