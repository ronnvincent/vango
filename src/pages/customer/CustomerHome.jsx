import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import StatusBadge from "../../components/StatusBadge";
import { TableSkeleton } from "../../components/Skeleton";
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
        {[["ALL", "All Trips"], ["UPCOMING", "Upcoming"], ["PAST", "Past"], ["CANCELLED", "Cancelled"]].map(([f, label]) => (
          <button key={f} className={`chip ${filter === f ? "active" : ""}`} onClick={() => setFilter(f)}>
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <TableSkeleton rows={4} label="Loading your trips…" />
      ) : filtered.length === 0 ? (
        <div className="empty">
          <p className="empty-msg">You haven't booked any trips yet.</p>
          <button className="btn btn-solid empty-cta" onClick={() => navigate("/app/book/new")}>＋ Book a Van</button>
        </div>
      ) : (
        <>
          <button className="btn btn-solid list-cta" onClick={() => navigate("/app/book/new")}>＋ Book a Van</button>
          <div className="table-wrap">
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
                  <tr
                    key={b.id}
                    tabIndex={0}
                    className="row-link"
                    onClick={() => navigate(`/app/bookings/${b.id}`)}
                    onKeyDown={e => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        navigate(`/app/bookings/${b.id}`);
                      }
                    }}
                  >
                    <td className="ref-cell" data-label="Ref">{b.reference}</td>
                    <td data-label="Route">{b.locations?.short_name} → {b.dropoff?.short_name}</td>
                    <td data-label="Departure">{new Date(b.scheduled_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</td>
                    <td data-label="Status"><StatusBadge status={b.status} /></td>
                    <td data-label="Fare">{money(b.fare)}</td>
                    <td className="arr-cell cell-arrow">→</td>
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