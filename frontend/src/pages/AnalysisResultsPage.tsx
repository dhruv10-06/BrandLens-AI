import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { submissionsApi } from '../api/submissions.api.ts';
import { ContentSubmission, AnalysisReport, FindingSeverity } from '../types/index.ts';
import { ScoreGauge } from '../components/common/ScoreGauge.tsx';
import { StatusBadge, SeverityBadge } from '../components/common/Badge.tsx';
import { FindingCard } from '../components/analysis/FindingCard.tsx';
import { Button } from '../components/common/Button.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import {
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Send,
  Save,
  ArrowLeft,
  ShieldCheck,
  ChevronRight,
  Palette,
  Image as ImageIcon,
  Type,
  AlertCircle,
} from 'lucide-react';

export const AnalysisResultsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  const [submission, setSubmission] = useState<ContentSubmission | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisReport | null>(null);
  const [editableContent, setEditableContent] = useState('');
  const [appliedCorrections, setAppliedCorrections] = useState<string[]>([]);
  const [severityFilter, setSeverityFilter] = useState<'All' | FindingSeverity>('All');
  const [activeTab, setActiveTab] = useState<'copy' | 'visual'>('copy');

  const [isLoading, setIsLoading] = useState(true);
  const [isReanalyzing, setIsReanalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchDetails = async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      const res = await submissionsApi.getSubmissionById(id);
      setSubmission(res.submission);
      setAnalysis(res.submission.latestAnalysisId || null);
      setEditableContent(res.submission.currentContent);
      if (res.submission.submissionFormat === 'image') {
        setActiveTab('visual');
      }
    } catch (err: any) {
      setActionMessage({
        type: 'error',
        text: err.response?.data?.error || 'Failed to load analysis results.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [id]);

  // Apply suggested correction to editable text
  const handleApplyCorrection = (correction: string, originalText: string) => {
    if (!editableContent.includes(originalText)) {
      alert(`Could not find the exact snippet "${originalText}" in the current content editor.`);
      return;
    }

    if (!window.confirm(`Replace flagged text "${originalText}" with approved suggestion "${correction}"?`)) {
      return;
    }

    const updated = editableContent.replace(originalText, correction);
    setEditableContent(updated);
    setAppliedCorrections((prev) => [...prev, originalText]);
    setActionMessage({
      type: 'success',
      text: `Applied correction: replaced "${originalText}" with "${correction}". Remember to save or re-analyze!`,
    });
  };

  // Save manual edits
  const handleSaveEdits = async () => {
    if (!id) return;
    setIsSaving(true);
    setActionMessage(null);
    try {
      const res = await submissionsApi.updateContent(id, {
        content: editableContent,
        reason: 'Creator manual revisions applied via governance workspace',
      });
      setSubmission(res.submission);
      setActionMessage({
        type: 'success',
        text: 'Changes saved to submission record. Click "Re-Analyze Revised Copy" to update governance scores.',
      });
    } catch (err: any) {
      setActionMessage({
        type: 'error',
        text: err.response?.data?.error || 'Failed to save revised content.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Trigger AI re-analysis on updated content
  const handleReanalyze = async () => {
    if (!id) return;
    setIsReanalyzing(true);
    setActionMessage(null);
    try {
      if (editableContent !== submission?.currentContent) {
        await submissionsApi.updateContent(id, {
          content: editableContent,
          reason: 'Auto-saved prior to re-analysis',
        });
      }

      const res = await submissionsApi.reanalyzeSubmission(id);
      setSubmission(res.submission);
      setAnalysis(res.analysis);
      setAppliedCorrections([]);
      setActionMessage({
        type: 'success',
        text: 'Re-analysis complete! Brand governance score and audit findings have been updated.',
      });
    } catch (err: any) {
      setActionMessage({
        type: 'error',
        text: err.response?.data?.error || 'Re-analysis failed. Please check network connectivity.',
      });
    } finally {
      setIsReanalyzing(false);
    }
  };

  // Submit to human review queue
  const handleSubmitForReview = async () => {
    if (!id) return;
    setIsSubmittingReview(true);
    setActionMessage(null);
    try {
      const res = await submissionsApi.submitForReview(id);
      setSubmission(res.submission);
      setActionMessage({
        type: 'success',
        text: 'Content submitted to the reviewer queue for formal human publication authorization.',
      });
    } catch (err: any) {
      setActionMessage({
        type: 'error',
        text: err.response?.data?.error || 'Failed to route submission for review.',
      });
    } finally {
      setIsSubmittingReview(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-graphite-500 gap-3">
        <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-bold tracking-wide text-graphite-600 font-mono">Retrieving Brand Governance Audit...</span>
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="p-8 rounded-2xl bg-white border border-[#EAE8E3] text-center max-w-md mx-auto my-12 shadow-card">
        <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
        <h3 className="text-sm font-bold text-graphite-900">Submission Not Found</h3>
        <p className="text-xs text-graphite-500 mt-1">This submission could not be retrieved from your workspace.</p>
        <Link to="/submissions" className="mt-4 inline-block">
          <Button variant="outline" size="sm">Back to Submissions</Button>
        </Link>
      </div>
    );
  }

  const findings = analysis?.findings || [];
  const visualAnalysis = analysis?.visualAnalysis;
  const visualFindings = visualAnalysis?.visualFindings || [];

  const severityCounts = {
    Critical: findings.filter((f) => f.severity === 'Critical').length + visualFindings.filter((f) => f.severity === 'Critical').length,
    High: findings.filter((f) => f.severity === 'High').length + visualFindings.filter((f) => f.severity === 'High').length,
    Medium: findings.filter((f) => f.severity === 'Medium').length + visualFindings.filter((f) => f.severity === 'Medium').length,
    Low: findings.filter((f) => f.severity === 'Low').length + visualFindings.filter((f) => f.severity === 'Low').length,
  };

  const filteredTextFindings =
    severityFilter === 'All'
      ? findings
      : findings.filter((f) => f.severity === severityFilter);

  const filteredVisualFindings =
    severityFilter === 'All'
      ? visualFindings
      : visualFindings.filter((f) => f.severity === severityFilter);

  const isCreatorOfSubmission = submission.creatorId?._id === user?.id;
  const isReviewerRole = user?.role === 'reviewer' || user?.role === 'admin';
  const hasVisual = Boolean(submission.visualAsset || visualAnalysis);

  return (
    <div className="space-y-6">
      {/* Top Navigation Bridge */}
      <div className="flex items-center justify-between">
        <Link
          to="/submissions"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-graphite-500 hover:text-graphite-900 transition-colors font-mono"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Submissions</span>
        </Link>

        {isReviewerRole && !isCreatorOfSubmission && (
          <Link to={`/review/${submission._id}`}>
            <Button variant="accent" size="sm" icon={<ShieldCheck className="w-3.5 h-3.5" />} iconRight={<ChevronRight className="w-3.5 h-3.5" />}>
              Open Reviewer Sign-Off Deck
            </Button>
          </Link>
        )}
      </div>

      {actionMessage && (
        <div
          className={`p-4 rounded-2xl border text-xs flex items-center justify-between gap-3 shadow-subtle ${
            actionMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <span className="font-semibold">{actionMessage.text}</span>
          <button
            onClick={() => setActionMessage(null)}
            className="text-xs font-bold underline ml-2 hover:opacity-80 transition font-mono"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Overview Card */}
      <div className="bg-white rounded-3xl border border-[#EAE8E3] shadow-card p-6 sm:p-7">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2.5 max-w-xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-graphite-500 bg-ivory-100 px-2.5 py-0.5 rounded-full border border-[#EAE8E3] font-mono">
                {submission.contentType.replace('_', ' ')}
              </span>
              <StatusBadge status={submission.status} />
              {submission.submissionFormat && (
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-lavender-50 text-brand-700 border border-lavender-200 font-mono">
                  {submission.submissionFormat}
                </span>
              )}
              <span className="text-xs text-graphite-400 font-mono">• Version {submission.version}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-graphite-900 tracking-tight">
              {submission.title}
            </h1>
            <p className="text-xs sm:text-sm text-graphite-600 leading-relaxed font-normal">
              {analysis?.summary || 'Draft saved. Click "Re-Analyze Revised Copy" below to run brand compliance checks.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            {analysis && (
              <ScoreGauge score={analysis.overallComplianceScore} size="md" />
            )}
            {visualAnalysis && (
              <div className="p-4 rounded-2xl bg-lavender-50/70 border border-lavender-200 text-center shadow-subtle min-w-[130px]">
                <div className="text-[10px] font-extrabold uppercase tracking-wider text-brand-700 font-mono">Visual Score</div>
                <div className="text-2xl font-extrabold font-mono text-brand-900 mt-0.5 tabular-nums">
                  {visualAnalysis.overallVisualScore}%
                </div>
                <div className="text-[10px] text-brand-700 font-bold font-mono">Multimodal Audit</div>
              </div>
            )}
          </div>
        </div>

        {/* Severity Metrics Strip */}
        <div className="mt-6 pt-5 border-t border-[#F2EFE8] grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-xl bg-rose-50/60 border border-rose-200/80 flex items-center justify-between">
            <span className="text-xs font-bold text-rose-800">Critical Issues</span>
            <span className="text-base font-extrabold font-mono text-rose-700 tabular-nums">{severityCounts.Critical}</span>
          </div>
          <div className="p-3.5 rounded-xl bg-orange-50/60 border border-orange-200/80 flex items-center justify-between">
            <span className="text-xs font-bold text-orange-800">High Severity</span>
            <span className="text-base font-extrabold font-mono text-orange-700 tabular-nums">{severityCounts.High}</span>
          </div>
          <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200/80 flex items-center justify-between">
            <span className="text-xs font-bold text-amber-800">Medium Severity</span>
            <span className="text-base font-extrabold font-mono text-amber-700 tabular-nums">{severityCounts.Medium}</span>
          </div>
          <div className="p-3.5 rounded-xl bg-sky-50/60 border border-sky-200/80 flex items-center justify-between">
            <span className="text-xs font-bold text-sky-800">Low / Minor</span>
            <span className="text-base font-extrabold font-mono text-sky-700 tabular-nums">{severityCounts.Low}</span>
          </div>
        </div>
      </div>

      {/* Main Split Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Interactive Workspace & Creative Asset Preview */}
        <div className="lg:col-span-6 space-y-5">
          {/* Visual Creative Showcase Card (if attached) */}
          {submission.visualAsset && (
            <div className="bg-white rounded-2xl border border-[#EAE8E3] shadow-card p-5 sm:p-6 space-y-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-brand-600" />
                  <span className="text-xs font-bold text-graphite-900 tracking-tight">Uploaded Visual Creative</span>
                </div>
                <span className="text-[11px] text-graphite-400 font-mono">
                  {submission.visualAsset.filename}
                </span>
              </div>

              <div className="rounded-xl overflow-hidden bg-graphite-950 border border-graphite-800 flex items-center justify-center p-2.5 shadow-subtle">
                <img
                  src={submission.visualAsset.dataUrl}
                  alt={submission.visualAsset.filename}
                  className="max-h-72 w-full object-contain rounded"
                />
              </div>

              {visualAnalysis && (
                <div className="pt-2 grid grid-cols-3 gap-2.5 text-center text-xs">
                  <div className="p-2.5 rounded-xl bg-ivory-50 border border-[#EAE8E3]">
                    <span className="text-[10px] text-graphite-400 uppercase font-bold block font-mono">Logo Check</span>
                    <span className={`text-xs font-extrabold uppercase font-mono ${
                      visualAnalysis.logoAnalysis.complianceStatus === 'compliant' ? 'text-emerald-700' : 'text-rose-700'
                    }`}>
                      {visualAnalysis.logoAnalysis.complianceStatus}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-ivory-50 border border-[#EAE8E3]">
                    <span className="text-[10px] text-graphite-400 uppercase font-bold block font-mono">Colors Found</span>
                    <span className="text-xs font-extrabold text-graphite-800 font-mono">
                      {visualAnalysis.detectedColors.length} Swatches
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-ivory-50 border border-[#EAE8E3]">
                    <span className="text-[10px] text-graphite-400 uppercase font-bold block font-mono">Legibility</span>
                    <span className="text-xs font-extrabold text-brand-700 font-mono tabular-nums">
                      {visualAnalysis.typographyAnalysis.readabilityScore || 90}/100
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Copy Revision Workspace (if written content exists) */}
          {submission.currentContent && submission.submissionFormat !== 'image' && (
            <div className="bg-white rounded-2xl border border-[#EAE8E3] shadow-card p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between pb-3.5 border-b border-[#F2EFE8]">
                <div>
                  <h3 className="text-sm font-bold text-graphite-900 tracking-tight">Copy Revision Workspace</h3>
                  <p className="text-[11px] text-graphite-400">
                    Apply automated suggestions or edit directly, then re-analyze copy
                  </p>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSaveEdits}
                  isLoading={isSaving}
                  icon={<Save className="w-3.5 h-3.5" />}
                >
                  Save Draft
                </Button>
              </div>

              <textarea
                rows={10}
                value={editableContent}
                onChange={(e) => setEditableContent(e.target.value)}
                className="w-full p-4 text-xs font-mono rounded-xl border border-[#EAE8E3] focus:outline-none focus:ring-2 focus:ring-brand-500 bg-[#FCFBF9] text-graphite-900 leading-relaxed resize-y font-medium"
              />

              {/* Actions Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <Button
                  variant="secondary"
                  size="md"
                  onClick={handleReanalyze}
                  isLoading={isReanalyzing}
                  icon={<RefreshCw className={`w-3.5 h-3.5 ${isReanalyzing ? 'animate-spin' : ''}`} />}
                >
                  Re-Analyze Revised Copy
                </Button>

                <Button
                  variant="primary"
                  size="md"
                  onClick={handleSubmitForReview}
                  isLoading={isSubmittingReview}
                  disabled={submission.status === 'approved'}
                  icon={<Send className="w-3.5 h-3.5" />}
                >
                  Submit to Review Queue
                </Button>
              </div>
            </div>
          )}

          {/* Original Content Reference Accordion */}
          <div className="bg-ivory-50/80 rounded-2xl border border-[#EAE8E3] p-4 text-xs">
            <div className="font-bold text-graphite-700 mb-1 font-mono text-[11px]">Original Submission Reference:</div>
            <p className="text-graphite-500 italic line-clamp-3 leading-relaxed">"{submission.originalContent}"</p>
          </div>
        </div>

        {/* Right Column: AI Findings Cards & Visual Diagnostics */}
        <div className="lg:col-span-6 space-y-4">
          {/* Tab Switcher between Written Findings and Visual Diagnostics */}
          <div className="flex items-center justify-between border-b border-[#EAE8E3] pb-2.5">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('copy')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'copy'
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'text-graphite-600 hover:bg-ivory-100'
                }`}
              >
                <span>Copy Findings ({findings.length})</span>
              </button>

              {hasVisual && (
                <button
                  type="button"
                  onClick={() => setActiveTab('visual')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    activeTab === 'visual'
                      ? 'bg-lavender-600 text-white shadow-sm'
                      : 'text-graphite-600 hover:bg-ivory-100'
                  }`}
                >
                  <Palette className="w-3.5 h-3.5" />
                  <span>Visual Compliance ({visualFindings.length})</span>
                </button>
              )}
            </div>

            {/* Severity Filter Pills */}
            <div className="flex items-center gap-1 bg-ivory-100 p-1 rounded-xl text-[11px] font-semibold border border-[#EAE8E3]">
              {(['All', 'Critical', 'High', 'Medium', 'Low'] as const).map((sev) => (
                <button
                  key={sev}
                  type="button"
                  onClick={() => setSeverityFilter(sev)}
                  className={`px-2.5 py-0.5 rounded-lg transition font-mono ${
                    severityFilter === sev
                      ? 'bg-white text-graphite-900 shadow-subtle font-bold'
                      : 'text-graphite-500 hover:text-graphite-800'
                  }`}
                >
                  {sev}
                </button>
              ))}
            </div>
          </div>

          {/* TAB 1: Written Copy Findings */}
          {activeTab === 'copy' && (
            <div className="space-y-3.5">
              {!analysis ? (
                <div className="p-8 bg-white rounded-2xl border border-dashed border-[#DDD5C2] text-center space-y-2">
                  <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
                  <h4 className="text-sm font-bold text-graphite-900">
                    No Analysis Report Generated Yet
                  </h4>
                  <p className="text-xs text-graphite-500 max-w-sm mx-auto leading-relaxed">
                    This submission is currently saved as a draft. Click <strong>"Re-Analyze Revised Copy"</strong> in the workspace to evaluate brand governance compliance.
                  </p>
                </div>
              ) : filteredTextFindings.length === 0 ? (
                <div className="p-8 bg-white rounded-2xl border border-[#EAE8E3] text-center space-y-2 shadow-card">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                  <h4 className="text-sm font-bold text-graphite-900">
                    {severityFilter === 'All'
                      ? 'No written brand violations detected!'
                      : `No ${severityFilter} severity issues found.`}
                  </h4>
                  <p className="text-xs text-graphite-400">
                    Draft text adheres cleanly to indexed guidelines, approved terminology, and verified brand facts.
                  </p>
                </div>
              ) : (
                filteredTextFindings.map((finding, idx) => (
                  <FindingCard
                    key={idx}
                    finding={finding}
                    onApplyCorrection={handleApplyCorrection}
                    isApplied={appliedCorrections.includes(finding.originalText)}
                  />
                ))
              )}
            </div>
          )}

          {/* TAB 2: Visual Compliance Engine Diagnostics */}
          {activeTab === 'visual' && visualAnalysis && (
            <div className="space-y-4">
              {/* Palette & Swatches Analysis Card */}
              <div className="p-5 sm:p-6 rounded-2xl bg-white border border-[#EAE8E3] shadow-card space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-graphite-900 flex items-center gap-1.5">
                    <Palette className="w-4 h-4 text-brand-600" />
                    <span>Detected Color Palette vs Brand Standard</span>
                  </span>
                  <span className="text-[11px] text-graphite-400 font-mono">Multimodal Swatch Inspection</span>
                </div>

                <div className="flex flex-wrap gap-2.5 pt-1">
                  {visualAnalysis.detectedColors.map((color, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl border border-[#EAE8E3] bg-[#FAF8F5] flex items-center gap-2.5 shadow-subtle"
                    >
                      <div
                        className="w-6 h-6 rounded-lg border border-black/10 shadow-subtle flex-shrink-0"
                        style={{ backgroundColor: color.hex }}
                      />
                      <div className="text-[11px] leading-tight">
                        <div className="font-mono font-bold text-graphite-900">{color.hex}</div>
                        <div className="text-[10px] mt-0.5">
                          {color.isApprovedBrandColor ? (
                            <span className="text-emerald-700 font-bold font-mono">Approved Brand Color</span>
                          ) : (
                            <span className="text-rose-600 font-bold font-mono">Unapproved Shade</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Logo Usage Card */}
              <div className="p-5 sm:p-6 rounded-2xl bg-white border border-[#EAE8E3] shadow-card space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-graphite-900 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-brand-600" />
                    <span>Logo Placement &amp; Clear Space</span>
                  </span>
                  <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full font-mono ${
                    visualAnalysis.logoAnalysis.complianceStatus === 'compliant'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}>
                    {visualAnalysis.logoAnalysis.complianceStatus}
                  </span>
                </div>
                <p className="text-xs text-graphite-600 leading-relaxed">{visualAnalysis.logoAnalysis.details}</p>
              </div>

              {/* Typography Diagnostics */}
              <div className="p-5 sm:p-6 rounded-2xl bg-white border border-[#EAE8E3] shadow-card space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-graphite-900 flex items-center gap-1.5">
                    <Type className="w-4 h-4 text-brand-600" />
                    <span>Typography &amp; Contrast Legibility</span>
                  </span>
                  <span className="text-xs font-extrabold text-brand-600 font-mono">
                    {visualAnalysis.typographyAnalysis.fontStyleDetected || 'Standard'}
                  </span>
                </div>
                <p className="text-xs text-graphite-600 leading-relaxed">{visualAnalysis.typographyAnalysis.details}</p>
              </div>

              {/* Visual Findings List */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold text-graphite-700 uppercase tracking-wider font-mono">
                  Visual Discrepancy Findings ({filteredVisualFindings.length})
                </h4>

                {filteredVisualFindings.length === 0 ? (
                  <div className="p-6 bg-white rounded-2xl border border-[#EAE8E3] text-center text-xs text-graphite-400 shadow-card">
                    No visual violations detected. Creative conforms cleanly with brand palettes and typography!
                  </div>
                ) : (
                  filteredVisualFindings.map((vf, idx) => (
                    <div
                      key={idx}
                      className="p-5 rounded-2xl bg-white border border-[#EAE8E3] shadow-card space-y-2.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-0.5">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-lavender-50 text-brand-700 border border-lavender-200 font-mono">
                            {vf.category}
                          </span>
                          <h5 className="text-xs font-bold text-graphite-900 mt-1">Element: {vf.element}</h5>
                        </div>
                        <SeverityBadge severity={vf.severity} />
                      </div>

                      <p className="text-xs text-graphite-600 leading-relaxed">{vf.explanation}</p>

                      <div className="p-3.5 rounded-xl bg-lavender-50/70 border border-lavender-100 text-xs text-graphite-900 font-medium">
                        <span className="font-bold">Recommendation: </span>
                        <span>{vf.recommendation}</span>
                      </div>

                      <div className="text-[10px] text-graphite-400 pt-1 border-t border-[#F2EFE8] font-mono">
                        Evidence standard: {vf.supportingEvidence}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};