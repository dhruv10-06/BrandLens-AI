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
  const getSeverityBorder = () => {
    if (isApplied) return 'border-l-4 border-l-forest-800 border-[#E7DECE] bg-forest-50/30';
    switch (finding.severity) {
      case 'Critical':
        return 'border-l-4 border-l-oxblood-800 border-[#E7DECE] hover:border-oxblood-700';
      case 'High':
        return 'border-l-4 border-l-oxblood-700 border-[#E7DECE] hover:border-oxblood-600';
      case 'Medium':
        return 'border-l-4 border-l-brass-600 border-[#E7DECE] hover:border-brass-700';
      case 'Low':
      default:
        return 'border-l-4 border-l-olive-600 border-[#E7DECE] hover:border-olive-700';
    }
  };

  return (
    <div
      className={`rounded-xl border bg-[#FDFBF7] p-5 sm:p-6 shadow-parchment transition-all duration-200 ${getSeverityBorder()}`}
    >
      {/* Header: Category, Severity, Evidence Status */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3.5">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-bold text-sm text-espresso-950 font-serif tracking-tight">{finding.category}</span>
          <EvidenceBadge status={finding.evidenceStatus} />
        </div>
        <div className="flex items-center gap-2.5">
          <span className="text-[11px] font-mono text-espresso-600 font-medium">
            Confidence {Math.round(finding.confidence * 100)}%
          </span>
          <SeverityBadge severity={finding.severity} />
        </div>
      </div>

      {/* Problematic Original Text */}
      <div className="mb-3.5 p-3.5 rounded-lg bg-oxblood-50/50 border border-oxblood-200/80">
        <div className="text-[10px] font-bold uppercase tracking-wider text-oxblood-800 mb-1.5 flex items-center gap-1.5 font-mono">
          <AlertTriangle className="w-3.5 h-3.5 text-oxblood-700" />
          <span>Flagged Copy Snippet</span>
        </div>
        <div className="text-xs font-mono text-oxblood-950 font-medium bg-[#FAF7F0] px-3 py-2 rounded border border-oxblood-200/70 shadow-parchment-sm leading-relaxed">
          "{finding.originalText}"
        </div>
      </div>

      {/* Detailed Explanation */}
      <div className="mb-3.5 text-xs text-espresso-800 leading-relaxed">
        <span className="font-bold text-espresso-950">Governance Finding: </span>
        <span>{finding.explanation}</span>
      </div>

      {/* Supporting Guideline / Evidence */}
      <div className="mb-4 p-3.5 rounded-lg bg-[#F5EFE4] border border-[#DDD2BF] text-xs">
        <div className="text-[10px] font-bold uppercase tracking-widest text-espresso-600 mb-1.5 flex items-center gap-1.5 font-mono">
          <Quote className="w-3.5 h-3.5 text-brass-700" />
          <span>Indexed Guideline Citation</span>
        </div>
        <p className="text-espresso-800 italic leading-relaxed font-serif">
          "{finding.supportingEvidence}"
        </p>
      </div>

      {/* Suggested Correction & Action */}
      <div className="pt-3.5 border-t border-[#EDE6D8] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex-1">
          <div className="text-[10px] font-bold uppercase tracking-widest text-forest-800 mb-1 flex items-center gap-1 font-mono">
            <Sparkles className="w-3.5 h-3.5 text-brass-600" />
            <span>Recommended Compliant Phrasing</span>
          </div>
          <div className="text-xs font-semibold text-espresso-900 font-mono bg-[#FAF7F0] px-3 py-1.5 rounded border border-[#DDD2BF] inline-block">
            "{finding.suggestedCorrection}"
          </div>
        </div>

        {onApplyCorrection && (
          <div className="flex-shrink-0 self-end sm:self-auto">
            {isApplied ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-forest-900 bg-forest-100/90 px-3.5 py-1.5 rounded-lg border border-forest-300 shadow-parchment-sm">
                <CheckCircle2 className="w-3.5 h-3.5 text-forest-800" />
                <span>Correction Applied</span>
              </span>
            ) : (
              <button
                type="button"
                onClick={() => onApplyCorrection(finding.suggestedCorrection, finding.originalText)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-cream-50 bg-forest-800 hover:bg-forest-900 active:bg-forest-950 px-4 py-2 rounded-lg transition-all shadow-parchment hover:shadow-forest-glow border border-forest-700"
              >
                <span>Apply Correction</span>
                <ArrowRight className="w-3.5 h-3.5 text-brass-400" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
