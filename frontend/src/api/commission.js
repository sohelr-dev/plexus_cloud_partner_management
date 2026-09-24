import api from './client';


// Global Commission Dashboard (system-wide)
export const fetchGlobalCommissionDashboard = async (filters = {}) => {
  const res = await api.get('/commission/dashboard', { params: filters });
  return res.data;
};

//  Dashboard Summary (per partner)
export const fetchCommissionSummary = async (partnerId) => {
  const res = await api.get(`/commission/summary/${partnerId}`);
  return res.data;
};

// Commission Rules
export const createCommissionRule = async (partnerId, data) => {
  const res = await api.post(`/commission/rules/${partnerId}`, data);
  return res.data;
};

export const updateCommissionRule = async (ruleId, data) => {
  const res = await api.put(`/commission/rules/${ruleId}`, data);
  return res.data;
};

export const deactivateCommissionRule = async (ruleId) => {
  const res = await api.delete(`/commission/rules/${ruleId}`);
  return res.data;
};

//  Commission Records 

export const createCommission = async (partnerId, data) => {
  const res = await api.post(`/commission/records/${partnerId}`, data);
  return res.data;
};

// Lifecycle Actions 

export const approveCommission = async (commissionId, remarks = '') => {
  const res = await api.post(`/commission/${commissionId}/approve`, { remarks });
  return res.data;
};

export const rejectCommission = async (commissionId, reason) => {
  const res = await api.post(`/commission/${commissionId}/reject`, { reason });
  return res.data;
};

export const payCommission = async (commissionId, data) => {
  const res = await api.post(`/commission/${commissionId}/pay`, data);
  return res.data;
};

export const reverseCommission = async (commissionId, reason) => {
  const res = await api.post(`/commission/${commissionId}/reverse`, { reason });
  return res.data;
};
