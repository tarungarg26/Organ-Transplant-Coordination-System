import { useEffect, useState } from "react";
import api from "../api";

export default function Reports() {
  const [audit,setAudit]=useState([]);
  useEffect(()=>api.get("/reports/audit").then(r=>setAudit(r.data)),[]);
  const download = async () => {
    const token = localStorage.getItem("otcs_token");
    const base = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
    const res = await fetch(`${base}/reports/compliance.csv`, { headers: { Authorization: `Bearer ${token}` } });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href=url; a.download="otcs-compliance-report.csv"; a.click(); URL.revokeObjectURL(url);
  };
  return <div className="page"><div className="page-heading"><div><span className="eyebrow">FR11 · NFR7</span><h2>Compliance & audit</h2><p>Review match decisions and export a compliance report.</p></div><button className="primary-button" onClick={download}>Export CSV report</button></div>
    <div className="panel"><div className="panel-title"><h3>Audit log</h3><span>Recent 500 events</span></div><div className="table-wrap"><table><thead><tr><th>Time</th><th>User</th><th>Action</th><th>Entity</th><th>Details</th></tr></thead><tbody>{audit.map(a=><tr key={a._id}><td>{new Date(a.createdAt).toLocaleString()}</td><td>{a.userName}</td><td>{a.action}</td><td>{a.entityType} {a.entityId || ""}</td><td><code>{JSON.stringify(a.details)}</code></td></tr>)}</tbody></table></div></div>
  </div>;
}
