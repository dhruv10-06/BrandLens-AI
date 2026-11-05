import React, { useState, useEffect } from 'react';
import { documentsApi } from '../api/documents.api.ts';
import { factsApi } from '../api/facts.api.ts';
import { BrandDocument, ApprovedFact } from '../types/index.ts';
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
} from 'lucide-react';

export const GuidelinesPage: React.FC = () => {
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Approved Brand Guidelines & Rules
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage official guideline documents (PDF/TXT), prohibited terms, and verified brand facts used in RAG analysis.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsFactModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition shadow-sm"
          >
            <Plus className="w-3.5 h-3.5 text-slate-500" />
            <span>Add Brand Rule / Term</span>
          </button>
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold transition shadow-sm"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Guideline (PDF/TXT)</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <nav className="flex space-x-6">
          <button
            onClick={() => setActiveTab('documents')}
            className={`py-3 text-xs font-bold border-b-2 flex items-center gap-2 transition ${
              activeTab === 'documents'
                ? 'border-brand-600 text-brand-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Uploaded Documents ({documents.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('facts')}
            className={`py-3 text-xs font-bold border-b-2 flex items-center gap-2 transition ${
              activeTab === 'facts'
                ? 'border-brand-600 text-brand-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Terminology & Verified Facts ({facts.length})</span>
          </button>
        </nav>
      </div>

      {/* Tab 1: Documents List */}
      {activeTab === 'documents' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {documents.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <BookOpen className="w-8 h-8 text-slate-300 mx-auto" />
              <h3 className="text-sm font-semibold text-slate-700">No brand guideline documents uploaded</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Upload your company's PDF brand style guide or TXT messaging rules to activate RAG semantic retrieval.
              </p>
              <button
                onClick={() => setIsUploadModalOpen(true)}
                className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-600 text-white text-xs font-semibold rounded-lg"
              >
                Upload Document
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {documents.map((doc) => (
                <div
                  key={doc._id}
                  className="p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 transition"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 flex-shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{doc.originalName}</h4>
                      <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-slate-400">
                        <span className="uppercase font-semibold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                          {doc.fileType}
                        </span>
                        <span>•</span>
                        <span>{(doc.fileSize / 1024).toFixed(1)} KB</span>
                        <span>•</span>
                        <span className="text-slate-700 font-medium">
                          {doc.chunkCount} RAG Vector Chunks
                        </span>
                        <span>•</span>
                        <span>Uploaded by {doc.uploadedBy?.name || 'Admin'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button
                      onClick={() => handleInspectDocument(doc._id)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg border border-slate-200 transition"
                    >
                      <Eye className="w-3.5 h-3.5 text-slate-500" />
                      <span>View Chunks</span>
                    </button>
                    <button
                      onClick={() => handleDeleteDocument(doc._id, doc.originalName)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                      title="Deactivate and remove from analysis"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Prohibited Terminology Section */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-xs font-bold text-red-700 uppercase tracking-wider">
                  <ShieldAlert className="w-4 h-4 text-red-600" />
                  <span>Prohibited Terminology</span>
                </div>
                <span className="text-xs text-slate-400 font-medium">
                  {facts.filter((f) => f.type === 'prohibited_terminology').length} rules
                </span>
              </div>
              <div className="space-y-2.5">
                {facts.filter((f) => f.type === 'prohibited_terminology').map((f) => (
                  <div
                    key={f._id}
                    className="p-3 rounded-lg bg-red-50/50 border border-red-100 text-xs flex items-start justify-between gap-2"
                  >
                    <div>
                      <span className="font-bold text-red-900 font-mono">"{f.key}"</span>
                      <p className="text-slate-600 mt-0.5">{f.value}</p>
                      {f.context && <span className="text-[10px] text-slate-400 italic">Scope: {f.context}</span>}
                    </div>
                    <button
                      onClick={() => handleDeleteFact(f._id)}
                      className="text-slate-400 hover:text-red-600 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Approved Terminology Section */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-xs font-bold text-indigo-700 uppercase tracking-wider">
                  <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                  <span>Approved Terminology</span>
                </div>
                <span className="text-xs text-slate-400 font-medium">
                  {facts.filter((f) => f.type === 'approved_terminology').length} rules
                </span>
              </div>
              <div className="space-y-2.5">
                {facts.filter((f) => f.type === 'approved_terminology').map((f) => (
                  <div
                    key={f._id}
                    className="p-3 rounded-lg bg-indigo-50/40 border border-indigo-100 text-xs flex items-start justify-between gap-2"
                  >
                    <div>
                      <span className="font-bold text-indigo-900 font-mono">"{f.key}"</span>
                      <p className="text-slate-600 mt-0.5">{f.value}</p>
                      {f.context && <span className="text-[10px] text-slate-400 italic">Scope: {f.context}</span>}
                    </div>
                    <button
                      onClick={() => handleDeleteFact(f._id)}
                      className="text-slate-400 hover:text-red-600 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Verified Facts Section */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 uppercase tracking-wider">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Verified Product Facts & Metrics</span>
                </div>
                <span className="text-xs text-slate-400 font-medium">
                  {facts.filter((f) => f.type === 'fact').length} facts
                </span>
              </div>
              <div className="space-y-2.5">
                {facts.filter((f) => f.type === 'fact').map((f) => (
                  <div
                    key={f._id}
                    className="p-3 rounded-lg bg-emerald-50/40 border border-emerald-100 text-xs flex items-start justify-between gap-2"
                  >
                    <div>
                      <span className="font-bold text-emerald-900">{f.key}</span>
                      <p className="text-slate-600 mt-0.5">{f.value}</p>
                    </div>
                    <button
                      onClick={() => handleDeleteFact(f._id)}
                      className="text-slate-400 hover:text-red-600 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Tone Rules Section */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-700 uppercase tracking-wider">
                  <Sliders className="w-4 h-4 text-amber-600" />
                  <span>Mandatory Tone Requirements</span>
                </div>
                <span className="text-xs text-slate-400 font-medium">
                  {facts.filter((f) => f.type === 'tone_rule').length} rules
                </span>
              </div>
              <div className="space-y-2.5">
                {facts.filter((f) => f.type === 'tone_rule').map((f) => (
                  <div
                    key={f._id}
                    className="p-3 rounded-lg bg-amber-50/40 border border-amber-100 text-xs flex items-start justify-between gap-2"
                  >
                    <div>
                      <span className="font-bold text-amber-900">{f.key}</span>
                      <p className="text-slate-600 mt-0.5">{f.value}</p>
                    </div>
                    <button
                      onClick={() => handleDeleteFact(f._id)}
                      className="text-slate-400 hover:text-red-600 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload Document Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-extrabold text-slate-900">
                Upload Brand Guideline
              </h3>
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {uploadError && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <span>{uploadError}</span>
              </div>
            )}

            <form onSubmit={handleFileUpload} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  Select Document File (.pdf or .txt, max 10MB)
                </label>
                <input
                  type="file"
                  accept=".pdf,.txt"
                  required
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100"
                />
              </div>

              {selectedFile && (
                <div className="p-3 bg-slate-50 rounded-lg text-xs text-slate-600 space-y-1">
                  <div>Name: <span className="font-semibold text-slate-900">{selectedFile.name}</span></div>
                  <div>Size: {(selectedFile.size / 1024).toFixed(1)} KB</div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!selectedFile || isUploading}
                  className="px-4 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-lg disabled:opacity-50 transition"
                >
                  {isUploading ? 'Extracting & Indexing Chunks...' : 'Process & Index Guideline'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manual Fact/Rule Modal */}
      {isFactModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-extrabold text-slate-900">
                Add Brand Governance Rule
              </h3>
              <button
                onClick={() => setIsFactModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateFact} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Rule Category
                </label>
                <select
                  value={factType}
                  onChange={(e: any) => setFactType(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-brand-500"
                >
                  <option value="prohibited_terminology">Prohibited Terminology</option>
                  <option value="approved_terminology">Approved Terminology</option>
                  <option value="fact">Verified Product Fact / Metric</option>
                  <option value="tone_rule">Tone & Voice Requirement</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
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
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
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
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Applicable Context / Channel (Optional)
                </label>
                <input
                  type="text"
                  value={factContext}
                  onChange={(e) => setFactContext(e.target.value)}
                  placeholder="e.g. Social media, sales decks, global"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsFactModalOpen(false)}
                  className="px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingFact}
                  className="px-4 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-lg disabled:opacity-50 transition"
                >
                  {isSavingFact ? 'Saving...' : 'Save Rule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Chunks Preview Modal */}
      {inspectDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">
                  Vector Chunks: {inspectDoc.doc.originalName}
                </h3>
                <p className="text-xs text-slate-400">
                  {inspectDoc.chunks.length} chunks indexed with 768-dim embeddings for RAG retrieval
                </p>
              </div>
              <button
                onClick={() => setInspectDoc(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-3">
              {inspectDoc.chunks.map((chunk, idx) => (
                <div key={idx} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    <span>Chunk #{chunk.chunkIndex + 1}</span>
                    <span>{chunk.content.length} characters</span>
                  </div>
                  <p className="text-slate-800 leading-relaxed font-sans whitespace-pre-wrap">
                    {chunk.content}
                  </p>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setInspectDoc(null)}
                className="px-4 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
