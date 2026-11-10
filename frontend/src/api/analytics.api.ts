import api from './client.ts';
import { GovernanceMetrics } from '../types/index.ts';

export const analyticsApi = {
  getAnalytics: async (): Promise<{ success: boolean; metrics: GovernanceMetrics }> => {
    const res = await api.get('/analytics');
    return res.data;
  },
};

