import { useMemo } from 'react'
import { useAuth } from './AuthContext'

export function usePermissions() {
  const { user } = useAuth()

  return useMemo(() => {
    const permissions = new Set(user?.permissions ?? [])
    const roles = new Set(user?.roles ?? [])
    const hasWildcard = permissions.has('*')

    return {
      roles: [...roles],
      permissions: [...permissions],

      /** Has one of the given permissions (single string or array) */
      can(perms) {
        if (hasWildcard) return true
        const list = Array.isArray(perms) ? perms : [perms]
        return list.some((p) => permissions.has(p))
      },

      /** Has one of the given roles (single string or array) */
      isRole(roleOrRoles) {
        const list = Array.isArray(roleOrRoles) ? roleOrRoles : [roleOrRoles]
        return list.some((r) => roles.has(r))
      },

      /** Any permission starting with the module prefix, e.g. module('partner') */
      canModule(module) {
        if (hasWildcard) return true
        return [...permissions].some((p) => p.startsWith(`${module}.`))
      },
    }
  }, [user])
}


export function Can({ permission, module, fallback = null, children }) {
  const { can, canModule } = usePermissions()
  const allowed = permission ? can(permission) : module ? canModule(module) : true
  return allowed ? children : fallback
}
