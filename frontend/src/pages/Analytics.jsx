import React, { useEffect, useState } from 'react';
import api from "../api";
import StatCard from "../components/StatCard";
import { Building2, CheckCircle2, Clock3, HeartPulse } from "lucide-react";

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

  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">FR11 · ANALYTICS</span>
          <h2>Analytics dashboard</h2>
          <p>Operational indicators for transplant coordination and transport performance.</p>
        </div>
      </div>

      <div className="stats-grid">
        <StatCard label="Total donors" value={data?.donors ?? "—"} icon={HeartPulse}/>
        <StatCard label="Waitlist candidates" value={data?.recipients ?? "—"} icon={Clock3}/>
        <StatCard label="Confirmed matches" value={data?.confirmedMatches ?? "—"} icon={CheckCircle2}/>
        <StatCard label="Avg transport" value={data?.avgTransportMinutes !== undefined ? `${data.avgTransportMinutes} min` : "—"} icon={Building2}/>
      </div>

      <div className="panel">
        <div className="panel-title">
          <h3>Hospital performance</h3>
          <span>Donor registrations by hospital</span>
        </div>
        {loading && <p style={{ color: "var(--muted)", padding: "20px 0" }}>Loading analytics...</p>}
        {Array.isArray(data?.hospitalPerformance) && data.hospitalPerformance.map((h, i) => (
          <div className="bar-row" key={h._id || i}>
            <span>{h._id || "Unassigned hospital"}</span>
            <div className="bar">
              <i style={{ width: `${Math.min(100, (h.donors || 1) * 15)}%` }}></i>
            </div>
            <strong>{h.donors || 0}</strong>
          </div>
        ))}
        {!loading && (!data?.hospitalPerformance || data.hospitalPerformance.length === 0) && (
          <p style={{ color: "var(--muted)", padding: "20px 0", textAlign: "center" }}>
            No hospital activity data available yet.
          </p>
        )}
      </div>
    </div>
  );
}
