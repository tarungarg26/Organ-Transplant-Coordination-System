import React from 'react';
export default function StatCard({ label, value, icon: Icon }) {
  return (
    <div className="stat-card">
      <div>
        <p>{label}</p>
        <h2>{value}</h2>
      </div>
      {Icon && <Icon size={26} />}
    </div>
  );
}
