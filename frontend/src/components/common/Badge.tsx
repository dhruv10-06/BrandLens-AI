import React from 'react';
import { FindingSeverity, SubmissionStatus, EvidenceStatus } from '../../types/index.ts';

export const SeverityBadge: React.FC<{ severity: FindingSeverity }> = ({ severity }) => {
  const config = {
    Critical: {
      style: 'bg-oxblood-100 text-oxblood-900 border-oxblood-300/80',
      dot: 'bg-oxblood-800',
    },
    High: {
      style: 'bg-oxblood-50 text-oxblood-800 border-oxblood-200/80',
      dot: 'bg-oxblood-700',
    },
    Medium: {
      style: 'bg-brass-100 text-brass-900 border-brass-300/80',
      dot: 'bg-brass-700',
    },
    Low: {
      style: 'bg-olive-100 text-olive-900 border-olive-300/80',
      dot: 'bg-olive-700',
    },
  }[severity];

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${config.style}`}
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
      style: 'bg-parchment-200 text-espresso-700 border-parchment-300',
      dot: 'bg-espresso-400',
    },
    analysing: {
      label: 'Auditing Content...',
      style: 'bg-forest-100 text-forest-900 border-forest-300 animate-pulse',
      dot: 'bg-forest-800 animate-ping',
    },
    needs_changes: {
      label: 'Changes Required',
      style: 'bg-oxblood-50 text-oxblood-900 border-oxblood-200',
      dot: 'bg-oxblood-700',
    },
    pending_review: {
      label: 'Pending Human Sign-off',
      style: 'bg-brass-100 text-brass-900 border-brass-300',
      dot: 'bg-brass-700',
    },
    approved: {
      label: 'Approved & Compliant',
      style: 'bg-forest-100 text-forest-900 border-forest-300',
      dot: 'bg-forest-800',
    },
    rejected: {
      label: 'Publication Blocked',
      style: 'bg-oxblood-100 text-oxblood-900 border-oxblood-300',
      dot: 'bg-oxblood-800',
    },
  }[status] || {
    label: status,
    style: 'bg-parchment-200 text-espresso-700 border-parchment-300',
    dot: 'bg-espresso-400',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${config.style}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      <span>{config.label}</span>
    </span>
  );
};

export const EvidenceBadge: React.FC<{ status: EvidenceStatus }> = ({ status }) => {
  const config = {
    verified_violation: {
      label: 'Verified Policy Breach',
      style: 'bg-oxblood-100 text-oxblood-900 border-oxblood-300',
    },
    unsupported_claim: {
      label: 'Unsupported Claim',
      style: 'bg-brass-100 text-brass-900 border-brass-300',
    },
    potential_issue: {
      label: 'Tone Variance',
      style: 'bg-olive-100 text-olive-900 border-olive-300',
    },
    compliant: {
      label: 'Brand Compliant',
      style: 'bg-forest-100 text-forest-900 border-forest-300',
    },
  }[status] || {
    label: status,
    style: 'bg-parchment-200 text-espresso-800 border-parchment-300',
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border font-mono ${config.style}`}
    >
      {config.label}
    </span>
  );
};
