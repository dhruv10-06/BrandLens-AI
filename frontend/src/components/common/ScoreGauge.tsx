import React from 'react';

interface ScoreGaugeProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
}

export const ScoreGauge: React.FC<ScoreGaugeProps> = ({ score, size = 'md' }) => {
  const getColor = (val: number) => {
    if (val >= 90) return { stroke: '#10b981', text: 'text-emerald-700', bg: 'bg-emerald-50', label: 'Compliant' };
    if (val >= 70) return { stroke: '#f59e0b', text: 'text-amber-700', bg: 'bg-amber-50', label: 'Warnings' };
    return { stroke: '#ef4444', text: 'text-red-700', bg: 'bg-red-50', label: 'Violations Detected' };
  };

  const { stroke, text, bg, label } = getColor(score);
  const strokeDashoffset = 100 - score;

  if (size === 'sm') {
    return (
      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border font-semibold text-xs ${bg} ${text}`}>
        <span>{score}%</span>
        <span className="text-[10px] uppercase font-bold tracking-wider">({label})</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-4 p-4 rounded-xl border border-slate-200/80 bg-white shadow-sm`}>
      <div className="relative w-16 h-16 flex items-center justify-center">
        <svg className="w-16 h-16 -rotate-90 transform" viewBox="0 0 36 36">
          <path
            className="text-slate-100"
            strokeWidth="3.5"
            stroke="currentColor"
            fill="none"
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          />
          <path
            strokeDasharray="100, 100"
            strokeDashoffset={strokeDashoffset}
            strokeWidth="3.5"
            strokeLinecap="round"
            stroke={stroke}
            fill="none"
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          />
        </svg>
        <span className={`absolute text-lg font-extrabold ${text}`}>
          {score}
        </span>
      </div>
      <div>
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Brand Compliance Score
        </div>
        <div className={`text-base font-bold ${text}`}>{label}</div>
        <div className="text-xs text-slate-400">Audited against approved brand guidelines</div>
      </div>
    </div>
  );
};

