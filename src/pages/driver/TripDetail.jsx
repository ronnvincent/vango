import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import Ticket from "../../components/Ticket";
import { toast } from "../../components/Toast";
import { money, CLASS_META } from "../../lib/pricing";

export default function TripDetail() {
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
      customer:profiles!bookings_customer_id_fkey(full_name, phone)
    `).eq("id", id).single()
      .then(({ data }) => {
        setB(data);
        setLoading(false);
      });
  };

  useEffect(load, [id]);

  if (loading) return <div className="lbl">Loading…</div>;
  if (!b) return <div className="empty">Trip not found</div>;

  const handleStart = async () => {
    await supabase.from("bookings").update({ status: 'en_route' }).eq("id", b.id);
    toast("[ OK ] Trip started.");
    load();
  };

  const handleComplete = async () => {
    const updates = { status: 'completed' };
    if (b.pay_method === 'cash') updates.paid = true;
    
    await supabase.from("bookings").update(updates).eq("id", b.id);
    toast(`[ OK ] Trip closed out.${b.pay_method === 'cash' ? ' Cash collected.' : ''}`);
    navigate("/driver");
  };

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
          stamped={true}
          stampRef={b.status.toUpperCase()}
        />
      </div>
      
      <div>
        <div className="panel" style={{ marginBottom: "2rem" }}>
          <div className="lbl" style={{ marginBottom: "1rem" }}>CUSTOMER INFO</div>
          <div className="info-row"><span className="lbl">Name</span><b>{b.customer?.full_name || "—"}</b></div>
          <div className="info-row">
            <span className="lbl">Phone</span>
            <b><a href={`tel:${b.customer?.phone}`} style={{ color: "var(--accent)", textDecoration: "underline" }}>{b.customer?.phone || "—"}</a></b>
          </div>
          <div className="info-row"><span className="lbl">Pay Method</span><b>{b.pay_method.toUpperCase()} {b.paid ? "(PAID)" : "(PENDING)"}</b></div>
        </div>

        <div className="panel" style={{ background: "var(--ink)", color: "var(--paper)", borderColor: "var(--ink)" }}>
          <div className="lbl" style={{ marginBottom: "1rem", color: "var(--paper)" }}>DISPATCH CONTROLS</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {b.status === "assigned" && (
              <button className="btn btn-solid" style={{ background: "var(--paper)", color: "var(--ink)" }} onClick={handleStart}>
                START TRIP
              </button>
            )}
            {b.status === "en_route" && (
              <button className="btn btn-solid" style={{ background: "var(--accent)", color: "var(--paper)", borderColor: "var(--accent)" }} onClick={handleComplete}>
                COMPLETE {b.pay_method === 'cash' ? '& LOG CASH' : ''}
              </button>
            )}
            {b.status === "completed" && (
              <div className="lbl" style={{ color: "var(--ok)", textAlign: "center", padding: "1rem" }}>TRIP COMPLETED</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}