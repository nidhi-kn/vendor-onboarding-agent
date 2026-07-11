'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { vendorService } from '@/services/vendorService';
import { Vendor } from '@/types';
import Card from '@/components/Card';
import Badge from '@/components/Badge';
import Loading from '@/components/Loading';
import EmptyState from '@/components/EmptyState';
import { api } from '@/services/api';

interface WorkflowSummary {
  id: string;
  currentState: string;
  createdAt: string;
  vendor: any;
}

export default function VendorsPage() {
  const [workflows, setWorkflows] = useState<WorkflowSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      // Get workflow IDs from logs
      const workflowResponse = await api.get('/api/logs');
      
      // Extract unique workflow IDs
      const workflowIds = new Set<string>();
      if (workflowResponse.data?.data?.logs) {
        workflowResponse.data.data.logs.forEach((log: any) => {
          if (log.workflowId) {
            workflowIds.add(log.workflowId);
          }
        });
      }
      
      // Fetch workflow details
      const workflowPromises = Array.from(workflowIds).slice(0, 10).map(async (id) => {
        try {
          const wfResponse = await api.get(`/api/workflow/${id}`);
          return {
            id: wfResponse.data.data.workflow.id,
            currentState: wfResponse.data.data.workflow.currentState,
            createdAt: wfResponse.data.data.workflow.createdAt,
            vendor: wfResponse.data.data.vendor
          };
        } catch {
          return null;
        }
      });
      
      const workflowResults = await Promise.all(workflowPromises);
      const validWorkflows = workflowResults.filter(w => w !== null) as WorkflowSummary[];
      
      setWorkflows(validWorkflows);
    } catch (err) {
      setError('Failed to load workflows');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getStateBadgeVariant = (state: string) => {
    if (state.includes('WAITING')) return 'warning';
    if (state === 'COMPLETED') return 'success';
    if (state === 'FAILED') return 'error';
    return 'info';
  };

  if (loading) return <Loading />;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Workflows</h1>
        <p className="mt-2 text-sm text-gray-600">Active vendor onboarding workflows</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          <p className="font-medium">Error</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      <Card>
        {workflows.length === 0 ? (
          <EmptyState message="No workflows found" />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Workflow ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vendor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Current State
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {workflows.map((workflow) => (
                  <tr key={workflow.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-mono text-gray-900 truncate max-w-xs">
                        {workflow.id}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {workflow.vendor?.companyName || (
                        <span className="text-gray-400 italic">Not Assigned</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={getStateBadgeVariant(workflow.currentState)}>
                        {workflow.currentState.replace(/_/g, ' ')}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(workflow.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <Link
                        href={`/workflow/${workflow.id}`}
                        className="text-blue-600 hover:text-blue-900 font-medium"
                      >
                        View Details →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
