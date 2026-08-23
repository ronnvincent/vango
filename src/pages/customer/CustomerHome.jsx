import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import StatusBadge from "../../components/StatusBadge";
import { money } from "../../lib/pricing";
import { useAuth } from "../../hooks/useAuth";

export default function CustomerHome() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [filter, setFilter] = useState("UPCOMING");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("bookings").select(`
      *,
      locations!bookings_pickup_id_fkey(short_name),
      dropoff:locations!bookings_dropoff_id_fkey(short_name),
      vans(class)
    `).order("scheduled_at", { ascending: false })
      .then(({ data }) => {
        setBookings(data || []);
        setLoading(false);
      });
  }, [session.user.id]);

  const filtered = bookings.filter(b => {
    if (filter === "ALL") return true;
    if (filter === "CANCELLED") return b.status === "cancelled";
    if (filter === "PAST") return b.status === "completed";
    return ["pending", "confirmed", "assigned", "en_route"].includes(b.status);
  });

  return (
    <>
      <div className="filter-chips">
        {["ALL", "UPCOMING", "PAST", "CANCELLED"].map(f => (
          <button key={f} className={`chip ${filter === f ? "active" : ""}`} onClick={() => setFilter(f)}>
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="lbl">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="empty">
          <p style={{ marginBottom: "1.5rem" }}>No trips on the manifest yet</p>
          <button className="btn btn-solid" onClick={() => navigate("/app/book/new")}>＋ NEW BOOKING</button>
        </div>
      ) : (
        <>
          <button className="btn btn-solid" style={{ marginBottom: "2rem" }} onClick={() => navigate("/app/book/new")}>＋ NEW BOOKING</button>
          <div style={{ overflowX: "auto" }}>
            <table className="table">
              <thead>
                <tr>
                  <th>REF</th>
                  <th>Route</th>
                  <th>Date & Time</th>
                  <th>Status</th>
                  <th>Fare</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(b => (
                  <tr key={b.id} style={{ cursor: "pointer" }} onClick={() => navigate(`/app/bookings/${b.id}`)}>
                    <td style={{ color: "var(--accent)", fontFamily: "'IBM Plex Mono'" }}>{b.reference}</td>
                    <td>{b.locations?.short_name} → {b.dropoff?.short_name}</td>
                    <td>{new Date(b.scheduled_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</td>
                    <td><StatusBadge status={b.status} /></td>
                    <td>{money(b.fare)}</td>
                    <td style={{ textAlign: "right" }}>→</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  );
}