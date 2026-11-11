import React from 'react';

interface ScoreGaugeProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  labelSubtitle?: string;
}

export const ScoreGauge: React.FC<ScoreGaugeProps> = ({
  score,
  size = 'md',
  labelSubtitle = 'Audited against approved brand guidelines',
}) => {
  const getColor = (val: number) => {
    if (val >= 90) {
      return {
        stroke: '#059669',
        trackStroke: '#D1FAE5',
        text: 'text-emerald-700',
        bg: 'bg-emerald-50',
        border: 'border-emerald-200',
        label: 'Brand Compliant',
      };
    }
    if (val >= 70) {
      return {
        stroke: '#D97706',
        trackStroke: '#FEF3C7',
        text: 'text-amber-700',
        bg: 'bg-amber-50',
        border: 'border-amber-200',
        label: 'Advisory Warnings',
      };
    }
    return {
      stroke: '#E11D48',
      trackStroke: '#FFE4E6',
      text: 'text-rose-700',
      bg: 'bg-rose-50',
      border: 'border-rose-200',
      label: 'Violations Detected',
    };
  };

  const { stroke, trackStroke, text, bg, border, label } = getColor(score);
  const strokeDashoffset = 100 - Math.min(Math.max(score, 0), 100);

  if (size === 'sm') {
    return (
      <div
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border font-semibold text-xs ${bg} ${border} ${text}`}
      >
        <span className="font-mono font-bold tabular-nums">{score}%</span>
        <span className="text-[10px] uppercase font-bold tracking-wider opacity-90">({label})</span>
      </div>
    );
  }

  const dimensions = size === 'lg' ? { box: 'w-24 h-24', text: 'text-3xl' } : { box: 'w-16 h-16', text: 'text-xl' };

  return (
    <div className="flex items-center gap-4 p-4 rounded-xl border border-stone-200/90 bg-white shadow-card">
      <div className={`relative ${dimensions.box} flex items-center justify-center flex-shrink-0`}>
        <svg className={`${dimensions.box} -rotate-90 transform`} viewBox="0 0 36 36">
          <path
            style={{ stroke: trackStroke }}
            strokeWidth="3.5"
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
            className="transition-all duration-700 ease-out"
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          />
        </svg>
        <span className={`absolute font-extrabold font-mono tabular-nums tracking-tight ${dimensions.text} ${text}`}>
          {score}
        </span>
      </div>
      <div>
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          Compliance Rating
        </div>
        <div className={`text-base font-extrabold tracking-tight ${text}`}>{label}</div>
        <div className="text-[11px] text-slate-500 mt-0.5">{labelSubtitle}</div>
      </div>
    </div>
  );
};
