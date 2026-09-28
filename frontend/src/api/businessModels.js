import api from './client'

export const getBusinessModels = () =>
  api.get('/business-models').then((r) => r.data.data)

export const createBusinessModel = (data) =>
  api.post('/business-models', data).then((r) => r.data.data)

export const updateBusinessModel = (id, data) =>
  api.put(`/business-models/${id}`, data).then((r) => r.data.data)

export const deleteBusinessModel = (id) =>
  api.delete(`/business-models/${id}`).then((r) => r.data.data)
