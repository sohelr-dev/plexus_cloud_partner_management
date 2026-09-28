import api from './client'

export async function fetchDashboardSummary(filters = {}) {
  const params = {}
  Object.entries(filters).forEach(([k, v]) => {
    if (v !== '' && v !== null && v !== undefined) params[k] = v
  })
  const res = await api.get('/dashboard/summary', { params })
  return res.data
}
