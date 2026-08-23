export default function Ticket({routeLabel, distanceKm, classLabel, pax, departLabel, fare, refCode, stamped=false, stampRef=""}){
  return (
    <aside className={"ticket"+(stamped?" stamped":"")} style={{position:"relative"}} aria-live="polite">
      <div className="tk-head"><span className="lbl">VanGo — Trip manifest</span><span className="tk-ref">{refCode?("REF "+refCode):"REF ————"}</span></div>
      <div className="tk-body">
        <div className="tk-row"><span className="lbl">Route</span><span className="lead"></span><b>{routeLabel}</b></div>
        <div className="tk-row"><span className="lbl">Distance</span><span className="lead"></span><b>{distanceKm} KM</b></div>
        <div className="tk-row"><span className="lbl">Class</span><span className="lead"></span><b>{classLabel}</b></div>
        <div className="tk-row"><span className="lbl">Passengers</span><span className="lead"></span><b>{pax}</b></div>
        <div className="tk-row"><span className="lbl">Depart</span><span className="lead"></span><b>{departLabel}</b></div>
        <div className="tk-total"><span className="lbl">Total fare</span><b>{fare}</b></div>
      </div>
      <div style={{borderTop:"2px dashed var(--ink)",padding:"1.2rem",textAlign:"center"}}>
        <div className="barcode" aria-hidden="true"></div>
        {stamped && <div className="stamp">Confirmed<small>{stampRef}</small></div>}
      </div>
    </aside>
  );
}