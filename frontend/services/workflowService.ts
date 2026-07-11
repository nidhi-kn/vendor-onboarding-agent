import { api } from './api';
import { Workflow } from '@/types';

interface WorkflowDetailsResponse {
  workflow: Workflow;
  vendor: any;
  documents: any[];
  conversationSummary: {
    messageCount: number;
    recentMessages: any[];
  };
  approval: any;
  timeline: any[];
}

export const workflowService = {
  getById: async (id: string): Promise<WorkflowDetailsResponse> => {
    const response = await api.get(`/api/workflow/${id}`);
    return response.data.data;
  },
};
