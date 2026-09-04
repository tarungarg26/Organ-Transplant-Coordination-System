import React, { useEffect, useState } from 'react';
import api from "../api";

export default function Documents() {
  const [docs, setDocs] = useState([]);
  const [file, setFile] = useState(null);
  const [type, setType] = useState("Medical Report");
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

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
    setMessage("");
    setUploading(true);
    try {
      const data = new FormData();
      data.append("file", file);
      data.append("documentType", type);
      data.append("entityType", "TRANSPORT");
      await api.post("/documents/upload", data);
      setFile(null);
      setMessage("Document uploaded successfully!");
      // Reset the file input element if needed
      e.target.reset();
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const downloadDoc = async (id, fileName) => {
    try {
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
      setError(err.response?.data?.message || "Failed to download document");
    }
  };

  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">FR9 · DOCUMENT MANAGEMENT</span>
          <h2>Documents</h2>
          <p>Store consent, medical, laboratory and transport documents for the workflow.</p>
        </div>
      </div>

      {message && <div className="success-box">{message}</div>}
      {error && <div className="error-box">{error}</div>}

      <form className="panel upload-row" onSubmit={upload}>
        <select value={type} onChange={e => setType(e.target.value)}>
          <option>Medical Report</option>
          <option>Consent Form</option>
          <option>Laboratory Report</option>
          <option>Transport Document</option>
          <option>Other</option>
        </select>
        <input type="file" onChange={e => setFile(e.target.files?.[0] || null)} />
        <button className="primary-button" disabled={uploading || !file}>
          {uploading ? "Uploading..." : "Upload"}
        </button>
      </form>

      <div className="panel">
        <div className="panel-title">
          <h3>Uploaded documents</h3>
          <span>{docs.length} documents</span>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>File name</th>
                <th>Type</th>
                <th>Uploaded by</th>
                <th>Size</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {docs.map(d => (
                <tr key={d._id}>
                  <td><strong>{d.fileName}</strong></td>
                  <td>{d.documentType}</td>
                  <td>{d.uploadedBy?.name || "Staff"}</td>
                  <td>{Math.round((d.size || 0) / 1024)} KB</td>
                  <td>
                    <button
                      className="secondary-button"
                      style={{ padding: "4px 8px", fontSize: "11px" }}
                      onClick={() => downloadDoc(d._id, d.fileName)}
                    >
                      Download
                    </button>
                  </td>
                </tr>
              ))}
              {!docs.length && (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", padding: "20px", color: "var(--muted)" }}>
                    No documents uploaded yet.
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
