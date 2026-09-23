import { Bell, AlertCircle, Menu, LogOut, User, Settings, CheckCircle } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'

export default function Header({ title = 'Dashboard', onToggleSidebar, isMobile }) {
  const [openDropdown, setOpenDropdown] = useState(null) // 'alerts', 'notifications', 'profile', null
  const headerRef = useRef(null)

  // Click outside to close dropdowns
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
      <div className="d-flex align-items-center gap-3">
        {isMobile && (
          <button 
            className="btn btn-light d-flex align-items-center justify-content-center p-2" 
            onClick={onToggleSidebar}
            aria-label="Open sidebar"
          >
            <Menu size={20} />
          </button>
        )}
        <div>
          <h1 className="h5 mb-0 fw-bold">{title}</h1>
          <span className="text-secondary small d-none d-sm-inline">Partner Management Module</span>
        </div>
      </div>
      
      <div className="d-flex align-items-center gap-3">
        <span className="badge text-bg-success d-none d-md-inline" title="Current Environment Status">
          <CheckCircle size={12} className="me-1" style={{ marginBottom: '2px' }} />
          System Online
        </span>
        
        <div className="d-flex align-items-center gap-2">
          {/* Alerts Dropdown */}
          <div className="pm-dropdown-container">
            <button 
              className="pm-icon-btn" 
              aria-label="Alerts" 
              onClick={() => toggleDropdown('alerts')}
            >
              <AlertCircle size={18} />
              <span className="pm-icon-badge">2</span>
            </button>
            {openDropdown === 'alerts' && (
              <div className="pm-dropdown-menu" style={{ width: '280px' }}>
                <div className="pm-dropdown-header">System Alerts</div>
                <div className="pm-dropdown-item">
                  <AlertCircle size={16} className="text-danger" />
                  <div>
                    <div className="fw-semibold">High Server Load</div>
                    <div className="text-muted" style={{ fontSize: '0.75rem' }}>Just now</div>
                  </div>
                </div>
                <div className="pm-dropdown-item">
                  <AlertCircle size={16} className="text-warning" />
                  <div>
                    <div className="fw-semibold">Payment Gateway Delay</div>
                    <div className="text-muted" style={{ fontSize: '0.75rem' }}>10 mins ago</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Notifications Dropdown */}
          <div className="pm-dropdown-container">
            <button 
              className="pm-icon-btn" 
              aria-label="Notifications"
              onClick={() => toggleDropdown('notifications')}
            >
              <Bell size={18} />
              <span className="pm-icon-badge">5</span>
            </button>
            {openDropdown === 'notifications' && (
              <div className="pm-dropdown-menu" style={{ width: '300px' }}>
                <div className="pm-dropdown-header">Recent Notifications</div>
                <div className="pm-dropdown-item">
                  <Bell size={16} className="text-primary" />
                  <div>
                    <div className="fw-semibold">New Partner Registered</div>
                    <div className="text-muted" style={{ fontSize: '0.75rem' }}>TechCorp LLC joined the network.</div>
                  </div>
                </div>
                <div className="pm-dropdown-item text-center">
                  <a href="#" className="text-decoration-none text-primary fw-semibold" style={{ fontSize: '0.8rem' }}>View all</a>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Profile Dropdown */}
        <div className="d-flex align-items-center gap-2 ms-2 border-start ps-3 pm-dropdown-container">
          <div 
            className="d-flex align-items-center gap-2 cursor-pointer" 
            style={{ cursor: 'pointer' }}
            onClick={() => toggleDropdown('profile')}
          >
            <span
              className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center fw-bold"
              style={{ width: 34, height: 34, fontSize: 14 }}
              aria-hidden="true"
            >
              A
            </span>
            <div className="d-none d-sm-flex flex-column">
              <span className="small fw-semibold lh-1">Admin User</span>
              <span className="small text-secondary" style={{ fontSize: '0.75rem' }}>Administrator</span>
            </div>
          </div>

          {openDropdown === 'profile' && (
            <div className="pm-dropdown-menu">
              <div className="pm-dropdown-header">
                Admin User<br/>
                <span className="text-muted fw-normal" style={{ fontSize: '0.75rem' }}>admin@plexuscloud.com</span>
              </div>
              <div className="pm-dropdown-item">
                <User size={16} /> My Profile
              </div>
              <div className="pm-dropdown-item">
                <Settings size={16} /> Account Settings
              </div>
              <div className="pm-dropdown-item text-danger border-top mt-1">
                <LogOut size={16} /> Logout
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
