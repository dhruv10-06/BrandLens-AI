import api from './client.ts';
import { ContentSubmission, AnalysisReport, ContentType, SubmissionFormat, VisualAsset } from '../types/index.ts';

export const submissionsApi = {
  createSubmission: async (data: {
    title: string;
    contentType: ContentType;
    submissionFormat?: SubmissionFormat;
    content?: string;
    visualAsset?: VisualAsset;
  }): Promise<{ success: boolean; submission: ContentSubmission; analysis: AnalysisReport }> => {
    const res = await api.post('/submissions', data);
    return res.data;
  },

  uploadDraftDocument: async (
    file: File
  ): Promise<{
    success: boolean;
    filename: string;
    fileType: string;
    extractedText: string;
    charCount: number;
    pageCount?: number;
  }> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post('/submissions/upload-draft-document', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  getSubmissions: async (params?: {
    status?: string;
    contentType?: string;
  }): Promise<{ success: boolean; submissions: ContentSubmission[]; count: number }> => {
    const res = await api.get('/submissions', { params });
    return res.data;
  },

  getSubmissionById: async (
    id: string
  ): Promise<{ success: boolean; submission: ContentSubmission }> => {
    const res = await api.get(`/submissions/${id}`);
    return res.data;
  },

  updateContent: async (
    id: string,
    data: { content: string; reason?: string }
  ): Promise<{ success: boolean; submission: ContentSubmission }> => {
    const res = await api.patch(`/submissions/${id}/content`, data);
    return res.data;
  },

  reanalyzeSubmission: async (
    id: string
  ): Promise<{ success: boolean; submission: ContentSubmission; analysis: AnalysisReport }> => {
    const res = await api.post(`/submissions/${id}/reanalyze`);
    return res.data;
  },

  submitForReview: async (
    id: string
  ): Promise<{ success: boolean; submission: ContentSubmission }> => {
    const res = await api.post(`/submissions/${id}/submit-for-review`);
    return res.data;
  },
};

