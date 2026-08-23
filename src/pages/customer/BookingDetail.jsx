import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import Ticket from "../../components/Ticket";
import ConfirmDialog from "../../components/ConfirmDialog";
import { statusLabel } from "../../components/StatusBadge";
import { DetailSkeleton } from "../../components/Skeleton";
import { toast } from "../../components/Toast";
import { money, CLASS_META, canCancelFree } from "../../lib/pricing";

export default function BookingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [b, setB] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [askCancel, setAskCancel] = useState(false);

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

  if (loading) return <DetailSkeleton label="Loading your trip…" />;
  if (!b) return <div className="empty">Manifest not found</div>;

  const states = ["pending", "confirmed", "assigned", "en_route", "completed"];
  let cIdx = states.indexOf(b.status);
  if (cIdx === -1) cIdx = -1; // cancelled

  const handleConfirm = async (method) => {
    if (busy) return;
    setBusy(true);
    const { error } = await supabase.from("bookings").update({ status: 'confirmed', pay_method: method }).eq("id", b.id);
    setBusy(false);
    if (error) return toast("Sorry, we couldn't confirm your booking. Please try again.");
    toast("Your trip is confirmed!");
    load();
  };

  const handleCancel = async () => {
    if (busy) return;
    setBusy(true);
    const free = canCancelFree(b);
    const { error } = await supabase.from("bookings").update({ status: 'cancelled' }).eq("id", b.id);
    setBusy(false);
    setAskCancel(false);
    if (error) return toast("Sorry, we couldn't cancel your booking. Please try again.");
    toast(free ? "Your booking is cancelled. No fee charged." : "Your booking is cancelled. A late fee will apply.");
    load();
  };

  const lateFee = money(Number(b.fare) * 0.2);
  const refund = money(Number(b.fare) * 0.8);
  const showDriver = ["assigned", "en_route", "completed"].includes(b.status);

  return (
    <>
      <button className="back-link" onClick={() => navigate("/app")}>← My Trips</button>
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
                <div className="tl-label">{statusLabel(s)}</div>
              </div>
            ))}
          </div>
        )}

        <div className="action-bar">
          {b.status === "pending" && (
            <>
              <button className="btn btn-solid" disabled={busy} onClick={() => handleConfirm('online')}>Confirm & Pay Online</button>
              <button className="btn" disabled={busy} onClick={() => handleConfirm('cash')}>Confirm (Pay Cash)</button>
            </>
          )}

          {["pending", "confirmed"].includes(b.status) && (
            <button className="btn btn-danger" disabled={busy} onClick={() => setAskCancel(true)}>
              Cancel Booking
            </button>
          )}
        </div>
      </div>
      </div>

      <ConfirmDialog
        open={askCancel}
        title="Cancel this booking?"
        body={canCancelFree(b)
          ? "You're outside the 4-hour cutoff — cancellation is free."
          : <>Late cancellation: a <b>{lateFee} fee (20%)</b> applies. Refund: <b>{refund}</b>.</>}
        confirmLabel="CANCEL BOOKING"
        cancelLabel="KEEP BOOKING"
        busy={busy}
        onConfirm={handleCancel}
        onCancel={() => setAskCancel(false)}
      />
    </>
  );
}
