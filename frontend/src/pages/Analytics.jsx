import { useEffect, useState } from "react";
import api from "../api";
import StatCard from "../components/StatCard";
import { Building2, CheckCircle2, Clock3, HeartPulse } from "lucide-react";

export default function Analytics() {
  const [data,setData]=useState(null);
  useEffect(()=>api.get("/analytics").then(r=>setData(r.data)),[]);
  return <div className="page"><div className="page-heading"><div><span className="eyebrow">FR11 · ANALYTICS</span><h2>Analytics dashboard</h2><p>Operational indicators for transplant coordination and transport performance.</p></div></div>
    <div className="stats-grid"><StatCard label="Donors" value={data?.donors ?? "—"} icon={HeartPulse}/><StatCard label="Recipients" value={data?.recipients ?? "—"} icon={Clock3}/><StatCard label="Confirmed matches" value={data?.confirmedMatches ?? "—"} icon={CheckCircle2}/><StatCard label="Avg transport" value={data ? `${data.avgTransportMinutes} min` : "—"} icon={Building2}/></div>
    <div className="panel"><div className="panel-title"><h3>Hospital performance</h3><span>Donor registrations by hospital</span></div>{data?.hospitalPerformance?.map((h,i)=><div className="bar-row" key={h._id || i}><span>{h._id || "Unassigned"}</span><div className="bar"><i style={{width:`${Math.min(100,h.donors*15)}%`}}></i></div><strong>{h.donors}</strong></div>)}</div>
  </div>;
}
