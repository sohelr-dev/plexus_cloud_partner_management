import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Users, Activity, TrendingUp, DollarSign, Target, Building, Server,
  Cpu, LayoutDashboard, Filter, CreditCard, ShieldAlert, UserPlus,
  Banknote, Wifi, BarChart3, ChevronDown, X, RefreshCw, Percent, Package
} from 'lucide-react'
import { fetchDashboardSummary } from '../api/dashboard'
import api from '../api/client'

const CURRENT_YEAR = new Date().getFullYear()
const YEARS = Array.from({ length: 5 }, (_, i) => CURRENT_YEAR - i)

export default function Dashboard() {
  // PRD §7 Filters
  const [partnerType,      setPartnerType]      = useState('')
  const [statusFilter,     setStatusFilter]      = useState('')
  const [areaId,           setAreaId]            = useState('')
  const [zoneId,           setZoneId]            = useState('')
  const [accountManagerId, setAccountManagerId]  = useState('')
  const [businessModelId,  setBusinessModelId]   = useState('')
  const [dateMode,         setDateMode]          = useState('') // '' | 'month' | 'quarter' | 'year' | 'range'
  const [month,            setMonth]             = useState('')
  const [quarter,          setQuarter]           = useState('')
  const [year,             setYear]              = useState('')
  const [startDate,        setStartDate]         = useState('')
  const [endDate,          setEndDate]           = useState('')
  const [showFilters,      setShowFilters]       = useState(false)

  // Lookups
  const { data: lookups } = useQuery({
    queryKey: ['partner-lookups'],
    queryFn: async () => {
      const res = await api.get('/partners/lookups')
      return res.data
    },
    staleTime: 300000,
  })

  const filters = useMemo(() => {
    const f = {}
    if (partnerType)      f.partner_type       = partnerType
    if (statusFilter)     f.status             = statusFilter
    if (areaId)           f.area_id            = areaId
    if (zoneId)           f.zone_id            = zoneId
    if (accountManagerId) f.account_manager_id = accountManagerId
    if (businessModelId)  f.business_model_id  = businessModelId

    if (dateMode === 'month' && month) {
      f.month = month
      if (year) f.year = year
    } else if (dateMode === 'quarter' && quarter) {
      f.quarter = quarter
      if (year) f.year = year
    } else if (dateMode === 'year' && year) {
      f.year = year
    } else if (dateMode === 'range') {
      if (startDate) f.start_date = startDate
      if (endDate)   f.end_date   = endDate
    }
    return f
  }, [partnerType, statusFilter, areaId, zoneId, accountManagerId, businessModelId,
      dateMode, month, quarter, year, startDate, endDate])

  const { data: summary, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['dashboardSummary', filters],
    queryFn: () => fetchDashboardSummary(filters),
    staleTime: 30000,
  })

  const partnerKpis     = summary?.partner_kpis      || {}
  const financialKpis   = summary?.financial_kpis    || {}
  const operationalKpis = summary?.operational_kpis  || {}

  const hasFilters = Object.keys(filters).length > 0

  const resetFilters = () => {
    setPartnerType(''); setStatusFilter(''); setAreaId(''); setZoneId('')
    setAccountManagerId(''); setBusinessModelId(''); setDateMode('')
    setMonth(''); setQuarter(''); setYear(''); setStartDate(''); setEndDate('')
  }

  const fmt = (n, dec = 1) => {
    const num = Number(n ?? 0)
    if (num >= 1_000_000) return `৳${(num / 1_000_000).toFixed(dec)}M`
    if (num >= 1_000) return `৳${(num / 1_000).toFixed(dec)}k`
    return `৳${num.toFixed(0)}`
  }

  return (
    <div className="pm-page">
      {/* Header */}
      <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between mb-4 gap-3">
        <div>
          <h1 className="pm-page-title d-flex align-items-center gap-2 mb-1">
            <LayoutDashboard size={24} className="text-primary" /> Dashboard Overview
          </h1>
          <p className="pm-page-subtitle">Live Platform KPIs, Financial Snapshot &amp; Operations Summary — PRD §6–7</p>
        </div>
        <div className="d-flex gap-2">
          <button
            className={`pm-btn pm-btn-sm ${showFilters ? 'pm-btn-primary' : 'pm-btn-outline'} d-flex align-items-center gap-2`}
            onClick={() => setShowFilters(p => !p)}
          >
            <Filter size={15} /> Filters {hasFilters && <span className="badge bg-warning text-dark ms-1">{Object.keys(filters).length}</span>}
            <ChevronDown size={14} style={{ transform: showFilters ? 'rotate(180deg)' : 'none', transition: '0.2s' }} />
          </button>
          <button className="pm-btn pm-btn-sm pm-btn-outline d-flex align-items-center gap-1" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw size={14} className={isFetching ? 'spin-icon' : ''} /> Refresh
          </button>
        </div>
      </div>

      {/* PRD §7 Universal Filter Panel */}
      {showFilters && (
        <div className="card border-0 shadow-sm mb-4">
          <div className="card-body p-4">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <h6 className="mb-0 fw-semibold text-secondary d-flex align-items-center gap-2">
                <Filter size={14} /> Dashboard Filters (PRD §7)
              </h6>
              {hasFilters && (
                <button className="btn btn-sm btn-link text-danger text-decoration-none d-flex align-items-center gap-1" onClick={resetFilters}>
                  <X size={13} /> Reset All
                </button>
              )}
            </div>

            {/* Row 1: Date Filters */}
            <div className="row g-3 mb-3">
              <div className="col-12">
                <label className="form-label small fw-semibold text-muted mb-2">Date Range / Period</label>
                <div className="d-flex gap-2 flex-wrap">
                  {[
                    { value: '', label: 'All Time' },
                    { value: 'month', label: 'Month' },
                    { value: 'quarter', label: 'Quarter' },
                    { value: 'year', label: 'Year' },
                    { value: 'range', label: 'Custom Range' },
                  ].map(opt => (
                    <button
                      key={opt.value}
                      className={`btn btn-sm ${dateMode === opt.value ? 'btn-primary' : 'btn-outline-secondary'}`}
                      onClick={() => setDateMode(opt.value)}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {dateMode === 'month' && (
                <>
                  <div className="col-6 col-md-3">
                    <label className="form-label small fw-semibold">Month</label>
                    <select className="form-select form-select-sm" value={month} onChange={e => setMonth(e.target.value)}>
                      <option value="">Select Month</option>
                      {['January','February','March','April','May','June',
                        'July','August','September','October','November','December']
                        .map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                    </select>
                  </div>
                  <div className="col-6 col-md-3">
                    <label className="form-label small fw-semibold">Year</label>
                    <select className="form-select form-select-sm" value={year} onChange={e => setYear(e.target.value)}>
                      <option value="">All Years</option>
                      {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>
                </>
              )}
              {dateMode === 'quarter' && (
                <>
                  <div className="col-6 col-md-3">
                    <label className="form-label small fw-semibold">Quarter</label>
                    <select className="form-select form-select-sm" value={quarter} onChange={e => setQuarter(e.target.value)}>
                      <option value="">Select Quarter</option>
                      <option value="1">Q1 (Jan–Mar)</option>
                      <option value="2">Q2 (Apr–Jun)</option>
                      <option value="3">Q3 (Jul–Sep)</option>
                      <option value="4">Q4 (Oct–Dec)</option>
                    </select>
                  </div>
                  <div className="col-6 col-md-3">
                    <label className="form-label small fw-semibold">Year</label>
                    <select className="form-select form-select-sm" value={year} onChange={e => setYear(e.target.value)}>
                      <option value="">All Years</option>
                      {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>
                </>
              )}
              {dateMode === 'year' && (
                <div className="col-6 col-md-3">
                  <label className="form-label small fw-semibold">Year</label>
                  <select className="form-select form-select-sm" value={year} onChange={e => setYear(e.target.value)}>
                    <option value="">Select Year</option>
                    {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              )}
              {dateMode === 'range' && (
                <>
                  <div className="col-6 col-md-3">
                    <label className="form-label small fw-semibold">Start Date</label>
                    <input type="date" className="form-control form-control-sm" value={startDate} onChange={e => setStartDate(e.target.value)} />
                  </div>
                  <div className="col-6 col-md-3">
                    <label className="form-label small fw-semibold">End Date</label>
                    <input type="date" className="form-control form-control-sm" value={endDate} onChange={e => setEndDate(e.target.value)} />
                  </div>
                </>
              )}
            </div>

            {/* Row 2: Entity Filters */}
            <div className="row g-3">
              <div className="col-6 col-md-2">
                <label className="form-label small fw-semibold">Partner Type</label>
                <select className="form-select form-select-sm" value={partnerType} onChange={e => setPartnerType(e.target.value)}>
                  <option value="">All Types</option>
                  {['Reseller','Distributor','ISP','Corporate','Individual'].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="col-6 col-md-2">
                <label className="form-label small fw-semibold">Status</label>
                <select className="form-select form-select-sm" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                  <option value="">All Statuses</option>
                  {['Active','Pending Approval','Under Review','Approved','Suspended','Blocked','Inactive','Terminated'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="col-6 col-md-2">
                <label className="form-label small fw-semibold">Business Model</label>
                <select className="form-select form-select-sm" value={businessModelId} onChange={e => setBusinessModelId(e.target.value)}>
                  <option value="">All Models</option>
                  {(lookups?.business_models || []).map(bm => <option key={bm.id} value={bm.id}>{bm.name}</option>)}
                </select>
              </div>
              <div className="col-6 col-md-2">
                <label className="form-label small fw-semibold">Area</label>
                <select className="form-select form-select-sm" value={areaId} onChange={e => setAreaId(e.target.value)}>
                  <option value="">All Areas</option>
                  {(lookups?.areas || []).map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
              <div className="col-6 col-md-2">
                <label className="form-label small fw-semibold">Zone</label>
                <select className="form-select form-select-sm" value={zoneId} onChange={e => setZoneId(e.target.value)}>
                  <option value="">All Zones</option>
                  {(lookups?.zones || []).map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
                </select>
              </div>
              <div className="col-6 col-md-2">
                <label className="form-label small fw-semibold">Account Manager</label>
                <select className="form-select form-select-sm" value={accountManagerId} onChange={e => setAccountManagerId(e.target.value)}>
                  <option value="">All Managers</option>
                  {(lookups?.account_managers || []).map(am => <option key={am.id} value={am.id}>{am.name}</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loading / Error State */}
      {isLoading && (
        <div className="pm-empty">
          <div className="spinner-border text-primary" role="status" />
          <div className="pm-empty-title mt-2">Loading dashboard data…</div>
        </div>
      )}
      {isError && !isLoading && (
        <div className="pm-error-box text-center py-4">
          <BarChart3 size={40} className="text-danger mb-2" />
          <div className="fw-bold">Failed to load dashboard data</div>
          <button className="btn btn-sm btn-outline-danger mt-2" onClick={() => refetch()}>Retry</button>
        </div>
      )}

      {!isLoading && !isError && (
        <div className="d-flex flex-column gap-4">

          <section>
            <div className="pm-section-title">1. Partner Directory KPIs (PRD §6.1)</div>
            <div className="pm-kpi-grid">
              <KpiCard icon={<Users size={20} />} variant="blue"    value={partnerKpis.total      ?? 0} label="Total Partners" />
              <KpiCard icon={<Activity size={20} />} variant="green"  value={partnerKpis.active     ?? 0} label="Active Partners" />
              <KpiCard icon={<UserPlus size={20} />} variant="cyan"   value={partnerKpis.new        ?? 0} label="New Partners" sub={hasFilters ? 'in period' : 'this month'} />
              <KpiCard icon={<Target size={20} />} variant="amber"   value={partnerKpis.pending    ?? 0} label="Pending Approval" />
              <KpiCard icon={<ShieldAlert size={20} />} variant="red"    value={partnerKpis.suspended  ?? 0} label="Suspended / Blocked" />
              <KpiCard icon={<Users size={20} />} variant="secondary" value={partnerKpis.inactive   ?? 0} label="Inactive" />
              <KpiCard icon={<X size={20} />}     variant="dark"     value={partnerKpis.terminated ?? 0} label="Terminated" />
            </div>
          </section>

          <section>
            <div className="pm-section-title">2. Financial Overview KPIs (PRD §6.2)</div>
            <div className="pm-kpi-grid">
              <KpiCard icon={<DollarSign size={20} />}  variant="cyan"   value={fmt(financialKpis.total_revenue)}   label="Total Partner Revenue" raw />
              <KpiCard icon={<TrendingUp size={20} />}   variant="green"  value={fmt(financialKpis.net_profit)}      label={`Net Profit (${financialKpis.profit_margin_pct ?? 0}%)`} raw />
              <KpiCard icon={<Banknote size={20} />}     variant="blue"   value={fmt(financialKpis.total_cost)}      label="Total Partner Cost" raw />
              <KpiCard icon={<CreditCard size={20} />}   variant="red"    value={fmt(financialKpis.outstanding)}     label="Outstanding Balance" raw />
              <KpiCard icon={<Percent size={20} />}      variant="violet" value={`${financialKpis.avg_roi ?? 0}%`}   label="Average Investment ROI" raw />
              <KpiCard icon={<Package size={20} />}      variant="amber"  value={fmt(financialKpis.total_commission ?? 0)} label="Total Commission" raw />
              <KpiCard icon={<BarChart3 size={20} />}    variant="cyan"   value={fmt(financialKpis.total_investment ?? 0)} label="Total Investment" raw />
            </div>
          </section>

          <section>
            <div className="pm-section-title">3. Operational Status KPIs (PRD §6.3 — Live)</div>
            <div className="pm-kpi-grid">
              <KpiCard icon={<Wifi size={20} />}    variant="blue"   value={operationalKpis.formatted_bandwidth  ?? '0 Mbps'} label="Total Allocated Bandwidth" raw />
              <KpiCard icon={<Users size={20} />}   variant="green"  value={operationalKpis.total_active_customers ?? 0}      label="Total Active Customers" />
              <KpiCard icon={<Cpu size={20} />}     variant="cyan"   value={operationalKpis.active_end_devices    ?? 0}       label="Active End Devices" />
              <KpiCard icon={<Server size={20} />}  variant="amber"  value={operationalKpis.total_equipment       ?? 0}       label="Total Equipment" />
              <KpiCard icon={<Building size={20} />} variant="violet" value={operationalKpis.active_support_centers ?? 0}    label="Active Support Centers" />
            </div>
          </section>

        </div>
      )}
    </div>
  )
}

/** Reusable KPI Card */
function KpiCard({ icon, variant = 'blue', value, label, sub, raw = false }) {
  return (
    <div className={`pm-kpi pm-kpi--${variant}`}>
      <div className="pm-kpi-icon">{icon}</div>
      <div className="mt-auto pt-2">
        <div className="pm-kpi-value">{raw ? value : Number(value).toLocaleString()}</div>
        <div className="pm-kpi-label">{label}</div>
        {sub && <div className="text-white-50" style={{ fontSize: '0.7rem', marginTop: '2px' }}>{sub}</div>}
      </div>
    </div>
  )
}
