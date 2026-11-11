import React from 'react';
import { FindingSeverity, SubmissionStatus, EvidenceStatus } from '../../types/index.ts';

export const SeverityBadge: React.FC<{ severity: FindingSeverity }> = ({ severity }) => {
  const config = {
    Critical: {
      style: 'bg-rose-50/90 text-rose-800 border-rose-200/90 ring-rose-500/10',
      dot: 'bg-rose-600',
    },
    High: {
      style: 'bg-orange-50/90 text-orange-800 border-orange-200/90 ring-orange-500/10',
      dot: 'bg-orange-500',
    },
    Medium: {
      style: 'bg-amber-50/90 text-amber-800 border-amber-200/90 ring-amber-500/10',
      dot: 'bg-amber-500',
    },
    Low: {
      style: 'bg-sky-50/90 text-sky-800 border-sky-200/90 ring-sky-500/10',
      dot: 'bg-sky-500',
    },
  }[severity];

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ring-1 ring-inset ${config.style}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      <span>{severity}</span>
    </span>
  );
};

export const StatusBadge: React.FC<{ status: SubmissionStatus }> = ({ status }) => {
  const config = {
    draft: {
      label: 'Draft',
      style: 'bg-ivory-100 text-graphite-600 border-[#EAE8E3]',
      dot: 'bg-graphite-400',
    },
    analysing: {
      label: 'Auditing Content...',
      style: 'bg-brand-50 text-brand-700 border-brand-200 animate-pulse',
      dot: 'bg-brand-600 animate-ping',
    },
    needs_changes: {
      label: 'Changes Required',
      style: 'bg-amber-50 text-amber-800 border-amber-200',
      dot: 'bg-amber-500',
    },
    pending_review: {
      label: 'Pending Human Sign-off',
      style: 'bg-lavender-50 text-brand-700 border-lavender-200',
      dot: 'bg-brand-600',
    },
    approved: {
      label: 'Approved & Compliant',
      style: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      dot: 'bg-emerald-600',
    },
    rejected: {
      label: 'Publication Blocked',
      style: 'bg-rose-50 text-rose-800 border-rose-200',
      dot: 'bg-rose-600',
    },
  }[status] || {
    label: status,
    style: 'bg-ivory-100 text-graphite-600 border-[#EAE8E3]',
    dot: 'bg-graphite-400',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${config.style}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      <span>{config.label}</span>
    </span>
  );
};

export const EvidenceBadge: React.FC<{ status: EvidenceStatus }> = ({ status }) => {
  const config = {
    verified_violation: {
      label: 'Verified Rule Violation',
      style: 'bg-rose-50 text-rose-800 border-rose-200',
    },
    unsupported_claim: {
      label: 'Unsupported Claim',
      style: 'bg-lavender-50 text-lavender-800 border-lavender-200',
    },
    potential_issue: {
      label: 'Potential Tone Drift',
      style: 'bg-amber-50 text-amber-800 border-amber-200',
    },
    compliant: {
      label: 'Grounded in Guidelines',
      style: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    },
  }[status] || {
    label: status,
    style: 'bg-ivory-100 text-graphite-800 border-[#EAE8E3]',
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider border font-mono ${config.style}`}
    >
      {config.label}
    </span>
  );
};