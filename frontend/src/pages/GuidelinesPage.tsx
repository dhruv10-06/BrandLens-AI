import React, { useState, useEffect } from 'react';
import { documentsApi } from '../api/documents.api.ts';
import { factsApi } from '../api/facts.api.ts';
import { BrandDocument, ApprovedFact } from '../types/index.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { Button } from '../components/common/Button.tsx';
import {
  Upload,
  FileText,
  Trash2,
  Plus,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  Eye,
  ShieldAlert,
  Sliders,
  X,
  Layers,
} from 'lucide-react';

export const GuidelinesPage: React.FC = () => {
  const { user } = useAuth();
  const isReviewer = user?.role === 'reviewer' || user?.role === 'admin';
  const [documents, setDocuments] = useState<BrandDocument[]>([]);
  const [facts, setFacts] = useState<ApprovedFact[]>([]);
  const [activeTab, setActiveTab] = useState<'documents' | 'facts'>('documents');
  const [isLoading, setIsLoading] = useState(true);

  // Upload Modal State
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Manual Rule Modal State
  const [isFactModalOpen, setIsFactModalOpen] = useState(false);
  const [factType, setFactType] = useState<
    'fact' | 'approved_terminology' | 'prohibited_terminology' | 'tone_rule'
  >('prohibited_terminology');
  const [factKey, setFactKey] = useState('');
  const [factValue, setFactValue] = useState('');
  const [factContext, setFactContext] = useState('');
  const [isSavingFact, setIsSavingFact] = useState(false);

  // Chunk Inspection Modal State
  const [inspectDoc, setInspectDoc] = useState<{ doc: BrandDocument; chunks: any[] } | null>(null);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [docsRes, factsRes] = await Promise.all([
        documentsApi.getDocuments(),
        factsApi.getFacts(),
      ]);
      setDocuments(docsRes.documents);
      setFacts(factsRes.facts);
    } catch (err) {
      console.error('Failed to load guidelines:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    setUploadError(null);
    setIsUploading(true);

    try {
      await documentsApi.uploadDocument(selectedFile);
      setSelectedFile(null);
      setIsUploadModalOpen(false);
      await loadData();
    } catch (err: any) {
      setUploadError(
        err.response?.data?.error || err.message || 'Failed to upload and parse guideline document.'
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteDocument = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to remove '${name}'? It will be excluded from all future analysis.`)) {
      return;
    }
    try {
      await documentsApi.deleteDocument(id);
      await loadData();
    } catch (err: any) {
      alert('Failed to delete document: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleInspectDocument = async (id: string) => {
    try {
      const res = await documentsApi.getDocumentById(id);
      setInspectDoc({ doc: res.document, chunks: res.chunks });
    } catch (err: any) {
      alert('Error fetching document details.');
    }
  };

  const handleCreateFact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!factKey || !factValue) return;

    setIsSavingFact(true);
    try {
      await factsApi.createFact({
        type: factType,
        key: factKey,
        value: factValue,
        context: factContext,
      });
      setFactKey('');
      setFactValue('');
      setFactContext('');
      setIsFactModalOpen(false);
      await loadData();
    } catch (err: any) {
      alert('Failed to add rule: ' + (err.response?.data?.error || err.message));
    } finally {
      setIsSavingFact(false);
    }
  };

  const handleDeleteFact = async (id: string) => {
    try {
      await factsApi.deleteFact(id);
      await loadData();
    } catch (err: any) {
      alert('Failed to delete rule.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#EAE8E3]">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="section-tag">Governance Knowledge Base</span>
            <span className="text-[11px] text-graphite-400 font-mono">RAG Vector Index</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-graphite-900 tracking-tight">
            Approved Brand Guidelines &amp; Rules
          </h1>
          <p className="text-xs sm:text-sm text-graphite-500 mt-1">
            Manage official guideline documents (PDF/TXT), prohibited terms, and verified brand facts used in semantic retrieval.
          </p>
        </div>

        {isReviewer && (
          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              size="md"
              icon={<Plus className="w-4 h-4" />}
              onClick={() => setIsFactModalOpen(true)}
            >
              Add Brand Rule / Term
            </Button>
            <Button
              variant="primary"
              size="md"
              icon={<Upload className="w-4 h-4" />}
              onClick={() => setIsUploadModalOpen(true)}
            >
              Upload Guideline (PDF/TXT)
            </Button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-[#EAE8E3]">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('documents')}
            className={`py-3 text-sm font-bold border-b-2 flex items-center gap-2.5 transition ${
              activeTab === 'documents'
                ? 'border-brand-600 text-brand-600'
                : 'border-transparent text-graphite-500 hover:text-graphite-800'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Uploaded Documents</span>
            <span className={`text-[11px] font-mono px-2 py-0.5 rounded-full ${
              activeTab === 'documents' ? 'bg-lavender-100 text-brand-700 font-bold' : 'bg-ivory-100 text-graphite-600'
            }`}>
              {documents.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('facts')}
            className={`py-3 text-sm font-bold border-b-2 flex items-center gap-2.5 transition ${
              activeTab === 'facts'
                ? 'border-brand-600 text-brand-600'
                : 'border-transparent text-graphite-500 hover:text-graphite-800'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Terminology &amp; Verified Facts</span>
            <span className={`text-[11px] font-mono px-2 py-0.5 rounded-full ${
              activeTab === 'facts' ? 'bg-lavender-100 text-brand-700 font-bold' : 'bg-ivory-100 text-graphite-600'
            }`}>
              {facts.length}
            </span>
          </button>
        </nav>
      </div>

      {/* Tab 1: Documents List */}
      {activeTab === 'documents' && (
        <div className="bg-white rounded-3xl border border-[#EAE8E3] shadow-card overflow-hidden">
          {isLoading ? (
            <div className="p-12 text-center text-sm text-graphite-400 font-mono">Loading guideline documents...</div>
          ) : documents.length === 0 ? (
            <div className="p-16 text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-ivory-100 border border-[#EAE8E3] flex items-center justify-center text-graphite-400 mx-auto">
                <BookOpen className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-graphite-900 tracking-tight">No brand guideline documents uploaded</h3>
                <p className="text-xs sm:text-sm text-graphite-500 max-w-md mx-auto mt-1">
                  Upload your brand style guide (PDF) or TXT messaging rules to activate RAG semantic retrieval during AI compliance analysis.
                </p>
              </div>
              {isReviewer && (
                <Button
                  variant="primary"
                  size="md"
                  icon={<Upload className="w-4 h-4" />}
                  onClick={() => setIsUploadModalOpen(true)}
                  className="mt-2"
                >
                  Upload Guideline Document
                </Button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-[#F2EFE8]">
              {documents.map((doc) => (
                <div
                  key={doc._id}
                  className="p-5 sm:px-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-ivory-50/60 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-11 h-11 rounded-2xl bg-lavender-50 border border-lavender-100 flex items-center justify-center text-brand-600 flex-shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-graphite-900 tracking-tight">{doc.originalName}</h4>
                      <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-graphite-500 font-mono">
                        <span className="uppercase text-[10px] font-bold text-brand-700 bg-lavender-50 border border-lavender-200 px-2 py-0.5 rounded">
                          {doc.fileType}
                        </span>
                        <span className="text-graphite-300">•</span>
                        <span className="text-graphite-600">{(doc.fileSize / 1024).toFixed(1)} KB</span>
                        <span className="text-graphite-300">•</span>
                        <span className="inline-flex items-center gap-1 text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-[11px] font-bold">
                          <Layers className="w-3 h-3" />
                          {doc.chunkCount} RAG Vector Chunks
                        </span>
                        <span className="text-graphite-300">•</span>
                        <span className="font-sans text-graphite-500">Uploaded by {doc.uploadedBy?.name || 'Admin'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <Button
                      variant="outline"
                      size="sm"
                      icon={<Eye className="w-3.5 h-3.5" />}
                      onClick={() => handleInspectDocument(doc._id)}
                    >
                      View Chunks
                    </Button>
                    {isReviewer && (
                      <button
                        onClick={() => handleDeleteDocument(doc._id, doc.originalName)}
                        className="p-2 text-graphite-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                        title="Deactivate and remove from analysis"
                        aria-label="Delete document"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Manual Rules, Terminology & Facts */}
      {activeTab === 'facts' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Prohibited Terminology Section */}
            <div className="bg-white rounded-3xl border border-[#EAE8E3] shadow-card p-6 flex flex-col">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#F2EFE8]">
                <div className="flex items-center gap-2 text-xs font-bold text-rose-700 uppercase tracking-wider font-mono">
                  <ShieldAlert className="w-4 h-4 text-rose-600" />
                  <span>Prohibited Terminology</span>
                </div>
                <span className="text-xs font-mono font-bold text-graphite-500 bg-ivory-100 px-2 py-0.5 rounded border border-[#EAE8E3]">
                  {facts.filter((f) => f.type === 'prohibited_terminology').length} rules
                </span>
              </div>
              <div className="space-y-2.5 flex-1">
                {facts.filter((f) => f.type === 'prohibited_terminology').length === 0 ? (
                  <p className="text-xs text-graphite-400 py-4 text-center italic">No prohibited terminology defined yet.</p>
                ) : (
                  facts.filter((f) => f.type === 'prohibited_terminology').map((f) => (
                    <div
                      key={f._id}
                      className="p-3.5 rounded-xl bg-rose-50/50 border border-rose-100 text-xs flex items-start justify-between gap-3 hover:bg-rose-50/80 transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-rose-900 bg-rose-100/80 px-2 py-0.5 rounded">
                            "{f.key}"
                          </span>
                          {f.context && (
                            <span className="text-[10px] text-graphite-500 font-mono bg-white/90 border border-rose-200/60 px-1.5 py-0.5 rounded">
                              {f.context}
                            </span>
                          )}
                        </div>
                        <p className="text-graphite-700 leading-relaxed font-sans">{f.value}</p>
                      </div>
                      {isReviewer && (
                        <button
                          onClick={() => handleDeleteFact(f._id)}
                          className="text-graphite-400 hover:text-rose-600 p-1 rounded-lg hover:bg-rose-100/50 transition-colors"
                          title="Delete rule"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Approved Terminology Section */}
            <div className="bg-white rounded-3xl border border-[#EAE8E3] shadow-card p-6 flex flex-col">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#F2EFE8]">
                <div className="flex items-center gap-2 text-xs font-bold text-brand-700 uppercase tracking-wider font-mono">
                  <CheckCircle2 className="w-4 h-4 text-brand-600" />
                  <span>Approved Terminology</span>
                </div>
                <span className="text-xs font-mono font-bold text-graphite-500 bg-ivory-100 px-2 py-0.5 rounded border border-[#EAE8E3]">
                  {facts.filter((f) => f.type === 'approved_terminology').length} rules
                </span>
              </div>
              <div className="space-y-2.5 flex-1">
                {facts.filter((f) => f.type === 'approved_terminology').length === 0 ? (
                  <p className="text-xs text-graphite-400 py-4 text-center italic">No approved terminology defined yet.</p>
                ) : (
                  facts.filter((f) => f.type === 'approved_terminology').map((f) => (
                    <div
                      key={f._id}
                      className="p-3.5 rounded-xl bg-lavender-50/50 border border-lavender-100 text-xs flex items-start justify-between gap-3 hover:bg-lavender-50/80 transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-brand-900 bg-lavender-100/80 px-2 py-0.5 rounded">
                            "{f.key}"
                          </span>
                          {f.context && (
                            <span className="text-[10px] text-graphite-500 font-mono bg-white/90 border border-lavender-200/60 px-1.5 py-0.5 rounded">
                              {f.context}
                            </span>
                          )}
                        </div>
                        <p className="text-graphite-700 leading-relaxed font-sans">{f.value}</p>
                      </div>
                      {isReviewer && (
                        <button
                          onClick={() => handleDeleteFact(f._id)}
                          className="text-graphite-400 hover:text-rose-600 p-1 rounded-lg hover:bg-rose-100/50 transition-colors"
                          title="Delete rule"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Verified Facts Section */}
            <div className="bg-white rounded-3xl border border-[#EAE8E3] shadow-card p-6 flex flex-col">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#F2EFE8]">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 uppercase tracking-wider font-mono">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Verified Product Facts &amp; Metrics</span>
                </div>
                <span className="text-xs font-mono font-bold text-graphite-500 bg-ivory-100 px-2 py-0.5 rounded border border-[#EAE8E3]">
                  {facts.filter((f) => f.type === 'fact').length} facts
                </span>
              </div>
              <div className="space-y-2.5 flex-1">
                {facts.filter((f) => f.type === 'fact').length === 0 ? (
                  <p className="text-xs text-graphite-400 py-4 text-center italic">No verified facts defined yet.</p>
                ) : (
                  facts.filter((f) => f.type === 'fact').map((f) => (
                    <div
                      key={f._id}
                      className="p-3.5 rounded-xl bg-emerald-50/50 border border-emerald-100 text-xs flex items-start justify-between gap-3 hover:bg-emerald-50/80 transition-colors"
                    >
                      <div className="space-y-1">
                        <span className="font-bold text-emerald-950 block">{f.key}</span>
                        <p className="text-graphite-700 leading-relaxed font-sans">{f.value}</p>
                      </div>
                      {isReviewer && (
                        <button
                          onClick={() => handleDeleteFact(f._id)}
                          className="text-graphite-400 hover:text-rose-600 p-1 rounded-lg hover:bg-rose-100/50 transition-colors"
                          title="Delete fact"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Tone Rules Section */}
            <div className="bg-white rounded-3xl border border-[#EAE8E3] shadow-card p-6 flex flex-col">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#F2EFE8]">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-700 uppercase tracking-wider font-mono">
                  <Sliders className="w-4 h-4 text-amber-600" />
                  <span>Mandatory Tone Requirements</span>
                </div>
                <span className="text-xs font-mono font-bold text-graphite-500 bg-ivory-100 px-2 py-0.5 rounded border border-[#EAE8E3]">
                  {facts.filter((f) => f.type === 'tone_rule').length} rules
                </span>
              </div>
              <div className="space-y-2.5 flex-1">
                {facts.filter((f) => f.type === 'tone_rule').length === 0 ? (
                  <p className="text-xs text-graphite-400 py-4 text-center italic">No tone rules defined yet.</p>
                ) : (
                  facts.filter((f) => f.type === 'tone_rule').map((f) => (
                    <div
                      key={f._id}
                      className="p-3.5 rounded-xl bg-amber-50/50 border border-amber-100 text-xs flex items-start justify-between gap-3 hover:bg-amber-50/80 transition-colors"
                    >
                      <div className="space-y-1">
                        <span className="font-bold text-amber-950 block">{f.key}</span>
                        <p className="text-graphite-700 leading-relaxed font-sans">{f.value}</p>
                      </div>
                      {isReviewer && (
                        <button
                          onClick={() => handleDeleteFact(f._id)}
                          className="text-graphite-400 hover:text-rose-600 p-1 rounded-lg hover:bg-rose-100/50 transition-colors"
                          title="Delete tone rule"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload Document Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-graphite-950/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-modal border border-[#EAE8E3]">
            <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-[#F2EFE8]">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-lavender-50 border border-lavender-100 flex items-center justify-center text-brand-600">
                  <Upload className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-graphite-900">
                  Upload Brand Guideline
                </h3>
              </div>
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="text-graphite-400 hover:text-graphite-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {uploadError && (
              <div className="mb-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
                <span>{uploadError}</span>
              </div>
            )}

            <form onSubmit={handleFileUpload} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-graphite-700 mb-2 font-mono text-[11px]">
                  Select Document File (.pdf or .txt, max 10MB)
                </label>
                <input
                  type="file"
                  accept=".pdf,.txt"
                  required
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="block w-full text-xs text-graphite-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-lavender-50 file:text-brand-700 hover:file:bg-lavender-100 cursor-pointer"
                />
              </div>

              {selectedFile && (
                <div className="p-3.5 bg-ivory-50 border border-[#EAE8E3] rounded-xl text-xs text-graphite-600 space-y-1">
                  <div>Name: <span className="font-bold text-graphite-900">{selectedFile.name}</span></div>
                  <div>Size: <span className="font-mono text-graphite-800">{(selectedFile.size / 1024).toFixed(1)} KB</span></div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#F2EFE8]">
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  onClick={() => setIsUploadModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  disabled={!selectedFile || isUploading}
                  isLoading={isUploading}
                >
                  {isUploading ? 'Extracting & Indexing Chunks...' : 'Process & Index Guideline'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manual Fact/Rule Modal */}
      {isFactModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-graphite-950/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-modal border border-[#EAE8E3]">
            <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-[#F2EFE8]">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-lavender-50 border border-lavender-100 flex items-center justify-center text-brand-600">
                  <Plus className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-graphite-900">
                  Add Brand Governance Rule
                </h3>
              </div>
              <button
                onClick={() => setIsFactModalOpen(false)}
                className="text-graphite-400 hover:text-graphite-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateFact} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-graphite-700 mb-1.5 font-mono text-[11px]">
                  Rule Category
                </label>
                <select
                  value={factType}
                  onChange={(e: any) => setFactType(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#EAE8E3] bg-[#FCFBF9] focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 font-bold text-graphite-800"
                >
                  <option value="prohibited_terminology">Prohibited Terminology</option>
                  <option value="approved_terminology">Approved Terminology</option>
                  <option value="fact">Verified Product Fact / Metric</option>
                  <option value="tone_rule">Tone &amp; Voice Requirement</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-graphite-700 mb-1.5 font-mono text-[11px]">
                  Term / Key Name
                </label>
                <input
                  type="text"
                  required
                  value={factKey}
                  onChange={(e) => setFactKey(e.target.value)}
                  placeholder={
                    factType === 'prohibited_terminology'
                      ? 'e.g. cheap'
                      : factType === 'approved_terminology'
                      ? 'e.g. ApexFlow Platform'
                      : 'e.g. Uptime SLA'
                  }
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#EAE8E3] focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 bg-[#FCFBF9] text-graphite-900 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-graphite-700 mb-1.5 font-mono text-[11px]">
                  Guidance / Preferred Alternative / Verified Fact
                </label>
                <textarea
                  required
                  rows={3}
                  value={factValue}
                  onChange={(e) => setFactValue(e.target.value)}
                  placeholder={
                    factType === 'prohibited_terminology'
                      ? 'e.g. Never use cheap; replace with cost-effective or high enterprise ROI.'
                      : 'e.g. Verified 99.99% enterprise uptime SLA across all regions.'
                  }
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#EAE8E3] focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 bg-[#FCFBF9] text-graphite-900 font-medium resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-graphite-700 mb-1.5 font-mono text-[11px]">
                  Applicable Context / Channel (Optional)
                </label>
                <input
                  type="text"
                  value={factContext}
                  onChange={(e) => setFactContext(e.target.value)}
                  placeholder="e.g. Social media, sales decks, global"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#EAE8E3] focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 bg-[#FCFBF9] text-graphite-900 font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#F2EFE8]">
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  onClick={() => setIsFactModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  disabled={isSavingFact}
                  isLoading={isSavingFact}
                >
                  {isSavingFact ? 'Saving...' : 'Save Rule'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Chunks Preview Modal */}
      {inspectDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-graphite-950/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col p-6 sm:p-7 shadow-modal border border-[#EAE8E3]">
            <div className="flex items-center justify-between pb-3.5 border-b border-[#F2EFE8]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-lavender-50 border border-lavender-100 flex items-center justify-center text-brand-600">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-graphite-900">
                    Vector Chunks: {inspectDoc.doc.originalName}
                  </h3>
                  <p className="text-xs text-graphite-500 font-mono">
                    {inspectDoc.chunks.length} chunks indexed with 768-dim embeddings for RAG retrieval
                  </p>
                </div>
              </div>
              <button
                onClick={() => setInspectDoc(null)}
                className="text-graphite-400 hover:text-graphite-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-3 font-mono">
              {inspectDoc.chunks.map((chunk, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-ivory-50 border border-[#EAE8E3] text-xs">
                  <div className="flex items-center justify-between text-[11px] font-bold text-graphite-500 uppercase tracking-wider mb-2">
                    <span className="text-brand-700 bg-lavender-50 border border-lavender-200 px-2 py-0.5 rounded">
                      Chunk #{chunk.chunkIndex + 1}
                    </span>
                    <span className="text-graphite-400">{chunk.content.length} characters</span>
                  </div>
                  <p className="text-graphite-800 leading-relaxed font-sans whitespace-pre-wrap">
                    {chunk.content}
                  </p>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-[#F2EFE8] flex justify-end">
              <Button
                variant="outline"
                size="md"
                onClick={() => setInspectDoc(null)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};