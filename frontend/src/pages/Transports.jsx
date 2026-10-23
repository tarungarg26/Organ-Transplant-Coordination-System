import React, { useEffect, useState, useMemo } from 'react';
import { Truck, Search, Navigation, Printer, MapPin, Clock, AlertTriangle, ShieldCheck } from 'lucide-react';
import api from "../api";
import StatusBadge from "../components/StatusBadge";
import ColdIschemiaGauge from "../components/ColdIschemiaGauge";
import TransportStepper from "../components/TransportStepper";
import EmptyState from "../components/EmptyState";
import AllocationManifestModal from "../components/AllocationManifestModal";
import { useToast } from "../components/Toast";

export default function Transports() {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState(null);
  const [filter, setFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [manifestMatch, setManifestMatch] = useState(null);
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

  const simulateStep = async (id) => {
    setError("");
    setUpdatingId(id);
    try {
      const res = await api.post(`/transports/${id}/simulate-step`);
      showToast({
        title: "GPS Progress Simulated",
        message: `Transport advanced: ${res.data.status} • Location: ${res.data.currentLocation}`,
        type: res.data.status === "DELIVERED" ? "success" : "info"
      });
      load();
    } catch (err) {
      const msg = err.response?.data?.message || "Simulation step failed";
      setError(msg);
      showToast({ title: "Simulation error", message: msg, type: "error" });
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredRows = useMemo(() => {
    return rows.filter(t => {
      if (filter === "ACTIVE" && (t.status === "DELIVERED" || t.status === "EXCEPTION")) return false;
      if (filter === "DELIVERED" && t.status !== "DELIVERED") return false;
      if (filter === "EXCEPTION" && t.status !== "EXCEPTION") return false;

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
          <span className="eyebrow">LIVE LOGISTICS & GPS TELEMETRY</span>
          <h2>Organ Transport & Logistics Control</h2>
          <p>Real-time organ transport tracking, checkpoint telemetry, and physiological cold ischemia monitoring.</p>
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
          const isDelivered = t.status === "DELIVERED";

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

              {/* Cold Ischemia Gauge with Organ-Specific Limits */}
              <ColdIschemiaGauge
                elapsedMinutes={t.elapsedMinutes ?? 0}
                limitMinutes={t.coldIschemiaLimitMinutes ?? 360}
              />

              {/* Checkpoint Stepper */}
              <TransportStepper
                currentStatus={t.status}
                checkpoints={t.checkpoints || []}
              />

              {/* Dynamic GPS Waypoint Route Map */}
              <div className="route" style={{ background: "var(--surface-2)", padding: "12px 14px", borderRadius: 10, border: "1px solid var(--line)" }}>
                <div>
                  <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "var(--muted)" }}>
                    <MapPin size={12} color="#0d9488" /> Origin / Donor Facility
                  </span>
                  <strong style={{ fontSize: 12 }}>{t.pickupLocation || "Hospital OR"}</strong>
                </div>

                <div className="route-line" style={{ margin: "8px 0", position: "relative" }}>
                  <div style={{ 
                    position: "absolute", 
                    top: -6, 
                    left: isDelivered ? "92%" : t.status === "IN_TRANSIT" ? "50%" : "15%",
                    transform: "translateX(-50%)",
                    transition: "left 0.8s ease"
                  }}>
                    <span style={{ 
                      display: "inline-flex", 
                      alignItems: "center", 
                      gap: 4, 
                      background: isDelivered ? "#0f7a58" : "#0d9488", 
                      color: "#fff", 
                      fontSize: 10, 
                      padding: "2px 6px", 
                      borderRadius: 4,
                      boxShadow: "0 2px 6px rgba(0,0,0,0.15)"
                    }}>
                      <Truck size={11} /> {t.currentLocation || "In Transit"}
                    </span>
                  </div>
                </div>

                <div>
                  <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "var(--muted)" }}>
                    <MapPin size={12} color="#be3a3a" /> Destination Transplant Center
                  </span>
                  <strong style={{ fontSize: 12 }}>{t.destinationHospital || "Transplant Center"}</strong>
                </div>
              </div>

              {/* Action Buttons & Simulation */}
              <div className="row-actions" style={{ flexWrap: "wrap", gap: 8 }}>
                <button
                  type="button"
                  className="compact-button secondary-button"
                  disabled={isUpdating || t.status === "PICKED_UP" || t.status === "IN_TRANSIT" || isDelivered}
                  onClick={() => update(t._id, "PICKED_UP")}
                >
                  Picked up
                </button>
                <button
                  type="button"
                  className="compact-button secondary-button"
                  disabled={isUpdating || t.status === "IN_TRANSIT" || isDelivered}
                  onClick={() => update(t._id, "IN_TRANSIT")}
                >
                  In transit
                </button>
                <button
                  type="button"
                  className="compact-button primary-button"
                  disabled={isUpdating || isDelivered}
                  onClick={() => update(t._id, "DELIVERED")}
                >
                  Delivered
                </button>
                
                {/* Demo Simulation Step Button */}
                <button
                  type="button"
                  className="compact-button"
                  style={{
                    background: "rgba(20, 184, 166, 0.12)",
                    color: "var(--brand-dark)",
                    fontWeight: 700,
                    border: "1px solid rgba(20, 184, 166, 0.35)",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4
                  }}
                  disabled={isUpdating || isDelivered}
                  onClick={() => simulateStep(t._id)}
                  title="Simulate GPS progression along transit corridor"
                >
                  <Navigation size={12} /> {isUpdating ? "Advancing..." : "Simulate GPS"}
                </button>

                {/* Print Official Manifest */}
                {t.match && (
                  <button
                    type="button"
                    className="compact-button secondary-button"
                    onClick={() => setManifestMatch(t.match)}
                    style={{ display: "inline-flex", alignItems: "center", gap: 4 }}
                    title="View & print official transfer manifest"
                  >
                    <Printer size={12} /> Manifest
                  </button>
                )}
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

      {manifestMatch && (
        <AllocationManifestModal
          match={manifestMatch}
          onClose={() => setManifestMatch(null)}
        />
      )}
    </div>
  );
}

