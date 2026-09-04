import React, { useState } from 'react';
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../auth";
import { HeartPulse, ShieldCheck, ArrowRight } from "lucide-react";

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
      <div className="login-panel">
        <div className="login-brand"><HeartPulse size={32}/><strong>OTCS</strong></div>
        <h1>Secure coordination portal</h1>
        <p>Connect hospital teams, coordinators and transport operations around the transplant workflow.</p>

        {user && (
          <div style={{
            background: "#eff6ff",
            border: "1px solid #bfdbfe",
            borderRadius: "10px",
            padding: "10px 14px",
            marginBottom: "14px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: "12px"
          }}>
            <span>Active session: <strong>{user.name}</strong> ({user.role})</span>
            <button
              type="button"
              className="primary-button"
              style={{ padding: "5px 11px", fontSize: "11px", display: "inline-flex", alignItems: "center", gap: "5px" }}
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

        <div style={{ marginTop: "14px", display: "flex", flexWrap: "wrap", gap: "6px", alignItems: "center" }}>
          <span style={{ fontSize: "11px", color: "var(--muted)", fontWeight: 600 }}>Quick select:</span>
          {demoAccounts.map(account => (
            <button
              key={account.role}
              type="button"
              onClick={() => {
                setEmail(account.email);
                setPassword("Password@123");
                setError("");
              }}
              style={{
                fontSize: "11px",
                padding: "3px 8px",
                borderRadius: "6px",
                border: "1px solid #dce2eb",
                background: email === account.email ? "#eaf2ff" : "#fff",
                color: email === account.email ? "#1d4ed8" : "#4b5563",
                fontWeight: email === account.email ? 700 : 500,
                cursor: "pointer"
              }}
            >
              {account.role}
            </button>
          ))}
        </div>

        <div className="demo-box">
          <ShieldCheck size={18}/>
          <span>Demo accounts are documented in README.md. Default password: <code>Password@123</code></span>
        </div>
      </div>
    </div>
  );
}
