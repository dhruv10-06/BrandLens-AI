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
    <div className="space-y-8">
      {/* Editorial Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#E2D7C5]">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F5EFE4] border border-[#DDD2BF] text-forest-900 text-[11px] font-bold uppercase tracking-widest font-mono">
            <CheckSquare className="w-3.5 h-3.5 text-brass-700" />
            <span>Human Review Gate</span>
          </div>
          <h1 className="text-3xl font-bold font-serif text-espresso-950 tracking-tight">
            Brand Review Queue
          </h1>
          <p className="text-xs sm:text-sm text-espresso-700">
            Campaign submissions requiring formal executive sign-off, authorized approval, or rejection before publication.
          </p>
        </div>

        <Button variant="outline" size="sm" onClick={fetchQueue}>
          Refresh Queue
        </Button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-oxblood-50 border border-oxblood-200 text-xs text-oxblood-900 flex items-start gap-2.5 shadow-parchment-sm">
          <AlertTriangle className="w-4 h-4 text-oxblood-700 flex-shrink-0 mt-0.5" />
          <span className="font-semibold">{error}</span>
        </div>
      )}

      {/* Queue Table */}
      <div className="bg-[#FDFBF7] rounded-2xl border border-[#E2D7C5] shadow-parchment overflow-hidden">
        {isLoading ? (
          <div className="p-16 text-center text-xs text-espresso-600 font-mono">Loading review queue...</div>
        ) : queue.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <div className="w-12 h-12 rounded-xl bg-forest-100 border border-forest-300 text-forest-800 mx-auto flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-forest-800" />
            </div>
            <h3 className="text-base font-bold font-serif text-espresso-950 tracking-tight">
              Review Queue Clear
            </h3>
            <p className="text-xs text-espresso-700 max-w-sm mx-auto leading-relaxed">
              No submissions are currently pending brand sign-off. All outbound content is currently adjudicated.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#EDE6D8]">
            {queue.map((sub) => {
              const isOwnContent = sub.creatorId?._id === user?.id;
              return (
                <div
                  key={sub._id}
                  className="p-5 sm:px-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#F5EFE4]/60 transition-colors"
                >
                  <div className="space-y-1.5 max-w-xl">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold font-serif text-espresso-950 tracking-tight">
                        {sub.title}
                      </span>
                      <span className="text-[10px] font-bold text-espresso-700 bg-[#EAE1D2] px-2 py-0.5 rounded border border-[#DDD2BF] uppercase tracking-wide font-mono">
                        {sub.contentType.replace('_', ' ')}
                      </span>
                      <StatusBadge status={sub.status} />
                      {isOwnContent && (
                        <span className="text-[10px] font-semibold text-brass-900 bg-brass-100 border border-brass-300 px-2 py-0.5 rounded font-mono">
                          Your Own Content (Separation of duties applies)
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-espresso-700 line-clamp-2 leading-relaxed italic font-serif">
                      "{sub.currentContent}"
                    </p>
                    <div className="text-[11px] text-espresso-600 flex items-center gap-3 pt-0.5 font-mono">
                      <span className="flex items-center gap-1 text-espresso-800">
                        <User className="w-3 h-3 text-brass-700" />
                        {sub.creatorId?.name}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-brass-700" />
                        {new Date(sub.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-center flex-shrink-0">
                    {sub.latestAnalysisId?.overallComplianceScore !== undefined && (
                      <ScoreGauge score={sub.latestAnalysisId.overallComplianceScore} size="sm" />
                    )}
                    <Link to={`/review/${sub._id}`}>
                      <Button variant="accent" size="sm" iconRight={<ArrowRight className="w-3.5 h-3.5 text-cream-50" />}>
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
