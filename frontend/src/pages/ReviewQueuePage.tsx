import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { reviewApi } from '../api/review.api.ts';
import { ContentSubmission } from '../types/index.ts';
import { StatusBadge } from '../components/common/Badge.tsx';
import { ScoreGauge } from '../components/common/ScoreGauge.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { CheckSquare, ShieldAlert, ArrowRight, User, Clock, AlertTriangle } from 'lucide-react';

export const ReviewQueuePage: React.FC = () => {
  const { user } = useAuth();
  const [queue, setQueue] = useState<ContentSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchQueue = async () => {
    try {
      setIsLoading(true);
      const res = await reviewApi.getReviewQueue();
      setQueue(res.queue);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load brand governance review queue.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold uppercase tracking-wider mb-2">
            <CheckSquare className="w-3.5 h-3.5" />
            <span>Human Governance Gate</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Brand Review Queue
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Submissions requiring human sign-off, approval, or rejection before publication.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Queue Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading review queue...</div>
        ) : queue.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <CheckSquare className="w-8 h-8 text-emerald-500 mx-auto" />
            <h3 className="text-sm font-bold text-slate-800">Review Queue Clear</h3>
            <p className="text-xs text-slate-400">
              No submissions are currently pending brand sign-off.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {queue.map((sub) => {
              const isOwnContent = sub.creatorId?._id === user?.id;
              return (
                <div
                  key={sub._id}
                  className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 transition"
                >
                  <div className="space-y-1.5 max-w-xl">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-slate-900">{sub.title}</span>
                      <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded capitalize">
                        {sub.contentType.replace('_', ' ')}
                      </span>
                      <StatusBadge status={sub.status} />
                      {isOwnContent && (
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                          Your Own Content (Separation of duties applies)
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      "{sub.currentContent}"
                    </p>
                    <div className="text-[11px] text-slate-400 flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3 text-slate-400" />
                        {sub.creatorId?.name}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {new Date(sub.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-center flex-shrink-0">
                    {sub.latestAnalysisId?.overallComplianceScore !== undefined && (
                      <ScoreGauge score={sub.latestAnalysisId.overallComplianceScore} size="sm" />
                    )}
                    <Link
                      to={`/review/${sub._id}`}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition"
                    >
                      <span>Review & Decide</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
