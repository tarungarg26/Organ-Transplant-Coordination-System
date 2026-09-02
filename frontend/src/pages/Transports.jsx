import { useEffect, useState } from "react";
import api from "../api";
import StatusBadge from "../components/StatusBadge";

export default function Transports() {
  const [rows, setRows] = useState([]);
  const [message, setMessage] = useState("");
  const load = () => api.get("/transports").then(r=>setRows(r.data));
  useEffect(load, []);

  const update = async (id, status) => {
    try { await api.patch(`/transports/${id}`, { status }); setMessage(`Transport updated: ${status}`); load(); }
    catch(err){setMessage(err.response?.data?.message || "Update failed");}
  };

  return <div className="page">
    <div className="page-heading"><div><span className="eyebrow">UC4 · FR7</span><h2>Live transport tracking</h2><p>Update checkpoints, estimated arrival and delivery status. Elapsed time is calculated by the server.</p></div></div>
    {message && <div className="success-box">{message}</div>}
    <div className="transport-grid">{rows.map(t=><div className="transport-card" key={t._id}><div className="panel-title"><div><h3>{t.transportId}</h3><p>{t.match?.donor?.name} → {t.match?.recipient?.name}</p></div><StatusBadge>{t.status}</StatusBadge></div><div className="route"><div><span>Current</span><strong>{t.currentLocation || "—"}</strong></div><div className="route-line"></div><div><span>Destination</span><strong>{t.destinationHospital}</strong></div></div><div className="transport-metrics"><div><span>Elapsed</span><strong>{t.elapsedMinutes} min</strong></div><div><span>ETA</span><strong>{t.estimatedArrival ? new Date(t.estimatedArrival).toLocaleTimeString() : "Not set"}</strong></div><div><span>Cold ischemia limit</span><strong>{t.coldIschemiaLimitMinutes} min</strong></div></div><div className="row-actions"><button className="secondary-button" onClick={()=>update(t._id,"PICKED_UP")}>Picked up</button><button className="secondary-button" onClick={()=>update(t._id,"IN_TRANSIT")}>In transit</button><button className="primary-button" onClick={()=>update(t._id,"DELIVERED")}>Delivered</button></div>{t.status==="EXCEPTION"&&<div className="error-box">{t.exceptionReason}</div>}</div>)}</div>
    {!rows.length && <div className="empty panel">No transport jobs yet. Confirm a match to create one.</div>}
  </div>;
}
