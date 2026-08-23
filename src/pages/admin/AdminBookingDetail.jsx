import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import Ticket from "../../components/Ticket";
import { toast } from "../../components/Toast";
import { money, CLASS_META } from "../../lib/pricing";

export default function AdminBookingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [b, setB] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [vans, setVans] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [selVan, setSelVan] = useState("");
  const [selDriver, setSelDriver] = useState("");

  const load = () => {
    supabase.from("bookings").select(`
      *,
      locations!bookings_pickup_id_fkey(short_name),
      dropoff:locations!bookings_dropoff_id_fkey(short_name),
      vans(class, plate),
      customer:profiles!bookings_customer_id_fkey(full_name, phone),
      driver:profiles!bookings_driver_id_fkey(full_name, phone)
    `).eq("id", id).single()
      .then(({ data }) => {
        setB(data);
        if (data && data.status === "confirmed") {
          Promise.all([
            supabase.from("vans").select("*").eq("status", "available"),
            supabase.from("profiles").select("*").eq("role", "driver")
          ]).then(([vRes, dRes]) => {
            setVans(vRes.data || []);
            setDrivers(dRes.data || []);
          });
        }
        setLoading(false);
      });
  };

  useEffect(load, [id]);

  if (loading) return <div className="lbl">Loading…</div>;
  if (!b) return <div className="empty">Manifest not found</div>;

  const handleAssign = async () => {
    if (!selVan || !selDriver) return toast("Select both van and driver.");
    await supabase.from("bookings").update({ status: 'assigned', van_id: selVan, driver_id: selDriver }).eq("id", b.id);
    toast("[ OK ] Assignment logged. Driver notified.");
    load();
  };

  const handleCancel = async () => {
    if (!confirm("Cancel this manifest?")) return;
    await supabase.from("bookings").update({ status: 'cancelled' }).eq("id", b.id);
    toast("[ OK ] Manifest cancelled by dispatch.");
    load();
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
        <div className="panel" style={{ marginTop: "2rem" }}>
          <div className="lbl" style={{ marginBottom: "1rem" }}>CUSTOMER INFO</div>
          <div className="info-row"><span className="lbl">Name</span><b>{b.customer?.full_name || "—"}</b></div>
          <div className="info-row">
            <span className="lbl">Phone</span>
            <b><a href={`tel:${b.customer?.phone}`} style={{ color: "var(--accent)", textDecoration: "underline" }}>{b.customer?.phone || "—"}</a></b>
          </div>
          <div className="info-row"><span className="lbl">Payment</span><b>{b.pay_method.toUpperCase()} {b.paid ? "(PAID)" : "(PENDING)"}</b></div>
        </div>
      </div>
      
      <div>
        {b.status === "confirmed" && (
          <div className="panel" style={{ background: "var(--ink)", color: "var(--paper)", borderColor: "var(--ink)", marginBottom: "2rem" }}>
            <div className="lbl" style={{ marginBottom: "1rem", color: "var(--paper)" }}>DISPATCH ASSIGNMENT</div>
            <div className="field">
              <label style={{ color: "var(--paper)" }}>Assign Van</label>
              <select value={selVan} onChange={e => setSelVan(e.target.value)} style={{ color: "var(--paper)", borderBottomColor: "var(--paper)" }}>
                <option value="" disabled>Select available van…</option>
                {vans.map(v => <option key={v.id} value={v.id}>{v.plate} — {v.class.toUpperCase()}</option>)}
              </select>
            </div>
            <div className="field">
              <label style={{ color: "var(--paper)" }}>Assign Driver</label>
              <select value={selDriver} onChange={e => setSelDriver(e.target.value)} style={{ color: "var(--paper)", borderBottomColor: "var(--paper)" }}>
                <option value="" disabled>Select driver…</option>
                {drivers.map(d => <option key={d.id} value={d.id}>{d.full_name} ({d.on_duty ? 'ON DUTY' : 'OFF'})</option>)}
              </select>
            </div>
            <button className="btn btn-solid" style={{ background: "var(--paper)", color: "var(--ink)", width: "100%", marginTop: "1rem" }} onClick={handleAssign}>
              CONFIRM ASSIGNMENT
            </button>
          </div>
        )}

        {(b.status === "assigned" || b.status === "en_route" || b.status === "completed") && (
          <div className="panel" style={{ marginBottom: "2rem" }}>
            <div className="lbl" style={{ marginBottom: "1rem" }}>DRIVER INFO</div>
            <div className="info-row"><span className="lbl">Name</span><b>{b.driver?.full_name || "—"}</b></div>
            <div className="info-row"><span className="lbl">Phone</span><b>{b.driver?.phone || "—"}</b></div>
            <div className="info-row"><span className="lbl">Van Plate</span><b style={{ fontFamily: "'IBM Plex Mono'" }}>{b.vans?.plate || "—"}</b></div>
          </div>
        )}

        {b.status !== "cancelled" && b.status !== "completed" && (
          <div className="action-bar" style={{ marginTop: "2rem" }}>
            <button className="btn" style={{ color: "var(--accent)", borderColor: "var(--accent)" }} onClick={handleCancel}>
              FORCE CANCEL MANIFEST
            </button>
          </div>
        )}
      </div>
    </div>
  );
}