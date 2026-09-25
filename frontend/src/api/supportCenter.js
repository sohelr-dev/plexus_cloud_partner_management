import api from './client';

/**
 * Support Center (Branch) Module — Full API
 */

// ── Branch CRUD
export const fetchSupportCenterSummary = async (partnerId) => {
  const res = await api.get(`/partners/${partnerId}/support-centers`);
  return res.data;
};

export const createSupportCenter = async (partnerId, data) => {
  const res = await api.post(`/partners/${partnerId}/support-centers`, data);
  return res.data;
};

export const updateSupportCenter = async (centerId, data) => {
  const res = await api.put(`/support-centers/${centerId}`, data);
  return res.data;
};

export const changeSupportCenterStatus = async (centerId, data) => {
  const res = await api.put(`/support-centers/${centerId}/status`, data);
  return res.data;
};

// ── Staff
export const fetchSupportCenterStaff = async (centerId) => {
  const res = await api.get(`/support-centers/${centerId}/staff`);
  return res.data;
};

export const addSupportCenterStaff = async (centerId, data) => {
  const res = await api.post(`/support-centers/${centerId}/staff`, data);
  return res.data;
};

export const updateSupportCenterStaff = async (staffId, data) => {
  const res = await api.put(`/support-center-staff/${staffId}`, data);
  return res.data;
};

export const deleteSupportCenterStaff = async (staffId) => {
  const res = await api.delete(`/support-center-staff/${staffId}`);
  return res.data;
};

// ── Service Coverage
export const fetchSupportCenterServices = async (centerId) => {
  const res = await api.get(`/support-centers/${centerId}/services`);
  return res.data;
};

export const addSupportCenterService = async (centerId, data) => {
  const res = await api.post(`/support-centers/${centerId}/services`, data);
  return res.data;
};

export const updateSupportCenterService = async (serviceId, data) => {
  const res = await api.put(`/support-center-services/${serviceId}`, data);
  return res.data;
};

export const deleteSupportCenterService = async (serviceId) => {
  const res = await api.delete(`/support-center-services/${serviceId}`);
  return res.data;
};

// ── Equipment
export const fetchSupportCenterEquipment = async (centerId) => {
  const res = await api.get(`/support-centers/${centerId}/equipment`);
  return res.data;
};

export const addSupportCenterEquipment = async (centerId, data) => {
  const res = await api.post(`/support-centers/${centerId}/equipment`, data);
  return res.data;
};

export const updateSupportCenterEquipment = async (centerId, equipmentId, data) => {
  const res = await api.put(`/support-centers/${centerId}/equipment/${equipmentId}`, data);
  return res.data;
};

export const deleteSupportCenterEquipment = async (centerId, equipmentId) => {
  const res = await api.delete(`/support-centers/${centerId}/equipment/${equipmentId}`);
  return res.data;
};

// ── Costs
export const fetchSupportCenterCosts = async (centerId) => {
  const res = await api.get(`/support-centers/${centerId}/costs`);
  return res.data;
};

export const addSupportCenterCost = async (centerId, data) => {
  const res = await api.post(`/support-centers/${centerId}/costs`, data);
  return res.data;
};

export const updateSupportCenterCost = async (centerId, costId, data) => {
  const res = await api.put(`/support-centers/${centerId}/costs/${costId}`, data);
  return res.data;
};

export const deleteSupportCenterCost = async (centerId, costId) => {
  const res = await api.delete(`/support-centers/${centerId}/costs/${costId}`);
  return res.data;
};

// ── Performance & History
export const fetchSupportCenterPerformance = async (centerId) => {
  const res = await api.get(`/support-centers/${centerId}/performance`);
  return res.data;
};

export const fetchSupportCenterHistory = async (centerId) => {
  const res = await api.get(`/support-centers/${centerId}/history`);
  return res.data;
};

// ── Global Dashboard (all partners, all branches — Section 67, BR-02)
export const fetchGlobalSCDashboard = async (params = {}) => {
  const res = await api.get('/support-centers/global-dashboard', { params });
  return res.data;
};
