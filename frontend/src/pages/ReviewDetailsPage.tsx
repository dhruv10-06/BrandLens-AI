import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { submissionsApi } from '../api/submissions.api.ts';
import { reviewApi } from '../api/review.api.ts';
import { ContentSubmission, AnalysisReport } from '../types/index.ts';
import { ScoreGauge } from '../components/common/ScoreGauge.tsx';
import { StatusBadge, SeverityBadge } from '../components/common/Badge.tsx';
import { Button } from '../components/common/Button.tsx';
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
  Sparkles,
  Send,
  Eye,
  Globe,
  Palette,
  Image as ImageIcon,
  ExternalLink,
  Code2,
  Layers,
  Radio,
  X,
} from 'lucide-react';

export const ReviewDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [submission, setSubmission] = useState<ContentSubmission | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisReport | null>(null);
  const [comments, setComments] = useState('');
  const [selectedChannel, setSelectedChannel] = useState<'webhook' | 'cms' | 'social_media' | 'internal'>('webhook');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Publishing Preview Drawer / Modal State
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [payloadPreview, setPayloadPreview] = useState<any | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);

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

  const handlePreviewPayload = async () => {
    if (!id) return;
    setIsPreviewLoading(true);
    try {
      const res = await reviewApi.previewPublish(id);
      setPayloadPreview({
        channel: res.channel,
        webhookUrl: res.webhookUrl,
        payload: res.payload,
      });
      setIsPreviewOpen(true);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to generate publishing payload preview.');
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const handleDecision = async (decision: 'approved' | 'rejected' | 'requested_changes') => {
    if (!id) return;
    if (!comments.trim()) {
      setError('Please provide a review comment or audit rationale.');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      await reviewApi.makeDecision(id, {
        decision,
        comments,
        publishChannel: decision === 'approved' ? selectedChannel : undefined,
      });
      navigate('/review-history');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to record brand review decision.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-slate-500 gap-3">
        <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-semibold tracking-wide text-slate-600">Loading submission for reviewer audit...</span>
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="p-8 rounded-xl bg-white border border-stone-200 text-center max-w-md mx-auto my-12 shadow-card">
        <AlertCircle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
        <h3 className="text-sm font-bold text-slate-900">Submission Not Found</h3>
        <p className="text-xs text-slate-500 mt-1">This item may have already been reviewed or removed.</p>
        <Link to="/review-queue" className="mt-4 inline-block">
          <Button variant="outline" size="sm">Back to Review Queue</Button>
        </Link>
      </div>
    );
  }

  const isCreatorOfSubmission = submission.creatorId?._id === user?.id;
  const visualAnalysis = analysis?.visualAnalysis;

  return (
    <div className="space-y-6">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200/80">
        <div>
          <Link
            to="/review-queue"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 mb-2 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Review Queue</span>
          </Link>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {submission.title}
            </h1>
            <StatusBadge status={submission.status} />
          </div>
          <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-1 font-mono">
            <span className="flex items-center gap-1 text-slate-700">
              <User className="w-3.5 h-3.5 text-slate-400" />
              Creator: {submission.creatorId?.name}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              {new Date(submission.createdAt).toLocaleString()}
            </span>
            <span>•</span>
            <span className="bg-stone-100 px-2 py-0.5 rounded uppercase font-bold text-slate-600">
              v{submission.version}
            </span>
          </div>
        </div>

        {analysis && (
          <div className="flex items-center gap-3">
            <ScoreGauge score={analysis.overallComplianceScore} size="md" />
          </div>
        )}
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2.5 shadow-subtle">
          <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
          <span className="font-semibold">{error}</span>
        </div>
      )}

      {/* Separation of Duties Notice */}
      {isCreatorOfSubmission && (
        <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-amber-800 flex items-start gap-3 shadow-subtle">
          <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Separation of Duties Policy Enforcement: </span>
            You are the registered creator of this submission. Under enterprise brand governance controls, creators cannot approve or reject their own work. Another reviewer must complete this sign-off.
          </div>
        </div>
      )}

      {/* Multimodal Creative Asset Showcase (if attached) */}
      {submission.visualAsset && (
        <div className="bg-white rounded-xl border border-stone-200/90 shadow-card p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-stone-100">
            <div className="flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-purple-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Attached Creative Asset Audit ({submission.visualAsset.filename})
              </h3>
            </div>
            {visualAnalysis && (
              <span className="text-xs font-extrabold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-200 font-mono">
                Visual Score: {visualAnalysis.overallVisualScore}%
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            {/* Image Preview Box */}
            <div className="border border-stone-200 rounded-xl overflow-hidden bg-slate-950 flex items-center justify-center p-3 shadow-subtle">
              <img
                src={submission.visualAsset.dataUrl}
                alt={submission.title}
                className="max-h-72 object-contain rounded"
              />
            </div>

            {/* Visual AI Audit Insights */}
            <div className="space-y-4">
              {visualAnalysis ? (
                <>
                  <div className="p-4 rounded-xl bg-stone-50 border border-stone-200/80 space-y-2">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                      Visual Brand Palette Audit
                    </span>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {visualAnalysis.detectedColors.map((color, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-white border border-stone-200 shadow-subtle text-[11px]"
                        >
                          <span
                            className="w-3.5 h-3.5 rounded-md border border-black/10"
                            style={{ backgroundColor: color.hex }}
                          />
                          <span className="font-mono font-bold text-slate-800">{color.hex}</span>
                          <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded ${
                            color.isApprovedBrandColor ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                          }`}>
                            {color.isApprovedBrandColor ? 'Approved' : 'Disallowed'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200/80">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">
                        Logo Usage
                      </span>
                      <span className={`font-bold ${visualAnalysis.logoAnalysis.detected ? 'text-emerald-700' : 'text-slate-600'}`}>
                        {visualAnalysis.logoAnalysis.detected ? 'Verified Present' : 'Not Detected'}
                      </span>
                      <p className="text-[10px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                        {visualAnalysis.logoAnalysis.details}
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200/80">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">
                        Typography
                      </span>
                      <span className="font-bold text-slate-800 font-mono">
                        {visualAnalysis.typographyAnalysis.fontStyleDetected || 'System Sans'}
                      </span>
                      <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
                        {visualAnalysis.typographyAnalysis.details}
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="p-6 rounded-xl bg-stone-50 border border-stone-200 text-center text-xs text-slate-500">
                  Visual asset attached. No multimodal report detected.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Comparison Grid: Original vs Revised Content */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-stone-200/90 shadow-card p-5 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-stone-100">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Original Draft Copy (v1)
            </span>
            <span className="text-[11px] text-slate-400 font-mono">
              {submission.originalContent.length} chars
            </span>
          </div>
          <div className="p-4 rounded-xl bg-stone-50 text-xs text-slate-700 leading-relaxed font-mono whitespace-pre-wrap min-h-[160px] border border-stone-200/60">
            {submission.originalContent}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-stone-200/90 shadow-card p-5 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-stone-100">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-600">
              Current / Revised Content (v{submission.version})
            </span>
            <span className="text-[11px] text-slate-400 font-mono">
              {submission.currentContent.length} chars
            </span>
          </div>
          <div className="p-4 rounded-xl bg-indigo-50/30 border border-indigo-100/70 text-xs text-slate-900 leading-relaxed font-mono whitespace-pre-wrap min-h-[160px]">
            {submission.currentContent}
          </div>
        </div>
      </div>

      {/* AI Findings Summary */}
      {analysis && (
        <div className="bg-white rounded-xl border border-stone-200/90 shadow-card p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-stone-100">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-brand-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                AI Brand Governance Audit Summary ({analysis.findings.length} findings)
              </h3>
            </div>
            <Link
              to={`/submissions/${submission._id}/analysis`}
              className="text-xs font-bold text-brand-600 hover:text-brand-700 transition"
            >
              Open Full Analysis Deck &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {analysis.findings.map((f, i) => (
              <div key={i} className="p-4 rounded-xl bg-stone-50/80 border border-stone-200/80 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">{f.category}</span>
                  <SeverityBadge severity={f.severity} />
                </div>
                <div className="text-slate-700 font-mono text-[11px] bg-white p-2 rounded-lg border border-stone-200">
                  "{f.originalText}"
                </div>
                <p className="text-slate-600 leading-relaxed">{f.explanation}</p>
                <div className="text-[11px] text-brand-700 font-medium">
                  Suggested: "{f.suggestedCorrection}"
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Review Decision & Publishing Pipeline Dispatch Form */}
      <div className="bg-white rounded-xl border border-stone-200/90 shadow-card p-6 space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-stone-100">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">
              Official Brand Review Decision & Release Pipeline
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Authoritative human sign-off gate before dispatch</p>
          </div>
          <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-mono">
            Human Gate Active
          </span>
        </div>

        {/* Publishing Channel Selector */}
        <div className="p-4 rounded-xl bg-stone-50 border border-stone-200/80 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-indigo-600" />
              <span>Target Publication Channel (Triggered Upon Approval)</span>
            </label>

            <button
              type="button"
              onClick={handlePreviewPayload}
              disabled={isPreviewLoading}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition"
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>{isPreviewLoading ? 'Generating...' : 'Preview JSON Payload'}</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {[
              { id: 'webhook', name: 'Webhook', desc: 'Enterprise Endpoint' },
              { id: 'cms', name: 'CMS Pipeline', desc: 'Draft / Staging' },
              { id: 'social_media', name: 'Social Engine', desc: 'Social Outbox' },
              { id: 'internal', name: 'Vault Only', desc: 'Internal Archive' },
            ].map((ch) => (
              <button
                key={ch.id}
                type="button"
                onClick={() => setSelectedChannel(ch.id as any)}
                className={`p-3 rounded-xl border text-left transition-all ${
                  selectedChannel === ch.id
                    ? 'bg-indigo-50 border-indigo-400 ring-2 ring-indigo-400/20 shadow-subtle'
                    : 'bg-white border-stone-200 hover:border-stone-300'
                }`}
              >
                <div className="text-xs font-bold text-slate-900">{ch.name}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">{ch.desc}</div>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
            Audit Justification & Review Notes (Required)
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
            className="w-full p-4 text-xs rounded-xl border border-stone-200/90 focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:bg-stone-100 disabled:cursor-not-allowed leading-relaxed font-sans placeholder:text-slate-400"
          />
        </div>

        <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            size="md"
            onClick={() => handleDecision('requested_changes')}
            disabled={isCreatorOfSubmission || isSubmitting || !comments.trim()}
          >
            Request Changes
          </Button>

          <Button
            type="button"
            variant="destructive"
            size="md"
            icon={<XCircle className="w-3.5 h-3.5" />}
            onClick={() => handleDecision('rejected')}
            disabled={isCreatorOfSubmission || isSubmitting || !comments.trim()}
          >
            Reject Content
          </Button>

          <Button
            type="button"
            variant="primary"
            size="md"
            icon={<CheckCircle2 className="w-3.5 h-3.5" />}
            onClick={() => handleDecision('approved')}
            disabled={isCreatorOfSubmission || isSubmitting || !comments.trim()}
            className="bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800"
          >
            Approve & Dispatch to {selectedChannel.toUpperCase()}
          </Button>
        </div>
      </div>

      {/* JSON Payload Preview Modal */}
      {isPreviewOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-stone-200 shadow-modal overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-4 border-b border-stone-100 flex items-center justify-between bg-stone-50">
              <div className="flex items-center gap-2">
                <Code2 className="w-4 h-4 text-indigo-600" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 font-mono">
                  Publication Webhook Payload Preview
                </h4>
              </div>
              <button
                onClick={() => setIsPreviewOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-3 font-mono text-[11px]">
              <div className="p-4 bg-slate-900 text-emerald-400 rounded-xl overflow-x-auto shadow-inner">
                <pre>{JSON.stringify(payloadPreview, null, 2)}</pre>
              </div>
              <p className="text-slate-500 font-sans text-xs">
                This exact JSON payload is transmitted to the configured endpoint when the reviewer approves the content.
              </p>
            </div>

            <div className="p-3.5 border-t border-stone-100 flex justify-end bg-stone-50">
              <Button variant="outline" size="sm" onClick={() => setIsPreviewOpen(false)}>
                Close Preview
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
