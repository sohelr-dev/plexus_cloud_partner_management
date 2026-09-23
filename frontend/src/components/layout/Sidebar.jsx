import {
  BarChart3,
  Building2,
  ChevronsLeft,
  ChevronsRight,
  Cloud,
  Coins,
  LayoutDashboard,
  Network,
  Settings,
  Users,
  Wallet,
  X,
} from 'lucide-react'
import { NavLink } from 'react-router-dom'

const navItems = [
  { label: 'Dashboard', to: '/', icon: LayoutDashboard },
  { label: 'Partners', to: '/partners', icon: Users },
  { label: 'Bandwidth', to: '/bandwidth', icon: Network },
  { label: 'Commission', to: '/commission', icon: Coins },
  { label: 'Support Centers', to: '/support-centers', icon: Building2 },
  { label: 'Partner Accounts', to: '/partner-accounts', icon: Wallet },
  { label: 'Reports', to: '/reports', icon: BarChart3 },
  { label: 'Settings', to: '/settings', icon: Settings },
]

export default function Sidebar({
  collapsed,
  mobileOpen,
  isMobile,
  onToggleCollapse,
  onClose,
}) {
  const classes = [
    'pm-sidebar',
    collapsed && !isMobile ? 'pm-collapsed' : '',
    mobileOpen && isMobile ? 'pm-mobile-open' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <nav className={classes} aria-label="Main navigation">
      <div className="pm-sidebar-header">
        <div className="pm-brand">
          <span className="pm-brand-logo" aria-hidden="true">
            <Cloud size={20} color="#fff" />
          </span>
          <div className="pm-brand-text">
            <div className="fw-bold" style={{ fontSize: '0.95rem' }}>
              Plexus Cloud
            </div>
            <div className="small text-white-50" style={{ fontSize: '0.75rem' }}>Partner Mgmt</div>
          </div>
        </div>

        {isMobile ? (
          <button
            type="button"
            className="pm-sidebar-toggle"
            onClick={onClose}
            aria-label="Close sidebar"
          >
            <X size={18} />
          </button>
        ) : (
          <button
            type="button"
            className="pm-sidebar-toggle"
            onClick={onToggleCollapse}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={collapsed ? 'Expand' : 'Collapse'}
          >
            {collapsed ? <ChevronsRight size={18} /> : <ChevronsLeft size={18} />}
          </button>
        )}
      </div>

      <div className="pm-nav-list">
        {navItems.map(({ label, to, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) => `pm-nav-link${isActive ? ' active' : ''}`}
            title={collapsed && !isMobile ? label : undefined}
          >
            <span className="pm-nav-icon" aria-hidden="true">
              <Icon size={20} />
            </span>
            <span className="pm-nav-label">{label}</span>
          </NavLink>
        ))}
      </div>

      <div className="pm-sidebar-footer">
        <div className="pm-sidebar-footer-text small text-white-50">
          Partner Management Module · v0.1
        </div>
      </div>
    </nav>
  )
}
