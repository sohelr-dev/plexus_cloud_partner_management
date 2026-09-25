import api from './client'

/**
 * Marketing API Client Module
 */

export const fetchMarketingSummary = async (partnerId) => {
  const response = await api.get(`/marketing/${partnerId}/summary`)
  return response.data.data
}

export const fetchCustomerGrowth = async (partnerId) => {
  const response = await api.get(`/marketing/${partnerId}/customer-growth`)
  return response.data.data
}

export const recordCustomerMetric = async (partnerId, data) => {
  const response = await api.post(`/marketing/${partnerId}/customer-growth`, data)
  return response.data.data
}

export const fetchSalesPerformance = async (partnerId) => {
  const response = await api.get(`/marketing/${partnerId}/sales-performance`)
  return response.data.data
}

export const recordSalesMetric = async (partnerId, data) => {
  const response = await api.post(`/marketing/${partnerId}/sales-performance`, data)
  return response.data.data
}

export const fetchPackagePerformance = async (partnerId) => {
  const response = await api.get(`/marketing/${partnerId}/package-performance`)
  return response.data.data
}

export const fetchAreaMetrics = async (partnerId) => {
  const response = await api.get(`/marketing/${partnerId}/area-metrics`)
  return response.data.data
}

export const fetchCampaigns = async (partnerId) => {
  const response = await api.get(`/marketing/${partnerId}/campaigns`)
  return response.data.data
}

export const createCampaign = async (partnerId, data) => {
  const response = await api.post(`/marketing/${partnerId}/campaigns`, data)
  return response.data.data
}

export const updateCampaign = async (campaignId, data) => {
  const response = await api.put(`/marketing/campaigns/${campaignId}`, data)
  return response.data.data
}

export const deleteCampaign = async (campaignId) => {
  const response = await api.delete(`/marketing/campaigns/${campaignId}`)
  return response.data
}
