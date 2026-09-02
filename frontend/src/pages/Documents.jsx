import { useEffect, useState } from "react";
import api from "../api";

export default function Documents() {
  const [docs, setDocs] = useState([]);
  const [file, setFile] = useState(null);
  const [type, setType] = useState("Medical Report");
  const load = () => api.get("/documents").then(r=>setDocs(r.data));
  useEffect(load, []);

  const upload = async e => {
    e.preventDefault();
    if (!file) return;
    const data = new FormData();
    data.append("file", file);
    data.append("documentType", type);
    data.append("entityType", "TRANSPORT");
    await api.post("/documents/upload", data);
    setFile(null); load();
  };

  return <div className="page">
    <div className="page-heading"><div><span className="eyebrow">FR9 · DOCUMENT MANAGEMENT</span><h2>Documents</h2><p>Store consent, medical, laboratory and transport documents for the workflow.</p></div></div>
    <form className="panel upload-row" onSubmit={upload}><select value={type} onChange={e=>setType(e.target.value)}><option>Medical Report</option><option>Consent Form</option><option>Laboratory Report</option><option>Transport Document</option><option>Other</option></select><input type="file" onChange={e=>setFile(e.target.files?.[0] || null)}/><button className="primary-button">Upload</button></form>
    <div className="panel"><div className="panel-title"><h3>Uploaded documents</h3></div><div className="table-wrap"><table><thead><tr><th>File</th><th>Type</th><th>Uploaded by</th><th>Size</th><th></th></tr></thead><tbody>{docs.map(d=><tr key={d._id}><td>{d.fileName}</td><td>{d.documentType}</td><td>{d.uploadedBy?.name}</td><td>{Math.round(d.size/1024)} KB</td><td><a className="text-link" href={`${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/documents/${d._id}/download`} target="_blank">Download</a></td></tr>)}</tbody></table></div></div>
  </div>;
}
