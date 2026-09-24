import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft,
  Building2,
  MapPin,
  Mail,
  Phone,
  Calendar,
  Edit,
  ShieldAlert,
  Layers,
  TrendingUp,
  Activity,
  CreditCard,
  Wifi,
  HardDrive,
  DollarSign,
  Store,
  Folder,
  History,
  AlertTriangle,
  ClipboardList,
  UserCheck,
  PlusCircle,
  ChevronDown,
  Plus,
  Trash2,
  CheckCircle2,
  XCircle
} from 'lucide-react'
import StatusActionModal from '../../components/common/StatusActionModal'
import api from '../../api/client'
import { fetchPartnerPnL, fetchRevenues, createRevenue, fetchCosts, createCost, fetchPayments, createPayment } from '../../api/financial'
import { usePermissions } from '../../context/PermissionContext'

const TABS = [
  { id: 'overview', label: 'Overview', icon: Activity },
  { id: 'business', label: 'Business Info', icon: Building2 },
  { id: 'models', label: 'Business Models', icon: Layers },
  { id: 'financial', label: 'Financials & P&L', icon: DollarSign },
  { id: 'bandwidth', label: 'Bandwidth', icon: Wifi },
  { id: 'devices', label: 'Equipment & Devices', icon: HardDrive },
  { id: 'commission', label: 'Commission', icon: CreditCard },
  { id: 'support_centers', label: 'Support Centers', icon: Store },
  { id: 'documents', label: 'Documents', icon: Folder },
  { id: 'history', label: 'History & Timeline', icon: History },
  { id: 'health_risk', label: 'Health & Risk', icon: AlertTriangle },
  { id: 'audit', label: 'Audit Trail', icon: ClipboardList },
]

export default function PartnerDetailsPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { can } = usePermissions()

  const [activeTab, setActiveTab] = useState('overview')
  const [modalState, setModalState] = useState({ isOpen: false, mode: 'status_change' })
  const [activeFinModal, setActiveFinModal] = useState(null) // 'revenue' | 'cost' | 'payment'
  const [showQuickActions, setShowQuickActions] = useState(false)

  // Modal form states
  const [revForm, setRevForm] = useState({ revenue_source: 'Bandwidth Sales', amount: '', description: '', source_reference: '' })
  const [costForm, setCostForm] = useState({ cost_type: 'Bandwidth Cost', amount: '', description: '', source_reference: '' })
  const [payForm, setPayForm] = useState({ payment_method: 'Bank Transfer', amount: '', reference_number: '', remarks: '' })

  // 1. Fetch Partner details
  const { data: partner, isLoading, isError, error } = useQuery({
    queryKey: ['partner', id],
    queryFn: async () => {
      const res = await api.get(`/partners/${id}`)
      return res.data.data ?? res.data
    },
  })

  // 2. Fetch P&L snapshot for this partner
  const { data: pnl } = useQuery({
    queryKey: ['partnerPnL', id],
    queryFn: () => fetchPartnerPnL(id),
    enabled: Boolean(id),
  })

  // 3. Fetch Financial Lists
  const { data: revenuesData } = useQuery({
    queryKey: ['partnerRevenues', id],
    queryFn: () => fetchRevenues({ partner_id: id }),
    enabled: activeTab === 'financial',
  })

  const { data: costsData } = useQuery({
    queryKey: ['partnerCosts', id],
    queryFn: () => fetchCosts({ partner_id: id }),
    enabled: activeTab === 'financial',
  })

  const { data: paymentsData } = useQuery({
    queryKey: ['partnerPayments', id],
    queryFn: () => fetchPayments({ partner_id: id }),
    enabled: activeTab === 'financial',
  })

  // Mutations
  const addRevMutation = useMutation({
    mutationFn: (data) => createRevenue({ ...data, partner_id: id, revenue_date: new Date().toISOString().split('T')[0] }),
    onSuccess: () => {
      queryClient.invalidateQueries(['partnerPnL', id])
      queryClient.invalidateQueries(['partnerRevenues', id])
      setActiveFinModal(null)
      setRevForm({ revenue_source: 'Bandwidth Sales', amount: '', description: '', source_reference: '' })
    }
  })

  const addCostMutation = useMutation({
    mutationFn: (data) => createCost({ ...data, partner_id: id, cost_date: new Date().toISOString().split('T')[0] }),
    onSuccess: () => {
      queryClient.invalidateQueries(['partnerPnL', id])
      queryClient.invalidateQueries(['partnerCosts', id])
      setActiveFinModal(null)
      setCostForm({ cost_type: 'Bandwidth Cost', amount: '', description: '', source_reference: '' })
    }
  })

  const addPayMutation = useMutation({
    mutationFn: (data) => createPayment({ ...data, partner_id: id, payment_date: new Date().toISOString().split('T')[0] }),
    onSuccess: () => {
      queryClient.invalidateQueries(['partnerPnL', id])
      queryClient.invalidateQueries(['partnerPayments', id])
      setActiveFinModal(null)
      setPayForm({ payment_method: 'Bank Transfer', amount: '', reference_number: '', remarks: '' })
    }
  })

  if (isLoading) {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center min-vh-50 py-5 my-5">
        <div className="spinner-border text-primary mb-3" style={{ width: '3rem', height: '3rem' }} role="status" />
        <div className="fw-semibold text-dark">Loading Partner Profile...</div>
        <div className="text-muted small">Fetching complete commercial, network & financial master data</div>
      </div>
    )
  }

  if (isError || !partner) {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center min-vh-50 py-5 my-5 text-center">
        <ShieldAlert size={48} className="text-danger mb-3" />
        <h4 className="fw-bold text-dark">Partner Not Found</h4>
        <p className="text-muted mb-4">{error?.message ?? 'The requested partner record does not exist or was deleted.'}</p>
        <button className="pm-btn pm-btn-primary" onClick={() => navigate('/partners')}>
          <ArrowLeft size={16} /> Return to Directory
        </button>
      </div>
    )
  }

  const profile = partner.profile ?? {}
  const businessModels = partner.business_models ?? []

  return (
    <div className="pm-page">
      {/* Back Navigation */}
      <button
        onClick={() => navigate('/partners')}
        className="btn btn-link text-decoration-none p-0 mb-3 d-inline-flex align-items-center gap-1 text-secondary"
        style={{ fontSize: '0.85rem' }}
      >
        <ArrowLeft size={16} /> Back to Partner Directory
      </button>

      {/* Profile Header Banner */}
      <div className="pm-card mb-4 p-4">
        <div className="d-flex flex-wrap align-items-start justify-content-between gap-3">
          <div className="d-flex align-items-center gap-3">
            {/* Avatar / Logo */}
            <div
              className="rounded-circle bg-primary bg-opacity-10 text-primary d-flex align-items-center justify-content-center fw-bold shadow-sm border border-primary-subtle"
              style={{ width: 68, height: 68, fontSize: '1.75rem' }}
            >
              {(partner.partner_name ?? '?').charAt(0).toUpperCase()}
            </div>

            <div>
              <div className="d-flex align-items-center gap-2 flex-wrap">
                <h2 className="fw-bold mb-0 text-dark">{partner.partner_name}</h2>
                <span className={`pm-badge ${partner.status === 'Active' ? 'pm-badge-success' : partner.status === 'Pending Approval' ? 'pm-badge-warning' : 'pm-badge-secondary'}`}>
                  {partner.status}
                </span>
                <span className="badge bg-light text-dark border">
                  Grade {partner.partner_category ?? 'A'}
                </span>
              </div>

              {/* Enhanced Banner Metadata  */}
              <div className="text-muted small mt-2 d-flex align-items-center gap-3 flex-wrap">
                <span><strong>ID:</strong> {partner.partner_id}</span>
                <span>•</span>
                <span><strong>Code:</strong> {partner.partner_code}</span>
                <span>•</span>
                <span><strong>Type:</strong> {partner.partner_type}</span>
                <span>•</span>
                <span><Calendar size={13} className="me-1" /><strong>Since:</strong> {partner.partner_since ? new Date(partner.partner_since).toLocaleDateString() : 'N/A'}</span>
                <span>•</span>
                <span><MapPin size={13} className="me-1" /><strong>Area/Zone:</strong> {partner.area?.name || partner.zone?.name || partner.territory?.name || 'Central'}</span>
                {partner.account_manager && (
                  <>
                    <span>•</span>
                    <span className="d-flex align-items-center gap-1 text-primary">
                      <UserCheck size={14} /> <strong>AM:</strong> {partner.account_manager.name}
                    </span>
                  </>
                )}
                {partner.relationship_manager && (
                  <>
                    <span>•</span>
                    <span className="d-flex align-items-center gap-1 text-info-emphasis">
                      <UserCheck size={14} /> <strong>RM:</strong> {partner.relationship_manager.name}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Health Score & Quick Actions Dropdown) */}
          <div className="d-flex align-items-center gap-3">
            {/* Health Score Chip */}
            <div className="text-end border-end pe-3 d-none d-sm-block">
              <div className="text-muted style-sm" style={{ fontSize: '0.75rem' }}>Health Status</div>
              <div className="d-flex align-items-center gap-1 fw-bold fs-5" style={{ color: partner.health_score >= 80 ? 'var(--green-500)' : partner.health_score >= 50 ? 'var(--amber-500)' : 'var(--red-500)' }}>
                {partner.health_score ?? 100}% <span style={{ fontSize: '0.8rem' }}>({partner.health_status ?? 'Healthy'})</span>
              </div>
            </div>

            {/* Quick Actions Dropdown */}
            <div className="dropdown position-relative">
              <button
                className="btn btn-primary dropdown-toggle d-flex align-items-center gap-2 shadow-sm"
                type="button"
                onClick={() => setShowQuickActions((prev) => !prev)}
              >
                Quick Actions <ChevronDown size={16} />
              </button>
              {showQuickActions && (
                <ul
                  className="dropdown-menu dropdown-menu-end shadow border-0 show"
                  style={{ position: 'absolute', right: 0, top: '100%', zIndex: 1050, display: 'block' }}
                >
                  {can('partner.update') && (
                    <li>
                      <button
                        className="dropdown-item d-flex align-items-center gap-2"
                        onClick={() => {
                          setShowQuickActions(false)
                          setModalState({ isOpen: true, mode: 'status_change' })
                        }}
                      >
                        <Activity size={15} className="text-primary" /> Change Status
                      </button>
                    </li>
                  )}

                  {['Pending Approval', 'Under Review'].includes(partner.status) && can('partner.approve') && (
                    <li>
                      <button
                        className="dropdown-item d-flex align-items-center gap-2 text-success"
                        onClick={() => {
                          setShowQuickActions(false)
                          setModalState({ isOpen: true, mode: 'approve' })
                        }}
                      >
                        <ShieldAlert size={15} /> Approve / Reject
                      </button>
                    </li>
                  )}

                  {can('revenue.create') && (
                    <li>
                      <button
                        className="dropdown-item d-flex align-items-center gap-2"
                        onClick={() => {
                          setShowQuickActions(false)
                          setActiveTab('financial')
                          setActiveFinModal('revenue')
                        }}
                      >
                        <PlusCircle size={15} className="text-success" /> Record Revenue
                      </button>
                    </li>
                  )}

                  {can('payment.create') && (
                    <li>
                      <button
                        className="dropdown-item d-flex align-items-center gap-2"
                        onClick={() => {
                          setShowQuickActions(false)
                          setActiveTab('financial')
                          setActiveFinModal('payment')
                        }}
                      >
                        <CreditCard size={15} className="text-info" /> Record Payment
                      </button>
                    </li>
                  )}

                  {can('partner.update') && (
                    <>
                      <li><hr className="dropdown-divider" /></li>
                      <li>
                        <Link
                          to={`/partners/${id}/edit`}
                          className="dropdown-item d-flex align-items-center gap-2"
                          onClick={() => setShowQuickActions(false)}
                        >
                          <Edit size={15} className="text-secondary" /> Edit Profile
                        </Link>
                      </li>
                    </>
                  )}
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* Business Models Badges */}
        <div className="mt-3 pt-3 border-top d-flex align-items-center gap-2 flex-wrap">
          <span className="text-muted fw-medium me-1" style={{ fontSize: '0.8rem' }}>Active Business Models (BR-01):</span>
          {businessModels.length > 0 ? (
            businessModels.map((bm) => (
              <span key={bm.id} className="badge bg-primary-subtle text-primary border border-primary-subtle px-2.5 py-1 fs-7">
                <Layers size={13} className="me-1" /> {bm.name}
              </span>
            ))
          ) : (
            <span className="text-muted small">No business models assigned</span>
          )}
        </div>
      </div>

      {/* Tab Navigation) */}
      <div className="pm-card mb-4 p-2 overflow-x-auto">
        <div className="nav nav-pills flex-nowrap gap-1">
          {TABS.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`nav-link d-flex align-items-center gap-1.5 px-3 py-2 text-nowrap fw-medium ${
                  isActive ? 'active bg-primary text-white shadow-sm' : 'text-secondary hover-bg-light'
                }`}
                style={{ fontSize: '0.85rem', borderRadius: '8px' }}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Tab Content Panels */}
      <div className="pm-card p-4">
        {/* TAB 1: OVERVIEW  */}
        {activeTab === 'overview' && (
          <div>
            <h5 className="fw-bold mb-4 d-flex align-items-center gap-2 text-primary">
              <Activity size={20} /> Partner Overview & 5-Group Metric Dashboard (PRD Section 17)
            </h5>

            {/* 5 Group Metrics Grid */}
            <div className="row g-4 mb-4">
              {/* Group 1: Business Overview */}
              <div className="col-12 col-md-6 col-xl-4">
                <div className="card h-100 border-0 shadow-sm bg-light-subtle">
                  <div className="card-header bg-primary bg-opacity-10 border-0 fw-semibold text-primary d-flex align-items-center justify-content-between py-2">
                    <span>1. Business Overview</span>
                    <Building2 size={16} />
                  </div>
                  <div className="card-body p-3">
                    <div className="d-flex justify-content-between mb-2">
                      <span className="text-muted fs-7">Commercial Type:</span>
                      <span className="fw-semibold fs-7">{partner.partner_type} ({partner.partner_category})</span>
                    </div>
                    <div className="d-flex justify-content-between mb-2">
                      <span className="text-muted fs-7">Total Revenue:</span>
                      <span className="fw-bold text-success fs-7">৳{(pnl?.total_revenue ?? 0).toLocaleString()}</span>
                    </div>
                    <div className="d-flex justify-content-between mb-2">
                      <span className="text-muted fs-7">Active Customers:</span>
                      <span className="fw-semibold fs-7">128</span>
                    </div>
                    <div className="d-flex justify-content-between">
                      <span className="text-muted fs-7">Total End Devices:</span>
                      <span className="fw-semibold fs-7">45</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Group 2: Financial Snapshot */}
              <div className="col-12 col-md-6 col-xl-4">
                <div className="card h-100 border-0 shadow-sm bg-light-subtle">
                  <div className="card-header bg-success bg-opacity-10 border-0 fw-semibold text-success d-flex align-items-center justify-content-between py-2">
                    <span>2. Financial Snapshot</span>
                    <DollarSign size={16} />
                  </div>
                  <div className="card-body p-3">
                    <div className="d-flex justify-content-between mb-2">
                      <span className="text-muted fs-7">Gross Profit:</span>
                      <span className="fw-bold text-success fs-7">৳{(pnl?.gross_profit ?? 0).toLocaleString()}</span>
                    </div>
                    <div className="d-flex justify-content-between mb-2">
                      <span className="text-muted fs-7">Net Profit:</span>
                      <span className="fw-bold text-primary fs-7">৳{(pnl?.net_profit ?? 0).toLocaleString()}</span>
                    </div>
                    <div className="d-flex justify-content-between mb-2">
                      <span className="text-muted fs-7">Profit Margin:</span>
                      <span className="fw-bold text-dark fs-7">{pnl?.profit_margin_percent ?? 0}%</span>
                    </div>
                    <div className="d-flex justify-content-between">
                      <span className="text-muted fs-7">Outstanding:</span>
                      <span className="fw-semibold text-danger fs-7">৳{(pnl?.outstanding_balance ?? 0).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Group 3: Network Overview */}
              <div className="col-12 col-md-6 col-xl-4">
                <div className="card h-100 border-0 shadow-sm bg-light-subtle">
                  <div className="card-header bg-info bg-opacity-10 border-0 fw-semibold text-info-emphasis d-flex align-items-center justify-content-between py-2">
                    <span>3. Network & Equipment</span>
                    <Wifi size={16} />
                  </div>
                  <div className="card-body p-3">
                    <div className="d-flex justify-content-between mb-2">
                      <span className="text-muted fs-7">Allocated Bandwidth:</span>
                      <span className="fw-semibold fs-7">500 Mbps</span>
                    </div>
                    <div className="d-flex justify-content-between mb-2">
                      <span className="text-muted fs-7">Peak Usage:</span>
                      <span className="fw-semibold fs-7">385 Mbps</span>
                    </div>
                    <div className="d-flex justify-content-between mb-2">
                      <span className="text-muted fs-7">Utilization %:</span>
                      <span className="fw-bold text-info fs-7">77%</span>
                    </div>
                    <div className="d-flex justify-content-between">
                      <span className="text-muted fs-7">Assigned Equipment:</span>
                      <span className="fw-semibold fs-7">12 Units</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Group 4: Commercial Terms */}
              <div className="col-12 col-md-6 col-xl-4">
                <div className="card h-100 border-0 shadow-sm bg-light-subtle">
                  <div className="card-header bg-warning bg-opacity-10 border-0 fw-semibold text-warning-emphasis d-flex align-items-center justify-content-between py-2">
                    <span>4. Commercial & Payments</span>
                    <CreditCard size={16} />
                  </div>
                  <div className="card-body p-3">
                    <div className="d-flex justify-content-between mb-2">
                      <span className="text-muted fs-7">Credit Limit:</span>
                      <span className="fw-semibold fs-7">৳{(profile.credit_limit ?? 0).toLocaleString()}</span>
                    </div>
                    <div className="d-flex justify-content-between mb-2">
                      <span className="text-muted fs-7">Security Deposit:</span>
                      <span className="fw-semibold text-success fs-7">৳{(profile.security_deposit ?? 0).toLocaleString()}</span>
                    </div>
                    <div className="d-flex justify-content-between mb-2">
                      <span className="text-muted fs-7">Total Paid (YTD):</span>
                      <span className="fw-semibold text-primary fs-7">৳{(pnl?.total_paid ?? 0).toLocaleString()}</span>
                    </div>
                    <div className="d-flex justify-content-between">
                      <span className="text-muted fs-7">Payment Terms:</span>
                      <span className="fw-semibold fs-7">{profile.payment_terms || 'Net 30'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Group 5: Support Centers */}
              <div className="col-12 col-md-6 col-xl-4">
                <div className="card h-100 border-0 shadow-sm bg-light-subtle">
                  <div className="card-header bg-secondary bg-opacity-10 border-0 fw-semibold text-secondary d-flex align-items-center justify-content-between py-2">
                    <span>5. Support Center Branches</span>
                    <Store size={16} />
                  </div>
                  <div className="card-body p-3">
                    <div className="d-flex justify-content-between mb-2">
                      <span className="text-muted fs-7">Active Branches:</span>
                      <span className="fw-semibold fs-7">2 Branches</span>
                    </div>
                    <div className="d-flex justify-content-between mb-2">
                      <span className="text-muted fs-7">Total Branch Staff:</span>
                      <span className="fw-semibold fs-7">8 Staff</span>
                    </div>
                    <div className="d-flex justify-content-between mb-2">
                      <span className="text-muted fs-7">SC Operating Cost:</span>
                      <span className="fw-semibold text-danger fs-7">৳{(pnl?.support_center_cost ?? 0).toLocaleString()}</span>
                    </div>
                    <div className="d-flex justify-content-between">
                      <span className="text-muted fs-7">Customers Served:</span>
                      <span className="fw-semibold fs-7">340+</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: FINANCIALS & P&L  */}
        {activeTab === 'financial' && (
          <div>
            <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
              <div>
                <h5 className="fw-bold mb-1 text-primary d-flex align-items-center gap-2">
                  <DollarSign size={20} /> Financial Transactions & P&L Statement
                </h5>
                <p className="text-muted small mb-0">Recorded revenues, operating costs, payments and calculated P&L statement (BR-06 & BR-13).</p>
              </div>

              <div className="d-flex gap-2">
                {can('revenue.create') && (
                  <button className="btn btn-sm btn-success d-flex align-items-center gap-1" onClick={() => setActiveFinModal('revenue')}>
                    <Plus size={14} /> Add Revenue
                  </button>
                )}
                {can('cost.create') && (
                  <button className="btn btn-sm btn-outline-danger d-flex align-items-center gap-1" onClick={() => setActiveFinModal('cost')}>
                    <Plus size={14} /> Add Cost
                  </button>
                )}
                {can('payment.create') && (
                  <button className="btn btn-sm btn-primary d-flex align-items-center gap-1" onClick={() => setActiveFinModal('payment')}>
                    <Plus size={14} /> Add Payment
                  </button>
                )}
              </div>
            </div>

            {/* P&L Statement Banner */}
            <div className="card border-0 shadow-sm mb-4 bg-light">
              <div className="card-body p-3">
                <div className="row g-3 text-center">
                  <div className="col-6 col-md-3">
                    <div className="text-muted fs-8">TOTAL REVENUE</div>
                    <div className="fw-bold fs-5 text-success">৳{(pnl?.total_revenue ?? 0).toLocaleString()}</div>
                  </div>
                  <div className="col-6 col-md-3">
                    <div className="text-muted fs-8">DIRECT & OPERATING COST</div>
                    <div className="fw-bold fs-5 text-danger">৳{((pnl?.direct_cost ?? 0) + (pnl?.operating_cost ?? 0)).toLocaleString()}</div>
                  </div>
                  <div className="col-6 col-md-3">
                    <div className="text-muted fs-8">NET PROFIT (MARGIN %)</div>
                    <div className="fw-bold fs-5 text-primary">৳{(pnl?.net_profit ?? 0).toLocaleString()} ({pnl?.profit_margin_percent ?? 0}%)</div>
                  </div>
                  <div className="col-6 col-md-3">
                    <div className="text-muted fs-8">OUTSTANDING BALANCE</div>
                    <div className="fw-bold fs-5 text-warning-emphasis">৳{(pnl?.outstanding_balance ?? 0).toLocaleString()}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Revenues Table */}
            <h6 className="fw-bold mb-2">Revenues ({revenuesData?.total || 0})</h6>
            <div className="table-responsive mb-4">
              <table className="table table-hover align-middle border mb-0">
                <thead className="table-light fs-7">
                  <tr>
                    <th>Date</th>
                    <th>Source</th>
                    <th>Reference #</th>
                    <th>Amount</th>
                    <th>Description</th>
                  </tr>
                </thead>
                <tbody className="fs-7">
                  {revenuesData?.data?.length > 0 ? (
                    revenuesData.data.map((r) => (
                      <tr key={r.id}>
                        <td>{r.revenue_date}</td>
                        <td><span className="badge bg-success-subtle text-success">{r.revenue_source}</span></td>
                        <td>{r.source_reference || 'N/A'}</td>
                        <td className="fw-bold text-success">৳{Number(r.amount).toLocaleString()}</td>
                        <td>{r.description || '-'}</td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan="5" className="text-center py-3 text-muted">No revenue records found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Costs Table */}
            <h6 className="fw-bold mb-2">Costs ({costsData?.total || 0})</h6>
            <div className="table-responsive mb-4">
              <table className="table table-hover align-middle border mb-0">
                <thead className="table-light fs-7">
                  <tr>
                    <th>Date</th>
                    <th>Cost Type</th>
                    <th>Reference #</th>
                    <th>Amount</th>
                    <th>Description</th>
                  </tr>
                </thead>
                <tbody className="fs-7">
                  {costsData?.data?.length > 0 ? (
                    costsData.data.map((c) => (
                      <tr key={c.id}>
                        <td>{c.cost_date}</td>
                        <td><span className="badge bg-danger-subtle text-danger">{c.cost_type}</span></td>
                        <td>{c.source_reference || 'N/A'}</td>
                        <td className="fw-bold text-danger">৳{Number(c.amount).toLocaleString()}</td>
                        <td>{c.description || '-'}</td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan="5" className="text-center py-3 text-muted">No cost records found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Payments Table */}
            <h6 className="fw-bold mb-2">Payments & Settlements ({paymentsData?.total || 0})</h6>
            <div className="table-responsive">
              <table className="table table-hover align-middle border mb-0">
                <thead className="table-light fs-7">
                  <tr>
                    <th>Date</th>
                    <th>Payment Method</th>
                    <th>Reference #</th>
                    <th>Amount Paid</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody className="fs-7">
                  {paymentsData?.data?.length > 0 ? (
                    paymentsData.data.map((p) => (
                      <tr key={p.id}>
                        <td>{p.payment_date}</td>
                        <td>{p.payment_method}</td>
                        <td>{p.reference_number || 'N/A'}</td>
                        <td className="fw-bold text-primary">৳{Number(p.amount).toLocaleString()}</td>
                        <td><span className="badge bg-primary-subtle text-primary">{p.status}</span></td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan="5" className="text-center py-3 text-muted">No payment records found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Financial Recording Modals */}
      {activeFinModal === 'revenue' && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title fw-bold">Record Revenue</h5>
                <button type="button" className="btn-close" onClick={() => setActiveFinModal(null)}></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label small fw-semibold">Revenue Source</label>
                  <select className="form-select" value={revForm.revenue_source} onChange={(e) => setRevForm({ ...revForm, revenue_source: e.target.value })}>
                    <option value="Bandwidth Sales">Bandwidth Sales</option>
                    <option value="Internet">Internet</option>
                    <option value="GGC">GGC</option>
                    <option value="FNA">FNA</option>
                    <option value="BDIX">BDIX</option>
                    <option value="Activation Fee">Activation Fee</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="mb-3">
                  <label className="form-label small fw-semibold">Amount (৳)</label>
                  <input type="number" className="form-control" value={revForm.amount} onChange={(e) => setRevForm({ ...revForm, amount: e.target.value })} placeholder="e.g. 50000" />
                </div>
                <div className="mb-3">
                  <label className="form-label small fw-semibold">Source Reference (Invoice #)</label>
                  <input type="text" className="form-control" value={revForm.source_reference} onChange={(e) => setRevForm({ ...revForm, source_reference: e.target.value })} placeholder="Auto-generated if empty (e.g. INV-20260924-4821)" />
                </div>
                <div className="mb-3">
                  <label className="form-label small fw-semibold">Description</label>
                  <textarea className="form-control" rows="2" value={revForm.description} onChange={(e) => setRevForm({ ...revForm, description: e.target.value })}></textarea>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setActiveFinModal(null)}>Cancel</button>
                <button className="btn btn-success" disabled={addRevMutation.isLoading || !revForm.amount} onClick={() => addRevMutation.mutate(revForm)}>
                  Save Revenue
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeFinModal === 'cost' && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title fw-bold">Record Cost Entry</h5>
                <button type="button" className="btn-close" onClick={() => setActiveFinModal(null)}></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label small fw-semibold">Cost Type</label>
                  <select className="form-select" value={costForm.cost_type} onChange={(e) => setCostForm({ ...costForm, cost_type: e.target.value })}>
                    <option value="Bandwidth Cost">Bandwidth Cost</option>
                    <option value="Upstream Cost">Upstream Cost</option>
                    <option value="Commission">Commission Cost</option>
                    <option value="Support Center Cost">Support Center Cost</option>
                    <option value="Operational Cost">Operational Cost</option>
                    <option value="Equipment Cost">Equipment Cost</option>
                  </select>
                </div>
                <div className="mb-3">
                  <label className="form-label small fw-semibold">Amount (৳)</label>
                  <input type="number" className="form-control" value={costForm.amount} onChange={(e) => setCostForm({ ...costForm, amount: e.target.value })} placeholder="e.g. 25000" />
                </div>
                <div className="mb-3">
                  <label className="form-label small fw-semibold">Source Reference</label>
                  <input type="text" className="form-control" value={costForm.source_reference} onChange={(e) => setCostForm({ ...costForm, source_reference: e.target.value })} placeholder="Auto-generated if empty (e.g. CST-20260924-4821)" />
                </div>
                <div className="mb-3">
                  <label className="form-label small fw-semibold">Description</label>
                  <textarea className="form-control" rows="2" value={costForm.description} onChange={(e) => setCostForm({ ...costForm, description: e.target.value })}></textarea>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setActiveFinModal(null)}>Cancel</button>
                <button className="btn btn-danger" disabled={addCostMutation.isLoading || !costForm.amount} onClick={() => addCostMutation.mutate(costForm)}>
                  Save Cost
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeFinModal === 'payment' && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title fw-bold">Record Payment Settlement</h5>
                <button type="button" className="btn-close" onClick={() => setActiveFinModal(null)}></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label small fw-semibold">Payment Method</label>
                  <select className="form-select" value={payForm.payment_method} onChange={(e) => setPayForm({ ...payForm, payment_method: e.target.value })}>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Cash">Cash</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Online">Online</option>
                    <option value="Adjustment">Adjustment</option>
                  </select>
                </div>
                <div className="mb-3">
                  <label className="form-label small fw-semibold">Amount Paid (৳)</label>
                  <input type="number" className="form-control" value={payForm.amount} onChange={(e) => setPayForm({ ...payForm, amount: e.target.value })} placeholder="e.g. 50000" />
                </div>
                <div className="mb-3">
                  <label className="form-label small fw-semibold">Reference Number</label>
                  <input type="text" className="form-control" value={payForm.reference_number} onChange={(e) => setPayForm({ ...payForm, reference_number: e.target.value })} placeholder="Auto-generated if empty (e.g. PAY-20260924-4821)" />
                </div>
                <div className="mb-3">
                  <label className="form-label small fw-semibold">Remarks</label>
                  <textarea className="form-control" rows="2" value={payForm.remarks} onChange={(e) => setPayForm({ ...payForm, remarks: e.target.value })}></textarea>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setActiveFinModal(null)}>Cancel</button>
                <button className="btn btn-primary" disabled={addPayMutation.isLoading || !payForm.amount} onClick={() => addPayMutation.mutate(payForm)}>
                  Save Payment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal for Status Change / Approval */}
      {modalState.isOpen && (
        <StatusActionModal
          isOpen={modalState.isOpen}
          mode={modalState.mode}
          partner={partner}
          onClose={() => setModalState({ ...modalState, isOpen: false })}
          onSuccess={() => {
            queryClient.invalidateQueries(['partner', id])
            setModalState({ ...modalState, isOpen: false })
          }}
        />
      )}
    </div>
  )
}
