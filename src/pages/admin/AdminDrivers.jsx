import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { TableSkeleton } from "../../components/Skeleton";
import ConfirmDialog from "../../components/ConfirmDialog";
import { toast } from "../../components/Toast";

export default function AdminDrivers() {
  const [drivers, setDrivers] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [promoteTarget, setPromoteTarget] = useState(null);
  const [busy, setBusy] = useState(false);

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
    const { error } = await supabase.rpc("admin_set_duty", { target: id, duty: !current });
    if (error) return toast("Sorry, couldn't update duty status. Try again.");
    load();
  };

  const promote = async () => {
    if (!promoteTarget || busy) return;
    setBusy(true);
    const { error } = await supabase.rpc("admin_set_role", { target: promoteTarget.id, new_role: "driver" });
    setBusy(false);
    setPromoteTarget(null);
    if (error) return toast("Sorry, couldn't promote this customer. Try again.");
    toast("[ OK ] Customer promoted to Driver.");
    load();
  };

  if (loading) return <TableSkeleton rows={5} label="Loading drivers…" />;

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
                  <button className="btn" style={{ padding: "0.3rem 0.6rem", fontSize: "0.7rem" }} onClick={() => setPromoteTarget(c)}>
                    PROMOTE
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        open={!!promoteTarget}
        title={`Promote ${promoteTarget?.full_name || "this customer"}?`}
        body="They will get driver access and see assigned trips in their manifest."
        confirmLabel="MAKE DRIVER"
        cancelLabel="KEEP AS CUSTOMER"
        busy={busy}
        onConfirm={promote}
        onCancel={() => setPromoteTarget(null)}
      />
    </>
  );
}