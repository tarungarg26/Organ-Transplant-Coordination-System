import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, Clock3, HeartPulse, Truck } from "lucide-react";
import api from "../api";
import { useAuth } from "../auth";
import StatCard from "../components/StatCard";
import StatusBadge from "../components/StatusBadge";

export default function Dashboard() {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [matches, setMatches] = useState([]);
  const [transports, setTransports] = useState([]);

  useEffect(() => {
    api.get("/matches").then(r => setMatches(r.data));
    api.get("/transports").then(r => setTransports(r.data));
    if (["ADMIN","COORDINATOR","OPO","AUDITOR"].includes(user.role)) {
      api.get("/analytics").then(r => setAnalytics(r.data));
    }
  }, [user.role]);

  return (
    <div className="page">
      <div className="page-heading">
        <div><span className="eyebrow">ROLE: {user.role}</span><h2>Operations overview</h2><p>Monitor active cases, matches and transport activity.</p></div>
      </div>

      <div className="stats-grid">
        <StatCard label="Registered donors" value={analytics?.donors ?? "—"} icon={HeartPulse}/>
        <StatCard label="Waitlist candidates" value={analytics?.recipients ?? "—"} icon={Clock3}/>
        <StatCard label="Confirmed matches" value={analytics?.confirmedMatches ?? matches.filter(m=>m.status==="CONFIRMED").length} icon={CheckCircle2}/>
        <StatCard label="Active transports" value={transports.filter(t=>!["DELIVERED"].includes(t.status)).length} icon={Truck}/>
      </div>

      <div className="two-col">
        <div className="panel">
          <div className="panel-title"><h3>Recent matches</h3><span>{matches.length} records</span></div>
          <div className="table-wrap">
            <table><thead><tr><th>Match</th><th>Recipient</th><th>Score</th><th>Status</th></tr></thead>
            <tbody>{matches.slice(0,8).map(m => <tr key={m._id}><td>{m.matchId}</td><td>{m.recipient?.name}</td><td>{m.matchScore ?? "—"}</td><td><StatusBadge>{m.status}</StatusBadge></td></tr>)}</tbody></table>
          </div>
        </div>
        <div className="panel">
          <div className="panel-title"><h3>Active transport</h3><span>Live status</span></div>
          {transports.slice(0,6).map(t => <div className="timeline-row" key={t._id}><div className="timeline-icon"><Truck size={17}/></div><div><strong>{t.transportId}</strong><p>{t.currentLocation || "Location pending"} → {t.destinationHospital}</p></div><StatusBadge>{t.status}</StatusBadge></div>)}
          {!transports.length && <div className="empty"><AlertTriangle size={22}/><p>No transport jobs yet.</p></div>}
        </div>
      </div>
    </div>
  );
}
