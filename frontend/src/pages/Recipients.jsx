import { useEffect, useState } from "react";
import api from "../api";
import StatusBadge from "../components/StatusBadge";

const empty = { name:"", bloodType:"A+", hlaTyping:"A2 B7 DR4", requiredOrgan:"Kidney", organSize:"", urgencyStatus:"High", medicalHistory:"" };

export default function Recipients() {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(empty);
  const [error, setError] = useState("");
  const load = () => api.get("/recipients").then(r => setRows(r.data));
  useEffect(load, []);

  const submit = async e => {
    e.preventDefault(); setError("");
    try {
      await api.post("/recipients", {...form, organSize: form.organSize ? Number(form.organSize) : undefined});
      setForm(empty); load();
    } catch (err) { setError(err.response?.data?.message || "Could not save candidate"); }
  };

  return <div className="page">
    <div className="page-heading"><div><span className="eyebrow">UC2 · FR2 · FR8</span><h2>Recipient waitlist</h2><p>Register candidates and maintain a dynamic urgency-based waitlist.</p></div></div>
    <div className="two-col form-layout">
      <form className="panel form-grid" onSubmit={submit}>
        <h3>Register new candidate</h3>
        <label>Full name<input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required/></label>
        <label>Blood type<select value={form.bloodType} onChange={e=>setForm({...form,bloodType:e.target.value})}>{["O-","O+","A-","A+","B-","B+","AB-","AB+"].map(x=><option key={x}>{x}</option>)}</select></label>
        <label>HLA typing<input value={form.hlaTyping} onChange={e=>setForm({...form,hlaTyping:e.target.value})} required/></label>
        <label>Required organ<select value={form.requiredOrgan} onChange={e=>setForm({...form,requiredOrgan:e.target.value})}>{["Kidney","Liver","Heart","Lung","Pancreas"].map(x=><option key={x}>{x}</option>)}</select></label>
        <label>Organ size<input type="number" value={form.organSize} onChange={e=>setForm({...form,organSize:e.target.value})}/></label>
        <label>Urgency<select value={form.urgencyStatus} onChange={e=>setForm({...form,urgencyStatus:e.target.value})}>{["Critical","High","Medium","Low"].map(x=><option key={x}>{x}</option>)}</select></label>
        <label className="full">Medical evaluation summary<textarea value={form.medicalHistory} onChange={e=>setForm({...form,medicalHistory:e.target.value})}/></label>
        {error && <div className="error-box full">{error}</div>}
        <button className="primary-button full">Register candidate</button>
      </form>
      <div className="panel"><div className="panel-title"><h3>Active waitlist</h3><span>{rows.filter(r=>r.status==="Active").length}</span></div><div className="table-wrap"><table><thead><tr><th>Position</th><th>Candidate</th><th>Organ</th><th>Urgency</th><th>Status</th></tr></thead><tbody>{rows.map(r=><tr key={r._id}><td>#{r.waitlistPosition || "—"}</td><td>{r.candidateId}<br/><small>{r.name}</small></td><td>{r.requiredOrgan}</td><td><StatusBadge>{r.urgencyStatus}</StatusBadge></td><td><StatusBadge>{r.status}</StatusBadge></td></tr>)}</tbody></table></div></div>
    </div>
  </div>;
}
