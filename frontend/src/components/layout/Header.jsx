import { Bell, AlertCircle, Menu, LogOut, User, Settings, Loader2, CheckCheck, Info, ShieldAlert, Wifi, DollarSign, Building2, ExternalLink } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { usePermissions } from '../../context/PermissionContext'
import { useLocation, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchNotifications, markNotificationRead, markAllNotificationsRead } from '../../api/notifications'

function timeAgo(dateStr) {
  if (!dateStr) return ''
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (diff < 60) return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

const routeTitles = {
  '/': 'Dashboard Overview',
  '/partners': 'Partner Directory',
  '/bw-dashboard': 'Bandwidth Allocation',
  '/commission': 'Commission Management',
  '/support-centers': 'Support Centers',
  '/partner-accounts': 'Financial Accounts',
  '/reports': 'Executive Reports Hub',
  '/settings': 'Platform Settings',
}

export default function Header({ onToggleSidebar, isMobile }) {
  const { user, logout } = useAuth()
  const { roles } = usePermissions()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  
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

  // Live Notifications Query
  const { data: notifData } = useQuery({
    queryKey: ['header-notifications'],
    queryFn: () => fetchNotifications({ per_page: 8 }),
    refetchInterval: 30000,
  })

  const notifications = notifData?.data || []
  const unreadCount = notifData?.meta?.unread_count || 0

  const readMutation = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['header-notifications'] }),
  })

  const markAllMutation = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['header-notifications'] }),
  })

  const handleNotificationClick = (notif) => {
    if (!notif.read_at) {
      readMutation.mutate(notif.id)
    }
    setOpenDropdown(null)
    const actionUrl = notif.data?.action_url
    if (actionUrl) {
      navigate(actionUrl)
    }
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
            className="pm-icon-btn position-relative"
            onClick={() => toggleDropdown('notifications')}
            title="System Notifications"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="pm-icon-badge">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          {openDropdown === 'notifications' && (
            <div className="pm-dropdown-menu" style={{ width: 340, maxHeight: 420, overflowY: 'auto' }}>
              <div className="pm-dropdown-header d-flex justify-content-between align-items-center py-2 px-3">
                <span className="fw-bold">Notifications ({unreadCount} unread)</span>
                {unreadCount > 0 && (
                  <button
                    className="btn btn-link btn-sm p-0 text-decoration-none small text-primary"
                    onClick={() => markAllMutation.mutate()}
                    disabled={markAllMutation.isPending}
                    style={{ fontSize: '0.72rem' }}
                  >
                    <CheckCheck size={13} className="me-1" />
                    Mark all read
                  </button>
                )}
              </div>

              {notifications.length > 0 ? (
                notifications.map((notif) => {
                  const data = notif.data || {}
                  const isUnread = !notif.read_at
                  const category = data.category || 'System'
                  
                  return (
                    <div
                      key={notif.id}
                      className={`pm-dropdown-item d-flex align-items-start gap-2 py-2 px-3 border-bottom`}
                      style={{
                        cursor: 'pointer',
                        background: isUnread ? 'rgba(var(--bs-primary-rgb), 0.08)' : 'transparent',
                        borderLeft: isUnread ? '3px solid var(--bs-primary)' : '3px solid transparent',
                      }}
                      onClick={() => handleNotificationClick(notif)}
                    >
                      <div className="mt-1 flex-shrink-0">
                        {category === 'Finance'   && <DollarSign size={15} className="text-warning" />}
                        {category === 'Bandwidth' && <Wifi size={15} className="text-info" />}
                        {category === 'Health'    && <ShieldAlert size={15} className="text-danger" />}
                        {category === 'Partner'   && <Building2 size={15} className="text-primary" />}
                        {!['Finance','Bandwidth','Health','Partner'].includes(category) && (
                          <Info size={15} className="text-secondary" />
                        )}
                      </div>
                      <div className="flex-grow-1 overflow-hidden">
                        <div className="d-flex align-items-center justify-content-between gap-1 mb-1">
                          <div className="d-flex align-items-center gap-1">
                            <span className="badge bg-body-secondary text-secondary border" style={{ fontSize: '0.6rem' }}>
                              {category}
                            </span>
                            {isUnread && (
                              <span className="badge bg-primary" style={{ fontSize: '0.6rem' }}>NEW</span>
                            )}
                          </div>
                          <span className="text-secondary" style={{ fontSize: '0.65rem' }}>
                            {timeAgo(notif.created_at)}
                          </span>
                        </div>
                        <div className={`text-truncate small ${isUnread ? 'fw-semibold text-body' : 'text-secondary'}`} style={{ fontSize: '0.8rem' }}>
                          {data.title || 'System Notification'}
                        </div>
                        <div className="text-secondary text-truncate" style={{ fontSize: '0.72rem', lineHeight: 1.3 }}>
                          {data.message}
                        </div>
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="p-4 text-center text-secondary small">
                  <Bell size={24} className="opacity-25 mb-1" />
                  <div>No notifications right now</div>
                </div>
              )}

              <div
                className="pm-dropdown-item justify-content-center border-top py-2 bg-body-tertiary d-flex align-items-center gap-2"
                style={{ cursor: 'pointer' }}
                onClick={() => { setOpenDropdown(null); navigate('/notifications') }}
              >
                <ExternalLink size={12} className="text-primary" />
                <span className="small text-primary fw-semibold" style={{ fontSize: '0.75rem' }}>
                  See all notifications
                </span>
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
