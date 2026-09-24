import api from './client'

export async function fetchAuditLogs(params = {}) {
  const response = await api.get('/audit-logs', { params })
  return response.data
}
