import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Activity,
  Calendar,
  Filter,
  History as HistoryIcon,
  PlusCircle,
  RefreshCw,
  Search,
  User,
} from 'lucide-react'
import {
  createHistoryEvent,
  fetchPartnerHistory,
  HISTORY_MODULES,
  HISTORY_SEVERITIES,
  severityBadgeClass,
  severityDotColor,
} from '../../api/history'
import { usePermissions } from '../../context/PermissionContext'

/* Helpers  */

const fmtDateTime = (value) =>
  value
    ? new Date(value).toLocaleString(undefined, {
      year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit',
    })
    : '—'

const fmtDate = (value) => (value ? new Date(value).toLocaleDateString() : '—')

const moduleIconColor = (module) => {
  switch (module) {
    case 'Financial': return '#10b981'
    case 'Bandwidth': return '#3b82f6'
    case 'Commission': return '#8b5cf6'
    case 'Support Center': return '#ec4899'
    case 'Documents': return '#f59e0b'
    case 'Equipment': return '#06b6d4'
    case 'Approval': return '#22c55e'
    case 'Marketing': return '#eab308'
    default: return '#64748b'
  }
}

/* Component  */

export default function HistoryTimelineTab({ partnerId }) {
  const queryClient = useQueryClient()
  const { can } = usePermissions()

  const [filters, setFilters] = useState({ module: '', event_type: '', severity: '', search: '', date_from: '', date_to: '' })
  const [page, setPage] = useState(1)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({
    event_type: '',
    module: 'Business',
    title: '',
    description: '',
    severity: 'Info',
    event_date: new Date().toISOString().slice(0, 10),
  })

  const params = useMemo(
    () => ({ ...filters, page, per_page: 25 }),
    [filters, page],
  )

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['partnerHistory', partnerId, params],
    queryFn: () => fetchPartnerHistory(partnerId, params),
    enabled: Boolean(partnerId),
  })

  const addMutation = useMutation({
    mutationFn: (payload) => createHistoryEvent(partnerId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partnerHistory', partnerId] })
      setShowAdd(false)
      setForm({ event_type: '', module: 'Business', title: '', description: '', severity: 'Info', event_date: new Date().toISOString().slice(0, 10) })
    },
    onError: (err) => alert(err?.response?.data?.message ?? 'Could not record the event.'),
  })

  const events = data?.events ?? []
  const meta = data?.meta ?? {}
  const summary = meta.summary ?? {}
  const byModule = summary.by_module ?? {}

  const resetFilters = () => {
    setFilters({ module: '', event_type: '', severity: '', search: '', date_from: '', date_to: '' })
    setPage(1)
  }

  const activeFilterCount = Object.values(filters).filter(Boolean).length

  const grouped = useMemo(() => {
    const map = new Map()
    events.forEach((e) => {
      const key = e.event_date ? new Date(e.event_date).toDateString() : 'Unknown'
      if (!map.has(key)) map.set(key, [])
      map.get(key).push(e)
    })
    return Array.from(map.entries())
  }, [events])

  return (
    <div className="p-3">
      {/* KPI strip */}
      <div className="pm-stat-row mb-3">
        <div className="pm-stat-card pm-stat-blue">
          <div className="pm-stat-icon"><HistoryIcon size={18} strokeWidth={2.5} /></div>
          <div className="pm-stat-body">
            <div className="pm-stat-value">{summary.total_events ?? 0}</div>
            <div className="pm-stat-label">Total History Events</div>
          </div>
        </div>
        <div className="pm-stat-card pm-stat-green">
          <div className="pm-stat-icon"><Activity size={18} strokeWidth={2.5} /></div>
          <div className="pm-stat-body">
            <div className="pm-stat-value">{Object.keys(byModule).length}</div>
            <div className="pm-stat-label">Active Modules</div>
          </div>
        </div>
        <div className="pm-stat-card pm-stat-violet">
          <div className="pm-stat-icon"><Calendar size={18} strokeWidth={2.5} /></div>
          <div className="pm-stat-body">
            <div className="pm-stat-value" style={{ fontSize: '0.9rem' }}>{fmtDate(summary.first_event_at)}</div>
            <div className="pm-stat-label">First Event</div>
          </div>
        </div>
        <div className="pm-stat-card pm-stat-amber">
          <div className="pm-stat-icon"><Calendar size={18} strokeWidth={2.5} /></div>
          <div className="pm-stat-body">
            <div className="pm-stat-value" style={{ fontSize: '0.9rem' }}>{fmtDate(summary.last_event_at)}</div>
            <div className="pm-stat-label">Latest Event</div>
          </div>
        </div>
      </div>

      <div className="pm-card mb-3">
        <div className="pm-card-header">
          <h6 className="pm-card-title mb-0"><Filter size={16} className="me-2" />History by Module</h6>
          <span className="text-muted" style={{ fontSize: '0.7rem' }}>filters</span>
        </div>
        <div className="d-flex flex-wrap gap-2 px-3 pb-3 pt-1">
          <button
            className={`btn btn-sm ${!filters.module ? 'btn-primary' : 'btn-outline-secondary'}`}
            style={{ fontSize: '0.72rem' }}
            onClick={() => { setFilters({ ...filters, module: '' }); setPage(1) }}
          >
            All ({summary.total_events ?? 0})
          </button>
          {HISTORY_MODULES.map((m) => {
            const count = byModule[m] ?? 0
            if (!count) return null
            return (
              <button
                key={m}
                className={`btn btn-sm ${filters.module === m ? 'btn-primary' : 'btn-outline-secondary'}`}
                style={{ fontSize: '0.72rem' }}
                onClick={() => { setFilters({ ...filters, module: m }); setPage(1) }}
              >
                <span className="d-inline-block rounded-circle me-1" style={{ width: 7, height: 7, background: moduleIconColor(m) }} />
                {m} ({count})
              </button>
            )
          })}
        </div>
      </div>

      {/* Filter toolbar */}
      <div className="pm-card mb-3">
        <div className="pm-card-header">
          <h6 className="pm-card-title mb-0">
            <Search size={16} className="me-2" />Filter Timeline
            {activeFilterCount > 0 && <span className="pm-badge pm-badge-blue ms-2">{activeFilterCount} active</span>}
          </h6>
          <div className="d-flex gap-2">
            <button className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1" onClick={() => refetch()} disabled={isFetching}>
              <RefreshCw size={13} className={isFetching ? 'spin' : ''} /> Refresh
            </button>
            {can('partner.update') && (
              <button className="btn btn-sm btn-primary d-flex align-items-center gap-1" onClick={() => setShowAdd(true)}>
                <PlusCircle size={13} /> Add Event
              </button>
            )}
          </div>
        </div>

        <div className="row g-2 px-3 pb-3 pt-1">
          <div className="col-md-4">
            <input className="form-control form-control-sm" placeholder="Search title, description, reference…" value={filters.search} onChange={(e) => { setFilters({ ...filters, search: e.target.value }); setPage(1) }} />
          </div>
          <div className="col-md-3">
            <select className="form-select form-select-sm" value={filters.event_type} onChange={(e) => { setFilters({ ...filters, event_type: e.target.value }); setPage(1) }}>
              <option value="">All Event Types</option>
              {(meta.event_types ?? []).map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="col-md-2">
            <select className="form-select form-select-sm" value={filters.severity} onChange={(e) => { setFilters({ ...filters, severity: e.target.value }); setPage(1) }}>
              <option value="">All Severity</option>
              {HISTORY_SEVERITIES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="col-md-3 d-flex gap-2">
            <input type="date" className="form-control form-control-sm" value={filters.date_from} onChange={(e) => { setFilters({ ...filters, date_from: e.target.value }); setPage(1) }} />
            <input type="date" className="form-control form-control-sm" value={filters.date_to} onChange={(e) => { setFilters({ ...filters, date_to: e.target.value }); setPage(1) }} />
          </div>
          {activeFilterCount > 0 && (
            <div className="col-12">
              <button className="btn btn-sm btn-link p-0 text-decoration-none" style={{ fontSize: '0.72rem' }} onClick={resetFilters}>
                Clear all filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Timeline */}
      <div className="pm-card">
        <div className="pm-card-header">
          <h6 className="pm-card-title mb-0">
            <Activity size={16} className="me-2" />Activity Timeline
            <span className="text-muted ms-2" style={{ fontSize: '0.72rem' }}>{meta.total ?? 0} events</span>
          </h6>
        </div>

        <div className="px-3 pb-3">
          {isLoading ? (
            <div className="text-center py-5"><span className="spinner-border spinner-border-sm me-2" />Loading history…</div>
          ) : events.length ? (
            grouped.map(([day, dayEvents]) => (
              <div key={day} className="mb-4">
                {/* Date divider */}
                <div className="d-flex align-items-center gap-2 mb-2">
                  <span className="pm-badge pm-badge-secondary" style={{ fontSize: '0.68rem' }}>
                    {new Date(day).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: '2-digit' })}
                  </span>
                  <div className="flex-grow-1 border-top" />
                  <span className="text-muted" style={{ fontSize: '0.68rem' }}>{dayEvents.length} event{dayEvents.length > 1 ? 's' : ''}</span>
                </div>

                {/* Events for the day */}
                {dayEvents.map((e, idx) => (
                  <div key={e.id} className="d-flex gap-3 position-relative pb-3">
                    {/* Rail */}
                    <div className="d-flex flex-column align-items-center" style={{ width: 22 }}>
                      <span
                        className="rounded-circle flex-shrink-0"
                        style={{
                          width: 11, height: 11,
                          background: severityDotColor(e.severity),
                          boxShadow: `0 0 0 3px ${severityDotColor(e.severity)}22`,
                          marginTop: 5,
                        }}
                      />
                      {!(grouped.length === 1 && idx === dayEvents.length - 1) && (
                        <div className="flex-grow-1" style={{ width: 2, background: '#e5e7eb', marginTop: 3 }} />
                      )}
                    </div>

                    {/* Card */}
                    <div className="flex-grow-1 border rounded-3 px-3 py-2" style={{ background: '#fbfcfe' }}>
                      <div className="d-flex flex-wrap align-items-center gap-2">
                        <span className="fw-semibold" style={{ fontSize: '0.84rem' }}>{e.title ?? e.event_type}</span>
                        <span className={severityBadgeClass(e.severity)} style={{ fontSize: '0.64rem' }}>{e.event_type}</span>
                        <span className="pm-badge pm-badge-blue" style={{ fontSize: '0.62rem' }}>
                          <span className="d-inline-block rounded-circle me-1" style={{ width: 6, height: 6, background: moduleIconColor(e.module) }} />
                          {e.module}
                        </span>
                      </div>

                      {e.description && (
                        <div className="text-secondary mt-1" style={{ fontSize: '0.75rem' }}>{e.description}</div>
                      )}

                      <div className="d-flex flex-wrap align-items-center gap-3 mt-1 text-muted" style={{ fontSize: '0.68rem' }}>
                        <span className="d-flex align-items-center gap-1">
                          <Calendar size={11} /> {fmtDateTime(e.event_date)}
                        </span>
                        {e.performed_by && (
                          <span className="d-flex align-items-center gap-1">
                            <User size={11} /> {e.performed_by}
                          </span>
                        )}
                        {e.reference_label && (
                          <span className="d-flex align-items-center gap-1">
                            Ref: <strong>{e.reference_label}</strong>
                          </span>
                        )}
                      </div>

                      {/* Meta snapshot */}
                      {e.meta && Object.keys(e.meta).length > 0 && (
                        <div className="d-flex flex-wrap gap-2 mt-2">
                          {Object.entries(e.meta).map(([k, v]) => (
                            <span key={k} className="pm-badge pm-badge-secondary" style={{ fontSize: '0.62rem' }}>
                              {k.replace(/_/g, ' ')}: {String(v)}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ))
          ) : (
            <div className="text-center py-5 text-muted">
              <HistoryIcon size={32} className="mb-2 d-block mx-auto text-secondary" />
              <div style={{ fontSize: '0.85rem' }}>
                {activeFilterCount > 0 ? 'No history events match the current filters.' : 'No history recorded yet.'}
              </div>
              {activeFilterCount > 0 && (
                <button className="btn btn-sm btn-outline-secondary mt-2" onClick={resetFilters}>Clear filters</button>
              )}
            </div>
          )}
        </div>

        {/* Pagination */}
        {meta.last_page > 1 && (
          <div className="pm-table-footer">
            <span className="text-muted" style={{ fontSize: '0.72rem' }}>
              Page {meta.current_page} of {meta.last_page} · {meta.total} events
            </span>
            <div className="d-flex gap-2">
              <button className="btn btn-sm btn-outline-secondary" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Previous</button>
              <button className="btn btn-sm btn-outline-secondary" disabled={page >= meta.last_page} onClick={() => setPage((p) => p + 1)}>Next</button>
            </div>
          </div>
        )}
      </div>

      {/* ══ Add Manual Event Modal ══ */}
      {showAdd && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title fw-bold">Add History Event</h5>
                <button type="button" className="btn-close" onClick={() => setShowAdd(false)} />
              </div>
              <div className="modal-body">
                <div className="alert alert-info py-2 small">
                  Use this for events not captured automatically — e.g. “Contract Renewed”, “Relationship Meeting Held”.
                </div>
                <div className="row g-3">
                  <div className="col-md-7">
                    <label className="form-label small fw-semibold">Event Type *</label>
                    <input className="form-control" value={form.event_type} onChange={(e) => setForm({ ...form, event_type: e.target.value })} placeholder="e.g. Contract Renewed" />
                  </div>
                  <div className="col-md-5">
                    <label className="form-label small fw-semibold">Module *</label>
                    <select className="form-select" value={form.module} onChange={(e) => setForm({ ...form, module: e.target.value })}>
                      {HISTORY_MODULES.map((m) => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                  <div className="col-md-8">
                    <label className="form-label small fw-semibold">Title</label>
                    <input className="form-control" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Short headline" />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label small fw-semibold">Severity</label>
                    <select className="form-select" value={form.severity} onChange={(e) => setForm({ ...form, severity: e.target.value })}>
                      {HISTORY_SEVERITIES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="col-md-4">
                    <label className="form-label small fw-semibold">Event Date</label>
                    <input type="date" className="form-control" value={form.event_date} onChange={(e) => setForm({ ...form, event_date: e.target.value })} />
                  </div>
                  <div className="col-12">
                    <label className="form-label small fw-semibold">Description</label>
                    <textarea className="form-control" rows="3" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowAdd(false)}>Cancel</button>
                <button
                  className="btn btn-primary d-flex align-items-center gap-1"
                  disabled={addMutation.isPending || !form.event_type}
                  onClick={() => addMutation.mutate(form)}
                >
                  {addMutation.isPending && <span className="spinner-border spinner-border-sm me-1" />}
                  {addMutation.isPending ? 'Saving…' : 'Record Event'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}