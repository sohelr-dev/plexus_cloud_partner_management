import api from './client';


// ── Partner-scoped list + summary
export const fetchDocuments = async (partnerId) => {
  const res = await api.get(`/partners/${partnerId}/documents`);
  return res.data.data;
};

export const fetchExpiryAlerts = async (partnerId, onlyUnacknowledged = false) => {
  const res = await api.get(`/partners/${partnerId}/documents/expiry-alerts`, {
    params: onlyUnacknowledged ? { unacknowledged: 1 } : {},
  });
  return res.data.data;
};

// ── Single document
export const fetchDocument = async (documentId) => {
  const res = await api.get(`/documents/${documentId}`);
  return res.data.data;
};

export const uploadDocument = async (partnerId, payload) => {
  const form = toFormData(payload);
  const res = await api.post(`/partners/${partnerId}/documents`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data.data;
};

export const updateDocument = async (documentId, payload) => {
  const form = toFormData(payload, true);
  if (payload.file instanceof File) {
    form.append('_method', 'PUT');
    const res = await api.post(`/documents/${documentId}`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.data;
  }
  const res = await api.put(`/documents/${documentId}`, payload);
  return res.data.data;
};

export const deleteDocument = async (documentId, reason) => {
  const res = await api.delete(`/documents/${documentId}`, { data: { reason } });
  return res.data;
};

export const changeDocumentStatus = async (documentId, status, reason) => {
  const res = await api.put(`/documents/${documentId}/status`, { status, reason });
  return res.data.data;
};

export const fetchDocumentVersions = async (documentId) => {
  const res = await api.get(`/documents/${documentId}/versions`);
  return res.data.data;
};

export const addDocumentVersion = async (documentId, payload) => {
  const form = toFormData(payload);
  const res = await api.post(`/documents/${documentId}/versions`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data.data;
};

export const acknowledgeExpiryAlert = async (alertId) => {
  const res = await api.post(`/document-expiry/${alertId}/acknowledge`);
  return res.data.data;
};

// ── System-wide expiry dashboard
export const fetchGlobalExpiryDashboard = async (params = {}) => {
  const res = await api.get('/documents/expiry-dashboard', { params });
  return res.data.data;
};


export const DOCUMENT_CATEGORIES = {
  Legal: [
    'Partner Agreement',
    'Contract',
    'Amendment',
    'Authorization',
    'Trade License',
    'Tax Document',
  ],
  Financial: ['Invoice', 'Payment Receipt', 'Security Deposit', 'Credit Approval'],
  Network: [
    'Bandwidth Work Order',
    'Capacity Approval',
    'Equipment List',
    'Network Diagram',
  ],
  'Support Center': [
    'Branch Agreement',
    'Rent Agreement',
    'Branch Approval',
    'Branch Equipment List',
    'Branch Document',
  ],
};

export const DOCUMENT_STATUSES = [
  'Draft',
  'Pending Approval',
  'Active',
  'Expired',
  'Rejected',
  'Archived',
];

export const EXPIRY_THRESHOLDS = [90, 60, 30, 15, 7, 0];


function toFormData(payload, skipFile = false) {
  const form = new FormData();
  Object.entries(payload).forEach(([key, value]) => {
    if (value === null || value === undefined || value === '') return;
    if (skipFile && key === 'file') return;
    if (value instanceof File) {
      form.append(key, value);
    } else if (typeof value === 'boolean') {
      form.append(key, value ? '1' : '0');
    } else {
      form.append(key, value);
    }
  });
  return form;
}