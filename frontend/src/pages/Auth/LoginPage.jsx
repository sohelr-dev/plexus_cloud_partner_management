import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { AlertCircle, Eye, EyeOff, Loader2, Lock, Mail, ShieldCheck, Zap } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const from = location.state?.from?.pathname || '/'

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await login(email.trim(), password)
      navigate(from, { replace: true })
    } catch (err) {
      const msg =
        err?.response?.status === 422 || err?.response?.status === 401
          ? err?.response?.data?.message ??
          Object.values(err?.response?.data?.errors ?? {})[0]?.[0] ??
          'Invalid email or password.'
          : 'Unable to reach the server. Please try again.'
      setError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="pm-auth">
      <div className="pm-auth-brand d-none d-lg-block">
        <div className="pm-auth-orb pm-auth-orb-1" />
        <div className="pm-auth-orb pm-auth-orb-2" />
        <div className="pm-auth-grid" />
        
        <div className="pm-auth-brand-inner">
          <div className="pm-auth-logo">
            <div className="pm-auth-logo-icon">
              <Zap size={24} color="#fff" strokeWidth={2.5} />
            </div>
            <div>
              <div className="pm-auth-logo-name">Plexus Cloud</div>
              <div className="pm-auth-logo-sub">Partner Management</div>
            </div>
          </div>
          
          <h1 className="pm-auth-headline">
            Partner Management,<br />
            <span>done right.</span>
          </h1>
          
          <p className="pm-auth-sub">
            A premium, unified platform for partner lifecycle, bandwidth allocation, commission logic, support centers, and deep financial intelligence.
          </p>
          
          <div className="pm-auth-features">
            <div className="pm-auth-feature">
              <div className="pm-auth-feature-icon"><ShieldCheck size={18} /></div>
              <div>
                <div className="pm-auth-feature-title">Role-based Access Control</div>
                <div className="pm-auth-feature-desc">10+ specialized roles with fine-grained permissions.</div>
              </div>
            </div>
            <div className="pm-auth-feature">
              <div className="pm-auth-feature-icon"><ShieldCheck size={18} /></div>
              <div>
                <div className="pm-auth-feature-title">Financial Intelligence</div>
                <div className="pm-auth-feature-desc">Real-time P&L, ROI, and partner health scoring.</div>
              </div>
            </div>
          </div>
          
          <div className="pm-auth-brand-footer">
            &copy; {new Date().getFullYear()} Plexus Cloud. All rights reserved.
          </div>
        </div>
      </div>

      <div className="pm-auth-panel">
        <div className="pm-auth-card">
          <div className="pm-auth-card-logo d-lg-none">
            <div className="pm-auth-card-logo-icon">
              <Zap size={20} color="#fff" strokeWidth={2.5} />
            </div>
            <div className="pm-auth-card-logo-name">Plexus Cloud</div>
          </div>

          <h2 className="pm-auth-title">Welcome back</h2>
          <p className="pm-auth-subtitle">Sign in to your account to continue.</p>

          {error && (
            <div className="pm-auth-error" role="alert">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="pm-auth-field">
              <label htmlFor="login-email" className="pm-auth-label">Email address</label>
              <div className="pm-auth-input-wrap">
                <Mail size={18} className="pm-auth-input-icon" />
                <input
                  id="login-email"
                  type="email"
                  className="pm-auth-input"
                  placeholder="you@plexuscloud.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  autoFocus
                  required
                />
              </div>
            </div>

            <div className="pm-auth-field">
              <label htmlFor="login-password" className="pm-auth-label">Password</label>
              <div className="pm-auth-input-wrap">
                <Lock size={18} className="pm-auth-input-icon" />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  className="pm-auth-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="pm-auth-eye"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="pm-auth-submit"
              disabled={submitting}
            >
              {submitting ? (
                <><Loader2 size={18} className="spin" /> Signing in…</>
              ) : (
                'Sign in'
              )}
            </button>
          </form>

          <div className="pm-auth-hint">
            Protected by Laravel Sanctum authentication.
          </div>
        </div>
      </div>
    </div>
  )
}
