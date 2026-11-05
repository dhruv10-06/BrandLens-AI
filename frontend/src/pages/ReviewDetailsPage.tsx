import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { submissionsApi } from '../api/submissions.api.ts';
import { reviewApi } from '../api/review.api.ts';
import { ContentSubmission, AnalysisReport } from '../types/index.ts';
import { ScoreGauge } from '../components/common/ScoreGauge.tsx';
import { StatusBadge, SeverityBadge } from '../components/common/Badge.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowLeft,
  FileText,
  User,
  Clock,
  MessageSquare,
  Sparkles,
} from 'lucide-react';

export const ReviewDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [submission, setSubmission] = useState<ContentSubmission | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisReport | null>(null);
  const [comments, setComments] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDetails = async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      const res = await submissionsApi.getSubmissionById(id);
      setSubmission(res.submission);
      setAnalysis(res.submission.latestAnalysisId || null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load submission.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [id]);

  const handleDecision = async (decision: 'approved' | 'rejected' | 'requested_changes') => {
    if (!id) return;
    if (!comments.trim()) {
      setError('Please provide a review comment or audit rationale.');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      await reviewApi.makeDecision(id, { decision, comments });
      navigate('/review-history');
    } catch (err: any) {
      setError(
        err.response?.data?.error ||
          err.message ||
          'Failed to record review decision. Ensure you are not approving your own submission.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-12 text-center text-xs text-slate-400">
        Loading submission for review...
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="p-8 text-center text-sm text-slate-500">Submission not found.</div>
    );
  }

  const isCreatorOfSubmission = submission.creatorId?._id === user?.id;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Back button */}
      <Link
        to="/review-queue"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Review Queue</span>
      </Link>

      {/* Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              {submission.contentType.replace('_', ' ')}
            </span>
            <StatusBadge status={submission.status} />
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            {submission.title}
          </h1>
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span>Author: <strong className="text-slate-700">{submission.creatorId?.name}</strong></span>
            <span>•</span>
            <span>Submitted: {new Date(submission.createdAt).toLocaleDateString()}</span>
          </div>
        </div>

        {analysis && (
          <ScoreGauge score={analysis.overallComplianceScore} size="md" />
        )}
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Separation of Duties Alert if Creator Views Own Content */}
      {isCreatorOfSubmission && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Separation of Duties Enforced:</span>
            <p className="mt-0.5 text-amber-700">
              You are the author of this submission. In BrandLens AI, creators are strictly prohibited from approving their own content. Another reviewer or lead must conduct the audit and decision.
            </p>
          </div>
        </div>
      )}

      {/* Comparison Grid: Original vs Revised Content */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Original Submission (v1)
            </span>
            <span className="text-[11px] text-slate-400 font-mono">
              {submission.originalContent.length} chars
            </span>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 text-xs text-slate-700 leading-relaxed font-mono whitespace-pre-wrap min-h-[160px]">
            {submission.originalContent}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-600 font-bold">
              Current / Revised Content (v{submission.version})
            </span>
            <span className="text-[11px] text-slate-400 font-mono">
              {submission.currentContent.length} chars
            </span>
          </div>
          <div className="p-4 rounded-xl bg-indigo-50/30 border border-indigo-100/60 text-xs text-slate-900 leading-relaxed font-mono whitespace-pre-wrap min-h-[160px]">
            {submission.currentContent}
          </div>
        </div>
      </div>

      {/* AI Findings Summary */}
      {analysis && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-brand-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                AI Brand Governance Audit Summary ({analysis.findings.length} findings)
              </h3>
            </div>
            <Link
              to={`/submissions/${submission._id}/analysis`}
              className="text-xs font-semibold text-brand-600 hover:underline"
            >
              Open Full Analysis Deck
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {analysis.findings.map((f, i) => (
              <div key={i} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">{f.category}</span>
                  <SeverityBadge severity={f.severity} />
                </div>
                <div className="text-slate-600 font-mono text-[11px] bg-white p-1 rounded border border-slate-200">
                  "{f.originalText}"
                </div>
                <p className="text-slate-600 leading-normal">{f.explanation}</p>
                <div className="text-[11px] text-brand-700 italic">
                  Suggested: "{f.suggestedCorrection}"
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Review Decision Form */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        <h3 className="text-sm font-extrabold text-slate-900">
          Official Brand Review Decision
        </h3>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Audit Justification & Comments (Required)
          </label>
          <textarea
            rows={4}
            required
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            disabled={isCreatorOfSubmission || isSubmitting}
            placeholder={
              isCreatorOfSubmission
                ? 'Review actions disabled: You cannot review your own content.'
                : 'State the rationale for approval, requested alterations, or rejection based on brand compliance...'
            }
            className="w-full p-3.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:bg-slate-100 disabled:cursor-not-allowed"
          />
        </div>

        <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => handleDecision('requested_changes')}
            disabled={isCreatorOfSubmission || isSubmitting || !comments.trim()}
            className="px-4 py-2 text-xs font-bold rounded-xl border border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100 transition disabled:opacity-40"
          >
            Request Changes
          </button>

          <button
            type="button"
            onClick={() => handleDecision('rejected')}
            disabled={isCreatorOfSubmission || isSubmitting || !comments.trim()}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl border border-red-300 bg-red-50 text-red-700 hover:bg-red-100 transition disabled:opacity-40"
          >
            <XCircle className="w-3.5 h-3.5" />
            <span>Reject Content</span>
          </button>

          <button
            type="button"
            onClick={() => handleDecision('approved')}
            disabled={isCreatorOfSubmission || isSubmitting || !comments.trim()}
            className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition disabled:opacity-40"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Approve for Publication</span>
          </button>
        </div>
      </div>
    </div>
  );
};
