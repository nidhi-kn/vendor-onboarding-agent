export interface Vendor {
  id: string;
  companyName: string | null;
  contactPerson: string | null;
  email: string | null;
  phone: string | null;
  gstNumber: string | null;
  panNumber: string | null;
  bankAccount: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Workflow {
  id: string;
  vendorId: string | null;
  currentState: string;
  previousState: string | null;
  channel: string | null;
  stateHistory: string;
  metadata: string | null;
  createdAt: string;
  updatedAt: string;
  vendor?: Vendor;
  documents?: Document[];
  messages?: Message[];
  approvals?: Approval[];
}

export interface Document {
  id: string;
  workflowId: string;
  documentType: string;
  fileName: string | null;
  fileUrl: string | null;
  status: string;
  verifiedAt: string | null;
  uploadedAt: string;
  metadata: string | null;
}

export interface Message {
  id: string;
  workflowId: string;
  content: string;
  sender: string;
  messageType: string;
  metadata: string | null;
  createdAt: string;
}

export interface Approval {
  id: string;
  workflowId: string;
  vendorId: string | null;
  status: string;
  requestedBy: string | null;
  approvedBy: string | null;
  rejectedBy: string | null;
  reason: string | null;
  requestedAt: string;
  approvedAt: string | null;
  rejectedAt: string | null;
  metadata: string | null;
  workflow?: {
    vendor?: Vendor;
  };
}

export interface TimelineEvent {
  id: string;
  workflowId: string;
  actor: string;
  action: string;
  fromState: string | null;
  toState: string | null;
  description: string | null;
  metadata: string | null;
  timestamp: string;
}

export interface AuditLog {
  id: string;
  workflowId: string | null;
  actor: string;
  action: string;
  fromState: string | null;
  toState: string | null;
  description: string | null;
  metadata: string | null;
  timestamp: string;
}
