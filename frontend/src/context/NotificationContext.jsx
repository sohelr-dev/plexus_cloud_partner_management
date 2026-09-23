import { createContext, useContext, useMemo, useState } from 'react'

const NotificationContext = createContext(null)

const initialNotifications = [
  {
    id: 1,
    type: 'partner',
    title: 'New partner pending approval',
    message: 'Partner "SkyNet ISP" submitted registration.',
    time: '5m ago',
    unread: true,
  },
  {
    id: 2,
    type: 'finance',
    title: 'Payment received',
    message: '৳45,000 received from PT-000121.',
    time: '32m ago',
    unread: true,
  },
  {
    id: 3,
    type: 'bandwidth',
    title: 'Bandwidth upgrade request',
    message: 'PT-000108 requested a 100 Mbps upgrade.',
    time: '2h ago',
    unread: true,
  },
  {
    id: 4,
    type: 'document',
    title: 'Document expiring soon',
    message: 'Trade license of PT-000092 expires in 15 days.',
    time: '1d ago',
    unread: false,
  },
]

const initialAlerts = [
  {
    id: 101,
    severity: 'danger',
    title: 'Credit limit exceeded',
    message: 'PT-000077 crossed 95% credit utilization.',
    time: '18m ago',
  },
  {
    id: 102,
    severity: 'warning',
    title: 'High bandwidth utilization',
    message: 'PT-000054 is at 92% for 3 hours.',
    time: '1h ago',
  },
  {
    id: 103,
    severity: 'warning',
    title: 'Warranty expiring',
    message: '12 ONU devices of PT-000086 out of warranty in 7 days.',
    time: '6h ago',
  },
]

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState(initialNotifications)
  const [alerts, setAlerts] = useState(initialAlerts)

  const value = useMemo(
    () => ({
      notifications,
      alerts,
      unreadCount: notifications.filter((n) => n.unread).length,
      alertCount: alerts.length,
      markAllRead: () =>
        setNotifications((items) => items.map((n) => ({ ...n, unread: false }))),
      clearAlerts: () => setAlerts([]),
    }),
    [notifications, alerts],
  )

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const ctx = useContext(NotificationContext)
  if (!ctx) {
    throw new Error('useNotifications must be used within NotificationProvider')
  }
  return ctx
}
