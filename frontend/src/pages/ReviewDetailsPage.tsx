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
  const visualAnalysis = analysis?.visualAnalysis;

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
            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
              {submission.submissionFormat || 'text'}
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

        <div className="flex items-center gap-4">
          {visualAnalysis && (
            <div className="text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Visual Score
              </span>
              <span className={`text-xl font-extrabold px-3 py-1 rounded-xl ${
                visualAnalysis.overallVisualScore >= 80 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                visualAnalysis.overallVisualScore >= 60 ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                'bg-red-50 text-red-700 border border-red-200'
              }`}>
                {visualAnalysis.overallVisualScore}/100
              </span>
            </div>
          )}

          {analysis && (
            <ScoreGauge score={analysis.overallComplianceScore} size="md" />
          )}
        </div>
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

      {/* Already Published Banner if previously approved */}
      {submission.publishingDetails?.status === 'published' && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <div>
              <span className="font-bold">Published & Dispatched via Integration:</span>
              <p className="text-emerald-700 text-[11px] mt-0.5">
                Channel: <strong className="font-mono uppercase">{submission.publishingDetails.channel}</strong> | Published: {submission.publishingDetails.publishedAt ? new Date(submission.publishingDetails.publishedAt).toLocaleString() : 'Yes'}
              </p>
            </div>
          </div>
          <button
            onClick={handlePreviewPayload}
            className="px-3 py-1.5 rounded-lg bg-emerald-100 text-emerald-800 font-semibold hover:bg-emerald-200 transition text-xs"
          >
            View Payload
          </button>
        </div>
      )}

      {/* Creative Visual Asset Section if Present */}
      {submission.visualAsset && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-indigo-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Visual Creative Asset Compliance Inspection
              </h3>
            </div>
            <span className="text-[11px] text-slate-500 font-mono">
              {submission.visualAsset.filename} ({(submission.visualAsset.fileSize / 1024).toFixed(1)} KB)
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            {/* Image Preview Box */}
            <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-900/5 flex items-center justify-center p-2">
              <img
                src={submission.visualAsset.dataUrl}
                alt={submission.title}
                className="max-h-72 object-contain rounded-lg shadow-sm"
              />
            </div>

            {/* Visual AI Audit Insights */}
            <div className="space-y-4">
              {visualAnalysis ? (
                <>
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Visual Brand Palette Audit
                    </span>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {visualAnalysis.detectedColors.map((color, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-1.5 px-2 py-1 rounded bg-white border border-slate-200 shadow-2xs text-[11px]"
                        >
                          <span
                            className="w-3.5 h-3.5 rounded-full border border-slate-300"
                            style={{ backgroundColor: color.hex }}
                          />
                          <span className="font-mono font-medium text-slate-700">{color.hex}</span>
                          <span className={`text-[9px] font-bold px-1 rounded ${
                            color.isApprovedBrandColor ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {color.isApprovedBrandColor ? 'Approved' : 'Disallowed'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                        Logo Usage
                      </span>
                      <span className={`font-semibold ${visualAnalysis.logoAnalysis.detected ? 'text-emerald-700' : 'text-slate-600'}`}>
                        {visualAnalysis.logoAnalysis.detected ? 'Verified Present' : 'Not Detected'}
                      </span>
                      <p className="text-[10px] text-slate-500 mt-1 line-clamp-2">
                        {visualAnalysis.logoAnalysis.details}
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                        Typography
                      </span>
                      <span className="font-semibold text-slate-800">
                        {visualAnalysis.typographyAnalysis.fontStyleDetected || 'System Sans'}
                      </span>
                      <p className="text-[10px] text-slate-500 mt-1">
                        {visualAnalysis.typographyAnalysis.details}
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="p-6 rounded-xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-500">
                  Visual asset attached. No multimodal report detected.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Comparison Grid: Original vs Revised Content */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Original Draft Copy (v1)
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

      {/* Review Decision & Publishing Pipeline Dispatch Form */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-extrabold text-slate-900">
            Official Brand Review Decision & Release Pipeline
          </h3>
          <span className="text-[11px] font-semibold text-slate-500">
            Human-in-the-Loop Gate Active
          </span>
        </div>

        {/* Publishing Channel Selector */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-indigo-600" />
              <span>Select Publication Channel (Triggered upon Approval)</span>
            </label>

            <button
              type="button"
              onClick={handlePreviewPayload}
              disabled={isPreviewLoading}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
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
                className={`p-2.5 rounded-xl border text-left transition ${
                  selectedChannel === ch.id
                    ? 'bg-indigo-50 border-indigo-400 ring-2 ring-indigo-400/20'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="text-xs font-bold text-slate-800">{ch.name}</div>
                <div className="text-[10px] text-slate-500">{ch.desc}</div>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
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
            <span>Approve & Dispatch to {selectedChannel.toUpperCase()}</span>
          </button>
        </div>
      </div>

      {/* JSON Payload Preview Modal */}
      {isPreviewOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <Code2 className="w-4 h-4 text-indigo-600" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Publication Webhook Payload Preview
                </h4>
              </div>
              <button
                onClick={() => setIsPreviewOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold px-2 py-1"
              >
                ✕
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-3 font-mono text-[11px]">
              <div className="p-3 bg-slate-900 text-emerald-400 rounded-xl overflow-x-auto">
                <pre>{JSON.stringify(payloadPreview, null, 2)}</pre>
              </div>
              <p className="text-slate-500 font-sans text-xs">
                This exact JSON package is delivered to the target pipeline when the reviewer approves the submission.
              </p>
            </div>

            <div className="p-3 border-t border-slate-100 flex justify-end bg-slate-50">
              <button
                onClick={() => setIsPreviewOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
