import React, { useEffect, useState, useMemo } from 'react';
import { Truck, Search } from 'lucide-react';
import api from "../api";
import StatusBadge from "../components/StatusBadge";
import ColdIschemiaGauge from "../components/ColdIschemiaGauge";
import TransportStepper from "../components/TransportStepper";
import EmptyState from "../components/EmptyState";
import { useToast } from "../components/Toast";

export default function Transports() {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState(null);
  const [filter, setFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const { showToast } = useToast();

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
    setUpdatingId(id);
    try {
      await api.patch(`/transports/${id}`, { status });
      showToast({
        title: "Status updated",
        message: `Transport transitioned to ${status}`,
        type: status === "DELIVERED" ? "success" : "info"
      });
      load();
    } catch (err) {
      const msg = err.response?.data?.message || "Transport update failed";
      setError(msg);
      showToast({ title: "Update failed", message: msg, type: "error" });
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredRows = useMemo(() => {
    return rows.filter(t => {
      // Status filter
      if (filter === "ACTIVE" && (t.status === "DELIVERED" || t.status === "EXCEPTION")) return false;
      if (filter === "DELIVERED" && t.status !== "DELIVERED") return false;
      if (filter === "EXCEPTION" && t.status !== "EXCEPTION") return false;

      // Search
      if (search.trim()) {
        const q = search.toLowerCase();
        const tid = (t.transportId || "").toLowerCase();
        const dest = (t.destinationHospital || "").toLowerCase();
        const donor = (t.match?.donor?.name || "").toLowerCase();
        const recip = (t.match?.recipient?.name || "").toLowerCase();
        return tid.includes(q) || dest.includes(q) || donor.includes(q) || recip.includes(q);
      }

      return true;
    });
  }, [rows, filter, search]);

  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">LIVE LOGISTICS</span>
          <h2>Live transport tracking</h2>
          <p>Real-time organ transport tracking, checkpoint validation, and cold ischemia monitoring.</p>
        </div>
      </div>

      {error && <div className="error-box">{error}</div>}

      {/* Filter and Search Bar */}
      <div className="filter-bar">
        <div className="filter-pills">
          <button
            type="button"
            className={`filter-pill${filter === "ALL" ? " active" : ""}`}
            onClick={() => setFilter("ALL")}
          >
            All ({rows.length})
          </button>
          <button
            type="button"
            className={`filter-pill${filter === "ACTIVE" ? " active" : ""}`}
            onClick={() => setFilter("ACTIVE")}
          >
            In Transit ({rows.filter(t => !["DELIVERED", "EXCEPTION"].includes(t.status)).length})
          </button>
          <button
            type="button"
            className={`filter-pill${filter === "DELIVERED" ? " active" : ""}`}
            onClick={() => setFilter("DELIVERED")}
          >
            Delivered ({rows.filter(t => t.status === "DELIVERED").length})
          </button>
          <button
            type="button"
            className={`filter-pill${filter === "EXCEPTION" ? " active" : ""}`}
            onClick={() => setFilter("EXCEPTION")}
          >
            Exceptions ({rows.filter(t => t.status === "EXCEPTION").length})
          </button>
        </div>

        <div className="search-input-wrap">
          <Search size={14} className="search-icon-inside" />
          <input
            type="text"
            placeholder="Search by ID, hospital, patient..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="transport-grid">
        {filteredRows.map(t => {
          const donorName = t.match?.donor?.name || "Donor";
          const recipientName = t.match?.recipient?.name || "Recipient";
          const organType = t.match?.donor?.organType || "Organ";
          const isUpdating = updatingId === t._id;

          return (
            <div className="transport-card" key={t._id || t.transportId}>
              <div className="panel-title">
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <h3>{t.transportId || "TRN"}</h3>
                    <span style={{ fontSize: 11, background: '#e0f2fe', color: '#0369a1', padding: '2px 7px', borderRadius: 4, fontWeight: 700 }}>
                      {organType}
                    </span>
                  </div>
                  <p>{donorName} → {recipientName}</p>
                </div>
                <StatusBadge>{t.status}</StatusBadge>
              </div>

              {/* Cold Ischemia Gauge */}
              <ColdIschemiaGauge
                elapsedMinutes={t.elapsedMinutes ?? 0}
                limitMinutes={t.coldIschemiaLimitMinutes ?? 360}
              />

              {/* Checkpoint Stepper */}
              <TransportStepper
                currentStatus={t.status}
                checkpoints={t.checkpoints || []}
              />

              {/* Route line */}
              <div className="route">
                <div>
                  <span>Origin / Pickup</span>
                  <strong>{t.currentLocation || "Hospital OR"}</strong>
                </div>
                <div className="route-line"></div>
                <div>
                  <span>Destination</span>
                  <strong>{t.destinationHospital || "Transplant Center"}</strong>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="row-actions">
                <button
                  className="secondary-button compact-button"
                  disabled={isUpdating || t.status === "PICKED_UP" || t.status === "IN_TRANSIT" || t.status === "DELIVERED"}
                  onClick={() => update(t._id, "PICKED_UP")}
                >
                  Picked up
                </button>
                <button
                  className="secondary-button compact-button"
                  disabled={isUpdating || t.status === "IN_TRANSIT" || t.status === "DELIVERED"}
                  onClick={() => update(t._id, "IN_TRANSIT")}
                >
                  In transit
                </button>
                <button
                  className="primary-button compact-button"
                  disabled={isUpdating || t.status === "DELIVERED"}
                  onClick={() => update(t._id, "DELIVERED")}
                >
                  Delivered
                </button>
              </div>

              {t.status === "EXCEPTION" && (
                <div className="error-box" style={{ marginTop: "12px" }}>
                  <strong>Transport Exception:</strong> {t.exceptionReason || "Delivery route interrupted or vehicle issue."}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {!filteredRows.length && (
        <EmptyState
          icon={Truck}
          title="No transport jobs found"
          description={
            rows.length === 0
              ? "Organ transport jobs are automatically initiated when a match is confirmed in the Matching & Allocation workspace."
              : "No transport jobs matched your current filter criteria."
          }
          actionLabel={rows.length === 0 ? "Go to Matching & Allocation" : "Reset Filters"}
          actionLink={rows.length === 0 ? "/matches" : undefined}
          onAction={rows.length > 0 ? () => { setFilter("ALL"); setSearch(""); } : undefined}
        />
      )}
    </div>
  );
}
