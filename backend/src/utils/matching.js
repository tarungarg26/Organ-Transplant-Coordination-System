const EARTH_RADIUS_KM = 6371;

function haversine(a, b) {
  if (!a?.lat || !a?.lng || !b?.lat || !b?.lng) return null;
  const toRad = n => (n * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) *
    Math.sin(dLng / 2) ** 2;
  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

function bloodCompatible(donor, recipient) {
  const map = {
    "O-": ["O-"],
    "O+": ["O-", "O+"],
    "A-": ["O-", "A-"],
    "A+": ["O-", "O+", "A-", "A+"],
    "B-": ["O-", "B-"],
    "B+": ["O-", "O+", "B-", "B+"],
    "AB-": ["O-", "A-", "B-", "AB-"],
    "AB+": ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"]
  };
  return Boolean(map[recipient.bloodType]?.includes(donor.bloodType));
}

function hlaScore(donorHla = "", recipientHla = "") {
  const a = donorHla.split(/[,\s]+/).filter(Boolean).map(x => x.toUpperCase());
  const b = recipientHla.split(/[,\s]+/).filter(Boolean).map(x => x.toUpperCase());
  if (!a.length || !b.length) return 0;
  const setB = new Set(b);
  const matches = a.filter(x => setB.has(x)).length;
  return Math.min(100, Math.round((matches / Math.max(a.length, b.length)) * 100));
}

function urgencyScore(status) {
  return { Critical: 100, High: 75, Medium: 50, Low: 25 }[status] || 0;
}

function waitScore(createdAt) {
  const days = Math.max(0, (Date.now() - new Date(createdAt).getTime()) / 86400000);
  return Math.min(100, Math.round(days * 4));
}

function compatibility(donor, recipient) {
  if (donor.organType !== recipient.requiredOrgan) {
    return { compatible: false, score: 0, reasons: ["Organ type mismatch"] };
  }
  if (!bloodCompatible(donor, recipient)) {
    return { compatible: false, score: 0, reasons: ["Blood type incompatible"] };
  }

  const hla = hlaScore(donor.hlaTyping, recipient.hlaTyping);
  const urgency = urgencyScore(recipient.urgencyStatus);
  const waiting = waitScore(recipient.createdAt);

  let size = 100;
  if (donor.organSize && recipient.organSize) {
    const difference = Math.abs(Number(donor.organSize) - Number(recipient.organSize));
    size = Math.max(0, 100 - difference * 10);
  }

  const distance = haversine(donor.location, recipient.location);
  const distanceScore = distance == null ? 50 : Math.max(0, Math.round(100 - distance / 20));

  const score = Math.round(
    hla * 0.35 +
    urgency * 0.30 +
    waiting * 0.15 +
    size * 0.10 +
    distanceScore * 0.10
  );

  return {
    compatible: true,
    score,
    distanceKm: distance == null ? null : Math.round(distance * 10) / 10,
    reasons: [
      `Blood compatibility: compatible`,
      `HLA compatibility: ${hla}%`,
      `Urgency: ${recipient.urgencyStatus}`,
      `Waiting score: ${waiting}/100`,
      `Organ size score: ${Math.round(size)}/100`,
      `Distance score: ${Math.round(distanceScore)}/100`
    ]
  };
}

module.exports = { compatibility, haversine };
