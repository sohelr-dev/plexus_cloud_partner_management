import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowLeft,
  Building2,
  MapPin,
  Mail,
  Phone,
  Calendar,
  Edit,
  ShieldAlert,
  Loader2,
  Layers,
  FileText,
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
  UserCheck
} from 'lucide-react'
import StatusActionModal from '../../components/common/StatusActionModal'
import api from '../../api/client'

const TABS = [
  { id: 'overview', label: 'Overview', icon: Activity },
  { id: 'business', label: 'Business Info', icon: Building2 },
  { id: 'models', label: 'Business Models', icon: Layers },
  { id: 'financial', label: 'Financials', icon: DollarSign },
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
  const [activeTab, setActiveTab] = useState('overview')
  const [modalState, setModalState] = useState({ isOpen: false, mode: 'status_change' })

  const { data: partner, isLoading, isError, error } = useQuery({
    queryKey: ['partner', id],
    queryFn: async () => {
      const res = await api.get(`/partners/${id}`)
      return res.data.data ?? res.data
    },
  })

  // 1. Centered Loading Spinner
  if (isLoading) {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center min-vh-50 py-5 my-5">
        <div className="spinner-border text-primary mb-3" style={{ width: '3rem', height: '3rem' }} role="status" />
        <div className="fw-semibold text-dark">Loading Partner Profile...</div>
        <div className="text-muted small">Fetching complete commercial, network & financial master data</div>
      </div>
    )
  }

  // 2. Error State
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

      {/* Profile Header Banner (PRD Section 15) */}
      <div className="pm-card mb-4 p-4">
        <div className="d-flex flex-wrap align-items-start justify-content-between gap-3">
          <div className="d-flex align-items-center gap-3">
            {/* Avatar / Logo */}
            <div
              className="rounded-circle bg-primary bg-opacity-10 text-primary d-flex align-items-center justify-content-center fw-bold shadow-sm border border-primary-subtle"
              style={{ width: 64, height: 64, fontSize: '1.75rem' }}
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

              <div className="text-muted small mt-1 d-flex align-items-center gap-3 flex-wrap">
                <span><strong>ID:</strong> {partner.partner_id}</span>
                <span>•</span>
                <span><strong>Code:</strong> {partner.partner_code}</span>
                <span>•</span>
                <span><strong>Type:</strong> {partner.partner_type}</span>
                {partner.account_manager && (
                  <>
                    <span>•</span>
                    <span className="d-flex align-items-center gap-1 text-primary">
                      <UserCheck size={14} /> AM: {partner.account_manager.name}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons & Health Score */}
          <div className="d-flex align-items-center gap-3">
            {/* Health Score Chip */}
            <div className="text-end border-end pe-3 d-none d-sm-block">
              <div className="text-muted style-sm" style={{ fontSize: '0.75rem' }}>Health Status</div>
              <div className="d-flex align-items-center gap-1 fw-bold fs-5" style={{ color: partner.health_score >= 80 ? 'var(--green-500)' : partner.health_score >= 50 ? 'var(--amber-500)' : 'var(--red-500)' }}>
                {partner.health_score ?? 100}% <span style={{ fontSize: '0.8rem' }}>({partner.health_status ?? 'Healthy'})</span>
              </div>
            </div>

            {['Pending Approval', 'Under Review'].includes(partner.status) && (
              <button
                className="btn btn-success d-flex align-items-center gap-1.5 fw-semibold shadow-sm"
                onClick={() => setModalState({ isOpen: true, mode: 'approve' })}
                style={{ fontSize: '0.85rem' }}
              >
                <ShieldAlert size={16} /> Approve / Reject
              </button>
            )}

            <button
              className="pm-btn pm-btn-ghost text-dark border d-flex align-items-center gap-1.5"
              onClick={() => setModalState({ isOpen: true, mode: 'status_change' })}
              style={{ fontSize: '0.85rem' }}
            >
              Change Status
            </button>

            <Link to={`/partners/${id}/edit`} className="pm-btn pm-btn-outline text-decoration-none">
              <Edit size={16} /> Edit Profile
            </Link>
          </div>
        </div>

        {/* Business Models Badges */}
        <div className="mt-3 pt-3 border-top d-flex align-items-center gap-2 flex-wrap">
          <span className="text-muted fw-medium me-1" style={{ fontSize: '0.8rem' }}>Active Models:</span>
          {businessModels.length > 0 ? (
            businessModels.map((bm) => (
              <span key={bm.id} className="badge bg-primary-subtle text-primary border border-primary-subtle px-2.5 py-1">
                <Layers size={12} className="me-1" /> {bm.name}
              </span>
            ))
          ) : (
            <span className="text-muted small">No business models assigned</span>
          )}
        </div>
      </div>

      {/* Tab Navigation (PRD Section 14 - 12 Tabs) */}
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
        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div>
            <h5 className="fw-bold mb-3 d-flex align-items-center gap-2 text-primary">
              <Activity size={20} /> Partner Overview & Core Metrics
            </h5>

            <div className="row g-4 mb-4">
              {/* Card 1: Business Overview */}
              <div className="col-md-6 col-xl-3">
                <div className="p-3 bg-light rounded border h-100">
                  <div className="text-muted small mb-1">Commercial Type</div>
                  <div className="fw-bold fs-6 text-dark">{partner.partner_type} ({partner.partner_category})</div>
                  <div className="text-muted small mt-2">Since: {partner.partner_since ? new Date(partner.partner_since).toLocaleDateString() : 'Recent'}</div>
                </div>
              </div>

              {/* Card 2: Financial Snapshot */}
              <div className="col-md-6 col-xl-3">
                <div className="p-3 bg-light rounded border h-100">
                  <div className="text-muted small mb-1">Credit Limit</div>
                  <div className="fw-bold fs-6 text-primary">৳{(profile.credit_limit ?? 0).toLocaleString()}</div>
                  <div className="text-muted small mt-2">Terms: {profile.payment_terms ?? 'Net 30'} ({profile.credit_days ?? 30} days)</div>
                </div>
              </div>

              {/* Card 3: Security Deposit */}
              <div className="col-md-6 col-xl-3">
                <div className="p-3 bg-light rounded border h-100">
                  <div className="text-muted small mb-1">Security Deposit</div>
                  <div className="fw-bold fs-6 text-success">৳{(profile.security_deposit ?? 0).toLocaleString()}</div>
                  <div className="text-muted small mt-2">Billing: {profile.billing_cycle ?? 'Monthly'}</div>
                </div>
              </div>

              {/* Card 4: Location */}
              <div className="col-md-6 col-xl-3">
                <div className="p-3 bg-light rounded border h-100">
                  <div className="text-muted small mb-1">Geographic Area</div>
                  <div className="fw-bold fs-6 text-dark">{partner.area?.name ?? partner.zone?.name ?? partner.territory?.name ?? 'Unassigned'}</div>
                  <div className="text-muted small mt-2">Territory: {partner.territory?.name ?? 'N/A'}</div>
                </div>
              </div>
            </div>

            {/* Quick Details Table */}
            <div className="row g-4">
              <div className="col-md-6">
                <div className="border rounded p-3">
                  <h6 className="fw-bold mb-3 border-bottom pb-2">Primary Contact Information</h6>
                  <div className="d-flex flex-column gap-2" style={{ fontSize: '0.9rem' }}>
                    <div className="d-flex justify-content-between">
                      <span className="text-muted">Contact Person:</span>
                      <span className="fw-medium">{partner.contact_person || 'N/A'}</span>
                    </div>
                    <div className="d-flex justify-content-between">
                      <span className="text-muted">Phone Number:</span>
                      <span className="fw-medium">{partner.contact_number || 'N/A'}</span>
                    </div>
                    <div className="d-flex justify-content-between">
                      <span className="text-muted">Email Address:</span>
                      <span className="fw-medium">{partner.email || 'N/A'}</span>
                    </div>
                    <div className="d-flex justify-content-between">
                      <span className="text-muted">Office Address:</span>
                      <span className="fw-medium">{partner.address || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-md-6">
                <div className="border rounded p-3">
                  <h6 className="fw-bold mb-3 border-bottom pb-2">Relationship & Account Managers</h6>
                  <div className="d-flex flex-column gap-2" style={{ fontSize: '0.9rem' }}>
                    <div className="d-flex justify-content-between">
                      <span className="text-muted">Account Manager:</span>
                      <span className="fw-medium text-primary">{partner.account_manager?.name || 'Unassigned'}</span>
                    </div>
                    <div className="d-flex justify-content-between">
                      <span className="text-muted">Relationship Manager:</span>
                      <span className="fw-medium">{partner.relationship_manager?.name || 'Unassigned'}</span>
                    </div>
                    <div className="d-flex justify-content-between">
                      <span className="text-muted">Territory:</span>
                      <span className="fw-medium">{partner.territory?.name || 'N/A'}</span>
                    </div>
                    <div className="d-flex justify-content-between">
                      <span className="text-muted">Zone / Area:</span>
                      <span className="fw-medium">{partner.zone?.name} / {partner.area?.name}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: BUSINESS INFO */}
        {activeTab === 'business' && (
          <div>
            <h5 className="fw-bold mb-3 text-primary">Business & Legal Credentials</h5>
            <div className="row g-3" style={{ fontSize: '0.9rem' }}>
              <div className="col-md-6">
                <div className="p-3 border rounded">
                  <div className="text-muted small">Legal Registered Name</div>
                  <div className="fw-medium">{partner.legal_name || 'N/A'}</div>
                </div>
              </div>
              <div className="col-md-6">
                <div className="p-3 border rounded">
                  <div className="text-muted small">Business / DBA Name</div>
                  <div className="fw-medium">{partner.business_name || 'N/A'}</div>
                </div>
              </div>
              <div className="col-md-6">
                <div className="p-3 border rounded">
                  <div className="text-muted small">Contract Type</div>
                  <div className="fw-medium">{profile.contract_type || 'Standard'}</div>
                </div>
              </div>
              <div className="col-md-6">
                <div className="p-3 border rounded">
                  <div className="text-muted small">Contract Validity</div>
                  <div className="fw-medium">
                    {profile.contract_start_date ? `${profile.contract_start_date} to ${profile.contract_end_date || 'Indefinite'}` : 'N/A'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: BUSINESS MODELS */}
        {activeTab === 'models' && (
          <div>
            <h5 className="fw-bold mb-3 text-primary">Assigned Partner Business Models</h5>
            <div className="row g-3">
              {businessModels.map((bm) => (
                <div key={bm.id} className="col-md-6">
                  <div className="p-3 border rounded bg-light">
                    <h6 className="fw-bold text-dark mb-1">{bm.name}</h6>
                    <p className="text-muted small mb-0">{bm.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* OTHER TABS PLACEHOLDERS */}
        {!['overview', 'business', 'models'].includes(activeTab) && (
          <div className="text-center py-5">
            <Layers size={40} className="text-primary opacity-50 mb-2" />
            <h6 className="fw-bold text-dark">{TABS.find(t => t.id === activeTab)?.label} Section</h6>
            <p className="text-muted small mb-0" style={{ maxWidth: 450, margin: '0 auto' }}>
              This domain section will automatically populate as live transactions (Bandwidth, Equipment, Commission, Financial P&L) are recorded in subsequent phases.
            </p>
          </div>
        )}
      </div>

      {/* Status & Approval Modal */}
      <StatusActionModal
        isOpen={modalState.isOpen}
        mode={modalState.mode}
        partner={partner}
        onClose={() => setModalState((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  )
}
