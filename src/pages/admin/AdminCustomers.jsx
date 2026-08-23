import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { TableSkeleton } from "../../components/Skeleton";
import { money } from "../../lib/pricing";

export default function AdminCustomers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      supabase.from("profiles").select("*").eq("role", "customer").order("created_at", { ascending: false }),
      supabase.from("bookings").select("customer_id, fare").eq("paid", true)
    ]).then(([cRes, bRes]) => {
      const profiles = cRes.data || [];
      const bookings = bRes.data || [];
      
      const stats = {};
      bookings.forEach(b => {
        if (!stats[b.customer_id]) stats[b.customer_id] = { count: 0, spend: 0 };
        stats[b.customer_id].count += 1;
        stats[b.customer_id].spend += Number(b.fare);
      });

      const merged = profiles.map(p => ({
        ...p,
        lifetime_trips: stats[p.id]?.count || 0,
        lifetime_spend: stats[p.id]?.spend || 0
      }));

      setCustomers(merged);
      setLoading(false);
    });
  }, []);

  if (loading) return <TableSkeleton rows={6} label="Loading customers…" />;

  return (
    <>
      <div style={{ overflowX: "auto" }}>
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Phone</th>
              <th>Joined</th>
              <th>Lifetime Trips</th>
              <th>Lifetime Spend</th>
            </tr>
          </thead>
          <tbody>
            {customers.length === 0 && <tr><td colSpan="5" className="empty" style={{ border: "none" }}>No customers found.</td></tr>}
            {customers.map(c => (
              <tr key={c.id}>
                <td><b>{c.full_name || "—"}</b></td>
                <td>{c.phone || "—"}</td>
                <td>{new Date(c.created_at).toLocaleDateString()}</td>
                <td>{String(c.lifetime_trips).padStart(2, "0")}</td>
                <td>{money(c.lifetime_spend)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}