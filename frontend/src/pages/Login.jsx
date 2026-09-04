import React, { useState } from 'react';
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../auth";
import { HeartPulse, ShieldCheck, ArrowRight, Activity, Truck, Users } from "lucide-react";

export default function Login() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("coordinator@otcs.local");
  const [password, setPassword] = useState("Password@123");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const destination = location.state?.from?.pathname || "/dashboard";

  const submit = async e => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(email, password);
      navigate(destination, { replace: true });
    } catch (err) {
      setError(
        err.response?.data?.message ||
        (err.code === "ERR_NETWORK" || err.message === "Network Error"
          ? "Unable to connect to server. Please ensure the backend is running on port 5000."
          : "Login failed. Please check your credentials.")
      );
    } finally {
      setSubmitting(false);
    }
  };

  const demoAccounts = [
    { role: "Coordinator", email: "coordinator@otcs.local" },
    { role: "Hospital", email: "hospital@otcs.local" },
    { role: "Transport", email: "transport@otcs.local" },
    { role: "Admin", email: "admin@otcs.local" },
    { role: "OPO", email: "opo@otcs.local" },
    { role: "Auditor", email: "auditor@otcs.local" }
  ];

  return (
    <div className="login-page">
      <section className="login-hero">
        <div className="orb orb-a" />
        <div className="orb orb-b" />
        <div className="login-hero-copy">
          <div className="login-kicker">
            <HeartPulse size={16} /> OTCS · Clinical operations
          </div>
          <h1>Coordinate every transplant minute with clarity.</h1>
          <p>
            One workspace for donor intake, candidate ranking, allocation decisions,
            and live organ transport — built for hospital, coordinator, and dispatch teams.
          </p>
          <div className="login-steps">
            <div className="login-step">
              <div className="step-num">1</div>
              <div>
                <strong>Register</strong>
                <div style={{ fontSize: 12, color: "#9bb8be" }}>Donor and candidate profiles</div>
              </div>
              <Users size={16} style={{ marginLeft: "auto", opacity: 0.7 }} />
            </div>
            <div className="login-step">
              <div className="step-num">2</div>
              <div>
                <strong>Match</strong>
                <div style={{ fontSize: 12, color: "#9bb8be" }}>Ranked compatibility review</div>
              </div>
              <Activity size={16} style={{ marginLeft: "auto", opacity: 0.7 }} />
            </div>
            <div className="login-step">
              <div className="step-num">3</div>
              <div>
                <strong>Track</strong>
                <div style={{ fontSize: 12, color: "#9bb8be" }}>Pickup, transit, delivery</div>
              </div>
              <Truck size={16} style={{ marginLeft: "auto", opacity: 0.7 }} />
            </div>
          </div>
        </div>
        <p style={{ position: "relative", zIndex: 1, fontSize: 12, color: "#7fa3ab", margin: 0 }}>
          Academic demonstration system · Not for clinical decision-making
        </p>
      </section>

      <section className="login-form-side">
        <div className="login-panel">
          <div className="login-brand"><HeartPulse size={28}/><strong>OTCS</strong></div>
          <h2>Sign in to continue</h2>
          <p>Use a demo role below, or enter credentials for your workspace account.</p>

          {user && (
            <div className="session-banner">
              <span>Active session: <strong>{user.name}</strong> ({user.role})</span>
              <button
                type="button"
                className="primary-button"
                style={{ padding: "5px 11px", fontSize: 11, display: "inline-flex", alignItems: "center", gap: 5 }}
                onClick={() => navigate("/dashboard")}
              >
                Enter Dashboard <ArrowRight size={13} />
              </button>
            </div>
          )}

          <form onSubmit={submit} className="form-card">
            <label>Email
              <input
                value={email}
                onChange={e => setEmail(e.target.value)}
                type="email"
                required
                disabled={submitting}
              />
            </label>
            <label>Password
              <input
                value={password}
                onChange={e => setPassword(e.target.value)}
                type="password"
                required
                disabled={submitting}
              />
            </label>
            {error && <div className="error-box">{error}</div>}
            <button className="primary-button" type="submit" disabled={submitting}>
              {submitting ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <div className="quick-select">
            <span style={{ fontSize: 11, color: "var(--muted)", fontWeight: 600 }}>Quick select:</span>
            {demoAccounts.map(account => (
              <button
                key={account.role}
                type="button"
                className={`chip${email === account.email ? " active" : ""}`}
                onClick={() => {
                  setEmail(account.email);
                  setPassword("Password@123");
                  setError("");
                }}
              >
                {account.role}
              </button>
            ))}
          </div>

          <div className="demo-box">
            <ShieldCheck size={18}/>
            <span>Demo password: <code>Password@123</code></span>
          </div>
        </div>
      </section>
    </div>
  );
}
