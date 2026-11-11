import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { submissionsApi } from '../api/submissions.api.ts';
import { ContentType, SubmissionFormat, VisualAsset } from '../types/index.ts';
import {
  FilePlus2,
  Sparkles,
  Send,
  AlertCircle,
  MessageSquare,
  Newspaper,
  Mail,
  Megaphone,
  ShoppingBag,
  Image as ImageIcon,
  FileText,
  UploadCloud,
  X,
  Layers,
  Palette,
  CheckCircle2,
} from 'lucide-react';

export const NewSubmissionPage: React.FC = () => {
  const [title, setTitle] = useState('');
  const [contentType, setContentType] = useState<ContentType>('social_media');
  const [submissionFormat, setSubmissionFormat] = useState<SubmissionFormat>('text');
  const [content, setContent] = useState('');
  const [visualAsset, setVisualAsset] = useState<VisualAsset | null>(null);

  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const docInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const contentTypes = [
    { id: 'social_media', label: 'Social Media Post', icon: MessageSquare, desc: 'Twitter/X, LinkedIn, Meta announcements' },
    { id: 'advertisement', label: 'Advertisement Copy', icon: Megaphone, desc: 'Paid search, display ads, landing page hooks' },
    { id: 'blog', label: 'Blog Article', icon: Newspaper, desc: 'Long-form editorial and technical articles' },
    { id: 'email', label: 'Customer Email', icon: Mail, desc: 'Newsletters, product updates, transactional copy' },
    { id: 'press_release', label: 'Press Release', icon: FilePlus2, desc: 'Corporate PR, funding or partner announcements' },
    { id: 'product_copy', label: 'Product Copy', icon: ShoppingBag, desc: 'Feature descriptions, release notes, documentation' },
  ];

  // Sample Creative SVG for 1-click evaluation
  const sampleNonCompliantSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="418" viewBox="0 0 800 418">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#0F172A" />
        <stop offset="100%" stop-color="#1E1B4B" />
      </linearGradient>
    </defs>
    <rect width="800" height="418" fill="url(#bg)" />
    <circle cx="90" cy="50" r="16" fill="#4F46E5" />
    <text x="116" y="56" fill="#FFFFFF" font-family="sans-serif" font-size="20" font-weight="bold">ApexFlow</text>
    <text x="80" y="150" fill="#FFFFFF" font-family="sans-serif" font-size="32" font-weight="800">New ApexFlow Tool Released!</text>
    <text x="80" y="200" fill="#94A3B8" font-family="sans-serif" font-size="18">100% Bug-free &amp; unlimited free access forever</text>
    <rect x="80" y="260" width="240" height="52" rx="12" fill="#FF1493" />
    <text x="115" y="293" fill="#FFFFFF" font-family="sans-serif" font-size="16" font-weight="bold">Claim Insane Deal &rarr;</text>
    <rect x="630" y="30" width="130" height="30" rx="6" fill="#FFFF00" />
    <text x="642" y="50" fill="#000000" font-family="sans-serif" font-size="12" font-weight="900">CHEAPEST EVER</text>
  </svg>`;

  const handleLoadViolationsSample = () => {
    setTitle('Q2 Product Launch Social Campaign Announcement');
    setContentType('social_media');
    setSubmissionFormat('multi_format');
    setContent(
      'Hey guys! We are super hyped to announce that the new ApexFlow tool is finally out! It is the cheapest and best in the world, guaranteed 100% bug-free with unlimited free access forever! Bruh, you gotta try this insane deal today.'
    );
    setVisualAsset({
      filename: 'ApexFlow_Promo_Banner_NonCompliant.svg',
      fileType: 'image/svg+xml',
      fileSize: 1024,
      dataUrl: `data:image/svg+xml;base64,${btoa(sampleNonCompliantSvg)}`,
      dimensions: { width: 800, height: 418 },
    });
  };

  const handleLoadCompliantSample = () => {
    setTitle('Enterprise Workflow Intelligence Launch Briefing');
    setContentType('press_release');
    setSubmissionFormat('text');
    setContent(
      'ApexFlow Technologies today announced Workflow Intelligence for the ApexFlow Platform. Designed for enterprise engineering leaders, ApexFlow processes up to 10,000 tasks per second with high reliability and cost-effective value.'
    );
    setVisualAsset(null);
  };

  // Image Upload Handler
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (PNG, JPG, SVG, WebP).');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('Image file exceeds the 10MB limit.');
      return;
    }

    setError(null);
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const img = new Image();
      img.onload = () => {
        if (img.width < 32 || img.height < 32) {
          setError(
            `Image dimensions (${img.width}×${img.height}px) do not meet the minimum requirement of 32×32 pixels.`
          );
          if (imageInputRef.current) imageInputRef.current.value = '';
          return;
        }
        setVisualAsset({
          filename: file.name,
          fileType: file.type,
          fileSize: file.size,
          dataUrl,
          dimensions: { width: img.width, height: img.height },
        });
        if (submissionFormat === 'text') {
          setSubmissionFormat('multi_format');
        }
      };
      img.onerror = () => {
        setError('Corrupted or invalid image file. Please upload a valid PNG, JPG, WebP, GIF, or SVG.');
        if (imageInputRef.current) imageInputRef.current.value = '';
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  // Document Draft Upload Handler (.pdf, .txt)
  const handleDocFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingDoc(true);
    setError(null);

    try {
      const res = await submissionsApi.uploadDraftDocument(file);
      setContent(res.extractedText);
      if (!title) {
        setTitle(file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '));
      }
      setSubmissionFormat(visualAsset ? 'multi_format' : 'document');
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to extract draft text from uploaded document.');
    } finally {
      setIsUploadingDoc(false);
      if (docInputRef.current) docInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const hasText = content.trim().length >= 5;
    const hasImage = Boolean(visualAsset && visualAsset.dataUrl);

    if (!hasText && !hasImage) {
      setError('Please provide written copy (at least 5 characters) or attach a visual creative asset.');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const res = await submissionsApi.createSubmission({
        title,
        contentType,
        submissionFormat,
        content: content.trim() || undefined,
        visualAsset: visualAsset || undefined,
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
      {/* Header with Quick Presets */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold mb-2">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>Multi-Format Brand Governance Gateway</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Submit Content for Governance Review
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Audit written copy, document drafts, and visual creative assets against approved guidelines and brand palettes.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleLoadViolationsSample}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 hover:bg-amber-100 text-xs font-semibold transition shadow-sm"
            title="Preloads a multi-format campaign containing intentional written violations and prohibited visual colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>Load Test Violations Campaign</span>
          </button>
          <button
            type="button"
            onClick={handleLoadCompliantSample}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 hover:bg-emerald-100 text-xs font-semibold transition"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Load Compliant Copy</span>
          </button>
        </div>
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
            Campaign / Creative Title
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Q2 Product Announcement or Enterprise Workflow Pilot Social Banner"
            className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        {/* Content Type Selector */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            Target Publication Channel
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

        {/* Format Selector Tabs */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            Submission Ingestion Mode
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {[
              { id: 'text', label: 'Written Copy', icon: FileText, desc: 'Paste or type marketing text' },
              { id: 'document', label: 'Draft Document', icon: UploadCloud, desc: 'Extract text from PDF or TXT' },
              { id: 'image', label: 'Visual Creative', icon: ImageIcon, desc: 'Image palette & logo check' },
              { id: 'multi_format', label: 'Multi-Format', icon: Layers, desc: 'Combined copy & visual creative' },
            ].map((f) => {
              const Icon = f.icon;
              const isSelected = submissionFormat === f.id;
              return (
                <button
                  type="button"
                  key={f.id}
                  onClick={() => setSubmissionFormat(f.id as SubmissionFormat)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 ring-2 ring-indigo-500/20 font-bold'
                      : 'border-slate-200 hover:border-slate-300 text-slate-600 bg-slate-50/50'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-0.5">
                    <Icon className={`w-4 h-4 ${isSelected ? 'text-indigo-600' : 'text-slate-400'}`} />
                    <span className="text-xs">{f.label}</span>
                  </div>
                  <p className="text-[10px] text-slate-400">{f.desc}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Document Draft Extraction Panel (if in document mode) */}
        {(submissionFormat === 'document' || submissionFormat === 'multi_format') && (
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-2">
                <UploadCloud className="w-4 h-4 text-indigo-600" />
                <span>Upload Draft File to Ingest Content (.pdf, .txt)</span>
              </span>
              <input
                ref={docInputRef}
                type="file"
                accept=".pdf,.txt"
                onChange={handleDocFileChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => docInputRef.current?.click()}
                disabled={isUploadingDoc}
                className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition"
              >
                {isUploadingDoc ? 'Extracting Text...' : 'Choose Document'}
              </button>
            </div>
            <p className="text-[11px] text-slate-500">
              The engine automatically extracts plain readable copy from your draft and places it in the editor below for governance review.
            </p>
          </div>
        )}

        {/* Content Body Editor (Shown unless visual-only) */}
        {submissionFormat !== 'image' && (
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Draft Copy Body
              </label>
              <div className="text-[11px] text-slate-400 font-mono">
                {wordCount} words • {charCount} / 25,000 chars
              </div>
            </div>
            <textarea
              rows={6}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Paste or write your marketing copy, tweet, email, or blog draft here to compare against brand guidelines..."
              className="w-full p-4 text-sm font-sans rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 leading-relaxed resize-y"
            />
          </div>
        )}

        {/* Visual Creative Attachment Panel (Shown for image or multi_format) */}
        {(submissionFormat === 'image' || submissionFormat === 'multi_format') && (
          <div className="space-y-3">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Visual Creative Asset (Multimodal AI Analysis)
            </label>

            {visualAsset ? (
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-center gap-4">
                <div className="w-36 h-24 rounded-lg bg-slate-900 border border-slate-300 flex items-center justify-center overflow-hidden flex-shrink-0">
                  <img
                    src={visualAsset.dataUrl}
                    alt={visualAsset.filename}
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="flex-1 space-y-1 text-center sm:text-left">
                  <div className="text-xs font-bold text-slate-900">{visualAsset.filename}</div>
                  <div className="text-[11px] text-slate-500">
                    {visualAsset.fileType} • {Math.round(visualAsset.fileSize / 1024)} KB
                    {visualAsset.dimensions?.width && ` • ${visualAsset.dimensions.width}×${visualAsset.dimensions.height}px`}
                  </div>
                  <div className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-semibold mt-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>Attached for Multimodal Brand Inspection</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setVisualAsset(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                  title="Remove visual asset"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div
                onClick={() => imageInputRef.current?.click()}
                className="p-8 rounded-2xl border-2 border-dashed border-slate-300 hover:border-indigo-500 bg-slate-50/50 hover:bg-indigo-50/30 text-center cursor-pointer transition space-y-2"
              >
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/svg+xml,image/webp"
                  onChange={handleImageFileChange}
                  className="hidden"
                />
                <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 mx-auto flex items-center justify-center">
                  <ImageIcon className="w-5 h-5" />
                </div>
                <div className="text-xs font-bold text-slate-800">
                  Click or drag visual creative here (.png, .jpg, .svg, .webp)
                </div>
                <p className="text-[11px] text-slate-500">
                  Gemini Multimodal AI will audit visible logos, color palette consistency, typography, and visual brand rules.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Submit Button */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Sparkles className="w-4 h-4 text-brand-500" />
            <span>Semantic RAG & Multimodal AI will audit this submission</span>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || (!content.trim() && !visualAsset)}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs transition shadow-sm disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Running Governance Audit...</span>
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
