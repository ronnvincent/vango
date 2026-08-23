import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import StatusBadge from "../../components/StatusBadge";
import { toast } from "../../components/Toast";
import { CLASS_META } from "../../lib/pricing";

export default function AdminFleet() {
  const [vans, setVans] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // New Van Form
  const [vName, setVName] = useState("");
  const [vClass, setVClass] = useState("cruiser");
  const [vCap, setVCap] = useState(12);
  const [vRate, setVRate] = useState("1.50");
  const [vPlate, setVPlate] = useState("");
  const [adding, setAdding] = useState(false);

  const load = () => {
    supabase.from("vans").select("*").order("created_at", { ascending: false })
      .then(({ data }) => {
        setVans(data || []);
        setLoading(false);
      });
  };

  useEffect(load, []);

  const handleClassChange = (c) => {
    setVClass(c);
    if (CLASS_META[c]) setVCap(CLASS_META[c].cap);
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    setAdding(true);
    const { error } = await supabase.from("vans").insert({
      name: vName, class: vClass, capacity: vCap, rate_per_km: vRate, plate: vPlate
    });
    if (error) toast(`Error: ${error.message}`);
    else {
      toast("[ OK ] Van added to fleet.");
      setVName(""); setVPlate("");
      load();
    }
    setAdding(false);
  };

  const cycleStatus = async (id, current) => {
    const next = current === 'available' ? 'in_service' : (current === 'in_service' ? 'maintenance' : 'available');
    await supabase.from("vans").update({ status: next }).eq("id", id);
    load();
  };

  const handleDelete = async (id) => {
    const { data: b } = await supabase.from("bookings").select("id").eq("van_id", id).in("status", ["confirmed", "assigned"]);
    if (b && b.length > 0) return toast("▲ Cannot delete van with future confirmed/assigned bookings.");
    if (!confirm("Remove this van from the fleet permanently?")) return;
    await supabase.from("vans").delete().eq("id", id);
    toast("[ OK ] Van removed.");
    load();
  };

  if (loading) return <div className="lbl">Loading…</div>;

  return (
    <>
      <div className="panel" style={{ marginBottom: "2rem" }}>
        <div className="lbl" style={{ marginBottom: "1rem" }}>ADD VAN</div>
        <form className="inline-form" onSubmit={handleAdd}>
          <div className="field" style={{ margin: 0 }}>
            <label>Name / Model</label>
            <input type="text" value={vName} onChange={e => setVName(e.target.value)} required placeholder="e.g. Cruiser Twelve" />
          </div>
          <div className="field" style={{ margin: 0 }}>
            <label>Class</label>
            <select value={vClass} onChange={e => handleClassChange(e.target.value)}>
              <option value="shuttle">Shuttle /7</option>
              <option value="cruiser">Cruiser /12</option>
              <option value="mover">Mover /19</option>
            </select>
          </div>
          <div className="field" style={{ margin: 0 }}>
            <label>Capacity</label>
            <input type="number" value={vCap} onChange={e => setVCap(Number(e.target.value))} required min="1" max="50" />
          </div>
          <div className="field" style={{ margin: 0 }}>
            <label>Rate / KM ($)</label>
            <input type="number" step="0.01" value={vRate} onChange={e => setVRate(e.target.value)} required />
          </div>
          <div className="field" style={{ margin: 0 }}>
            <label>Plate</label>
            <input type="text" value={vPlate} onChange={e => setVPlate(e.target.value)} required placeholder="VG-C-000" />
          </div>
          <div style={{ alignSelf: "end" }}>
            <button type="submit" className="btn btn-solid" style={{ width: "100%", padding: "0.55rem" }} disabled={adding}>
              {adding ? "ADDING…" : "+ ADD VAN"}
            </button>
          </div>
        </form>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Class</th>
              <th>Capacity</th>
              <th>Rate/KM</th>
              <th>Plate</th>
              <th>Status (Click to toggle)</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {vans.map(v => (
              <tr key={v.id}>
                <td><b>{v.name}</b></td>
                <td>{v.class.toUpperCase()}</td>
                <td>{String(v.capacity).padStart(2, "0")}</td>
                <td>${v.rate_per_km}</td>
                <td style={{ fontFamily: "'IBM Plex Mono'" }}>{v.plate}</td>
                <td>
                  <button onClick={() => cycleStatus(v.id, v.status)}>
                    <StatusBadge status={v.status} />
                  </button>
                </td>
                <td style={{ textAlign: "right" }}>
                  <button onClick={() => handleDelete(v.id)} style={{ color: "var(--accent)", fontSize: "1.2rem", padding: "0 0.5rem" }}>×</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}