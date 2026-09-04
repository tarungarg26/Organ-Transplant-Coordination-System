import React from 'react';
import { Check, Clock, Truck, Hospital, CheckCircle2, AlertOctagon } from 'lucide-react';

const STEPS = [
  { key: 'READY', label: 'Confirmed', sub: 'Hospital prep', icon: Hospital },
  { key: 'PICKED_UP', label: 'Picked Up', sub: 'Departed donor', icon: Clock },
  { key: 'IN_TRANSIT', label: 'In Transit', sub: 'Active delivery', icon: Truck },
  { key: 'DELIVERED', label: 'Delivered', sub: 'OR arrival', icon: CheckCircle2 }
];

const ORDER = { READY: 0, PICKED_UP: 1, IN_TRANSIT: 2, DELIVERED: 3 };

export default function TransportStepper({ currentStatus = 'READY', checkpoints = [] }) {
  const isException = currentStatus === 'EXCEPTION';
  const activeIdx = ORDER[currentStatus] ?? 0;

  return (
    <div className="transport-stepper-container">
      <div className="transport-stepper">
        {STEPS.map((step, idx) => {
          const isDone = !isException && idx < activeIdx;
          const isCurrent = !isException && idx === activeIdx;
          const isFuture = !isException && idx > activeIdx;
          const Icon = step.icon;

          return (
            <div
              key={step.key}
              className={`stepper-node ${isDone ? 'done' : ''} ${isCurrent ? 'current' : ''} ${isFuture ? 'future' : ''}`}
            >
              <div className="stepper-dot">
                {isDone ? <Check size={13} strokeWidth={3} /> : <Icon size={14} />}
                {isCurrent && <span className="stepper-pulse-ring" />}
              </div>
              <div className="stepper-text">
                <strong className="stepper-label">{step.label}</strong>
                <span className="stepper-sub">{step.sub}</span>
              </div>
              {idx < STEPS.length - 1 && (
                <div className={`stepper-connector ${idx < activeIdx ? 'filled' : ''}`} />
              )}
            </div>
          );
        })}
      </div>

      {isException && (
        <div className="stepper-exception-banner">
          <AlertOctagon size={14} />
          <span>Transport Exception Logged — Route Interrupted</span>
        </div>
      )}
    </div>
  );
}
