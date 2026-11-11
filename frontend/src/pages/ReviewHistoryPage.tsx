import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { reviewApi } from '../api/review.api.ts';
import { ReviewDecision } from '../types/index.ts';
import { Button } from '../components/common/Button.tsx';
import { History, CheckCircle2, XCircle, AlertTriangle, ArrowRight, User, Clock } from 'lucide-react';

export const ReviewHistoryPage: React.FC = () => {
  const [history, setHistory] = useState<ReviewDecision[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

  useEffect(() => {
    fetchHistory();
  }, []);

  const getDecisionBadge = (decision: string) => {
    switch (decision) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
            <span>Approved & Released</span>
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-800 border border-rose-200">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
            <span>Rejected</span>
          </span>
        );
      case 'requested_changes':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
            <span>Changes Requested</span>
          </span>
        );
      default:
        return <span className="text-xs font-mono">{decision}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200/80">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-[11px] font-bold uppercase tracking-wider mb-2">
            <History className="w-3.5 h-3.5" />
            <span>Governance Audit Trail</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Brand Review Decisions
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Historical record of human sign-off determinations, justifications, and publication authorizations.
          </p>
        </div>

        <Button variant="outline" size="sm" onClick={fetchHistory}>
          Refresh Trail
        </Button>
      </div>

      {/* History List */}
      <div className="bg-white rounded-xl border border-stone-200/90 shadow-card overflow-hidden">
        {isLoading ? (
          <div className="p-16 text-center text-xs text-slate-400">Loading audit trail...</div>
        ) : history.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <div className="w-12 h-12 rounded-xl bg-stone-100 border border-stone-200 text-slate-400 mx-auto flex items-center justify-center">
              <History className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-800 tracking-tight">No Review Decisions Recorded</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
              When brand reviewers approve, request changes, or reject submissions, audit logs will be preserved here.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-stone-100">
            {history.map((record) => (
              <div
                key={record._id}
                className="p-5 sm:px-6 hover:bg-stone-50/60 transition-colors space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="text-sm font-bold text-slate-900 tracking-tight">
                      {record.submissionId?.title || 'Submission Record'}
                    </span>
                    {getDecisionBadge(record.decision)}
                  </div>

                  <div className="text-[11px] text-slate-400 flex items-center gap-3 font-mono">
                    <span className="flex items-center gap-1 text-slate-600">
                      <User className="w-3 h-3 text-slate-400" />
                      Auditor: {record.reviewerId?.name}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {new Date(record.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>

                {record.comments && (
                  <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200/80 text-xs text-slate-700 leading-relaxed font-sans">
                    <span className="font-bold text-slate-900">Reviewer Notes: </span>
                    <span>"{record.comments}"</span>
                  </div>
                )}

                {record.submissionId?._id && (
                  <div className="flex justify-end pt-1">
                    <Link
                      to={`/review/${record.submissionId._id}`}
                      className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1 transition-colors"
                    >
                      <span>Inspect Audit Deck</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
