import React, { useEffect, useState, useMemo } from 'react';
import { 
  Activity, 
  Plus, 
  Calendar, 
  Heart, 
  CheckCircle2, 
  AlertTriangle, 
  UserCheck, 
  Search,
  X,
  ClipboardCheck,
  Stethoscope
} from 'lucide-react';
import api from '../api';
import { useAuth } from '../auth';
import { useToast } from '../components/Toast';
import StatCard from '../components/StatCard';
import EmptyState from '../components/EmptyState';

const GRAFT_FUNCTION_OPTIONS = [
  "Optimal Immediate Function",
  "Delayed Graft Function",
  "Acute Cellular Rejection",
  "Primary Non-Function"
];

const DISCHARGE_STATUS_OPTIONS = [
  "Discharged - Stable",
  "Inpatient Recovery",
  "ICU Monitoring",
  "Expired"
];

export default function Outcomes() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [outcomes, setOutcomes] = useState([]);
  const [eligibleRecipients, setEligibleRecipients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [filterFunction, setFilterFunction] = useState("ALL");

  const [formData, setFormData] = useState({
    recipient: "",
    surgeryDate: new Date().toISOString().split("T")[0],
    outcome: "Successful Graft Implantation",
    graftFunction: "Optimal Immediate Function",
    dischargeStatus: "Inpatient Recovery",
    complications: "None observed during intraoperative and immediate post-op period.",
    followUpNotes: ""
  });
  const [submitting, setSubmitting] = useState(false);

  const loadData = () => {
    Promise.allSettled([
      api.get("/outcomes"),
      api.get("/outcomes/eligible-recipients")
    ]).then(([outcomesRes, eligibleRes]) => {
      if (outcomesRes.status === "fulfilled" && Array.isArray(outcomesRes.value?.data)) {
        setOutcomes(outcomesRes.value.data);
      }
      if (eligibleRes.status === "fulfilled" && Array.isArray(eligibleRes.value?.data)) {
        setEligibleRecipients(eligibleRes.value.data);
      }
    }).finally(() => {
      setLoading(false);
    });
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.recipient) {
      showToast({ title: "Recipient required", message: "Please select an eligible recipient candidate.", type: "warning" });
      return;
    }
    setSubmitting(true);
    try {
      await api.post("/outcomes", formData);
      showToast({
        title: "Outcome Recorded",
        message: "Post-transplant clinical follow-up securely archived.",
        type: "success"
      });
      setModalOpen(false);
      setFormData({
        recipient: "",
        surgeryDate: new Date().toISOString().split("T")[0],
        outcome: "Successful Graft Implantation",
        graftFunction: "Optimal Immediate Function",
        dischargeStatus: "Inpatient Recovery",
        complications: "None observed during intraoperative and immediate post-op period.",
        followUpNotes: ""
      });
      loadData();
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to record post-transplant outcome";
      showToast({ title: "Recording failed", message: msg, type: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  const filteredOutcomes = useMemo(() => {
    return outcomes.filter(item => {
      if (filterFunction !== "ALL" && item.graftFunction !== filterFunction) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const rName = (item.recipient?.name || "").toLowerCase();
        const cId = (item.recipient?.candidateId || "").toLowerCase();
        const organ = (item.recipient?.requiredOrgan || "").toLowerCase();
        const out = (item.outcome || "").toLowerCase();
        return rName.includes(q) || cId.includes(q) || organ.includes(q) || out.includes(q);
      }
      return true;
    });
  }, [outcomes, search, filterFunction]);

  const optimalCount = outcomes.filter(o => o.graftFunction === "Optimal Immediate Function").length;
  const delayedCount = outcomes.filter(o => o.graftFunction === "Delayed Graft Function").length;
  const optimalPercent = outcomes.length ? Math.round((optimalCount / outcomes.length) * 100) : 100;

  const canRecord = user?.role === "HOSPITAL" || user?.role === "COORDINATOR" || user?.role === "ADMIN";

  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">CLINICAL GOVERNANCE (FR10)</span>
          <h2>Post-Transplant Outcomes & Graft Tracking</h2>
          <p>Longitudinal registry of surgical outcomes, graft viability, and post-operative recovery indicators.</p>
        </div>
        {canRecord && (
          <button 
            type="button" 
            className="primary-btn" 
            onClick={() => setModalOpen(true)}
            style={{ display: "inline-flex", alignItems: "center", gap: 8 }}
          >
            <Plus size={16} /> Record Follow-up
          </button>
        )}
      </div>

      {/* Summary KPI Cards */}
      <div className="stats-grid">
        <StatCard label="Follow-ups Recorded" value={outcomes.length} icon={ClipboardCheck}/>
        <StatCard label="Optimal Graft Viability" value={`${optimalPercent}%`} icon={Heart}/>
        <StatCard label="Delayed Graft Recovery" value={delayedCount} icon={AlertTriangle}/>
        <StatCard label="Monitored Candidates" value={eligibleRecipients.length} icon={Stethoscope}/>
      </div>

      {/* Filter and Search Bar */}
      <div className="filter-bar">
        <div className="filter-pills">
          <button
            type="button"
            className={`filter-pill${filterFunction === "ALL" ? " active" : ""}`}
            onClick={() => setFilterFunction("ALL")}
          >
            All ({outcomes.length})
          </button>
          <button
            type="button"
            className={`filter-pill${filterFunction === "Optimal Immediate Function" ? " active" : ""}`}
            onClick={() => setFilterFunction("Optimal Immediate Function")}
          >
            Optimal ({optimalCount})
          </button>
          <button
            type="button"
            className={`filter-pill${filterFunction === "Delayed Graft Function" ? " active" : ""}`}
            onClick={() => setFilterFunction("Delayed Graft Function")}
          >
            Delayed ({delayedCount})
          </button>
        </div>

        <div className="search-wrap">
          <Search size={16} color="var(--muted)" />
          <input
            type="text"
            placeholder="Search candidate, organ, or outcome..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Outcomes Records Table */}
      <div className="panel">
        <div className="panel-title">
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Activity size={18} color="var(--brand-mid)" />
            <div>
              <h3>Transplant Recipient Cohort</h3>
              <span>Surveillance registry and clinical follow-up logs</span>
            </div>
          </div>
        </div>

        {loading ? (
          <p style={{ color: "var(--muted)", padding: "24px 0", textAlign: "center" }}>Loading outcome records...</p>
        ) : filteredOutcomes.length === 0 ? (
          <EmptyState
            title="No outcome records found"
            message={search ? "No records matched your search filters." : "No post-transplant follow-up has been logged yet."}
            actionLabel={canRecord ? "Record First Follow-up" : undefined}
            onAction={canRecord ? () => setModalOpen(true) : undefined}
          />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Candidate</th>
                  <th>Organ</th>
                  <th>Surgery Date</th>
                  <th>Primary Outcome</th>
                  <th>Graft Viability</th>
                  <th>Discharge Condition</th>
                  <th>Attending / Recorded By</th>
                </tr>
              </thead>
              <tbody>
                {filteredOutcomes.map(row => (
                  <tr key={row._id}>
                    <td>
                      <div>
                        <strong>{row.recipient?.name || "Candidate"}</strong>
                        <div style={{ fontSize: 11, color: "var(--muted)" }}>
                          {row.recipient?.candidateId || "—"} • {row.recipient?.bloodType || ""}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="badge" style={{ background: "rgba(13,148,136,0.12)", color: "var(--brand-mid)", fontWeight: 600 }}>
                        {row.recipient?.requiredOrgan || "Organ"}
                      </span>
                    </td>
                    <td style={{ fontSize: 13, color: "var(--ink-soft)" }}>
                      {row.surgeryDate ? new Date(row.surgeryDate).toLocaleDateString() : "—"}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: 13, color: "var(--ink)" }}>{row.outcome}</div>
                      {row.complications && (
                        <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>{row.complications}</div>
                      )}
                    </td>
                    <td>
                      <span
                        className="badge"
                        style={{
                          background: row.graftFunction === "Optimal Immediate Function" ? "rgba(15,122,88,0.12)" : "rgba(196,122,18,0.14)",
                          color: row.graftFunction === "Optimal Immediate Function" ? "var(--success)" : "var(--warning)",
                          fontWeight: 700,
                          fontSize: 11
                        }}
                      >
                        {row.graftFunction}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: 12, fontWeight: 500, color: "var(--ink-soft)" }}>
                        {row.dischargeStatus}
                      </span>
                    </td>
                    <td style={{ fontSize: 12, color: "var(--muted)" }}>
                      {row.recordedBy?.name || "Transplant Team"}
                      <div style={{ fontSize: 10 }}>{row.recordedBy?.hospitalName || ""}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal for Recording New Outcome */}
      {modalOpen && (
        <div className="modal-backdrop" onClick={() => setModalOpen(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 580 }}>
            <div className="modal-head">
              <div>
                <span className="eyebrow">POST-OP PROTOCOL</span>
                <h3 style={{ margin: "4px 0 0" }}>Record Transplant Outcome</h3>
              </div>
              <button className="icon-ghost" onClick={() => setModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 16 }}>
              <div>
                <label className="form-label">Recipient Candidate *</label>
                <select
                  className="form-input"
                  required
                  value={formData.recipient}
                  onChange={e => setFormData({ ...formData, recipient: e.target.value })}
                >
                  <option value="">-- Select Recipient Candidate --</option>
                  {eligibleRecipients.map(r => (
                    <option key={r._id} value={r._id}>
                      {r.name} ({r.candidateId} • {r.requiredOrgan} • {r.hospitalName || "Hospital"})
                    </option>
                  ))}
                </select>
                {eligibleRecipients.length === 0 && (
                  <p style={{ fontSize: 11, color: "var(--warning)", margin: "4px 0 0" }}>
                    No matched or post-transplant candidates pending follow-up. Confirm a match or allocate first.
                  </p>
                )}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div>
                  <label className="form-label">Surgery Date *</label>
                  <input
                    type="date"
                    className="form-input"
                    required
                    value={formData.surgeryDate}
                    onChange={e => setFormData({ ...formData, surgeryDate: e.target.value })}
                  />
                </div>
                <div>
                  <label className="form-label">Graft Function *</label>
                  <select
                    className="form-input"
                    value={formData.graftFunction}
                    onChange={e => setFormData({ ...formData, graftFunction: e.target.value })}
                  >
                    {GRAFT_FUNCTION_OPTIONS.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div>
                  <label className="form-label">Primary Clinical Outcome *</label>
                  <input
                    type="text"
                    className="form-input"
                    required
                    placeholder="e.g. Successful Graft Implantation"
                    value={formData.outcome}
                    onChange={e => setFormData({ ...formData, outcome: e.target.value })}
                  />
                </div>
                <div>
                  <label className="form-label">Discharge / Current Status *</label>
                  <select
                    className="form-input"
                    value={formData.dischargeStatus}
                    onChange={e => setFormData({ ...formData, dischargeStatus: e.target.value })}
                  >
                    {DISCHARGE_STATUS_OPTIONS.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="form-label">Complications / Intraoperative Notes</label>
                <textarea
                  className="form-input"
                  rows={2}
                  placeholder="Record ischemia reperfusion injury, vascular patency, or acute rejection signs..."
                  value={formData.complications}
                  onChange={e => setFormData({ ...formData, complications: e.target.value })}
                />
              </div>

              <div>
                <label className="form-label">Follow-up Clinical Notes</label>
                <textarea
                  className="form-input"
                  rows={2}
                  placeholder="Immunosuppressive protocol (e.g. Tacrolimus / MMF), serum creatinine / liver enzymes..."
                  value={formData.followUpNotes}
                  onChange={e => setFormData({ ...formData, followUpNotes: e.target.value })}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
                <button type="button" className="ghost-btn" onClick={() => setModalOpen(false)}>Cancel</button>
                <button type="submit" className="primary-btn" disabled={submitting}>
                  {submitting ? "Archiving..." : "Save Clinical Record"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
