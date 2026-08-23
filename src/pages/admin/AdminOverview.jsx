import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import StatusBadge from "../../components/StatusBadge";
import { TableSkeleton, CardsSkeleton } from "../../components/Skeleton";
import { money } from "../../lib/pricing";

export default function AdminOverview() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ today: 0, revenue: 0, vans: 0, drivers: 0 });
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const firstDay = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

    Promise.all([
      supabase.from("bookings").select("*").gte("scheduled_at", todayStr),
      supabase.from("bookings").select("fare").eq("status", "completed").gte("scheduled_at", firstDay),
      supabase.from("vans").select("id").eq("status", "available"),
      supabase.from("profiles").select("id").eq("role", "driver").eq("on_duty", true),
      supabase.from("bookings").select(`
        *,
        locations!bookings_pickup_id_fkey(short_name),
        dropoff:locations!bookings_dropoff_id_fkey(short_name)
      `).order("created_at", { ascending: false }).limit(10)
    ]).then(([bRes, rRes, vRes, dRes, recRes]) => {
      setStats({
        today: bRes.data?.length || 0,
        revenue: (rRes.data || []).reduce((s, b) => s + Number(b.fare), 0),
        vans: vRes.data?.length || 0,
        drivers: dRes.data?.length || 0
      });
      setRecent(recRes.data || []);
      setLoading(false);
    });
  }, []);

  if (loading) return (
    <>
      <CardsSkeleton n={4} label="Loading the overview…" />
      <TableSkeleton rows={4} />
    </>
  );

  return (
    <>
      <div className="kpi-grid">
        <div className="panel kpi">
          <span className="lbl">Bookings (Today)</span>
          <b>{stats.today}</b>
        </div>
        <div className="panel kpi">
          <span className="lbl">Revenue (Month)</span>
          <b>{money(stats.revenue)}</b>
        </div>
        <div className="panel kpi">
          <span className="lbl">Active Vans</span>
          <b>{stats.vans}</b>
        </div>
        <div className="panel kpi">
          <span className="lbl">Drivers on Duty</span>
          <b>{stats.drivers}</b>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <h2 className="section-title" style={{ marginBottom: "1rem" }}>Recent Bookings</h2>
        <Link to="/admin/bookings" className="lbl" style={{ color: "var(--accent)", marginBottom: "1.5rem" }}>VIEW ALL →</Link>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table className="table">
          <thead>
            <tr>
              <th>REF</th>
              <th>Route</th>
              <th>Time</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {recent.map(b => (
              <tr
                key={b.id}
                tabIndex={0}
                className="row-link"
                onClick={() => navigate(`/admin/bookings/${b.id}`)}
                onKeyDown={e => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    navigate(`/admin/bookings/${b.id}`);
                  }
                }}
              >
                <td className="ref-cell" data-label="Ref">{b.reference}</td>
                <td data-label="Route">{b.locations?.short_name} → {b.dropoff?.short_name}</td>
                <td data-label="Time">{new Date(b.scheduled_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</td>
                <td data-label="Status"><StatusBadge status={b.status} /></td>
                <td className="arr-cell cell-arrow">→</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}