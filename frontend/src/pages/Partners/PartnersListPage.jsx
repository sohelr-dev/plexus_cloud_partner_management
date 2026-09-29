import { useState, useMemo, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, keepPreviousData, useQueryClient } from '@tanstack/react-query'
import api from '../../api/client'
import { usePermissions } from '../../context/PermissionContext'
import {
  Users, Search, Plus, Filter, Download, X,
  Building2, MapPin, CheckCircle2, Clock3, Ban,
  Eye, AlertCircle, RefreshCw, Edit, Trash2, ShieldCheck,
  ChevronUp, ChevronDown, ChevronsUpDown, CheckSquare,
  Square, SquareMinus, ShieldAlert, AlertTriangle
} from 'lucide-react'
import StatusActionModal from '../../components/common/StatusActionModal'

const STATUS_META = {
  active:      { label: 'Active',          cls: 'pm-badge-success' },
  inactive:    { label: 'Inactive',        cls: 'pm-badge-secondary' },
  suspended:   { label: 'Suspended',       cls: 'pm-badge-danger' },
  blocked:     { label: 'Blocked',         cls: 'pm-badge-danger' },
  pending:     { label: 'Pending',         cls: 'pm-badge-warning' },
  approved:    { label: 'Approved',        cls: 'pm-badge-info' },
  terminated:  { label: 'Terminated',      cls: 'pm-badge-dark' },
  draft:       { label: 'Draft',           cls: 'pm-badge-secondary' },
  'under review': { label: 'Under Review', cls: 'pm-badge-warning' },
}

const HEALTH_META = (score) => {
  if (score >= 80) return { cls: 'pm-health-good',   label: 'Good' }
  if (score >= 60) return { cls: 'pm-health-medium', label: 'Medium' }
  return { cls: 'pm-health-low', label: 'Low' }
}

function StatusBadge({ status }) {
  const meta = STATUS_META[String(status).toLowerCase()] ?? { label: status, cls: 'pm-badge-secondary' }
  return <span className={`pm-badge ${meta.cls}`}>{meta.label}</span>
}

/** Sort indicator icon for column headers */
function SortIcon({ col, sort, dir }) {
  if (sort !== col) return <ChevronsUpDown size={12} className="text-muted ms-1 opacity-50" />
  return dir === 'asc'
    ? <ChevronUp size={12} className="text-primary ms-1" />
    : <ChevronDown size={12} className="text-primary ms-1" />
}

const ALLOWED_SORTS = ['partner_name', 'partner_code', 'status', 'partner_since', 'health_score', 'created_at']

const BULK_STATUSES = ['Active', 'Suspended', 'Blocked', 'Inactive', 'Terminated']

export default function PartnersListPage() {
  const { can } = usePermissions()
  const queryClient = useQueryClient()

  // Search & Filters
  const [searchInput,  setSearchInput]  = useState('')
  const [search,       setSearch]       = useState('')
  const [status,       setStatus]       = useState('')
  const [type,         setType]         = useState('')
  const [page,         setPage]         = useState(1)

  // Sort
  const [sort, setSort] = useState('created_at')
  const [dir,  setDir]  = useState('desc')

  // Bulk Actions
  const [selected,     setSelected]     = useState(new Set())
  const [bulkStatus,   setBulkStatus]   = useState('')
  const [bulkLoading,  setBulkLoading]  = useState(false)
  const [bulkError,    setBulkError]    = useState('')
  const [showBulkPanel, setShowBulkPanel] = useState(false)

  // Modals
  const [modalState, setModalState] = useState({ isOpen: false, partner: null, mode: 'approve' })

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput.trim()); setPage(1) }, 300)
    return () => clearTimeout(t)
  }, [searchInput])

  // Clear selection on page change
  useEffect(() => { setSelected(new Set()) }, [page])

  const params = useMemo(() => {
    const p = { page, sort, dir }
    if (search) p.search = search
    if (status) p.status = status
    if (type)   p.partner_type = type
    return p
  }, [page, search, status, type, sort, dir])

  const { data, isLoading, isError, error, isFetching, refetch } = useQuery({
    queryKey: ['partners', params],
    queryFn: async () => {
      const res = await api.get('/partners', { params })
      const rows = res.data.data ?? res.data
      const meta = res.data.meta ?? { current_page: page, last_page: 1, total: 0 }
      return { rows: Array.isArray(rows) ? rows : [], meta }
    },
    placeholderData: keepPreviousData,
  })

  const rows = data?.rows ?? []
  const meta = data?.meta ?? {}

  // ── Sort Handler 
  const handleSort = useCallback((col) => {
    if (!ALLOWED_SORTS.includes(col)) return
    if (sort === col) {
      setDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSort(col)
      setDir('asc')
    }
    setPage(1)
    setSelected(new Set())
  }, [sort])

  // ── Bulk Selection 
  const allSelected   = rows.length > 0 && rows.every(r => selected.has(r.id))
  const someSelected  = rows.some(r => selected.has(r.id)) && !allSelected

  const toggleAll = () => {
    if (allSelected) {
      setSelected(prev => { const s = new Set(prev); rows.forEach(r => s.delete(r.id)); return s })
    } else {
      setSelected(prev => { const s = new Set(prev); rows.forEach(r => s.add(r.id)); return s })
    }
  }

  const toggleRow = (id) => {
    setSelected(prev => {
      const s = new Set(prev)
      s.has(id) ? s.delete(id) : s.add(id)
      return s
    })
  }

  // ── Bulk Status Apply 
  const applyBulkStatus = async () => {
    if (!bulkStatus || selected.size === 0) return
    setBulkLoading(true)
    setBulkError('')
    try {
      await api.post('/partners/bulk-status', {
        partner_ids: Array.from(selected),
        status: bulkStatus,
        reason: `Bulk status update to "${bulkStatus}" via Partner List`,
      })
      setSelected(new Set())
      setBulkStatus('')
      setShowBulkPanel(false)
      queryClient.invalidateQueries({ queryKey: ['partners'] })
    } catch (err) {
      setBulkError(err?.response?.data?.message ?? 'Bulk update failed. Please try again.')
    } finally {
      setBulkLoading(false)
    }
  }

  // ── Delete 
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this partner?')) return
    try { await api.delete(`/partners/${id}`); refetch() }
    catch { alert('Failed to delete partner.') }
  }

  const resetFilters = () => {
    setSearchInput(''); setSearch(''); setStatus(''); setType(''); setPage(1)
  }

  const exportCSV = () => {
    if (!rows.length) return
    const headers = ['Partner ID','Partner Code','Name','Type','Category','Contact Person','Email','Phone','Status','Health Score']
    const csvRows = [
      headers.join(','),
      ...rows.map(r => [
        `"${r.partner_id||''}"`, `"${r.partner_code||''}"`, `"${r.partner_name||''}"`,
        `"${r.partner_type||''}"`, `"${r.partner_category||''}"`, `"${r.contact_person||''}"`,
        `"${r.email||''}"`, `"${r.contact_number||''}"`, `"${r.status||''}"`,
        `"${r.health_score ?? 0}%"`,
      ].join(',')),
    ]
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' })
    const url  = window.URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url; a.download = `partner_directory_${new Date().toISOString().split('T')[0]}.csv`
    a.click(); window.URL.revokeObjectURL(url)
  }

  const hasFilters = Boolean(search || status || type)

  // Sortable TH helper
  const Th = ({ col, children, className = '' }) => (
    <th
      className={`${className} ${ALLOWED_SORTS.includes(col) ? 'pm-th-sortable' : ''}`}
      style={ALLOWED_SORTS.includes(col) ? { cursor: 'pointer', userSelect: 'none' } : {}}
      onClick={ALLOWED_SORTS.includes(col) ? () => handleSort(col) : undefined}
    >
      <span className="d-flex align-items-center gap-1">
        {children}
        {ALLOWED_SORTS.includes(col) && <SortIcon col={col} sort={sort} dir={dir} />}
      </span>
    </th>
  )

  return (
    <div className="pm-page">
      <div className="pm-page-header">
        <div>
          <h1 className="pm-page-title"><Users size={26} /> Partner Directory</h1>
          <p className="pm-page-subtitle">Manage all partners, monitor health, and evaluate performance.</p>
        </div>
        {can('partner.create') && (
          <Link to="/partners/new" className="pm-btn pm-btn-primary text-decoration-none">
            <Plus size={18} /> New Partner
          </Link>
        )}
      </div>

      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body p-3">
          <div className="row g-3 align-items-center">
            {/* Search */}
            <div className="col-12 col-lg-5">
              <div className="input-group">
                <span className="input-group-text bg-light border-end-0 text-muted ps-3">
                  <Search size={16} />
                </span>
                <input
                  type="text"
                  className="form-control border-start-0 ps-2 bg-light"
                  placeholder="Search name, code, ID, email, MAC, serial, device ID…"
                  value={searchInput}
                  onChange={e => setSearchInput(e.target.value)}
                />
                {searchInput && (
                  <button type="button" className="btn btn-light border border-start-0 text-muted" onClick={() => setSearchInput('')}>
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>

            {/* Filters */}
            <div className="col-12 col-lg-7">
              <div className="d-flex gap-2 flex-wrap align-items-center justify-content-lg-end">
                <div className="d-flex align-items-center gap-1 me-1">
                  <Filter size={15} className="text-secondary" />
                  <span className="text-muted small fw-medium d-none d-sm-inline">Filters:</span>
                </div>

                <select className="form-select form-select-sm w-auto" value={status} onChange={e => { setStatus(e.target.value); setPage(1) }}>
                  <option value="">All Statuses</option>
                  {['Active','Pending Approval','Under Review','Approved','Suspended','Blocked','Inactive','Terminated'].map(s =>
                    <option key={s} value={s}>{s}</option>
                  )}
                </select>

                <select className="form-select form-select-sm w-auto" value={type} onChange={e => { setType(e.target.value); setPage(1) }}>
                  <option value="">All Types</option>
                  {['Reseller','Distributor','ISP','Corporate','Individual'].map(t =>
                    <option key={t} value={t}>{t}</option>
                  )}
                </select>

                {hasFilters && (
                  <button className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1" onClick={resetFilters}>
                    <RefreshCw size={13} /> Reset
                  </button>
                )}

                <button className="btn btn-sm btn-outline-primary d-flex align-items-center gap-1" onClick={exportCSV} title="Export CSV">
                  <Download size={14} /> Export CSV
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {selected.size > 0 && (
        <div className="alert alert-info border-0 shadow-sm mb-3 py-2 px-3 d-flex align-items-center gap-3 flex-wrap">
          <CheckSquare size={16} className="text-info" />
          <span className="fw-semibold">{selected.size} partner{selected.size > 1 ? 's' : ''} selected</span>

          <div className="d-flex gap-2 align-items-center ms-auto flex-wrap">
            <select
              className="form-select form-select-sm w-auto"
              value={bulkStatus}
              onChange={e => setBulkStatus(e.target.value)}
            >
              <option value="">Set Status…</option>
              {BULK_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>

            <button
              className="btn btn-sm btn-primary d-flex align-items-center gap-1"
              disabled={!bulkStatus || bulkLoading}
              onClick={applyBulkStatus}
            >
              {bulkLoading ? <span className="spinner-border spinner-border-sm" /> : <ShieldAlert size={14} />}
              Apply
            </button>

            <button
              className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1"
              onClick={() => { setSelected(new Set()); setBulkError('') }}
            >
              <X size={13} /> Clear
            </button>
          </div>

          {bulkError && (
            <div className="w-100 mt-1">
              <span className="text-danger small"><AlertTriangle size={12} className="me-1" />{bulkError}</span>
            </div>
          )}
        </div>
      )}

      <div className="pm-card p-0 overflow-hidden">
        {isLoading ? (
          <div className="pm-empty">
            <div className="spinner-border text-primary" role="status" />
            <div className="pm-empty-title mt-2">Loading partners…</div>
          </div>
        ) : isError ? (
          <div className="pm-error-box">
            <AlertCircle size={48} />
            <div className="fw-bold fs-5">Failed to load data</div>
            <div className="small opacity-75">{error?.response?.data?.message ?? error?.message}</div>
          </div>
        ) : rows.length === 0 ? (
          <div className="pm-empty">
            <div className="pm-empty-icon"><Users size={32} /></div>
            <div>
              <div className="pm-empty-title">No partners found</div>
              <div className="pm-empty-sub">{hasFilters ? 'Try adjusting your filters or search query.' : 'Get started by adding a new partner.'}</div>
            </div>
            {hasFilters && <button className="pm-btn pm-btn-outline pm-btn-sm mt-2" onClick={resetFilters}>Clear Filters</button>}
          </div>
        ) : (
          <div className="table-responsive">
            <table className="pm-table">
              <thead>
                <tr>
                  {/* Select All Checkbox */}
                  <th style={{ width: 40 }}>
                    <button
                      className="btn p-0 border-0 bg-transparent d-flex align-items-center justify-content-center"
                      onClick={toggleAll}
                      title={allSelected ? 'Deselect all' : 'Select all on this page'}
                    >
                      {allSelected
                        ? <CheckSquare size={16} className="text-primary" />
                        : someSelected
                          ? <SquareMinus size={16} className="text-primary" />
                          : <Square size={16} className="text-muted" />}
                    </button>
                  </th>
                  <Th col="partner_name">Partner Details</Th>
                  <Th col="partner_code" className="d-none d-sm-table-cell">Code / ID</Th>
                  <th className="d-none d-md-table-cell">Type</th>
                  <th>Contact</th>
                  <th className="d-none d-lg-table-cell">Territory</th>
                  <Th col="status">Status</Th>
                  <Th col="health_score" className="d-none d-xl-table-cell">Health</Th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(p => {
                  const health   = HEALTH_META(Number(p.health_score ?? 0))
                  const isChecked = selected.has(p.id)
                  return (
                    <tr key={p.id} className={isChecked ? 'table-active' : ''}>
                      {/* Checkbox */}
                      <td>
                        <button
                          className="btn p-0 border-0 bg-transparent d-flex align-items-center justify-content-center"
                          onClick={() => toggleRow(p.id)}
                        >
                          {isChecked
                            ? <CheckSquare size={16} className="text-primary" />
                            : <Square size={16} className="text-muted" />}
                        </button>
                      </td>

                      {/* Partner Details */}
                      <td>
                        <div className="d-flex align-items-center gap-3">
                          <div className="pm-partner-avatar">{(p.partner_name ?? '?').charAt(0).toUpperCase()}</div>
                          <div className="min-w-0">
                            <div className="pm-partner-name text-truncate">{p.partner_name}</div>
                            <div className="pm-partner-code text-truncate small text-muted">{p.partner_type ?? '—'}</div>
                          </div>
                        </div>
                      </td>

                      {/* Code / ID */}
                      <td className="d-none d-sm-table-cell">
                        <div className="small fw-semibold font-monospace">{p.partner_code}</div>
                        <div className="small text-muted">{p.partner_id}</div>
                      </td>

                      {/* Type */}
                      <td className="d-none d-md-table-cell">
                        <span className="pm-badge pm-badge-blue text-capitalize">
                          <Building2 size={11} className="me-1" />{p.partner_type ?? '—'}
                        </span>
                      </td>

                      {/* Contact */}
                      <td>
                        <div className="fw-semibold" style={{ fontSize: '0.8rem' }}>{p.contact_person ?? '—'}</div>
                        <div className="small text-secondary">{p.contact_number ?? '—'}</div>
                      </td>

                      {/* Territory */}
                      <td className="d-none d-lg-table-cell">
                        <div className="d-flex align-items-center gap-1 text-secondary" style={{ fontSize: '0.8rem' }}>
                          <MapPin size={13} /> {p.territory?.name ?? '—'}
                        </div>
                        {p.area?.name && <div className="small text-muted">{p.area.name}</div>}
                      </td>

                      {/* Status */}
                      <td><StatusBadge status={p.status} /></td>

                      {/* Health */}
                      <td className="d-none d-xl-table-cell">
                        <div className={`pm-health pm-health-${health.cls.split('-').pop()}`}>
                          <div className="pm-health-bar">
                            <div className="pm-health-fill" style={{ width: `${Math.max(0, Math.min(100, p.health_score || 0))}%` }} />
                          </div>
                          <span className="pm-health-label">{p.health_score}%</span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="text-end">
                        <div className="d-flex justify-content-end gap-1">
                          <Link to={`/partners/${p.id}`} className="pm-icon-btn d-inline-flex" style={{ width: 32, height: 32 }} title="View Details">
                            <Eye size={15} />
                          </Link>
                          {['Pending Approval','Under Review'].includes(p.status) && can('partner.approve') && (
                            <button
                              onClick={() => setModalState({ isOpen: true, partner: p, mode: 'approve' })}
                              className="pm-icon-btn d-inline-flex text-success"
                              style={{ width: 32, height: 32, borderColor: 'rgba(16,185,129,0.3)' }}
                              title="Approve / Reject"
                            >
                              <ShieldCheck size={15} />
                            </button>
                          )}
                          {can('partner.update') && (
                            <Link
                              to={`/partners/${p.id}/edit`}
                              className="pm-icon-btn d-inline-flex text-primary"
                              style={{ width: 32, height: 32, borderColor: 'rgba(59,130,246,0.3)' }}
                              title="Edit"
                            >
                              <Edit size={15} />
                            </Link>
                          )}
                          {can('partner.delete') && (
                            <button
                              onClick={() => handleDelete(p.id)}
                              className="pm-icon-btn d-inline-flex text-danger"
                              style={{ width: 32, height: 32, borderColor: 'rgba(239,68,68,0.3)' }}
                              title="Delete"
                            >
                              <Trash2 size={15} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>

            <div className="pm-table-footer">
              <div className="small text-secondary fw-medium">
                {meta.total != null && (
                  <span>Showing {((meta.current_page - 1) * (meta.per_page ?? 20)) + 1}–{Math.min(meta.current_page * (meta.per_page ?? 20), meta.total)} of {meta.total} partners</span>
                )}
              </div>
              <div className="pm-pagination">
                <button
                  className="pm-page-btn"
                  disabled={page <= 1 || isFetching}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                >Prev</button>
                {meta.last_page > 1 && Array.from({ length: Math.min(meta.last_page, 5) }, (_, i) => {
                  const pg = i + 1
                  return (
                    <button
                      key={pg}
                      className={`pm-page-btn ${page === pg ? 'active' : ''}`}
                      disabled={isFetching}
                      onClick={() => setPage(pg)}
                    >{pg}</button>
                  )
                })}
                <button
                  className="pm-page-btn"
                  disabled={!meta.last_page || page >= meta.last_page || isFetching}
                  onClick={() => setPage(p => p + 1)}
                >Next</button>
              </div>
            </div>
          </div>
        )}
      </div>

      {isFetching && !isLoading && <div className="pm-fetching-bar" />}

      <StatusActionModal
        isOpen={modalState.isOpen}
        mode={modalState.mode}
        partner={modalState.partner}
        onClose={() => setModalState(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  )
}
