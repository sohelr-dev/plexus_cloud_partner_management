import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { Cloud } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children }) {
  const { status } = useAuth()
  const location = useLocation()

  if (status === 'loading') {
    return (
      <div className="pm-auth-boot" role="status" aria-label="Loading session">
        <div className="pm-auth-boot-logo">
          <Cloud size={28} color="#fff" />
        </div>
        <div className="spinner-border text-primary mt-3" />
        <div className="mt-3 text-secondary small">Restoring your session…</div>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return children ?? <Outlet />
}
