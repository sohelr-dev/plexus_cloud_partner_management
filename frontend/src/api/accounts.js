import api from './client'

/** GET /api/v1/accounts/outstanding */
export const fetchOutstanding = (params = {}) =>
  api.get('/accounts/outstanding', { params }).then((r) => r.data.data)

/** GET /api/v1/accounts/commissions */
export const fetchAccountsCommissions = (params = {}) =>
  api.get('/accounts/commissions', { params }).then((r) => r.data.data)

/** GET /api/v1/accounts/invoices */
export const fetchInvoices = (params = {}) =>
  api.get('/accounts/invoices', { params }).then((r) => r.data.data)

/** GET /api/v1/accounts/credit-overview */
export const fetchCreditOverview = (params = {}) =>
  api.get('/accounts/credit-overview', { params }).then((r) => r.data.data)

/** POST /api/v1/accounts/payments */
export const recordAccountsPayment = (data) =>
  api.post('/accounts/payments', data).then((r) => r.data)
