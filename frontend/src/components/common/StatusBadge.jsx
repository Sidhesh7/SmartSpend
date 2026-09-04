import React from 'react';

export const StatusBadge = ({ status }) => {
  const s = (status || 'APPROVED').toUpperCase();

  switch (s) {
    case 'BLOCKED':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/40">
          BLOCKED
        </span>
      );
    case 'FLAGGED':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-semibold bg-red-500/20 text-red-300 border border-red-500/40">
          FLAGGED
        </span>
      );
    case 'UNDER_REVIEW':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/40">
          UNDER REVIEW
        </span>
      );
    case 'APPROVED':
    default:
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
          APPROVED
        </span>
      );
  }
};

export default StatusBadge;
