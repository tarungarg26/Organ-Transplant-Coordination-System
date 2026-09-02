import { useState } from "react";
import { useAuth } from "../auth";
import { HeartPulse, ShieldCheck } from "lucide-react";

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState("coordinator@otcs.local");
  const [password, setPassword] = useState("Password@123");
  const [error, setError] = useState("");

  const submit = async e => {
    e.preventDefault();
    try {
      await login(email, password);
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    }
  };

  return (
    <div className="login-page">
      <div className="login-panel">
        <div className="login-brand"><HeartPulse size={32}/><strong>OTCS</strong></div>
        <h1>Secure coordination portal</h1>
        <p>Connect hospital teams, coordinators and transport operations around the transplant workflow.</p>
        <form onSubmit={submit} className="form-card">
          <label>Email<input value={email} onChange={e => setEmail(e.target.value)} type="email" required/></label>
          <label>Password<input value={password} onChange={e => setPassword(e.target.value)} type="password" required/></label>
          {error && <div className="error-box">{error}</div>}
          <button className="primary-button">Sign in</button>
        </form>
        <div className="demo-box"><ShieldCheck size={18}/><span>Demo accounts are documented in README.md. This build uses synthetic data only.</span></div>
      </div>
    </div>
  );
}
