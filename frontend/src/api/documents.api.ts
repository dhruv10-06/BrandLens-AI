import api from './client.ts';
import { BrandDocument } from '../types/index.ts';

export const documentsApi = {
  getDocuments: async (): Promise<{ success: boolean; documents: BrandDocument[]; count: number }> => {
    const res = await api.get('/documents');
    return res.data;
  },

  getDocumentById: async (
    id: string
  ): Promise<{ success: boolean; document: BrandDocument; chunks: any[] }> => {
    const res = await api.get(`/documents/${id}`);
    return res.data;
  },

  uploadDocument: async (file: File): Promise<{ success: boolean; message: string; document: any }> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post('/documents/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data;
  },

  deleteDocument: async (id: string): Promise<{ success: boolean; message: string }> => {
    const res = await api.delete(`/documents/${id}`);
    return res.data;
  },
};

