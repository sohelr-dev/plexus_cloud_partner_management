import React, { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Users,
  UserCheck,
  UserX,
  UserMinus,
  UserPlus,
  TrendingUp,
  Search,
  Filter,
  Plus,
  Download,
  CheckCircle2,
  AlertCircle,
  Clock,
  Package,
  Layers,
  Phone,
  Mail,
  Wifi,
  X,
  RefreshCw,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Info
} from 'lucide-react'
import { fetchCustomerGrowth, fetchPackagePerformance, recordCustomerMetric } from '../../api/marketing'

/**

 * Displays: Total Customers, Active, Suspended, Expired, New, Renewals, Terminations, Churn
 * Note: Core subscriber details come from the billing/subscriber system.
 */
export default function UsersCustomersTab({ partnerId, partner }) {
  const queryClient = useQueryClient()

  const [isAddMetricOpen, setIsAddMetricOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [periodFilter, setPeriodFilter] = useState('All')

  const [metricForm, setMetricForm] = useState({
    metric_date: new Date().toISOString().split('T')[0],
    period_type: 'Monthly',
    opening_customers: 0,
    new_customers: 0,
    renewals: 0,
    reactivations: 0,
    suspensions: 0,
    terminations: 0,
    closing_customers: 0,
  })

  // 1. Fetch real customer growth metric data from backend
  const { data: growthData = [], isLoading: growthLoading, refetch } = useQuery({
    queryKey: ['partnerCustomerGrowth', partnerId],
    queryFn: () => fetchCustomerGrowth(partnerId),
    enabled: Boolean(partnerId),
  })

  // 2. Fetch package performance data
  const { data: packageData = [] } = useQuery({
    queryKey: ['partnerPackagePerformance', partnerId],
    queryFn: () => fetchPackagePerformance(partnerId),
    enabled: Boolean(partnerId),
  })

  // Mutation to record / sync subscriber metrics to real database
  const recordMetricMutation = useMutation({
    mutationFn: (payload) => recordCustomerMetric(partnerId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries(['partnerCustomerGrowth', partnerId])
      setIsAddMetricOpen(false)
      setMetricForm({
        metric_date: new Date().toISOString().split('T')[0],
        period_type: 'Monthly',
        opening_customers: 0,
        new_customers: 0,
        renewals: 0,
        reactivations: 0,
        suspensions: 0,
        terminations: 0,
        closing_customers: 0,
      })
    },
  })

  // Latest snapshot metrics 
  const latest = useMemo(() => {
    if (!growthData || growthData.length === 0) {
      return {
        total: partner?.active_customers_count || 0,
        active: partner?.active_customers_count || 0,
        new: 0,
        renewals: 0,
        suspensions: 0,
        terminations: 0,
        growth_rate: 0,
        churn_rate: 0,
      }
    }
    const top = growthData[0]
    return {
      total: top.closing_customers || top.opening_customers || 0,
      active: top.closing_customers || 0,
      new: top.new_customers || 0,
      renewals: top.renewals || 0,
      suspensions: top.suspensions || 0,
      terminations: top.terminations || top.churn_customers || 0,
      growth_rate: Number(top.growth_rate) || 0,
      churn_rate: Number(top.churn_rate) || 0,
    }
  }, [growthData, partner])

  // Filtered metric log list
  const filteredMetrics = useMemo(() => {
    return growthData.filter((m) => {
      const matchPeriod = periodFilter === 'All' || m.period_type === periodFilter
      const matchSearch =
        m.metric_date?.includes(searchTerm) ||
        m.period_type?.toLowerCase().includes(searchTerm.toLowerCase())
      return matchPeriod && matchSearch
    })
  }, [growthData, periodFilter, searchTerm])

  const handleMetricSubmit = (e) => {
    e.preventDefault()
    recordMetricMutation.mutate({
      metric_date: metricForm.metric_date,
      period_type: metricForm.period_type,
      opening_customers: Number(metricForm.opening_customers),
      new_customers: Number(metricForm.new_customers),
      renewals: Number(metricForm.renewals),
      reactivations: Number(metricForm.reactivations),
      suspensions: Number(metricForm.suspensions),
      terminations: Number(metricForm.terminations),
      closing_customers:
        Number(metricForm.closing_customers) ||
        Number(metricForm.opening_customers) +
          Number(metricForm.new_customers) +
          Number(metricForm.reactivations) -
          Number(metricForm.terminations),
    })
  }

  return (
    <div className="fade-in">
      {/* ── Section Header  */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <div className="d-flex align-items-center gap-2">
            <h5 className="fw-bold mb-0 text-primary d-flex align-items-center gap-2">
              <Users size={22} /> User / Customer Information
            </h5>
          </div>
          <p className="text-muted small mb-0 mt-1">
            Aggregated subscriber lifecycle, growth rate, renewals & churn intelligence.
          </p>
        </div>
        <div className="d-flex align-items-center gap-2">
          <button
            className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1 shadow-sm"
            onClick={() => refetch()}
            title="Refresh subscriber metrics"
          >
            <RefreshCw size={13} className={growthLoading ? 'spin' : ''} /> Refresh
          </button>
          <button
            className="pm-btn pm-btn-primary d-flex align-items-center gap-2 pm-btn-sm shadow-sm"
            onClick={() => setIsAddMetricOpen(true)}
          >
            <Plus size={15} /> Record / Sync Metric
          </button>
        </div>
      </div>

      {/* ── Compliance Notice Box ── */}
      <div className="alert alert-info py-2 px-3 small border-0 shadow-sm mb-4 d-flex align-items-start gap-2">
        <Info size={17} className="text-info flex-shrink-0 mt-1" />
        <div>
          <strong>Requirement:</strong> <em>"Customer information should come from the existing customer/subscriber system."</em> Individual end-user credentials and IP/Radius allocations reside in the core BSS system, while this module monitors commercial customer base health, renewals, and churn for this partner.
        </div>
      </div>

      {/* ── Customer Lifecycle KPI Grid  ── */}
      <div className="row g-3 mb-4">
        {/* Total Customers */}
        <div className="col-6 col-md-4 col-xl-2">
          <div className="card border-0 shadow-sm p-3 h-100 bg-light">
            <div className="text-muted fs-8 fw-semibold text-uppercase">Total Customers</div>
            <div className="fs-3 fw-bold text-dark mt-1">{latest.total.toLocaleString()}</div>
            <div className="fs-8 text-muted mt-1">Closing subscriber base</div>
          </div>
        </div>

        {/* Active Customers */}
        <div className="col-6 col-md-4 col-xl-2">
          <div className="card border-0 shadow-sm p-3 h-100" style={{ borderLeft: '4px solid #10b981' }}>
            <div className="text-muted fs-8 fw-semibold text-uppercase">Active Customers</div>
            <div className="fs-3 fw-bold text-success mt-1">{latest.active.toLocaleString()}</div>
            <div className="fs-8 text-success mt-1 d-flex align-items-center gap-1">
              <CheckCircle2 size={12} /> Active & Billed
            </div>
          </div>
        </div>

        {/* New Activations */}
        <div className="col-6 col-md-4 col-xl-2">
          <div className="card border-0 shadow-sm p-3 h-100" style={{ borderLeft: '4px solid #3b82f6' }}>
            <div className="text-muted fs-8 fw-semibold text-uppercase">New Customers</div>
            <div className="fs-3 fw-bold text-primary mt-1">+{latest.new}</div>
            <div className="fs-8 text-primary mt-1 d-flex align-items-center gap-1">
              <ArrowUpRight size={12} /> {latest.growth_rate}% Growth
            </div>
          </div>
        </div>

        {/* Renewals */}
        <div className="col-6 col-md-4 col-xl-2">
          <div className="card border-0 shadow-sm p-3 h-100" style={{ borderLeft: '4px solid #06b6d4' }}>
            <div className="text-muted fs-8 fw-semibold text-uppercase">Renewals</div>
            <div className="fs-3 fw-bold text-info-emphasis mt-1">{latest.renewals}</div>
            <div className="fs-8 text-muted mt-1">Recurring packages</div>
          </div>
        </div>

        {/* Suspended */}
        <div className="col-6 col-md-4 col-xl-2">
          <div className="card border-0 shadow-sm p-3 h-100" style={{ borderLeft: '4px solid #f59e0b' }}>
            <div className="text-muted fs-8 fw-semibold text-uppercase">Suspended</div>
            <div className="fs-3 fw-bold text-warning-emphasis mt-1">{latest.suspensions}</div>
            <div className="fs-8 text-muted mt-1">Payment overdue</div>
          </div>
        </div>

        {/* Terminations / Churn */}
        <div className="col-6 col-md-4 col-xl-2">
          <div className="card border-0 shadow-sm p-3 h-100" style={{ borderLeft: '4px solid #ef4444' }}>
            <div className="text-muted fs-8 fw-semibold text-uppercase">Terminations / Churn</div>
            <div className="fs-3 fw-bold text-danger mt-1">-{latest.terminations}</div>
            <div className="fs-8 text-danger mt-1 d-flex align-items-center gap-1">
              <ArrowDownRight size={12} /> {latest.churn_rate}% Churn
            </div>
          </div>
        </div>
      </div>

      {/* ── Package Breakdown  ── */}
      {packageData.length > 0 && (
        <div className="card border-0 shadow-sm mb-4">
          <div className="card-body p-3">
            <h6 className="fw-bold mb-3 d-flex align-items-center gap-2">
              <Package size={16} className="text-primary" /> Subscribed Package Performance
            </h6>
            <div className="row g-2">
              {packageData.map((pkg, idx) => (
                <div key={idx} className="col-12 col-md-4">
                  <div className="p-2 border rounded bg-light d-flex align-items-center justify-content-between">
                    <div>
                      <div className="fw-semibold fs-7">{pkg.package_name || `Package ${idx + 1}`}</div>
                      <div className="text-muted fs-8">
                        {pkg.bandwidth_mbps ? `${pkg.bandwidth_mbps} Mbps · ` : ''}
                        ৳{Number(pkg.total_revenue || 0).toLocaleString()}
                      </div>
                    </div>
                    <span className="badge bg-primary fs-7">
                      {pkg.subscriber_count || 0} Subs
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Real Database Log: Customer Growth & Lifecycle History ── */}
      <div className="card border-0 shadow-sm overflow-hidden mb-4">
        <div className="card-header bg-white py-3 border-bottom d-flex flex-wrap align-items-center justify-content-between gap-2">
          <div className="d-flex align-items-center gap-2">
            <Calendar size={16} className="text-primary" />
            <h6 className="fw-bold mb-0">Subscriber Lifecycle & Growth History (Database Log)</h6>
          </div>
          <div className="d-flex align-items-center gap-2">
            <select
              className="form-select form-select-sm"
              style={{ width: 'auto' }}
              value={periodFilter}
              onChange={(e) => setPeriodFilter(e.target.value)}
            >
              <option value="All">All Periods</option>
              <option value="Monthly">Monthly</option>
              <option value="Quarterly">Quarterly</option>
              <option value="Yearly">Yearly</option>
              <option value="Weekly">Weekly</option>
            </select>
            <input
              type="text"
              className="form-control form-control-sm"
              style={{ width: '180px' }}
              placeholder="Search date..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light fs-7">
              <tr>
                <th>Date / Period</th>
                <th>Period Type</th>
                <th>Opening Base</th>
                <th>New Customers</th>
                <th>Renewals</th>
                <th>Suspensions</th>
                <th>Terminations (Churn)</th>
                <th>Closing Active Base</th>
                <th>Growth Rate</th>
                <th>Churn Rate</th>
              </tr>
            </thead>
            <tbody className="fs-7">
              {filteredMetrics.length > 0 ? (
                filteredMetrics.map((row) => (
                  <tr key={row.id}>
                    <td className="fw-semibold text-dark">
                      {row.metric_date ? String(row.metric_date).split('T')[0] : '—'}
                    </td>
                    <td>
                      <span className="badge bg-secondary-subtle text-secondary border">
                        {row.period_type}
                      </span>
                    </td>
                    <td>{row.opening_customers?.toLocaleString() ?? 0}</td>
                    <td className="text-primary fw-bold">+{row.new_customers ?? 0}</td>
                    <td className="text-info-emphasis">{row.renewals ?? 0}</td>
                    <td className="text-warning-emphasis">{row.suspensions ?? 0}</td>
                    <td className="text-danger">-{row.terminations ?? row.churn_customers ?? 0}</td>
                    <td className="fw-bold text-success">
                      {row.closing_customers?.toLocaleString() ?? 0}
                    </td>
                    <td>
                      <span className="badge bg-success-subtle text-success">
                        +{row.growth_rate ?? 0}%
                      </span>
                    </td>
                    <td>
                      <span className="badge bg-danger-subtle text-danger">
                        {row.churn_rate ?? 0}%
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="10" className="text-center py-5 text-muted">
                    <Users size={32} className="text-secondary mb-2 d-block mx-auto" />
                    <div>No subscriber lifecycle records found for this partner.</div>
                    <button
                      className="btn btn-sm btn-primary mt-2"
                      onClick={() => setIsAddMetricOpen(true)}
                    >
                      <Plus size={13} className="me-1" /> Record First Period Metric
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Record / Sync Subscriber Metric Modal ── */}
      {isAddMetricOpen && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content shadow border-0">
              <div className="modal-header border-bottom py-3">
                <h6 className="modal-title fw-bold text-dark d-flex align-items-center gap-2">
                  <Users size={18} className="text-primary" /> Record / Sync Customer Metric                </h6>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setIsAddMetricOpen(false)}
                />
              </div>

              <form onSubmit={handleMetricSubmit}>
                <div className="modal-body p-3">
                  <p className="small text-muted mb-3">
                    Record aggregated subscriber movement from the billing/Radius sync for this partner.
                  </p>

                  <div className="row g-2 mb-3">
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold">Period Date *</label>
                      <input
                        type="date"
                        className="form-control form-control-sm"
                        value={metricForm.metric_date}
                        onChange={(e) =>
                          setMetricForm({ ...metricForm, metric_date: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold">Period Type</label>
                      <select
                        className="form-select form-select-sm"
                        value={metricForm.period_type}
                        onChange={(e) =>
                          setMetricForm({ ...metricForm, period_type: e.target.value })
                        }
                      >
                        <option value="Daily">Daily</option>
                        <option value="Weekly">Weekly</option>
                        <option value="Monthly">Monthly</option>
                        <option value="Quarterly">Quarterly</option>
                        <option value="Yearly">Yearly</option>
                      </select>
                    </div>
                  </div>

                  <div className="row g-2 mb-3">
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold">Opening Base</label>
                      <input
                        type="number"
                        min="0"
                        className="form-control form-control-sm"
                        value={metricForm.opening_customers}
                        onChange={(e) =>
                          setMetricForm({
                            ...metricForm,
                            opening_customers: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold text-primary">
                        + New Activations
                      </label>
                      <input
                        type="number"
                        min="0"
                        className="form-control form-control-sm"
                        value={metricForm.new_customers}
                        onChange={(e) =>
                          setMetricForm({
                            ...metricForm,
                            new_customers: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>

                  <div className="row g-2 mb-3">
                    <div className="col-md-4">
                      <label className="form-label small fw-semibold">Renewals</label>
                      <input
                        type="number"
                        min="0"
                        className="form-control form-control-sm"
                        value={metricForm.renewals}
                        onChange={(e) =>
                          setMetricForm({ ...metricForm, renewals: e.target.value })
                        }
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label small fw-semibold text-warning-emphasis">
                        Suspensions
                      </label>
                      <input
                        type="number"
                        min="0"
                        className="form-control form-control-sm"
                        value={metricForm.suspensions}
                        onChange={(e) =>
                          setMetricForm({ ...metricForm, suspensions: e.target.value })
                        }
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label small fw-semibold text-danger">
                        - Terminations / Churn
                      </label>
                      <input
                        type="number"
                        min="0"
                        className="form-control form-control-sm"
                        value={metricForm.terminations}
                        onChange={(e) =>
                          setMetricForm({ ...metricForm, terminations: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  <div className="mb-2">
                    <label className="form-label small fw-semibold text-success">
                      Closing Active Customers (Optional — auto-calculates if 0)
                    </label>
                    <input
                      type="number"
                      min="0"
                      className="form-control form-control-sm"
                      value={metricForm.closing_customers}
                      placeholder="Auto-calculated"
                      onChange={(e) =>
                        setMetricForm({
                          ...metricForm,
                          closing_customers: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                <div className="modal-footer border-top py-2 px-3">
                  <button
                    type="button"
                    className="btn btn-sm btn-secondary"
                    onClick={() => setIsAddMetricOpen(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-sm btn-primary d-flex align-items-center gap-1"
                    disabled={recordMetricMutation.isPending}
                  >
                    {recordMetricMutation.isPending && (
                      <span className="spinner-border spinner-border-sm" />
                    )}
                    {recordMetricMutation.isPending ? 'Saving…' : 'Save Metric to Database'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
