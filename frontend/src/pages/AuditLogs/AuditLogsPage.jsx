import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchAuditLogs } from '../../api/auditLogs'
import {
  ShieldAlert,
  Search,
  RefreshCw,
  Filter,
  Eye,
  User,
  Activity,
  Calendar,
  Layers,
  ArrowRight,
  X
} from 'lucide-react'

export default function AuditLogsPage() {
  const [search, setSearch] = useState('')
  const [actionFilter, setActionFilter] = useState('')
  const [page, setPage] = useState(1)
  const [selectedLog, setSelectedLog] = useState(null)

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['auditLogs', { search, action: actionFilter, page }],
    queryFn: () => fetchAuditLogs({ search, action: actionFilter, page, per_page: 15 }),
    keepPreviousData: true,
  })

  const logs = data?.data || []
  const pagination = data || {}

  const getActionBadgeClass = (action) => {
    switch (action?.toLowerCase()) {
      case 'created':
        return 'bg-success-subtle text-success border-success-subtle'
      case 'updated':
        return 'bg-primary-subtle text-primary border-primary-subtle'
      case 'status_changed':
        return 'bg-warning-subtle text-warning-emphasis border-warning-subtle'
      case 'approved':
        return 'bg-info-subtle text-info-emphasis border-info-subtle'
      case 'deleted':
        return 'bg-danger-subtle text-danger border-danger-subtle'
      default:
        return 'bg-secondary-subtle text-secondary border-secondary-subtle'
    }
  }

  return (
    <div className="container-fluid p-4">
      {/* Header */}
      <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between mb-4">
        <div>
          <h2 className="fw-bold mb-1 d-flex align-items-center gap-2">
            <ShieldAlert className="text-primary" size={28} /> Audit Logs & Security Trail
          </h2>
          <p className="text-muted mb-0">
            Immutable system audit logs tracking all user actions, partner status changes, and data modifications (BR-12).
          </p>
        </div>
        <div className="mt-3 mt-md-0 d-flex gap-2">
          <button
            className="btn btn-outline-secondary d-flex align-items-center gap-2"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw size={16} className={isFetching ? 'spin' : ''} /> Refresh
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body p-3">
          <div className="row g-3 align-items-center">
            <div className="col-12 col-md-6">
              <div className="input-group">
                <span className="input-group-text bg-transparent border-end-0">
                  <Search size={16} className="text-muted" />
                </span>
                <input
                  type="text"
                  className="form-control border-start-0 ps-0"
                  placeholder="Search by user, action, entity name or reason..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value)
                    setPage(1)
                  }}
                />
              </div>
            </div>
            <div className="col-12 col-md-4">
              <div className="d-flex align-items-center gap-2">
                <Filter size={16} className="text-muted" />
                <select
                  className="form-select"
                  value={actionFilter}
                  onChange={(e) => {
                    setActionFilter(e.target.value)
                    setPage(1)
                  }}
                >
                  <option value="">All Actions</option>
                  <option value="created">Created</option>
                  <option value="updated">Updated</option>
                  <option value="status_changed">Status Changed</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="deleted">Deleted</option>
                  <option value="restored">Restored</option>
                </select>
              </div>
            </div>
            <div className="col-12 col-md-2 text-end">
              <button
                className="btn btn-sm btn-link text-decoration-none text-muted"
                onClick={() => {
                  setSearch('')
                  setActionFilter('')
                  setPage(1)
                }}
              >
                Reset Filters
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="card border-0 shadow-sm">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th style={{ width: '180px' }}>Timestamp</th>
                <th>User</th>
                <th>Action</th>
                <th>Entity / Target</th>
                <th>Reason / IP</th>
                <th className="text-end">Details</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="6" className="text-center py-5">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading logs...</span>
                    </div>
                    <p className="text-muted mt-2 mb-0">Fetching audit trail...</p>
                  </td>
                </tr>
              ) : isError ? (
                <tr>
                  <td colSpan="6" className="text-center py-5 text-danger">
                    Failed to load audit logs. Please try again.
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-5 text-muted">
                    No audit log records found.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id}>
                    <td>
                      <div className="d-flex align-items-center gap-1 text-muted fs-7">
                        <Calendar size={14} />
                        <span>{new Date(log.created_at).toLocaleString()}</span>
                      </div>
                    </td>
                    <td>
                      <div className="d-flex align-items-center gap-2">
                        <div className="bg-primary-subtle text-primary rounded-circle p-1 d-flex align-items-center justify-content-center" style={{ width: 28, height: 28 }}>
                          <User size={14} />
                        </div>
                        <div>
                          <div className="fw-semibold text-dark fs-7">{log.user_name || 'System Auto'}</div>
                          <div className="text-muted fs-8">ID: {log.user_id || 'N/A'}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`badge border ${getActionBadgeClass(log.action)} px-2 py-1 text-capitalize`}>
                        {log.action?.replace('_', ' ')}
                      </span>
                    </td>
                    <td>
                      <div>
                        <span className="fw-semibold text-dark">{log.entity_type}</span>
                        {log.entity_label && (
                          <span className="text-muted ms-1 fs-7">({log.entity_label})</span>
                        )}
                        <div className="text-muted fs-8">Ref ID: #{log.entity_id}</div>
                      </div>
                    </td>
                    <td>
                      <div className="text-truncate" style={{ maxWidth: '250px' }}>
                        {log.reason ? (
                          <span className="text-dark fs-7">{log.reason}</span>
                        ) : (
                          <span className="text-muted fs-8">IP: {log.ip_address || 'Internal'}</span>
                        )}
                      </div>
                    </td>
                    <td className="text-end">
                      <button
                        className="btn btn-sm btn-outline-primary d-inline-flex align-items-center gap-1"
                        onClick={() => setSelectedLog(log)}
                      >
                        <Eye size={14} /> Inspect
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {pagination.total > 0 && (
          <div className="card-footer bg-white border-0 py-3 d-flex flex-column flex-sm-row align-items-center justify-content-between gap-2">
            <div className="text-muted fs-7">
              Showing <strong>{pagination.from}</strong> to <strong>{pagination.to}</strong> of <strong>{pagination.total}</strong> entries
            </div>
            <div className="d-flex gap-2">
              <button
                className="btn btn-sm btn-outline-secondary"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </button>
              <button
                className="btn btn-sm btn-outline-secondary"
                disabled={page >= pagination.last_page}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Inspect Modal */}
      {selectedLog && (
        <div className="modal fade show d-block tab-modal-backdrop" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content border-0 shadow">
              <div className="modal-header border-bottom">
                <h5 className="modal-title fw-bold d-flex align-items-center gap-2">
                  <Activity className="text-primary" size={20} />
                  Audit Log Details #{selectedLog.id}
                </h5>
                <button type="button" className="btn-close" onClick={() => setSelectedLog(null)}></button>
              </div>
              <div className="modal-body p-4">
                <div className="row g-3 mb-4">
                  <div className="col-md-4">
                    <div className="text-muted fs-8">ACTION</div>
                    <div className="fw-semibold text-capitalize">{selectedLog.action?.replace('_', ' ')}</div>
                  </div>
                  <div className="col-md-4">
                    <div className="text-muted fs-8">PERFORMED BY</div>
                    <div className="fw-semibold">{selectedLog.user_name || 'System'} (ID: {selectedLog.user_id})</div>
                  </div>
                  <div className="col-md-4">
                    <div className="text-muted fs-8">TIMESTAMP</div>
                    <div className="fw-semibold">{new Date(selectedLog.created_at).toLocaleString()}</div>
                  </div>
                  <div className="col-md-6">
                    <div className="text-muted fs-8">ENTITY TARGET</div>
                    <div className="fw-semibold">{selectedLog.entity_type} #{selectedLog.entity_id} {selectedLog.entity_label && `(${selectedLog.entity_label})`}</div>
                  </div>
                  <div className="col-md-6">
                    <div className="text-muted fs-8">IP ADDRESS / USER AGENT</div>
                    <div className="fw-semibold">{selectedLog.ip_address || 'N/A'}</div>
                  </div>
                </div>

                {selectedLog.reason && (
                  <div className="alert alert-info py-2 px-3 mb-4 fs-7">
                    <strong>Reason / Remark:</strong> {selectedLog.reason}
                  </div>
                )}

                {/* Diff View */}
                <h6 className="fw-bold mb-2">Payload Comparison (Before vs After):</h6>
                <div className="row g-3">
                  <div className="col-md-6">
                    <div className="card bg-light border-0">
                      <div className="card-header bg-danger-subtle text-danger fw-semibold py-2">
                        Old Values (Before)
                      </div>
                      <div className="card-body p-2">
                        <pre className="mb-0 fs-8 text-wrap font-monospace" style={{ maxHeight: '250px', overflowY: 'auto' }}>
                          {selectedLog.old_values ? JSON.stringify(selectedLog.old_values, null, 2) : 'None (Created / Initial)'}
                        </pre>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="card bg-light border-0">
                      <div className="card-header bg-success-subtle text-success fw-semibold py-2">
                        New Values (After)
                      </div>
                      <div className="card-body p-2">
                        <pre className="mb-0 fs-8 text-wrap font-monospace" style={{ maxHeight: '250px', overflowY: 'auto' }}>
                          {selectedLog.new_values ? JSON.stringify(selectedLog.new_values, null, 2) : 'None (Deleted)'}
                        </pre>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer border-top py-2">
                <button type="button" className="btn btn-secondary" onClick={() => setSelectedLog(null)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
