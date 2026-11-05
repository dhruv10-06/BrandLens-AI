import api from './client.ts';
import { ContentSubmission, AnalysisReport, ContentType } from '../types/index.ts';

export const submissionsApi = {
  createSubmission: async (data: {
    title: string;
    contentType: ContentType;
    content: string;
  }): Promise<{ success: boolean; submission: ContentSubmission; analysis: AnalysisReport }> => {
    const res = await api.post('/submissions', data);
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
