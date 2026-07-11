import { api } from './api';
import { Vendor } from '@/types';

export const vendorService = {
  getAll: async (): Promise<Vendor[]> => {
    const response = await api.get('/api/vendor');
    return response.data.data.vendors;
  },

  getById: async (id: string): Promise<Vendor> => {
    const response = await api.get(`/api/vendor/${id}`);
    return response.data.data;
  },
};
