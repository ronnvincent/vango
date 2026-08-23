const LABELS = {
  pending: "Awaiting confirmation",
  confirmed: "Confirmed",
  assigned: "Driver assigned",
  en_route: "On the way",
  completed: "Completed",
  cancelled: "Cancelled",
};

export const statusLabel = s => LABELS[s] || String(s).replace("_", " ");

export default function StatusBadge({ status }){
  return <span className={`badge badge-${status}`}>{statusLabel(status)}</span>;
}
