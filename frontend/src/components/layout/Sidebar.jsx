import {
  BarChart3,
  Building2,
  ChevronsLeft,
  ChevronsRight,
  Coins,
  LayoutDashboard,
  Network,
  Settings,
  Users,
  Wallet,
  X,
  Zap
} from 'lucide-react'
import { NavLink } from 'react-router-dom'

const navGroups = [
  {
    title: 'Core',
    items: [
      { label: 'Dashboard', to: '/', icon: LayoutDashboard },
      { label: 'Partners', to: '/partners', icon: Users },
      { label: 'Bandwidth', to: '/bandwidth', icon: Network },
    ]
  },
  {
    title: 'Finance & Ops',
    items: [
      { label: 'Commission', to: '/commission', icon: Coins },
      { label: 'Support Centers', to: '/support-centers', icon: Building2 },
      { label: 'Partner Accounts', to: '/partner-accounts', icon: Wallet },
    ]
  },
  {
    title: 'Administration',
    items: [
      { label: 'Reports', to: '/reports', icon: BarChart3 },
      { label: 'Settings', to: '/settings', icon: Settings },
    ]
  }
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
  ].filter(Boolean).join(' ')

  return (
    <nav className={classes} aria-label="Main navigation">
      <div className="pm-sidebar-header">
        <div className="pm-brand">
          <span className="pm-brand-icon" aria-hidden="true">
            <Zap size={20} color="#fff" strokeWidth={2.5} />
          </span>
          <div className="pm-brand-text">
            <div className="pm-brand-name">Plexus Cloud</div>
            <div className="pm-brand-sub">Partner Mgmt</div>
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
        {navGroups.map((group, i) => (
          <div key={i}>
            <div className="pm-nav-section">{group.title}</div>
            {group.items.map(({ label, to, icon: Icon, badge }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) => `pm-nav-link${isActive ? ' active' : ''}`}
                title={collapsed && !isMobile ? label : undefined}
              >
                <span className="pm-nav-icon" aria-hidden="true">
                  <Icon size={18} strokeWidth={2.5} />
                </span>
                <span className="pm-nav-label">{label}</span>
                {badge && <span className="pm-nav-badge">{badge}</span>}
              </NavLink>
            ))}
          </div>
        ))}
      </div>

      <div className="pm-sidebar-footer">
        <div className="pm-sb-footer-inner">
          <div className="pm-sb-status-dot" />
          <div className="pm-sb-footer-text">
            System Online <br/>
            <span style={{opacity: 0.5}}>v0.2 Premium</span>
          </div>
        </div>
      </div>
    </nav>
  )
}
