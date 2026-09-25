import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Building2, Users, DollarSign, CheckCircle, Clock,
  XCircle, TrendingDown, Search, Filter
} from 'lucide-react'
import { fetchGlobalSCDashboard } from '../../api/supportCenter'
import { Link } from 'react-router-dom'

const STATUS_CONFIG = {
  Active:              { cls: 'bg-success-subtle text-success',       icon: <CheckCircle size={11} /> },
  Planned:             { cls: 'bg-info-subtle text-info',             icon: <Clock size={11} /> },
  'Temporarily Closed':{ cls: 'bg-warning-subtle text-warning',       icon: <Clock size={11} /> },
  Suspended:           { cls: 'bg-danger-subtle text-danger',         icon: <XCircle size={11} /> },
  Closed:              { cls: 'bg-secondary-subtle text-secondary',   icon: <TrendingDown size={11} /> },
}

function KpiCard({ icon, label, value, sub, color = 'primary' }) {
  return (
    <div className="pm-card p-3 h-100">
      <div className="d-flex align-items-center gap-3">
        <div className={`rounded-3 p-2 bg-${color}-subtle`}>
          {React.cloneElement(icon, { size: 22, className: `text-${color}` })}
        </div>
        <div>
          <div className="fw-bold fs-5 lh-1">{value}</div>
          <div className="text-muted small">{label}</div>
          {sub && <div className="text-muted" style={{ fontSize: '0.72rem' }}>{sub}</div>}
        </div>
      </div>
    </div>
  )
}

export default function SupportCenterDashboardPage() {
  const [search, setSearch]   = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const { data, isLoading, isError } = useQuery({
    queryKey: ['globalSCDashboard', statusFilter],
    queryFn: () => fetchGlobalSCDashboard({ status: statusFilter || undefined }),
    select: (res) => res.data,
  })

  const centers = (data?.centers ?? []).filter(c => {
    if (!search) return true
    const s = search.toLowerCase()
    return (
      c.center_name?.toLowerCase().includes(s) ||
      c.sc_id?.toLowerCase().includes(s) ||
      c.partner?.partner_name?.toLowerCase().includes(s) ||
      c.partner?.partner_code?.toLowerCase().includes(s)
    )
  })

  return (
    <div className="container-fluid py-4 fade-in">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-end mb-4">
        <div>
          <h2 className="fw-bold mb-1 d-flex align-items-center gap-2">
            <Building2 size={28} className="text-primary" />
            Support Center Management
          </h2>
          <p className="text-muted mb-0">System-wide branch overview — all partners, all branches</p>
        </div>
      </div>

      {/* KPI Row */}
      {isLoading ? (
        <div className="text-center py-5"><span className="spinner-border text-primary" /></div>
      ) : isError ? (
        <div className="alert alert-danger">Failed to load dashboard. Please try again.</div>
      ) : (
        <>
          <div className="row g-3 mb-4">
            <div className="col-6 col-md-2">
              <KpiCard icon={<Building2 />} label="Total Branches" value={data?.total_centers ?? 0} color="primary" />
            </div>
            <div className="col-6 col-md-2">
              <KpiCard icon={<CheckCircle />} label="Active" value={data?.active_centers ?? 0} color="success" />
            </div>
            <div className="col-6 col-md-2">
              <KpiCard icon={<Clock />} label="Planned" value={data?.planned_centers ?? 0} color="info" />
            </div>
            <div className="col-6 col-md-2">
              <KpiCard icon={<XCircle />} label="Closed/Suspended" value={data?.closed_centers ?? 0} color="danger" />
            </div>
            <div className="col-6 col-md-2">
              <KpiCard icon={<Users />} label="Total Staff" value={data?.total_staff ?? 0} color="warning" />
            </div>
            <div className="col-6 col-md-2">
              <KpiCard
                icon={<DollarSign />}
                label="Monthly Cost"
                value={`৳${Number((data?.total_monthly_staff_cost ?? 0) + (data?.total_monthly_op_cost ?? 0)).toLocaleString()}`}
                sub={`Staff: ৳${Number(data?.total_monthly_staff_cost ?? 0).toLocaleString()}`}
                color="secondary"
              />
            </div>
          </div>

          {/* Filters */}
          <div className="pm-card p-3 mb-3">
            <div className="row g-2 align-items-center">
              <div className="col-md-5">
                <div className="input-group input-group-sm">
                  <span className="input-group-text"><Search size={14} /></span>
                  <input
                    className="form-control"
                    placeholder="Search branch, SC ID, or partner…"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
                </div>
              </div>
              <div className="col-md-3">
                <div className="input-group input-group-sm">
                  <span className="input-group-text"><Filter size={14} /></span>
                  <select className="form-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                    <option value="">All Status</option>
                    {['Active','Planned','Temporarily Closed','Suspended','Closed'].map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="col-md-4 text-end">
                <span className="text-muted small">{centers.length} branch{centers.length !== 1 ? 'es' : ''} found</span>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="pm-card p-0">
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0 fs-7">
                <thead className="table-light">
                  <tr>
                    <th>SC ID</th>
                    <th>Branch Name</th>
                    <th>Type</th>
                    <th>Partner</th>
                    <th>Status</th>
                    <th>Active Staff</th>
                    <th>Monthly Staff Cost</th>
                    <th>Monthly Op. Cost</th>
                    <th>Total Cost</th>
                    <th>Equipment</th>
                    <th>Opened</th>
                  </tr>
                </thead>
                <tbody>
                  {centers.length > 0 ? centers.map(c => {
                    const sc = STATUS_CONFIG[c.status] || { cls: 'bg-secondary-subtle text-secondary', icon: null }
                    return (
                      <tr key={c.id}>
                        <td className="fw-bold text-primary font-monospace">{c.sc_id}</td>
                        <td className="fw-semibold">{c.center_name}</td>
                        <td><span className="badge bg-light text-dark border">{c.branch_type || '—'}</span></td>
                        <td>
                          {c.partner ? (
                            <Link to={`/partners/${c.partner.id}`} className="text-decoration-none fw-bold text-primary">
                              {c.partner.partner_code}
                              <div className="text-muted fw-normal" style={{ fontSize: '0.7rem' }}>{c.partner.partner_name}</div>
                            </Link>
                          ) : '—'}
                        </td>
                        <td>
                          <span className={`badge d-inline-flex align-items-center gap-1 ${sc.cls}`}>
                            {sc.icon} {c.status}
                          </span>
                        </td>
                        <td className="text-center">{c.active_staff}</td>
                        <td className="text-end text-warning fw-bold">৳{Number(c.monthly_staff_cost).toLocaleString()}</td>
                        <td className="text-end fw-bold">৳{Number(c.monthly_op_cost).toLocaleString()}</td>
                        <td className="text-end text-danger fw-bold">৳{Number(c.total_monthly_cost).toLocaleString()}</td>
                        <td className="text-center">{c.equipment_units}</td>
                        <td>{c.opening_date ? new Date(c.opening_date).toLocaleDateString() : '—'}</td>
                      </tr>
                    )
                  }) : (
                    <tr>
                      <td colSpan="11" className="text-center py-4 text-muted">No branches found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
