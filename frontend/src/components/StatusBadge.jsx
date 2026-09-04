import React from 'react';

export default function StatusBadge({ children }) {
  if (children == null || children === '') return null;
  const safeClass = String(children)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-');
  return <span className={`badge badge-${safeClass}`}>{children}</span>;
}

