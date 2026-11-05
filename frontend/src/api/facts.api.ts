import api from './client.ts';
import { ApprovedFact } from '../types/index.ts';

export const factsApi = {
  getFacts: async (type?: string): Promise<{ success: boolean; facts: ApprovedFact[]; count: number }> => {
    const res = await api.get('/facts', { params: { type } });
    return res.data;
  },

  createFact: async (data: {
    type: 'fact' | 'approved_terminology' | 'prohibited_terminology' | 'tone_rule';
    key: string;
    value: string;
    context?: string;
  }): Promise<{ success: boolean; fact: ApprovedFact }> => {
    const res = await api.post('/facts', data);
    return res.data;
  },

  deleteFact: async (id: string): Promise<{ success: boolean; message: string }> => {
    const res = await api.delete(`/facts/${id}`);
    return res.data;
  },
};

