import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { submissionsApi } from '../api/submissions.api.ts';
import { ContentSubmission, AnalysisReport, Finding, FindingSeverity } from '../types/index.ts';
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

  // Re-run RAG analysis on the revised content
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
        text: 'Re-analysis complete! Brand compliance score and findings have been updated.',
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
  const severityCounts = {
    Critical: findings.filter((f) => f.severity === 'Critical').length,
    High: findings.filter((f) => f.severity === 'High').length,
    Medium: findings.filter((f) => f.severity === 'Medium').length,
    Low: findings.filter((f) => f.severity === 'Low').length,
  };

  const filteredFindings =
    severityFilter === 'All'
      ? findings
      : findings.filter((f) => f.severity === severityFilter);

  const isCreatorOfSubmission = submission.creatorId?._id === user?.id;
  const isReviewerRole = user?.role === 'reviewer' || user?.role === 'admin';

  return (
    <div className="space-y-6">
      {/* Back and Breadcrumbs */}
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
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition"
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
              <span className="text-xs text-slate-400">• Version {submission.version}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              {submission.title}
            </h1>
            <p className="text-xs text-slate-500 leading-relaxed">
              {analysis?.summary || 'Analysis completed against approved brand guidelines.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            {analysis && (
              <ScoreGauge score={analysis.overallComplianceScore} size="md" />
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
        {/* Left Column: Interactive Content Editor */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Content Revision Workspace</h3>
                <p className="text-[11px] text-slate-400">
                  Review findings, click 'Apply Correction', or edit manually, then re-analyze.
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
              rows={14}
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
                <span>{isReanalyzing ? 'Re-analyzing copy...' : 'Re-Analyze Revised Copy'}</span>
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

          {/* Original Content Reference Accordion */}
          <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 text-xs">
            <div className="font-bold text-slate-700 mb-1">Original Draft Submitted:</div>
            <p className="text-slate-500 italic line-clamp-3">"{submission.originalContent}"</p>
          </div>
        </div>

        {/* Right Column: AI Findings Cards */}
        <div className="lg:col-span-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">
              Audit Findings ({findings.length})
            </h3>

            {/* Severity Filter Pills */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-[11px] font-semibold">
              {(['All', 'Critical', 'High', 'Medium', 'Low'] as const).map((sev) => (
                <button
                  key={sev}
                  type="button"
                  onClick={() => setSeverityFilter(sev)}
                  className={`px-2 py-0.5 rounded transition ${
                    severityFilter === sev
                      ? 'bg-white text-slate-900 shadow-sm font-bold'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {sev}
                </button>
              ))}
            </div>
          </div>

          {filteredFindings.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
              <h4 className="text-sm font-bold text-slate-800">No issues in this category</h4>
              <p className="text-xs text-slate-400">
                Your content conforms with the inspected brand rules and facts.
              </p>
            </div>
          ) : (
            <div className="space-y-3.5">
              {filteredFindings.map((finding, idx) => (
                <FindingCard
                  key={idx}
                  finding={finding}
                  onApplyCorrection={handleApplyCorrection}
                  isApplied={appliedCorrections.includes(finding.originalText)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
