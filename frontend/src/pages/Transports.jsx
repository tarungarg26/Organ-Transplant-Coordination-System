import React, { useEffect, useState } from 'react';
import api from "../api";
import StatusBadge from "../components/StatusBadge";

export default function Transports() {
  const [rows, setRows] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState(null);

  const load = () => {
    api.get("/transports")
      .then(r => setRows(Array.isArray(r.data) ? r.data : []))
      .catch(err => console.error("Could not load transports:", err));
  };

  useEffect(() => {
    load();
  }, []);

  const update = async (id, status) => {
    setError("");
    setMessage("");
    setUpdatingId(id);
    try {
      await api.patch(`/transports/${id}`, { status });
      setMessage(`Transport status updated to ${status}`);
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Transport update failed");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">UC4 · FR7</span>
          <h2>Live transport tracking</h2>
          <p>Update checkpoints, estimated arrival and delivery status. Elapsed time is calculated by the server.</p>
        </div>
      </div>

      {message && <div className="success-box">{message}</div>}
      {error && <div className="error-box">{error}</div>}

      <div className="transport-grid">
        {rows.map(t => {
          const donorName = t.match?.donor?.name || "Donor";
          const recipientName = t.match?.recipient?.name || "Recipient";
          const isUpdating = updatingId === t._id;

          return (
            <div className="transport-card" key={t._id || t.transportId}>
              <div className="panel-title">
                <div>
                  <h3>{t.transportId || "TRN"}</h3>
                  <p>{donorName} → {recipientName}</p>
                </div>
                <StatusBadge>{t.status}</StatusBadge>
              </div>

              <div className="route">
                <div>
                  <span>Current location</span>
                  <strong>{t.currentLocation || "Location pending"}</strong>
                </div>
                <div className="route-line"></div>
                <div>
                  <span>Destination</span>
                  <strong>{t.destinationHospital || "Hospital"}</strong>
                </div>
              </div>

              <div className="transport-metrics">
                <div>
                  <span>Elapsed</span>
                  <strong>{t.elapsedMinutes ?? 0} min</strong>
                </div>
                <div>
                  <span>ETA</span>
                  <strong>{t.estimatedArrival ? new Date(t.estimatedArrival).toLocaleTimeString() : "Not set"}</strong>
                </div>
                <div>
                  <span>Ischemia limit</span>
                  <strong>{t.coldIschemiaLimitMinutes ?? 360} min</strong>
                </div>
              </div>

              <div className="row-actions">
                <button
                  className="secondary-button"
                  disabled={isUpdating || t.status === "PICKED_UP" || t.status === "DELIVERED"}
                  onClick={() => update(t._id, "PICKED_UP")}
                >
                  Picked up
                </button>
                <button
                  className="secondary-button"
                  disabled={isUpdating || t.status === "IN_TRANSIT" || t.status === "DELIVERED"}
                  onClick={() => update(t._id, "IN_TRANSIT")}
                >
                  In transit
                </button>
                <button
                  className="primary-button"
                  disabled={isUpdating || t.status === "DELIVERED"}
                  onClick={() => update(t._id, "DELIVERED")}
                >
                  Delivered
                </button>
              </div>

              {t.status === "EXCEPTION" && (
                <div className="error-box" style={{ marginTop: "10px" }}>
                  <strong>Exception:</strong> {t.exceptionReason || "Transport exception logged."}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {!rows.length && (
        <div className="empty panel">
          <p>No transport jobs active yet.</p>
          <p style={{ fontSize: "12px", color: "var(--muted)", marginTop: "6px" }}>
            Confirm a match in the Matching screen to automatically generate an organ transport job.
          </p>
        </div>
      )}
    </div>
  );
}
