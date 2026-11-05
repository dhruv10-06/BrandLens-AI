import React from 'react';
import { FindingSeverity, SubmissionStatus, EvidenceStatus } from '../../types/index.ts';

export const SeverityBadge: React.FC<{ severity: FindingSeverity }> = ({ severity }) => {
  const styles = {
    Critical: 'bg-red-50 text-red-700 border-red-200 ring-red-600/10',
    High: 'bg-orange-50 text-orange-700 border-orange-200 ring-orange-600/10',
    Medium: 'bg-amber-50 text-amber-700 border-amber-200 ring-amber-600/10',
    Low: 'bg-blue-50 text-blue-700 border-blue-200 ring-blue-600/10',
  }[severity];

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ring-1 ring-inset ${styles}`}
    >
      {severity}
    </span>
  );
};

export const StatusBadge: React.FC<{ status: SubmissionStatus }> = ({ status }) => {
  const config = {
    draft: { label: 'Draft', style: 'bg-slate-100 text-slate-700 border-slate-200' },
    analysing: { label: 'Analysing...', style: 'bg-blue-50 text-blue-700 border-blue-200 animate-pulse' },
    needs_changes: { label: 'Needs Changes', style: 'bg-amber-50 text-amber-800 border-amber-300' },
    pending_review: { label: 'Pending Review', style: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
    approved: { label: 'Approved', style: 'bg-emerald-50 text-emerald-700 border-emerald-300' },
    rejected: { label: 'Rejected', style: 'bg-rose-50 text-rose-700 border-rose-200' },
  }[status] || { label: status, style: 'bg-slate-100 text-slate-700 border-slate-200' };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.style}`}
    >
      {config.label}
    </span>
  );
};

export const EvidenceBadge: React.FC<{ status: EvidenceStatus }> = ({ status }) => {
  const config = {
    verified_violation: { label: 'Verified Rule Violation', style: 'bg-red-100 text-red-800' },
    unsupported_claim: { label: 'Unsupported Claim', style: 'bg-purple-100 text-purple-800' },
    potential_issue: { label: 'Potential Tone Drift', style: 'bg-amber-100 text-amber-800' },
    compliant: { label: 'Compliant with Guidelines', style: 'bg-emerald-100 text-emerald-800' },
  }[status] || { label: status, style: 'bg-slate-100 text-slate-800' };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${config.style}`}>
      {config.label}
    </span>
  );
};
