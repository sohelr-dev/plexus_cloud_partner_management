import { createContext, useContext } from 'react'
import { useAuth } from './AuthContext'

const PermissionContext = createContext(null)

/**
 * usePermissions() — returns helpers to check roles and permissions.
 *
 * isRole('finance')                → true if user has that role
 * isRole(['finance', 'accounts'])  → true if user has ANY of those roles
 * can('commission.approve')        → true if user's permissions include it
 * can(['payment.create', 'payment.approve']) → true if user has ANY
 */
export function PermissionProvider({ children }) {
  const { user } = useAuth()

  const roles       = user?.roles       ?? []
  const permissions = user?.permissions ?? []

  /**
   * Check if the current user has one (or any) of the given roles.
   */
  function isRole(role) {
    if (!role) return true
    const wanted = Array.isArray(role) ? role : [role]
    // super-admin short-circuit
    if (roles.includes('super-admin')) return true
    return wanted.some((r) => roles.includes(r))
  }

  /**
   * Check if the current user has one (or any) of the given permission strings.
   */
  function can(permission) {
    if (!permission) return true
    const wanted = Array.isArray(permission) ? permission : [permission]
    if (roles.includes('super-admin')) return true
    return wanted.some((p) => permissions.includes(p))
  }

  return (
    <PermissionContext.Provider value={{ roles, permissions, isRole, can }}>
      {children}
    </PermissionContext.Provider>
  )
}

export function usePermissions() {
  const ctx = useContext(PermissionContext)
  if (!ctx) throw new Error('usePermissions must be used within PermissionProvider')
  return ctx
}
