import api from './client'

export const fetchNotifications = async (params = {}) => {
  const { data } = await api.get('/notifications', { params })
  return data
}

export const fetchUnreadCount = async () => {
  const { data } = await api.get('/notifications/unread-count')
  return data
}

export const markNotificationRead = async (id) => {
  const { data } = await api.put(`/notifications/${id}/read`)
  return data
}

export const markAllNotificationsRead = async () => {
  const { data } = await api.put('/notifications/mark-all-read')
  return data
}

export const deleteNotification = async (id) => {
  const { data } = await api.delete(`/notifications/${id}`)
  return data
}
