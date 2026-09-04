import React from 'react';

export const RiskBadge = ({ level, score, showScore = true }) => {
  const normalizedLevel = (level || 'LOW').toUpperCase();

  if (normalizedLevel === 'HIGH' || score >= 71) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-950/60 text-red-400 border border-red-800/60">
        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
        {showScore && score !== undefined ? `${score} • HIGH` : 'HIGH RISK'}
      </span>
    );
  }

  if (normalizedLevel === 'MEDIUM' || (score >= 31 && score <= 70)) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-950/60 text-amber-400 border border-amber-800/60">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
        {showScore && score !== undefined ? `${score} • MEDIUM` : 'MEDIUM RISK'}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-950/60 text-emerald-400 border border-emerald-800/60">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
      {showScore && score !== undefined ? `${score} • LOW` : 'LOW RISK'}
    </span>
  );
};

export default RiskBadge;
