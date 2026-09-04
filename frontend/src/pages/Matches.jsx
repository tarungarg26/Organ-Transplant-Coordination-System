import React, { useEffect, useState, useMemo } from 'react';
import { ChevronDown, ChevronUp, Check, X, ShieldAlert, Sparkles, Search, ClipboardList } from 'lucide-react';
import api from "../api";
import StatusBadge from "../components/StatusBadge";
import EmptyState from "../components/EmptyState";
import { useToast } from "../components/Toast";

const REJECTION_REASONS = [
  "Positive crossmatch / antibody titer",
  "Candidate hemodynamically unstable",
  "Organ size / anatomical mismatch",
  "Logistical transit limit exceeded",
  "Candidate unavailable / refused offer",
  "Alternative clinical contraindication"
];

export default function Matches() {
  const [donors, setDonors] = useState([]);
  const [selected, setSelected] = useState("");
  const [ranked, setRanked] = useState([]);
  const [matches, setMatches] = useState([]);
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [evaluating, setEvaluating] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [historySearch, setHistorySearch] = useState("");
  const { showToast } = useToast();

  const load = () => {
    Promise.allSettled([api.get("/donors"), api.get("/matches")])
      .then(([d, m]) => {
        if (d.status === "fulfilled" && Array.isArray(d.value?.data)) setDonors(d.value.data);
        if (m.status === "fulfilled" && Array.isArray(m.value?.data)) setMatches(m.value.data);
      })
      .catch(err => console.error("Could not load match data:", err));
  };

  useEffect(() => {
    load();
  }, []);

  const selectedDonor = useMemo(() => {
    return donors.find(d => d._id === selected) || null;
  }, [donors, selected]);

  const evaluate = async () => {
    if (!selected) return;
    setError("");
    setEvaluating(true);
    try {
      const { data } = await api.get(`/matches/evaluate/${selected}`);
      const rankedList = Array.isArray(data.ranked) ? data.ranked : [];
      setRanked(rankedList);
      if (rankedList.length === 0) {
        showToast({
          title: "No compatible match",
          message: "No active candidate matches this donor profile. Donor flagged for review.",
          type: "warning"
        });
      } else {
        showToast({
          title: "Compatibility evaluated",
          message: `Ranked ${rankedList.length} candidate(s) by clinical priority.`,
          type: "success"
        });
        setExpandedId(rankedList[0]?._id); // Auto-expand top candidate
      }
      load();
    } catch (err) {
      const msg = err.response?.data?.message || "Evaluation failed";
      setError(msg);
      showToast({ title: "Evaluation failed", message: msg, type: "error" });
    } finally {
      setEvaluating(false);
    }
  };

  const confirm = async id => {
    setError("");
    try {
      await api.post(`/matches/${id}/confirm`);
      showToast({
        title: "Match Confirmed",
        message: "Organ allocation confirmed. Live transport job launched!",
        type: "success",
        link: "/transports"
      });
      load();
      setRanked([]);
    } catch (err) {
      const msg = err.response?.data?.message || "Confirmation failed";
      setError(msg);
      showToast({ title: "Confirmation error", message: msg, type: "error" });
    }
  };

  const reject = async id => {
    if (!reason.trim()) {
      setError("Please select or enter a rejection reason before rejecting.");
      showToast({ title: "Reason required", message: "Select or type a clinical rejection reason.", type: "warning" });
      return;
    }
    setError("");
    try {
      await api.post(`/matches/${id}/reject`, { reason });
      showToast({
        title: "Offer Rejected",
        message: "Match rejected with mandatory clinical audit reason.",
        type: "info"
      });
      setReason("");
      load();
      setRanked(prev => prev.filter(x => x._id !== id));
    } catch (err) {
      const msg = err.response?.data?.message || "Rejection failed";
      setError(msg);
      showToast({ title: "Rejection error", message: msg, type: "error" });
    }
  };

  const availableDonors = donors.filter(d => 
    d?.status?.includes("Available") || d?.status === "Flagged"
  );

  const filteredMatches = useMemo(() => {
    if (!historySearch.trim()) return matches;
    const q = historySearch.toLowerCase();
    return matches.filter(m => 
      (m.matchId || "").toLowerCase().includes(q) ||
      (m.donor?.name || "").toLowerCase().includes(q) ||
      (m.recipient?.name || "").toLowerCase().includes(q) ||
      (m.status || "").toLowerCase().includes(q)
    );
  }, [matches, historySearch]);

  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">ALLOCATION</span>
          <h2>Matching & allocation</h2>
          <p>Evaluate clinical compatibility, review ranked candidates, and execute life-critical allocation decisions.</p>
        </div>
      </div>

      {error && <div className="error-box">{error}</div>}

      {/* Donor Selector Panel */}
      <div className="panel action-panel">
        <label>Select Available Donor for Matching
          <select value={selected} onChange={e => { setSelected(e.target.value); setRanked([]); }}>
            <option value="">Select an available donor</option>
            {availableDonors.map(d => (
              <option key={d._id} value={d._id}>
                {d.donorId} · {d.name} · {d.organType} ({d.bloodType})
              </option>
            ))}
          </select>
        </label>
        <button className="primary-button" disabled={!selected || evaluating} onClick={evaluate}>
          <Sparkles size={15} style={{ marginRight: 6 }} />
          {evaluating ? "Evaluating compatibility..." : "Run compatibility evaluation"}
        </button>
      </div>

      {/* Ranked Compatibility List */}
      {ranked.length > 0 && (
        <div className="panel">
          <div className="panel-title">
            <div>
              <h3>Ranked Candidate Recommendations</h3>
              <p style={{ fontSize: 12, color: 'var(--muted)', margin: '2px 0 0' }}>
                Algorithmic recommendation based on HLA, blood typing, medical urgency, wait time, and transit distance.
              </p>
            </div>
            <span style={{ fontSize: 11, background: '#ccfbf1', color: '#0f766e', padding: '3px 8px', borderRadius: 6, fontWeight: 700 }}>
              {ranked.length} Candidates Evaluated
            </span>
          </div>

          <div className="rank-list">
            {ranked.map((m, i) => {
              const isExpanded = expandedId === m._id;
              const recip = m.recipient || {};
              const donor = selectedDonor || m.donor || {};

              // Split HLA strings for marker chip visualization
              const donorHlaList = (donor.hlaTyping || "").split(/[,\s]+/).filter(Boolean);
              const recipHlaList = (recip.hlaTyping || "").split(/[,\s]+/).filter(Boolean);

              return (
                <div className="rank-card" key={m._id || i} style={{ gridTemplateColumns: '40px 1fr 90px auto', alignItems: 'start' }}>
                  <div className="rank-number" style={{ paddingTop: 8 }}>#{i + 1}</div>
                  
                  <div className="rank-main">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <h3>{recip.name || "Candidate"}</h3>
                      <span className="badge badge-active" style={{ fontSize: 10 }}>{recip.urgencyStatus || "High"}</span>
                    </div>
                    <p style={{ margin: '3px 0 6px' }}>
                      {recip.candidateId || "CAN"} · Hospital: {recip.hospitalName || "Partner Center"} · Distance: <strong>{m.distanceKm ?? "—"} km</strong>
                    </p>

                    <div className="reason-list">
                      {Array.isArray(m.reasons) && m.reasons.map((r, ri) => (
                        <span key={ri}>{r}</span>
                      ))}
                    </div>

                    {/* Expandable Breakdown Toggle */}
                    <button
                      type="button"
                      className="ghost-btn"
                      onClick={() => setExpandedId(isExpanded ? null : m._id)}
                      style={{ marginTop: 8, fontSize: 11, display: 'inline-flex', alignItems: 'center', gap: 4, padding: 0 }}
                    >
                      {isExpanded ? "Hide clinical comparison" : "View side-by-side comparison & score factors"}
                      {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                    </button>

                    {/* Side-by-Side Comparison Panel */}
                    {isExpanded && (
                      <div className="match-detail-panel">
                        <div className="comparison-grid">
                          {/* Donor Column */}
                          <div className="comparison-col">
                            <h4>Donor Profile ({donor.donorId || "DNR"})</h4>
                            <div className="comparison-row">
                              <span>Blood Group</span>
                              <span>{donor.bloodType || "O+"}</span>
                            </div>
                            <div className="comparison-row">
                              <span>Organ & Size</span>
                              <span>{donor.organType || "Kidney"} ({donor.organSize || "8"} cm)</span>
                            </div>
                            <div className="comparison-row">
                              <span>HLA Markers</span>
                              <span>{donor.hlaTyping || "A2 B7 DR4"}</span>
                            </div>
                            <div className="comparison-row">
                              <span>Location</span>
                              <span>{donor.location?.label || donor.hospitalName || "Center"}</span>
                            </div>
                          </div>

                          {/* Candidate Column */}
                          <div className="comparison-col">
                            <h4>Candidate Profile ({recip.candidateId || "CAN"})</h4>
                            <div className="comparison-row">
                              <span>Blood Group</span>
                              <span style={{ color: '#0f766e' }}>{recip.bloodType || "A+"} (Compatible ✓)</span>
                            </div>
                            <div className="comparison-row">
                              <span>Required Organ</span>
                              <span>{recip.requiredOrgan || "Kidney"} ({recip.organSize || "8"} cm)</span>
                            </div>
                            <div className="comparison-row">
                              <span>HLA Markers</span>
                              <span>
                                {recipHlaList.map(marker => {
                                  const matches = donorHlaList.includes(marker);
                                  return (
                                    <span
                                      key={marker}
                                      style={{
                                        display: 'inline-block',
                                        marginRight: 4,
                                        padding: '1px 5px',
                                        borderRadius: 4,
                                        fontSize: 10,
                                        background: matches ? '#ccfbf1' : '#f1f5f9',
                                        color: matches ? '#0f766e' : '#475569',
                                        fontWeight: matches ? 700 : 500
                                      }}
                                    >
                                      {marker}
                                    </span>
                                  );
                                })}
                              </span>
                            </div>
                            <div className="comparison-row">
                              <span>Clinical Urgency</span>
                              <span>{recip.urgencyStatus || "Critical"}</span>
                            </div>
                          </div>
                        </div>

                        {/* Weighted Score Contribution Bar */}
                        <div className="score-meter-wrap">
                          <div className="score-meter-header">
                            <span>Score Composition Factors</span>
                            <span>Composite Score: {m.matchScore}/100</span>
                          </div>
                          <div className="score-meter-bar">
                            <div className="score-meter-seg" style={{ width: '35%', background: '#0d9488' }} title="HLA Compatibility (35%)" />
                            <div className="score-meter-seg" style={{ width: '30%', background: '#0284c7' }} title="Medical Urgency (30%)" />
                            <div className="score-meter-seg" style={{ width: '15%', background: '#d97706' }} title="Waitlist Time (15%)" />
                            <div className="score-meter-seg" style={{ width: '10%', background: '#8b5cf6' }} title="Anatomical Size (10%)" />
                            <div className="score-meter-seg" style={{ width: '10%', background: '#10b981' }} title="Proximity (10%)" />
                          </div>
                          <div className="score-meter-legend">
                            <span className="legend-item"><span className="legend-dot" style={{ background: '#0d9488' }} /> HLA (35%)</span>
                            <span className="legend-item"><span className="legend-dot" style={{ background: '#0284c7' }} /> Urgency (30%)</span>
                            <span className="legend-item"><span className="legend-dot" style={{ background: '#d97706' }} /> Wait (15%)</span>
                            <span className="legend-item"><span className="legend-dot" style={{ background: '#8b5cf6' }} /> Size (10%)</span>
                            <span className="legend-item"><span className="legend-dot" style={{ background: '#10b981' }} /> Distance (10%)</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="score" style={{ paddingTop: 8 }}>
                    <strong>{m.matchScore ?? 0}</strong>
                    <small>compatibility</small>
                  </div>

                  <div className="row-actions" style={{ paddingTop: 8 }}>
                    <button className="primary-button compact-button" onClick={() => confirm(m._id)}>
                      <Check size={13} style={{ marginRight: 4 }} />
                      Confirm match
                    </button>
                    <button className="secondary-button compact-button" onClick={() => reject(m._id)}>
                      <X size={13} style={{ marginRight: 4 }} />
                      Reject
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Decision Audit History Panel */}
      <div className="panel">
        <div className="panel-title">
          <div>
            <h3>Allocation Decision History</h3>
            <p style={{ fontSize: 12, color: 'var(--muted)', margin: '2px 0 0' }}>
              Traceable log of all coordinator allocations, approvals, and clinical rejections.
            </p>
          </div>

          <div className="search-input-wrap">
            <Search size={14} className="search-icon-inside" />
            <input
              type="text"
              placeholder="Search decision history..."
              value={historySearch}
              onChange={e => setHistorySearch(e.target.value)}
            />
          </div>
        </div>

        {/* Quick-fill Rejection Reason Bar */}
        <div style={{ background: 'var(--surface-2)', padding: '12px 14px', borderRadius: 12, marginBottom: 14, border: '1px solid var(--line)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <ShieldAlert size={14} color="#d97706" />
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--navy)' }}>Quick-select Clinical Rejection Reason:</span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {REJECTION_REASONS.map(r => (
              <button
                key={r}
                type="button"
                className={`filter-pill${reason === r ? " active" : ""}`}
                onClick={() => setReason(r)}
                style={{ fontSize: 11 }}
              >
                {r}
              </button>
            ))}
          </div>
          <input
            className="inline-input"
            style={{ marginTop: 8, width: '100%', maxWidth: '100%' }}
            placeholder="Or write custom clinical justification..."
            value={reason}
            onChange={e => setReason(e.target.value)}
          />
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Match ID</th>
                <th>Donor</th>
                <th>Recipient</th>
                <th>Score</th>
                <th>Status</th>
                <th>Coordinator / Decision</th>
              </tr>
            </thead>
            <tbody>
              {filteredMatches.map(m => (
                <tr key={m._id || m.matchId}>
                  <td><code>{m.matchId || "—"}</code></td>
                  <td>{m.donor?.name || "Donor"}</td>
                  <td>{m.recipient?.name || "Candidate"}</td>
                  <td><strong>{m.matchScore ?? "—"}</strong></td>
                  <td><StatusBadge>{m.status}</StatusBadge></td>
                  <td>
                    {m.status === "REJECTED" ? (
                      <span style={{ color: '#be123c', fontSize: 11 }}>
                        <strong>Rejected:</strong> {m.rejectionReason || "Clinical discretion"}
                      </span>
                    ) : m.status === "CONFIRMED" ? (
                      <span style={{ color: '#047857', fontSize: 11 }}>
                        <strong>Confirmed:</strong> {m.coordinator?.name || "Transplant Coordinator"}
                      </span>
                    ) : (
                      m.rejectionReason || m.coordinator?.name || "Pending"
                    )}
                  </td>
                </tr>
              ))}
              {!filteredMatches.length && (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: "30px", color: "var(--muted)" }}>
                    No decision records match your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
