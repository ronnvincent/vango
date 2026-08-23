export default function StatusBadge({status}){
  return <span className={`badge badge-${status}`}>{String(status).replace("_"," ")}</span>;
}