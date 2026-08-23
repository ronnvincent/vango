import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import Ticket from "../../components/Ticket";
import { toast } from "../../components/Toast";
import { money, CLASS_META, canCancelFree } from "../../lib/pricing";

export default function BookingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [b, setB] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = () => {
    supabase.from("bookings").select(`
      *,
      locations!bookings_pickup_id_fkey(short_name),
      dropoff:locations!bookings_dropoff_id_fkey(short_name),
      vans(class, plate),
      driver:profiles!bookings_driver_id_fkey(full_name, phone)
    `).eq("id", id).single()
      .then(({ data }) => {
        setB(data);
        setLoading(false);
      });
  };

  useEffect(load, [id]);

  if (loading) return <div className="lbl">Loading…</div>;
  if (!b) return <div className="empty">Manifest not found</div>;

  const states = ["pending", "confirmed", "assigned", "en_route", "completed"];
  let cIdx = states.indexOf(b.status);
  if (cIdx === -1) cIdx = -1; // cancelled

  const handleConfirm = async (method) => {
    await supabase.from("bookings").update({ status: 'confirmed', pay_method: method }).eq("id", b.id);
    toast(`[ OK ] Manifest confirmed. Payment: ${method}`);
    load();
  };

  const handleCancel = async () => {
    const free = canCancelFree(b);
    if (!free && !confirm("Late cancellation fee (20%) applies. Proceed?")) return;
    await supabase.from("bookings").update({ status: 'cancelled' }).eq("id", b.id);
    toast(`[ OK ] Manifest cancelled${!free ? ' (Fee applied)' : ''}.`);
    load();
  };

  const handleMarkPaid = async () => {
    await supabase.from("bookings").update({ paid: true }).eq("id", b.id);
    toast("[ OK ] Payment recorded.");
    load();
  };

  const showDriver = ["assigned", "en_route", "completed"].includes(b.status);

  return (
    <div className="duo" style={{ alignItems: "start" }}>
      <div>
        <Ticket 
          routeLabel={`${b.locations?.short_name} → ${b.dropoff?.short_name}`}
          distanceKm={b.distance_km}
          classLabel={CLASS_META[b.vans?.class || "cruiser"]?.label}
          pax={String(b.passengers).padStart(2, "0")}
          departLabel={new Date(b.scheduled_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
          fare={money(b.fare)}
          refCode={b.reference}
          stamped={b.status !== 'pending' && b.status !== 'cancelled'}
          stampRef={b.status === 'cancelled' ? 'CANCELLED' : b.status.toUpperCase()}
        />
        {showDriver && (
          <div className="panel" style={{ marginTop: "2rem" }}>
            <div className="lbl" style={{ marginBottom: "1rem" }}>DRIVER ASSIGNED</div>
            <div className="info-row"><span className="lbl">Name</span><b>{b.driver?.full_name || "—"}</b></div>
            <div className="info-row">
              <span className="lbl">Phone</span>
              <b><a href={`tel:${b.driver?.phone}`} style={{ color: "var(--accent)", textDecoration: "underline" }}>{b.driver?.phone || "—"}</a></b>
            </div>
            <div className="info-row"><span className="lbl">Plate</span><b style={{ fontFamily: "'IBM Plex Mono'" }}>{b.vans?.plate || "—"}</b></div>
          </div>
        )}
      </div>
      
      <div>
        <div className="sec-head" style={{ marginTop: 0 }}>
          <h2 style={{ fontSize: "1.4rem" }}>Status</h2>
        </div>
        
        {b.status === "cancelled" ? (
          <div className="empty" style={{ marginTop: "1rem", color: "var(--accent)", borderColor: "var(--accent)" }}>
            Manifest Cancelled
          </div>
        ) : (
          <div className="timeline">
            {states.map((s, i) => (
              <div key={s} className={`tl-item ${i < cIdx ? "done" : ""} ${i === cIdx ? "current" : ""}`}>
                <div className="tl-label">{s.replace("_", " ")}</div>
              </div>
            ))}
          </div>
        )}

        <div className="action-bar">
          {b.status === "pending" && (
            <>
              <button className="btn btn-solid" onClick={() => handleConfirm('online')}>Confirm & Pay Online</button>
              <button className="btn" onClick={() => handleConfirm('cash')}>Confirm (Pay Cash)</button>
            </>
          )}
          
          {b.pay_method === 'online' && !b.paid && ["confirmed", "assigned", "en_route"].includes(b.status) && (
            <button className="btn btn-solid" onClick={handleMarkPaid}>MARK PAID</button>
          )}

          {["pending", "confirmed"].includes(b.status) && (
            <button className="btn" style={{ color: "var(--accent)", borderColor: "var(--accent)" }} onClick={handleCancel}>
              Cancel Booking
            </button>
          )}
        </div>
      </div>
    </div>
  );
}