import api from './client'

export async function fetchFinancialSummary(params = {}) {
  const res = await api.get('/financial/summary', { params })
  return res.data.data
}

export async function fetchPartnerPnL(partnerId, periodKey) {
  const res = await api.get(`/financial/pnl/${partnerId}`, { params: { period_key: periodKey } })
  return res.data.data
}

export async function fetchRevenues(params = {}) {
  const res = await api.get('/financial/revenues', { params })
  return res.data
}

export async function createRevenue(data) {
  const res = await api.post('/financial/revenues', data)
  return res.data
}

export async function fetchCosts(params = {}) {
  const res = await api.get('/financial/costs', { params })
  return res.data
}

export async function createCost(data) {
  const res = await api.post('/financial/costs', data)
  return res.data
}

export async function fetchPayments(params = {}) {
  const res = await api.get('/financial/payments', { params })
  return res.data
}

export async function createPayment(data) {
  const res = await api.post('/financial/payments', data)
  return res.data
}
