import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CheckCircle2, 
  Clock3, 
  HeartPulse, 
  Truck, 
  ArrowRight,
  ClipboardList,
  UserPlus
} from "lucide-react";
import api from "../api";
import { useAuth } from "../auth";
import StatCard from "../components/StatCard";
import StatusBadge from "../components/StatusBadge";
import ColdIschemiaGauge from "../components/ColdIschemiaGauge";
import TransportStepper from "../components/TransportStepper";
import EmptyState from "../components/EmptyState";

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState(null);
  const [matches, setMatches] = useState([]);
  const [transports, setTransports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const [mRes, tRes] = await Promise.allSettled([
          api.get("/matches"),
          api.get("/transports")
        ]);
        if (mounted) {
          if (mRes.status === "fulfilled" && Array.isArray(mRes.value?.data)) {
            setMatches(mRes.value.data);
          }
          if (tRes.status === "fulfilled" && Array.isArray(tRes.value?.data)) {
            setTransports(tRes.value.data);
          }
        }
        if (user?.role && ["ADMIN", "COORDINATOR", "OPO", "AUDITOR"].includes(user.role)) {
          const aRes = await api.get("/analytics").catch(() => null);
          if (mounted && aRes?.data) {
            setAnalytics(aRes.data);
          }
        }
      } catch (err) {
        console.error("Dashboard load error:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => { mounted = false; };
  }, [user?.role]);

  const confirmedMatchesCount = analytics?.confirmedMatches ?? 
    (Array.isArray(matches) ? matches.filter(m => m?.status === "CONFIRMED").length : 0);

  const activeTransports = Array.isArray(transports) 
    ? transports.filter(t => !["DELIVERED"].includes(t?.status)) 
    : [];

  const urgentTransport = activeTransports[0] || null;

  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">{user?.role || "USER"} · OPERATIONS COMMAND</span>
          <h2>Operations overview</h2>
          <p>Live snapshot of verified donors, clinical waitlist, allocations, and live organ movements.</p>
        </div>

        {/* Action Shortcuts */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {(user?.role === "HOSPITAL" || user?.role === "ADMIN" || user?.role === "COORDINATOR") && (
            <button 
              type="button" 
              className="secondary-button compact-button"
              onClick={() => navigate("/donors")}
            >
              <UserPlus size={13} style={{ marginRight: 4 }} />
              Register Donor
            </button>
          )}
          {(user?.role === "COORDINATOR" || user?.role === "OPO" || user?.role === "ADMIN") && (
            <button 
              type="button" 
              className="primary-button compact-button"
              onClick={() => navigate("/matches")}
            >
              <ClipboardList size={13} style={{ marginRight: 4 }} />
              Run Allocation Match
            </button>
          )}
        </div>
      </div>

      {/* Primary KPI Stats Grid */}
      <div className="stats-grid">
        <StatCard label="Registered donors" value={analytics?.donors ?? "—"} icon={HeartPulse}/>
        <StatCard label="Waitlist candidates" value={analytics?.recipients ?? "—"} icon={Clock3}/>
        <StatCard label="Confirmed matches" value={confirmedMatchesCount} icon={CheckCircle2}/>
        <StatCard label="Active transports" value={activeTransports.length} icon={Truck}/>
      </div>

      {/* Priority Live Transport Alert Card if active transport exists */}
      {urgentTransport && (
        <div className="panel" style={{ borderLeft: '4px solid var(--brand)', marginBottom: 20 }}>
          <div className="panel-title">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#0d9488', animation: 'criticalPulse 1.5s infinite' }} />
              <h3 style={{ margin: 0 }}>Active Organ Dispatch: {urgentTransport.transportId}</h3>
              <span className="badge badge-active">{urgentTransport.status}</span>
            </div>
            <button
              type="button"
              className="ghost-btn"
              onClick={() => navigate("/transports")}
              style={{ fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 4 }}
            >
              View live logistics <ArrowRight size={13} />
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 1fr) 2fr', gap: 18, alignItems: 'center', marginTop: 10 }}>
            <ColdIschemiaGauge
              elapsedMinutes={urgentTransport.elapsedMinutes ?? 0}
              limitMinutes={urgentTransport.coldIschemiaLimitMinutes ?? 360}
            />
            <TransportStepper
              currentStatus={urgentTransport.status}
              checkpoints={urgentTransport.checkpoints || []}
            />
          </div>
        </div>
      )}

      {/* Two-Column Operational Activity Grid */}
      <div className="two-col">
        {/* Recent Matches */}
        <div className="panel">
          <div className="panel-title">
            <div>
              <h3>Recent match allocations</h3>
              <span style={{ fontSize: 11, color: "var(--muted)" }}>{matches.length} total records</span>
            </div>
            <button 
              type="button" 
              className="ghost-btn" 
              onClick={() => navigate("/matches")}
              style={{ fontSize: 11 }}
            >
              View matching workspace &rarr;
            </button>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Match ID</th>
                  <th>Recipient</th>
                  <th>Score</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {matches.slice(0, 6).map(m => (
                  <tr key={m._id || m.matchId}>
                    <td><code>{m.matchId || "—"}</code></td>
                    <td><strong>{m.recipient?.name || "Candidate"}</strong></td>
                    <td><strong>{m.matchScore ?? "—"}</strong></td>
                    <td><StatusBadge>{m.status}</StatusBadge></td>
                  </tr>
                ))}
              </tbody>
            </table>

            {!matches.length && (
              <div style={{ padding: '24px 12px' }}>
                <EmptyState
                  icon={ClipboardList}
                  title="No match allocations yet"
                  description="Evaluate an available donor in the Matching & Allocation view to create candidate rankings."
                  actionLabel="Go to Matching"
                  actionLink="/matches"
                />
              </div>
            )}
          </div>
        </div>

        {/* Active Transport Pipeline */}
        <div className="panel">
          <div className="panel-title">
            <div>
              <h3>Organ transit pipeline</h3>
              <span style={{ fontSize: 11, color: "var(--muted)" }}>Live logistical tracking</span>
            </div>
            <button 
              type="button" 
              className="ghost-btn" 
              onClick={() => navigate("/transports")}
              style={{ fontSize: 11 }}
            >
              View all transports &rarr;
            </button>
          </div>

          {transports.slice(0, 5).map(t => (
            <div className="timeline-row" key={t._id || t.transportId}>
              <div className="timeline-icon"><Truck size={16}/></div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <strong>{t.transportId || "TRN"}</strong>
                <p style={{ fontSize: 12, margin: '2px 0 0', color: 'var(--muted)' }}>
                  {t.currentLocation || "Location pending"} → {t.destinationHospital || "Destination"}
                </p>
              </div>
              <StatusBadge>{t.status}</StatusBadge>
            </div>
          ))}

          {!transports.length && (
            <div style={{ padding: '24px 12px' }}>
              <EmptyState
                icon={Truck}
                title="No active transports"
                description="Once a proposed match is confirmed, an organ transport job is automatically created and tracked here."
                actionLabel="Review Matches"
                actionLink="/matches"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
