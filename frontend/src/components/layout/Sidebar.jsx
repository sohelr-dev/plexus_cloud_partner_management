import {
  BarChart3,
  Building2,
  ChevronsLeft,
  ChevronsRight,
  Coins,
  LayoutDashboard,
  Network,
  Settings,
  ShieldAlert,
  Smartphone,
  Users,
  Wallet,
  X,
  Zap,
  BookOpen
} from 'lucide-react'
import { NavLink } from 'react-router-dom'

import { usePermissions } from '../../context/PermissionContext'

const navGroups = [
  {
    title: 'Core',
    items: [
      { label: 'Dashboard', to: '/', icon: LayoutDashboard },
      { label: 'Partners', to: '/partners', icon: Users, permission: 'partner.view' },
      { label: 'Bandwidth', to: '/bw-dashboard', icon: Network, permission: ['bandwidth.view', 'bandwidth.create'] },
      { label: 'End Devices', to: '/end-devices', icon: Smartphone, permission: ['device.view', 'equipment.view'] },
    ]
  },
  {
    title: 'Finance & Ops',
    items: [
      { label: 'Commission', to: '/commission', icon: Coins, permission: ['commission.view', 'commission.approve'] },
      { label: 'Support Centers', to: '/support-centers', icon: Building2, permission: 'support-center.view' },
      { label: 'Partner Accounts', to: '/partner-accounts', icon: Wallet, permission: ['partner-account.view', 'payment.view'] },
    ]
  },
  {
    title: 'Administration',
    items: [
      { label: 'Audit Logs', to: '/audit-logs', icon: ShieldAlert, permission: 'audit-log.view' },
      { label: 'Reports', to: '/reports', icon: BarChart3, permission: ['report.view', 'report.export'] },
      { label: 'Settings', to: '/settings', icon: Settings, permission: 'setting.manage' },
    ]
  },
  {
    title: 'Help & Support',
    items: [
      { label: 'User Guide', to: '/user-guide', icon: BookOpen },
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
  const { can } = usePermissions()

  const visibleNavGroups = navGroups
    .map(group => ({
      ...group,
      items: group.items.filter(item => !item.permission || can(item.permission))
    }))
    .filter(group => group.items.length > 0)

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
        {visibleNavGroups.map((group, i) => (
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
