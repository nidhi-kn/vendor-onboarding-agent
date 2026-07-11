'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { workflowService } from '@/services/workflowService';
import Card from '@/components/Card';
import Badge from '@/components/Badge';
import Loading from '@/components/Loading';

export default function WorkflowDetailsPage() {
  const params = useParams();
  const id = params.id as string;

  const [workflowData, setWorkflowData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadWorkflow();
    }
  }, [id]);

  const loadWorkflow = async () => {
    try {
      setLoading(true);
      const data = await workflowService.getById(id);
      setWorkflowData(data);
    } catch (err) {
      setError('Failed to load workflow');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loading />;
  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }
  if (!workflowData || !workflowData.workflow) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <p className="text-gray-500">Workflow not found</p>
      </div>
    );
  }

  const { workflow, vendor, documents, conversationSummary, approval, timeline } = workflowData;

  const getStateBadgeVariant = (state: string) => {
    if (state.includes('WAITING')) return 'warning';
    if (state === 'COMPLETED') return 'success';
    if (state === 'FAILED') return 'error';
    return 'info';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Workflow Details</h1>
        <p className="mt-2 text-sm text-gray-600">ID: {workflow.id}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Vendor Information</h2>
          {vendor ? (
            <div className="space-y-3">
              <div>
                <span className="text-sm font-medium text-gray-500">Company Name:</span>
                <span className="ml-2 text-sm text-gray-900">{vendor.companyName || 'N/A'}</span>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">Contact Person:</span>
                <span className="ml-2 text-sm text-gray-900">{vendor.contactPerson || 'N/A'}</span>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">Email:</span>
                <span className="ml-2 text-sm text-gray-900">{vendor.email || 'N/A'}</span>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">Phone:</span>
                <span className="ml-2 text-sm text-gray-900">{vendor.phone || 'N/A'}</span>
              </div>
              {vendor.gstNumber && (
                <div>
                  <span className="text-sm font-medium text-gray-500">GST Number:</span>
                  <span className="ml-2 text-sm text-gray-900">{vendor.gstNumber}</span>
                </div>
              )}
              {vendor.panNumber && (
                <div>
                  <span className="text-sm font-medium text-gray-500">PAN Number:</span>
                  <span className="ml-2 text-sm text-gray-900">{vendor.panNumber}</span>
                </div>
              )}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">Vendor information not yet assigned</p>
          )}
        </Card>

        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Workflow State</h2>
          <div className="space-y-3">
            <div>
              <span className="text-sm font-medium text-gray-500">Current State:</span>
              <span className="ml-2">
                <Badge variant={getStateBadgeVariant(workflow.currentState)}>
                  {workflow.currentState.replace(/_/g, ' ')}
                </Badge>
              </span>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-500">Previous State:</span>
              <span className="ml-2 text-sm text-gray-900">{workflow.previousState?.replace(/_/g, ' ') || 'None'}</span>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-500">Created:</span>
              <span className="ml-2 text-sm text-gray-900">
                {new Date(workflow.createdAt).toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-500">Last Updated:</span>
              <span className="ml-2 text-sm text-gray-900">
                {new Date(workflow.updatedAt).toLocaleString()}
              </span>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 mb-6">
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Documents</h2>
          {documents && documents.length > 0 ? (
            <div className="space-y-2">
              {documents.map((doc: any) => (
                <div key={doc.id} className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {doc.documentType.replace(/_/g, ' ').toUpperCase()}
                    </p>
                    <div className="mt-1 flex items-center gap-3 text-xs text-gray-500">
                      <span>File: {doc.fileName || 'N/A'}</span>
                      <span>•</span>
                      <span>Status: <Badge variant={doc.status === 'verified' ? 'success' : 'warning'}>{doc.status}</Badge></span>
                      <span>•</span>
                      <span>Uploaded: {new Date(doc.uploadedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  {doc.fileUrl && (
                    <a
                      href={doc.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-4 text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                      View
                    </a>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No documents uploaded yet</p>
          )}
        </Card>

        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Timeline</h2>
          {timeline && timeline.length > 0 ? (
            <div className="flow-root">
              <ul className="-mb-8">
                {timeline.map((event: any, idx: number) => (
                  <li key={event.id}>
                    <div className="relative pb-8">
                      {idx !== timeline.length - 1 && (
                        <span
                          className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-gray-200"
                          aria-hidden="true"
                        />
                      )}
                      <div className="relative flex space-x-3">
                        <div>
                          <span className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center ring-8 ring-white">
                            <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <circle cx="10" cy="10" r="3" />
                            </svg>
                          </span>
                        </div>
                        <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {event.action.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                            </p>
                            {event.description && (
                              <p className="mt-0.5 text-xs text-gray-500">{event.description}</p>
                            )}
                          </div>
                          <div className="whitespace-nowrap text-right text-sm text-gray-500">
                            <time dateTime={event.timestamp}>
                              {new Date(event.timestamp).toLocaleTimeString()}
                            </time>
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No timeline events available</p>
          )}
        </Card>

        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Conversation History</h2>
          {conversationSummary && conversationSummary.recentMessages && conversationSummary.recentMessages.length > 0 ? (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {conversationSummary.recentMessages.map((message: any) => (
                <div key={message.id} className="pb-3 border-b border-gray-200 last:border-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-900 capitalize">{message.sender}</span>
                    <span className="text-xs text-gray-500">
                      {new Date(message.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{message.content || '[No text]'}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No messages yet</p>
          )}
        </Card>

        {approval && (
          <Card>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Approval Status</h2>
            <div className="space-y-3">
              <div>
                <span className="text-sm font-medium text-gray-500">Status:</span>
                <span className="ml-2">
                  <Badge
                    variant={
                      approval.status === 'approved'
                        ? 'success'
                        : approval.status === 'rejected'
                        ? 'error'
                        : 'warning'
                    }
                  >
                    {approval.status.toUpperCase()}
                  </Badge>
                </span>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">Requested:</span>
                <span className="ml-2 text-sm text-gray-900">
                  {new Date(approval.requestedAt).toLocaleString()}
                </span>
              </div>
              {approval.approvedBy && (
                <div>
                  <span className="text-sm font-medium text-gray-500">Approved By:</span>
                  <span className="ml-2 text-sm text-gray-900">{approval.approvedBy}</span>
                </div>
              )}
              {approval.rejectedBy && (
                <div>
                  <span className="text-sm font-medium text-gray-500">Rejected By:</span>
                  <span className="ml-2 text-sm text-gray-900">{approval.rejectedBy}</span>
                </div>
              )}
              {approval.reason && (
                <div>
                  <span className="text-sm font-medium text-gray-500">Reason:</span>
                  <span className="ml-2 text-sm text-gray-900">{approval.reason}</span>
                </div>
              )}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
