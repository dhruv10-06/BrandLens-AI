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
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowLeft,
  User,
  Clock,
  Sparkles,
  Globe,
  Image as ImageIcon,
  Code2,
  X,
  Compass,
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
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-espresso-600 gap-3">
        <div className="w-8 h-8 border-2 border-forest-800 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-semibold tracking-wider text-espresso-700 font-mono">
          Loading submission for reviewer audit...
        </span>
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="p-8 rounded-2xl bg-[#FDFBF7] border border-[#E2D7C5] text-center max-w-md mx-auto my-12 shadow-parchment">
        <AlertCircle className="w-8 h-8 text-brass-700 mx-auto mb-2" />
        <h3 className="text-sm font-bold font-serif text-espresso-950">Submission Not Found</h3>
        <p className="text-xs text-espresso-700 mt-1">This item may have already been reviewed or removed.</p>
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E2D7C5]">
        <div>
          <Link
            to="/review-queue"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-espresso-700 hover:text-espresso-950 mb-2 transition-colors font-mono"
          >
            <ArrowLeft className="w-4 h-4 text-brass-700" />
            <span>Return to Adjudication Queue</span>
          </Link>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-bold font-serif text-espresso-950 tracking-tight">
              {submission.title}
            </h1>
            <StatusBadge status={submission.status} />
          </div>
          <div className="flex items-center gap-3 text-[11px] text-espresso-600 mt-1 font-mono">
            <span className="flex items-center gap-1 text-espresso-800">
              <User className="w-3.5 h-3.5 text-brass-700" />
              Creator: {submission.creatorId?.name}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-brass-700" />
              {new Date(submission.createdAt).toLocaleString()}
            </span>
            <span>•</span>
            <span className="bg-[#F5EFE4] px-2 py-0.5 rounded uppercase font-bold text-espresso-800 border border-[#DDD2BF]">
              Revision v{submission.version}
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
        <div className="p-4 rounded-xl bg-oxblood-50 border border-oxblood-200 text-xs text-oxblood-900 flex items-start gap-2.5 shadow-parchment-sm">
          <AlertCircle className="w-4 h-4 text-oxblood-700 flex-shrink-0 mt-0.5" />
          <span className="font-semibold">{error}</span>
        </div>
      )}

      {/* Separation of Duties Notice */}
      {isCreatorOfSubmission && (
        <div className="p-4 rounded-xl bg-brass-50 border border-brass-300 text-xs text-brass-900 flex items-start gap-3 shadow-parchment-sm">
          <AlertCircle className="w-4 h-4 text-brass-800 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Separation of Duties Policy Enforcement: </span>
            You are the registered creator of this submission. Under enterprise brand governance controls, creators cannot approve or reject their own work. Another reviewer must complete this sign-off.
          </div>
        </div>
      )}

      {/* Multimodal Creative Asset Showcase (if attached) */}
      {submission.visualAsset && (
        <div className="bg-[#FDFBF7] rounded-2xl border border-[#E2D7C5] shadow-parchment p-6 sm:p-7 space-y-4">
          <div className="flex items-center justify-between pb-3.5 border-b border-[#EDE6D8]">
            <div className="flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-brass-700" />
              <h3 className="text-xs font-bold uppercase tracking-widest text-espresso-950 font-serif">
                Attached Creative Asset Audit ({submission.visualAsset.filename})
              </h3>
            </div>
            {visualAnalysis && (
              <span className="text-xs font-bold text-forest-900 bg-[#E5EFEA] px-2.5 py-1 rounded-lg border border-forest-300 font-mono">
                Visual Score: {visualAnalysis.overallVisualScore}%
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            {/* Image Preview Box */}
            <div className="border border-espresso-800 rounded-xl overflow-hidden bg-espresso-950 flex items-center justify-center p-3 shadow-parchment-sm">
              <img
                src={submission.visualAsset.dataUrl}
                alt={submission.title}
                className="max-h-72 object-contain rounded-lg"
              />
            </div>

            {/* Visual AI Audit Insights */}
            <div className="space-y-4">
              {visualAnalysis ? (
                <>
                  <div className="p-4 rounded-xl bg-[#FAF7F0] border border-[#DDD2BF] space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-espresso-600 font-mono">
                      Visual Brand Palette Audit
                    </span>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {visualAnalysis.detectedColors.map((color, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-[#FDFBF7] border border-[#DDD2BF] shadow-parchment-sm text-[11px]"
                        >
                          <span
                            className="w-3.5 h-3.5 rounded border border-black/10"
                            style={{ backgroundColor: color.hex }}
                          />
                          <span className="font-mono font-bold text-espresso-950">{color.hex}</span>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded font-mono ${
                            color.isApprovedBrandColor ? 'bg-forest-100 text-forest-900 border border-forest-300' : 'bg-oxblood-100 text-oxblood-900 border border-oxblood-300'
                          }`}>
                            {color.isApprovedBrandColor ? 'Approved' : 'Disallowed'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-4 rounded-xl bg-[#FAF7F0] border border-[#DDD2BF]">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-espresso-600 block mb-1 font-mono">
                        Logo Usage
                      </span>
                      <span className={`font-bold font-serif ${visualAnalysis.logoAnalysis.detected ? 'text-forest-900' : 'text-espresso-700'}`}>
                        {visualAnalysis.logoAnalysis.detected ? 'Verified Present' : 'Not Detected'}
                      </span>
                      <p className="text-[10px] text-espresso-600 mt-1 line-clamp-2 leading-relaxed">
                        {visualAnalysis.logoAnalysis.details}
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-[#FAF7F0] border border-[#DDD2BF]">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-espresso-600 block mb-1 font-mono">
                        Typography
                      </span>
                      <span className="font-bold text-espresso-950 font-mono">
                        {visualAnalysis.typographyAnalysis.fontStyleDetected || 'System Sans'}
                      </span>
                      <p className="text-[10px] text-espresso-600 mt-1 leading-relaxed">
                        {visualAnalysis.typographyAnalysis.details}
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="p-6 rounded-xl bg-[#FAF7F0] border border-[#DDD2BF] text-center text-xs text-espresso-600">
                  Visual asset attached. No multimodal report detected.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Comparison Grid: Original vs Revised Content */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[#FDFBF7] rounded-2xl border border-[#E2D7C5] shadow-parchment p-5 sm:p-6 space-y-3">
          <div className="flex items-center justify-between pb-2.5 border-b border-[#EDE6D8]">
            <span className="text-xs font-bold uppercase tracking-widest text-espresso-600 font-mono">
              Original Draft Copy (v1)
            </span>
            <span className="text-[11px] text-espresso-600 font-mono">
              {submission.originalContent.length} chars
            </span>
          </div>
          <div className="p-4 rounded-xl bg-[#FAF7F0] text-xs text-espresso-800 leading-relaxed font-mono whitespace-pre-wrap min-h-[160px] border border-[#DDD2BF]">
            {submission.originalContent}
          </div>
        </div>

        <div className="bg-[#FDFBF7] rounded-2xl border border-[#E2D7C5] shadow-parchment p-5 sm:p-6 space-y-3">
          <div className="flex items-center justify-between pb-2.5 border-b border-[#EDE6D8]">
            <span className="text-xs font-bold uppercase tracking-widest text-forest-800 font-mono">
              Current / Revised Content (v{submission.version})
            </span>
            <span className="text-[11px] text-espresso-600 font-mono">
              {submission.currentContent.length} chars
            </span>
          </div>
          <div className="p-4 rounded-xl bg-[#E5EFEA]/60 border border-forest-300 text-xs text-espresso-950 leading-relaxed font-mono whitespace-pre-wrap min-h-[160px] font-medium">
            {submission.currentContent}
          </div>
        </div>
      </div>

      {/* AI Findings Summary */}
      {analysis && (
        <div className="bg-[#FDFBF7] rounded-2xl border border-[#E2D7C5] shadow-parchment p-6 sm:p-7 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#EDE6D8]">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-brass-700" />
              <h3 className="text-xs font-bold uppercase tracking-widest text-espresso-950 font-serif">
                AI Brand Governance Audit Summary ({analysis.findings.length} findings)
              </h3>
            </div>
            <Link
              to={`/submissions/${submission._id}/analysis`}
              className="text-xs font-semibold text-forest-800 hover:text-forest-900 transition font-mono underline underline-offset-2"
            >
              Open Full Analysis Deck &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {analysis.findings.map((f, i) => (
              <div key={i} className="p-4 rounded-xl bg-[#FAF7F0] border border-[#DDD2BF] text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-espresso-950 font-serif">{f.category}</span>
                  <SeverityBadge severity={f.severity} />
                </div>
                <div className="text-espresso-900 font-mono text-[11px] bg-[#FDFBF7] p-2.5 rounded border border-[#DDD2BF]">
                  "{f.originalText}"
                </div>
                <p className="text-espresso-700 leading-relaxed">{f.explanation}</p>
                <div className="text-[11px] text-forest-800 font-semibold font-mono">
                  Suggested: "{f.suggestedCorrection}"
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Review Decision & Publishing Pipeline Dispatch Form */}
      <div className="bg-[#FDFBF7] rounded-2xl border border-[#E2D7C5] shadow-parchment p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-[#EDE6D8]">
          <div>
            <h3 className="text-lg font-bold font-serif text-espresso-950 tracking-tight">
              Official Brand Review Decision &amp; Release Pipeline
            </h3>
            <p className="text-xs text-espresso-700 mt-0.5">
              Authoritative human sign-off gate prior to external campaign dispatch
            </p>
          </div>
          <span className="text-[10px] font-bold uppercase px-3 py-1 rounded bg-[#E5EFEA] text-forest-900 border border-forest-300 font-mono">
            Human Gate Active
          </span>
        </div>

        {/* Publishing Channel Selector */}
        <div className="p-5 rounded-xl bg-[#F5EFE4] border border-[#DDD2BF] space-y-3.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-espresso-800 uppercase tracking-widest flex items-center gap-1.5 font-mono">
              <Globe className="w-3.5 h-3.5 text-brass-700" />
              <span>Target Publication Channel (Triggered Upon Approval)</span>
            </label>

            <button
              type="button"
              onClick={handlePreviewPayload}
              disabled={isPreviewLoading}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-forest-800 hover:text-forest-900 transition font-mono"
            >
              <Code2 className="w-3.5 h-3.5 text-brass-700" />
              <span>{isPreviewLoading ? 'Generating...' : 'Preview JSON Payload'}</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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
                className={`p-3.5 rounded-lg border text-left transition-all ${
                  selectedChannel === ch.id
                    ? 'bg-[#E5EFEA] border-forest-700 ring-2 ring-forest-700/20 shadow-parchment-sm'
                    : 'bg-[#FAF7F0] border-[#DDD2BF] hover:border-brass-600'
                }`}
              >
                <div className="text-xs font-bold font-serif text-espresso-950">{ch.name}</div>
                <div className="text-[10px] text-espresso-600 mt-0.5 font-sans">{ch.desc}</div>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-espresso-800 uppercase tracking-widest mb-1.5 font-mono text-[11px]">
            Audit Justification &amp; Review Notes (Required)
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
            className="w-full p-4 text-xs rounded-xl border border-[#DDD2BF] focus:outline-none focus:border-brass-600 focus:ring-1 focus:ring-brass-600/30 disabled:bg-[#EAE1D2] disabled:cursor-not-allowed leading-relaxed font-sans placeholder:text-espresso-400 font-normal bg-[#FAF7F0]"
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
            Request Alterations
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
            icon={<CheckCircle2 className="w-3.5 h-3.5 text-brass-400" />}
            onClick={() => handleDecision('approved')}
            disabled={isCreatorOfSubmission || isSubmitting || !comments.trim()}
            className="bg-forest-800 hover:bg-forest-900 active:bg-forest-950"
          >
            Approve &amp; Dispatch to {selectedChannel.toUpperCase()}
          </Button>
        </div>
      </div>

      {/* JSON Payload Preview Modal */}
      {isPreviewOpen && (
        <div className="fixed inset-0 z-50 bg-espresso-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#FAF7F0] rounded-2xl max-w-2xl w-full border border-[#DDD2BF] shadow-parchment-modal overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-5 border-b border-[#EDE6D8] flex items-center justify-between bg-[#F5EFE4]">
              <div className="flex items-center gap-2">
                <Code2 className="w-4 h-4 text-brass-700" />
                <h4 className="text-xs font-bold uppercase tracking-widest text-espresso-950 font-serif">
                  Publication Webhook Payload Preview
                </h4>
              </div>
              <button
                onClick={() => setIsPreviewOpen(false)}
                className="text-espresso-600 hover:text-espresso-950 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-3 font-mono text-[11px]">
              <div className="p-4 bg-espresso-950 text-forest-200 rounded-xl overflow-x-auto shadow-inner border border-espresso-800">
                <pre>{JSON.stringify(payloadPreview, null, 2)}</pre>
              </div>
              <p className="text-espresso-700 font-sans text-xs">
                This exact JSON payload is transmitted to the configured endpoint when the reviewer approves the content.
              </p>
            </div>

            <div className="p-4 border-t border-[#EDE6D8] flex justify-end bg-[#F5EFE4]">
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
