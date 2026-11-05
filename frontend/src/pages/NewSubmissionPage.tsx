import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { submissionsApi } from '../api/submissions.api.ts';
import { ContentType } from '../types/index.ts';
import {
  FilePlus2,
  Sparkles,
  Send,
  AlertCircle,
  HelpCircle,
  MessageSquare,
  Newspaper,
  Mail,
  Megaphone,
  ShoppingBag,
  FileCode,
} from 'lucide-react';

export const NewSubmissionPage: React.FC = () => {
  const [title, setTitle] = useState('');
  const [contentType, setContentType] = useState<ContentType>('social_media');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const contentTypes = [
    { id: 'social_media', label: 'Social Media Post', icon: MessageSquare, desc: 'Twitter/X, LinkedIn, Meta announcements' },
    { id: 'advertisement', label: 'Advertisement Copy', icon: Megaphone, desc: 'Paid search, display ads, landing page hooks' },
    { id: 'blog', label: 'Blog Article', icon: Newspaper, desc: 'Long-form editorial and technical articles' },
    { id: 'email', label: 'Customer Email', icon: Mail, desc: 'Newsletters, product updates, transactional copy' },
    { id: 'press_release', label: 'Press Release', icon: FilePlus2, desc: 'Corporate PR, funding or partner announcements' },
    { id: 'product_copy', label: 'Product Copy', icon: ShoppingBag, desc: 'Feature descriptions, release notes, documentation' },
  ];

  const handleLoadSample = () => {
    setTitle('Q2 Product Launch Social Campaign Announcement');
    setContentType('social_media');
    setContent(
      'Hey guys! We are super hyped to announce that the new ApexFlow tool is finally out! It is the cheapest and best in the world, guaranteed 100% bug-free with unlimited free access forever! Bruh, you gotta try this insane deal today.'
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (content.trim().length < 5) {
      setError('Content must be at least 5 characters long.');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const res = await submissionsApi.createSubmission({
        title,
        contentType,
        content,
      });
      navigate(`/submissions/${res.submission._id}/analysis`);
    } catch (err: any) {
      setError(
        err.response?.data?.error ||
          err.message ||
          'Failed to submit content for analysis. Please check your network and Gemini API configuration.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const charCount = content.length;
  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Submit Content for Brand Governance
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Compare draft copy against approved guidelines, tone boundaries, prohibited words, and verified facts.
          </p>
        </div>

        <button
          type="button"
          onClick={handleLoadSample}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 hover:bg-amber-100 text-xs font-semibold transition"
          title="Fills the form with a sample draft that intentionally triggers multiple brand violations"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
          <span>Load Test Violations Draft</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Submission Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
        {/* Title */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Content Campaign Title
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Q2 Product Announcement or Enterprise Workflow Pilot Email"
            className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        {/* Content Type Selector */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            Target Publication Format
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {contentTypes.map((t) => {
              const Icon = t.icon;
              const isSelected = contentType === t.id;
              return (
                <button
                  type="button"
                  key={t.id}
                  onClick={() => setContentType(t.id as ContentType)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    isSelected
                      ? 'border-brand-600 bg-brand-50/70 text-brand-900 ring-2 ring-brand-500/20 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className={`w-4 h-4 ${isSelected ? 'text-brand-600' : 'text-slate-400'}`} />
                    <span className="text-xs font-bold">{t.label}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-1">{t.desc}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content Body Editor */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Draft Content Copy
            </label>
            <div className="text-[11px] text-slate-400 font-mono">
              {wordCount} words • {charCount} / 25,000 chars
            </div>
          </div>
          <textarea
            required
            rows={8}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Paste or write your marketing copy, tweet, email, or blog draft here to compare against brand guidelines..."
            className="w-full p-4 text-sm font-sans rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 leading-relaxed resize-y"
          />
        </div>

        {/* Submit Button */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Sparkles className="w-4 h-4 text-brand-500" />
            <span>Semantic RAG retrieval will cite specific guideline sections</span>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !content.trim()}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs transition shadow-sm disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Running RAG Governance Audit...</span>
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>Submit & Run AI Analysis</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
