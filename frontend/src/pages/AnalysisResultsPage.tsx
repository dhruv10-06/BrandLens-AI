import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { submissionsApi } from '../api/submissions.api.ts';
import { ContentSubmission, AnalysisReport, Finding, FindingSeverity, VisualFinding } from '../types/index.ts';
import { ScoreGauge } from '../components/common/ScoreGauge.tsx';
import { StatusBadge, SeverityBadge } from '../components/common/Badge.tsx';
import { FindingCard } from '../components/analysis/FindingCard.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import {
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Send,
  Save,
  ArrowLeft,
  FileCheck,
  Sparkles,
  History,
  ShieldCheck,
  ChevronRight,
  Palette,
  Image as ImageIcon,
  Type,
  Maximize2,
  Sliders,
  Layers,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';

export const AnalysisResultsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
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
        reason: 'Manual edits or applied suggestions in brand editor',
      });
      setSubmission(res.submission);
      setActionMessage({ type: 'success', text: 'Draft revisions saved successfully.' });
    } catch (err: any) {
      setActionMessage({
        type: 'error',
        text: err.response?.data?.error || 'Failed to save revised content.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Re-run RAG and Visual analysis on revised content
  const handleReanalyze = async () => {
    if (!id) return;
    setIsReanalyzing(true);
    setActionMessage(null);
    try {
      // First save current content
      await submissionsApi.updateContent(id, {
        content: editableContent,
        reason: 'Pre-reanalysis content update',
      });
      // Then trigger reanalysis
      const res = await submissionsApi.reanalyzeSubmission(id);
      setSubmission(res.submission);
      setAnalysis(res.analysis);
      setAppliedCorrections([]);
      setActionMessage({
        type: 'success',
        text: 'Re-analysis complete! Brand compliance score, text findings, and visual metrics have been updated.',
      });
    } catch (err: any) {
      setActionMessage({
        type: 'error',
        text: err.response?.data?.error || 'Re-analysis failed.',
      });
    } finally {
      setIsReanalyzing(false);
    }
  };

  // Submit to Review Queue
  const handleSubmitForReview = async () => {
    if (!id) return;
    setIsSubmittingReview(true);
    setActionMessage(null);
    try {
      const res = await submissionsApi.submitForReview(id);
      setSubmission(res.submission);
      setActionMessage({
        type: 'success',
        text: 'Content submitted to the Brand Review Queue for human reviewer sign-off!',
      });
    } catch (err: any) {
      setActionMessage({
        type: 'error',
        text: err.response?.data?.error || 'Failed to submit for review.',
      });
    } finally {
      setIsSubmittingReview(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-12 text-center text-xs text-slate-400 space-y-3">
        <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p>Loading brand governance findings...</p>
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="p-8 text-center text-sm text-slate-500">
        Submission not found.
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
      {/* Back and Reviewer Action Bridge */}
      <div className="flex items-center justify-between">
        <Link
          to="/submissions"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Submissions</span>
        </Link>

        {isReviewerRole && !isCreatorOfSubmission && (
          <Link
            to={`/review/${submission._id}`}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Open Reviewer Sign-Off Deck</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>

      {actionMessage && (
        <div
          className={`p-4 rounded-xl border text-xs flex items-center justify-between gap-3 ${
            actionMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          <span>{actionMessage.text}</span>
          <button
            onClick={() => setActionMessage(null)}
            className="text-xs font-bold underline ml-2"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Overview Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                {submission.contentType.replace('_', ' ')}
              </span>
              <StatusBadge status={submission.status} />
              {submission.submissionFormat && (
                <span className="text-[11px] font-bold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                  {submission.submissionFormat}
                </span>
              )}
              <span className="text-xs text-slate-400">• Version {submission.version}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              {submission.title}
            </h1>
            <p className="text-xs text-slate-500 leading-relaxed">
              {analysis?.summary || 'Draft saved. Click "Re-Analyze Revised Copy" above to run brand compliance checks.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            {analysis && (
              <ScoreGauge score={analysis.overallComplianceScore} size="md" />
            )}
            {visualAnalysis && (
              <div className="p-3 rounded-2xl bg-purple-50 border border-purple-100 text-center">
                <div className="text-[10px] font-bold uppercase tracking-wider text-purple-600">Visual Score</div>
                <div className="text-2xl font-extrabold text-purple-900 mt-0.5">
                  {visualAnalysis.overallVisualScore}%
                </div>
                <div className="text-[10px] text-purple-700 font-medium">Multimodal Audit</div>
              </div>
            )}
          </div>
        </div>

        {/* Severity Metrics Strip */}
        <div className="mt-6 pt-5 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 rounded-xl bg-red-50/50 border border-red-100 flex items-center justify-between">
            <span className="text-xs font-bold text-red-800">Critical Issues</span>
            <span className="text-base font-extrabold text-red-700">{severityCounts.Critical}</span>
          </div>
          <div className="p-3 rounded-xl bg-orange-50/50 border border-orange-100 flex items-center justify-between">
            <span className="text-xs font-bold text-orange-800">High Severity</span>
            <span className="text-base font-extrabold text-orange-700">{severityCounts.High}</span>
          </div>
          <div className="p-3 rounded-xl bg-amber-50/50 border border-amber-100 flex items-center justify-between">
            <span className="text-xs font-bold text-amber-800">Medium Severity</span>
            <span className="text-base font-extrabold text-amber-700">{severityCounts.Medium}</span>
          </div>
          <div className="p-3 rounded-xl bg-blue-50/50 border border-blue-100 flex items-center justify-between">
            <span className="text-xs font-bold text-blue-800">Low / Minor</span>
            <span className="text-base font-extrabold text-blue-700">{severityCounts.Low}</span>
          </div>
        </div>
      </div>

      {/* Main Split Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Interactive Workspace & Creative Asset Preview */}
        <div className="lg:col-span-6 space-y-4">
          {/* Visual Creative Showcase Card (if attached) */}
          {submission.visualAsset && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-purple-600" />
                  <span className="text-xs font-bold text-slate-900">Uploaded Visual Creative</span>
                </div>
                <span className="text-[11px] text-slate-400 font-mono">
                  {submission.visualAsset.filename}
                </span>
              </div>

              <div className="rounded-xl overflow-hidden bg-slate-950 border border-slate-200 flex items-center justify-center p-2">
                <img
                  src={submission.visualAsset.dataUrl}
                  alt={submission.visualAsset.filename}
                  className="max-h-72 w-full object-contain rounded"
                />
              </div>

              {visualAnalysis && (
                <div className="pt-2 grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="p-2 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Logo Check</span>
                    <span className={`text-xs font-extrabold ${
                      visualAnalysis.logoAnalysis.complianceStatus === 'compliant' ? 'text-emerald-700' : 'text-red-700'
                    }`}>
                      {visualAnalysis.logoAnalysis.complianceStatus.toUpperCase()}
                    </span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Colors Found</span>
                    <span className="text-xs font-extrabold text-slate-800">
                      {visualAnalysis.detectedColors.length} Swatches
                    </span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Legibility</span>
                    <span className="text-xs font-extrabold text-indigo-700">
                      {visualAnalysis.typographyAnalysis.readabilityScore || 90}/100
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Copy Editor (Shown if there is written content) */}
          {submission.currentContent && submission.submissionFormat !== 'image' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Copy Revision Workspace</h3>
                  <p className="text-[11px] text-slate-400">
                    Click 'Apply Correction' or edit manually, then re-analyze copy.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleSaveEdits}
                  disabled={isSaving}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSaving ? 'Saving...' : 'Save Draft'}</span>
                </button>
              </div>

              <textarea
                rows={10}
                value={editableContent}
                onChange={(e) => setEditableContent(e.target.value)}
                className="w-full p-4 text-xs font-sans rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 leading-relaxed font-mono resize-y"
              />

              {/* Actions Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleReanalyze}
                  disabled={isReanalyzing}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition shadow-sm disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isReanalyzing ? 'animate-spin' : ''}`} />
                  <span>{isReanalyzing ? 'Re-analyzing...' : 'Re-Analyze Revised Copy'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleSubmitForReview}
                  disabled={isSubmittingReview || submission.status === 'approved'}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs transition shadow-sm disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit to Review Queue</span>
                </button>
              </div>
            </div>
          )}

          {/* Original Content Reference Accordion */}
          <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 text-xs">
            <div className="font-bold text-slate-700 mb-1">Original Submission Reference:</div>
            <p className="text-slate-500 italic line-clamp-3">"{submission.originalContent}"</p>
          </div>
        </div>

        {/* Right Column: AI Findings Cards & Visual Diagnostics */}
        <div className="lg:col-span-6 space-y-4">
          {/* Tab Switcher between Written Findings and Visual Diagnostics */}
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('copy')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                  activeTab === 'copy'
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span>Copy Findings ({findings.length})</span>
              </button>

              {hasVisual && (
                <button
                  type="button"
                  onClick={() => setActiveTab('visual')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                    activeTab === 'visual'
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Palette className="w-3.5 h-3.5" />
                  <span>Visual Compliance ({visualFindings.length})</span>
                </button>
              )}
            </div>

            {/* Severity Filter Pills */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-[11px] font-semibold">
              {(['All', 'Critical', 'High', 'Medium', 'Low'] as const).map((sev) => (
                <button
                  key={sev}
                  type="button"
                  onClick={() => setSeverityFilter(sev)}
                  className={`px-2 py-0.5 rounded transition ${
                    severityFilter === sev
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {sev}
                </button>
              ))}
            </div>
          </div>

          {/* TAB 1: Written Copy Findings */}
          {activeTab === 'copy' && (
            <div className="space-y-3">
              {!analysis ? (
                <div className="p-8 bg-white rounded-2xl border border-dashed border-slate-300 text-center space-y-2">
                  <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
                  <h4 className="text-sm font-bold text-slate-900">
                    No Analysis Report Generated Yet
                  </h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    This submission is currently saved as a draft. Click <strong>"Re-Analyze Revised Copy"</strong> in the workspace to evaluate brand governance compliance.
                  </p>
                </div>
              ) : filteredTextFindings.length === 0 ? (
                <div className="p-8 bg-white rounded-2xl border border-slate-200 text-center space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                  <h4 className="text-sm font-bold text-slate-900">
                    {severityFilter === 'All'
                      ? 'No written brand violations detected!'
                      : `No ${severityFilter} severity issues found.`}
                  </h4>
                  <p className="text-xs text-slate-400">
                    Draft text adheres cleanly to indexed guidelines, approved terminology, and verified facts.
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
              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Palette className="w-4 h-4 text-purple-600" />
                    <span>Detected Color Palette vs Brand Standard</span>
                  </span>
                  <span className="text-[11px] text-slate-400">Multimodal Swatch Inspection</span>
                </div>

                <div className="flex flex-wrap gap-2.5 pt-1">
                  {visualAnalysis.detectedColors.map((color, idx) => (
                    <div
                      key={idx}
                      className="p-2 rounded-xl border border-slate-200 bg-slate-50 flex items-center gap-2"
                    >
                      <div
                        className="w-6 h-6 rounded-lg border border-black/10 shadow-xs flex-shrink-0"
                        style={{ backgroundColor: color.hex }}
                      />
                      <div className="text-[11px] leading-tight">
                        <div className="font-mono font-bold text-slate-800">{color.hex}</div>
                        <div className="text-[10px] text-slate-500">
                          {color.isApprovedBrandColor ? (
                            <span className="text-emerald-700 font-semibold">Approved Brand Color</span>
                          ) : (
                            <span className="text-red-600 font-semibold">Unapproved Shade</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Logo Usage Card */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-indigo-600" />
                    <span>Logo Placement & Clear Space</span>
                  </span>
                  <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded ${
                    visualAnalysis.logoAnalysis.complianceStatus === 'compliant'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {visualAnalysis.logoAnalysis.complianceStatus}
                  </span>
                </div>
                <p className="text-xs text-slate-600">{visualAnalysis.logoAnalysis.details}</p>
              </div>

              {/* Typography Diagnostics */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Type className="w-4 h-4 text-blue-600" />
                    <span>Typography & Contrast Legibility</span>
                  </span>
                  <span className="text-xs font-extrabold text-indigo-600">
                    {visualAnalysis.typographyAnalysis.fontStyleDetected || 'Standard'}
                  </span>
                </div>
                <p className="text-xs text-slate-600">{visualAnalysis.typographyAnalysis.details}</p>
              </div>

              {/* Visual Findings List */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Visual Discrepancy Findings ({filteredVisualFindings.length})
                </h4>

                {filteredVisualFindings.length === 0 ? (
                  <div className="p-6 bg-white rounded-2xl border border-slate-200 text-center text-xs text-slate-400">
                    No visual violations detected. Creative conforms cleanly with brand palettes and typography!
                  </div>
                ) : (
                  filteredVisualFindings.map((vf, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-0.5">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">
                            {vf.category}
                          </span>
                          <h5 className="text-xs font-bold text-slate-900 mt-1">Element: {vf.element}</h5>
                        </div>
                        <SeverityBadge severity={vf.severity} />
                      </div>

                      <p className="text-xs text-slate-600 leading-relaxed">{vf.explanation}</p>

                      <div className="p-2.5 rounded-xl bg-purple-50/70 border border-purple-100 text-xs text-purple-900">
                        <span className="font-bold">Recommendation: </span>
                        <span>{vf.recommendation}</span>
                      </div>

                      <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-100">
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
