import React from 'react';
import { Finding } from '../../types/index.ts';
import { SeverityBadge, EvidenceBadge } from '../common/Badge.tsx';
import { AlertTriangle, CheckCircle2, ArrowRight, Quote, Sparkles } from 'lucide-react';

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
  return (
    <div
      className={`rounded-xl border p-5 transition-all bg-white shadow-sm ${
        isApplied
          ? 'border-emerald-200 bg-emerald-50/20'
          : finding.severity === 'Critical'
          ? 'border-red-200 hover:border-red-300'
          : finding.severity === 'High'
          ? 'border-orange-200 hover:border-orange-300'
          : 'border-slate-200 hover:border-slate-300'
      }`}
    >
      {/* Header: Category, Severity, Evidence Status */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <span className="font-bold text-sm text-slate-900">{finding.category}</span>
          <EvidenceBadge status={finding.evidenceStatus} />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-medium">
            Confidence: {Math.round(finding.confidence * 100)}%
          </span>
          <SeverityBadge severity={finding.severity} />
        </div>
      </div>

      {/* Problematic Original Text */}
      <div className="mb-3 p-3 rounded-lg bg-red-50/60 border border-red-100/80">
        <div className="text-[11px] font-bold uppercase tracking-wider text-red-600 mb-1 flex items-center gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
          Flagged Text in Content
        </div>
        <p className="text-xs font-mono text-red-900 font-semibold bg-white/70 px-2.5 py-1.5 rounded border border-red-200/60 inline-block">
          "{finding.originalText}"
        </p>
      </div>

      {/* Detailed Explanation */}
      <div className="mb-3 text-xs text-slate-700 leading-relaxed">
        <span className="font-semibold text-slate-900">Governance Issue: </span>
        {finding.explanation}
      </div>

      {/* Supporting Guideline / Evidence */}
      <div className="mb-4 p-3 rounded-lg bg-slate-50 border border-slate-200/80 text-xs">
        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1 flex items-center gap-1.5">
          <Quote className="w-3.5 h-3.5 text-slate-400" />
          Supporting Brand Guideline Evidence
        </div>
        <p className="text-slate-700 italic">
          "{finding.supportingEvidence}"
        </p>
      </div>

      {/* Suggested Correction & Action */}
      <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex-1">
          <div className="text-[11px] font-bold uppercase tracking-wider text-brand-600 mb-0.5 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-brand-500" />
            Suggested Brand Alignment
          </div>
          <p className="text-xs font-semibold text-slate-900">
            "{finding.suggestedCorrection}"
          </p>
        </div>

        {onApplyCorrection && (
          <div>
            {isApplied ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-100 px-3 py-1.5 rounded-lg border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Correction Applied
              </span>
            ) : (
              <button
                type="button"
                onClick={() => onApplyCorrection(finding.suggestedCorrection, finding.originalText)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 px-3.5 py-1.5 rounded-lg transition shadow-sm"
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
