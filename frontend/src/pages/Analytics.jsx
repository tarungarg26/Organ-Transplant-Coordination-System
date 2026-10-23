import React, { useEffect, useState } from 'react';
import api from "../api";
import StatCard from "../components/StatCard";
import { Building2, CheckCircle2, Clock3, HeartPulse, Activity, PieChart, ShieldAlert } from "lucide-react";

const ORGAN_COLORS = ["#0d9488", "#14b8a6", "#0284c7", "#6366f1", "#f59e0b", "#ec4899", "#8b5cf6"];
const URGENCY_COLORS = { Critical: "#be3a3a", High: "#c47a12", Medium: "#1d6f9a", Low: "#0f7a58" };

export default function Analytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    api.get("/analytics")
      .then(r => {
        if (mounted) setData(r.data);
      })
      .catch(err => console.error("Could not load analytics:", err))
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => { mounted = false; };
  }, []);

  const totalOrgans = Array.isArray(data?.organBreakdown)
    ? data.organBreakdown.reduce((s, o) => s + (o.count || 0), 0)
    : 0;

  const totalUrgent = Array.isArray(data?.urgencyBreakdown)
    ? data.urgencyBreakdown.reduce((s, u) => s + (u.count || 0), 0)
    : 0;

  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">OPERATIONAL INTELLIGENCE</span>
          <h2>Analytics & Performance</h2>
          <p>Real-time indicators for allocation velocity, organ distribution, and hospital participation.</p>
        </div>
      </div>

      <div className="stats-grid">
        <StatCard label="Registered Donors" value={data?.donors ?? "—"} icon={HeartPulse}/>
        <StatCard label="Waitlist Candidates" value={data?.recipients ?? "—"} icon={Clock3}/>
        <StatCard label="Confirmed Allocations" value={data?.confirmedMatches ?? "—"} icon={CheckCircle2}/>
        <StatCard label="Completed Deliveries" value={data?.successfulTransplants ?? "—"} icon={Activity}/>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 20, marginBottom: 24 }}>
        {/* Hospital Performance Chart */}
        <div className="panel">
          <div className="panel-title">
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Building2 size={18} color="var(--brand-mid)" />
              <div>
                <h3>Hospital Procurement</h3>
                <span>Donor registrations by medical center</span>
              </div>
            </div>
          </div>
          {loading && <p style={{ color: "var(--muted)", padding: "20px 0" }}>Loading hospital data...</p>}
          {Array.isArray(data?.hospitalPerformance) && data.hospitalPerformance.map((h, i) => {
            const max = Math.max(1, ...data.hospitalPerformance.map(x => x.donors || 0));
            const pct = Math.round(((h.donors || 0) / max) * 100);
            return (
              <div className="bar-row" key={h._id || i}>
                <span style={{ fontSize: 13, fontWeight: 500, color: "var(--ink)" }}>{h._id || "Unassigned Hospital"}</span>
                <div className="bar" style={{ height: 10, background: "var(--line)" }}>
                  <i style={{ width: `${Math.max(8, pct)}%`, background: "linear-gradient(90deg, var(--brand-mid), var(--brand-bright))", transition: "width 0.8s ease" }}></i>
                </div>
                <strong style={{ fontSize: 13 }}>{h.donors || 0}</strong>
              </div>
            );
          })}
          {!loading && (!data?.hospitalPerformance || data.hospitalPerformance.length === 0) && (
            <p style={{ color: "var(--muted)", padding: "20px 0", textAlign: "center" }}>
              No hospital activity recorded yet.
            </p>
          )}
        </div>

        {/* Organ Type Breakdown (Donut Chart) */}
        <div className="panel">
          <div className="panel-title">
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <PieChart size={18} color="var(--brand-mid)" />
              <div>
                <h3>Organ Distribution</h3>
                <span>Procured organs by anatomical classification</span>
              </div>
            </div>
          </div>

          {loading ? (
            <p style={{ color: "var(--muted)", padding: "20px 0" }}>Loading organ breakdown...</p>
          ) : totalOrgans === 0 ? (
            <p style={{ color: "var(--muted)", padding: "20px 0", textAlign: "center" }}>No organ intake data yet.</p>
          ) : (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-around", flexWrap: "wrap", gap: 20, paddingTop: 12 }}>
              {/* Circular SVG Donut */}
              <div style={{ position: "relative", width: 140, height: 140 }}>
                <svg width="140" height="140" viewBox="0 0 140 140" style={{ transform: "rotate(-90deg)" }}>
                  {(() => {
                    let accumulatedOffset = 0;
                    const r = 50;
                    const circumference = 2 * Math.PI * r;
                    return data.organBreakdown.map((item, idx) => {
                      const share = (item.count || 0) / totalOrgans;
                      const strokeDash = share * circumference;
                      const strokeOffset = accumulatedOffset;
                      accumulatedOffset += strokeDash;
                      return (
                        <circle
                          key={item.organ}
                          cx="70"
                          cy="70"
                          r={r}
                          fill="transparent"
                          stroke={ORGAN_COLORS[idx % ORGAN_COLORS.length]}
                          strokeWidth="16"
                          strokeDasharray={`${strokeDash} ${circumference}`}
                          strokeDashoffset={-strokeOffset}
                        />
                      );
                    });
                  })()}
                </svg>
                <div style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center"
                }}>
                  <strong style={{ fontSize: 20, color: "var(--ink)", lineHeight: 1 }}>{totalOrgans}</strong>
                  <span style={{ fontSize: 10, color: "var(--muted)", marginTop: 2, letterSpacing: "0.04em" }}>ORGANS</span>
                </div>
              </div>

              {/* Legend */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 140 }}>
                {data.organBreakdown.map((item, idx) => {
                  const pct = Math.round(((item.count || 0) / totalOrgans) * 100);
                  return (
                    <div key={item.organ} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ width: 10, height: 10, borderRadius: "50%", background: ORGAN_COLORS[idx % ORGAN_COLORS.length] }}></span>
                        <span style={{ fontSize: 12, fontWeight: 500 }}>{item.organ}</span>
                      </div>
                      <span style={{ fontSize: 12, color: "var(--muted)" }}><strong>{item.count}</strong> ({pct}%)</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Waitlist Urgency Breakdown Bar */}
      <div className="panel">
        <div className="panel-title">
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <ShieldAlert size={18} color="var(--brand-mid)" />
            <div>
              <h3>Active Waitlist Urgency Composition</h3>
              <span>Distribution of clinical priority tiers across active candidates</span>
            </div>
          </div>
        </div>

        {totalUrgent === 0 ? (
          <p style={{ color: "var(--muted)", padding: "16px 0", textAlign: "center" }}>No active waitlist candidates.</p>
        ) : (
          <div>
            {/* Segmented Progress Bar */}
            <div style={{ display: "flex", height: 14, borderRadius: 8, overflow: "hidden", background: "var(--line)", marginBottom: 16 }}>
              {["Critical", "High", "Medium", "Low"].map(status => {
                const item = data?.urgencyBreakdown?.find(u => u.urgency === status);
                const count = item?.count || 0;
                const width = `${(count / totalUrgent) * 100}%`;
                if (!count) return null;
                return (
                  <div
                    key={status}
                    style={{
                      width,
                      background: URGENCY_COLORS[status],
                      transition: "width 0.6s ease"
                    }}
                    title={`${status}: ${count} (${Math.round((count / totalUrgent) * 100)}%)`}
                  />
                );
              })}
            </div>

            {/* Urgency Legend Pills */}
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
              {["Critical", "High", "Medium", "Low"].map(status => {
                const count = data?.urgencyBreakdown?.find(u => u.urgency === status)?.count || 0;
                const pct = totalUrgent ? Math.round((count / totalUrgent) * 100) : 0;
                return (
                  <div key={status} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
                    <span style={{ width: 10, height: 10, borderRadius: 3, background: URGENCY_COLORS[status] }}></span>
                    <span><strong>{status}:</strong> {count} ({pct}%)</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

