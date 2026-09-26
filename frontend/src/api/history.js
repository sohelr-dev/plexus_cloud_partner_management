import api from './client';


export const HISTORY_MODULES = [
  'Business',
  'Marketing',
  'Financial',
  'Bandwidth',
  'Equipment',
  'Users',
  'Commission',
  'Support Center',
  'Documents',
  'Approval',
  'System',
];

export const HISTORY_SEVERITIES = ['Info', 'Success', 'Warning', 'Danger'];


export const fetchPartnerHistory = async (partnerId, params = {}) => {
  const res = await api.get(`/partners/${partnerId}/history`, { params });
  return {
    events: res.data.data,
    meta: res.data.meta,
  };
};

export const fetchHistorySummary = async (partnerId) => {
  const res = await api.get(`/partners/${partnerId}/history/summary`);
  return res.data.data;
};

export const createHistoryEvent = async (partnerId, payload) => {
  const res = await api.post(`/partners/${partnerId}/history`, payload);
  return res.data.data;
};

export const severityBadgeClass = (severity) => {
  switch (severity) {
    case 'Success':
      return 'bg-success-subtle text-success';
    case 'Warning':
      return 'bg-warning-subtle text-warning-emphasis';
    case 'Danger':
      return 'bg-danger-subtle text-danger';
    default:
      return 'bg-primary-subtle text-primary';
  }
};

export const severityDotColor = (severity) => {
  switch (severity) {
    case 'Success':
      return '#10b981';
    case 'Warning':
      return '#f59e0b';
    case 'Danger':
      return '#ef4444';
    default:
      return '#3b82f6';
  }
};