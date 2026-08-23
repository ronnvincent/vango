export const FREE_CANCEL_HOURS = 4;
export const CLASS_META = {
  shuttle:{label:"SHUTTLE /7", cap:7},
  cruiser:{label:"CRUISER /12", cap:12},
  mover:{label:"MOVER /19", cap:19},
};
export const money   = n => `$${Number(n||0).toFixed(2)}`;
export const pad2    = n => String(n).padStart(2,"0");
export const makeRef = () => 'VG-' + Math.floor(1000 + Math.random()*9000);
export function computeFare({baseFare, distanceKm, rate}){
  return +(Number(baseFare) + Number(distanceKm)*Number(rate)).toFixed(2);
}
export function canCancelFree(booking, now = new Date()){
  if(!["pending","confirmed"].includes(booking.status)) return false;
  return new Date(booking.scheduled_at) - now > FREE_CANCEL_HOURS*3600*1000;
}
export const TRANSITIONS = {
  pending:["confirmed","cancelled"],
  confirmed:["assigned","cancelled"],
  assigned:["en_route","cancelled"],
  en_route:["completed"],
  completed:[],
  cancelled:[],
};