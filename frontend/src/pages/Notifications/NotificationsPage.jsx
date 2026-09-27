import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Bell,
  CheckCheck,
  Trash2,
  AlertCircle,
  Info,
  DollarSign,
  Wifi,
  ShieldAlert,
  Building2,
  Settings,
  Package,
  FileText,
  Filter,
  RefreshCw,
  ChevronLeft,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import {
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
} from '../../api/notifications'

const CATEGORY_META = {
  Partner:       { icon: Building2,   color: 'text-primary',   bg: 'bg-primary-subtle' },
  Finance:       { icon: DollarSign,  color: 'text-warning',   bg: 'bg-warning-subtle' },
  Bandwidth:     { icon: Wifi,        color: 'text-info',      bg: 'bg-info-subtle' },
  Equipment:     { icon: Package,     color: 'text-secondary', bg: 'bg-secondary-subtle' },
  Commission:    { icon: Settings,    color: 'text-success',   bg: 'bg-success-subtle' },
  SupportCenter: { icon: AlertCircle, color: 'text-warning',   bg: 'bg-warning-subtle' },
  Documents:     { icon: FileText,    color: 'text-info',      bg: 'bg-info-subtle' },
  Health:        { icon: ShieldAlert, color: 'text-danger',    bg: 'bg-danger-subtle' },
  System:        { icon: Info,        color: 'text-secondary', bg: 'bg-secondary-subtle' },
}

const SEVERITY_BADGE = {
  info:    'bg-info-subtle text-info',
  warning: 'bg-warning-subtle text-warning border border-warning-subtle',
  danger:  'bg-danger-subtle text-danger border border-danger-subtle',
  success: 'bg-success-subtle text-success',
}

function timeAgo(dateStr) {
  if (!dateStr) return ''
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (diff < 60) return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

export default function NotificationsPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [filterCategory, setFilterCategory] = useState('')
  const [filterRead, setFilterRead] = useState('')
  const [page, setPage] = useState(1)

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['notifications-page', page, filterCategory, filterRead],
    queryFn: () =>
      fetchNotifications({
        per_page: 20,
        page,
        ...(filterCategory ? { category: filterCategory } : {}),
        ...(filterRead === 'unread' ? { unread_only: true } : {}),
      }),
    keepPreviousData: true,
  })

  const notifications = data?.data || []
  const metaInfo = data?.meta || {}

  const readMutation = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications-page'] })
      queryClient.invalidateQueries({ queryKey: ['header-notifications'] })
    },
  })

  const markAllMutation = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications-page'] })
      queryClient.invalidateQueries({ queryKey: ['header-notifications'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteNotification,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications-page'] })
      queryClient.invalidateQueries({ queryKey: ['header-notifications'] })
    },
  })

  const handleMarkRead = (notif) => {
    if (!notif.read_at) readMutation.mutate(notif.id)
  }

  const handleDelete = (e, id) => {
    e.stopPropagation()
    if (window.confirm('Delete this notification?')) deleteMutation.mutate(id)
  }

  return (
    <div className="container-fluid p-3 p-md-4">
      {/* Page Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3 mb-4">
        <div className="d-flex align-items-center gap-3">
          <button
            className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1"
            onClick={() => navigate(-1)}
          >
            <ChevronLeft size={16} /> Back
          </button>
          <div>
            <h4 className="fw-bold mb-0 d-flex align-items-center gap-2">
              <Bell className="text-primary" size={22} />
              All Notifications
            </h4>
            <p className="text-secondary small mb-0">
              {metaInfo.total ? `${metaInfo.total} total` : '—'} &bull;{' '}
              <span className="fw-semibold text-primary">
                {metaInfo.unread_count ?? 0} unread
              </span>
            </p>
          </div>
        </div>
        <div className="d-flex gap-2 flex-wrap">
          <button
            className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw size={14} className={isFetching ? 'spin' : ''} />
            Refresh
          </button>
          {(metaInfo.unread_count ?? 0) > 0 && (
            <button
              className="btn btn-sm btn-primary d-flex align-items-center gap-2"
              onClick={() => markAllMutation.mutate()}
              disabled={markAllMutation.isPending}
            >
              <CheckCheck size={14} />
              {markAllMutation.isPending ? 'Marking...' : 'Mark All Read'}
            </button>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="card shadow-sm border-0 rounded-4 mb-4">
        <div className="card-body p-3">
          <div className="row g-2 align-items-center">
            <div className="col-auto d-flex align-items-center gap-1 text-secondary small">
              <Filter size={14} /> Filters:
            </div>
            <div className="col-md-3">
              <select
                className="form-select form-select-sm"
                value={filterCategory}
                onChange={(e) => { setFilterCategory(e.target.value); setPage(1) }}
              >
                <option value="">All Categories</option>
                {Object.keys(CATEGORY_META).map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="col-md-3">
              <select
                className="form-select form-select-sm"
                value={filterRead}
                onChange={(e) => { setFilterRead(e.target.value); setPage(1) }}
              >
                <option value="">All (Read &amp; Unread)</option>
                <option value="unread">Unread Only</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Notification List */}
      <div className="card shadow-sm border-0 rounded-4 overflow-hidden">
        {isLoading ? (
          <div className="p-5 text-center text-secondary">
            <div className="spinner-border spinner-border-sm text-primary me-2" role="status" />
            Loading notifications...
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-5 text-center text-secondary">
            <Bell size={42} className="opacity-25 mb-3" />
            <div className="fw-semibold mb-1">No notifications found</div>
            <div className="small">Try changing the category or read filter above.</div>
          </div>
        ) : (
          <ul className="list-group list-group-flush">
            {notifications.map((notif) => {
              const d = notif.data || {}
              const isUnread = !notif.read_at
              const category = d.category || 'System'
              const severity = d.severity || 'info'
              const catMeta = CATEGORY_META[category] || CATEGORY_META.System
              const Icon = catMeta.icon

              return (
                <li
                  key={notif.id}
                  className={`list-group-item list-group-item-action d-flex align-items-start gap-3 py-3 px-4 ${
                    isUnread ? 'bg-primary bg-opacity-10' : ''
                  }`}
                  style={{
                    cursor: 'pointer',
                    borderLeft: isUnread ? '4px solid var(--bs-primary)' : '4px solid transparent',
                    transition: 'background 0.2s',
                  }}
                  onClick={() => handleMarkRead(notif)}
                >
                  {/* Icon */}
                  <div
                    className={`rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 mt-1 ${catMeta.bg}`}
                    style={{ width: 38, height: 38 }}
                  >
                    <Icon size={17} className={catMeta.color} />
                  </div>

                  {/* Body */}
                  <div className="flex-grow-1 overflow-hidden">
                    <div className="d-flex align-items-center justify-content-between gap-2 mb-1 flex-wrap">
                      <div className="d-flex align-items-center gap-2 flex-wrap">
                        <span className={`badge ${SEVERITY_BADGE[severity] || SEVERITY_BADGE.info}`} style={{ fontSize: '0.67rem' }}>
                          {severity.toUpperCase()}
                        </span>
                        <span className="badge bg-body-secondary text-secondary border" style={{ fontSize: '0.67rem' }}>
                          {category}
                        </span>
                        {isUnread && (
                          <span
                            className="badge bg-primary"
                            style={{ fontSize: '0.62rem', letterSpacing: '0.5px' }}
                          >
                            NEW
                          </span>
                        )}
                      </div>
                      <span className="text-secondary text-nowrap" style={{ fontSize: '0.72rem' }}>
                        {timeAgo(notif.created_at)}
                      </span>
                    </div>

                    <div className={`fw-semibold ${isUnread ? 'text-body' : 'text-secondary'}`} style={{ fontSize: '0.88rem' }}>
                      {d.title || 'System Notification'}
                    </div>
                    <div className="text-secondary mt-1" style={{ fontSize: '0.8rem' }}>
                      {d.message}
                    </div>

                    {d.action_url && (
                      <div className="mt-1">
                        <span className="text-primary" style={{ fontSize: '0.72rem' }}>
                          → {d.action_url}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div className="d-flex flex-column gap-1 flex-shrink-0 ms-2">
                    {isUnread && (
                      <button
                        className="btn btn-sm btn-outline-primary py-1 px-2"
                        style={{ fontSize: '0.7rem', lineHeight: 1 }}
                        title="Mark as read"
                        onClick={(e) => { e.stopPropagation(); readMutation.mutate(notif.id) }}
                        disabled={readMutation.isPending}
                      >
                        <CheckCheck size={12} />
                      </button>
                    )}
                    <button
                      className="btn btn-sm btn-outline-danger py-1 px-2"
                      style={{ fontSize: '0.7rem', lineHeight: 1 }}
                      title="Delete"
                      onClick={(e) => handleDelete(e, notif.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {/* Pagination */}
      {metaInfo.last_page > 1 && (
        <div className="d-flex justify-content-center align-items-center gap-3 mt-4">
          <button
            className="btn btn-sm btn-outline-secondary"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </button>
          <span className="small text-secondary">
            Page {metaInfo.current_page} of {metaInfo.last_page}
          </span>
          <button
            className="btn btn-sm btn-outline-secondary"
            disabled={page >= metaInfo.last_page}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}
