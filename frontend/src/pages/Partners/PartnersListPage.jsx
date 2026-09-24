import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import api from '../../api/client'
import { usePermissions } from '../../context/PermissionContext'
import {
  Users, Search, Plus, Filter,
  Building2, MapPin, CheckCircle2, Clock3, Ban,
  Eye, MoreHorizontal, AlertCircle, RefreshCw, Edit, Trash2
} from 'lucide-react'

const STATUS_META = {
  active: { label: 'Active', cls: 'pm-badge-success' },
  inactive: { label: 'Inactive', cls: 'pm-badge-secondary' },
  suspended: { label: 'Suspended', cls: 'pm-badge-danger' },
  pending: { label: 'Pending', cls: 'pm-badge-warning' },
  terminated: { label: 'Terminated', cls: 'pm-badge-dark' },
}

const HEALTH_META = (score) => {
  if (score >= 80) return { cls: 'pm-health-good', label: 'Good' }
  if (score >= 60) return { cls: 'pm-health-medium', label: 'Medium' }
  return { cls: 'pm-health-low', label: 'Low' }
}

function StatusBadge({ status }) {
  const meta = STATUS_META[String(status).toLowerCase()] ?? {
    label: status,
    cls: 'pm-badge-secondary',
  }
  return <span className={`pm-badge ${meta.cls}`}>{meta.label}</span>
}

export default function PartnersListPage() {
  const { can } = usePermissions()
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [status, setStatus] = useState('')
  const [type, setType] = useState('')
  const [page, setPage] = useState(1)

  const params = useMemo(() => {
    const p = { page }
    if (search) p.search = search
    if (status) p.status = status
    if (type) p.type = type
    return p
  }, [page, search, status, type])

  const { data, isLoading, isError, error, isFetching, refetch } = useQuery({
    queryKey: ['partners', params],
    queryFn: async () => {
      const res = await api.get('/partners', { params })
      const rows = res.data.data ?? res.data
      const meta = res.data.meta ?? { current_page: page, last_page: 1 }
      return { rows: Array.isArray(rows) ? rows : [], meta }
    },
    placeholderData: keepPreviousData,
  })

  const rows = data?.rows ?? []
  const meta = data?.meta ?? {}

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this partner?')) return;
    try {
      await api.delete(`/partners/${id}`);
      refetch();
    } catch (err) {
      alert('Failed to delete partner.');
    }
  }

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    setSearch(searchInput.trim())
    setPage(1)
  }

  const resetFilters = () => {
    setSearchInput('')
    setSearch('')
    setStatus('')
    setType('')
    setPage(1)
  }

  const hasFilters = Boolean(search || status || type)

  return (
    <div className="pm-page">
      {/* Header */}
      <div className="pm-page-header">
        <div>
          <h1 className="pm-page-title">
            <Users size={26} /> Partner Directory
          </h1>
          <p className="pm-page-subtitle">Manage all partners, monitor health, and evaluate performance.</p>
        </div>
        <Link to="/partners/new" className="pm-btn pm-btn-primary text-decoration-none">
          <Plus size={18} /> New Partner
        </Link>
      </div>

      {/* Toolbar */}
      <div className="pm-card" style={{ padding: '1rem 1.25rem' }}>
        <div className="d-flex flex-column flex-lg-row gap-3 align-items-lg-center">
          <form className="pm-search-wrap" onSubmit={handleSearchSubmit}>
            <Search size={16} className="pm-search-icon" />
            <input
              type="search"
              className="pm-auth-input pm-search-input"
              placeholder="Search partner name, code…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </form>

          <div className="d-flex gap-2 flex-wrap align-items-center ms-lg-auto">
            <Filter size={16} className="text-secondary d-none d-lg-block me-1" />
            <select
              className="pm-auth-input pm-filter-select"
              value={status}
              onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            >
              <option value="">All Statuses</option>
              {Object.entries(STATUS_META).map(([val, m]) => (
                <option key={val} value={val}>{m.label}</option>
              ))}
            </select>

            <select
              className="pm-auth-input pm-filter-select"
              value={type}
              onChange={(e) => { setType(e.target.value); setPage(1); }}
            >
              <option value="">All Types</option>
              <option value="ISP">ISP</option>
              <option value="NTN">NTN</option>
              <option value="reseller">Reseller</option>
              <option value="corporate">Corporate</option>
            </select>

            {hasFilters && (
              <button className="pm-btn pm-btn-ghost pm-btn-sm" onClick={resetFilters}>
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
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
            {hasFilters && (
              <button className="pm-btn pm-btn-outline pm-btn-sm mt-2" onClick={resetFilters}>Clear Filters</button>
            )}
          </div>
        ) : (
          <div className="table-responsive">
            <table className="pm-table">
              <thead>
                <tr>
                  <th>Partner Details</th>
                  <th className="d-none d-md-table-cell">Type</th>
                  <th>Contact Person</th>
                  <th className="d-none d-lg-table-cell">Territory</th>
                  <th>Status</th>
                  <th className="d-none d-xl-table-cell">Health</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((p) => {
                  const health = HEALTH_META(Number(p.health_score ?? 0))
                  return (
                    <tr key={p.id}>
                      <td>
                        <div className="d-flex align-items-center gap-3">
                          <div className="pm-partner-avatar">
                            {(p.partner_name ?? '?').charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="pm-partner-name text-truncate">{p.partner_name}</div>
                            <div className="pm-partner-code text-truncate">{p.partner_code} · {p.partner_id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="d-none d-md-table-cell">
                        <span className="pm-badge pm-badge-blue text-capitalize">
                          <Building2 size={12} className="me-1" /> {p.partner_type ?? '—'}
                        </span>
                      </td>
                      <td>
                        <div className="fw-semibold" style={{ fontSize: '0.8rem' }}>{p.contact_person ?? '—'}</div>
                        <div className="small text-secondary">{p.contact_number ?? '—'}</div>
                      </td>
                      <td className="d-none d-lg-table-cell">
                        <div className="d-flex align-items-center gap-1 text-secondary" style={{ fontSize: '0.8rem' }}>
                          <MapPin size={14} /> {p.territory?.name ?? p.territory_id ?? '—'}
                        </div>
                      </td>
                      <td>
                        <StatusBadge status={p.status} />
                      </td>
                      <td className="d-none d-xl-table-cell">
                        <div className={`pm-health pm-health-${health.cls.split('-').pop()}`}>
                          <div className="pm-health-bar">
                            <div className="pm-health-fill" style={{ width: `${Math.max(0, Math.min(100, p.health_score || 0))}%` }} />
                          </div>
                          <span className="pm-health-label">{p.health_score}%</span>
                        </div>
                      </td>
                      <td className="text-end">
                        <div className="d-flex justify-content-end gap-1">
                          <Link to={`/partners/${p.id}`} className="pm-icon-btn d-inline-flex" style={{ width: 32, height: 32 }} title="View Details">
                            <Eye size={16} />
                          </Link>
                          {can('partner.update') && (
                            <Link to={`/partners/${p.id}/edit`} className="pm-icon-btn d-inline-flex text-primary" style={{ width: 32, height: 32, borderColor: 'rgba(59,130,246,0.3)' }} title="Edit">
                              <Edit size={16} />
                            </Link>
                          )}
                          {can('partner.delete') && (
                            <button onClick={() => handleDelete(p.id)} className="pm-icon-btn d-inline-flex text-danger" style={{ width: 32, height: 32, borderColor: 'rgba(239,68,68,0.3)' }} title="Delete">
                              <Trash2 size={16} />
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
                Showing page {meta.current_page ?? page} {meta.last_page ? `of ${meta.last_page}` : ''}
              </div>
              <div className="pm-pagination">
                <button 
                  className="pm-page-btn" 
                  disabled={page <= 1 || isFetching}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                >
                  Prev
                </button>
                <button 
                  className="pm-page-btn" 
                  disabled={!meta.last_page || page >= meta.last_page || isFetching}
                  onClick={() => setPage(p => p + 1)}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {isFetching && !isLoading && <div className="pm-fetching-bar" />}
    </div>
  )
}
