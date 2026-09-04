import React, { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, Clock3, HeartPulse, Truck } from "lucide-react";
import api from "../api";
import { useAuth } from "../auth";
import StatCard from "../components/StatCard";
import StatusBadge from "../components/StatusBadge";

export default function Dashboard() {
  const { user } = useAuth();
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

  const activeTransportsCount = Array.isArray(transports) 
    ? transports.filter(t => !["DELIVERED"].includes(t?.status)).length 
    : 0;

  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">ROLE: {user?.role || "USER"}</span>
          <h2>Operations overview</h2>
          <p>Monitor active cases, matches and transport activity.</p>
        </div>
      </div>

      <div className="stats-grid">
        <StatCard label="Registered donors" value={analytics?.donors ?? "—"} icon={HeartPulse}/>
        <StatCard label="Waitlist candidates" value={analytics?.recipients ?? "—"} icon={Clock3}/>
        <StatCard label="Confirmed matches" value={confirmedMatchesCount} icon={CheckCircle2}/>
        <StatCard label="Active transports" value={activeTransportsCount} icon={Truck}/>
      </div>

      <div className="two-col">
        <div className="panel">
          <div className="panel-title">
            <h3>Recent matches</h3>
            <span>{matches.length} records</span>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Match</th>
                  <th>Recipient</th>
                  <th>Score</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {matches.slice(0, 8).map(m => (
                  <tr key={m._id || m.matchId}>
                    <td>{m.matchId || "—"}</td>
                    <td>{m.recipient?.name || "Candidate"}</td>
                    <td>{m.matchScore ?? "—"}</td>
                    <td><StatusBadge>{m.status}</StatusBadge></td>
                  </tr>
                ))}
                {!matches.length && (
                  <tr>
                    <td colSpan={4} style={{ textAlign: "center", padding: "20px", color: "var(--muted)" }}>
                      {loading ? "Loading matches..." : "No matches recorded yet."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="panel">
          <div className="panel-title">
            <h3>Active transport</h3>
            <span>Live status</span>
          </div>
          {transports.slice(0, 6).map(t => (
            <div className="timeline-row" key={t._id || t.transportId}>
              <div className="timeline-icon"><Truck size={17}/></div>
              <div>
                <strong>{t.transportId || "TRN"}</strong>
                <p>{t.currentLocation || "Location pending"} → {t.destinationHospital || "Destination"}</p>
              </div>
              <StatusBadge>{t.status}</StatusBadge>
            </div>
          ))}
          {!transports.length && (
            <div className="empty">
              <AlertTriangle size={22}/>
              <p>{loading ? "Loading transports..." : "No transport jobs yet."}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
