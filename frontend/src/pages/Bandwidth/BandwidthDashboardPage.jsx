import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Activity,
  CheckCircle2,
  XCircle,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  TrendingUp,
  DollarSign,
  Layers,
  Building2,
  AlertTriangle,
  FileCheck,
  ShieldCheck,
  X,
  Search,
  Filter
} from 'lucide-react'
import api from '../../api/client'
import { approveBandwidthChange, rejectBandwidthChange } from '../../api/bandwidth'

export default function BandwidthDashboardPage() {
  const queryClient = useQueryClient()
  const [selectedChange, setSelectedChange] = useState(null) // for Impact Analysis Modal
  const [approvalNote, setApprovalNote] = useState('Approved per commercial policy')
  const [rejectReason, setRejectReason] = useState('')
  const [isRejectOpen, setIsRejectOpen] = useState(false)
  const [typeFilter, setTypeFilter] = useState('All')
  const [search, setSearch] = useState('')

  // Fetch all pending bandwidth changes
  const { data: pendingChanges = [], isLoading, isFetching, refetch } = useQuery({
    queryKey: ['globalPendingBandwidthApprovals'],
    queryFn: async () => {
      const res = await api.get('/bandwidth/pending-approvals')
      return res.data.data || []
    },
  })

  const approveBwMutation = useMutation({
    mutationFn: ({ changeId, reason }) => approveBandwidthChange(changeId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries(['globalPendingBandwidthApprovals'])
      setSelectedChange(null)
    },
  })

  const rejectBwMutation = useMutation({
    mutationFn: ({ changeId, reason }) => rejectBandwidthChange(changeId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries(['globalPendingBandwidthApprovals'])
      setIsRejectOpen(false)
      setSelectedChange(null)
    },
  })

  // Filtered requests
  const filteredChanges = pendingChanges.filter((c) => {
    const matchType = typeFilter === 'All' || c.change_type === typeFilter
    const matchSearch =
      !search ||
      c.partner?.partner_code?.toLowerCase().includes(search.toLowerCase()) ||
      c.partner?.partner_name?.toLowerCase().includes(search.toLowerCase()) ||
      c.allocation?.service?.toLowerCase().includes(search.toLowerCase())
    return matchType && matchSearch
  })

  // Summary Metrics
  const totalRequests = pendingChanges.length
  const totalNetMbps = pendingChanges.reduce((acc, c) => acc + Number(c.difference_mbps || 0), 0)
  const totalRevImpact = pendingChanges.reduce((acc, c) => acc + Number(c.revenue_impact || 0), 0)
  const totalProfitImpact = pendingChanges.reduce((acc, c) => acc + Number(c.profit_impact || 0), 0)

  return (
    <div className="container-fluid py-4 fade-in">
      {/* ── Page Header ── */}
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <h2 className="fw-bold mb-1 d-flex align-items-center gap-2 text-primary">
            <Activity size={28} className="text-primary" />
            Bandwidth Management Center
          </h2>
          <p className="text-muted small mb-0">
            Capacity management, upgrade/downgrade requests &amp; commercial impact analysis .
          </p>
        </div>
        <button
          className="pm-btn pm-btn-outline d-flex align-items-center gap-1 pm-btn-sm"
          onClick={() => refetch()}
          disabled={isFetching}
        >
          <Clock size={14} className={isFetching ? 'spin-icon' : ''} /> Refresh Approvals
        </button>
      </div>

      {/* ── KPI Stat Cards ── */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card border-0 shadow-sm p-3 h-100" style={{ borderLeft: '4px solid #f59e0b' }}>
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <div className="text-muted fs-8 fw-semibold text-uppercase">Pending Approvals</div>
                <div className="fs-3 fw-bold text-dark mt-1">{totalRequests}</div>
                <div className="fs-8 text-muted mt-1">Requires manager decision</div>
              </div>
              <div className="p-3 bg-warning-subtle text-warning-emphasis rounded-3">
                <Clock size={22} />
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card border-0 shadow-sm p-3 h-100" style={{ borderLeft: '4px solid #3b82f6' }}>
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <div className="text-muted fs-8 fw-semibold text-uppercase">Net Capacity Demand</div>
                <div className="fs-3 fw-bold text-primary mt-1">
                  {totalNetMbps >= 0 ? `+${totalNetMbps}` : totalNetMbps} <span className="fs-6">Mbps</span>
                </div>
                <div className="fs-8 text-muted mt-1">Total pending throughput</div>
              </div>
              <div className="p-3 bg-primary-subtle text-primary rounded-3">
                <Layers size={22} />
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card border-0 shadow-sm p-3 h-100" style={{ borderLeft: '4px solid #10b981' }}>
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <div className="text-muted fs-8 fw-semibold text-uppercase">Expected Monthly Rev</div>
                <div className="fs-3 fw-bold text-success mt-1">
                  +৳{totalRevImpact.toLocaleString()}
                </div>
                <div className="fs-8 text-success mt-1 d-flex align-items-center gap-1">
                  <TrendingUp size={12} /> Pipeline additions
                </div>
              </div>
              <div className="p-3 bg-success-subtle text-success rounded-3">
                <DollarSign size={22} />
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card border-0 shadow-sm p-3 h-100" style={{ borderLeft: '4px solid #06b6d4' }}>
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <div className="text-muted fs-8 fw-semibold text-uppercase">Expected Profit Impact</div>
                <div className="fs-3 fw-bold text-info mt-1">
                  +৳{totalProfitImpact.toLocaleString()}
                </div>
                <div className="fs-8 text-muted mt-1">After upstream bandwidth cost</div>
              </div>
              <div className="p-3 bg-info-subtle text-info rounded-3">
                <FileCheck size={22} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Table Toolbar ── */}
      <div className="card border-0 shadow-sm mb-3">
        <div className="card-body p-3">
          <div className="row g-2 align-items-center">
            <div className="col-12 col-md-5">
              <div className="input-group input-group-sm">
                <span className="input-group-text bg-white border-end-0 text-muted">
                  <Search size={14} />
                </span>
                <input
                  type="text"
                  className="form-control border-start-0"
                  placeholder="Filter by partner name, partner code, or service..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
            <div className="col-6 col-md-3">
              <select
                className="form-select form-select-sm"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <option value="All">All Change Types</option>
                <option value="Upgrade">Upgrade Only</option>
                <option value="Downgrade">Downgrade Only</option>
                <option value="Temporary">Temporary Boost Only</option>
              </select>
            </div>
            <div className="col-6 col-md-4 text-end">
              <span className="small text-muted">
                Showing <strong>{filteredChanges.length}</strong> of {totalRequests} pending requests
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Pending Requests Table ── */}
      <div className="card border-0 shadow-sm p-0 overflow-hidden mb-4">
        {isLoading ? (
          <div className="text-center py-5">
            <span className="spinner-border text-primary me-2" />
            <span className="text-muted">Loading pending approvals...</span>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle border-0 mb-0">
              <thead className="table-light fs-7">
                <tr>
                  <th>Request Date</th>
                  <th>Partner</th>
                  <th>Service</th>
                  <th>Type</th>
                  <th>Change (Mbps)</th>
                  <th>Pre-Approval Impact Analysis </th>
                  <th>Reason / Justification</th>
                  <th className="text-end pe-3">Actions</th>
                </tr>
              </thead>
              <tbody className="fs-7">
                {filteredChanges.length > 0 ? (
                  filteredChanges.map((change) => {
                    const diff = change.difference_mbps || (change.new_mbps - change.previous_mbps)
                    const profit = Number(change.profit_impact || 0)
                    const rev = Number(change.revenue_impact || 0)
                    const cost = Number(change.cost_impact || 0)

                    return (
                      <tr key={change.id}>
                        <td>{new Date(change.created_at).toLocaleDateString()}</td>
                        <td className="fw-bold text-primary">
                          <span className="badge bg-primary-subtle text-primary border me-1">
                            {change.partner?.partner_code || 'N/A'}
                          </span>
                          {change.partner?.partner_name}
                        </td>
                        <td>
                          <span className="badge bg-light text-dark border">
                            {change.allocation?.service || 'Internet'}
                          </span>
                        </td>
                        <td>
                          {change.change_type === 'Upgrade' ? (
                            <span className="badge bg-success-subtle text-success border border-success-subtle d-inline-flex align-items-center gap-1">
                              <ArrowUpRight size={12} /> Upgrade
                            </span>
                          ) : (
                            <span className="badge bg-danger-subtle text-danger border border-danger-subtle d-inline-flex align-items-center gap-1">
                              <ArrowDownRight size={12} /> {change.change_type}
                            </span>
                          )}
                        </td>
                        <td className="fw-bold">
                          {change.previous_mbps} → {change.new_mbps} Mbps
                          <span
                            className={`ms-1 small ${
                              diff >= 0 ? 'text-success' : 'text-danger'
                            }`}
                          >
                            ({diff >= 0 ? `+${diff}` : diff} Mbps)
                          </span>
                        </td>
                        <td>
                          <div className="p-2 rounded bg-light border" style={{ minWidth: '220px' }}>
                            <div className="d-flex justify-content-between fs-8">
                              <span className="text-muted">Est. Revenue:</span>
                              <strong className="text-success">+৳{rev.toLocaleString()}</strong>
                            </div>
                            <div className="d-flex justify-content-between fs-8">
                              <span className="text-muted">Est. Cost:</span>
                              <strong className="text-danger">+৳{cost.toLocaleString()}</strong>
                            </div>
                            <div className="d-flex justify-content-between fs-8 border-top pt-1 mt-1">
                              <span className="fw-semibold text-dark">Net Profit:</span>
                              <strong
                                className={profit >= 0 ? 'text-primary' : 'text-danger'}
                              >
                                {profit >= 0 ? `+৳${profit.toLocaleString()}` : `৳${profit.toLocaleString()}`}
                              </strong>
                            </div>
                          </div>
                        </td>
                        <td className="small text-muted" style={{ maxWidth: '200px' }}>
                          {change.reason || 'Standard capacity upgrade request'}
                        </td>
                        <td className="text-end pe-3">
                          <button
                            className="btn btn-sm btn-primary d-inline-flex align-items-center gap-1 shadow-sm px-3 py-1"
                            onClick={() => {
                              setSelectedChange(change)
                              setApprovalNote('Approved per bandwidth impact criteria')
                            }}
                          >
                            <ShieldCheck size={14} /> Review &amp; Approve
                          </button>
                        </td>
                      </tr>
                    )
                  })
                ) : (
                  <tr>
                    <td colSpan="8" className="text-center py-5 text-muted">
                      <CheckCircle2 size={36} className="text-success mb-2 opacity-50" />
                      <h6>No Pending Bandwidth Approvals</h6>
                      <p className="small mb-0">All bandwidth change requests have been processed.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Bandwidth Impact Analysis Modal */}
      {selectedChange && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
        >
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content shadow-lg border-0">
              <div className="modal-header bg-light border-bottom">
                <h5 className="modal-title fw-bold d-flex align-items-center gap-2">
                  <Activity size={22} className="text-primary" />
                  Bandwidth Impact Analysis &amp; Approval Preview 
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setSelectedChange(null)}
                />
              </div>

              <div className="modal-body p-4">
                {/* Partner Info Banner */}
                <div className="p-3 bg-light rounded-3 border mb-4 d-flex align-items-center justify-content-between">
                  <div>
                    <span className="badge bg-primary text-white mb-1">
                      {selectedChange.partner?.partner_code}
                    </span>
                    <h5 className="fw-bold mb-0 text-dark">
                      {selectedChange.partner?.partner_name}
                    </h5>
                    <span className="small text-muted">
                      Service: {selectedChange.allocation?.service || 'Internet'} | Request Date:{' '}
                      {new Date(selectedChange.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <span
                    className={`badge ${
                      selectedChange.change_type === 'Upgrade'
                        ? 'bg-success fs-7'
                        : 'bg-danger fs-7'
                    }`}
                  >
                    {selectedChange.change_type} Request
                  </span>
                </div>

                {/* Auto-Calculated Impact Breakdown Box */}
                <h6 className="fw-bold mb-2 text-dark">Commercial Impact Calculation</h6>
                <div className="row g-3 mb-4">
                  <div className="col-6 col-md-3">
                    <div className="p-3 border rounded text-center bg-white shadow-sm">
                      <div className="text-muted fs-8">CURRENT CAPACITY</div>
                      <div className="fs-4 fw-bold text-secondary mt-1">
                        {selectedChange.previous_mbps} <span className="fs-7">Mbps</span>
                      </div>
                    </div>
                  </div>

                  <div className="col-6 col-md-3">
                    <div className="p-3 border rounded text-center bg-white shadow-sm">
                      <div className="text-muted fs-8">REQUESTED CAPACITY</div>
                      <div className="fs-4 fw-bold text-primary mt-1">
                        {selectedChange.new_mbps} <span className="fs-7">Mbps</span>
                      </div>
                    </div>
                  </div>

                  <div className="col-6 col-md-3">
                    <div className="p-3 border rounded text-center bg-white shadow-sm">
                      <div className="text-muted fs-8">CAPACITY DELTA</div>
                      <div className="fs-4 fw-bold text-success mt-1">
                        {selectedChange.difference_mbps >= 0
                          ? `+${selectedChange.difference_mbps}`
                          : selectedChange.difference_mbps}{' '}
                        <span className="fs-7">Mbps</span>
                      </div>
                    </div>
                  </div>

                  <div className="col-6 col-md-3">
                    <div className="p-3 border rounded text-center bg-white shadow-sm">
                      <div className="text-muted fs-8">PROJECTED MARGIN %</div>
                      <div className="fs-4 fw-bold text-info mt-1">
                        {selectedChange.revenue_impact > 0
                          ? Math.round(
                              (selectedChange.profit_impact / selectedChange.revenue_impact) * 100
                            )
                          : 35}
                        %
                      </div>
                    </div>
                  </div>
                </div>

                {/* Financial Impact Comparison Bar */}
                <div className="p-3 rounded-3 border bg-light mb-4">
                  <div className="row text-center g-2">
                    <div className="col-4">
                      <div className="text-muted fs-8">ESTIMATED REVENUE IMPACT</div>
                      <div className="fs-4 fw-bold text-success mt-1">
                        +৳{Number(selectedChange.revenue_impact || 0).toLocaleString()}
                      </div>
                      <div className="fs-8 text-muted">Billed to partner monthly</div>
                    </div>
                    <div className="col-4 border-start border-end">
                      <div className="text-muted fs-8">ESTIMATED COST IMPACT</div>
                      <div className="fs-4 fw-bold text-danger mt-1">
                        +৳{Number(selectedChange.cost_impact || 0).toLocaleString()}
                      </div>
                      <div className="fs-8 text-muted">Upstream bandwidth charge</div>
                    </div>
                    <div className="col-4">
                      <div className="text-muted fs-8">NET MONTHLY PROFIT</div>
                      <div className="fs-4 fw-bold text-primary mt-1">
                        +৳{Number(selectedChange.profit_impact || 0).toLocaleString()}
                      </div>
                      <div className="fs-8 text-success fw-semibold">Net profit contribution</div>
                    </div>
                  </div>
                </div>

                {/* Capacity Saturation Check */}
                <div className="alert alert-success d-flex align-items-center gap-2 mb-4 py-2 px-3 border-0">
                  <CheckCircle2 size={18} className="text-success flex-shrink-0" />
                  <div className="small">
                    <strong>Core Capacity Check Passed:</strong> Distribution switch has adequate
                    headroom to allocate {selectedChange.difference_mbps} Mbps without network
                    oversubscription.
                  </div>
                </div>

                {/* Reason & Approval Note */}
                <div className="mb-3">
                  <label className="form-label small fw-semibold">Partner Request Reason</label>
                  <p className="p-2 border rounded bg-light text-muted small mb-0">
                    {selectedChange.reason || 'None provided'}
                  </p>
                </div>

                <div>
                  <label className="form-label small fw-semibold">
                    Approval / Operational Note <span className="text-danger">*</span>
                  </label>
                  <textarea
                    className="form-control form-control-sm"
                    rows="2"
                    value={approvalNote}
                    onChange={(e) => setApprovalNote(e.target.value)}
                    placeholder="Enter approval authorization note..."
                  />
                </div>
              </div>

              <div className="modal-footer bg-light border-top">
                <button
                  type="button"
                  className="btn btn-sm btn-outline-danger me-auto"
                  onClick={() => setIsRejectOpen(true)}
                  disabled={approveBwMutation.isPending || rejectBwMutation.isPending}
                >
                  <XCircle size={14} className="me-1" /> Reject Request
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-secondary"
                  onClick={() => setSelectedChange(null)}
                >
                  Close
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-success d-flex align-items-center gap-1 shadow-sm px-3"
                  disabled={approveBwMutation.isPending || !approvalNote}
                  onClick={() =>
                    approveBwMutation.mutate({
                      changeId: selectedChange.id,
                      reason: approvalNote,
                    })
                  }
                >
                  {approveBwMutation.isPending && (
                    <span className="spinner-border spinner-border-sm me-1" />
                  )}
                  <CheckCircle2 size={16} /> Approve &amp; Apply Capacity
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Reject Reason Sub-Modal ── */}
      {isRejectOpen && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 1060 }}
        >
          <div className="modal-dialog modal-dialog-centered modal-sm">
            <div className="modal-content shadow-lg border-0">
              <div className="modal-header border-bottom">
                <h6 className="modal-title fw-bold text-danger d-flex align-items-center gap-1">
                  <XCircle size={16} /> Confirm Rejection
                </h6>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setIsRejectOpen(false)}
                />
              </div>
              <div className="modal-body p-3">
                <label className="form-label small fw-semibold">Reason for Rejection</label>
                <textarea
                  className="form-control form-control-sm"
                  rows="3"
                  placeholder="e.g. Inadequate upstream capacity or overdue payments..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  required
                />
              </div>
              <div className="modal-footer bg-light p-2">
                <button
                  type="button"
                  className="btn btn-xs btn-secondary"
                  onClick={() => setIsRejectOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-xs btn-danger"
                  disabled={!rejectReason || rejectBwMutation.isPending}
                  onClick={() =>
                    rejectBwMutation.mutate({
                      changeId: selectedChange.id,
                      reason: rejectReason,
                    })
                  }
                >
                  {rejectBwMutation.isPending ? 'Rejecting...' : 'Confirm Reject'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
