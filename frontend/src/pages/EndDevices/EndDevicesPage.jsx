import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  Smartphone,
  Search,
  Filter,
  RefreshCw,
  Plus,
  CheckCircle2,
  WifiOff,
  AlertOctagon,
  Copy,
  Check,
  Building2,
  Tag,
  Calendar,
  X,
  Radio,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { fetchGlobalEndDevices, updateEndDeviceStatus, registerEndDevice } from '../../api/equipment'
import api from '../../api/client'

export default function EndDevicesPage() {
  const queryClient = useQueryClient()

  // Filter & Search states
  const [search, setSearch] = useState('')
  const [partnerId, setPartnerId] = useState('')
  const [deviceType, setDeviceType] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [copiedId, setCopiedId] = useState(null)

  // Register Modal state
  const [isRegisterOpen, setIsRegisterOpen] = useState(false)
  const [regForm, setRegForm] = useState({
    partner_id: '',
    device_type: 'MAC Address',
    identifier: '',
    customer_id: '',
    package_id: '',
    status: 'Active',
    activation_date: new Date().toISOString().split('T')[0],
  })

  // 1. Fetch Partners for dropdown
  const { data: partnersData } = useQuery({
    queryKey: ['partnersDropdown'],
    queryFn: async () => {
      const res = await api.get('/partners?per_page=100')
      return res.data?.data?.rows || res.data?.data || []
    },
  })

  // 2. Fetch End Devices with filters
  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['globalEndDevices', { search, partnerId, deviceType, status, page }],
    queryFn: () =>
      fetchGlobalEndDevices({
        search: search || undefined,
        partner_id: partnerId || undefined,
        device_type: deviceType || undefined,
        status: status || undefined,
        page,
        per_page: 15,
      }),
  })

  const devices = data?.data || []
  const meta = data?.meta || {}
  const metrics = data?.metrics || { total: 0, active: 0, offline: 0, faulty: 0 }

  // 3. Status Mutation
  const statusMutation = useMutation({
    mutationFn: ({ id, newStatus }) => updateEndDeviceStatus(id, newStatus),
    onSuccess: () => {
      queryClient.invalidateQueries(['globalEndDevices'])
    },
  })

  // 4. Register Device Mutation
  const registerMutation = useMutation({
    mutationFn: (form) => registerEndDevice(form.partner_id, form),
    onSuccess: () => {
      queryClient.invalidateQueries(['globalEndDevices'])
      setIsRegisterOpen(false)
      setRegForm({
        partner_id: '',
        device_type: 'MAC Address',
        identifier: '',
        customer_id: '',
        package_id: '',
        status: 'Active',
        activation_date: new Date().toISOString().split('T')[0],
      })
    },
  })

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 1800)
  }

  const getStatusBadge = (st) => {
    switch (st) {
      case 'Active':
        return <span className="badge bg-success-subtle text-success border border-success-subtle px-2 py-1"><CheckCircle2 size={12} className="me-1" /> Active</span>
      case 'Offline':
        return <span className="badge bg-warning-subtle text-warning border border-warning-subtle px-2 py-1"><WifiOff size={12} className="me-1" /> Offline</span>
      case 'Faulty':
        return <span className="badge bg-danger-subtle text-danger border border-danger-subtle px-2 py-1"><AlertOctagon size={12} className="me-1" /> Faulty</span>
      case 'Suspended':
        return <span className="badge bg-secondary-subtle text-secondary border border-secondary-subtle px-2 py-1">Suspended</span>
      default:
        return <span className="badge bg-light text-dark border px-2 py-1">{st || 'Unknown'}</span>
    }
  }

  return (
    <div className="container-fluid py-4 fade-in">
      {/* ── Page Header ── */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <h2 className="fw-bold mb-1 text-primary d-flex align-items-center gap-2">
            <Smartphone size={28} className="text-primary" />
            End Device Based Management
          </h2>
          <p className="text-muted small mb-0">
            System-wide tracking of endpoint devices, MAC bindings, CPEs, ONUs & terminal devices.
          </p>
        </div>
        <div className="d-flex align-items-center gap-2">
          <button
            className="pm-btn pm-btn-outline d-flex align-items-center gap-1 pm-btn-sm"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw size={14} className={isFetching ? 'spin-icon' : ''} /> Refresh
          </button>
          <button
            className="pm-btn pm-btn-primary d-flex align-items-center gap-2 pm-btn-sm shadow-sm"
            onClick={() => setIsRegisterOpen(true)}
          >
            <Plus size={16} /> Register End Device
          </button>
        </div>
      </div>

      {/* ── KPI Stat Cards ── */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card border-0 shadow-sm h-100 p-3" style={{ borderLeft: '4px solid #3b82f6' }}>
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <div className="text-muted fs-8 fw-semibold text-uppercase">Total End Devices</div>
                <div className="fs-3 fw-bold text-dark mt-1">{metrics.total.toLocaleString()}</div>
                <div className="fs-8 text-muted mt-1">Managed endpoints</div>
              </div>
              <div className="p-3 bg-primary-subtle text-primary rounded-3">
                <Smartphone size={24} />
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card border-0 shadow-sm h-100 p-3" style={{ borderLeft: '4px solid #10b981' }}>
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <div className="text-muted fs-8 fw-semibold text-uppercase">Active Devices</div>
                <div className="fs-3 fw-bold text-success mt-1">{metrics.active.toLocaleString()}</div>
                <div className="fs-8 text-success mt-1 d-flex align-items-center gap-1">
                  <CheckCircle2 size={12} /> {metrics.total > 0 ? Math.round((metrics.active / metrics.total) * 100) : 0}% Online rate
                </div>
              </div>
              <div className="p-3 bg-success-subtle text-success rounded-3">
                <Radio size={24} />
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card border-0 shadow-sm h-100 p-3" style={{ borderLeft: '4px solid #f59e0b' }}>
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <div className="text-muted fs-8 fw-semibold text-uppercase">Offline Terminals</div>
                <div className="fs-3 fw-bold text-warning-emphasis mt-1">{metrics.offline.toLocaleString()}</div>
                <div className="fs-8 text-muted mt-1">Pending link check</div>
              </div>
              <div className="p-3 bg-warning-subtle text-warning-emphasis rounded-3">
                <WifiOff size={24} />
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card border-0 shadow-sm h-100 p-3" style={{ borderLeft: '4px solid #ef4444' }}>
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <div className="text-muted fs-8 fw-semibold text-uppercase">Faulty / Suspended</div>
                <div className="fs-3 fw-bold text-danger mt-1">{metrics.faulty.toLocaleString()}</div>
                <div className="fs-8 text-danger mt-1">Requires inspection</div>
              </div>
              <div className="p-3 bg-danger-subtle text-danger rounded-3">
                <AlertOctagon size={24} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Search & Filter Toolbar ── */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body p-3">
          <div className="row g-2 align-items-center">
            {/* Search Input */}
            <div className="col-12 col-md-4">
              <div className="input-group input-group-sm">
                <span className="input-group-text bg-white border-end-0 text-muted">
                  <Search size={14} />
                </span>
                <input
                  type="text"
                  className="form-control border-start-0"
                  placeholder="Search MAC, Serial, Device ID, or Partner..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value)
                    setPage(1)
                  }}
                />
                {search && (
                  <button className="btn btn-outline-secondary border-start-0" onClick={() => setSearch('')}>
                    <X size={12} />
                  </button>
                )}
              </div>
            </div>

            {/* Partner Dropdown */}
            <div className="col-6 col-md-3">
              <select
                className="form-select form-select-sm"
                value={partnerId}
                onChange={(e) => {
                  setPartnerId(e.target.value)
                  setPage(1)
                }}
              >
                <option value="">All Partners</option>
                {(partnersData || []).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.partner_code} - {p.partner_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Device Type Dropdown */}
            <div className="col-6 col-md-2">
              <select
                className="form-select form-select-sm"
                value={deviceType}
                onChange={(e) => {
                  setDeviceType(e.target.value)
                  setPage(1)
                }}
              >
                <option value="">All Device Types</option>
                <option value="MAC Address">MAC Address</option>
                <option value="Router">Router</option>
                <option value="ONU">ONU / ONT</option>
                <option value="CPE">CPE</option>
                <option value="Device ID">Device ID</option>
                <option value="Serial Number">Serial Number</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Status Dropdown */}
            <div className="col-6 col-md-2">
              <select
                className="form-select form-select-sm"
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value)
                  setPage(1)
                }}
              >
                <option value="">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Offline">Offline</option>
                <option value="Faulty">Faulty</option>
                <option value="Suspended">Suspended</option>
                <option value="Retired">Retired</option>
              </select>
            </div>

            {/* Reset Filters */}
            <div className="col-6 col-md-1 d-flex justify-content-end">
              {(search || partnerId || deviceType || status) && (
                <button
                  className="btn btn-sm btn-link text-danger text-decoration-none p-0 d-flex align-items-center gap-1"
                  onClick={() => {
                    setSearch('')
                    setPartnerId('')
                    setDeviceType('')
                    setStatus('')
                    setPage(1)
                  }}
                  title="Reset Filters"
                >
                  <X size={14} /> Clear
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── End Devices Table ── */}
      <div className="card border-0 shadow-sm overflow-hidden mb-4">
        {isLoading ? (
          <div className="text-center py-5">
            <span className="spinner-border text-primary me-2" />
            <span className="text-muted">Loading end devices...</span>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light fs-7">
                <tr>
                  <th style={{ width: '40px' }}>#</th>
                  <th>Device Identifier (MAC/Serial)</th>
                  <th>Device Type</th>
                  <th>Partner Name / Code</th>
                  <th>Customer ID</th>
                  <th>Status</th>
                  <th>Activation Date</th>
                  <th className="text-end pe-3">Actions</th>
                </tr>
              </thead>
              <tbody className="fs-7">
                {devices.length > 0 ? (
                  devices.map((device, index) => (
                    <tr key={device.id}>
                      <td className="text-muted small">{(page - 1) * 15 + index + 1}</td>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <code className="fw-bold text-dark px-2 py-1 bg-light rounded border border-secondary-subtle">
                            {device.identifier}
                          </code>
                          <button
                            type="button"
                            className="btn btn-link btn-sm text-secondary p-0"
                            onClick={() => copyToClipboard(device.identifier, device.id)}
                            title="Copy identifier"
                          >
                            {copiedId === device.id ? <Check size={14} className="text-success" /> : <Copy size={14} />}
                          </button>
                        </div>
                      </td>
                      <td>
                        <span className="badge bg-light text-dark border">
                          <Tag size={11} className="me-1 text-primary" /> {device.device_type}
                        </span>
                      </td>
                      <td>
                        {device.partner ? (
                          <Link
                            to={`/partners/${device.partner.id}`}
                            className="text-decoration-none fw-semibold text-primary d-flex align-items-center gap-1"
                          >
                            <Building2 size={13} className="text-muted" />
                            {device.partner.partner_name}
                            <span className="badge bg-secondary-subtle text-secondary fs-8 ms-1">
                              {device.partner.partner_code}
                            </span>
                          </Link>
                        ) : (
                          <span className="text-muted italic">Unassigned</span>
                        )}
                      </td>
                      <td>
                        {device.customer_id ? (
                          <span className="fw-medium text-dark">CUST-{device.customer_id}</span>
                        ) : (
                          <span className="text-muted">-</span>
                        )}
                      </td>
                      <td>
                        <div className="d-inline-flex align-items-center gap-1">
                          {getStatusBadge(device.status)}
                        </div>
                      </td>
                      <td className="small text-muted">
                        {device.activation_date ? (
                          <span className="d-flex align-items-center gap-1">
                            <Calendar size={12} /> {device.activation_date}
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="text-end pe-3">
                        <select
                          className="form-select form-select-sm d-inline-block w-auto py-0 px-2"
                          style={{ fontSize: '0.75rem' }}
                          value={device.status}
                          disabled={statusMutation.isPending}
                          onChange={(e) =>
                            statusMutation.mutate({ id: device.id, newStatus: e.target.value })
                          }
                        >
                          <option value="Active">Active</option>
                          <option value="Offline">Offline</option>
                          <option value="Faulty">Faulty</option>
                          <option value="Suspended">Suspended</option>
                          <option value="Retired">Retired</option>
                        </select>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className="text-center py-5 text-muted">
                      <div className="py-4">
                        <Smartphone size={36} className="text-muted mb-2 opacity-50" />
                        <h6>No end devices found</h6>
                        <p className="small mb-3">No devices matched your query or filters.</p>
                        <button
                          className="btn btn-sm btn-primary"
                          onClick={() => setIsRegisterOpen(true)}
                        >
                          <Plus size={14} className="me-1" /> Register First Device
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Table Footer & Pagination ── */}
        {meta.total > 0 && (
          <div className="card-footer bg-white border-top p-3 d-flex flex-wrap align-items-center justify-content-between gap-2">
            <div className="small text-muted">
              Showing {(meta.current_page - 1) * meta.per_page + 1} to{' '}
              {Math.min(meta.current_page * meta.per_page, meta.total)} of {meta.total} devices
            </div>
            <div className="d-flex align-items-center gap-1">
              <button
                className="btn btn-sm btn-outline-secondary"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft size={14} /> Previous
              </button>
              <span className="small text-muted px-2">
                Page {meta.current_page} of {meta.last_page || 1}
              </span>
              <button
                className="btn btn-sm btn-outline-secondary"
                disabled={page >= (meta.last_page || 1)}
                onClick={() => setPage((p) => p + 1)}
              >
                Next <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Register End Device Modal ── */}
      {isRegisterOpen && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content shadow-lg border-0">
              <div className="modal-header border-bottom">
                <h5 className="modal-title fw-bold d-flex align-items-center gap-2">
                  <Smartphone size={20} className="text-primary" /> Register End Device
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setIsRegisterOpen(false)}
                />
              </div>
              <div className="modal-body p-4">
                <div className="mb-3">
                  <label className="form-label small fw-semibold">
                    Target Partner <span className="text-danger">*</span>
                  </label>
                  <select
                    className="form-select form-select-sm"
                    value={regForm.partner_id}
                    onChange={(e) => setRegForm({ ...regForm, partner_id: e.target.value })}
                    required
                  >
                    <option value="">Select Partner</option>
                    {(partnersData || []).map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.partner_code} - {p.partner_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="row g-2 mb-3">
                  <div className="col-6">
                    <label className="form-label small fw-semibold">Device Type</label>
                    <select
                      className="form-select form-select-sm"
                      value={regForm.device_type}
                      onChange={(e) => setRegForm({ ...regForm, device_type: e.target.value })}
                    >
                      <option value="MAC Address">MAC Address</option>
                      <option value="Router">Router</option>
                      <option value="ONU">ONU / ONT</option>
                      <option value="CPE">CPE</option>
                      <option value="Device ID">Device ID</option>
                      <option value="Serial Number">Serial Number</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="col-6">
                    <label className="form-label small fw-semibold">Initial Status</label>
                    <select
                      className="form-select form-select-sm"
                      value={regForm.status}
                      onChange={(e) => setRegForm({ ...regForm, status: e.target.value })}
                    >
                      <option value="Active">Active</option>
                      <option value="Offline">Offline</option>
                      <option value="Faulty">Faulty</option>
                      <option value="Suspended">Suspended</option>
                    </select>
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label small fw-semibold">
                    Device Identifier (MAC, Serial, or ID) <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control form-control-sm font-monospace"
                    placeholder="e.g. 00:1A:2B:3C:4D:5E or SN-98234"
                    value={regForm.identifier}
                    onChange={(e) => setRegForm({ ...regForm, identifier: e.target.value })}
                    required
                  />
                </div>

                <div className="row g-2 mb-3">
                  <div className="col-6">
                    <label className="form-label small fw-semibold">Customer ID (Optional)</label>
                    <input
                      type="number"
                      className="form-control form-control-sm"
                      placeholder="e.g. 1042"
                      value={regForm.customer_id}
                      onChange={(e) => setRegForm({ ...regForm, customer_id: e.target.value })}
                    />
                  </div>
                  <div className="col-6">
                    <label className="form-label small fw-semibold">Activation Date</label>
                    <input
                      type="date"
                      className="form-control form-control-sm"
                      value={regForm.activation_date}
                      onChange={(e) => setRegForm({ ...regForm, activation_date: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer bg-light border-top">
                <button
                  type="button"
                  className="btn btn-sm btn-secondary"
                  onClick={() => setIsRegisterOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-primary d-flex align-items-center gap-1"
                  disabled={
                    !regForm.partner_id || !regForm.identifier || registerMutation.isPending
                  }
                  onClick={() => registerMutation.mutate(regForm)}
                >
                  {registerMutation.isPending && (
                    <span className="spinner-border spinner-border-sm me-1" />
                  )}
                  {registerMutation.isPending ? 'Registering...' : 'Complete Registration'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
