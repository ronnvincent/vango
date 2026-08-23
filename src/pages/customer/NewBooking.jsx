import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import Ticket from "../../components/Ticket";
import { toast } from "../../components/Toast";
import { useAuth } from "../../hooks/useAuth";
import { computeFare, makeRef, CLASS_META, money } from "../../lib/pricing";

export default function NewBooking() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [locs, setLocs] = useState([]);
  const [dists, setDists] = useState({});
  const [settings, setSettings] = useState(null);
  
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [date, setDate] = useState(minDate);
  const [time, setTime] = useState("09:00");
  const [vClass, setVClass] = useState("cruiser");
  const [pax, setPax] = useState(4);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    Promise.all([
      supabase.from("locations").select("*"),
      supabase.from("distances").select("*"),
      supabase.from("settings").select("*").single()
    ]).then(([lRes, dRes, sRes]) => {
      setLocs(lRes.data || []);
      const dm = {};
      (dRes.data || []).forEach(d => { dm[`${d.from_id}-${d.to_id}`] = d.km; });
      setDists(dm);
      setSettings(sRes.data);
      if (lRes.data?.length > 1) {
        setFrom(lRes.data[0].id);
        setTo(lRes.data[1].id);
      }
    });
  }, []);

  const dKm = (from && to && dists[`${from}-${to}`]) || 0;
  const rate = vClass === 'shuttle' ? 1.2 : (vClass === 'cruiser' ? 1.5 : 2.0);
  const fare = settings ? computeFare({ baseFare: settings.base_fare, distanceKm: dKm, rate }) : 0;
  
  const cap = CLASS_META[vClass]?.cap || 0;
  const overCap = pax > cap;
  
  const fromName = locs.find(l => l.id == from)?.short_name || "—";
  const toName = locs.find(l => l.id == to)?.short_name || "—";

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (overCap || from === to) return;
    setLoading(true);
    let ref = makeRef();
    
    // retry loop for unique reference
    for (let i = 0; i < 5; i++) {
      const { data, error } = await supabase.from("bookings").insert({
        reference: ref,
        customer_id: session.user.id,
        pickup_id: from,
        dropoff_id: to,
        distance_km: dKm,
        passengers: pax,
        fare,
        scheduled_at: `${date}T${time}:00Z`,
        status: 'pending'
      }).select().single();
      
      if (!error) {
        toast(`[ OK ] Manifest ${ref} logged.`);
        navigate(`/app/bookings/${data.id}`);
        return;
      }
      ref = makeRef();
    }
    toast("Error creating manifest. Please try again.");
    setLoading(false);
  };

  if (!settings) return <div className="lbl">Loading…</div>;

  return (
    <form className="manifest" onSubmit={handleSubmit}>
      <div>
        <div className="duo">
          <div className="field">
            <label>From</label>
            <select value={from} onChange={e => setFrom(e.target.value)} required>
              <option value="" disabled>Select pickup</option>
              {locs.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          </div>
          <div className="field">
            <label>To</label>
            <select value={to} onChange={e => setTo(e.target.value)} required>
              <option value="" disabled>Select dropoff</option>
              {locs.map(l => <option key={l.id} value={l.id} disabled={l.id == from}>{l.name}</option>)}
            </select>
          </div>
        </div>
        <div className="duo">
          <div className="field">
            <label>Date</label>
            <input type="date" value={date} min={minDate} onChange={e => setDate(e.target.value)} required />
          </div>
          <div className="field">
            <label>Time</label>
            <input type="time" value={time} onChange={e => setTime(e.target.value)} required />
          </div>
        </div>
        <div className="field">
          <label>Van class</label>
          <div className="van-pick">
            <input type="radio" id="vs" value="shuttle" checked={vClass === "shuttle"} onChange={e => setVClass(e.target.value)} />
            <label htmlFor="vs">Shuttle /7</label>
            <input type="radio" id="vc" value="cruiser" checked={vClass === "cruiser"} onChange={e => setVClass(e.target.value)} />
            <label htmlFor="vc">Cruiser /12</label>
            <input type="radio" id="vm" value="mover" checked={vClass === "mover"} onChange={e => setVClass(e.target.value)} />
            <label htmlFor="vm">Mover /19</label>
          </div>
        </div>
        <div className="field">
          <label>Passengers</label>
          <div className="stepper">
            <button type="button" onClick={() => setPax(Math.max(1, pax - 1))}>−</button>
            <output>{String(pax).padStart(2, "0")}</output>
            <button type="button" onClick={() => setPax(Math.min(19, pax + 1))}>+</button>
          </div>
          {overCap && <p className="overcap show">Over capacity — size up the van class</p>}
        </div>
        <div style={{ marginTop: "2rem" }}>
          <button type="submit" className="btn btn-solid" style={{ width: "100%", padding: "1.2rem", fontSize: "1.1rem" }} disabled={overCap || from === to || loading}>
            {loading ? "Logging…" : "ISSUE BOOKING"}
          </button>
        </div>
      </div>
      <div>
        <Ticket 
          routeLabel={`${fromName} → ${toName}`}
          distanceKm={dKm}
          classLabel={CLASS_META[vClass]?.label}
          pax={String(pax).padStart(2, "0")}
          departLabel={date ? `${date} · ${time}` : "—"}
          fare={overCap ? "N/A" : money(fare)}
        />
      </div>
    </form>
  );
}