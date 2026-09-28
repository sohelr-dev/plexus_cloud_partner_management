import api from './client'

/** Fetch all settings grouped */
export const getAllSettings = () =>
  api.get('/settings').then((r) => r.data.data)

/** Fetch settings for a specific group */
export const getSettingsByGroup = (group) =>
  api.get(`/settings/group/${group}`).then((r) => r.data.data)

/** Update a single setting value */
export const updateSetting = (key, value) =>
  api.put(`/settings/${key}`, { value }).then((r) => r.data.data)

/** Bulk update multiple settings at once */
export const bulkUpdateSettings = (settings) =>
  api.post('/settings/bulk', { settings }).then((r) => r.data)

/** Reset a setting to its default value */
export const resetSetting = (key) =>
  api.post(`/settings/reset/${key}`).then((r) => r.data.data)
