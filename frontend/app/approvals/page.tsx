'use client';

import { useEffect, useState } from 'react';
import { approvalService } from '@/services/approvalService';
import { Approval } from '@/types';
import Card from '@/components/Card';
import Badge from '@/components/Badge';
import Loading from '@/components/Loading';
import EmptyState from '@/components/EmptyState';

export default function ApprovalsPage() {
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<string | null>(null);

  useEffect(() => {
    loadApprovals();
  }, []);

  const loadApprovals = async () => {
    try {
      setLoading(true);
      const data = await approvalService.getAll();
      setApprovals(data);
    } catch (err) {
      setError('Failed to load approvals');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (workflowId: string) => {
    try {
      setSubmitting(workflowId);
      await approvalService.submitDecision(workflowId, 'APPROVED');
      await loadApprovals();
    } catch (err) {
      console.error('Failed to approve:', err);
      alert('Failed to approve workflow');
    } finally {
      setSubmitting(null);
    }
  };

  const handleReject = async (workflowId: string) => {
    try {
      setSubmitting(workflowId);
      await approvalService.submitDecision(workflowId, 'REJECTED');
      await loadApprovals();
    } catch (err) {
      console.error('Failed to reject:', err);
      alert('Failed to reject workflow');
    } finally {
      setSubmitting(null);
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Approvals</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      <Card>
        {approvals.length === 0 ? (
          <EmptyState message="No approvals found" />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vendor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Requested Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {approvals.map((approval) => (
                  <tr key={approval.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {approval.workflow?.vendor?.companyName || 'N/A'}
                      </div>
                      <div className="text-sm text-gray-500">
                        Workflow ID: {approval.workflowId}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge
                        variant={
                          approval.status === 'APPROVED'
                            ? 'success'
                            : approval.status === 'REJECTED'
                            ? 'error'
                            : 'warning'
                        }
                      >
                        {approval.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(approval.requestedAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {approval.status === 'pending' ? (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleApprove(approval.workflowId)}
                            disabled={submitting === approval.workflowId}
                            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded text-sm font-medium"
                          >
                            {submitting === approval.workflowId ? 'Processing...' : 'Approve'}
                          </button>
                          <button
                            onClick={() => handleReject(approval.workflowId)}
                            disabled={submitting === approval.workflowId}
                            className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white px-4 py-2 rounded text-sm font-medium"
                          >
                            {submitting === approval.workflowId ? 'Processing...' : 'Reject'}
                          </button>
                        </div>
                      ) : (
                        <span className="text-gray-500">
                          {approval.status === 'approved' ? 'Approved' : approval.status === 'rejected' ? 'Rejected' : 'Completed'}
                        </span>
                      )}
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
