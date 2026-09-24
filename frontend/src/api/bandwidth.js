import api from './client';

/**
 * Fetch Bandwidth Summary for a partner.
 */
export const fetchBandwidthSummary = async (partnerId) => {
  const response = await api.get(`/bandwidth/summary/${partnerId}`);
  return response.data;
};

/**
 * Create a new bandwidth allocation.
 */
export const createBandwidthAllocation = async (partnerId, allocationData) => {
  const response = await api.post(`/bandwidth/allocations/${partnerId}`, allocationData);
  return response.data;
};

/**
 * Submit Upgrade / Downgrade change request with impact analysis.
 */
export const requestBandwidthChange = async (partnerId, changeData) => {
  const response = await api.post(`/bandwidth/change-requests/${partnerId}`, changeData);
  return response.data;
};

/**
 * Fetch all pending bandwidth change requests system-wide.
 */
export const fetchPendingApprovals = async () => {
  const response = await api.get('/bandwidth/pending-approvals');
  return response.data;
};

/**
 * Approve a bandwidth change request.
 */
export const approveBandwidthChange = async (changeId, reason = '') => {
  const response = await api.post(`/bandwidth/changes/${changeId}/approve`, { reason });
  return response.data;
};

/**
 * Reject a bandwidth change request.
 */
export const rejectBandwidthChange = async (changeId, reason) => {
  const response = await api.post(`/bandwidth/changes/${changeId}/reject`, { reason });
  return response.data;
};
