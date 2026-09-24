import { Bell, AlertCircle, Menu, LogOut, User, Settings, Loader2 } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { usePermissions } from '../../context/PermissionContext'
import { useLocation } from 'react-router-dom'

const routeTitles = {
  '/': 'Dashboard Overview',
  '/partners': 'Partner Directory',
  '/bandwidth': 'Bandwidth Allocation',
  '/commission': 'Commission Management',
  '/support-centers': 'Support Centers',
  '/partner-accounts': 'Financial Accounts',
  '/reports': 'System Reports',
  '/settings': 'Platform Settings',
}

export default function Header({ onToggleSidebar, isMobile }) {
  const { user, logout } = useAuth()
  const { roles } = usePermissions()
  const { pathname } = useLocation()
  
  const [openDropdown, setOpenDropdown] = useState(null)
  const [loggingOut, setLoggingOut] = useState(false)
  const headerRef = useRef(null)

  const title = routeTitles[pathname] || 'Partner Management'
  
  const displayName = user?.name ?? 'Admin User'
  const displayEmail = user?.email ?? 'admin@plexuscloud.com'
  const displayRole = roles[0]
    ? roles[0].replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
    : 'System Admin'
  const initial = displayName.charAt(0).toUpperCase()

  const handleLogout = async () => {
    setOpenDropdown(null)
    setLoggingOut(true)
    await logout()
  }

  useEffect(() => {
    function handleClickOutside(event) {
      if (headerRef.current && !headerRef.current.contains(event.target)) {
        setOpenDropdown(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const toggleDropdown = (name) => {
    setOpenDropdown(openDropdown === name ? null : name)
  }

  return (
    <header className="pm-header" ref={headerRef}>
      <div className="pm-header-left">
        {isMobile && (
          <button
            className="pm-icon-btn"
            onClick={onToggleSidebar}
            aria-label="Open sidebar"
          >
            <Menu size={18} />
          </button>
        )}
        <div className="pm-page-breadcrumb d-none d-md-block">
          Plexus Cloud <span>/</span> {title}
        </div>
        {isMobile && (
          <div className="fw-bold fs-6">{title}</div>
        )}
      </div>

      <div className="pm-header-right">
        <div className="pm-status-pill d-none d-lg-flex">
          <div className="dot" />
          Environment: Production
        </div>

        {/* Alerts */}
        <div className="pm-dropdown-container">
          <button
            className="pm-icon-btn"
            onClick={() => toggleDropdown('alerts')}
          >
            <AlertCircle size={18} />
            <span className="pm-icon-badge">2</span>
          </button>
          {openDropdown === 'alerts' && (
            <div className="pm-dropdown-menu">
              <div className="pm-dropdown-header">System Alerts</div>
              <div className="pm-dropdown-item danger">
                <AlertCircle size={16} />
                <div>
                  <div className="fw-semibold">High Server Load</div>
                  <div className="small opacity-75">Just now</div>
                </div>
              </div>
              <div className="pm-dropdown-item">
                <AlertCircle size={16} className="text-warning" />
                <div>
                  <div className="fw-semibold">Payment Gateway Delay</div>
                  <div className="small opacity-75">10 mins ago</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Notifications */}
        <div className="pm-dropdown-container">
          <button
            className="pm-icon-btn"
            onClick={() => toggleDropdown('notifications')}
          >
            <Bell size={18} />
            <span className="pm-icon-badge">5</span>
          </button>
          {openDropdown === 'notifications' && (
            <div className="pm-dropdown-menu" style={{ width: 280 }}>
              <div className="pm-dropdown-header">Notifications</div>
              <div className="pm-dropdown-item">
                <div className="pm-avatar-circle" style={{ width: 32, height: 32, fontSize: '0.75rem' }}>TC</div>
                <div>
                  <div className="fw-semibold">New Partner Registered</div>
                  <div className="small opacity-75">TechCorp LLC joined.</div>
                </div>
              </div>
              <div className="pm-dropdown-item justify-content-center border-top">
                <a href="#" className="small fw-bold">View all</a>
              </div>
            </div>
          )}
        </div>

        {/* Profile */}
        <div className="pm-dropdown-container ms-1 ms-md-2 ps-1 ps-md-2 border-start">
          <button className="pm-avatar-btn" onClick={() => toggleDropdown('profile')}>
            <div className="pm-avatar-circle">{initial}</div>
            <div className="pm-avatar-info d-none d-sm-block">
              <div className="pm-avatar-name">{displayName}</div>
              <div className="pm-avatar-role">{displayRole}</div>
            </div>
          </button>

          {openDropdown === 'profile' && (
            <div className="pm-dropdown-menu">
              <div className="pm-dropdown-header">
                <div>{displayName}</div>
                <div className="fw-normal text-secondary" style={{ fontSize: '0.75rem' }}>{displayEmail}</div>
              </div>
              <div className="pm-dropdown-item"><User size={16} /> My Profile</div>
              <div className="pm-dropdown-item"><Settings size={16} /> Preferences</div>
              <div className="pm-divider" />
              <div className="pm-dropdown-item danger" onClick={handleLogout}>
                {loggingOut ? <Loader2 size={16} className="spin" /> : <LogOut size={16} />} 
                Sign Out
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
