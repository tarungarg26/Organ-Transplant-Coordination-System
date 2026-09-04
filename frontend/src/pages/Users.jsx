import React, { useEffect, useState } from 'react';
import api from "../api";

export default function Users() {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "Password@123",
    role: "HOSPITAL",
    hospitalName: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const load = () => {
    api.get("/users")
      .then(r => setRows(Array.isArray(r.data) ? r.data : []))
      .catch(err => console.error("Could not load users:", err));
  };

  useEffect(() => {
    load();
  }, []);

  const submit = async e => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      await api.post("/users", form);
      setForm({ name: "", email: "", password: "Password@123", role: "HOSPITAL", hospitalName: "" });
      setSuccess("Account created successfully!");
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create user account");
    } finally {
      setLoading(false);
    }
  };

  const toggle = async id => {
    setError("");
    try {
      await api.patch(`/users/${id}/toggle`);
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update user state");
    }
  };

  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">ADMINISTRATION</span>
          <h2>User management</h2>
          <p>Provision and deactivate role-based system accounts.</p>
        </div>
      </div>

      {success && <div className="success-box">{success}</div>}
      {error && <div className="error-box">{error}</div>}

      <form className="panel form-grid" onSubmit={submit}>
        <h3>Create user</h3>
        <label>Name
          <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} required/>
        </label>
        <label>Email
          <input value={form.email} onChange={e => setForm({...form, email: e.target.value})} required type="email"/>
        </label>
        <label>Password
          <input value={form.password} onChange={e => setForm({...form, password: e.target.value})} required type="password"/>
        </label>
        <label>Role
          <select value={form.role} onChange={e => setForm({...form, role: e.target.value})}>
            {["ADMIN","HOSPITAL","COORDINATOR","TRANSPORT","OPO","AUDITOR"].map(x => <option key={x}>{x}</option>)}
          </select>
        </label>
        <label className="full">Hospital name
          <input value={form.hospitalName} onChange={e => setForm({...form, hospitalName: e.target.value})} placeholder="Optional"/>
        </label>
        <button className="primary-button full" disabled={loading}>
          {loading ? "Creating..." : "Create account"}
        </button>
      </form>

      <div className="panel">
        <div className="panel-title">
          <h3>Accounts</h3>
          <span>{rows.length} accounts</span>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Hospital</th>
                <th>State</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(u => (
                <tr key={u._id}>
                  <td><strong>{u.name}</strong></td>
                  <td>{u.email}</td>
                  <td><span className="badge">{u.role}</span></td>
                  <td>{u.hospitalName || "—"}</td>
                  <td>
                    <span className={`badge ${u.active ? "badge-active" : "badge-rejected"}`}>
                      {u.active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td>
                    <button
                      className="secondary-button"
                      style={{ padding: "4px 8px", fontSize: "11px" }}
                      onClick={() => toggle(u._id)}
                    >
                      {u.active ? "Deactivate" : "Activate"}
                    </button>
                  </td>
                </tr>
              ))}
              {!rows.length && (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: "20px", color: "var(--muted)" }}>
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
