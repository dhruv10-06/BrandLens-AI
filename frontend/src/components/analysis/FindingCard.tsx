import React from 'react';
import { Finding } from '../../types/index.ts';
import { SeverityBadge, EvidenceBadge } from '../common/Badge.tsx';
import { AlertTriangle, CheckCircle2, ArrowRight, Quote, Sparkles, ShieldCheck } from 'lucide-react';

interface FindingCardProps {
  finding: Finding;
  onApplyCorrection?: (correction: string, originalText: string) => void;
  isApplied?: boolean;
}

export const FindingCard: React.FC<FindingCardProps> = ({
  finding,
  onApplyCorrection,
  isApplied = false,
}) => {
  const getSeverityBorder = () => {
    if (isApplied) return 'border-emerald-300 bg-emerald-50/20';
    switch (finding.severity) {
      case 'Critical':
        return 'border-l-4 border-l-rose-500 border-stone-200/90 hover:border-rose-300';
      case 'High':
        return 'border-l-4 border-l-orange-500 border-stone-200/90 hover:border-orange-300';
      case 'Medium':
        return 'border-l-4 border-l-amber-500 border-stone-200/90 hover:border-amber-300';
      case 'Low':
      default:
        return 'border-l-4 border-l-sky-500 border-stone-200/90 hover:border-sky-300';
    }
  };

  return (
    <div
      className={`rounded-xl border bg-white p-5 shadow-card transition-all duration-200 ${getSeverityBorder()}`}
    >
      {/* Header: Category, Severity, Evidence Status */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3.5">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-extrabold text-sm text-slate-900 tracking-tight">{finding.category}</span>
          <EvidenceBadge status={finding.evidenceStatus} />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono text-slate-400 font-medium">
            Confidence {Math.round(finding.confidence * 100)}%
          </span>
          <SeverityBadge severity={finding.severity} />
        </div>
      </div>

      {/* Problematic Original Text */}
      <div className="mb-3 p-3.5 rounded-lg bg-rose-50/50 border border-rose-100">
        <div className="text-[10px] font-extrabold uppercase tracking-wider text-rose-700 mb-1.5 flex items-center gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
          <span>Flagged Copy Snippet</span>
        </div>
        <div className="text-xs font-mono text-rose-950 font-semibold bg-white/90 px-3 py-2 rounded-md border border-rose-200/70 shadow-sm leading-relaxed">
          "{finding.originalText}"
        </div>
      </div>

      {/* Detailed Explanation */}
      <div className="mb-3.5 text-xs text-slate-700 leading-relaxed">
        <span className="font-bold text-slate-900">Governance Audit: </span>
        <span>{finding.explanation}</span>
      </div>

      {/* Supporting Guideline / Evidence */}
      <div className="mb-4 p-3.5 rounded-lg bg-stone-50/80 border border-stone-200/80 text-xs">
        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center gap-1.5">
          <Quote className="w-3.5 h-3.5 text-slate-400" />
          <span>Indexed Guideline Citation</span>
        </div>
        <p className="text-slate-700 italic leading-relaxed">
          "{finding.supportingEvidence}"
        </p>
      </div>

      {/* Suggested Correction & Action */}
      <div className="pt-3.5 border-t border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex-1">
          <div className="text-[10px] font-bold uppercase tracking-wider text-brand-700 mb-1 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-brand-600" />
            <span>Recommended Compliant Phrasing</span>
          </div>
          <div className="text-xs font-bold text-slate-900 font-mono bg-stone-50 px-2.5 py-1.5 rounded border border-stone-200/70 inline-block">
            "{finding.suggestedCorrection}"
          </div>
        </div>

        {onApplyCorrection && (
          <div className="flex-shrink-0 self-end sm:self-auto">
            {isApplied ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800 bg-emerald-100/80 px-3.5 py-1.5 rounded-lg border border-emerald-200 shadow-sm">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Correction Applied</span>
              </span>
            ) : (
              <button
                type="button"
                onClick={() => onApplyCorrection(finding.suggestedCorrection, finding.originalText)}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 active:bg-brand-800 px-4 py-2 rounded-lg transition-all shadow-sm hover:shadow"
              >
                <span>Apply Correction</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
