import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  CreditCard, TrendingUp, DollarSign, CheckCircle2, XCircle,
  Clock, Filter, RefreshCw, Building2, ChevronRight, AlertTriangle,
  BarChart3, ArrowUpRight, ArrowDownRight, Users, Calendar,
  Plus, Search
} from 'lucide-react'
import {
  fetchGlobalCommissionDashboard,
  approveCommission,
  rejectCommission,
  payCommission,
  createCommissionRule,
  createCommission,
} from '../../api/commission'
import api from '../../api/client'

const STATUSES = ['Generated', 'Pending', 'Calculated', 'Approved', 'Payable', 'Paid', 'Rejected', 'Cancelled', 'Reversed']

const STATUS_STYLE = {
  Generated:  'bg-secondary-subtle text-secondary',
  Pending:    'bg-warning-subtle text-warning',
  Calculated: 'bg-info-subtle text-info',
  Approved:   'bg-primary-subtle text-primary',
  Payable:    'bg-success-subtle text-success',
  Paid:       'bg-success text-white',
  Rejected:   'bg-danger-subtle text-danger',
  Cancelled:  'bg-dark-subtle text-dark',
  Reversed:   'bg-danger-subtle text-danger',
}

const fmt = (n) => `৳${Number(n || 0).toLocaleString()}`
const fmtNum = (n) => Number(n || 0).toLocaleString()

export default function CommissionDashboardPage() {
  const queryClient = useQueryClient()
  const now = new Date()

  // ─── Filters 
  const [filters, setFilters] = useState({
    status: '',
    month: now.getMonth() + 1,
    year: now.getFullYear(),
    partner_id: '',
  })
  const [search, setSearch] = useState('')

  // ─── Modals 
  const [activeModal, setActiveModal] = useState(null) // 'addRule' | 'addCommission' | 'pay' | 'reject'
  const [selectedComm, setSelectedComm] = useState(null)
  const [rejectReason, setRejectReason] = useState('')
  const [payForm, setPayForm] = useState({ payment_date: now.toISOString().split('T')[0], amount: '', payment_method: 'Bank Transfer', reference_number: '' })

  // Rule form
  const [ruleForm, setRuleForm] = useState({ rule_name: '', service: '', commission_type: 'Percentage', rate: '', fixed_amount: '', maximum_limit: '', effective_date: '', expiry_date: '', status: 'Active', partner_id: '' })
  // Commission form
  const [commForm, setCommForm] = useState({ partner_id: '', rule_id: '', source_reference: '', source_amount: '', commission_amount: '', period_month: now.getMonth() + 1, period_year: now.getFullYear(), remarks: '' })

  // ─── Partner list for selects
  const { data: partnersRes } = useQuery({
    queryKey: ['partnersList'],
    queryFn: async () => { const r = await api.get('/partners', { params: { per_page: 200 } }); return r.data },
  })
  const partners = partnersRes?.data || []

  // ─── Main data query 
  const { data: dashRes, isLoading, refetch } = useQuery({
    queryKey: ['commissionGlobalDashboard', filters],
    queryFn: () => fetchGlobalCommissionDashboard(filters),
  })
  const dash   = dashRes?.data || {}
  const kpis   = dash.kpis || {}
  const records = (dash.records || []).filter(c =>
    !search || c.partner_name?.toLowerCase().includes(search.toLowerCase()) ||
    c.source_reference?.toLowerCase().includes(search.toLowerCase())
  )
  const partnerBreakdown = dash.partner_breakdown || []

  // ─── Mutations
  const invalidate = () => queryClient.invalidateQueries(['commissionGlobalDashboard'])

  const approveMut = useMutation({
    mutationFn: ({ cid }) => approveCommission(cid, ''),
    onSuccess: invalidate,
  })
  const rejectMut = useMutation({
    mutationFn: ({ cid, reason }) => rejectCommission(cid, reason),
    onSuccess: () => { invalidate(); setActiveModal(null); setRejectReason('') },
  })
  const payMut = useMutation({
    mutationFn: ({ cid, data }) => payCommission(cid, data),
    onSuccess: () => { invalidate(); setActiveModal(null) },
  })
  const addRuleMut = useMutation({
    mutationFn: ({ partnerId, data }) => createCommissionRule(partnerId, data),
    onSuccess: () => { invalidate(); setActiveModal(null); setRuleForm({ rule_name: '', service: '', commission_type: 'Percentage', rate: '', fixed_amount: '', maximum_limit: '', effective_date: '', expiry_date: '', status: 'Active', partner_id: '' }) },
  })
  const addCommMut = useMutation({
    mutationFn: ({ partnerId, data }) => createCommission(partnerId, data),
    onSuccess: () => { invalidate(); setActiveModal(null); setCommForm({ partner_id: '', rule_id: '', source_reference: '', source_amount: '', commission_amount: '', period_month: now.getMonth() + 1, period_year: now.getFullYear(), remarks: '' }) },
  })

  // ─── Helpers
  const changeFilter = (k, v) => setFilters(f => ({ ...f, [k]: v }))

  return (
    <div className="pm-page">

      {/* ── Page Header  */}
      <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between mb-4 gap-3">
        <div>
          <h1 className="pm-page-title d-flex align-items-center gap-2 mb-1">
            <CreditCard size={26} className="text-primary" />
            Commission Dashboard
          </h1>
          <p className="pm-page-subtitle mb-0">
            System-wide commission engine — rules, lifecycle tracking &amp; payment management (BR-09)
          </p>
        </div>
        <div className="d-flex gap-2 flex-wrap">
          <button className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1" onClick={() => refetch()}>
            <RefreshCw size={14} /> Refresh
          </button>
          <button className="btn btn-sm btn-outline-primary d-flex align-items-center gap-1" onClick={() => setActiveModal('addRule')}>
            <Plus size={14} /> Add Rule
          </button>
          <button className="btn btn-sm btn-primary d-flex align-items-center gap-1" onClick={() => setActiveModal('addCommission')}>
            <Plus size={14} /> Record Commission
          </button>
        </div>
      </div>

      {/* ── Filter Bar  */}
      <div className="pm-card mb-4 p-3">
        <div className="row g-3 align-items-end">
          <div className="col-12 col-md-3">
            <label className="form-label small fw-semibold mb-1"><Filter size={13} className="me-1" />Status Filter</label>
            <select className="form-select form-select-sm" value={filters.status} onChange={e => changeFilter('status', e.target.value)}>
              <option value="">All Statuses</option>
              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="col-6 col-md-2">
            <label className="form-label small fw-semibold mb-1"><Calendar size={13} className="me-1" />Month</label>
            <select className="form-select form-select-sm" value={filters.month} onChange={e => changeFilter('month', Number(e.target.value))}>
              {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                <option key={m} value={m}>{String(m).padStart(2, '0')}</option>
              ))}
            </select>
          </div>
          <div className="col-6 col-md-2">
            <label className="form-label small fw-semibold mb-1">Year</label>
            <input type="number" className="form-control form-control-sm" value={filters.year} onChange={e => changeFilter('year', Number(e.target.value))} min="2020" max="2099" />
          </div>
          <div className="col-12 col-md-3">
            <label className="form-label small fw-semibold mb-1"><Building2 size={13} className="me-1" />Partner</label>
            <select className="form-select form-select-sm" value={filters.partner_id} onChange={e => changeFilter('partner_id', e.target.value)}>
              <option value="">All Partners</option>
              {partners.map(p => <option key={p.id} value={p.id}>{p.partner_name}</option>)}
            </select>
          </div>
          <div className="col-12 col-md-2">
            <label className="form-label small fw-semibold mb-1"><Search size={13} className="me-1" />Search</label>
            <input type="text" className="form-control form-control-sm" placeholder="Partner / Ref..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>
      </div>

      {/* ── KPI Cards  */}
      <div className="row g-3 mb-4">
        {[
          { label: 'Total Earned',   value: kpis.total_earned,   color: 'success', icon: TrendingUp,    note: 'Approved + Payable + Paid' },
          { label: 'Total Paid',     value: kpis.total_paid,     color: 'primary', icon: CheckCircle2,  note: 'Disbursed to partners' },
          { label: 'Payable Now',    value: kpis.total_payable,  color: 'warning', icon: DollarSign,    note: 'Approved — awaiting payment' },
          { label: 'Pending Review', value: kpis.total_pending,  color: 'danger',  icon: Clock,         note: 'Generated / Pending' },
          { label: 'Current Month',  value: kpis.current_month,  color: 'info',    icon: Calendar,      note: `${String(filters.month).padStart(2,'0')}/${filters.year}` },
          { label: 'YTD',            value: kpis.ytd,            color: 'dark',    icon: BarChart3,     note: `Full year ${filters.year}` },
        ].map(({ label, value, color, icon: Icon, note }) => (
          <div key={label} className="col-6 col-md-4 col-xl-2">
            <div className="pm-card p-3 h-100">
              <div className="d-flex align-items-start justify-content-between mb-2">
                <div className={`p-2 rounded-3 bg-${color} bg-opacity-10`}>
                  <Icon size={18} className={`text-${color}`} />
                </div>
              </div>
              <div className={`fw-bold fs-5 text-${color}`}>{fmt(value)}</div>
              <div className="fw-semibold small text-dark">{label}</div>
              <div className="text-muted" style={{ fontSize: '0.7rem' }}>{note}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Status Breakdown Pills  */}
      <div className="pm-card p-3 mb-4">
        <div className="fw-semibold small mb-2 text-muted">Status Breakdown (All Time)</div>
        <div className="d-flex flex-wrap gap-2">
          {kpis.by_status && Object.entries(kpis.by_status).map(([status, amount]) => (
            <div
              key={status}
              className={`px-3 py-1 rounded-pill border d-flex gap-2 align-items-center cursor-pointer ${filters.status === status ? 'border-primary shadow-sm' : ''}`}
              style={{ fontSize: '0.75rem', cursor: 'pointer' }}
              onClick={() => changeFilter('status', filters.status === status ? '' : status)}
            >
              <span className={`badge ${STATUS_STYLE[status] || 'bg-secondary'}`}>{status}</span>
              <span className="fw-semibold">{fmt(amount)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="row g-4">
        {/* ── Partner Breakdown Table  */}
        <div className="col-12 col-xl-4">
          <div className="pm-card p-4 h-100">
            <h6 className="fw-bold mb-3 d-flex align-items-center gap-2">
              <Users size={16} className="text-primary" /> Top Partners by Commission
            </h6>
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0" style={{ fontSize: '0.78rem' }}>
                <thead className="table-light">
                  <tr>
                    <th>Partner</th>
                    <th className="text-end">Total</th>
                    <th className="text-end">Paid</th>
                    <th className="text-end">Payable</th>
                  </tr>
                </thead>
                <tbody>
                  {partnerBreakdown.length > 0 ? partnerBreakdown.map((p) => (
                    <tr key={p.partner_id}>
                      <td>
                        <Link to={`/partners/${p.partner_id}?tab=commission`} className="text-decoration-none fw-semibold text-dark d-flex align-items-center gap-1">
                          {p.partner_name} <ChevronRight size={12} className="text-muted" />
                        </Link>
                        <div className="text-muted" style={{ fontSize: '0.68rem' }}>{fmtNum(p.count)} records</div>
                      </td>
                      <td className="text-end fw-bold text-success">{fmt(p.total)}</td>
                      <td className="text-end text-primary">{fmt(p.paid)}</td>
                      <td className="text-end">
                        {Number(p.payable) > 0
                          ? <span className="badge bg-warning-subtle text-warning">{fmt(p.payable)}</span>
                          : <span className="text-muted">—</span>}
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan="4" className="text-center py-3 text-muted">No data yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ── Commission Records Table  */}
        <div className="col-12 col-xl-8">
          <div className="pm-card p-4">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <h6 className="fw-bold mb-0 d-flex align-items-center gap-2">
                <BarChart3 size={16} className="text-primary" />
                Commission Records
                <span className="badge bg-secondary ms-1">{dash.pagination?.total || records.length}</span>
              </h6>
              {filters.status && (
                <span className={`badge ${STATUS_STYLE[filters.status] || 'bg-secondary'}`}>
                  Showing: {filters.status}
                </span>
              )}
            </div>

            {isLoading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary mb-2" />
                <div className="text-muted small">Loading commission data...</div>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle border mb-0" style={{ fontSize: '0.78rem' }}>
                  <thead className="table-light">
                    <tr>
                      <th>Partner</th>
                      <th>Period</th>
                      <th>Rule</th>
                      <th>Source Ref.</th>
                      <th className="text-end">Source (৳)</th>
                      <th className="text-end">Commission (৳)</th>
                      <th>Status</th>
                      <th>Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.length > 0 ? records.map((c) => (
                      <tr key={c.id}>
                        <td>
                          <Link to={`/partners/${c.partner_id}?tab=commission`} className="text-decoration-none fw-semibold text-dark">
                            {c.partner_name}
                          </Link>
                          <div className="text-muted" style={{ fontSize: '0.68rem' }}>{c.partner_code}</div>
                        </td>
                        <td className="fw-semibold">{String(c.period_month).padStart(2, '0')}/{c.period_year}</td>
                        <td>
                          <div>{c.rule_name || '—'}</div>
                          {c.commission_type && <div className="text-muted" style={{ fontSize: '0.68rem' }}>{c.commission_type}</div>}
                        </td>
                        <td className="text-muted">{c.source_reference || '—'}</td>
                        <td className="text-end">{fmt(c.source_amount)}</td>
                        <td className="text-end fw-bold text-success">{fmt(c.commission_amount)}</td>
                        <td>
                          <span className={`badge ${STATUS_STYLE[c.status] || 'bg-secondary'}`}>{c.status}</span>
                        </td>
                        <td className="text-muted" style={{ fontSize: '0.7rem' }}>{c.generated_at || '—'}</td>
                        <td>
                          <div className="d-flex gap-1">
                            {['Generated', 'Pending', 'Calculated'].includes(c.status) && (
                              <>
                                <button
                                  className="btn btn-xs btn-success py-0 px-2"
                                  style={{ fontSize: '0.68rem' }}
                                  disabled={approveMut.isPending}
                                  onClick={() => approveMut.mutate({ cid: c.id })}
                                  title="Approve → Payable (BR-09)"
                                >
                                  {approveMut.isPending ? <span className="spinner-border spinner-border-sm" /> : <CheckCircle2 size={11} />}
                                  {' '}Approve
                                </button>
                                <button
                                  className="btn btn-xs btn-outline-danger py-0 px-2"
                                  style={{ fontSize: '0.68rem' }}
                                  onClick={() => { setSelectedComm(c); setRejectReason(''); setActiveModal('reject') }}
                                  title="Reject"
                                >
                                  <XCircle size={11} /> Reject
                                </button>
                              </>
                            )}
                            {c.status === 'Payable' && (
                              <button
                                className="btn btn-xs btn-primary py-0 px-2"
                                style={{ fontSize: '0.68rem' }}
                                onClick={() => {
                                  setSelectedComm(c)
                                  setPayForm({ payment_date: now.toISOString().split('T')[0], amount: c.commission_amount, payment_method: 'Bank Transfer', reference_number: '' })
                                  setActiveModal('pay')
                                }}
                                title="Record Payment → Paid"
                              >
                                <DollarSign size={11} /> Pay
                              </button>
                            )}
                            {c.status === 'Paid' && (
                              <span className="text-success small d-flex align-items-center gap-1">
                                <CheckCircle2 size={11} /> {c.paid_at}
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan="9" className="text-center py-4 text-muted">
                          <AlertTriangle size={20} className="mb-2 d-block mx-auto text-warning" />
                          No commission records found for the selected filters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination info */}
            {dash.pagination && (
              <div className="mt-3 text-muted small text-end">
                Showing {records.length} of {dash.pagination.total} total records
                (Page {dash.pagination.current_page}/{dash.pagination.last_page})
              </div>
            )}
          </div>
        </div>
      </div>



      {/* ── Add Commission Rule  */}
      {activeModal === 'addRule' && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.55)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title fw-bold d-flex align-items-center gap-2">
                  <CreditCard size={18} className="text-primary" /> Add Commission Rule
                </h5>
                <button type="button" className="btn-close" onClick={() => setActiveModal(null)} />
              </div>
              <div className="modal-body">
                <div className="row g-3">
                  <div className="col-12">
                    <label className="form-label small fw-semibold">Partner *</label>
                    <select className="form-select" value={ruleForm.partner_id} onChange={e => setRuleForm({ ...ruleForm, partner_id: e.target.value })}>
                      <option value="">-- Select Partner --</option>
                      {partners.map(p => <option key={p.id} value={p.id}>{p.partner_name} ({p.partner_code})</option>)}
                    </select>
                  </div>
                  <div className="col-12">
                    <label className="form-label small fw-semibold">Rule Name *</label>
                    <input type="text" className="form-control" value={ruleForm.rule_name} onChange={e => setRuleForm({ ...ruleForm, rule_name: e.target.value })} placeholder="e.g. Bandwidth Revenue 5%" />
                  </div>
                  <div className="col-6">
                    <label className="form-label small fw-semibold">Commission Type *</label>
                    <select className="form-select" value={ruleForm.commission_type} onChange={e => setRuleForm({ ...ruleForm, commission_type: e.target.value })}>
                      {['Percentage','Fixed Amount','Per Customer','Per Activation','Per Renewal','Per Package','Revenue Based','Bandwidth Based','Custom'].map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-6">
                    <label className="form-label small fw-semibold">Service</label>
                    <input type="text" className="form-control" value={ruleForm.service} onChange={e => setRuleForm({ ...ruleForm, service: e.target.value })} placeholder="Internet, GGC, BDIX..." />
                  </div>
                  <div className="col-4">
                    <label className="form-label small fw-semibold">
                      {['Percentage','Revenue Based','Bandwidth Based','Custom'].includes(ruleForm.commission_type) ? 'Rate (%)' : 'Fixed Amount (৳)'}
                    </label>
                    {['Percentage','Revenue Based','Bandwidth Based','Custom'].includes(ruleForm.commission_type)
                      ? <input type="number" className="form-control" value={ruleForm.rate} onChange={e => setRuleForm({ ...ruleForm, rate: e.target.value })} placeholder="e.g. 5" />
                      : <input type="number" className="form-control" value={ruleForm.fixed_amount} onChange={e => setRuleForm({ ...ruleForm, fixed_amount: e.target.value })} placeholder="e.g. 5000" />
                    }
                  </div>
                  <div className="col-4">
                    <label className="form-label small fw-semibold">Max Cap (৳)</label>
                    <input type="number" className="form-control" value={ruleForm.maximum_limit} onChange={e => setRuleForm({ ...ruleForm, maximum_limit: e.target.value })} placeholder="0 = no cap" />
                  </div>
                  <div className="col-4">
                    <label className="form-label small fw-semibold">Status</label>
                    <select className="form-select" value={ruleForm.status} onChange={e => setRuleForm({ ...ruleForm, status: e.target.value })}>
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                  <div className="col-6">
                    <label className="form-label small fw-semibold">Effective Date</label>
                    <input type="date" className="form-control" value={ruleForm.effective_date} onChange={e => setRuleForm({ ...ruleForm, effective_date: e.target.value })} />
                  </div>
                  <div className="col-6">
                    <label className="form-label small fw-semibold">Expiry Date</label>
                    <input type="date" className="form-control" value={ruleForm.expiry_date} onChange={e => setRuleForm({ ...ruleForm, expiry_date: e.target.value })} />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setActiveModal(null)}>Cancel</button>
                <button
                  className="btn btn-primary d-flex align-items-center gap-1"
                  disabled={addRuleMut.isPending || !ruleForm.rule_name || !ruleForm.partner_id}
                  onClick={() => addRuleMut.mutate({ partnerId: ruleForm.partner_id, data: ruleForm })}
                >
                  {addRuleMut.isPending && <span className="spinner-border spinner-border-sm me-1" />}
                  {addRuleMut.isPending ? 'Saving...' : 'Save Commission Rule'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Record Commission  */}
      {activeModal === 'addCommission' && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.55)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title fw-bold">Record Commission Entry</h5>
                <button type="button" className="btn-close" onClick={() => setActiveModal(null)} />
              </div>
              <div className="modal-body">
                <div className="alert alert-info py-2 small mb-3">
                  <strong>Auto-calculate:</strong> Select a rule to auto-compute commission from source amount. Override manually if needed.
                </div>
                <div className="mb-3">
                  <label className="form-label small fw-semibold">Partner *</label>
                  <select className="form-select" value={commForm.partner_id} onChange={e => setCommForm({ ...commForm, partner_id: e.target.value, rule_id: '' })}>
                    <option value="">-- Select Partner --</option>
                    {partners.map(p => <option key={p.id} value={p.id}>{p.partner_name} ({p.partner_code})</option>)}
                  </select>
                </div>
                <div className="row g-2 mb-3">
                  <div className="col-6">
                    <label className="form-label small fw-semibold">Period Month *</label>
                    <select className="form-select" value={commForm.period_month} onChange={e => setCommForm({ ...commForm, period_month: Number(e.target.value) })}>
                      {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                        <option key={m} value={m}>{String(m).padStart(2, '0')}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-6">
                    <label className="form-label small fw-semibold">Period Year *</label>
                    <input type="number" className="form-control" value={commForm.period_year} onChange={e => setCommForm({ ...commForm, period_year: Number(e.target.value) })} />
                  </div>
                </div>
                <div className="mb-3">
                  <label className="form-label small fw-semibold">Source Amount (৳) *</label>
                  <input type="number" className="form-control" value={commForm.source_amount} onChange={e => setCommForm({ ...commForm, source_amount: e.target.value })} placeholder="e.g. 100000" />
                </div>
                <div className="mb-3">
                  <label className="form-label small fw-semibold">Override Commission Amount (৳)</label>
                  <input type="number" className="form-control" value={commForm.commission_amount} onChange={e => setCommForm({ ...commForm, commission_amount: e.target.value })} placeholder="Leave blank = auto from rule" />
                </div>
                <div className="mb-3">
                  <label className="form-label small fw-semibold">Source Reference</label>
                  <input type="text" className="form-control" value={commForm.source_reference} onChange={e => setCommForm({ ...commForm, source_reference: e.target.value })} placeholder="Invoice / Transaction ID" />
                </div>
                <div className="mb-3">
                  <label className="form-label small fw-semibold">Remarks</label>
                  <textarea className="form-control" rows="2" value={commForm.remarks} onChange={e => setCommForm({ ...commForm, remarks: e.target.value })} />
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setActiveModal(null)}>Cancel</button>
                <button
                  className="btn btn-success d-flex align-items-center gap-1"
                  disabled={addCommMut.isPending || !commForm.source_amount || !commForm.partner_id}
                  onClick={() => addCommMut.mutate({ partnerId: commForm.partner_id, data: commForm })}
                >
                  {addCommMut.isPending && <span className="spinner-border spinner-border-sm me-1" />}
                  {addCommMut.isPending ? 'Saving...' : 'Record Commission (→ Generated)'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Pay Commission (BR-09)  */}
      {activeModal === 'pay' && selectedComm && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.55)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title fw-bold d-flex align-items-center gap-2">
                  <DollarSign size={18} className="text-success" /> Record Commission Payment
                </h5>
                <button type="button" className="btn-close" onClick={() => setActiveModal(null)} />
              </div>
              <div className="modal-body">
                <div className="pm-card p-3 mb-3 bg-success bg-opacity-10 border-success border">
                  <div className="fw-semibold">{selectedComm.partner_name}</div>
                  <div className="text-muted small">{selectedComm.rule_name} — Period: {String(selectedComm.period_month).padStart(2,'0')}/{selectedComm.period_year}</div>
                  <div className="fw-bold text-success fs-5 mt-1">Commission: {fmt(selectedComm.commission_amount)}</div>
                </div>
                <div className="alert alert-success py-2 small">
                  <strong>BR-09 Compliant:</strong> Commission is Approved → Payable. Recording payment will mark it as Paid.
                </div>
                <div className="mb-3">
                  <label className="form-label small fw-semibold">Payment Date *</label>
                  <input type="date" className="form-control" value={payForm.payment_date} onChange={e => setPayForm({ ...payForm, payment_date: e.target.value })} />
                </div>
                <div className="mb-3">
                  <label className="form-label small fw-semibold">Amount (৳) *</label>
                  <input type="number" className="form-control" value={payForm.amount} onChange={e => setPayForm({ ...payForm, amount: e.target.value })} />
                </div>
                <div className="mb-3">
                  <label className="form-label small fw-semibold">Payment Method</label>
                  <select className="form-select" value={payForm.payment_method} onChange={e => setPayForm({ ...payForm, payment_method: e.target.value })}>
                    {['Bank Transfer','Cheque','Cash','Mobile Banking','Other'].map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div className="mb-3">
                  <label className="form-label small fw-semibold">Reference Number</label>
                  <input type="text" className="form-control" value={payForm.reference_number} onChange={e => setPayForm({ ...payForm, reference_number: e.target.value })} placeholder="Bank TXN / Cheque #" />
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setActiveModal(null)}>Cancel</button>
                <button
                  className="btn btn-primary d-flex align-items-center gap-1"
                  disabled={payMut.isPending || !payForm.amount}
                  onClick={() => payMut.mutate({ cid: selectedComm.id, data: payForm })}
                >
                  {payMut.isPending && <span className="spinner-border spinner-border-sm me-1" />}
                  {payMut.isPending ? 'Processing...' : 'Record Payment (→ Paid)'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Reject Commission  */}
      {activeModal === 'reject' && selectedComm && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.55)' }}>
          <div className="modal-dialog modal-dialog-centered modal-sm">
            <div className="modal-content">
              <div className="modal-header">
                <h6 className="modal-title fw-bold d-flex align-items-center gap-2">
                  <XCircle size={16} className="text-danger" /> Reject Commission
                </h6>
                <button type="button" className="btn-close" onClick={() => setActiveModal(null)} />
              </div>
              <div className="modal-body">
                <div className="text-muted small mb-2">
                  Partner: <strong>{selectedComm.partner_name}</strong> — {fmt(selectedComm.commission_amount)}
                </div>
                <textarea
                  className="form-control"
                  rows="3"
                  placeholder="Reason for rejection (required)..."
                  value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
                />
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary btn-sm" onClick={() => setActiveModal(null)}>Cancel</button>
                <button
                  className="btn btn-danger btn-sm d-flex align-items-center gap-1"
                  disabled={rejectMut.isPending || !rejectReason}
                  onClick={() => rejectMut.mutate({ cid: selectedComm.id, reason: rejectReason })}
                >
                  {rejectMut.isPending && <span className="spinner-border spinner-border-sm" />}
                  {rejectMut.isPending ? 'Rejecting...' : 'Confirm Reject'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
