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
        stroke: '#243C32', // Deep forest green
        trackStroke: '#E5EFEA',
        text: 'text-forest-900',
        bg: 'bg-forest-50/90',
        border: 'border-forest-300',
        label: 'Brand Compliant',
      };
    }
    if (val >= 70) {
      return {
        stroke: '#B49A68', // Antique burnished brass
        trackStroke: '#F9F5EC',
        text: 'text-brass-900',
        bg: 'bg-brass-50/90',
        border: 'border-brass-300',
        label: 'Advisory Warnings',
      };
    }
    return {
      stroke: '#632F3C', // Oxblood burgundy
      trackStroke: '#F9E7EC',
      text: 'text-oxblood-900',
      bg: 'bg-oxblood-50/90',
      border: 'border-oxblood-300',
      label: 'Violations Detected',
    };
  };

  const { stroke, trackStroke, text, bg, border, label } = getColor(score);
  const strokeDashoffset = 100 - Math.min(Math.max(score, 0), 100);

  if (size === 'sm') {
    return (
      <div
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border font-semibold text-xs ${bg} ${border} ${text} shadow-parchment-sm`}
      >
        <span className="font-mono tabular-nums">{score}%</span>
        <span className="text-[10px] uppercase font-bold tracking-wider opacity-90">({label})</span>
      </div>
    );
  }

  const dimensions = size === 'lg' ? { box: 'w-24 h-24', text: 'text-3xl' } : { box: 'w-16 h-16', text: 'text-xl' };

  return (
    <div className="flex items-center gap-4 p-4 rounded-xl border border-[#E7DECE] bg-[#FDFBF7] shadow-parchment">
      <div className={`relative ${dimensions.box} flex items-center justify-center flex-shrink-0`}>
        <svg className={`${dimensions.box} -rotate-90 transform`} viewBox="0 0 36 36">
          <path
            style={{ stroke: trackStroke }}
            strokeWidth="3.2"
            fill="none"
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          />
          <path
            strokeDasharray="100, 100"
            strokeDashoffset={strokeDashoffset}
            strokeWidth="3.2"
            strokeLinecap="round"
            stroke={stroke}
            fill="none"
            className="transition-all duration-700 ease-out"
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          />
        </svg>
        <span className={`absolute font-bold font-mono tabular-nums tracking-tight ${dimensions.text} ${text}`}>
          {score}
        </span>
      </div>
      <div>
        <div className="text-[10px] font-bold text-espresso-600 uppercase tracking-widest font-mono">
          Compliance Rating
        </div>
        <div className={`text-base font-bold tracking-tight ${text}`}>{label}</div>
        <div className="text-[11px] text-espresso-700 mt-0.5">{labelSubtitle}</div>
      </div>
    </div>
  );
};
