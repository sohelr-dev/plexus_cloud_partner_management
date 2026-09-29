import { useState, useRef, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  fetchOutstanding,
  fetchAccountsCommissions,
  fetchInvoices,
  fetchCreditOverview,
  recordAccountsPayment,
  fetchPartnersDropdown,
} from '../../api/accounts'
import { usePermissions } from '../../context/PermissionContext'

const Icon = ({ path, size = 18, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round"
    strokeLinejoin="round" className={className}>
    <path d={path} />
  </svg>
)

const ICONS = {
  wallet:    'M21 12V7H5a2 2 0 010-4h14v4M21 12v5H5a2 2 0 000 4h16v-5M21 12H5',
  invoice:   'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8',
  aging:     'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
  credit:    'M22 12h-4l-3 9L9 3l-3 9H2',
  coin:      'M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6',
  plus:      'M12 5v14M5 12h14',
  search:    'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z',
  check:     'M20 6L9 17l-5-5',
  warning:   'M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01',
  refresh:   'M1 4v6h6M23 20v-6h-6M20.49 9A9 9 0 005.64 5.64L1 10M23 14l-4.64 4.36A9 9 0 013.51 15',
  x:         'M18 6L6 18M6 6l12 12',
}

const TABS = [
  { key: 'outstanding', label: 'Outstanding & Aging', icon: ICONS.aging,   color: '#ef4444' },
  { key: 'invoices',    label: 'Invoice Summary',      icon: ICONS.invoice, color: '#3b82f6' },
  { key: 'commissions', label: 'Commission Payable',   icon: ICONS.coin,    color: '#f59e0b' },
  { key: 'credit',      label: 'Credit Overview',      icon: ICONS.credit,  color: '#8b5cf6' },
]

const taka = (n) => '৳' + Number(n ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })

const AgingBar = ({ aging }) => {
  const total = (aging?.current || 0) + (aging?.days_30 || 0) + (aging?.days_60 || 0) + (aging?.days_90 || 0)
  if (!total) return <span className="text-muted small">—</span>
  const pct = (v) => Math.round((v / total) * 100)
  return (
    <div style={{ display: 'flex', height: 8, borderRadius: 4, overflow: 'hidden', gap: 1, minWidth: 120 }}>
      {aging.current > 0 && <div style={{ width: pct(aging.current) + '%', background: '#10b981' }} title={`Current: ${taka(aging.current)}`} />}
      {aging.days_30 > 0 && <div style={{ width: pct(aging.days_30) + '%', background: '#f59e0b' }} title={`31-60d: ${taka(aging.days_30)}`} />}
      {aging.days_60 > 0 && <div style={{ width: pct(aging.days_60) + '%', background: '#f97316' }} title={`61-90d: ${taka(aging.days_60)}`} />}
      {aging.days_90 > 0 && <div style={{ width: pct(aging.days_90) + '%', background: '#ef4444' }} title={`90+d: ${taka(aging.days_90)}`} />}
    </div>
  )
}

const RiskBadge = ({ level }) => {
  const map = {
    exceeded: ['bg-danger',   'Exceeded'],
    high:     ['bg-warning text-dark', 'High'],
    medium:   ['bg-info text-dark',    'Medium'],
    low:      ['bg-success',  'Low'],
  }
  const [cls, label] = map[level] ?? ['bg-secondary', level]
  return <span className={`badge ${cls}`}>{label}</span>
}

const StatusBadge = ({ status }) => {
  const map = {
    Active:    'success', Suspended: 'warning', Blocked: 'danger',
    Draft:     'secondary', Inactive: 'secondary', Terminated: 'dark',
    Approved:  'primary',  Payable: 'success',
  }
  return <span className={`badge bg-${map[status] ?? 'secondary'}`}>{status}</span>
}

const Spinner = ({ size = 'lg' }) => <span className={`spinner-border spinner-border-${size}`} role="status" />

function KpiCard({ label, value, sub, color = '#3b82f6', icon }) {
  return (
    <div className="col-sm-6 col-xl-3">
      <div className="card border-0 shadow-sm h-100" style={{ borderLeft: `4px solid ${color}` }}>
        <div className="card-body d-flex align-items-center gap-3 py-3">
          <div style={{
            width: 44, height: 44, borderRadius: 10, display: 'flex', alignItems: 'center',
            justifyContent: 'center', background: color + '22', flexShrink: 0,
          }}>
            <Icon path={icon} size={20} style={{ color }} />
          </div>
          <div>
            <div className="fw-bold" style={{ fontSize: '1.15rem', color }}>{value}</div>
            <div className="text-muted small">{label}</div>
            {sub && <div className="text-muted" style={{ fontSize: '0.75rem' }}>{sub}</div>}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Searchable Partner Picker ────────────────────────────────────────────────
function PartnerPicker({ partners = [], value, onChange }) {
  const [query, setQuery]   = useState('')
  const [open, setOpen]     = useState(false)
  const wrapRef             = useRef(null)

  const selected = partners.find((p) => String(p.id) === String(value))

  const filtered = query.trim()
    ? partners.filter((p) =>
        p.name?.toLowerCase().includes(query.toLowerCase()) ||
        p.partner_code?.toLowerCase().includes(query.toLowerCase())
      )
    : partners

  // Close on outside click
  useEffect(() => {
    const handler = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const select = (p) => {
    onChange(String(p.id))
    setQuery('')
    setOpen(false)
  }

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      {/* Trigger / selected display */}
      {selected && !open ? (
        <div
          className="form-control d-flex align-items-center justify-content-between"
          style={{ cursor: 'pointer', background: '#f0f9ff', borderColor: '#0ea5e9' }}
          onClick={() => setOpen(true)}
        >
          <div>
            <span className="fw-semibold" style={{ color: '#0369a1' }}>{selected.name}</span>
            <span className="ms-2 badge bg-secondary" style={{ fontSize: '0.7rem' }}>
              {selected.partner_code}
            </span>
          </div>
          <span className="text-muted small">✎</span>
        </div>
      ) : (
        <input
          autoFocus={open}
          className="form-control"
          placeholder="🔍  Search partner name or code…"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
        />
      )}

      {/* Dropdown list */}
      {open && (
        <div style={{
          position: 'absolute', zIndex: 1050, top: '100%', left: 0, right: 0,
          background: '#fff', border: '1px solid #d1d5db', borderRadius: 8,
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)', maxHeight: 240, overflowY: 'auto',
          marginTop: 4,
        }}>
          {filtered.length === 0 ? (
            <div className="px-3 py-2 text-muted small">No partners found</div>
          ) : filtered.map((p) => (
            <div
              key={p.id}
              onMouseDown={() => select(p)}
              style={{
                padding: '8px 12px', cursor: 'pointer',
                background: String(p.id) === String(value) ? '#e0f2fe' : 'transparent',
                borderBottom: '1px solid #f3f4f6',
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#f0f9ff'}
              onMouseLeave={(e) => e.currentTarget.style.background =
                String(p.id) === String(value) ? '#e0f2fe' : 'transparent'
              }
            >
              <div className="fw-semibold" style={{ fontSize: '0.875rem', color: '#111827' }}>
                {p.name}
              </div>
              <div className="d-flex gap-2 mt-1">
                <span className="badge" style={{ background: '#e0f2fe', color: '#0369a1', fontSize: '0.7rem' }}>
                  {p.partner_code}
                </span>
                <span className={`badge bg-${{ Active: 'success', Suspended: 'warning', Inactive: 'secondary' }[p.status] ?? 'secondary'}`}
                  style={{ fontSize: '0.7rem' }}>
                  {p.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function PaymentModal({ partnerId, partnerName, onClose, onSuccess }) {
  const [form, setForm] = useState({
    partner_id:       partnerId ?? '',
    payment_date:     new Date().toISOString().split('T')[0],
    payment_method:   'Bank Transfer',
    amount:           '',
    reference_number: '',
    remarks:          '',
  })
  const [error, setError] = useState(null)

  // Fetch partner list only when picker is needed (no pre-selected partner)
  const { data: partnersList = [] } = useQuery({
    queryKey: ['partners-dropdown'],
    queryFn:  fetchPartnersDropdown,
    enabled:  !partnerId,
    staleTime: 5 * 60 * 1000,
  })

  const partners = Array.isArray(partnersList)
    ? partnersList
    : (partnersList?.data ?? [])

  const selectedPartner = partnerId
    ? { name: partnerName }
    : partners.find((p) => String(p.id) === String(form.partner_id))

  const mutation = useMutation({
    mutationFn: recordAccountsPayment,
    onSuccess: () => { onSuccess?.(); onClose() },
    onError: (e) => setError(e?.response?.data?.message || 'Failed to record payment.'),
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.partner_id) { setError('Please select a partner.'); return }
    setError(null)
    mutation.mutate({ ...form, amount: parseFloat(form.amount) })
  }

  return (
    <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.55)' }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content shadow-lg border-0">
          <div className="modal-header border-bottom" style={{ background: 'linear-gradient(135deg,#1e3a5f,#0ea5e9)', color: '#fff' }}>
            <h5 className="modal-title fw-bold">
              <Icon path={ICONS.wallet} size={18} className="me-2" />
              Record Payment
              {selectedPartner?.name && (
                <span className="ms-2 opacity-90" style={{ fontWeight: 400, fontSize: '0.95rem' }}>
                  — {selectedPartner.name}
                </span>
              )}
            </h5>
            <button type="button" className="btn-close btn-close-white" onClick={onClose} />
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body p-4">
              {error && (
                <div className="alert alert-danger py-2 small">{error}</div>
              )}

              {/* Partner Picker — only shown when not pre-selected */}
              {!partnerId && (
                <div className="mb-3">
                  <label className="form-label fw-semibold small">
                    <Icon path={ICONS.search} size={13} className="me-1" />
                    Select Partner *
                  </label>
                  {partners.length === 0 ? (
                    <div className="d-flex align-items-center gap-2 text-muted small">
                      <Spinner size="sm" /> Loading partners…
                    </div>
                  ) : (
                    <PartnerPicker
                      partners={partners}
                      value={form.partner_id}
                      onChange={(id) => setForm({ ...form, partner_id: id })}
                    />
                  )}
                  {form.partner_id && (
                    <div className="form-text text-success">
                      ✓ Partner ID: <strong>{form.partner_id}</strong>
                    </div>
                  )}
                </div>
              )}

              <div className="row g-3">
                <div className="col-sm-6">
                  <label className="form-label fw-semibold small">Payment Date *</label>
                  <input type="date" className="form-control" required
                    value={form.payment_date}
                    onChange={(e) => setForm({ ...form, payment_date: e.target.value })} />
                </div>
                <div className="col-sm-6">
                  <label className="form-label fw-semibold small">Method *</label>
                  <select className="form-select" required value={form.payment_method}
                    onChange={(e) => setForm({ ...form, payment_method: e.target.value })}>
                    {['Cash','Bank Transfer','Cheque','Online','Adjustment'].map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
                <div className="col-sm-6">
                  <label className="form-label fw-semibold small">Amount (৳) *</label>
                  <input type="number" className="form-control" required min="1" step="0.01"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    placeholder="0.00" />
                </div>
                <div className="col-sm-6">
                  <label className="form-label fw-semibold small">Reference / Cheque No.</label>
                  <input type="text" className="form-control"
                    value={form.reference_number}
                    onChange={(e) => setForm({ ...form, reference_number: e.target.value })}
                    placeholder="Optional" />
                </div>
                <div className="col-12">
                  <label className="form-label fw-semibold small">Remarks</label>
                  <textarea className="form-control" rows={2}
                    value={form.remarks}
                    onChange={(e) => setForm({ ...form, remarks: e.target.value })}
                    placeholder="Optional note..." />
                </div>
              </div>
            </div>
            <div className="modal-footer border-top bg-light">
              <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn btn-primary btn-sm"
                disabled={mutation.isPending || (!partnerId && !form.partner_id)}
                style={{ background: '#0ea5e9', borderColor: '#0ea5e9' }}>
                {mutation.isPending ? <><Spinner size="sm" /> Saving…</> : 'Record Payment'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}


function OutstandingTab({ canPay }) {
  const [search, setSearch]   = useState('')
  const [aging, setAging]     = useState('')
  const [page, setPage]       = useState(1)
  const [payModal, setPayModal] = useState(null)
  const queryClient = useQueryClient()

  const params = { search, aging: aging || undefined, page, per_page: 20 }
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['accounts-outstanding', params],
    queryFn: () => fetchOutstanding(params),
  })

  const summary = data?.summary ?? {}
  const rows    = data?.data    ?? []
  const meta    = data?.meta    ?? {}

  return (
    <div>
      {/* KPI row */}
      <div className="row g-3 mb-4">
        <KpiCard label="Total Outstanding" value={taka(summary.total_outstanding)} color="#ef4444" icon={ICONS.aging}
          sub={`${summary.total_partners_with_outstanding ?? 0} partners`} />
        <KpiCard label="Current (0–30d)" value={taka(summary.aging_current)} color="#10b981" icon={ICONS.check} />
        <KpiCard label="31–60 Days" value={taka(summary.aging_30)} color="#f59e0b" icon={ICONS.warning}
          sub="Overdue" />
        <KpiCard label="61–90+ Days"
          value={taka((summary.aging_60 ?? 0) + (summary.aging_90 ?? 0))}
          color="#ef4444" icon={ICONS.warning}
          sub={`${summary.credit_exceeded_count ?? 0} credit limit breaches`} />
      </div>

      {/* Filters */}
      <div className="d-flex gap-2 mb-3 flex-wrap align-items-center">
        <div className="input-group" style={{ maxWidth: 280 }}>
          <span className="input-group-text"><Icon path={ICONS.search} size={14} /></span>
          <input className="form-control form-control-sm" placeholder="Search partner…"
            value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} />
        </div>
        <select className="form-select form-select-sm" style={{ maxWidth: 160 }}
          value={aging} onChange={(e) => { setAging(e.target.value); setPage(1) }}>
          <option value="">All Aging Bands</option>
          <option value="current">Current (0–30d)</option>
          <option value="30">31–60 Days</option>
          <option value="60">61–90 Days</option>
          <option value="90">90+ Days</option>
        </select>
        {canPay && (
          <button className="btn btn-sm btn-primary ms-auto"
            style={{ background: '#0ea5e9', borderColor: '#0ea5e9' }}
            onClick={() => setPayModal({ partnerId: null, partnerName: null })}>
            <Icon path={ICONS.plus} size={14} /> Record Payment
          </button>
        )}
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="text-center py-5"><Spinner /></div>
      ) : error ? (
        <div className="alert alert-danger">Failed to load outstanding data.</div>
      ) : (
        <div className="table-responsive rounded border shadow-sm">
          <table className="table table-hover align-middle mb-0" style={{ fontSize: '0.86rem' }}>
            <thead className="table-light">
              <tr style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                <th>Partner</th>
                <th>Status</th>
                <th className="text-end">Invoiced</th>
                <th className="text-end">Paid</th>
                <th className="text-end">Outstanding</th>
                <th style={{ minWidth: 140 }}>Aging Distribution</th>
                <th className="text-end">Credit</th>
                <th className="text-end">Util%</th>
                <th>Last Payment</th>
                {canPay && <th />}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr><td colSpan={canPay ? 10 : 9} className="text-center py-5 text-muted">
                  No outstanding balances found.
                </td></tr>
              ) : rows.map((r) => (
                <tr key={r.partner_id} className={r.credit_exceeded ? 'table-danger' : ''}>
                  <td>
                    <div className="fw-semibold">{r.partner_name}</div>
                    <div className="text-muted" style={{ fontSize: '0.75rem' }}>{r.partner_id} · {r.partner_code}</div>
                    {r.account_manager && <div className="text-muted" style={{ fontSize: '0.72rem' }}>AM: {r.account_manager}</div>}
                  </td>
                  <td><StatusBadge status={r.status} /></td>
                  <td className="text-end text-muted">{taka(r.total_invoiced)}</td>
                  <td className="text-end text-muted">{taka(r.total_paid)}</td>
                  <td className="text-end fw-bold" style={{ color: r.credit_exceeded ? '#dc2626' : '#1e3a5f' }}>
                    {taka(r.outstanding)}
                    {r.credit_exceeded && (
                      <div style={{ fontSize: '0.7rem', color: '#dc2626' }}>⚠ Limit Exceeded</div>
                    )}
                  </td>
                  <td>
                    <AgingBar aging={r.aging} />
                    <div className="d-flex gap-2 mt-1" style={{ fontSize: '0.68rem', color: '#6b7280' }}>
                      <span style={{ color: '#10b981' }}>▮ {taka(r.aging?.current)}</span>
                      <span style={{ color: '#f59e0b' }}>▮ {taka(r.aging?.days_30)}</span>
                      <span style={{ color: '#f97316' }}>▮ {taka(r.aging?.days_60)}</span>
                      <span style={{ color: '#ef4444' }}>▮ {taka(r.aging?.days_90)}</span>
                    </div>
                  </td>
                  <td className="text-end text-muted">{r.credit_limit > 0 ? taka(r.credit_limit) : '—'}</td>
                  <td className="text-end">
                    {r.credit_utilization != null ? (
                      <span style={{ color: r.credit_utilization >= 100 ? '#dc2626' : r.credit_utilization >= 80 ? '#f59e0b' : '#6b7280' }}>
                        {r.credit_utilization}%
                      </span>
                    ) : '—'}
                  </td>
                  <td className="text-muted">{r.last_payment_date ?? '—'}</td>
                  {canPay && (
                    <td>
                      <button className="btn btn-outline-primary btn-sm py-0 px-2"
                        style={{ fontSize: '0.78rem' }}
                        onClick={() => setPayModal({ partnerId: r.partner_db_id, partnerName: r.partner_name })}>
                        Pay
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {meta.last_page > 1 && (
        <div className="d-flex justify-content-center gap-2 mt-3">
          <button className="btn btn-sm btn-outline-secondary" disabled={page <= 1}
            onClick={() => setPage(p => p - 1)}>‹ Prev</button>
          <span className="small text-muted align-self-center">
            Page {meta.current_page} of {meta.last_page}
          </span>
          <button className="btn btn-sm btn-outline-secondary" disabled={page >= meta.last_page}
            onClick={() => setPage(p => p + 1)}>Next ›</button>
        </div>
      )}

      {/* Aging Legend */}
      <div className="d-flex gap-3 mt-3 flex-wrap" style={{ fontSize: '0.76rem', color: '#6b7280' }}>
        <span><span style={{ color: '#10b981' }}>●</span> Current (0–30d)</span>
        <span><span style={{ color: '#f59e0b' }}>●</span> 31–60 Days</span>
        <span><span style={{ color: '#f97316' }}>●</span> 61–90 Days</span>
        <span><span style={{ color: '#ef4444' }}>●</span> 90+ Days (Critical)</span>
      </div>

      {payModal && (
        <PaymentModal
          partnerId={payModal.partnerId}
          partnerName={payModal.partnerName}
          onClose={() => setPayModal(null)}
          onSuccess={() => {
            setPayModal(null)
            queryClient.invalidateQueries(['accounts-outstanding'])
          }}
        />
      )}
    </div>
  )
}

function InvoicesTab({ canPay }) {
  const [search, setSearch] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo]     = useState('')
  const [page, setPage]         = useState(1)
  const [payModal, setPayModal] = useState(null)
  const queryClient = useQueryClient()

  const params = { search, date_from: dateFrom || undefined, date_to: dateTo || undefined, page, per_page: 20 }
  const { data, isLoading, error } = useQuery({
    queryKey: ['accounts-invoices', params],
    queryFn: () => fetchInvoices(params),
  })

  const summary = data?.summary ?? {}
  const rows    = data?.data    ?? []
  const meta    = data?.meta    ?? {}

  return (
    <div>
      <div className="row g-3 mb-4">
        <KpiCard label="Total Invoiced"    value={taka(summary.total_invoiced)}    color="#3b82f6" icon={ICONS.invoice} sub={`${summary.partner_count ?? 0} partners`} />
        <KpiCard label="Total Paid"        value={taka(summary.total_paid)}        color="#10b981" icon={ICONS.check} />
        <KpiCard label="Total Outstanding" value={taka(summary.total_outstanding)} color="#ef4444" icon={ICONS.aging} />
        <KpiCard label="Collection Rate"
          value={summary.total_invoiced > 0 ? Math.round((summary.total_paid / summary.total_invoiced) * 100) + '%' : '—'}
          color="#8b5cf6" icon={ICONS.wallet} />
      </div>

      <div className="d-flex gap-2 mb-3 flex-wrap align-items-center">
        <div className="input-group" style={{ maxWidth: 240 }}>
          <span className="input-group-text"><Icon path={ICONS.search} size={14} /></span>
          <input className="form-control form-control-sm" placeholder="Search partner…"
            value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} />
        </div>
        <input type="date" className="form-control form-control-sm" style={{ maxWidth: 155 }}
          value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1) }} title="From date" />
        <input type="date" className="form-control form-control-sm" style={{ maxWidth: 155 }}
          value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1) }} title="To date" />
        {canPay && (
          <button className="btn btn-sm btn-primary ms-auto"
            style={{ background: '#0ea5e9', borderColor: '#0ea5e9' }}
            onClick={() => setPayModal({ partnerId: null, partnerName: null })}>
            <Icon path={ICONS.plus} size={14} /> Record Payment
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="text-center py-5"><Spinner /></div>
      ) : error ? (
        <div className="alert alert-danger">Failed to load invoice data.</div>
      ) : (
        <div className="table-responsive rounded border shadow-sm">
          <table className="table table-hover align-middle mb-0" style={{ fontSize: '0.86rem' }}>
            <thead className="table-light">
              <tr style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                <th>Partner</th>
                <th className="text-center">Invoices</th>
                <th className="text-end">Total Invoiced</th>
                <th className="text-end">Total Paid</th>
                <th className="text-end">Outstanding</th>
                <th>Last Invoice</th>
                <th>Last Payment</th>
                <th>Terms</th>
                {canPay && <th />}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr><td colSpan={canPay ? 9 : 8} className="text-center py-5 text-muted">
                  No invoice data found for the selected period.
                </td></tr>
              ) : rows.map((r) => (
                <tr key={r.partner_id}>
                  <td>
                    <div className="fw-semibold">{r.partner_name}</div>
                    <div className="text-muted" style={{ fontSize: '0.75rem' }}>{r.partner_id}</div>
                  </td>
                  <td className="text-center">
                    <span className="badge bg-info-subtle text-info border border-info-subtle">{r.invoice_count}</span>
                  </td>
                  <td className="text-end">{taka(r.total_invoiced)}</td>
                  <td className="text-end text-success">{taka(r.total_paid)}</td>
                  <td className="text-end fw-bold" style={{ color: r.outstanding > 0 ? '#ef4444' : '#10b981' }}>
                    {taka(r.outstanding)}
                  </td>
                  <td className="text-muted">{r.last_invoice ?? '—'}</td>
                  <td className="text-muted">{r.last_payment_date ?? '—'}</td>
                  <td className="text-muted small">{r.payment_terms ?? '—'}</td>
                  {canPay && (
                    <td>
                      <button className="btn btn-outline-primary btn-sm py-0 px-2"
                        style={{ fontSize: '0.78rem' }}
                        onClick={() => setPayModal({ partnerId: r.partner_db_id, partnerName: r.partner_name })}>
                        Pay
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {meta.last_page > 1 && (
        <div className="d-flex justify-content-center gap-2 mt-3">
          <button className="btn btn-sm btn-outline-secondary" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>‹ Prev</button>
          <span className="small text-muted align-self-center">Page {meta.current_page} of {meta.last_page}</span>
          <button className="btn btn-sm btn-outline-secondary" disabled={page >= meta.last_page} onClick={() => setPage(p => p + 1)}>Next ›</button>
        </div>
      )}

      {payModal && (
        <PaymentModal
          partnerId={payModal.partnerId}
          partnerName={payModal.partnerName}
          onClose={() => setPayModal(null)}
          onSuccess={() => {
            setPayModal(null)
            queryClient.invalidateQueries(['accounts-invoices'])
            queryClient.invalidateQueries(['accounts-outstanding'])
          }}
        />
      )}
    </div>
  )
}

function CommissionsTab() {
  const [search, setSearch]   = useState('')
  const [status, setStatus]   = useState('')
  const [page, setPage]       = useState(1)

  const params = { search, status: status || undefined, page, per_page: 20 }
  const { data, isLoading, error } = useQuery({
    queryKey: ['accounts-commissions', params],
    queryFn: () => fetchAccountsCommissions(params),
  })

  const summary = data?.summary ?? {}
  const rows    = data?.data    ?? []
  const meta    = data?.meta    ?? {}

  return (
    <div>
      <div className="row g-3 mb-4">
        <KpiCard label="Total Payable"  value={taka(summary.total_payable)}            color="#f59e0b" icon={ICONS.coin} sub={`${summary.total_count ?? 0} records`} />
        <KpiCard label="Approved"       value={taka(summary.by_status?.Approved ?? 0)} color="#3b82f6" icon={ICONS.check} />
        <KpiCard label="Payable Status" value={taka(summary.by_status?.Payable ?? 0)}  color="#10b981" icon={ICONS.wallet} />
        <KpiCard label="Action Required" value={taka(summary.total_payable)}           color="#ef4444" icon={ICONS.warning}
          sub="Awaiting payment" />
      </div>

      <div className="d-flex gap-2 mb-3 flex-wrap">
        <div className="input-group" style={{ maxWidth: 260 }}>
          <span className="input-group-text"><Icon path={ICONS.search} size={14} /></span>
          <input className="form-control form-control-sm" placeholder="Search partner…"
            value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} />
        </div>
        <select className="form-select form-select-sm" style={{ maxWidth: 160 }}
          value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }}>
          <option value="">Approved + Payable</option>
          <option value="Approved">Approved Only</option>
          <option value="Payable">Payable Only</option>
        </select>
      </div>

      {isLoading ? (
        <div className="text-center py-5"><Spinner /></div>
      ) : error ? (
        <div className="alert alert-danger">Failed to load commission data.</div>
      ) : (
        <div className="table-responsive rounded border shadow-sm">
          <table className="table table-hover align-middle mb-0" style={{ fontSize: '0.86rem' }}>
            <thead className="table-light">
              <tr style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                <th>Partner</th>
                <th>Rule</th>
                <th>Type</th>
                <th className="text-end">Source</th>
                <th className="text-end">Commission</th>
                <th className="text-center">Period</th>
                <th className="text-center">Status</th>
                <th>Approved By</th>
                <th>Approved At</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr><td colSpan={9} className="text-center py-5 text-muted">
                  No approved/payable commissions found.
                </td></tr>
              ) : rows.map((r) => (
                <tr key={r.id}>
                  <td>
                    <div className="fw-semibold">{r.partner?.partner_name}</div>
                    <div className="text-muted" style={{ fontSize: '0.75rem' }}>{r.partner?.partner_id}</div>
                  </td>
                  <td className="text-muted small">{r.rule?.rule_name ?? '—'}</td>
                  <td><span className="badge bg-light text-dark border">{r.rule?.commission_type ?? '—'}</span></td>
                  <td className="text-end text-muted">{taka(r.source_amount)}</td>
                  <td className="text-end fw-bold" style={{ color: '#f59e0b' }}>{taka(r.commission_amount)}</td>
                  <td className="text-center text-muted small">{r.period_month}/{r.period_year}</td>
                  <td className="text-center"><StatusBadge status={r.status} /></td>
                  <td className="text-muted small">{r.approved_by_name ?? r.approvedBy?.name ?? '—'}</td>
                  <td className="text-muted small">
                    {r.approved_at ? new Date(r.approved_at).toLocaleDateString('en-GB') : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {meta.last_page > 1 && (
        <div className="d-flex justify-content-center gap-2 mt-3">
          <button className="btn btn-sm btn-outline-secondary" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>‹ Prev</button>
          <span className="small text-muted align-self-center">Page {meta.current_page} of {meta.last_page}</span>
          <button className="btn btn-sm btn-outline-secondary" disabled={page >= meta.last_page} onClick={() => setPage(p => p + 1)}>Next ›</button>
        </div>
      )}
    </div>
  )
}

function CreditTab() {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage]     = useState(1)

  const params = { search, status: status || undefined, page, per_page: 25 }
  const { data, isLoading, error } = useQuery({
    queryKey: ['accounts-credit', params],
    queryFn: () => fetchCreditOverview(params),
  })

  const summary = data?.summary ?? {}
  const rows    = data?.data    ?? []
  const meta    = data?.meta    ?? {}

  return (
    <div>
      <div className="row g-3 mb-4">
        <KpiCard label="Total Credit Limit" value={taka(summary.total_credit_limit)}  color="#8b5cf6" icon={ICONS.credit} />
        <KpiCard label="Total Outstanding"  value={taka(summary.total_outstanding)}   color="#ef4444" icon={ICONS.aging} />
        <KpiCard label="Available Credit"   value={taka(summary.total_available)}     color="#10b981" icon={ICONS.wallet} />
        <KpiCard label="Limit Breaches"
          value={(summary.exceeded_count ?? 0) + ' partners'}
          color="#ef4444" icon={ICONS.warning}
          sub={`${summary.high_risk_count ?? 0} high-risk`} />
      </div>

      <div className="d-flex gap-2 mb-3 flex-wrap">
        <div className="input-group" style={{ maxWidth: 260 }}>
          <span className="input-group-text"><Icon path={ICONS.search} size={14} /></span>
          <input className="form-control form-control-sm" placeholder="Search partner…"
            value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} />
        </div>
        <select className="form-select form-select-sm" style={{ maxWidth: 160 }}
          value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }}>
          <option value="">All Statuses</option>
          {['Active','Suspended','Blocked'].map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="text-center py-5"><Spinner /></div>
      ) : error ? (
        <div className="alert alert-danger">Failed to load credit data.</div>
      ) : (
        <div className="table-responsive rounded border shadow-sm">
          <table className="table table-hover align-middle mb-0" style={{ fontSize: '0.86rem' }}>
            <thead className="table-light">
              <tr style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                <th>Partner</th>
                <th>Status</th>
                <th className="text-end">Credit Limit</th>
                <th className="text-end">Outstanding</th>
                <th className="text-end">Available</th>
                <th style={{ minWidth: 120 }}>Utilization</th>
                <th className="text-center">Risk</th>
                <th>Terms</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-5 text-muted">
                  No partners with credit limit configured.
                </td></tr>
              ) : rows.map((r) => {
                const utilColor = r.utilization_pct >= 100 ? '#dc2626'
                  : r.utilization_pct >= 80 ? '#f59e0b' : '#10b981'
                return (
                  <tr key={r.partner_id} className={r.risk_level === 'exceeded' ? 'table-danger' : ''}>
                    <td>
                      <div className="fw-semibold">{r.partner_name}</div>
                      <div className="text-muted" style={{ fontSize: '0.75rem' }}>{r.partner_id} · {r.account_manager}</div>
                    </td>
                    <td><StatusBadge status={r.status} /></td>
                    <td className="text-end">{taka(r.credit_limit)}</td>
                    <td className="text-end fw-bold" style={{ color: utilColor }}>{taka(r.outstanding)}</td>
                    <td className="text-end text-success">{taka(r.available_credit)}</td>
                    <td>
                      <div className="d-flex align-items-center gap-2">
                        <div className="progress flex-grow-1" style={{ height: 8 }}>
                          <div className="progress-bar"
                            role="progressbar"
                            style={{
                              width: Math.min(r.utilization_pct, 100) + '%',
                              background: utilColor,
                            }} />
                        </div>
                        <span style={{ fontSize: '0.78rem', color: utilColor, minWidth: 38 }}>
                          {r.utilization_pct}%
                        </span>
                      </div>
                    </td>
                    <td className="text-center"><RiskBadge level={r.risk_level} /></td>
                    <td className="text-muted small">{r.payment_terms ?? '—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {meta.last_page > 1 && (
        <div className="d-flex justify-content-center gap-2 mt-3">
          <button className="btn btn-sm btn-outline-secondary" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>‹ Prev</button>
          <span className="small text-muted align-self-center">Page {meta.current_page} of {meta.last_page}</span>
          <button className="btn btn-sm btn-outline-secondary" disabled={page >= meta.last_page} onClick={() => setPage(p => p + 1)}>Next ›</button>
        </div>
      )}
    </div>
  )
}

export default function PartnerAccountsPage() {
  const { can } = usePermissions()
  const [activeTab, setActiveTab] = useState('outstanding')

  const canPay  = can('payment.create')
  const canView = can('payment.view')

  if (!canView) {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center" style={{ minHeight: '60vh' }}>
        <Icon path={ICONS.warning} size={48} className="text-warning mb-3" />
        <h4>Access Restricted</h4>
        <p className="text-muted">You need <strong>Accounts</strong> role access to view Partner Accounts.</p>
      </div>
    )
  }

  return (
    <div style={{ padding: '1.5rem' }}>
      {/* Page Header */}
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h1 className="h4 fw-bold mb-1" style={{ color: '#1e293b' }}>
            <Icon path={ICONS.wallet} size={22} className="me-2" style={{ color: '#0ea5e9' }} />
            Partner Accounts
          </h1>
          <p className="text-muted small mb-0">
            Consolidated receivables, outstanding, commission payables &amp; credit overview.
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="mb-4" style={{
        display: 'flex', gap: 4, borderBottom: '2px solid #e2e8f0',
        overflowX: 'auto', paddingBottom: 0,
      }}>
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: '0.6rem 1.2rem',
              border: 'none',
              borderBottom: activeTab === tab.key ? `3px solid ${tab.color}` : '3px solid transparent',
              background: 'transparent',
              fontWeight: activeTab === tab.key ? 700 : 400,
              color: activeTab === tab.key ? tab.color : '#64748b',
              fontSize: '0.88rem',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 6,
              whiteSpace: 'nowrap',
              marginBottom: -2,
              transition: 'color 0.15s',
            }}
          >
            <Icon path={tab.icon} size={15} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'outstanding' && <OutstandingTab canPay={canPay} />}
        {activeTab === 'invoices'    && <InvoicesTab    canPay={canPay} />}
        {activeTab === 'commissions' && <CommissionsTab />}
        {activeTab === 'credit'      && <CreditTab />}
      </div>
    </div>
  )
}
