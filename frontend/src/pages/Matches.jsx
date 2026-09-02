import { useEffect, useState } from "react";
import api from "../api";
import StatusBadge from "../components/StatusBadge";

export default function Matches() {
  const [donors, setDonors] = useState([]);
  const [selected, setSelected] = useState("");
  const [ranked, setRanked] = useState([]);
  const [matches, setMatches] = useState([]);
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  const load = () => Promise.all([api.get("/donors"), api.get("/matches")]).then(([d,m])=>{setDonors(d.data);setMatches(m.data)});
  useEffect(load, []);

  const evaluate = async () => {
    setError("");
    try {
      const { data } = await api.get(`/matches/evaluate/${selected}`);
      setRanked(data.ranked);
      load();
    } catch (err) { setError(err.response?.data?.message || "Evaluation failed"); }
  };

  const confirm = async id => { try { await api.post(`/matches/${id}/confirm`); load(); setRanked([]); } catch(err){setError(err.response?.data?.message || "Confirmation failed");} };
  const reject = async id => {
    if (!reason.trim()) return setError("Enter a rejection reason first.");
    try { await api.post(`/matches/${id}/reject`, { reason }); setReason(""); load(); setRanked(prev=>prev.filter(x=>x._id!==id)); } catch(err){setError(err.response?.data?.message || "Rejection failed");}
  };

  return <div className="page">
    <div className="page-heading"><div><span className="eyebrow">UC3 · FR3 · FR4 · FR5 · FR6</span><h2>Matching & allocation</h2><p>Evaluate compatibility, review ranked candidates, then confirm or reject the proposed match.</p></div></div>
    <div className="panel action-panel">
      <label>Available donor<select value={selected} onChange={e=>setSelected(e.target.value)}><option value="">Select donor</option>{donors.filter(d=>d.status.includes("Available")||d.status==="Flagged").map(d=><option key={d._id} value={d._id}>{d.donorId} · {d.name} · {d.organType}</option>)}</select></label>
      <button className="primary-button" disabled={!selected} onClick={evaluate}>Run compatibility evaluation</button>
      {error && <div className="error-box">{error}</div>}
    </div>

    {ranked.length > 0 && <div className="panel"><div className="panel-title"><h3>Ranked compatibility list</h3><span>Recommendation only — coordinator decides</span></div>
      <div className="rank-list">{ranked.map((m,i)=><div className="rank-card" key={m._id}><div className="rank-number">#{i+1}</div><div className="rank-main"><h3>{m.recipient?.name}</h3><p>{m.recipient?.candidateId} · {m.recipient?.urgencyStatus} · {m.distanceKm ?? "—"} km</p><div className="reason-list">{m.reasons?.map(r=><span key={r}>{r}</span>)}</div></div><div className="score"><strong>{m.matchScore}</strong><small>score</small></div><div className="row-actions"><button className="primary-button" onClick={()=>confirm(m._id)}>Confirm</button><button className="secondary-button" onClick={()=>reject(m._id)}>Reject</button></div></div>)}</div>
    </div>}
    <div className="panel"><div className="panel-title"><h3>Decision history</h3><input className="inline-input" placeholder="Rejection reason for next action" value={reason} onChange={e=>setReason(e.target.value)}/></div><div className="table-wrap"><table><thead><tr><th>Match</th><th>Donor</th><th>Recipient</th><th>Score</th><th>Status</th><th>Decision</th></tr></thead><tbody>{matches.map(m=><tr key={m._id}><td>{m.matchId}</td><td>{m.donor?.name}</td><td>{m.recipient?.name}</td><td>{m.matchScore}</td><td><StatusBadge>{m.status}</StatusBadge></td><td>{m.rejectionReason || m.coordinator?.name || "—"}</td></tr>)}</tbody></table></div></div>
  </div>;
}
