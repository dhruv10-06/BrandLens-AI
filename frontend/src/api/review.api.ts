import api from './client.ts';
import { ContentSubmission, ReviewDecision } from '../types/index.ts';

export const reviewApi = {
  getReviewQueue: async (): Promise<{ success: boolean; queue: ContentSubmission[]; count: number }> => {
    const res = await api.get('/review/queue');
    return res.data;
  },

  makeDecision: async (
    submissionId: string,
    data: { decision: 'approved' | 'rejected' | 'requested_changes'; comments: string }
  ): Promise<{ success: boolean; message: string; decision: ReviewDecision; submission: ContentSubmission }> => {
    const res = await api.post(`/review/decision/${submissionId}`, data);
    return res.data;
  },

  getReviewHistory: async (submissionId?: string): Promise<{ success: boolean; history: ReviewDecision[]; count: number }> => {
    const res = await api.get('/review/history', { params: { submissionId } });
    return res.data;
  },
};
