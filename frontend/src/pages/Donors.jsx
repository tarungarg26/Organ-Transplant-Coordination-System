import React, { useEffect, useState, useMemo } from 'react';
import { Search, UserPlus } from 'lucide-react';
import api from "../api";
import StatusBadge from "../components/StatusBadge";
import EmptyState from "../components/EmptyState";
import { useToast } from "../components/Toast";

const empty = {
  name: "",
  bloodType: "O+",
  hlaTyping: "A2 B7 DR4",
  consentStatus: true,
  organType: "Kidney",
  organSize: "8",
  medicalHistory: "Healthy deceased donor, normal cardiac and renal function.",
  locationLabel: "Chennai Central"
};

export default function Donors() {
  const [donors, setDonors] = useState([]);
  const [form, setForm] = useState(empty);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [organFilter, setOrganFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const { showToast } = useToast();

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
    setLoading(true);
    try {
      const res = await api.post("/donors", {
        ...form,
        organSize: form.organSize ? Number(form.organSize) : undefined,
        location: { label: form.locationLabel }
      });
      setForm(empty);
      showToast({
        title: "Donor registered",
        message: `${res.data.name} (${res.data.organType} · ${res.data.bloodType}) added to registry.`,
        type: "success",
        link: "/matches"
      });
      load();
    } catch (err) {
      const msg = err.response?.data?.message || "Could not save donor";
      setError(msg);
      showToast({ title: "Registration failed", message: msg, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const filteredDonors = useMemo(() => {
    return donors.filter(d => {
      if (organFilter !== "ALL" && d.organType !== organFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const name = (d.name || "").toLowerCase();
        const id = (d.donorId || "").toLowerCase();
        const blood = (d.bloodType || "").toLowerCase();
        return name.includes(q) || id.includes(q) || blood.includes(q);
      }
      return true;
    });
  }, [donors, organFilter, search]);

  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">DONOR REGISTRY</span>
          <h2>Donor management</h2>
          <p>Register a verified deceased/living donor profile and publish for automated allocation matching.</p>
        </div>
      </div>

      <div className="two-col form-layout">
        {/* Registration Form */}
        <form className="panel form-grid" onSubmit={submit}>
          <h3>Register new donor profile</h3>
          <label>Full name
            <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="e.g. John Doe" required/>
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
          <label>Organ size (cm)
            <input type="number" value={form.organSize} onChange={e => setForm({...form, organSize: e.target.value})}/>
          </label>
          <label>Hospital / Location
            <input value={form.locationLabel} onChange={e => setForm({...form, locationLabel: e.target.value})}/>
          </label>
          <label className="full">Medical history & evaluation summary
            <textarea value={form.medicalHistory} onChange={e => setForm({...form, medicalHistory: e.target.value})}/>
          </label>
          <label className="check full">
            <input type="checkbox" checked={form.consentStatus} onChange={e => setForm({...form, consentStatus: e.target.checked})}/>
            Consent documentation verified & signed
          </label>
          {error && <div className="error-box full">{error}</div>}
          <button className="primary-button full" disabled={loading}>
            {loading ? "Publishing to registry..." : "Register & publish donor"}
          </button>
        </form>

        {/* Registered Donors List */}
        <div className="panel">
          <div className="panel-title">
            <div>
              <h3>Donor records</h3>
              <span style={{ fontSize: 11, color: "var(--muted)" }}>{donors.length} registered donors</span>
            </div>

            <div className="search-input-wrap" style={{ maxWidth: 200 }}>
              <Search size={13} className="search-icon-inside" />
              <input
                type="text"
                placeholder="Search donors..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ padding: '6px 10px 6px 28px', fontSize: 11 }}
              />
            </div>
          </div>

          {/* Filter Pills */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 12 }}>
            {["ALL", "Kidney", "Liver", "Heart", "Lung", "Pancreas"].map(cat => (
              <button
                key={cat}
                type="button"
                className={`filter-pill${organFilter === cat ? " active" : ""}`}
                onClick={() => setOrganFilter(cat)}
                style={{ fontSize: 10, padding: '3px 8px' }}
              >
                {cat}
              </button>
            ))}
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
                {filteredDonors.map(d => (
                  <tr key={d._id || d.donorId}>
                    <td><code>{d.donorId || "—"}</code></td>
                    <td><strong>{d.name}</strong></td>
                    <td>{d.organType}</td>
                    <td><span className="badge">{d.bloodType}</span></td>
                    <td><StatusBadge>{d.status}</StatusBadge></td>
                  </tr>
                ))}
              </tbody>
            </table>

            {!filteredDonors.length && (
              <div style={{ padding: '24px 12px' }}>
                <EmptyState
                  icon={UserPlus}
                  title="No donors match criteria"
                  description="Use the registration form on the left to add a new donor, or reset your search filter."
                  actionLabel={organFilter !== "ALL" || search ? "Clear filters" : undefined}
                  onAction={() => { setOrganFilter("ALL"); setSearch(""); }}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
