import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { reviewApi } from '../api/review.api.ts';
import { ReviewDecision } from '../types/index.ts';
import { History, CheckCircle2, XCircle, AlertTriangle, ArrowRight, User, Clock } from 'lucide-react';

export const ReviewHistoryPage: React.FC = () => {
  const [history, setHistory] = useState<ReviewDecision[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setIsLoading(true);
        const res = await reviewApi.getReviewHistory();
        setHistory(res.history);
      } catch (err) {
        console.error('Failed to load review history:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const getDecisionBadge = (decision: string) => {
    switch (decision) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Approved
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3.5 h-3.5" />
            Rejected
          </span>
        );
      case 'requested_changes':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <AlertTriangle className="w-3.5 h-3.5" />
            Changes Requested
          </span>
        );
      default:
        return <span>{decision}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
          Brand Governance Audit Trail
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Historical record of all human review decisions, reviewer justifications, and publication authorizations.
        </p>
      </div>

      {/* History List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading audit trail...</div>
        ) : history.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <History className="w-8 h-8 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-700">No Review Decisions Recorded</h3>
            <p className="text-xs text-slate-400">
              When brand reviewers approve or reject submissions, audit logs appear here.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {history.map((record) => (
              <div key={record._id} className="p-5 space-y-3 hover:bg-slate-50/50 transition">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900">
                      {record.submissionId?.title || 'Brand Submission'}
                    </span>
                    {getDecisionBadge(record.decision)}
                  </div>

                  <div className="flex items-center gap-2 text-[11px] text-slate-400">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{new Date(record.createdAt).toLocaleString()}</span>
                  </div>
                </div>

                {/* Reviewer and Justification */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs space-y-1.5">
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-600">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>Reviewed by: </span>
                    <strong className="text-slate-900">{record.reviewerId?.name}</strong>
                    <span className="text-slate-400">({record.reviewerId?.email})</span>
                  </div>
                  <p className="text-slate-700 leading-relaxed font-sans italic">
                    "{record.comments}"
                  </p>
                </div>

                {/* Reviewed content snippet & link */}
                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-slate-400 line-clamp-1 max-w-md font-mono text-[11px]">
                    "{record.reviewedContent}"
                  </span>

                  {record.submissionId?._id && (
                    <Link
                      to={`/submissions/${record.submissionId._id}/analysis`}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700"
                    >
                      <span>View Submission</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

