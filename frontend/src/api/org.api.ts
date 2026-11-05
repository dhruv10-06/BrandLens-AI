import api from './client.ts';
import { Organisation } from '../types/index.ts';

export const orgApi = {
  getOrganization: async (): Promise<{
    success: boolean;
    organization: Organisation;
    stats: { documents: number; factsAndRules: number; submissions: number };
  }> => {
    const res = await api.get('/org');
    return res.data;
  },

  updateBrandVoice: async (data: {
    brandVoiceSummary: string;
    description?: string;
  }): Promise<{ success: boolean; organization: Organisation }> => {
    const res = await api.patch('/org/brand-voice', data);
    return res.data;
  },

  seedDemo: async (force = false): Promise<{ success: boolean; message: string; data: any }> => {
    const res = await api.post('/org/seed-demo', { force });
    return res.data;
  },
};

