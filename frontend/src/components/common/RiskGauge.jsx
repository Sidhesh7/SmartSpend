import React from 'react';

export const RiskGauge = ({ score = 0, size = 180, strokeWidth = 14 }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (Math.min(100, Math.max(0, score)) / 100) * circumference;

  let strokeColor = '#10B981'; // Emerald (0-30)
  let glowColor = 'rgba(16, 185, 129, 0.3)';
  let label = 'LOW RISK';
  let labelColor = 'text-emerald-400';

  if (score > 70) {
    strokeColor = '#EF4444'; // Red (71-100)
    glowColor = 'rgba(239, 68, 68, 0.4)';
    label = 'HIGH RISK';
    labelColor = 'text-red-400';
  } else if (score > 30) {
    strokeColor = '#F59E0B'; // Amber (31-70)
    glowColor = 'rgba(245, 158, 11, 0.3)';
    label = 'MEDIUM RISK';
    labelColor = 'text-amber-400';
  }

  return (
    <div className="relative flex flex-col items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Track background */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#1F2937"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Progress Arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          fill="transparent"
          style={{
            transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1), stroke 0.5s ease',
            filter: `drop-shadow(0 0 8px ${glowColor})`
          }}
        />
      </svg>
      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-4xl font-extrabold tracking-tight text-white">
          {score}
        </span>
        <span className="text-xs text-slate-400 uppercase tracking-wider mt-0.5">
          / 100 Score
        </span>
        <span className={`text-[11px] font-bold tracking-wider mt-1 px-2 py-0.5 rounded bg-slate-900/80 border border-slate-800 ${labelColor}`}>
          {label}
        </span>
      </div>
    </div>
  );
};

export default RiskGauge;
