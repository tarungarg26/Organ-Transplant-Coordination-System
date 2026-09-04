import React, { useEffect, useState } from 'react';
import api from "../api";
import StatusBadge from "../components/StatusBadge";

export default function Matches() {
  const [donors, setDonors] = useState([]);
  const [selected, setSelected] = useState("");
  const [ranked, setRanked] = useState([]);
  const [matches, setMatches] = useState([]);
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [evaluating, setEvaluating] = useState(false);

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

  const evaluate = async () => {
    if (!selected) return;
    setError("");
    setSuccess("");
    setEvaluating(true);
    try {
      const { data } = await api.get(`/matches/evaluate/${selected}`);
      setRanked(Array.isArray(data.ranked) ? data.ranked : []);
      if (data.ranked?.length === 0) {
        setError("No compatible recipients found for this donor. The donor has been flagged for manual review.");
      } else {
        setSuccess(`Found ${data.ranked.length} compatible candidate(s)! Review the recommendation below.`);
      }
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Evaluation failed");
    } finally {
      setEvaluating(false);
    }
  };

  const confirm = async id => {
    setError("");
    setSuccess("");
    try {
      const res = await api.post(`/matches/${id}/confirm`);
      setSuccess(`Match confirmed successfully! Organ transport job created.`);
      load();
      setRanked([]);
    } catch (err) {
      setError(err.response?.data?.message || "Confirmation failed");
    }
  };

  const reject = async id => {
    if (!reason.trim()) {
      setError("Please enter a rejection reason before rejecting.");
      return;
    }
    setError("");
    setSuccess("");
    try {
      await api.post(`/matches/${id}/reject`, { reason });
      setReason("");
      setSuccess("Match rejected. Next candidate can be evaluated.");
      load();
      setRanked(prev => prev.filter(x => x._id !== id));
    } catch (err) {
      setError(err.response?.data?.message || "Rejection failed");
    }
  };

  const availableDonors = donors.filter(d => 
    d?.status?.includes("Available") || d?.status === "Flagged"
  );

  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">UC3 · FR3 · FR4 · FR5 · FR6</span>
          <h2>Matching & allocation</h2>
          <p>Evaluate compatibility, review ranked candidates, then confirm or reject the proposed match.</p>
        </div>
      </div>

      {success && <div className="success-box">{success}</div>}
      {error && <div className="error-box">{error}</div>}

      <div className="panel action-panel">
        <label>Available donor
          <select value={selected} onChange={e => setSelected(e.target.value)}>
            <option value="">Select an available donor</option>
            {availableDonors.map(d => (
              <option key={d._id} value={d._id}>
                {d.donorId} · {d.name} · {d.organType} ({d.bloodType})
              </option>
            ))}
          </select>
        </label>
        <button className="primary-button" disabled={!selected || evaluating} onClick={evaluate}>
          {evaluating ? "Evaluating compatibility..." : "Run compatibility evaluation"}
        </button>
      </div>

      {ranked.length > 0 && (
        <div className="panel">
          <div className="panel-title">
            <h3>Ranked compatibility list</h3>
            <span>Recommendation only — coordinator makes final decision</span>
          </div>
          <div className="rank-list">
            {ranked.map((m, i) => (
              <div className="rank-card" key={m._id || i}>
                <div className="rank-number">#{i + 1}</div>
                <div className="rank-main">
                  <h3>{m.recipient?.name || "Candidate"}</h3>
                  <p>
                    {m.recipient?.candidateId || "CAN"} · Urgency: {m.recipient?.urgencyStatus || "—"} · Distance: {m.distanceKm ?? "—"} km
                  </p>
                  <div className="reason-list">
                    {Array.isArray(m.reasons) && m.reasons.map((r, ri) => (
                      <span key={ri}>{r}</span>
                    ))}
                  </div>
                </div>
                <div className="score">
                  <strong>{m.matchScore ?? 0}</strong>
                  <small>score</small>
                </div>
                <div className="row-actions">
                  <button className="primary-button" onClick={() => confirm(m._id)}>Confirm match</button>
                  <button className="secondary-button" onClick={() => reject(m._id)}>Reject</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="panel">
        <div className="panel-title">
          <h3>Decision history</h3>
          <input
            className="inline-input"
            placeholder="Rejection reason for next reject action"
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
                <th>Decision / Reason</th>
              </tr>
            </thead>
            <tbody>
              {matches.map(m => (
                <tr key={m._id || m.matchId}>
                  <td>{m.matchId || "—"}</td>
                  <td>{m.donor?.name || "Donor"}</td>
                  <td>{m.recipient?.name || "Candidate"}</td>
                  <td>{m.matchScore ?? "—"}</td>
                  <td><StatusBadge>{m.status}</StatusBadge></td>
                  <td>{m.rejectionReason || m.coordinator?.name || "—"}</td>
                </tr>
              ))}
              {!matches.length && (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: "20px", color: "var(--muted)" }}>
                    No matching decisions recorded yet.
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
