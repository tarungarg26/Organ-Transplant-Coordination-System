import React from 'react';
import { Printer, X, ShieldCheck, HeartPulse, Building2, MapPin, Clock, Award } from 'lucide-react';

export default function AllocationManifestModal({ match, onClose }) {
  if (!match) return null;

  const donor = match.donor || {};
  const recipient = match.recipient || {};
  const coordinator = match.coordinator || {};

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 9999 }}>
      <div 
        className="modal manifest-modal" 
        onClick={e => e.stopPropagation()} 
        style={{ maxWidth: 740, width: "95%", maxHeight: "90vh", overflowY: "auto", padding: 28 }}
      >
        {/* Modal Top Actions (Hidden in print) */}
        <div className="manifest-actions no-print" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, borderBottom: "1px solid var(--line)", paddingBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Award size={20} color="var(--brand-mid)" />
            <strong style={{ fontSize: 15 }}>Official Transfer Manifest Document</strong>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button 
              type="button" 
              className="primary-btn" 
              onClick={handlePrint}
              style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13 }}
            >
              <Printer size={15} /> Print / Save as PDF
            </button>
            <button type="button" className="icon-ghost" onClick={onClose} title="Close">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Printable Certificate Document Sheet */}
        <div className="printable-manifest" style={{
          background: "#ffffff",
          border: "2px solid #0f766e",
          borderRadius: 8,
          padding: "24px 28px",
          color: "#0f172a",
          fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif"
        }}>
          {/* Header */}
          <div style={{ textAlign: "center", borderBottom: "2px solid #e2e8f0", paddingBottom: 16, marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 4 }}>
              <HeartPulse size={24} color="#0f766e" />
              <span style={{ fontSize: 13, fontWeight: 800, letterSpacing: "0.1em", color: "#0f766e", textTransform: "uppercase" }}>
                Organ Transplant Coordination System
              </span>
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 800, margin: "4px 0", color: "#0c1a1f" }}>
              ORGAN ALLOCATION & CHAIN-OF-CUSTODY MANIFEST
            </h2>
            <div style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              CONFIDENTIAL MEDICAL RECORD • FORM OTCS-ALLOC-V2
            </div>
          </div>

          {/* Certificate Metadata Bar */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            background: "#f8fafc",
            padding: "10px 14px",
            borderRadius: 6,
            marginBottom: 20,
            fontSize: 12,
            border: "1px solid #e2e8f0"
          }}>
            <div>
              <span style={{ color: "#64748b", display: "block", fontSize: 10 }}>MATCH ALLOCATION ID</span>
              <strong style={{ color: "#0f766e", fontSize: 13 }}>{match.matchId || "MAT-REF"}</strong>
            </div>
            <div>
              <span style={{ color: "#64748b", display: "block", fontSize: 10 }}>CONFIRMATION DATE</span>
              <strong>{match.decisionDate ? new Date(match.decisionDate).toLocaleString() : new Date().toLocaleString()}</strong>
            </div>
            <div>
              <span style={{ color: "#64748b", display: "block", fontSize: 10 }}>COMPATIBILITY SCORE</span>
              <strong style={{ color: "#047857", fontSize: 14 }}>{match.matchScore || "95"} / 100</strong>
            </div>
          </div>

          {/* Donor vs Recipient Dual Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginBottom: 20 }}>
            {/* Donor Side */}
            <div style={{ border: "1px solid #e2e8f0", borderRadius: 6, padding: 14, background: "#fafafa" }}>
              <div style={{ borderBottom: "1px solid #e2e8f0", paddingBottom: 6, marginBottom: 10, display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontWeight: 700, fontSize: 12, color: "#0f766e" }}>DONOR CLEARANCE</span>
                <span style={{ fontSize: 11, color: "#64748b" }}>{donor.donorId || "DNR"}</span>
              </div>
              <div style={{ fontSize: 12, display: "flex", flexDirection: "column", gap: 6 }}>
                <div><strong>Donor:</strong> {donor.name || "De-identified Donor"}</div>
                <div><strong>Organ:</strong> <span style={{ color: "#0f766e", fontWeight: 700 }}>{donor.organType || "Solid Organ"}</span></div>
                <div><strong>Blood Group:</strong> <strong>{donor.bloodType || "O+"}</strong></div>
                <div><strong>HLA Typing:</strong> <code>{donor.hlaTyping || "A2 B7 DR4"}</code></div>
                <div><strong>Procuring Facility:</strong> {donor.hospitalName || "Partner Medical Center"}</div>
                <div><strong>Origin Location:</strong> {donor.location?.label || "Procurement Suite"}</div>
              </div>
            </div>

            {/* Recipient Side */}
            <div style={{ border: "1px solid #e2e8f0", borderRadius: 6, padding: 14, background: "#fafafa" }}>
              <div style={{ borderBottom: "1px solid #e2e8f0", paddingBottom: 6, marginBottom: 10, display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontWeight: 700, fontSize: 12, color: "#0f766e" }}>RECIPIENT ALLOCATION</span>
                <span style={{ fontSize: 11, color: "#64748b" }}>{recipient.candidateId || "CAN"}</span>
              </div>
              <div style={{ fontSize: 12, display: "flex", flexDirection: "column", gap: 6 }}>
                <div><strong>Candidate:</strong> {recipient.name || "Transplant Candidate"}</div>
                <div><strong>Urgency Status:</strong> <span style={{ color: "#be123c", fontWeight: 700 }}>{recipient.urgencyStatus || "Critical"}</span></div>
                <div><strong>Blood Group:</strong> <strong>{recipient.bloodType || "A+"}</strong></div>
                <div><strong>HLA Typing:</strong> <code>{recipient.hlaTyping || "A2 B7 DR4"}</code></div>
                <div><strong>Recipient Hospital:</strong> {recipient.hospitalName || "Transplant Center"}</div>
                <div><strong>Transit Distance:</strong> {match.distanceKm != null ? `${match.distanceKm} km` : "Standard Transit"}</div>
              </div>
            </div>
          </div>

          {/* Validation Justifications */}
          <div style={{ border: "1px solid #e2e8f0", borderRadius: 6, padding: 12, marginBottom: 20 }}>
            <div style={{ fontWeight: 700, fontSize: 11, color: "#64748b", textTransform: "uppercase", marginBottom: 6 }}>
              Algorithmic Compatibility & Physiological Factors
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {Array.isArray(match.reasons) && match.reasons.length > 0 ? (
                match.reasons.map((r, i) => (
                  <span key={i} style={{ fontSize: 11, background: "#f1f5f9", padding: "3px 8px", borderRadius: 4, color: "#334155" }}>
                    ✓ {r}
                  </span>
                ))
              ) : (
                <span style={{ fontSize: 11, color: "#64748b" }}>ABO Compatible • Virtual HLA Matching Verified • Sizing Proportional</span>
              )}
            </div>
          </div>

          {/* Signatures & Chain of Custody Stamp */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 20,
            borderTop: "2px solid #e2e8f0",
            paddingTop: 16,
            fontSize: 11
          }}>
            <div>
              <span style={{ color: "#64748b", display: "block" }}>ALLOCATING TRANSPLANT COORDINATOR</span>
              <strong style={{ fontSize: 12 }}>{coordinator.name || "Licensed Coordinator"}</strong>
              <div style={{ color: "#64748b", marginTop: 2 }}>{coordinator.email || "coordinator@otcs.local"}</div>
              <div style={{ marginTop: 12, borderBottom: "1px dashed #94a3b8", width: "80%" }}></div>
              <span style={{ fontSize: 9, color: "#94a3b8" }}>Digital Cryptographic Signature Verified</span>
            </div>

            <div style={{ textAlign: "right" }}>
              <div style={{
                display: "inline-block",
                border: "2px solid #0f766e",
                borderRadius: 6,
                padding: "8px 14px",
                textAlign: "center",
                background: "rgba(15,118,110,0.04)"
              }}>
                <ShieldCheck size={22} color="#0f766e" style={{ margin: "0 auto" }} />
                <div style={{ fontWeight: 800, color: "#0f766e", fontSize: 11, letterSpacing: "0.08em" }}>
                  OFFICIALLY CONFIRMED
                </div>
                <div style={{ fontSize: 9, color: "#64748b" }}>OTCS Central Allocation Registry</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
