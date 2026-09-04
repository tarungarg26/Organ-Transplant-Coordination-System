import React, { useEffect, useState } from 'react';
import api from "../api";
import StatusBadge from "../components/StatusBadge";

const empty = {
  name: "",
  bloodType: "O+",
  hlaTyping: "",
  consentStatus: true,
  organType: "Kidney",
  organSize: "",
  medicalHistory: "",
  locationLabel: "Chennai"
};

export default function Donors() {
  const [donors, setDonors] = useState([]);
  const [form, setForm] = useState(empty);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const load = () => {
    api.get("/donors")
      .then(r => setDonors(Array.isArray(r.data) ? r.data : []))
      .catch(err => console.error("Could not load donors:", err));
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
      await api.post("/donors", {
        ...form,
        organSize: form.organSize ? Number(form.organSize) : undefined,
        location: { label: form.locationLabel }
      });
      setForm(empty);
      setSuccess("Donor registered successfully!");
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Could not save donor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">UC1 · FR1</span>
          <h2>Donor management</h2>
          <p>Register a complete donor profile and make it available for matching.</p>
        </div>
      </div>
      {success && <div className="success-box">{success}</div>}
      <div className="two-col form-layout">
        <form className="panel form-grid" onSubmit={submit}>
          <h3>Register new donor</h3>
          <label>Full name
            <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} required/>
          </label>
          <label>Blood type
            <select value={form.bloodType} onChange={e => setForm({...form, bloodType: e.target.value})}>
              {["O-","O+","A-","A+","B-","B+","AB-","AB+"].map(x => <option key={x}>{x}</option>)}
            </select>
          </label>
          <label>HLA typing
            <input placeholder="A2 B7 DR4" value={form.hlaTyping} onChange={e => setForm({...form, hlaTyping: e.target.value})} required/>
          </label>
          <label>Organ type
            <select value={form.organType} onChange={e => setForm({...form, organType: e.target.value})}>
              {["Kidney","Liver","Heart","Lung","Pancreas"].map(x => <option key={x}>{x}</option>)}
            </select>
          </label>
          <label>Organ size
            <input type="number" value={form.organSize} onChange={e => setForm({...form, organSize: e.target.value})}/>
          </label>
          <label>Location
            <input value={form.locationLabel} onChange={e => setForm({...form, locationLabel: e.target.value})}/>
          </label>
          <label className="full">Medical history
            <textarea value={form.medicalHistory} onChange={e => setForm({...form, medicalHistory: e.target.value})}/>
          </label>
          <label className="check full">
            <input type="checkbox" checked={form.consentStatus} onChange={e => setForm({...form, consentStatus: e.target.checked})}/>
            Consent documentation verified
          </label>
          {error && <div className="error-box full">{error}</div>}
          <button className="primary-button full" disabled={loading}>
            {loading ? "Registering..." : "Register donor"}
          </button>
        </form>

        <div className="panel">
          <div className="panel-title">
            <h3>Donor records</h3>
            <span>{donors.length} records</span>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Organ</th>
                  <th>Blood</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {donors.map(d => (
                  <tr key={d._id || d.donorId}>
                    <td>{d.donorId || "—"}</td>
                    <td>{d.name}</td>
                    <td>{d.organType}</td>
                    <td>{d.bloodType}</td>
                    <td><StatusBadge>{d.status}</StatusBadge></td>
                  </tr>
                ))}
                {!donors.length && (
                  <tr>
                    <td colSpan={5} style={{ textAlign: "center", padding: "20px", color: "var(--muted)" }}>
                      No donor records registered yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
