import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import StatusBadge from "../../components/StatusBadge";
import { TableSkeleton } from "../../components/Skeleton";
import { money } from "../../lib/pricing";

export default function AdminBookings() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [statusFilt, setStatusFilt] = useState("");
  const [dateFilt, setDateFilt] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    supabase.from("bookings").select(`
      *,
      locations!bookings_pickup_id_fkey(short_name),
      dropoff:locations!bookings_dropoff_id_fkey(short_name),
      customer:profiles!bookings_customer_id_fkey(full_name)
    `).order("scheduled_at", { ascending: false })
      .then(({ data }) => {
        setBookings(data || []);
        setLoading(false);
      });
  }, []);

  const filtered = bookings.filter(b => {
    if (statusFilt && b.status !== statusFilt) return false;
    if (dateFilt && !b.scheduled_at.startsWith(dateFilt)) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!b.reference.toLowerCase().includes(q) && !(b.customer?.full_name || "").toLowerCase().includes(q)) return false;
    }
    return true;
  });

  return (
    <>
      <div className="panel" style={{ marginBottom: "2rem", display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "flex-end" }}>
        <div className="field" style={{ margin: 0, flex: 1, minWidth: "150px" }}>
          <label>Search (REF / Name)</label>
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="e.g. VG-1234" />
        </div>
        <div className="field" style={{ margin: 0, flex: 1, minWidth: "150px" }}>
          <label>Status</label>
          <select value={statusFilt} onChange={e => setStatusFilt(e.target.value)}>
            <option value="">ALL STATUSES</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="assigned">Assigned</option>
            <option value="en_route">En Route</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        <div className="field" style={{ margin: 0, flex: 1, minWidth: "150px" }}>
          <label>Date</label>
          <input type="date" value={dateFilt} onChange={e => setDateFilt(e.target.value)} />
        </div>
      </div>

      {loading ? (
        <TableSkeleton rows={6} label="Loading bookings…" />
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table className="table">
            <thead>
              <tr>
                <th>REF</th>
                <th>Customer</th>
                <th>Route</th>
                <th>Time</th>
                <th>Status</th>
                <th>Fare</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(b => (
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
                  <td data-label="Customer">{b.customer?.full_name}</td>
                  <td data-label="Route">{b.locations?.short_name} → {b.dropoff?.short_name}</td>
                  <td data-label="Departure">{new Date(b.scheduled_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</td>
                  <td data-label="Status"><StatusBadge status={b.status} /></td>
                  <td data-label="Fare">{money(b.fare)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}