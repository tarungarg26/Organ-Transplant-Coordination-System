import React from 'react';
import { Clock, AlertTriangle, ShieldCheck } from 'lucide-react';

export default function ColdIschemiaGauge({ elapsedMinutes = 0, limitMinutes = 360, size = 110, strokeWidth = 8 }) {
  const elapsed = Math.max(0, Number(elapsedMinutes) || 0);
  const limit = Math.max(1, Number(limitMinutes) || 360);
  const percent = Math.min(100, Math.round((elapsed / limit) * 100));
  const remaining = Math.max(0, limit - elapsed);

  const remHours = Math.floor(remaining / 60);
  const remMins = remaining % 60;
  const remainingFormatted = `${remHours > 0 ? `${remHours}h ` : ''}${remMins}m`;

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percent / 100) * circumference;

  let color = '#0d9488'; // Safe (Teal)
  let statusText = 'Optimal Window';
  let isCritical = false;

  if (percent >= 85) {
    color = '#e11d48'; // Critical (Crimson)
    statusText = 'Critical Ischemia Alert';
    isCritical = true;
  } else if (percent >= 70) {
    color = '#d97706'; // Caution (Amber)
    statusText = 'Approaching Limit';
  }

  return (
    <div className={`ischemia-gauge-wrap ${isCritical ? 'ischemia-critical-pulse' : ''}`}>
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          {/* Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#e2e8f0"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Progress */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            style={{ transition: 'stroke-dashoffset 0.6s ease, stroke 0.4s ease' }}
          />
        </svg>

        {/* Center Text */}
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          pointerEvents: 'none'
        }}>
          <strong style={{ fontSize: '15px', color: '#0f172a', lineHeight: 1 }}>{percent}%</strong>
          <span style={{ fontSize: '9px', color: 'var(--muted)', marginTop: '2px', letterSpacing: '0.04em' }}>
            ISCHEMIA
          </span>
        </div>
      </div>

      <div className="ischemia-meta">
        <div className="ischemia-status-tag" style={{ color, borderColor: `${color}40`, background: `${color}12` }}>
          {isCritical ? <AlertTriangle size={12} /> : <ShieldCheck size={12} />}
          <span>{statusText}</span>
        </div>
        <div className="ischemia-countdown">
          <Clock size={12} color="var(--muted)" />
          <span><strong>{remainingFormatted}</strong> left of {limit}m limit</span>
        </div>
      </div>
    </div>
  );
}
