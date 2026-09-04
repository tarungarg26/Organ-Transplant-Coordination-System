import React, { useEffect, useState, useMemo } from 'react';
import { Search, Users } from 'lucide-react';
import api from "../api";
import StatusBadge from "../components/StatusBadge";
import EmptyState from "../components/EmptyState";
import { useToast } from "../components/Toast";

const empty = {
  name: "",
  bloodType: "A+",
  hlaTyping: "A2 B7 DR4",
  requiredOrgan: "Kidney",
  organSize: "8",
  urgencyStatus: "High",
  medicalHistory: "End-stage renal disease, awaiting primary kidney transplant."
};

export default function Recipients() {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(empty);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [urgencyFilter, setUrgencyFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const { showToast } = useToast();

  const load = () => {
    api.get("/recipients")
      .then(r => setRows(Array.isArray(r.data) ? r.data : []))
      .catch(err => console.error("Could not load recipients:", err));
  };

  useEffect(() => {
    load();
  }, []);

  const submit = async e => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api.post("/recipients", {
        ...form,
        organSize: form.organSize ? Number(form.organSize) : undefined
      });
      setForm(empty);
      showToast({
        title: "Candidate waitlisted",
        message: `${res.data.name} placed at waitlist position #${res.data.waitlistPosition || 1} (${res.data.urgencyStatus}).`,
        type: res.data.urgencyStatus === "Critical" ? "warning" : "success"
      });
      load();
    } catch (err) {
      const msg = err.response?.data?.message || "Could not save candidate";
      setError(msg);
      showToast({ title: "Registration failed", message: msg, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const filteredRecipients = useMemo(() => {
    return rows.filter(r => {
      if (urgencyFilter !== "ALL" && r.urgencyStatus !== urgencyFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const name = (r.name || "").toLowerCase();
        const id = (r.candidateId || "").toLowerCase();
        const organ = (r.requiredOrgan || "").toLowerCase();
        return name.includes(q) || id.includes(q) || organ.includes(q);
      }
      return true;
    });
  }, [rows, urgencyFilter, search]);

  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">CANDIDATE WAITLIST</span>
          <h2>Recipient waitlist</h2>
          <p>Register transplant candidates and maintain a dynamic urgency-based allocation priority queue.</p>
        </div>
      </div>

      <div className="two-col form-layout">
        {/* Candidate Form */}
        <form className="panel form-grid" onSubmit={submit}>
          <h3>Register candidate to waitlist</h3>
          <label>Full name
            <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="e.g. Jane Smith" required/>
          </label>
          <label>Blood type
            <select value={form.bloodType} onChange={e => setForm({...form, bloodType: e.target.value})}>
              {["O-","O+","A-","A+","B-","B+","AB-","AB+"].map(x => <option key={x}>{x}</option>)}
            </select>
          </label>
          <label>HLA typing
            <input value={form.hlaTyping} onChange={e => setForm({...form, hlaTyping: e.target.value})} required/>
          </label>
          <label>Required organ
            <select value={form.requiredOrgan} onChange={e => setForm({...form, requiredOrgan: e.target.value})}>
              {["Kidney","Liver","Heart","Lung","Pancreas"].map(x => <option key={x}>{x}</option>)}
            </select>
          </label>
          <label>Target organ size (cm)
            <input type="number" value={form.organSize} onChange={e => setForm({...form, organSize: e.target.value})}/>
          </label>
          <label>Clinical Urgency
            <select value={form.urgencyStatus} onChange={e => setForm({...form, urgencyStatus: e.target.value})}>
              {["Critical","High","Medium","Low"].map(x => <option key={x}>{x}</option>)}
            </select>
          </label>
          <label className="full">Medical evaluation summary
            <textarea value={form.medicalHistory} onChange={e => setForm({...form, medicalHistory: e.target.value})}/>
          </label>
          {error && <div className="error-box full">{error}</div>}
          <button className="primary-button full" disabled={loading}>
            {loading ? "Registering candidate..." : "Add to waitlist queue"}
          </button>
        </form>

        {/* Waitlist Queue */}
        <div className="panel">
          <div className="panel-title">
            <div>
              <h3>Active waitlist queue</h3>
              <span style={{ fontSize: 11, color: "var(--muted)" }}>
                {rows.filter(r => r.status === "Active").length} active candidates
              </span>
            </div>

            <div className="search-input-wrap" style={{ maxWidth: 200 }}>
              <Search size={13} className="search-icon-inside" />
              <input
                type="text"
                placeholder="Search candidates..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ padding: '6px 10px 6px 28px', fontSize: 11 }}
              />
            </div>
          </div>

          {/* Urgency Filter Pills */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 12 }}>
            {["ALL", "Critical", "High", "Medium", "Low"].map(u => {
              const count = u === "ALL" ? rows.length : rows.filter(r => r.urgencyStatus === u).length;
              return (
                <button
                  key={u}
                  type="button"
                  className={`filter-pill${urgencyFilter === u ? " active" : ""}`}
                  onClick={() => setUrgencyFilter(u)}
                  style={{ fontSize: 10, padding: '3px 8px' }}
                >
                  {u} ({count})
                </button>
              );
            })}
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Candidate</th>
                  <th>Organ</th>
                  <th>Urgency</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecipients.map(r => (
                  <tr key={r._id || r.candidateId}>
                    <td>
                      <strong style={{ color: 'var(--brand-dark)', fontSize: 13 }}>
                        #{r.waitlistPosition || "—"}
                      </strong>
                    </td>
                    <td>
                      <strong>{r.name}</strong>
                      <div style={{ fontSize: 10, color: "var(--muted)", fontFamily: "monospace" }}>
                        {r.candidateId} · {r.bloodType}
                      </div>
                    </td>
                    <td>{r.requiredOrgan}</td>
                    <td><StatusBadge>{r.urgencyStatus}</StatusBadge></td>
                    <td><StatusBadge>{r.status}</StatusBadge></td>
                  </tr>
                ))}
              </tbody>
            </table>

            {!filteredRecipients.length && (
              <div style={{ padding: '24px 12px' }}>
                <EmptyState
                  icon={Users}
                  title="No candidates found"
                  description="Register a candidate using the form on the left, or adjust your urgency filter."
                  actionLabel={urgencyFilter !== "ALL" || search ? "Clear filters" : undefined}
                  onAction={() => { setUrgencyFilter("ALL"); setSearch(""); }}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
