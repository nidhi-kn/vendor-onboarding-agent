# REST API Endpoints Summary

## Overview
All endpoints are now implemented and tested. The backend is ready for frontend integration.

---

## Existing Endpoints (Already Present)

### 1. GET /api/vendor/:id
**Description:** Get vendor details by ID  
**Controller:** `vendor.controller.js`  
**Route File:** `vendor.routes.js`  
**Repository Used:** `vendorRepository.findById()`

**Sample Response:**
```json
{
  "success": true,
  "data": {
    "id": "Not assigned",
    "companyName": "hbn tech",
    "contactPerson": "hatshbn",
    "email": "fakelegend05@gmail.com",
    "phone": "8884996999",
    "gstNumber": null,
    "panNumber": null,
    "bankAccount": null,
    "createdAt": "2026-07-11T14:08:47.364Z",
    "updatedAt": "2026-07-11T15:39:45.687Z"
  },
  "metadata": {
    "timestamp": "2026-07-11T16:08:14.946Z"
  }
}
```

### 2. GET /api/workflow/:id
**Description:** Get workflow details with vendor, documents, messages, and timeline  
**Controller:** `workflow.controller.js`  
**Route File:** `workflow.routes.js`  
**Service Used:** `workflowService.getWorkflowDetails()`

**Sample Response:**
```json
{
  "success": true,
  "data": {
    "workflow": {
      "id": "workflow_test_1783776114401",
      "currentState": "WAITING_GST",
      "previousState": "WAITING_VENDOR_DETAILS",
      "stateHistory": ["START", "WAITING_VENDOR_DETAILS", "WAITING_GST"],
      "channel": null,
      "createdAt": "2026-07-11T13:21:54.420Z",
      "updatedAt": "2026-07-11T13:22:22.446Z"
    },
    "vendor": null,
    "documents": [],
    "conversationSummary": {
      "messageCount": 0,
      "recentMessages": []
    },
    "approval": null,
    "timeline": [
      {
        "id": "c1fbe765-05d1-4dc5-8d25-7cab9cdea3a1",
        "workflowId": "workflow_test_1783776114401",
        "actor": "agent",
        "action": "state_transition",
        "fromState": "WAITING_VENDOR_DETAILS",
        "toState": "WAITING_GST",
        "description": "Workflow transitioned from WAITING_VENDOR_DETAILS to WAITING_GST",
        "metadata": null,
        "timestamp": "2026-07-11T13:22:22.456Z"
      }
    ]
  },
  "metadata": {
    "timestamp": "2026-07-11T16:08:34.397Z"
  }
}
```

### 3. POST /api/approval/:workflowId
**Description:** Approve or reject a workflow  
**Controller:** `approval.controller.js`  
**Route File:** `approval.routes.js`  
**Tool Used:** `approvalTool.execute()`

**Request Body:**
```json
{
  "action": "approve",
  "approvedBy": "admin",
  "reason": "All documents verified"
}
```

---

## Newly Added Endpoints

### 4. GET /api/vendor/
**Description:** List all vendors with optional pagination  
**Controller:** `vendor.controller.js` (method: `listVendors`)  
**Route File:** `vendor.routes.js`  
**Repository Used:** `vendorRepository.list()`

**Query Parameters:**
- `skip` (optional): Number of records to skip
- `take` (optional): Number of records to return

**Sample Response:**
```json
{
  "success": true,
  "data": {
    "vendors": [
      {
        "id": "Not assigned",
        "companyName": "hbn tech",
        "contactPerson": "hatshbn",
        "email": "fakelegend05@gmail.com",
        "phone": "8884996999",
        "gstNumber": null,
        "panNumber": null,
        "bankAccount": null,
        "createdAt": "2026-07-11T14:08:47.364Z",
        "updatedAt": "2026-07-11T15:39:45.687Z"
      }
    ],
    "count": 1
  },
  "metadata": {
    "timestamp": "2026-07-11T16:08:04.915Z"
  }
}
```

**Test Command:**
```bash
curl http://localhost:3000/api/vendor
curl http://localhost:3000/api/vendor?skip=0&take=10
```

### 5. GET /api/approval/
**Description:** List all approvals with optional filtering by status  
**Controller:** `approval.controller.js` (method: `listApprovals`)  
**Route File:** `approval.routes.js`  
**Repository Used:** `approvalRepository.list()`

**Query Parameters:**
- `status` (optional): Filter by status (pending, approved, rejected)
- `skip` (optional): Number of records to skip
- `take` (optional): Number of records to return

**Sample Response:**
```json
{
  "success": true,
  "data": {
    "approvals": [],
    "count": 0
  },
  "metadata": {
    "timestamp": "2026-07-11T16:08:50.312Z"
  }
}
```

**Test Commands:**
```bash
curl http://localhost:3000/api/approval
curl http://localhost:3000/api/approval?status=pending
curl http://localhost:3000/api/approval?skip=0&take=10
```

### 6. GET /api/logs
**Description:** List audit logs across all workflows  
**Controller:** `log.controller.js` (method: `listLogs`)  
**Route File:** `log.routes.js`  
**Repository Used:** `auditLogRepository` (via Prisma)

**Query Parameters:**
- `action` (optional): Filter by action type (e.g., state_transition, vendor_details_saved)
- `workflowId` (optional): Filter by workflow ID
- `skip` (optional): Number of records to skip
- `take` (optional): Number of records to return (default: 50)

**Sample Response:**
```json
{
  "success": true,
  "data": {
    "logs": [
      {
        "id": "79d6e28b-0e8c-4dc5-9a4f-28292d848b20",
        "workflowId": "workflow_telegram_6757396435",
        "actor": "agent",
        "action": "state_transition",
        "fromState": "WAITING_GST",
        "toState": "WAITING_PAN",
        "description": "Workflow transitioned from WAITING_GST to WAITING_PAN",
        "metadata": null,
        "timestamp": "2026-07-11T15:40:48.641Z",
        "workflow": {
          "id": "workflow_telegram_6757396435",
          "vendorId": null,
          "currentState": "WAITING_PAN",
          "previousState": "WAITING_GST",
          "channel": null,
          "stateHistory": "[\"START\",\"WAITING_VENDOR_DETAILS\",\"WAITING_GST\",\"WAITING_PAN\"]",
          "metadata": "{}",
          "createdAt": "2026-07-11T15:37:38.000Z",
          "updatedAt": "2026-07-11T15:40:48.635Z",
          "vendor": null
        }
      }
    ],
    "count": 3
  },
  "metadata": {
    "timestamp": "2026-07-11T16:08:57.780Z"
  }
}
```

**Test Commands:**
```bash
curl http://localhost:3000/api/logs
curl http://localhost:3000/api/logs?take=10
curl http://localhost:3000/api/logs?action=state_transition
curl http://localhost:3000/api/logs?workflowId=workflow_test_123
```

### 7. GET /api/logs/:workflowId
**Description:** Get audit logs for a specific workflow  
**Controller:** `log.controller.js` (method: `getWorkflowLogs`)  
**Route File:** `log.routes.js`  
**Repository Used:** `auditLogRepository.listByWorkflowId()`

**Query Parameters:**
- `skip` (optional): Number of records to skip
- `take` (optional): Number of records to return

**Sample Response:**
```json
{
  "success": true,
  "data": {
    "workflowId": "workflow_test_1783776114401",
    "logs": [
      {
        "id": "61a94e17-6c7c-47ab-90cc-6b5e67c12be5",
        "workflowId": "workflow_test_1783776114401",
        "actor": "agent",
        "action": "state_transition",
        "fromState": "START",
        "toState": "WAITING_VENDOR_DETAILS",
        "description": "Workflow transitioned from START to WAITING_VENDOR_DETAILS",
        "metadata": null,
        "timestamp": "2026-07-11T13:21:55.229Z"
      },
      {
        "id": "36e45248-243a-4c8a-bc2e-f19928332b77",
        "workflowId": "workflow_test_1783776114401",
        "actor": "agent",
        "action": "vendor_details_saved",
        "fromState": null,
        "toState": null,
        "description": null,
        "metadata": {},
        "timestamp": "2026-07-11T13:22:22.430Z"
      }
    ],
    "count": 3
  },
  "metadata": {
    "timestamp": "2026-07-11T16:09:05.659Z"
  }
}
```

**Test Command:**
```bash
curl http://localhost:3000/api/logs/workflow_test_1783776114401
```

---

## Complete API Endpoint List

| Method | Endpoint | Description | Status |
|--------|----------|-------------|--------|
| GET | /api/vendor/ | List all vendors | ✅ Working |
| GET | /api/vendor/:id | Get vendor by ID | ✅ Working |
| GET | /api/workflow/:id | Get workflow details | ✅ Working |
| GET | /api/approval/ | List all approvals | ✅ Working |
| POST | /api/approval/:workflowId | Approve/reject workflow | ✅ Working |
| GET | /api/logs | List all audit logs | ✅ Working |
| GET | /api/logs/:workflowId | Get workflow audit logs | ✅ Working |

---

## Architecture Notes

✅ **All endpoints use existing repositories** - No duplicate data access code  
✅ **Controllers remain thin** - No business logic in controllers  
✅ **Existing services and tools are reused** - No architecture changes  
✅ **Proper error handling** - All errors go through error middleware  
✅ **Consistent response format** - All responses follow same structure  

---

## Files Modified/Created

### Modified Files:
- `backend/src/app.js` - Added log routes registration
- `backend/src/routes/vendor.routes.js` - Added GET / route for listing vendors
- `backend/src/routes/approval.routes.js` - Added GET / route for listing approvals
- `backend/src/controllers/vendor.controller.js` - Added listVendors method
- `backend/src/controllers/approval.controller.js` - Added listApprovals method

### Created Files:
- `backend/src/routes/log.routes.js` - New route file for audit logs
- `backend/src/controllers/log.controller.js` - New controller for audit logs

---

## Testing Instructions

### Using curl (PowerShell on Windows):
```powershell
# List all vendors
curl -UseBasicParsing http://localhost:3000/api/vendor | ConvertFrom-Json | ConvertTo-Json

# Get specific vendor
curl -UseBasicParsing http://localhost:3000/api/vendor/VENDOR_ID | ConvertFrom-Json | ConvertTo-Json

# Get workflow details
curl -UseBasicParsing http://localhost:3000/api/workflow/WORKFLOW_ID | ConvertFrom-Json | ConvertTo-Json

# List all approvals
curl -UseBasicParsing http://localhost:3000/api/approval | ConvertFrom-Json | ConvertTo-Json

# List pending approvals
curl -UseBasicParsing http://localhost:3000/api/approval?status=pending | ConvertFrom-Json | ConvertTo-Json

# List recent audit logs
curl -UseBasicParsing http://localhost:3000/api/logs?take=10 | ConvertFrom-Json | ConvertTo-Json

# Get workflow-specific logs
curl -UseBasicParsing http://localhost:3000/api/logs/WORKFLOW_ID | ConvertFrom-Json | ConvertTo-Json
```

### Using Postman:
1. Import collection with base URL: `http://localhost:3000`
2. Create requests for each endpoint listed above
3. Add query parameters as needed
4. All GET requests require no authentication (for now)

---

## Status: ✅ BACKEND READY FOR FRONTEND DEVELOPMENT

All required REST API endpoints are implemented, tested, and working correctly. The backend is ready for frontend integration.

**Next Steps:**
- Frontend can now consume these APIs
- No further backend changes needed for basic functionality
- All endpoints return consistent JSON format
- Error handling is in place
