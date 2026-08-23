import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { DetailSkeleton } from "../../components/Skeleton";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

export default function AdminReports() {
  const [bData, setBData] = useState([]);
  const [rData, setRData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 14 days for bookings
    const d14 = new Date(); d14.setDate(d14.getDate() - 14);
    // 8 weeks for revenue
    const w8 = new Date(); w8.setDate(w8.getDate() - 56);

    supabase.from("bookings").select("scheduled_at, fare, status")
      .gte("scheduled_at", w8.toISOString())
      .then(({ data }) => {
        const rows = data || [];
        
        // Bookings per day (last 14 days)
        const dayMap = {};
        for(let i=13; i>=0; i--) {
          const d = new Date(); d.setDate(d.getDate() - i);
          dayMap[d.toISOString().split('T')[0]] = 0;
        }
        rows.forEach(r => {
          const dt = r.scheduled_at.split('T')[0];
          if (dayMap[dt] !== undefined) dayMap[dt]++;
        });
        setBData(Object.keys(dayMap).map(k => ({ date: k.substring(5), count: dayMap[k] })));

        // Revenue per week (last 8 weeks) - completed only
        const weekMap = {};
        for(let i=7; i>=0; i--) {
          const d = new Date(); d.setDate(d.getDate() - i*7);
          weekMap[`Wk ${d.getDate()}/${d.getMonth()+1}`] = 0;
        }
        
        // Simpler week bucket logic for v1: just aggregate by week offset from now
        const now = new Date().getTime();
        const revMap = [0,0,0,0,0,0,0,0];
        
        rows.filter(r => r.status === 'completed').forEach(r => {
          const t = new Date(r.scheduled_at).getTime();
          const w = Math.floor((now - t) / (7 * 24 * 3600 * 1000));
          if (w >= 0 && w < 8) revMap[7-w] += Number(r.fare);
        });
        
        const revFormatted = revMap.map((val, i) => {
          const d = new Date(); d.setDate(d.getDate() - (7-i)*7);
          return { week: `${d.getDate()}/${d.getMonth()+1}`, revenue: val };
        });
        setRData(revFormatted);
        setLoading(false);
      });
  }, []);

  if (loading) return <DetailSkeleton label="Loading the report…" />;

  return (
    <div className="duo" style={{ gap: "3rem" }}>
      <div>
        <div className="lbl" style={{ marginBottom: "1rem" }}>Bookings (Last 14 Days)</div>
        <div style={{ height: "300px", width: "100%", background: "#FAF8F2", border: "1.5px solid var(--ink)", padding: "1rem" }}>
          <ResponsiveContainer>
            <BarChart data={bData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <XAxis dataKey="date" tick={{ fontFamily: "'IBM Plex Mono'", fontSize: 10 }} tickLine={false} axisLine={{ stroke: "var(--ink)" }} />
              <YAxis tick={{ fontFamily: "'IBM Plex Mono'", fontSize: 10 }} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip cursor={{ fill: "rgba(23,21,18,0.05)" }} contentStyle={{ borderRadius: 0, border: "1.5px solid var(--ink)", fontFamily: "'IBM Plex Mono'", fontSize: "12px", background: "var(--paper)" }} />
              <Bar dataKey="count" fill="var(--ink)" activeBar={<Cell fill="var(--accent)" />} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div>
        <div className="lbl" style={{ marginBottom: "1rem" }}>Revenue (Last 8 Weeks, Completed)</div>
        <div style={{ height: "300px", width: "100%", background: "#FAF8F2", border: "1.5px solid var(--ink)", padding: "1rem" }}>
          <ResponsiveContainer>
            <BarChart data={rData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <XAxis dataKey="week" tick={{ fontFamily: "'IBM Plex Mono'", fontSize: 10 }} tickLine={false} axisLine={{ stroke: "var(--ink)" }} />
              <YAxis tick={{ fontFamily: "'IBM Plex Mono'", fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={v => `$${v}`} />
              <Tooltip cursor={{ fill: "rgba(23,21,18,0.05)" }} formatter={v => `$${v}`} contentStyle={{ borderRadius: 0, border: "1.5px solid var(--ink)", fontFamily: "'IBM Plex Mono'", fontSize: "12px", background: "var(--paper)" }} />
              <Bar dataKey="revenue" fill="var(--ink)" activeBar={<Cell fill="var(--accent)" />} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}