import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function EmptyState({ icon: Icon, title, description, actionLabel, actionLink, onAction }) {
  const navigate = useNavigate();

  return (
    <div className="empty-state-card">
      {Icon && (
        <div className="empty-state-icon">
          <Icon size={28} />
        </div>
      )}
      <h3>{title}</h3>
      {description && <p>{description}</p>}
      {(actionLabel && (actionLink || onAction)) && (
        <button
          type="button"
          className="primary-button compact-button"
          onClick={() => {
            if (onAction) onAction();
            else if (actionLink) navigate(actionLink);
          }}
          style={{ marginTop: '10px' }}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
