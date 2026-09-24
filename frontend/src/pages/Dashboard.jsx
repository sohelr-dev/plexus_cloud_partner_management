import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Users, Activity, TrendingUp, DollarSign, Target, Building, Server, Cpu, LayoutDashboard, Filter, Calendar, CreditCard, ShieldAlert
} from 'lucide-react'
import { fetchFinancialSummary } from '../api/financial'
import api from '../api/client'

export default function Dashboard() {
  const [partnerType, setPartnerType] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  // 1. Fetch Global Financial Summary 
  const { data: finSummary, isLoading: isFinLoading } = useQuery({
    queryKey: ['financialSummary'],
    queryFn: () => fetchFinancialSummary(),
  })

  // 2. Fetch Partner List for counts 
  const { data: partnersData } = useQuery({
    queryKey: ['partnersListCount', partnerType, statusFilter],
    queryFn: async () => {
      const res = await api.get('/partners', { params: { partner_type: partnerType, status: statusFilter, per_page: 100 } })
      return res.data
    },
  })

  const partners = partnersData?.data || []
  const totalPartners = partnersData?.meta?.total || partners.length

  const activeCount    = partners.filter((p) => p.status === 'Active').length
  const pendingCount   = partners.filter((p) => p.status === 'Pending Approval' || p.status === 'Under Review').length
  const suspendedCount = partners.filter((p) => p.status === 'Suspended' || p.status === 'Blocked').length

  return (
    <div className="pm-page">
      {/* Header */}
      <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between mb-4">
        <div>
          <h1 className="pm-page-title d-flex align-items-center gap-2 mb-1">
            <LayoutDashboard size={24} className="text-primary" /> Dashboard Overview
          </h1>
          <p className="pm-page-subtitle">Live Platform KPIs, Financial Snapshot & Operations Summary.</p>
        </div>
      </div>

      {/* Universal Filter Bar */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body p-3">
          <div className="row g-3 align-items-center">
            <div className="col-12 col-md-4">
              <div className="d-flex align-items-center gap-2">
                <Filter size={16} className="text-muted" />
                <select
                  className="form-select form-select-sm"
                  value={partnerType}
                  onChange={(e) => setPartnerType(e.target.value)}
                >
                  <option value="">All Partner Types</option>
                  <option value="Reseller">Reseller</option>
                  <option value="Distributor">Distributor</option>
                  <option value="ISP">ISP</option>
                  <option value="Corporate">Corporate</option>
                  <option value="Individual">Individual</option>
                </select>
              </div>
            </div>
            <div className="col-12 col-md-4">
              <div className="d-flex align-items-center gap-2">
                <Activity size={16} className="text-muted" />
                <select
                  className="form-select form-select-sm"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="">All Statuses</option>
                  <option value="Active">Active</option>
                  <option value="Pending Approval">Pending Approval</option>
                  <option value="Under Review">Under Review</option>
                  <option value="Suspended">Suspended</option>
                </select>
              </div>
            </div>
            <div className="col-12 col-md-4 text-end">
              <button
                className="btn btn-sm btn-link text-decoration-none text-muted"
                onClick={() => { setPartnerType(''); setStatusFilter(''); }}
              >
                Reset Filters
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="d-flex flex-column gap-4">
        {/* Section 6.1: Partner KPIs */}
        <section>
          <div className="pm-section-title">1. Partner Directory KPIs (Section 6.1)</div>
          <div className="pm-kpi-grid">
            <div className="pm-kpi pm-kpi--blue">
              <div className="pm-kpi-icon"><Users size={20} /></div>
              <div className="mt-auto pt-2">
                <div className="pm-kpi-value">{totalPartners}</div>
                <div className="pm-kpi-label">Total Partners</div>
              </div>
            </div>

            <div className="pm-kpi pm-kpi--green">
              <div className="pm-kpi-icon"><Activity size={20} /></div>
              <div className="mt-auto pt-2">
                <div className="pm-kpi-value">{activeCount}</div>
                <div className="pm-kpi-label">Active Now</div>
              </div>
            </div>

            <div className="pm-kpi pm-kpi--amber">
              <div className="pm-kpi-icon"><Target size={20} /></div>
              <div className="mt-auto pt-2">
                <div className="pm-kpi-value">{pendingCount}</div>
                <div className="pm-kpi-label">Pending Approval</div>
              </div>
            </div>

            <div className="pm-kpi pm-kpi--red">
              <div className="pm-kpi-icon"><ShieldAlert size={20} /></div>
              <div className="mt-auto pt-2">
                <div className="pm-kpi-value">{suspendedCount}</div>
                <div className="pm-kpi-label">Suspended / Blocked</div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 6.2: Financial KPIs  */}
        <section>
          <div className="pm-section-title">2. Financial Overview KPIs (Section 6.2 — Phase 4 Live)</div>
          <div className="pm-kpi-grid">
            <div className="pm-kpi pm-kpi--cyan">
              <div className="pm-kpi-icon"><DollarSign size={20} /></div>
              <div className="mt-auto pt-2">
                <div className="pm-kpi-value">৳{((finSummary?.total_revenue ?? 0) / 1000).toFixed(1)}k</div>
                <div className="pm-kpi-label">Total Partner Revenue</div>
              </div>
            </div>

            <div className="pm-kpi pm-kpi--green">
              <div className="pm-kpi-icon"><TrendingUp size={20} /></div>
              <div className="mt-auto pt-2">
                <div className="pm-kpi-value">৳{((finSummary?.net_profit ?? 0) / 1000).toFixed(1)}k</div>
                <div className="pm-kpi-label">Net Profit ({finSummary?.profit_margin_pct ?? 0}%)</div>
              </div>
            </div>

            <div className="pm-kpi pm-kpi--red">
              <div className="pm-kpi-icon"><CreditCard size={20} /></div>
              <div className="mt-auto pt-2">
                <div className="pm-kpi-value">৳{((finSummary?.outstanding ?? 0) / 1000).toFixed(1)}k</div>
                <div className="pm-kpi-label">Outstanding Balance</div>
              </div>
            </div>

            <div className="pm-kpi pm-kpi--violet">
              <div className="pm-kpi-icon"><Activity size={20} /></div>
              <div className="mt-auto pt-2">
                <div className="pm-kpi-value">{finSummary?.avg_roi ?? 28}%</div>
                <div className="pm-kpi-label">Average Investment ROI</div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 6.3: Operational Status */}
        <section>
          <div className="pm-section-title">3. Operational Status KPIs (Section 6.3)</div>
          <div className="pm-kpi-grid">
            <div className="pm-kpi pm-kpi--blue">
              <div className="pm-kpi-icon"><Server size={20} /></div>
              <div className="mt-auto pt-2">
                <div className="pm-kpi-value">2.5 Gbps</div>
                <div className="pm-kpi-label">Total Allocated Bandwidth</div>
              </div>
            </div>

            <div className="pm-kpi pm-kpi--cyan">
              <div className="pm-kpi-icon"><Cpu size={20} /></div>
              <div className="mt-auto pt-2">
                <div className="pm-kpi-value">225</div>
                <div className="pm-kpi-label">Active End Devices</div>
              </div>
            </div>

            <div className="pm-kpi pm-kpi--violet">
              <div className="pm-kpi-icon"><Building size={20} /></div>
              <div className="mt-auto pt-2">
                <div className="pm-kpi-value">12</div>
                <div className="pm-kpi-label">Active Support Centers</div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
