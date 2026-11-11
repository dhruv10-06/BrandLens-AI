import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { reviewApi } from '../api/review.api.ts';
import { ContentSubmission } from '../types/index.ts';
import { StatusBadge } from '../components/common/Badge.tsx';
import { ScoreGauge } from '../components/common/ScoreGauge.tsx';
import { Button } from '../components/common/Button.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { CheckSquare, ArrowRight, User, Clock, AlertTriangle, ShieldCheck } from 'lucide-react';

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#EAE8E3]">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-lavender-100 border border-lavender-200 text-brand-700 text-[11px] font-bold uppercase tracking-wider mb-2 font-mono">
            <CheckSquare className="w-3.5 h-3.5" />
            <span>Human Governance Gate</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-graphite-900 tracking-tight">
            Brand Review Queue
          </h1>
          <p className="text-xs sm:text-sm text-graphite-500 mt-1">
            Submissions requiring human sign-off, approval, or rejection before publication.
          </p>
        </div>

        <Button variant="outline" size="sm" onClick={fetchQueue}>
          Refresh Queue
        </Button>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2.5 shadow-subtle">
          <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
          <span className="font-semibold">{error}</span>
        </div>
      )}

      {/* Queue Table */}
      <div className="bg-white rounded-3xl border border-[#EAE8E3] shadow-card overflow-hidden">
        {isLoading ? (
          <div className="p-16 text-center text-xs text-graphite-400 font-mono">Loading review queue...</div>
        ) : queue.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 mx-auto flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-graphite-900 tracking-tight">Review Queue Clear</h3>
            <p className="text-xs text-graphite-500 max-w-sm mx-auto leading-relaxed">
              No submissions are currently pending brand sign-off. Outbound content is currently up to date.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#F2EFE8]">
            {queue.map((sub) => {
              const isOwnContent = sub.creatorId?._id === user?.id;
              return (
                <div
                  key={sub._id}
                  className="p-5 sm:px-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-ivory-50/60 transition-colors"
                >
                  <div className="space-y-1.5 max-w-xl">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-graphite-900 tracking-tight">{sub.title}</span>
                      <span className="text-[10px] font-bold text-graphite-600 bg-ivory-100 px-2 py-0.5 rounded border border-[#EAE8E3] uppercase tracking-wide font-mono">
                        {sub.contentType.replace('_', ' ')}
                      </span>
                      <StatusBadge status={sub.status} />
                      {isOwnContent && (
                        <span className="text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full font-mono">
                          Your Own Content (Separation of duties applies)
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-graphite-600 line-clamp-2 leading-relaxed italic">
                      "{sub.currentContent}"
                    </p>
                    <div className="text-[11px] text-graphite-400 flex items-center gap-3 pt-0.5 font-mono">
                      <span className="flex items-center gap-1 text-graphite-600">
                        <User className="w-3 h-3 text-graphite-400" />
                        {sub.creatorId?.name}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-graphite-400" />
                        {new Date(sub.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-center flex-shrink-0">
                    {sub.latestAnalysisId?.overallComplianceScore !== undefined && (
                      <ScoreGauge score={sub.latestAnalysisId.overallComplianceScore} size="sm" />
                    )}
                    <Link to={`/review/${sub._id}`}>
                      <Button variant="accent" size="sm" iconRight={<ArrowRight className="w-3.5 h-3.5" />}>
                        Review &amp; Decide
                      </Button>
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