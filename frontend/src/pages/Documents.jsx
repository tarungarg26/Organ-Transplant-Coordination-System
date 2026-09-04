import React, { useEffect, useState, useMemo } from 'react';
import { FileText, Upload, Download, Search } from 'lucide-react';
import api from "../api";
import EmptyState from "../components/EmptyState";
import { useToast } from "../components/Toast";

export default function Documents() {
  const [docs, setDocs] = useState([]);
  const [file, setFile] = useState(null);
  const [type, setType] = useState("Medical Report");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const { showToast } = useToast();

  const load = () => {
    api.get("/documents")
      .then(r => setDocs(Array.isArray(r.data) ? r.data : []))
      .catch(err => console.error("Could not load documents:", err));
  };

  useEffect(() => {
    load();
  }, []);

  const upload = async e => {
    e.preventDefault();
    if (!file) {
      setError("Please select a file to upload.");
      return;
    }
    setError("");
    setUploading(true);
    try {
      const data = new FormData();
      data.append("file", file);
      data.append("documentType", type);
      data.append("entityType", "TRANSPORT");
      await api.post("/documents/upload", data);
      setFile(null);
      showToast({
        title: "Document archived",
        message: `${file.name} uploaded successfully as ${type}.`,
        type: "success"
      });
      e.target.reset();
      load();
    } catch (err) {
      const msg = err.response?.data?.message || "Upload failed";
      setError(msg);
      showToast({ title: "Upload failed", message: msg, type: "error" });
    } finally {
      setUploading(false);
    }
  };

  const downloadDoc = async (id, fileName) => {
    try {
      showToast({ title: "Downloading", message: `Retrieving ${fileName}...`, type: "info" });
      const res = await api.get(`/documents/${id}/download`, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      showToast({ title: "Download failed", message: "Could not fetch document file.", type: "error" });
    }
  };

  const filteredDocs = useMemo(() => {
    return docs.filter(d => {
      if (typeFilter !== "ALL" && d.documentType !== typeFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const name = (d.fileName || "").toLowerCase();
        const by = (d.uploadedBy?.name || "").toLowerCase();
        return name.includes(q) || by.includes(q);
      }
      return true;
    });
  }, [docs, typeFilter, search]);

  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">RECORDS & COMPLIANCE</span>
          <h2>Clinical documents</h2>
          <p>Store, authenticate, and download consent, laboratory reports, HLA documentation, and transport chain-of-custody.</p>
        </div>
      </div>

      {error && <div className="error-box">{error}</div>}

      {/* Upload Panel */}
      <form className="panel upload-row" onSubmit={upload}>
        <select value={type} onChange={e => setType(e.target.value)}>
          <option>Medical Report</option>
          <option>Consent Form</option>
          <option>Laboratory Report</option>
          <option>Transport Document</option>
          <option>Other</option>
        </select>
        <input type="file" onChange={e => setFile(e.target.files?.[0] || null)} />
        <button className="primary-button compact-button" disabled={uploading || !file}>
          <Upload size={14} style={{ marginRight: 5 }} />
          {uploading ? "Uploading..." : "Upload document"}
        </button>
      </form>

      {/* Document Library Panel */}
      <div className="panel">
        <div className="panel-title">
          <div>
            <h3>Document repository</h3>
            <span style={{ fontSize: 11, color: "var(--muted)" }}>{docs.length} verified records</span>
          </div>

          <div className="search-input-wrap" style={{ maxWidth: 220 }}>
            <Search size={13} className="search-icon-inside" />
            <input
              type="text"
              placeholder="Search documents..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ padding: '6px 10px 6px 28px', fontSize: 11 }}
            />
          </div>
        </div>

        {/* Filter Pills */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 14 }}>
          {["ALL", "Medical Report", "Consent Form", "Laboratory Report", "Transport Document", "Other"].map(t => (
            <button
              key={t}
              type="button"
              className={`filter-pill${typeFilter === t ? " active" : ""}`}
              onClick={() => setTypeFilter(t)}
              style={{ fontSize: 10, padding: '3px 8px' }}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>File name</th>
                <th>Classification</th>
                <th>Uploaded by</th>
                <th>File size</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredDocs.map(d => (
                <tr key={d._id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <FileText size={15} color="var(--brand)" />
                      <strong>{d.fileName}</strong>
                    </div>
                  </td>
                  <td>
                    <span className="badge" style={{ fontSize: 11 }}>
                      {d.documentType}
                    </span>
                  </td>
                  <td>{d.uploadedBy?.name || "Hospital Staff"}</td>
                  <td>{Math.round((d.size || 0) / 1024)} KB</td>
                  <td>
                    <button
                      type="button"
                      className="secondary-button compact-button"
                      onClick={() => downloadDoc(d._id, d.fileName)}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                    >
                      <Download size={12} />
                      Download
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {!filteredDocs.length && (
            <div style={{ padding: '30px 12px' }}>
              <EmptyState
                icon={FileText}
                title="No clinical documents found"
                description="Upload medical or consent files using the file picker above, or reset your search filter."
                actionLabel={typeFilter !== "ALL" || search ? "Clear filters" : undefined}
                onAction={() => { setTypeFilter("ALL"); setSearch(""); }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
