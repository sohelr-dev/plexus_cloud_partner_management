import api from './client';

/**
 * Fetch Equipment & Devices Summary for a partner.
 */
export const fetchEquipmentSummary = async (partnerId) => {
  const response = await api.get(`/equipment/summary/${partnerId}`);
  return response.data;
};

/**
 * Add a new equipment asset for a partner.
 */
export const createEquipmentAsset = async (partnerId, equipmentData) => {
  const response = await api.post(`/equipment/assets/${partnerId}`, equipmentData);
  return response.data;
};

/**
 * Register a new end device for a partner.
 */
export const registerEndDevice = async (partnerId, deviceData) => {
  const response = await api.post(`/equipment/end-devices/${partnerId}`, deviceData);
  return response.data;
};

/**
 * Log maintenance for an equipment item.
 */
export const logEquipmentMaintenance = async (equipmentId, maintenanceData) => {
  const response = await api.post(`/equipment/maintenance/${equipmentId}`, maintenanceData);
  return response.data;
};

/**
 * Replace an equipment item.
 */
export const replaceEquipment = async (equipmentId, replaceData) => {
  const response = await api.post(`/equipment/${equipmentId}/replace`, replaceData);
  return response.data;
};

/**
 * Return an equipment item.
 */
export const returnEquipment = async (equipmentId, returnData) => {
  const response = await api.post(`/equipment/${equipmentId}/return`, returnData);
  return response.data;
};
