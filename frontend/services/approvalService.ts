import { api } from './api';
import { Approval } from '@/types';

export const approvalService = {
  getAll: async (): Promise<Approval[]> => {
    const response = await api.get('/api/approval');
    return response.data.data.approvals;
  },

  submitDecision: async (workflowId: string, decision: string): Promise<void> => {
    await api.post(`/api/approval/${workflowId}`, { 
      action: decision.toLowerCase(),
      approvedBy: 'admin',
      reason: decision === 'APPROVED' ? 'Approved from dashboard' : 'Rejected from dashboard'
    });
  },
};
