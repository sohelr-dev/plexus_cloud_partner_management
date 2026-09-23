import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { NotificationProvider } from '../../context/NotificationContext'
import useMediaQuery from '../../hooks/useMediaQuery'
import Header from './Header'
import Sidebar from './Sidebar'

export default function AppLayout() {
  const isMobile = useMediaQuery('(max-width: 991.98px)')
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const { pathname } = useLocation()

  // Route change → close the mobile overlay
  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  // Switching desktop↔mobile resets transient state
  useEffect(() => {
    setMobileOpen(false)
  }, [isMobile])

  // Escape closes the mobile overlay
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') setMobileOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  const handleToggleSidebar = () => {
    if (isMobile) {
      setMobileOpen(true)
    } else {
      setCollapsed((c) => !c)
    }
  }

  return (
    <NotificationProvider>
      <div className={`pm-layout ${collapsed && !isMobile ? 'collapsed-desktop' : ''}`}>
        <Sidebar
          collapsed={collapsed}
          mobileOpen={mobileOpen}
          isMobile={isMobile}
          onToggleCollapse={() => setCollapsed((c) => !c)}
          onClose={() => setMobileOpen(false)}
        />

        {isMobile && mobileOpen && (
          <button
            type="button"
            className="pm-backdrop"
            aria-label="Close menu"
            onClick={() => setMobileOpen(false)}
          />
        )}

        <div className="pm-main-wrapper">
          <Header onToggleSidebar={handleToggleSidebar} isMobile={isMobile} />
          <main className="pm-content">
            <Outlet />
          </main>
        </div>
      </div>
    </NotificationProvider>
  )
}
