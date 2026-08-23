import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { TableSkeleton } from "../../components/Skeleton";
import ConfirmDialog from "../../components/ConfirmDialog";
import { licenseDocUrl } from "../../lib/driverApplication";
import { toast } from "../../components/Toast";

const FILTERS = [["PENDING", "Pending"], ["APPROVED", "Approved"], ["REJECTED", "Rejected"], ["ALL", "All"]];

export default function AdminApplications() {
  const [apps, setApps] = useState([]);
  const [filter, setFilter] = useState("PENDING");
  const [loading, setLoading] = useState(true);
  const [decision, setDecision] = useState(null); // { app, approve }
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  const load = () => {
    supabase.from("driver_applications")
      .select(`
        *,
        applicant_profile:profiles!driver_applications_applicant_fkey(full_name, phone)
      `)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setApps(data || []);
        setLoading(false);
      });
  };

  useEffect(load, []);

  const filtered = apps.filter(a => filter === "ALL" ? true : a.status === filter.toLowerCase());

  const decide = async () => {
    if (!decision || busy) return;
    setBusy(true);
    const { error } = await supabase.rpc("admin_review_application", {
      app_id: decision.app.id,
      decision: decision.approve ? "approved" : "rejected",
      note: note.trim() || null,
    });
    setBusy(false);
    setDecision(null);
    setNote("");
    if (error) return toast("Sorry, couldn't record that decision. Try again.");
    toast(decision.approve ? "[ OK ] Application approved — driver activated." : "[ OK ] Application rejected.");
    load();
  };

  if (loading) return <TableSkeleton rows={5} label="Loading applications…" />;

  return (
    <>
      <div className="filter-chips">
        {FILTERS.map(([f, label]) => (
          <button key={f} className={`chip ${filter === f ? "active" : ""}`} onClick={() => setFilter(f)}>{label}</button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="empty">No {filter.toLowerCase()} applications right now.</div>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Applicant</th>
                <th>Phone</th>
                <th>License No.</th>
                <th>Expires</th>
                <th>Experience</th>
                <th>Document</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(a => (
                <AppRow key={a.id} app={a} onDecide={(approve) => { setDecision({ app: a, approve }); setNote(""); }} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        open={!!decision}
        title={decision?.approve ? "Approve this driver?" : "Reject this application?"}
        body={
          <>
            {decision && <><b>{decision.app.applicant_profile?.full_name}</b><br /></>}
            {note && <>Note to applicant: <b>{note}</b></>}
          </>
        }
        confirmLabel={decision?.approve ? "APPROVE & ACTIVATE" : "REJECT APPLICATION"}
        cancelLabel="CANCEL"
        busy={busy}
        onConfirm={decide}
        onCancel={() => setDecision(null)}
      />
    </>
  );
}

function AppRow({ app, onDecide }) {
  const [url, setUrl] = useState(null);

  useEffect(() => {
    licenseDocUrl(app.license_doc_path).then(setUrl);
  }, [app.license_doc_path]);

  return (
    <tr>
      <td><b>{app.applicant_profile?.full_name || "—"}</b></td>
      <td>{app.applicant_profile?.phone || "—"}</td>
      <td>{app.license_number}</td>
      <td>{new Date(app.license_expiry).toLocaleDateString()}</td>
      <td>{app.years_experience} yr{app.years_experience === 1 ? "" : "s"}</td>
      <td>
        {url
          ? <a href={url} target="_blank" rel="noreferrer" style={{ textDecoration: "underline", color: "var(--accent)" }}>View</a>
          : "—"}
      </td>
      <td><span className={`badge badge-${app.status === "approved" ? "completed" : app.status === "rejected" ? "cancelled" : "pending"}`}>{app.status}</span></td>
      <td className="arr-cell">
        {app.status === "pending" && (
          <span style={{ display: "inline-flex", gap: ".5rem" }}>
            <button className="btn btn-solid" style={{ padding: ".3rem .7rem", fontSize: ".7rem" }} onClick={() => onDecide(true)}>APPROVE</button>
            <button className="btn btn-danger" style={{ padding: ".3rem .7rem", fontSize: ".7rem", marginLeft: 0 }} onClick={() => onDecide(false)}>REJECT</button>
          </span>
        )}
        {app.status !== "pending" && app.reviewer_note && <span className="lbl">Note: {app.reviewer_note}</span>}
      </td>
    </tr>
  );
}
