import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { submissionsApi } from '../api/submissions.api.ts';
import { ContentType, SubmissionFormat, VisualAsset } from '../types/index.ts';
import { Button } from '../components/common/Button.tsx';
import {
  FilePlus2,
  Sparkles,
  AlertCircle,
  MessageSquare,
  Newspaper,
  Mail,
  Megaphone,
  ShoppingBag,
  Image as ImageIcon,
  FileText,
  X,
  CheckCircle2,
  Compass,
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
    { id: 'social_media', label: 'Social Media', icon: MessageSquare, desc: 'Twitter/X, LinkedIn, Instagram copy' },
    { id: 'advertisement', label: 'Advertisement', icon: Megaphone, desc: 'Paid display ads, search hooks, banners' },
    { id: 'blog', label: 'Editorial Article', icon: Newspaper, desc: 'Long-form thought leadership and briefings' },
    { id: 'email', label: 'Client Correspondence', icon: Mail, desc: 'Investor briefs, newsletters, announcements' },
    { id: 'press_release', label: 'Press Release', icon: FilePlus2, desc: 'Official corporate communications & statements' },
    { id: 'product_copy', label: 'Product Narrative', icon: ShoppingBag, desc: 'Packaging, feature briefs, catalog copy' },
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

  // Image Upload Handler with 32x32 Dimension Validation
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
          'Failed to submit content for analysis. Please check your network and AI configuration.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Studio Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#E2D7C5]">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F5EFE4] text-forest-900 text-[11px] font-bold uppercase tracking-widest font-mono border border-[#DDD2BF]">
            <Compass className="w-3.5 h-3.5 text-brass-700" />
            <span>AI Content Studio</span>
          </div>
          <h1 className="text-3xl font-bold font-serif text-espresso-950 tracking-tight">
            New Content Submission
          </h1>
          <p className="text-xs sm:text-sm text-espresso-700">
            Submit campaign copy or visual creative assets for real-time automated brand compliance auditing.
          </p>
        </div>

        {/* 1-Click Evaluator Presets */}
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={handleLoadViolationsSample}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-oxblood-100 hover:bg-oxblood-200 text-oxblood-900 border border-oxblood-300 text-xs font-semibold transition shadow-parchment-sm"
            title="Load sample copy with intentional brand rule violations"
          >
            <AlertCircle className="w-3.5 h-3.5 text-oxblood-700" />
            <span>Load Violation Case</span>
          </button>
          <button
            type="button"
            onClick={handleLoadCompliantSample}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-forest-100 hover:bg-forest-200 text-forest-900 border border-forest-300 text-xs font-semibold transition shadow-parchment-sm"
            title="Load enterprise compliant copy sample"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-forest-800" />
            <span>Load Compliant Case</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-oxblood-50 border border-oxblood-200 text-xs text-oxblood-900 flex items-start gap-2.5 shadow-parchment-sm">
          <AlertCircle className="w-4 h-4 text-oxblood-700 flex-shrink-0 mt-0.5" />
          <span className="font-medium leading-relaxed">{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step 1: Content Type & Title */}
        <div className="bg-[#FDFBF7] p-6 sm:p-8 rounded-2xl border border-[#E2D7C5] shadow-parchment space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-[#EDE6D8]">
            <div>
              <h2 className="text-base font-bold font-serif text-espresso-950 tracking-tight">
                1. Campaign Context &amp; Channel Destination
              </h2>
              <p className="text-xs text-espresso-700 mt-0.5">
                Categorize your outbound copy to apply channel-specific brand rules
              </p>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded bg-[#F5EFE4] text-espresso-800 font-mono border border-[#DDD2BF]">
              Step 1 of 3
            </span>
          </div>

          <div>
            <label className="block text-xs font-bold text-espresso-800 uppercase tracking-widest mb-1.5 font-mono text-[11px]">
              Campaign Title / Asset Descriptor
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Autumn Equinox Global Capsule Campaign"
              className="atelier-input"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-espresso-800 uppercase tracking-widest mb-2 font-mono text-[11px]">
              Publishing Channel &amp; Format
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {contentTypes.map((t) => {
                const Icon = t.icon;
                const isSelected = contentType === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setContentType(t.id as ContentType)}
                    className={`p-4 rounded-xl border text-left transition-all duration-150 flex flex-col justify-between ${
                      isSelected
                        ? 'border-forest-800 bg-[#E5EFEA] ring-2 ring-forest-800/20 shadow-parchment-sm'
                        : 'border-[#DDD2BF] bg-[#FAF7F0] hover:border-brass-600 hover:bg-[#F5EFE4]'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-2">
                      <Icon className={`w-4 h-4 ${isSelected ? 'text-forest-800' : 'text-brass-700'}`} />
                      {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-forest-800" />}
                    </div>
                    <div>
                      <div className={`text-xs font-bold tracking-tight ${isSelected ? 'text-forest-950 font-serif' : 'text-espresso-900 font-serif'}`}>
                        {t.label}
                      </div>
                      <div className="text-[10px] text-espresso-600 mt-0.5 line-clamp-1 font-sans">
                        {t.desc}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Step 2: Content Copy & Document Upload */}
        <div className="bg-[#FDFBF7] p-6 sm:p-8 rounded-2xl border border-[#E2D7C5] shadow-parchment space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-[#EDE6D8]">
            <div>
              <h2 className="text-base font-bold font-serif text-espresso-950 tracking-tight">
                2. Manuscript &amp; Marketing Copy
              </h2>
              <p className="text-xs text-espresso-700 mt-0.5">
                Type your draft directly or extract text from an approved brief document
              </p>
            </div>
            <div className="flex items-center gap-2">
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
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#DDD2BF] bg-[#FAF7F0] hover:bg-[#F5EFE4] text-xs font-semibold text-espresso-800 transition"
              >
                <FileText className="w-3.5 h-3.5 text-brass-700" />
                <span>{isUploadingDoc ? 'Extracting Text...' : 'Extract from PDF / TXT'}</span>
              </button>
            </div>
          </div>

          <div>
            <textarea
              rows={6}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Paste or compose your campaign copy here for brand compliance auditing..."
              className="w-full p-4 text-sm rounded-xl border border-[#DDD2BF] focus:outline-none focus:border-brass-600 focus:ring-1 focus:ring-brass-600/30 bg-[#FAF7F0] text-espresso-950 font-sans placeholder:text-espresso-400 leading-relaxed font-normal"
            />
            <div className="flex items-center justify-between mt-1.5 text-[11px] text-espresso-600 font-mono">
              <span>Audited against tone guidelines, prohibited terms, and factual claims</span>
              <span>{content.length} / 25,000 chars</span>
            </div>
          </div>
        </div>

        {/* Step 3: Multimodal Creative Visual Asset Upload */}
        <div className="bg-[#FDFBF7] p-6 sm:p-8 rounded-2xl border border-[#E2D7C5] shadow-parchment space-y-4">
          <div className="flex items-center justify-between pb-4 border-b border-[#EDE6D8]">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold font-serif text-espresso-950 tracking-tight">
                  3. Creative Visual Asset
                </h2>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-brass-100 text-brass-900 border border-brass-300 font-mono">
                  Vision Audit
                </span>
              </div>
              <p className="text-xs text-espresso-700 mt-0.5">
                Attach banner, packaging artwork, or social creative for color palette, logo clearspace, and typography inspection
              </p>
            </div>
            {visualAsset && (
              <button
                type="button"
                onClick={() => setVisualAsset(null)}
                className="text-xs text-oxblood-800 hover:text-oxblood-900 font-semibold flex items-center gap-1 font-mono"
              >
                <X className="w-3.5 h-3.5" />
                <span>Remove</span>
              </button>
            )}
          </div>

          {visualAsset ? (
            <div className="p-4 rounded-xl border border-[#DDD2BF] bg-[#F5EFE4] flex flex-col sm:flex-row items-center gap-4">
              <div className="w-32 h-24 rounded-lg overflow-hidden bg-espresso-950 border border-[#DDD2BF] flex items-center justify-center flex-shrink-0 shadow-parchment-sm">
                <img
                  src={visualAsset.dataUrl}
                  alt={visualAsset.filename}
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="flex-1 space-y-1.5 text-center sm:text-left">
                <div className="text-xs font-bold font-serif text-espresso-950 tracking-tight">
                  {visualAsset.filename}
                </div>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-[11px] text-espresso-700 font-mono">
                  <span className="bg-[#FAF7F0] px-2 py-0.5 rounded border border-[#DDD2BF]">
                    {visualAsset.fileType}
                  </span>
                  <span className="bg-[#FAF7F0] px-2 py-0.5 rounded border border-[#DDD2BF]">
                    {(visualAsset.fileSize / 1024).toFixed(1)} KB
                  </span>
                  {visualAsset.dimensions && (
                    <span className="bg-[#FAF7F0] px-2 py-0.5 rounded border border-[#DDD2BF] font-semibold text-espresso-950">
                      {visualAsset.dimensions.width}×{visualAsset.dimensions.height}px
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-forest-900 flex items-center justify-center sm:justify-start gap-1 font-semibold font-mono">
                  <CheckCircle2 className="w-3.5 h-3.5 text-forest-800" />
                  <span>Valid creative asset resolution (≥ 32×32px)</span>
                </div>
              </div>
            </div>
          ) : (
            <div
              onClick={() => imageInputRef.current?.click()}
              className="border-2 border-dashed border-[#DDD2BF] hover:border-brass-600 hover:bg-[#F5EFE4]/50 rounded-xl p-8 text-center cursor-pointer transition-all duration-150 group"
            >
              <input
                ref={imageInputRef}
                type="file"
                accept="image/png,image/jpeg,image/svg+xml,image/webp"
                onChange={handleImageFileChange}
                className="hidden"
              />
              <div className="w-12 h-12 rounded-xl bg-[#F5EFE4] border border-[#DDD2BF] text-brass-700 mx-auto flex items-center justify-center group-hover:scale-105 transition-transform">
                <ImageIcon className="w-6 h-6" />
              </div>
              <div className="mt-3 text-xs font-bold text-espresso-950 font-serif">
                Upload creative artwork or campaign visual
              </div>
              <p className="text-[11px] text-espresso-600 mt-1">
                PNG, JPG, SVG, WebP up to 10MB (Minimum 32×32 pixels required for Groq Vision)
              </p>
            </div>
          )}
        </div>

        {/* Action Row */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isSubmitting}
            icon={<Sparkles className="w-4 h-4 text-brass-400" />}
            className="w-full sm:w-auto min-w-[240px]"
          >
            {isSubmitting ? 'Auditing Content...' : 'Run Brand Governance Audit'}
          </Button>
        </div>
      </form>
    </div>
  );
};
