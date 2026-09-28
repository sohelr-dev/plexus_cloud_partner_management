import { Navigate, useLocation, Link } from 'react-router-dom'
import { ShieldAlert } from 'lucide-react'
import { usePermissions } from '../context/PermissionContext'


export default function RoleRoute({ allow, permission, fallback, children }) {
  const { isRole, can } = usePermissions()
  const location = useLocation()

  // permission-based guard ( permission="setting.manage")
  if (permission) {
    if (can(permission)) return children ?? null
    if (fallback) return fallback
    return <Navigate to="/forbidden" replace state={{ from: location }} />
  }

  // role-based guard (allow={['finance', 'accounts']})
  if (!allow || isRole(allow)) {
    return children ?? null
  }

  if (fallback) return fallback

  return <Navigate to="/forbidden" replace state={{ from: location }} />
}
/** Standalone 403 page */
export function ForbiddenPage() {
  return (
    <div className="pm-forbidden">
      <ShieldAlert size={64} className="text-danger mb-2" />
      <div className="pm-forbidden-code">403</div>
      <h2 className="fw-bold text-dark mt-2">Access Denied</h2>
      <p className="text-secondary mb-4" style={{ maxWidth: '400px' }}>
        You do not have the required permissions to access this page. Please contact your system administrator if you believe this is an error.
      </p>
      <Link to="/" className="pm-btn pm-btn-primary text-decoration-none">
        Back to Dashboard
      </Link>
    </div>
  )
}
