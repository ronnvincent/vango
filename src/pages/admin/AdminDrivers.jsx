import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { toast } from "../../components/Toast";

export default function AdminDrivers() {
  const [drivers, setDrivers] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    Promise.all([
      supabase.from("profiles").select(`*, bookings(count)`).eq("role", "driver"),
      supabase.from("profiles").select("*").eq("role", "customer").order("created_at", { ascending: false })
    ]).then(([dRes, cRes]) => {
      // client-side filter for active trips could be complex with count, so we'll just show all-time bookings count for now, or fetch active separately.
      // For simplicity in v1, we show lifetime bookings count here.
      setDrivers(dRes.data || []);
      setCustomers(cRes.data || []);
      setLoading(false);
    });
  };

  useEffect(load, []);

  const toggleDuty = async (id, current) => {
    await supabase.from("profiles").update({ on_duty: !current }).eq("id", id);
    load();
  };

  const promote = async (id) => {
    if (!confirm("Promote this customer to Driver?")) return;
    await supabase.from("profiles").update({ role: "driver" }).eq("id", id);
    toast("[ OK ] Customer promoted to Driver.");
    load();
  };

  if (loading) return <div className="lbl">Loading…</div>;

  return (
    <>
      <h2 className="section-title">Active Drivers</h2>
      <div style={{ overflowX: "auto", marginBottom: "3rem" }}>
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Phone</th>
              <th>Lifetime Trips</th>
              <th>On Duty</th>
            </tr>
          </thead>
          <tbody>
            {drivers.length === 0 && <tr><td colSpan="4" className="empty" style={{ border: "none" }}>No drivers yet.</td></tr>}
            {drivers.map(d => (
              <tr key={d.id}>
                <td><b>{d.full_name}</b></td>
                <td>{d.phone}</td>
                <td>{String(d.bookings?.[0]?.count || 0).padStart(2, "0")}</td>
                <td>
                  <button onClick={() => toggleDuty(d.id, d.on_duty)} className={`badge ${d.on_duty ? "badge-confirmed" : "badge-cancelled"}`} style={{ cursor: "pointer" }}>
                    {d.on_duty ? "ON DUTY" : "OFF DUTY"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="section-title">Promote Customers</h2>
      <div style={{ overflowX: "auto" }}>
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Phone</th>
              <th>Joined</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {customers.map(c => (
              <tr key={c.id}>
                <td>{c.full_name || "—"}</td>
                <td>{c.phone || "—"}</td>
                <td>{new Date(c.created_at).toLocaleDateString()}</td>
                <td style={{ textAlign: "right" }}>
                  <button className="btn" style={{ padding: "0.3rem 0.6rem", fontSize: "0.7rem" }} onClick={() => promote(c.id)}>
                    PROMOTE
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}