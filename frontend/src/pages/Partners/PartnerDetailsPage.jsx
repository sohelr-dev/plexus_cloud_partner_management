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
import { fetchBandwidthSummary, createBandwidthAllocation, requestBandwidthChange, approveBandwidthChange, rejectBandwidthChange } from '../../api/bandwidth'
import { fetchEquipmentSummary, createEquipmentAsset, registerEndDevice, logEquipmentMaintenance, replaceEquipment, returnEquipment } from '../../api/equipment'
import { fetchCommissionSummary, createCommissionRule, createCommission, approveCommission, rejectCommission, payCommission } from '../../api/commission'
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
  const [eqReplaceForm, setEqReplaceForm] = useState({ reason: '', new_equipment_serial: '', new_equipment_mac: '', new_purchase_cost: '' })
  const [eqReturnForm, setEqReturnForm] = useState({ reason: '' })
  const [eqActionItem, setEqActionItem] = useState(null)

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

  // --- Bandwidth State & Query ---
  const [activeBwModal, setActiveBwModal] = useState(null) // 'allocate' | 'change'
  const [bwAllocForm, setBwAllocForm] = useState({ service: 'Internet', allocated_mbps: '', ratio: '1:1', price: '', cost: '', work_order_id: '' })
  const [bwChangeForm, setBwChangeForm] = useState({ allocation_id: '', new_mbps: '', change_type: 'Upgrade', reason: '' })

  const { data: bandwidthSummaryRes } = useQuery({
    queryKey: ['bandwidthSummary', id],
    queryFn: () => fetchBandwidthSummary(id),
    enabled: activeTab === 'bandwidth',
  })
  const bwData = bandwidthSummaryRes?.data || {}

  const addBwAllocMutation = useMutation({
    mutationFn: (data) => createBandwidthAllocation(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['bandwidthSummary', id])
      setActiveBwModal(null)
      setBwAllocForm({ service: 'Internet', allocated_mbps: '', ratio: '1:1', price: '', cost: '', work_order_id: '' })
    },
  })

  const bwChangeReqMutation = useMutation({
    mutationFn: (data) => requestBandwidthChange(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['bandwidthSummary', id])
      setActiveBwModal(null)
      setBwChangeForm({ allocation_id: '', new_mbps: '', change_type: 'Upgrade', reason: '' })
    },
  })

  const approveBwMutation = useMutation({
    mutationFn: ({ changeId, reason }) => approveBandwidthChange(changeId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries(['bandwidthSummary', id])
    },
  })

  const rejectBwMutation = useMutation({
    mutationFn: ({ changeId, reason }) => rejectBandwidthChange(changeId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries(['bandwidthSummary', id])
    },
  })

  // --- Equipment & Devices State & Query ---
  const [activeEqModal, setActiveEqModal] = useState(null) // 'equipment' | 'device'
  const [eqForm, setEqForm] = useState({
    equipment_type: 'Router',
    serial_number: '',
    mac_address: '',
    manufacturer: '',
    model: '',
    purchase_cost: '',
    ownership: 'Company Owned',
    warranty_end: '',
    location: '',
  })
  const [devForm, setDevForm] = useState({
    device_type: 'ONU',
    identifier: '',
    status: 'Active',
  })

  const { data: equipmentSummaryRes } = useQuery({
    queryKey: ['equipmentSummary', id],
    queryFn: () => fetchEquipmentSummary(id),
    enabled: activeTab === 'devices',
  })
  const eqData = equipmentSummaryRes?.data || {}

  const addEqMutation = useMutation({
    mutationFn: (data) => createEquipmentAsset(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['equipmentSummary', id])
      setActiveEqModal(null)
      setEqForm({ equipment_type: 'Router', serial_number: '', mac_address: '', manufacturer: '', model: '', purchase_cost: '', ownership: 'Company Owned', warranty_end: '', location: '' })
    },
  })

  const addDevMutation = useMutation({
    mutationFn: (data) => registerEndDevice(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['equipmentSummary', id])
      setActiveEqModal(null)
      setDevForm({ device_type: 'ONU', identifier: '', status: 'Active' })
    },
  })

  const replaceEqMutation = useMutation({
    mutationFn: (data) => replaceEquipment(eqActionItem.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['equipmentSummary', id])
      setActiveEqModal(null)
      setEqActionItem(null)
      setEqReplaceForm({ reason: '', new_equipment_serial: '', new_equipment_mac: '', new_purchase_cost: '' })
    }
  })

  const returnEqMutation = useMutation({
    mutationFn: (data) => returnEquipment(eqActionItem.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['equipmentSummary', id])
      setActiveEqModal(null)
      setEqActionItem(null)
      setEqReturnForm({ reason: '' })
    }
  })

  // --- Commission State & Query---
  const [activeCommModal, setActiveCommModal] = useState(null) // 'addRule' | 'addCommission' | 'pay'
  const [commRuleForm, setCommRuleForm] = useState({
    rule_name: '',
    service: '',
    commission_type: 'Percentage',
    rate: '',
    fixed_amount: '',
    maximum_limit: '',
    effective_date: '',
    expiry_date: '',
    status: 'Active',
  })
  const [commForm, setCommForm] = useState({
    rule_id: '',
    source_reference: '',
    source_amount: '',
    commission_amount: '',
    period_month: new Date().getMonth() + 1,
    period_year: new Date().getFullYear(),
    remarks: '',
  })
  const [commPayForm, setCommPayForm] = useState({
    commissionId: null,
    payment_date: new Date().toISOString().split('T')[0],
    amount: '',
    payment_method: 'Bank Transfer',
    reference_number: '',
  })
  const [commActionId, setCommActionId] = useState(null)
  const [commActionReason, setCommActionReason] = useState('')

  const { data: commSummaryRes } = useQuery({
    queryKey: ['commissionSummary', id],
    queryFn: () => fetchCommissionSummary(id),
    enabled: activeTab === 'commission',
  })
  const commData = commSummaryRes?.data || {}

  const addCommRuleMutation = useMutation({
    mutationFn: (data) => createCommissionRule(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['commissionSummary', id])
      setActiveCommModal(null)
      setCommRuleForm({ rule_name: '', service: '', commission_type: 'Percentage', rate: '', fixed_amount: '', maximum_limit: '', effective_date: '', expiry_date: '', status: 'Active' })
    },
  })

  const addCommMutation = useMutation({
    mutationFn: (data) => createCommission(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['commissionSummary', id])
      setActiveCommModal(null)
      setCommForm({ rule_id: '', source_reference: '', source_amount: '', commission_amount: '', period_month: new Date().getMonth() + 1, period_year: new Date().getFullYear(), remarks: '' })
    },
  })

  const approveCommMutation = useMutation({
    mutationFn: ({ cid, reason }) => approveCommission(cid, reason),
    onSuccess: () => queryClient.invalidateQueries(['commissionSummary', id]),
  })

  const rejectCommMutation = useMutation({
    mutationFn: ({ cid, reason }) => rejectCommission(cid, reason),
    onSuccess: () => { queryClient.invalidateQueries(['commissionSummary', id]); setCommActionId(null); setCommActionReason('') },
  })

  const payCommMutation = useMutation({
    mutationFn: ({ cid, data }) => payCommission(cid, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['commissionSummary', id])
      setActiveCommModal(null)
      setCommPayForm({ commissionId: null, payment_date: new Date().toISOString().split('T')[0], amount: '', payment_method: 'Bank Transfer', reference_number: '' })
    },
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
              <Activity size={20} /> Partner Overview & 5-Group Metric Dashboard
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

        {/* TAB 5: BANDWIDTH MANAGEMENT */}
        {activeTab === 'bandwidth' && (
          <div>
            <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
              <div>
                <h5 className="fw-bold mb-1 text-primary d-flex align-items-center gap-2">
                  <Wifi size={20} /> Bandwidth Sales & Allocation Engine
                </h5>
                <p className="text-muted small mb-0">Allocated bandwidth, ratio, utilization % and upgrade/downgrade approval workflow .</p>
              </div>

              <div className="d-flex gap-2">
                <button className="btn btn-sm btn-primary d-flex align-items-center gap-1" onClick={() => setActiveBwModal('allocate')}>
                  <Plus size={14} /> Allocate Bandwidth
                </button>
                <button className="btn btn-sm btn-warning d-flex align-items-center gap-1 text-dark" onClick={() => setActiveBwModal('change')}>
                  <TrendingUp size={14} /> Request Upgrade / Change
                </button>
              </div>
            </div>

            {/* Bandwidth KPIs */}
            <div className="card border-0 shadow-sm mb-4 bg-light">
              <div className="card-body p-3">
                <div className="row g-3 text-center">
                  <div className="col-6 col-md-3">
                    <div className="text-muted fs-8">TOTAL ALLOCATED</div>
                    <div className="fw-bold fs-4 text-primary">{bwData.total_allocated_mbps || 0} <span className="fs-6">Mbps</span></div>
                  </div>
                  <div className="col-6 col-md-3">
                    <div className="text-muted fs-8">CURRENT USAGE</div>
                    <div className="fw-bold fs-4 text-info">{bwData.total_used_mbps || 0} <span className="fs-6">Mbps</span></div>
                  </div>
                  <div className="col-6 col-md-3">
                    <div className="text-muted fs-8">AVAILABLE CAPACITY</div>
                    <div className="fw-bold fs-4 text-success">{bwData.total_available_mbps || 0} <span className="fs-6">Mbps</span></div>
                  </div>
                  <div className="col-6 col-md-3">
                    <div className="text-muted fs-8">AVG UTILIZATION %</div>
                    <div className="fw-bold fs-4 text-warning-emphasis">{bwData.utilization_percent || 0}%</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Active Allocations Table */}
            <h6 className="fw-bold mb-2">Active Allocations ({bwData.allocations?.length || 0})</h6>
            <div className="table-responsive mb-4">
              <table className="table table-hover align-middle border mb-0">
                <thead className="table-light fs-7">
                  <tr>
                    <th>Service</th>
                    <th>Allocated (Mbps)</th>
                    <th>Used (Mbps)</th>
                    <th>Available (Mbps)</th>
                    <th>Utilization</th>
                    <th>Ratio</th>
                    <th>Monthly Price</th>
                    <th>Work Order #</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody className="fs-7">
                  {bwData.allocations?.length > 0 ? (
                    bwData.allocations.map((a) => (
                      <tr key={a.id}>
                        <td className="fw-bold text-dark">{a.service}</td>
                        <td className="fw-bold text-primary">{Number(a.allocated_mbps).toLocaleString()} Mbps</td>
                        <td>{Number(a.used_mbps).toLocaleString()} Mbps</td>
                        <td className="text-success">{Number(a.available_mbps).toLocaleString()} Mbps</td>
                        <td>
                          <div className="d-flex align-items-center gap-2">
                            <div className="progress flex-grow-1" style={{ height: '6px' }}>
                              <div className="progress-bar bg-warning" style={{ width: `${Math.min(100, a.utilization_percent)}%` }}></div>
                            </div>
                            <span className="fs-8 fw-semibold">{a.utilization_percent}%</span>
                          </div>
                        </td>
                        <td><span className="badge bg-secondary-subtle text-secondary">{a.ratio || '1:1'}</span></td>
                        <td className="fw-bold text-success">৳{Number(a.price).toLocaleString()}</td>
                        <td className="small text-muted">{a.work_order_id || '-'}</td>
                        <td><span className={`badge ${a.status === 'Active' ? 'bg-success-subtle text-success' : 'bg-warning-subtle text-warning'}`}>{a.status}</span></td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan="9" className="text-center py-3 text-muted">No active bandwidth allocations found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Change Requests Table */}
            <h6 className="fw-bold mb-2">Upgrade & Change Requests ({bwData.changes?.length || 0})</h6>
            <div className="table-responsive mb-4">
              <table className="table table-hover align-middle border mb-0">
                <thead className="table-light fs-7">
                  <tr>
                    <th>Request Date</th>
                    <th>Service</th>
                    <th>Type</th>
                    <th>Previous → New Mbps</th>
                    <th>Pre-Approval Impact Analysis </th>
                    <th>Reason</th>
                    <th>Status</th>
                    <th>Actions (BR-08 Workflow)</th>
                  </tr>
                </thead>
                <tbody className="fs-7">
                  {bwData.changes?.length > 0 ? (
                    bwData.changes.map((c) => (
                      <tr key={c.id}>
                        <td>{new Date(c.created_at).toLocaleDateString()}</td>
                        <td className="fw-semibold">{c.allocation?.service || 'N/A'}</td>
                        <td><span className={`badge ${c.change_type === 'Upgrade' ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'}`}>{c.change_type}</span></td>
                        <td className="fw-bold">{c.previous_mbps} → {c.new_mbps} Mbps ({c.difference_mbps >= 0 ? `+${c.difference_mbps}` : c.difference_mbps})</td>
                        <td className="small">
                          <span className="text-success fw-semibold">Rev: +৳{Number(c.revenue_impact).toLocaleString()}</span> | <span className="text-danger fw-semibold">Cost: +৳{Number(c.cost_impact).toLocaleString()}</span> <br/>
                          <span className="text-primary fw-bold">Net Profit Impact: +৳{Number(c.profit_impact).toLocaleString()}</span>
                        </td>
                        <td className="small">{c.reason || '-'}</td>
                        <td>
                          <span className={`badge ${c.status === 'Completed' || c.status === 'Approved' ? 'bg-success-subtle text-success' : c.status === 'Rejected' ? 'bg-danger-subtle text-danger' : 'bg-warning-subtle text-warning-emphasis'}`}>
                            {c.status}
                          </span>
                        </td>
                        <td>
                          {(c.status === 'Requested' || c.status === 'Capacity Check') && can('partner.approve') && (
                            <div className="d-flex gap-1">
                              <button
                                className="btn btn-xs btn-success d-flex align-items-center gap-1"
                                disabled={approveBwMutation.isPending}
                                onClick={() => approveBwMutation.mutate({ changeId: c.id, reason: 'Approved by Partner Manager' })}
                              >
                                {approveBwMutation.isPending && approveBwMutation.variables?.changeId === c.id ? <span className="spinner-border spinner-border-sm" /> : <CheckCircle2 size={12} />} Approve
                              </button>
                              <button
                                className="btn btn-xs btn-outline-danger d-flex align-items-center gap-1"
                                disabled={rejectBwMutation.isPending}
                                onClick={() => {
                                  const reason = prompt('Reason for rejection:')
                                  if (reason) rejectBwMutation.mutate({ changeId: c.id, reason })
                                }}
                              >
                                {rejectBwMutation.isPending && rejectBwMutation.variables?.changeId === c.id ? <span className="spinner-border spinner-border-sm" /> : <XCircle size={12} />} Reject
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan="8" className="text-center py-3 text-muted">No bandwidth change requests recorded.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 6: EQUIPMENT & END DEVICES  */}
        {activeTab === 'devices' && (
          <div>
            <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
              <div>
                <h5 className="fw-bold mb-1 text-primary d-flex align-items-center gap-2">
                  <HardDrive size={20} /> Network Equipment & End Devices Management
                </h5>
                <p className="text-muted small mb-0">Track hardware assets, ownership, warranty expiration warnings & customer endpoint devices .</p>
              </div>

              <div className="d-flex gap-2">
                <button className="btn btn-sm btn-primary d-flex align-items-center gap-1" onClick={() => setActiveEqModal('equipment')}>
                  <Plus size={14} /> Add Equipment
                </button>
                <button className="btn btn-sm btn-outline-info d-flex align-items-center gap-1" onClick={() => setActiveEqModal('device')}>
                  <Plus size={14} /> Register End Device
                </button>
              </div>
            </div>

            {/* Equipment KPIs */}
            <div className="card border-0 shadow-sm mb-4 bg-light">
              <div className="card-body p-3">
                <div className="row g-3 text-center">
                  <div className="col-6 col-md-3">
                    <div className="text-muted fs-8">ASSIGNED EQUIPMENT</div>
                    <div className="fw-bold fs-4 text-primary">{eqData.total_units || 0} <span className="fs-6">Units</span></div>
                  </div>
                  <div className="col-6 col-md-3">
                    <div className="text-muted fs-8">ACTIVE & INSTALLED</div>
                    <div className="fw-bold fs-4 text-success">{eqData.active_units || 0} <span className="fs-6">Units</span></div>
                  </div>
                  <div className="col-6 col-md-3">
                    <div className="text-muted fs-8">WARRANTY ALERTS (&lt;30d)</div>
                    <div className="fw-bold fs-4 text-danger">{eqData.warranty_expiring_count || 0} <span className="fs-6">Units</span></div>
                  </div>
                  <div className="col-6 col-md-3">
                    <div className="text-muted fs-8">CONNECTED END DEVICES</div>
                    <div className="fw-bold fs-4 text-info">{eqData.total_end_devices || 0} <span className="fs-6">Devices</span></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Equipment Table */}
            <h6 className="fw-bold mb-2">Equipment Assets ({eqData.equipments?.length || 0})</h6>
            <div className="table-responsive mb-4">
              <table className="table table-hover align-middle border mb-0">
                <thead className="table-light fs-7">
                  <tr>
                    <th>Equipment Code</th>
                    <th>Type & Model</th>
                    <th>Serial # / MAC</th>
                    <th>Ownership</th>
                    <th>Location</th>
                    <th>Warranty Expiry</th>
                    <th>Purchase Cost</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody className="fs-7">
                  {eqData.equipments?.length > 0 ? (
                    eqData.equipments.map((eq) => {
                      const cleanDate = eq.warranty_end ? eq.warranty_end.split('T')[0] : null
                      const isExpiring = cleanDate && Math.ceil((new Date(cleanDate) - new Date()) / (1000 * 60 * 60 * 24)) <= 30 && Math.ceil((new Date(cleanDate) - new Date()) / (1000 * 60 * 60 * 24)) >= 0
                      return (
                        <tr key={eq.id}>
                          <td className="fw-bold text-dark">{eq.equipment_id}</td>
                          <td>
                            <div className="fw-semibold">{eq.equipment_type}</div>
                            <div className="small text-muted">{eq.manufacturer} {eq.model}</div>
                          </td>
                          <td>
                            <div className="small">{eq.serial_number || 'N/A'}</div>
                            {eq.mac_address && <div className="small text-muted">{eq.mac_address}</div>}
                          </td>
                          <td><span className="badge bg-secondary-subtle text-secondary">{eq.ownership}</span></td>
                          <td className="small">{eq.location || '-'}</td>
                          <td>
                            {cleanDate ? (
                              <span className={`badge ${isExpiring ? 'bg-danger-subtle text-danger' : 'bg-light text-dark'}`}>
                                {cleanDate} {isExpiring && '(Expiring Soon)'}
                              </span>
                            ) : '-'}
                          </td>
                          <td className="fw-semibold">৳{Number(eq.purchase_cost).toLocaleString()}</td>
                          <td>
                            <span className={`badge ${eq.status === 'Active' || eq.status === 'Installed' ? 'bg-success-subtle text-success' : eq.status === 'Faulty' ? 'bg-danger-subtle text-danger' : 'bg-warning-subtle text-warning-emphasis'}`}>
                              {eq.status}
                            </span>
                          </td>
                          <td>
                            <div className="d-flex gap-1">
                              {(eq.status === 'Active' || eq.status === 'Installed' || eq.status === 'Faulty') && can('partner.update') && (
                                <>
                                  <button className="btn btn-xs btn-outline-warning py-0 px-2" style={{fontSize:'0.7rem'}} onClick={() => { setEqActionItem(eq); setEqReplaceForm({ reason: '', new_equipment_serial: '', new_equipment_mac: '', new_purchase_cost: '' }); setActiveEqModal('replace'); }}>Replace</button>
                                  <button className="btn btn-xs btn-outline-danger py-0 px-2" style={{fontSize:'0.7rem'}} onClick={() => { setEqActionItem(eq); setEqReturnForm({ reason: '' }); setActiveEqModal('return'); }}>Return</button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  ) : (
                    <tr><td colSpan="8" className="text-center py-3 text-muted">No equipment assets assigned to this partner.</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* End Devices Table */}
            <h6 className="fw-bold mb-2">Registered End Devices ({eqData.end_devices?.length || 0})</h6>
            <div className="table-responsive mb-4">
              <table className="table table-hover align-middle border mb-0">
                <thead className="table-light fs-7">
                  <tr>
                    <th>Device Type</th>
                    <th>Identifier (MAC / Serial / ID)</th>
                    <th>Activation Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody className="fs-7">
                  {eqData.end_devices?.length > 0 ? (
                    eqData.end_devices.map((dev) => (
                      <tr key={dev.id}>
                        <td><span className="badge bg-info-subtle text-info">{dev.device_type}</span></td>
                        <td className="fw-bold text-dark">{dev.identifier}</td>
                        <td>{dev.activation_date ? dev.activation_date.split('T')[0] : '-'}</td>
                        <td>
                          <span className={`badge ${dev.status === 'Active' ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'}`}>
                            {dev.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan="4" className="text-center py-3 text-muted">No end devices registered.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Commission Tab */}
        {activeTab === 'commission' && (
          <div className="pm-card p-4">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <div>
                <h5 className="fw-bold mb-0 d-flex align-items-center gap-2">
                  <CreditCard size={20} className="text-primary" />
                  Commission Engine &amp; Dashboard
                </h5>
                <p className="text-muted small mb-0">Rules, lifecycle (Generated → Payable → Paid), BR-09</p>
              </div>
              <div className="d-flex gap-2">
                <button className="btn btn-sm btn-outline-secondary" onClick={() => setActiveCommModal('addRule')}><Plus size={14} className="me-1" />Add Rule</button>
                <button className="btn btn-sm btn-primary" onClick={() => setActiveCommModal('addCommission')}><Plus size={14} className="me-1" />Record Commission</button>
              </div>
            </div>
            <div className="row g-3 mb-4">
              {[{label:'Total Earned',value:commData.total_earned,color:'success'},{label:'Total Paid',value:commData.total_paid,color:'primary'},{label:'Pending',value:commData.total_pending,color:'warning'},{label:'Current Month',value:commData.current_month,color:'info'},{label:'Prev Month',value:commData.previous_month,color:'secondary'},{label:'YTD',value:commData.ytd,color:'dark'}].map(({label,value,color}) => (
                <div key={label} className="col-6 col-md-4 col-xl-2">
                  <div className="pm-card p-3 text-center h-100">
                    <div className={`text-${color} fw-bold fs-5`}>৳{Number(value||0).toLocaleString()}</div>
                    <div className="text-muted" style={{fontSize:'0.72rem'}}>{label}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="d-flex flex-wrap gap-2 mb-4">
              {commData.by_status && Object.entries(commData.by_status).map(([status,amount]) => (
                <div key={status} className="px-3 py-1 rounded-pill border d-flex gap-2 align-items-center" style={{fontSize:'0.75rem'}}>
                  <span className="fw-semibold">{status}</span>
                  <span className="text-muted">৳{Number(amount||0).toLocaleString()}</span>
                </div>
              ))}
            </div>
            <h6 className="fw-bold mb-2">Commission Rules ({commData.rules?.length || 0})</h6>
            <div className="table-responsive mb-4">
              <table className="table table-hover align-middle border mb-0">
                <thead className="table-light fs-7"><tr><th>Rule Name</th><th>Type</th><th>Rate/Amount</th><th>Service</th><th>Max Cap</th><th>Effective</th><th>Expiry</th><th>Status</th></tr></thead>
                <tbody className="fs-7">
                  {commData.rules?.length > 0 ? commData.rules.map((rule) => (
                    <tr key={rule.id}>
                      <td className="fw-semibold">{rule.rule_name}</td>
                      <td><span className="badge bg-primary-subtle text-primary">{rule.commission_type}</span></td>
                      <td>{['Percentage','Revenue Based','Bandwidth Based','Custom'].includes(rule.commission_type) ? `${rule.rate}%` : `৳${Number(rule.fixed_amount||0).toLocaleString()}`}</td>
                      <td>{rule.service||'—'}</td>
                      <td>{rule.maximum_limit>0?`৳${Number(rule.maximum_limit).toLocaleString()}`:'—'}</td>
                      <td>{rule.effective_date||'—'}</td>
                      <td>{rule.expiry_date||'—'}</td>
                      <td><span className={`badge ${rule.status==='Active'?'bg-success-subtle text-success':'bg-danger-subtle text-danger'}`}>{rule.status}</span></td>
                    </tr>
                  )) : <tr><td colSpan="8" className="text-center py-3 text-muted">No rules — click "Add Rule" to configure the engine.</td></tr>}
                </tbody>
              </table>
            </div>
            <h6 className="fw-bold mb-2">Commission Records ({commData.commissions?.length || 0})</h6>
            <div className="table-responsive">
              <table className="table table-hover align-middle border mb-0">
                <thead className="table-light fs-7"><tr><th>Period</th><th>Rule</th><th>Source Ref.</th><th>Source (৳)</th><th>Commission (৳)</th><th>Status</th><th>Generated</th><th>Approved By</th><th>Actions</th></tr></thead>
                <tbody className="fs-7">
                  {commData.commissions?.length > 0 ? commData.commissions.map((c) => (
                    <tr key={c.id}>
                      <td className="fw-semibold">{String(c.period_month).padStart(2,'0')}/{c.period_year}</td>
                      <td>{c.rule_name||'—'}</td>
                      <td className="text-muted small">{c.source_reference||'—'}</td>
                      <td>৳{Number(c.source_amount||0).toLocaleString()}</td>
                      <td className="fw-bold text-success">৳{Number(c.commission_amount||0).toLocaleString()}</td>
                      <td><span className={`badge ${c.status==='Paid'?'bg-success text-white':c.status==='Payable'?'bg-success-subtle text-success':c.status==='Approved'?'bg-primary-subtle text-primary':['Rejected','Reversed'].includes(c.status)?'bg-danger-subtle text-danger':['Generated','Pending'].includes(c.status)?'bg-warning-subtle text-warning':'bg-secondary-subtle text-secondary'}`}>{c.status}</span></td>
                      <td>{c.generated_at||'—'}</td>
                      <td>{c.approved_by_name||'—'}</td>
                      <td>
                        <div className="d-flex gap-1 flex-wrap">
                          {['Generated','Pending','Calculated'].includes(c.status) && (<>
                            <button className="btn btn-xs btn-success py-0 px-2" style={{fontSize:'0.7rem'}} disabled={approveCommMutation.isPending} onClick={()=>approveCommMutation.mutate({cid:c.id,reason:''})}>{approveCommMutation.isPending?<span className="spinner-border spinner-border-sm"/>:<CheckCircle2 size={12}/>} Approve</button>
                            <button className="btn btn-xs btn-outline-danger py-0 px-2" style={{fontSize:'0.7rem'}} onClick={()=>{setCommActionId(c.id);setCommActionReason('')}}><XCircle size={12}/> Reject</button>
                          </>)}
                          {c.status==='Payable' && <button className="btn btn-xs btn-primary py-0 px-2" style={{fontSize:'0.7rem'}} onClick={()=>{setCommPayForm({commissionId:c.id,payment_date:new Date().toISOString().split('T')[0],amount:c.commission_amount,payment_method:'Bank Transfer',reference_number:''});setActiveCommModal('pay')}}>Pay</button>}
                          {c.status==='Paid' && <span className="text-success small"><CheckCircle2 size={12}/> Paid</span>}
                        </div>
                      </td>
                    </tr>
                  )) : <tr><td colSpan="9" className="text-center py-3 text-muted">No records — click "Record Commission".</td></tr>}
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
                <button className="btn btn-success d-flex align-items-center gap-1" disabled={addRevMutation.isPending || !revForm.amount} onClick={() => addRevMutation.mutate(revForm)}>
                  {addRevMutation.isPending && <span className="spinner-border spinner-border-sm me-1" />}
                  {addRevMutation.isPending ? 'Saving Revenue...' : 'Save Revenue'}
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
                <button className="btn btn-danger d-flex align-items-center gap-1" disabled={addCostMutation.isPending || !costForm.amount} onClick={() => addCostMutation.mutate(costForm)}>
                  {addCostMutation.isPending && <span className="spinner-border spinner-border-sm me-1" />}
                  {addCostMutation.isPending ? 'Saving Cost...' : 'Save Cost'}
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
                <button className="btn btn-primary d-flex align-items-center gap-1" disabled={addPayMutation.isPending || !payForm.amount} onClick={() => addPayMutation.mutate(payForm)}>
                  {addPayMutation.isPending && <span className="spinner-border spinner-border-sm me-1" />}
                  {addPayMutation.isPending ? 'Saving Payment...' : 'Save Payment'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bandwidth Modals (Phase 5.1) */}
      {activeBwModal === 'allocate' && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title fw-bold">Allocate Bandwidth</h5>
                <button type="button" className="btn-close" onClick={() => setActiveBwModal(null)}></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label small fw-semibold">Service Type</label>
                  <select className="form-select" value={bwAllocForm.service} onChange={(e) => setBwAllocForm({ ...bwAllocForm, service: e.target.value })}>
                    <option value="Internet">Internet</option>
                    <option value="GGC">GGC</option>
                    <option value="FNA">FNA</option>
                    <option value="BDIX">BDIX</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="mb-3">
                  <label className="form-label small fw-semibold">Allocated Capacity (Mbps)</label>
                  <input type="number" className="form-control" value={bwAllocForm.allocated_mbps} onChange={(e) => setBwAllocForm({ ...bwAllocForm, allocated_mbps: e.target.value })} placeholder="e.g. 500" />
                </div>
                <div className="row g-2 mb-3">
                  <div className="col-6">
                    <label className="form-label small fw-semibold">Contention Ratio</label>
                    <input type="text" className="form-control" value={bwAllocForm.ratio} onChange={(e) => setBwAllocForm({ ...bwAllocForm, ratio: e.target.value })} placeholder="e.g. 1:1 or 1:4" />
                  </div>
                  <div className="col-6">
                    <label className="form-label small fw-semibold">Work Order ID</label>
                    <input type="text" className="form-control" value={bwAllocForm.work_order_id} onChange={(e) => setBwAllocForm({ ...bwAllocForm, work_order_id: e.target.value })} placeholder="Auto if empty" />
                  </div>
                </div>
                <div className="row g-2 mb-3">
                  <div className="col-6">
                    <label className="form-label small fw-semibold">Monthly Price (৳)</label>
                    <input type="number" className="form-control" value={bwAllocForm.price} onChange={(e) => setBwAllocForm({ ...bwAllocForm, price: e.target.value })} placeholder="e.g. 150000" />
                  </div>
                  <div className="col-6">
                    <label className="form-label small fw-semibold">Monthly Cost (৳)</label>
                    <input type="number" className="form-control" value={bwAllocForm.cost} onChange={(e) => setBwAllocForm({ ...bwAllocForm, cost: e.target.value })} placeholder="e.g. 105000" />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setActiveBwModal(null)}>Cancel</button>
                <button className="btn btn-primary d-flex align-items-center gap-1" disabled={addBwAllocMutation.isPending || !bwAllocForm.allocated_mbps} onClick={() => addBwAllocMutation.mutate(bwAllocForm)}>
                  {addBwAllocMutation.isPending && <span className="spinner-border spinner-border-sm me-1" />}
                  {addBwAllocMutation.isPending ? 'Saving Allocation...' : 'Save Allocation'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeBwModal === 'change' && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title fw-bold">Request Bandwidth Upgrade / Change</h5>
                <button type="button" className="btn-close" onClick={() => setActiveBwModal(null)}></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label small fw-semibold">Select Target Bandwidth Allocation</label>
                  <select className="form-select" value={bwChangeForm.allocation_id} onChange={(e) => setBwChangeForm({ ...bwChangeForm, allocation_id: e.target.value })}>
                    <option value="">-- Choose Allocation --</option>
                    {bwData.allocations?.map((a) => (
                      <option key={a.id} value={a.id}>{a.service} - Current: {a.allocated_mbps} Mbps (WO: {a.work_order_id})</option>
                    ))}
                  </select>
                </div>
                <div className="row g-2 mb-3">
                  <div className="col-6">
                    <label className="form-label small fw-semibold">Change Type</label>
                    <select className="form-select" value={bwChangeForm.change_type} onChange={(e) => setBwChangeForm({ ...bwChangeForm, change_type: e.target.value })}>
                      <option value="Upgrade">Upgrade</option>
                      <option value="Downgrade">Downgrade</option>
                      <option value="Temporary">Temporary Boost</option>
                      <option value="Emergency">Emergency Adjustment</option>
                    </select>
                  </div>
                  <div className="col-6">
                    <label className="form-label small fw-semibold">New Requested Mbps</label>
                    <input type="number" className="form-control" value={bwChangeForm.new_mbps} onChange={(e) => setBwChangeForm({ ...bwChangeForm, new_mbps: e.target.value })} placeholder="e.g. 800" />
                  </div>
                </div>

                {/* Pre-Approval Impact Analysis Box */}
                {bwChangeForm.allocation_id && bwChangeForm.new_mbps && (
                  (() => {
                    const sel = bwData.allocations?.find(a => a.id == bwChangeForm.allocation_id)
                    if (!sel) return null
                    const diff = Number(bwChangeForm.new_mbps) - Number(sel.allocated_mbps)
                    const unitPrice = sel.allocated_mbps > 0 ? (sel.price / sel.allocated_mbps) : 300
                    const unitCost = sel.allocated_mbps > 0 ? (sel.cost / sel.allocated_mbps) : 200
                    const revImp = diff * unitPrice
                    const costImp = diff * unitCost
                    const profitImp = revImp - costImp
                    return (
                      <div className="p-3 bg-light rounded-3 border mb-3">
                        <h6 className="fw-bold fs-7 text-primary mb-2">Pre-Approval Impact Analysis </h6>
                        <div className="row text-center g-2 fs-7">
                          <div className="col-3"><span className="text-muted">Capacity Diff:</span> <br/><strong className={diff >= 0 ? 'text-success' : 'text-danger'}>{diff >= 0 ? `+${diff}` : diff} Mbps</strong></div>
                          <div className="col-3"><span className="text-muted">Est. Revenue:</span> <br/><strong className={revImp >= 0 ? 'text-success' : 'text-danger'}>{revImp >= 0 ? `+৳${revImp.toLocaleString()}` : `৳${revImp.toLocaleString()}`}</strong></div>
                          <div className="col-3"><span className="text-muted">Est. Cost:</span> <br/><strong className={costImp >= 0 ? 'text-danger' : 'text-success'}>{costImp >= 0 ? `+৳${costImp.toLocaleString()}` : `৳${costImp.toLocaleString()}`}</strong></div>
                          <div className="col-3"><span className="text-muted">Net Profit:</span> <br/><strong className={profitImp >= 0 ? 'text-primary' : 'text-danger'}>{profitImp >= 0 ? `+৳${profitImp.toLocaleString()}` : `৳${profitImp.toLocaleString()}`}</strong></div>
                        </div>
                      </div>
                    )
                  })()
                )}

                <div className="mb-3">
                  <label className="form-label small fw-semibold">Business Justification / Reason</label>
                  <textarea className="form-control" rows="2" value={bwChangeForm.reason} onChange={(e) => setBwChangeForm({ ...bwChangeForm, reason: e.target.value })} placeholder="Reason for capacity adjustment..."></textarea>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setActiveBwModal(null)}>Cancel</button>
                <button className="btn btn-warning text-dark d-flex align-items-center gap-1" disabled={bwChangeReqMutation.isPending || !bwChangeForm.allocation_id || !bwChangeForm.new_mbps} onClick={() => bwChangeReqMutation.mutate(bwChangeForm)}>
                  {bwChangeReqMutation.isPending && <span className="spinner-border spinner-border-sm me-1" />}
                  {bwChangeReqMutation.isPending ? 'Submitting Request...' : 'Submit Request for Approval (BR-08)'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Equipment Modals */}
      {activeEqModal === 'equipment' && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title fw-bold">Add & Assign Equipment</h5>
                <button type="button" className="btn-close" onClick={() => setActiveEqModal(null)}></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label small fw-semibold">Equipment Type</label>
                  <select className="form-select" value={eqForm.equipment_type} onChange={(e) => setEqForm({ ...eqForm, equipment_type: e.target.value })}>
                    <option value="Router">Router</option>
                    <option value="ONU">ONU / ONT</option>
                    <option value="OLT">OLT</option>
                    <option value="Switch">Switch</option>
                    <option value="CPE">CPE</option>
                    <option value="Access Point">Access Point</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="row g-2 mb-3">
                  <div className="col-6">
                    <label className="form-label small fw-semibold">Manufacturer</label>
                    <input type="text" className="form-control" value={eqForm.manufacturer} onChange={(e) => setEqForm({ ...eqForm, manufacturer: e.target.value })} placeholder="e.g. MikroTik, Huawei" />
                  </div>
                  <div className="col-6">
                    <label className="form-label small fw-semibold">Model</label>
                    <input type="text" className="form-control" value={eqForm.model} onChange={(e) => setEqForm({ ...eqForm, model: e.target.value })} placeholder="e.g. CCR1036" />
                  </div>
                </div>
                <div className="row g-2 mb-3">
                  <div className="col-6">
                    <label className="form-label small fw-semibold">Serial Number</label>
                    <input type="text" className="form-control" value={eqForm.serial_number} onChange={(e) => setEqForm({ ...eqForm, serial_number: e.target.value })} placeholder="Serial #" />
                  </div>
                  <div className="col-6">
                    <label className="form-label small fw-semibold">MAC Address</label>
                    <input type="text" className="form-control" value={eqForm.mac_address} onChange={(e) => setEqForm({ ...eqForm, mac_address: e.target.value })} placeholder="XX:XX:XX:XX:XX:XX" />
                  </div>
                </div>
                <div className="row g-2 mb-3">
                  <div className="col-6">
                    <label className="form-label small fw-semibold">Ownership</label>
                    <select className="form-select" value={eqForm.ownership} onChange={(e) => setEqForm({ ...eqForm, ownership: e.target.value })}>
                      <option value="Company Owned">Company Owned</option>
                      <option value="Partner Owned">Partner Owned</option>
                      <option value="Customer Owned">Customer Owned</option>
                      <option value="Leased">Leased</option>
                      <option value="Rented">Rented</option>
                    </select>
                  </div>
                  <div className="col-6">
                    <label className="form-label small fw-semibold">Purchase Cost (৳)</label>
                    <input type="number" className="form-control" value={eqForm.purchase_cost} onChange={(e) => setEqForm({ ...eqForm, purchase_cost: e.target.value })} placeholder="e.g. 120000" />
                  </div>
                </div>
                <div className="row g-2 mb-3">
                  <div className="col-6">
                    <label className="form-label small fw-semibold">Location / POP</label>
                    <input type="text" className="form-control" value={eqForm.location} onChange={(e) => setEqForm({ ...eqForm, location: e.target.value })} placeholder="e.g. Rack A-12" />
                  </div>
                  <div className="col-6">
                    <label className="form-label small fw-semibold">Warranty End Date</label>
                    <input type="date" className="form-control" value={eqForm.warranty_end} onChange={(e) => setEqForm({ ...eqForm, warranty_end: e.target.value })} />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setActiveEqModal(null)}>Cancel</button>
                <button className="btn btn-primary d-flex align-items-center gap-1" disabled={addEqMutation.isPending} onClick={() => addEqMutation.mutate(eqForm)}>
                  {addEqMutation.isPending && <span className="spinner-border spinner-border-sm me-1" />}
                  {addEqMutation.isPending ? 'Saving Equipment...' : 'Save Equipment'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeEqModal === 'device' && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title fw-bold">Register End Device</h5>
                <button type="button" className="btn-close" onClick={() => setActiveEqModal(null)}></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label small fw-semibold">Device Type</label>
                  <select className="form-select" value={devForm.device_type} onChange={(e) => setDevForm({ ...devForm, device_type: e.target.value })}>
                    <option value="ONU">ONU / ONT</option>
                    <option value="MAC Address">MAC Address</option>
                    <option value="Router">Router</option>
                    <option value="CPE">CPE</option>
                    <option value="Device ID">Device ID</option>
                    <option value="Serial Number">Serial Number</option>
                  </select>
                </div>
                <div className="mb-3">
                  <label className="form-label small fw-semibold">Identifier (MAC / Serial / Device ID)</label>
                  <input type="text" className="form-control" value={devForm.identifier} onChange={(e) => setDevForm({ ...devForm, identifier: e.target.value })} placeholder="e.g. HWTC12345678 or 00:1A:2B:3C:4D:5E" />
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setActiveEqModal(null)}>Cancel</button>
                <button className="btn btn-info text-white d-flex align-items-center gap-1" disabled={addDevMutation.isPending || !devForm.identifier} onClick={() => addDevMutation.mutate(devForm)}>
                  {addDevMutation.isPending && <span className="spinner-border spinner-border-sm me-1" />}
                  {addDevMutation.isPending ? 'Registering Device...' : 'Register Device'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══ Commission Modals  */}

      {/* Add Commission Rule Modal */}
      {activeCommModal === 'addRule' && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title fw-bold">Add Commission Rule</h5>
                <button type="button" className="btn-close" onClick={() => setActiveCommModal(null)} />
              </div>
              <div className="modal-body">
                <div className="row g-3">
                  <div className="col-12">
                    <label className="form-label small fw-semibold">Rule Name *</label>
                    <input type="text" className="form-control" value={commRuleForm.rule_name} onChange={(e) => setCommRuleForm({ ...commRuleForm, rule_name: e.target.value })} placeholder="e.g. Bandwidth Revenue Commission 5%" />
                  </div>
                  <div className="col-6">
                    <label className="form-label small fw-semibold">Commission Type *</label>
                    <select className="form-select" value={commRuleForm.commission_type} onChange={(e) => setCommRuleForm({ ...commRuleForm, commission_type: e.target.value })}>
                      {['Percentage','Fixed Amount','Per Customer','Per Activation','Per Renewal','Per Package','Revenue Based','Bandwidth Based','Custom'].map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-6">
                    <label className="form-label small fw-semibold">Service</label>
                    <input type="text" className="form-control" value={commRuleForm.service} onChange={(e) => setCommRuleForm({ ...commRuleForm, service: e.target.value })} placeholder="e.g. Internet, GGC (optional)" />
                  </div>
                  <div className="col-4">
                    <label className="form-label small fw-semibold">
                      {['Percentage','Revenue Based','Bandwidth Based','Custom'].includes(commRuleForm.commission_type) ? 'Rate (%)' : 'Fixed Amount (৳)'}
                    </label>
                    {['Percentage','Revenue Based','Bandwidth Based','Custom'].includes(commRuleForm.commission_type)
                      ? <input type="number" className="form-control" value={commRuleForm.rate} onChange={(e) => setCommRuleForm({ ...commRuleForm, rate: e.target.value })} placeholder="e.g. 5" />
                      : <input type="number" className="form-control" value={commRuleForm.fixed_amount} onChange={(e) => setCommRuleForm({ ...commRuleForm, fixed_amount: e.target.value })} placeholder="e.g. 500" />
                    }
                  </div>
                  <div className="col-4">
                    <label className="form-label small fw-semibold">Maximum Cap (৳) — optional</label>
                    <input type="number" className="form-control" value={commRuleForm.maximum_limit} onChange={(e) => setCommRuleForm({ ...commRuleForm, maximum_limit: e.target.value })} placeholder="e.g. 50000 (0 = no cap)" />
                  </div>
                  <div className="col-4">
                    <label className="form-label small fw-semibold">Status</label>
                    <select className="form-select" value={commRuleForm.status} onChange={(e) => setCommRuleForm({ ...commRuleForm, status: e.target.value })}>
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                  <div className="col-6">
                    <label className="form-label small fw-semibold">Effective Date</label>
                    <input type="date" className="form-control" value={commRuleForm.effective_date} onChange={(e) => setCommRuleForm({ ...commRuleForm, effective_date: e.target.value })} />
                  </div>
                  <div className="col-6">
                    <label className="form-label small fw-semibold">Expiry Date</label>
                    <input type="date" className="form-control" value={commRuleForm.expiry_date} onChange={(e) => setCommRuleForm({ ...commRuleForm, expiry_date: e.target.value })} />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setActiveCommModal(null)}>Cancel</button>
                <button className="btn btn-primary d-flex align-items-center gap-1" disabled={addCommRuleMutation.isPending || !commRuleForm.rule_name} onClick={() => addCommRuleMutation.mutate(commRuleForm)}>
                  {addCommRuleMutation.isPending && <span className="spinner-border spinner-border-sm me-1" />}
                  {addCommRuleMutation.isPending ? 'Saving Rule...' : 'Save Commission Rule'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Record Commission Modal */}
      {activeCommModal === 'addCommission' && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title fw-bold">Record Commission Entry</h5>
                <button type="button" className="btn-close" onClick={() => setActiveCommModal(null)} />
              </div>
              <div className="modal-body">
                <div className="alert alert-info py-2 small">
                  <strong>Calculation Preview:</strong> Source Amount × Rule Rate = Commission Amount (auto-calculated if rule is selected)
                </div>
                <div className="mb-3">
                  <label className="form-label small fw-semibold">Commission Rule</label>
                  <select className="form-select" value={commForm.rule_id} onChange={(e) => setCommForm({ ...commForm, rule_id: e.target.value })}>
                    <option value="">-- No Rule (Manual) --</option>
                    {commData.rules?.map((r) => (
                      <option key={r.id} value={r.id}>{r.rule_name} ({r.commission_type}{r.rate > 0 ? ` — ${r.rate}%` : ''})</option>
                    ))}
                  </select>
                </div>
                <div className="row g-2 mb-3">
                  <div className="col-6">
                    <label className="form-label small fw-semibold">Period Month *</label>
                    <select className="form-select" value={commForm.period_month} onChange={(e) => setCommForm({ ...commForm, period_month: Number(e.target.value) })}>
                      {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                        <option key={m} value={m}>{m.toString().padStart(2, '0')}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-6">
                    <label className="form-label small fw-semibold">Period Year *</label>
                    <input type="number" className="form-control" value={commForm.period_year} onChange={(e) => setCommForm({ ...commForm, period_year: Number(e.target.value) })} />
                  </div>
                </div>
                <div className="mb-3">
                  <label className="form-label small fw-semibold">Source Amount (৳) *</label>
                  <input type="number" className="form-control" value={commForm.source_amount} onChange={(e) => setCommForm({ ...commForm, source_amount: e.target.value })} placeholder="e.g. 100000" />
                </div>
                <div className="mb-3">
                  <label className="form-label small fw-semibold">Override Commission Amount (৳) — leave blank to auto-calculate</label>
                  <input type="number" className="form-control" value={commForm.commission_amount} onChange={(e) => setCommForm({ ...commForm, commission_amount: e.target.value })} placeholder="Auto from rule" />
                </div>
                <div className="mb-3">
                  <label className="form-label small fw-semibold">Source Reference (Transaction ID)</label>
                  <input type="text" className="form-control" value={commForm.source_reference} onChange={(e) => setCommForm({ ...commForm, source_reference: e.target.value })} placeholder="e.g. INV-2026-09-001" />
                </div>
                <div className="mb-3">
                  <label className="form-label small fw-semibold">Remarks</label>
                  <textarea className="form-control" rows="2" value={commForm.remarks} onChange={(e) => setCommForm({ ...commForm, remarks: e.target.value })} />
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setActiveCommModal(null)}>Cancel</button>
                <button className="btn btn-success d-flex align-items-center gap-1" disabled={addCommMutation.isPending || !commForm.source_amount} onClick={() => addCommMutation.mutate(commForm)}>
                  {addCommMutation.isPending && <span className="spinner-border spinner-border-sm me-1" />}
                  {addCommMutation.isPending ? 'Saving Commission...' : 'Record Commission (→ Generated)'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pay Commission Modal  */}
      {activeCommModal === 'pay' && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title fw-bold">Record Commission Payment</h5>
                <button type="button" className="btn-close" onClick={() => setActiveCommModal(null)} />
              </div>
              <div className="modal-body">
                <div className="alert alert-success py-2 small mb-3">
                  <strong>BR-09 Compliant:</strong> This commission has been Approved and is Payable. Recording payment will mark it as Paid.
                </div>
                <div className="mb-3">
                  <label className="form-label small fw-semibold">Payment Date *</label>
                  <input type="date" className="form-control" value={commPayForm.payment_date} onChange={(e) => setCommPayForm({ ...commPayForm, payment_date: e.target.value })} />
                </div>
                <div className="mb-3">
                  <label className="form-label small fw-semibold">Amount (৳) *</label>
                  <input type="number" className="form-control" value={commPayForm.amount} onChange={(e) => setCommPayForm({ ...commPayForm, amount: e.target.value })} placeholder="Commission amount" />
                </div>
                <div className="mb-3">
                  <label className="form-label small fw-semibold">Payment Method</label>
                  <select className="form-select" value={commPayForm.payment_method} onChange={(e) => setCommPayForm({ ...commPayForm, payment_method: e.target.value })}>
                    {['Bank Transfer','Cheque','Cash','Mobile Banking','Other'].map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
                <div className="mb-3">
                  <label className="form-label small fw-semibold">Reference Number</label>
                  <input type="text" className="form-control" value={commPayForm.reference_number} onChange={(e) => setCommPayForm({ ...commPayForm, reference_number: e.target.value })} placeholder="Bank transaction / Cheque #" />
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setActiveCommModal(null)}>Cancel</button>
                <button className="btn btn-primary d-flex align-items-center gap-1" disabled={payCommMutation.isPending || !commPayForm.amount} onClick={() => payCommMutation.mutate({ cid: commPayForm.commissionId, data: commPayForm })}>
                  {payCommMutation.isPending && <span className="spinner-border spinner-border-sm me-1" />}
                  {payCommMutation.isPending ? 'Processing Payment...' : 'Record Payment (→ Paid)'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Commission Confirmation */}
      {commActionId && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-sm">
            <div className="modal-content">
              <div className="modal-header">
                <h6 className="modal-title fw-bold">Reject Commission</h6>
                <button type="button" className="btn-close" onClick={() => setCommActionId(null)} />
              </div>
              <div className="modal-body">
                <textarea className="form-control" rows="3" placeholder="Reason for rejection..." value={commActionReason} onChange={(e) => setCommActionReason(e.target.value)} />
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary btn-sm" onClick={() => setCommActionId(null)}>Cancel</button>
                <button className="btn btn-danger btn-sm d-flex align-items-center gap-1" disabled={rejectCommMutation.isPending || !commActionReason} onClick={() => rejectCommMutation.mutate({ cid: commActionId, reason: commActionReason })}>
                  {rejectCommMutation.isPending && <span className="spinner-border spinner-border-sm" />}
                  {rejectCommMutation.isPending ? 'Rejecting...' : 'Confirm Reject'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Equipment Replace Modal */}
      {activeEqModal === 'replace' && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title fw-bold">Replace Equipment</h5>
                <button type="button" className="btn-close" onClick={() => setActiveEqModal(null)} />
              </div>
              <div className="modal-body">
                <div className="alert alert-warning py-2 small mb-3">
                  Replacing <strong>{eqActionItem?.equipment_id}</strong> ({eqActionItem?.equipment_type}). The current item will be marked as 'Replaced'.
                </div>
                <div className="mb-3">
                  <label className="form-label small fw-semibold">Reason for Replacement *</label>
                  <textarea className="form-control" rows="2" value={eqReplaceForm.reason} onChange={(e) => setEqReplaceForm({ ...eqReplaceForm, reason: e.target.value })} required />
                </div>
                <h6 className="fw-bold fs-7 mb-2 border-bottom pb-1">New Equipment Details (Optional)</h6>
                <div className="mb-3">
                  <label className="form-label small fw-semibold">New Serial Number</label>
                  <input type="text" className="form-control" value={eqReplaceForm.new_equipment_serial} onChange={(e) => setEqReplaceForm({ ...eqReplaceForm, new_equipment_serial: e.target.value })} />
                </div>
                <div className="mb-3">
                  <label className="form-label small fw-semibold">New MAC Address</label>
                  <input type="text" className="form-control" value={eqReplaceForm.new_equipment_mac} onChange={(e) => setEqReplaceForm({ ...eqReplaceForm, new_equipment_mac: e.target.value })} />
                </div>
                <div className="mb-3">
                  <label className="form-label small fw-semibold">New Purchase Cost (৳)</label>
                  <input type="number" className="form-control" value={eqReplaceForm.new_purchase_cost} onChange={(e) => setEqReplaceForm({ ...eqReplaceForm, new_purchase_cost: e.target.value })} />
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setActiveEqModal(null)}>Cancel</button>
                <button className="btn btn-warning d-flex align-items-center gap-1" disabled={replaceEqMutation.isPending || !eqReplaceForm.reason} onClick={() => replaceEqMutation.mutate(eqReplaceForm)}>
                  {replaceEqMutation.isPending && <span className="spinner-border spinner-border-sm me-1" />}
                  {replaceEqMutation.isPending ? 'Replacing...' : 'Confirm Replace'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Equipment Return Modal */}
      {activeEqModal === 'return' && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title fw-bold">Return Equipment</h5>
                <button type="button" className="btn-close" onClick={() => setActiveEqModal(null)} />
              </div>
              <div className="modal-body">
                <div className="alert alert-danger py-2 small mb-3">
                  Returning <strong>{eqActionItem?.equipment_id}</strong> ({eqActionItem?.equipment_type}). The current item will be marked as 'Returned'.
                </div>
                <div className="mb-3">
                  <label className="form-label small fw-semibold">Reason for Return *</label>
                  <textarea className="form-control" rows="3" value={eqReturnForm.reason} onChange={(e) => setEqReturnForm({ ...eqReturnForm, reason: e.target.value })} required />
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setActiveEqModal(null)}>Cancel</button>
                <button className="btn btn-danger d-flex align-items-center gap-1" disabled={returnEqMutation.isPending || !eqReturnForm.reason} onClick={() => returnEqMutation.mutate(eqReturnForm)}>
                  {returnEqMutation.isPending && <span className="spinner-border spinner-border-sm me-1" />}
                  {returnEqMutation.isPending ? 'Returning...' : 'Confirm Return'}
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
