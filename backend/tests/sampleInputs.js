/**
 * sampleInputs.js
 * 
 * Sample PlannerRequest objects for testing different workflow scenarios.
 * Each case represents a different stage in the vendor onboarding workflow.
 */

const { WORKFLOW_STATES, DOCUMENT_TYPES, MESSAGE_TYPES } = require('../src/agent/constants');

/**
 * Case 1: Vendor in WAITING_GST state
 * Scenario: Vendor needs to upload GST certificate
 */
const case1_WaitingGST = {
  vendorContext: {
    vendorId: 'v_001',
    companyName: 'Tech Solutions Pvt Ltd',
    contactPerson: 'Rajesh Kumar',
    email: 'rajesh@techsolutions.com',
    phone: '+919876543210',
    gstNumber: null,
    panNumber: null,
    bankAccountNumber: null,
    ifscCode: null,
    metadata: {}
  },
  workflowContext: {
    workflowId: 'wf_001',
    currentState: WORKFLOW_STATES.WAITING_GST,
    previousState: WORKFLOW_STATES.WAITING_VENDOR_DETAILS,
    stateHistory: [
      WORKFLOW_STATES.START,
      WORKFLOW_STATES.WAITING_VENDOR_DETAILS,
      WORKFLOW_STATES.WAITING_GST
    ],
    createdAt: new Date('2024-01-01T10:00:00Z'),
    updatedAt: new Date('2024-01-01T10:05:00Z'),
    metadata: {},
    assignedTo: null
  },
  documents: [],
  conversationHistory: [
    {
      messageId: 'msg_001',
      messageType: MESSAGE_TYPES.TEXT,
      content: 'I want to register as a vendor',
      sender: 'vendor',
      timestamp: new Date('2024-01-01T10:00:00Z'),
      metadata: null
    },
    {
      messageId: 'msg_002',
      messageType: MESSAGE_TYPES.TEXT,
      content: 'Please provide your company details',
      sender: 'system',
      timestamp: new Date('2024-01-01T10:01:00Z'),
      metadata: null
    }
  ],
  incomingMessage: {
    messageType: MESSAGE_TYPES.TEXT,
    content: 'What documents do I need to provide?',
    senderId: 'v_001',
    senderName: 'Rajesh Kumar',
    timestamp: new Date('2024-01-01T10:05:00Z'),
    documentUrl: null,
    documentType: null
  }
};

/**
 * Case 2: GST Certificate Uploaded
 * Scenario: Vendor just uploaded GST certificate, need to ask for PAN
 */
const case2_GSTUploaded = {
  vendorContext: {
    vendorId: 'v_002',
    companyName: 'Global Exports Ltd',
    contactPerson: 'Priya Sharma',
    email: 'priya@globalexports.com',
    phone: '+918765432109',
    gstNumber: '27AABCU9603R1ZM',
    panNumber: null,
    bankAccountNumber: null,
    ifscCode: null,
    metadata: {}
  },
  workflowContext: {
    workflowId: 'wf_002',
    currentState: WORKFLOW_STATES.WAITING_GST,
    previousState: WORKFLOW_STATES.WAITING_VENDOR_DETAILS,
    stateHistory: [
      WORKFLOW_STATES.START,
      WORKFLOW_STATES.WAITING_VENDOR_DETAILS,
      WORKFLOW_STATES.WAITING_GST
    ],
    createdAt: new Date('2024-01-02T09:00:00Z'),
    updatedAt: new Date('2024-01-02T09:15:00Z'),
    metadata: {},
    assignedTo: null
  },
  documents: [
    {
      documentId: 'doc_001',
      documentType: DOCUMENT_TYPES.GST_CERTIFICATE,
      fileName: 'gst_certificate.pdf',
      fileUrl: 'https://storage.example.com/gst_001.pdf',
      mimeType: 'application/pdf',
      fileSize: 245760,
      uploadedAt: new Date('2024-01-02T09:15:00Z'),
      uploadedBy: 'v_002',
      status: 'pending',
      rejectionReason: null
    }
  ],
  conversationHistory: [
    {
      messageId: 'msg_003',
      messageType: MESSAGE_TYPES.TEXT,
      content: 'Please upload your GST certificate',
      sender: 'system',
      timestamp: new Date('2024-01-02T09:10:00Z'),
      metadata: null
    }
  ],
  incomingMessage: {
    messageType: MESSAGE_TYPES.DOCUMENT,
    content: 'Here is my GST certificate',
    senderId: 'v_002',
    senderName: 'Priya Sharma',
    timestamp: new Date('2024-01-02T09:15:00Z'),
    documentUrl: 'https://storage.example.com/gst_001.pdf',
    documentType: DOCUMENT_TYPES.GST_CERTIFICATE
  }
};

/**
 * Case 3: GST and PAN Uploaded
 * Scenario: Both GST and PAN uploaded, need bank proof
 */
const case3_GSTAndPANUploaded = {
  vendorContext: {
    vendorId: 'v_003',
    companyName: 'Smart Manufacturing Co',
    contactPerson: 'Amit Patel',
    email: 'amit@smartmfg.com',
    phone: '+917654321098',
    gstNumber: '24AABCS1234E1ZX',
    panNumber: 'AABCS1234E',
    bankAccountNumber: null,
    ifscCode: null,
    metadata: {}
  },
  workflowContext: {
    workflowId: 'wf_003',
    currentState: WORKFLOW_STATES.WAITING_PAN,
    previousState: WORKFLOW_STATES.WAITING_GST,
    stateHistory: [
      WORKFLOW_STATES.START,
      WORKFLOW_STATES.WAITING_VENDOR_DETAILS,
      WORKFLOW_STATES.WAITING_GST,
      WORKFLOW_STATES.WAITING_PAN
    ],
    createdAt: new Date('2024-01-03T08:00:00Z'),
    updatedAt: new Date('2024-01-03T08:30:00Z'),
    metadata: {},
    assignedTo: null
  },
  documents: [
    {
      documentId: 'doc_002',
      documentType: DOCUMENT_TYPES.GST_CERTIFICATE,
      fileName: 'gst.pdf',
      fileUrl: 'https://storage.example.com/gst_002.pdf',
      mimeType: 'application/pdf',
      fileSize: 180000,
      uploadedAt: new Date('2024-01-03T08:15:00Z'),
      uploadedBy: 'v_003',
      status: 'verified',
      rejectionReason: null
    },
    {
      documentId: 'doc_003',
      documentType: DOCUMENT_TYPES.PAN_CARD,
      fileName: 'pan_card.jpg',
      fileUrl: 'https://storage.example.com/pan_002.jpg',
      mimeType: 'image/jpeg',
      fileSize: 95000,
      uploadedAt: new Date('2024-01-03T08:30:00Z'),
      uploadedBy: 'v_003',
      status: 'pending',
      rejectionReason: null
    }
  ],
  conversationHistory: [
    {
      messageId: 'msg_004',
      messageType: MESSAGE_TYPES.TEXT,
      content: 'GST uploaded successfully. Now upload PAN card',
      sender: 'system',
      timestamp: new Date('2024-01-03T08:16:00Z'),
      metadata: null
    }
  ],
  incomingMessage: {
    messageType: MESSAGE_TYPES.DOCUMENT,
    content: 'PAN card uploaded',
    senderId: 'v_003',
    senderName: 'Amit Patel',
    timestamp: new Date('2024-01-03T08:30:00Z'),
    documentUrl: 'https://storage.example.com/pan_002.jpg',
    documentType: DOCUMENT_TYPES.PAN_CARD
  }
};

/**
 * Case 4: All Documents Uploaded
 * Scenario: All required documents uploaded, ready for verification
 */
const case4_AllDocumentsUploaded = {
  vendorContext: {
    vendorId: 'v_004',
    companyName: 'Digital Services Inc',
    contactPerson: 'Sneha Reddy',
    email: 'sneha@digitalservices.com',
    phone: '+916543210987',
    gstNumber: '29AABCD5678F1Z1',
    panNumber: 'AABCD5678F',
    bankAccountNumber: '1234567890',
    ifscCode: 'HDFC0001234',
    metadata: {}
  },
  workflowContext: {
    workflowId: 'wf_004',
    currentState: WORKFLOW_STATES.WAITING_BANK_PROOF,
    previousState: WORKFLOW_STATES.WAITING_PAN,
    stateHistory: [
      WORKFLOW_STATES.START,
      WORKFLOW_STATES.WAITING_VENDOR_DETAILS,
      WORKFLOW_STATES.WAITING_GST,
      WORKFLOW_STATES.WAITING_PAN,
      WORKFLOW_STATES.WAITING_BANK_PROOF
    ],
    createdAt: new Date('2024-01-04T07:00:00Z'),
    updatedAt: new Date('2024-01-04T08:00:00Z'),
    metadata: {},
    assignedTo: null
  },
  documents: [
    {
      documentId: 'doc_004',
      documentType: DOCUMENT_TYPES.GST_CERTIFICATE,
      fileName: 'company_gst.pdf',
      fileUrl: 'https://storage.example.com/gst_004.pdf',
      mimeType: 'application/pdf',
      fileSize: 200000,
      uploadedAt: new Date('2024-01-04T07:20:00Z'),
      uploadedBy: 'v_004',
      status: 'verified',
      rejectionReason: null
    },
    {
      documentId: 'doc_005',
      documentType: DOCUMENT_TYPES.PAN_CARD,
      fileName: 'pan.pdf',
      fileUrl: 'https://storage.example.com/pan_004.pdf',
      mimeType: 'application/pdf',
      fileSize: 150000,
      uploadedAt: new Date('2024-01-04T07:40:00Z'),
      uploadedBy: 'v_004',
      status: 'verified',
      rejectionReason: null
    },
    {
      documentId: 'doc_006',
      documentType: DOCUMENT_TYPES.BANK_PROOF,
      fileName: 'cancelled_cheque.jpg',
      fileUrl: 'https://storage.example.com/bank_004.jpg',
      mimeType: 'image/jpeg',
      fileSize: 120000,
      uploadedAt: new Date('2024-01-04T08:00:00Z'),
      uploadedBy: 'v_004',
      status: 'pending',
      rejectionReason: null
    }
  ],
  conversationHistory: [
    {
      messageId: 'msg_005',
      messageType: MESSAGE_TYPES.TEXT,
      content: 'Please upload your bank account proof',
      sender: 'system',
      timestamp: new Date('2024-01-04T07:50:00Z'),
      metadata: null
    }
  ],
  incomingMessage: {
    messageType: MESSAGE_TYPES.DOCUMENT,
    content: 'Here is my cancelled cheque',
    senderId: 'v_004',
    senderName: 'Sneha Reddy',
    timestamp: new Date('2024-01-04T08:00:00Z'),
    documentUrl: 'https://storage.example.com/bank_004.jpg',
    documentType: DOCUMENT_TYPES.BANK_PROOF
  }
};

/**
 * Case 5: Waiting for Finance Approval
 * Scenario: All documents verified, vendor asking about status
 */
const case5_WaitingFinanceApproval = {
  vendorContext: {
    vendorId: 'v_005',
    companyName: 'Enterprise Solutions Ltd',
    contactPerson: 'Vikram Singh',
    email: 'vikram@enterprise.com',
    phone: '+915432109876',
    gstNumber: '27AABCE9012G1Z2',
    panNumber: 'AABCE9012G',
    bankAccountNumber: '9876543210',
    ifscCode: 'ICIC0001234',
    metadata: {}
  },
  workflowContext: {
    workflowId: 'wf_005',
    currentState: WORKFLOW_STATES.WAITING_FINANCE_APPROVAL,
    previousState: WORKFLOW_STATES.DOCUMENT_VERIFICATION,
    stateHistory: [
      WORKFLOW_STATES.START,
      WORKFLOW_STATES.WAITING_VENDOR_DETAILS,
      WORKFLOW_STATES.WAITING_GST,
      WORKFLOW_STATES.WAITING_PAN,
      WORKFLOW_STATES.WAITING_BANK_PROOF,
      WORKFLOW_STATES.DOCUMENT_VERIFICATION,
      WORKFLOW_STATES.WAITING_FINANCE_APPROVAL
    ],
    createdAt: new Date('2024-01-05T06:00:00Z'),
    updatedAt: new Date('2024-01-05T10:00:00Z'),
    metadata: {
      approvalRequestedAt: new Date('2024-01-05T10:00:00Z')
    },
    assignedTo: 'finance_manager_01'
  },
  documents: [
    {
      documentId: 'doc_007',
      documentType: DOCUMENT_TYPES.GST_CERTIFICATE,
      fileName: 'gst_cert.pdf',
      fileUrl: 'https://storage.example.com/gst_005.pdf',
      mimeType: 'application/pdf',
      fileSize: 220000,
      uploadedAt: new Date('2024-01-05T07:00:00Z'),
      uploadedBy: 'v_005',
      status: 'verified',
      rejectionReason: null
    },
    {
      documentId: 'doc_008',
      documentType: DOCUMENT_TYPES.PAN_CARD,
      fileName: 'pan_card.pdf',
      fileUrl: 'https://storage.example.com/pan_005.pdf',
      mimeType: 'application/pdf',
      fileSize: 140000,
      uploadedAt: new Date('2024-01-05T08:00:00Z'),
      uploadedBy: 'v_005',
      status: 'verified',
      rejectionReason: null
    },
    {
      documentId: 'doc_009',
      documentType: DOCUMENT_TYPES.BANK_PROOF,
      fileName: 'bank_statement.pdf',
      fileUrl: 'https://storage.example.com/bank_005.pdf',
      mimeType: 'application/pdf',
      fileSize: 300000,
      uploadedAt: new Date('2024-01-05T09:00:00Z'),
      uploadedBy: 'v_005',
      status: 'verified',
      rejectionReason: null
    }
  ],
  conversationHistory: [
    {
      messageId: 'msg_006',
      messageType: MESSAGE_TYPES.TEXT,
      content: 'All documents verified. Sent for finance approval.',
      sender: 'system',
      timestamp: new Date('2024-01-05T10:00:00Z'),
      metadata: null
    }
  ],
  incomingMessage: {
    messageType: MESSAGE_TYPES.TEXT,
    content: 'How long will the approval process take?',
    senderId: 'v_005',
    senderName: 'Vikram Singh',
    timestamp: new Date('2024-01-05T11:00:00Z'),
    documentUrl: null,
    documentType: null
  }
};

module.exports = {
  case1_WaitingGST,
  case2_GSTUploaded,
  case3_GSTAndPANUploaded,
  case4_AllDocumentsUploaded,
  case5_WaitingFinanceApproval
};
