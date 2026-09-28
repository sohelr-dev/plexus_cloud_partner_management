import api from './client'

export const getRolesPermissions = () =>
  api.get('/roles-permissions').then((r) => r.data.data)

export const updateRolePermissions = (roleId, permissions) =>
  api.post(`/roles-permissions/${roleId}`, { permissions }).then((r) => r.data.data)
