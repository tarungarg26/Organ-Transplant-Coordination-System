import React, { useEffect, useState } from 'react';
import api from "../api";

export default function Reports() {
  const [audit, setAudit] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState("");

  const load = () => {
    api.get("/reports/audit")
      .then(r => setAudit(Array.isArray(r.data) ? r.data : []))
      .catch(err => {
        setError(err.response?.data?.message || "Could not load audit log");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const download = async () => {
    setError("");
    setDownloading(true);
    try {
      const res = await api.get("/reports/compliance.csv", { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([res.data], { type: 'text/csv' }));
      const a = document.createElement("a");
      a.href = url;
      a.download = "otcs-compliance-report.csv";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to download compliance report");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">GOVERNANCE</span>
          <h2>Compliance & audit</h2>
          <p>Review match decisions and export a compliance report.</p>
        </div>
        <button className="primary-button" onClick={download} disabled={downloading}>
          {downloading ? "Generating CSV..." : "Export CSV report"}
        </button>
      </div>

      {error && <div className="error-box">{error}</div>}

      <div className="panel">
        <div className="panel-title">
          <h3>Audit log</h3>
          <span>{audit.length} recent events</span>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Time</th>
                <th>User</th>
                <th>Action</th>
                <th>Entity</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {audit.map(a => (
                <tr key={a._id}>
                  <td>{a.createdAt ? new Date(a.createdAt).toLocaleString() : "—"}</td>
                  <td>{a.userName || "System"}</td>
                  <td><strong>{a.action}</strong></td>
                  <td>{a.entityType} {a.entityId || ""}</td>
                  <td>
                    <code style={{ whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
                      {typeof a.details === "object" ? JSON.stringify(a.details) : String(a.details || "")}
                    </code>
                  </td>
                </tr>
              ))}
              {!audit.length && (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", padding: "20px", color: "var(--muted)" }}>
                    {loading ? "Loading audit trail..." : "No audit events recorded yet."}
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
