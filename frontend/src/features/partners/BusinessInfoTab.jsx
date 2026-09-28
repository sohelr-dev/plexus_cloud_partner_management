import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Building2,
  Briefcase,
  Calendar,
  CreditCard,
  DollarSign,
  FileText,
  MapPin,
  ShieldCheck,
  User,
  Users,
  Edit,
  Clock,
  CheckCircle,
  AlertCircle,
  Percent,
  Layers,
  Phone,
  Mail,
  Loader2,
  X,
  Save,
} from 'lucide-react'
import api from '../../api/client'
import { usePermissions } from '../../context/PermissionContext'

export default function BusinessInfoTab({ partner }) {
  const queryClient = useQueryClient()
  const { can } = usePermissions()
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [errorMsg, setErrorMsg] = useState(null)

  const profile = partner.profile || {}
  const accountManager = partner.account_manager
  const relationshipManager = partner.relationship_manager
  const territory = partner.territory
  const zone = partner.zone
  const area = partner.area
  const businessModels = partner.business_models || []

  // Fetch Lookups for editing
  const { data: lookups } = useQuery({
    queryKey: ['partner-lookups'],
    queryFn: async () => {
      const res = await api.get('/partners/lookups')
      return res.data
    },
    enabled: isEditModalOpen,
  })

  // Edit form state
  const [formData, setFormData] = useState({
    partner_name: '',
    legal_name: '',
    business_name: '',
    partner_type: '',
    partner_category: '',
    contact_person: '',
    contact_number: '',
    email: '',
    address: '',
    territory_id: '',
    zone_id: '',
    area_id: '',
    account_manager_id: '',
    relationship_manager_id: '',
    profile: {
      business_type: '',
      business_category: '',
      operating_area: '',
      contract_type: 'Standard',
      contract_start_date: '',
      contract_end_date: '',
      payment_terms: 'Net 30',
      credit_limit: 0,
      credit_days: 30,
      security_deposit: 0,
      billing_cycle: 'Monthly',
      pricing_model: '',
      discount_policy: '',
      commission_model: '',
      notes: '',
    },
  })

  const openEditModal = () => {
    setFormData({
      partner_name: partner.partner_name || '',
      legal_name: partner.legal_name || '',
      business_name: partner.business_name || '',
      partner_type: partner.partner_type || 'ISP',
      partner_category: partner.partner_category || 'A',
      contact_person: partner.contact_person || '',
      contact_number: partner.contact_number || '',
      email: partner.email || '',
      address: partner.address || '',
      territory_id: partner.territory_id || '',
      zone_id: partner.zone_id || '',
      area_id: partner.area_id || '',
      account_manager_id: partner.account_manager_id || '',
      relationship_manager_id: partner.relationship_manager_id || '',
      profile: {
        business_type: profile.business_type || '',
        business_category: profile.business_category || '',
        operating_area: profile.operating_area || '',
        contract_type: profile.contract_type || 'Standard',
        contract_start_date: profile.contract_start_date || '',
        contract_end_date: profile.contract_end_date || '',
        payment_terms: profile.payment_terms || 'Net 30',
        credit_limit: profile.credit_limit || 0,
        credit_days: profile.credit_days ?? 30,
        security_deposit: profile.security_deposit || 0,
        billing_cycle: profile.billing_cycle || 'Monthly',
        pricing_model: profile.pricing_model || '',
        discount_policy: profile.discount_policy || '',
        commission_model: profile.commission_model || '',
        notes: profile.notes || '',
      },
    })
    setErrorMsg(null)
    setIsEditModalOpen(true)
  }

  const updateMutation = useMutation({
    mutationFn: async (payload) => {
      const cleanPayload = {
        ...payload,
        territory_id: payload.territory_id ? Number(payload.territory_id) : null,
        zone_id: payload.zone_id ? Number(payload.zone_id) : null,
        area_id: payload.area_id ? Number(payload.area_id) : null,
        account_manager_id: payload.account_manager_id ? Number(payload.account_manager_id) : null,
        relationship_manager_id: payload.relationship_manager_id ? Number(payload.relationship_manager_id) : null,
        profile: {
          ...payload.profile,
          credit_limit: Number(payload.profile.credit_limit) || 0,
          credit_days: Number(payload.profile.credit_days) || 0,
          security_deposit: Number(payload.profile.security_deposit) || 0,
        },
      }
      const res = await api.put(`/partners/${partner.id}`, cleanPayload)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['partner', String(partner.id)])
      queryClient.invalidateQueries(['partners'])
      setIsEditModalOpen(false)
    },
    onError: (err) => {
      setErrorMsg(
        err?.response?.data?.message ||
          Object.values(err?.response?.data?.errors || {})[0]?.[0] ||
          'Failed to update partner business details'
      )
    },
  })

  const handleFormChange = (e) => {
    const { name, value } = e.target
    if (name.startsWith('profile.')) {
      const field = name.split('.')[1]
      setFormData((prev) => ({
        ...prev,
        profile: { ...prev.profile, [field]: value },
      }))
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }))
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setErrorMsg(null)
    updateMutation.mutate(formData)
  }

  // Calculate contract status
  const today = new Date().toISOString().split('T')[0]
  const isContractActive =
    profile.contract_start_date &&
    (!profile.contract_end_date || profile.contract_end_date >= today)
  const isContractExpired = profile.contract_end_date && profile.contract_end_date < today

  return (
    <div className="space-y-4">
      {/* Top Banner & Quick Actions */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 p-3 bg-light rounded-3 border">
        <div>
          <h5 className="fw-bold text-dark mb-1 d-flex align-items-center gap-2">
            <Building2 className="text-primary" size={22} />
            Business Information & Commercial Terms
          </h5>
          <p className="text-muted small mb-0">
            Comprehensive business profile, contract specifications, hierarchy, and financial .
          </p>
        </div>
        <div className="d-flex align-items-center gap-2">
          {can('edit_partner') && (
            <button
              onClick={openEditModal}
              className="btn btn-primary d-flex align-items-center gap-1.5 px-3 py-2 text-white shadow-sm"
              style={{ fontSize: '0.875rem', borderRadius: '6px' }}
            >
              <Edit size={16} /> Edit Business Info
            </button>
          )}
        </div>
      </div>

      {/* Grid of Sections */}
      <div className="row g-4 mt-1">
        {/* SECTION 1: Business Identity & Classification */}
        <div className="col-12 col-lg-6">
          <div className="card h-100 border shadow-sm rounded-3">
            <div className="card-header bg-white border-bottom py-3 d-flex align-items-center justify-content-between">
              <span className="fw-bold text-dark d-flex align-items-center gap-2">
                <Briefcase size={18} className="text-primary" />
                1. Business Identity & Type
              </span>
              <span className="badge bg-primary-subtle text-primary border border-primary-subtle px-2.5 py-1">
                {partner.partner_type || 'N/A'}
              </span>
            </div>
            <div className="card-body p-3">
              <div className="table-responsive">
                <table className="table table-sm table-borderless align-middle mb-0">
                  <tbody>
                    <tr>
                      <td className="text-muted" style={{ width: '40%' }}>Partner Code:</td>
                      <td className="fw-bold text-primary font-monospace">{partner.partner_code || '—'}</td>
                    </tr>
                    <tr>
                      <td className="text-muted">Business Brand Name:</td>
                      <td className="fw-semibold text-dark">{partner.business_name || partner.partner_name || '—'}</td>
                    </tr>
                    <tr>
                      <td className="text-muted">Legal Registered Name:</td>
                      <td className="fw-semibold text-dark">{partner.legal_name || '—'}</td>
                    </tr>
                    <tr>
                      <td className="text-muted">Business Type:</td>
                      <td>
                        <span className="badge bg-secondary-subtle text-secondary px-2 py-1">
                          {profile.business_type || partner.partner_type || 'General'}
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td className="text-muted">Business Category / Tier:</td>
                      <td>
                        <span className="badge bg-info-subtle text-info border border-info-subtle px-2.5 py-1 fw-bold">
                          Tier {partner.partner_category || profile.business_category || 'Standard'}
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td className="text-muted">Partner Since:</td>
                      <td className="text-dark">
                        {partner.partner_since ? (
                          <span className="d-flex align-items-center gap-1">
                            <Calendar size={14} className="text-muted" />
                            {new Date(partner.partner_since).toLocaleDateString()}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                    </tr>
                    <tr>
                      <td className="text-muted">Lifecycle Status:</td>
                      <td>
                        <span className="badge bg-success-subtle text-success border border-success-subtle px-2 py-1">
                          {partner.status || 'Active'}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 2: Geographic & Operational Coverage */}
        <div className="col-12 col-lg-6">
          <div className="card h-100 border shadow-sm rounded-3">
            <div className="card-header bg-white border-bottom py-3 d-flex align-items-center justify-content-between">
              <span className="fw-bold text-dark d-flex align-items-center gap-2">
                <MapPin size={18} className="text-danger" />
                2. Operational Territory & Coverage
              </span>
            </div>
            <div className="card-body p-3">
              <div className="table-responsive">
                <table className="table table-sm table-borderless align-middle mb-0">
                  <tbody>
                    <tr>
                      <td className="text-muted" style={{ width: '40%' }}>Operating Area:</td>
                      <td className="fw-semibold text-dark">
                        {profile.operating_area || area?.name || 'Default Operating Zone'}
                      </td>
                    </tr>
                    <tr>
                      <td className="text-muted">Assigned Zone:</td>
                      <td className="fw-semibold text-dark">
                        {zone?.name ? (
                          <span className="badge bg-warning-subtle text-warning-emphasis px-2 py-1">
                            {zone.name}
                          </span>
                        ) : (
                          <span className="text-muted fst-italic">Not Assigned</span>
                        )}
                      </td>
                    </tr>
                    <tr>
                      <td className="text-muted">Territory:</td>
                      <td className="fw-semibold text-dark">
                        {territory?.name ? (
                          <span className="badge bg-primary-subtle text-primary px-2 py-1">
                            {territory.name}
                          </span>
                        ) : (
                          <span className="text-muted fst-italic">Not Assigned</span>
                        )}
                      </td>
                    </tr>
                    <tr>
                      <td className="text-muted">Contact Person:</td>
                      <td className="fw-semibold text-dark">
                        {partner.contact_person || '—'}
                      </td>
                    </tr>
                    <tr>
                      <td className="text-muted">Contact Phone:</td>
                      <td>
                        {partner.contact_number ? (
                          <span className="d-flex align-items-center gap-1 text-dark">
                            <Phone size={14} className="text-muted" />
                            {partner.contact_number}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                    </tr>
                    <tr>
                      <td className="text-muted">Contact Email:</td>
                      <td>
                        {partner.email ? (
                          <span className="d-flex align-items-center gap-1 text-dark">
                            <Mail size={14} className="text-muted" />
                            {partner.email}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                    </tr>
                    <tr>
                      <td className="text-muted">Registered Address:</td>
                      <td className="text-dark small">{partner.address || '—'}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 3: Partner Relationship Management */}
        <div className="col-12 col-lg-6">
          <div className="card h-100 border shadow-sm rounded-3">
            <div className="card-header bg-white border-bottom py-3 d-flex align-items-center justify-content-between">
              <span className="fw-bold text-dark d-flex align-items-center gap-2">
                <Users size={18} className="text-info" />
                3. Relationship Management
              </span>
              <span className="badge bg-info-subtle text-info">Accounts & Leads</span>
            </div>
            <div className="card-body p-3">
              <div className="row g-3">
                <div className="col-12 col-sm-6">
                  <div className="p-3 bg-light rounded-3 border">
                    <div className="d-flex align-items-center gap-2 mb-2 text-primary fw-semibold small">
                      <User size={16} /> Account Manager (AM)
                    </div>
                    {accountManager ? (
                      <div>
                        <div className="fw-bold text-dark">{accountManager.name}</div>
                        <div className="text-muted small">{accountManager.email}</div>
                        <span className="badge bg-success-subtle text-success mt-2" style={{ fontSize: '0.7rem' }}>
                          Primary Liaison
                        </span>
                      </div>
                    ) : (
                      <div className="text-muted small fst-italic py-2">
                        No Account Manager assigned yet.
                      </div>
                    )}
                  </div>
                </div>

                <div className="col-12 col-sm-6">
                  <div className="p-3 bg-light rounded-3 border">
                    <div className="d-flex align-items-center gap-2 mb-2 text-success fw-semibold small">
                      <ShieldCheck size={16} /> Relationship Manager (RM)
                    </div>
                    {relationshipManager ? (
                      <div>
                        <div className="fw-bold text-dark">{relationshipManager.name}</div>
                        <div className="text-muted small">{relationshipManager.email}</div>
                        <span className="badge bg-info-subtle text-info mt-2" style={{ fontSize: '0.7rem' }}>
                          Strategic Partner Lead
                        </span>
                      </div>
                    ) : (
                      <div className="text-muted small fst-italic py-2">
                        No Relationship Manager assigned yet.
                      </div>
                    )}
                  </div>
                </div>

                <div className="col-12">
                  <div className="p-2.5 bg-light-subtle rounded border text-muted small d-flex align-items-center justify-content-between">
                    <span>Relationship Governance Status:</span>
                    <span className="badge bg-success text-white">Active Engagement</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 4: Commercial Contract & Tenor */}
        <div className="col-12 col-lg-6">
          <div className="card h-100 border shadow-sm rounded-3">
            <div className="card-header bg-white border-bottom py-3 d-flex align-items-center justify-content-between">
              <span className="fw-bold text-dark d-flex align-items-center gap-2">
                <FileText size={18} className="text-warning" />
                4. Contract & Commercial Tenor
              </span>
              {isContractActive ? (
                <span className="badge bg-success-subtle text-success border border-success-subtle">
                  Contract Active
                </span>
              ) : isContractExpired ? (
                <span className="badge bg-danger-subtle text-danger border border-danger-subtle">
                  Contract Expired
                </span>
              ) : (
                <span className="badge bg-secondary-subtle text-secondary">No End Date</span>
              )}
            </div>
            <div className="card-body p-3">
              <div className="table-responsive">
                <table className="table table-sm table-borderless align-middle mb-0">
                  <tbody>
                    <tr>
                      <td className="text-muted" style={{ width: '40%' }}>Contract Type:</td>
                      <td className="fw-semibold text-dark">
                        <span className="badge bg-dark text-white px-2 py-1">
                          {profile.contract_type || 'Standard Agreement'}
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td className="text-muted">Contract Start Date:</td>
                      <td className="fw-semibold text-dark">
                        {profile.contract_start_date ? (
                          <span className="d-flex align-items-center gap-1">
                            <Clock size={14} className="text-success" />
                            {new Date(profile.contract_start_date).toLocaleDateString()}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                    </tr>
                    <tr>
                      <td className="text-muted">Contract End Date:</td>
                      <td className="fw-semibold text-dark">
                        {profile.contract_end_date ? (
                          <span className="d-flex align-items-center gap-1">
                            <Clock size={14} className="text-danger" />
                            {new Date(profile.contract_end_date).toLocaleDateString()}
                          </span>
                        ) : (
                          <span className="text-muted fst-italic">Open-ended / Auto-renew</span>
                        )}
                      </td>
                    </tr>
                    <tr>
                      <td className="text-muted">Pricing Model:</td>
                      <td className="text-dark fw-semibold">
                        {profile.pricing_model || 'Tier-based / Wholesale Standard'}
                      </td>
                    </tr>
                    <tr>
                      <td className="text-muted">Discount Policy:</td>
                      <td className="text-dark">
                        {profile.discount_policy || 'Standard Volume Discount Schedule'}
                      </td>
                    </tr>
                    <tr>
                      <td className="text-muted">Commission Model:</td>
                      <td className="text-dark">
                        {profile.commission_model || 'Configurable Partner Rules'}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 5: Financial Terms, Credit Limit & Security Deposit  */}
        <div className="col-12">
          <div className="card border shadow-sm rounded-3">
            <div className="card-header bg-white border-bottom py-3 d-flex align-items-center justify-content-between">
              <span className="fw-bold text-dark d-flex align-items-center gap-2">
                <CreditCard size={18} className="text-success" />
                5. Financial Governance, Payment Terms & Credit Limits
              </span>
            </div>
            <div className="card-body p-4">
              <div className="row g-4">
                <div className="col-12 col-md-3">
                  <div className="p-3 bg-light rounded-3 border text-center">
                    <span className="text-muted small fw-medium">Payment Terms</span>
                    <h5 className="fw-bold text-dark mt-2 mb-1">{profile.payment_terms || 'Net 30'}</h5>
                    <span className="badge bg-secondary-subtle text-secondary small">Repayment cycle</span>
                  </div>
                </div>

                <div className="col-12 col-md-3">
                  <div className="p-3 bg-light rounded-3 border text-center">
                    <span className="text-muted small fw-medium">Credit Limit</span>
                    <h5 className="fw-bold text-primary mt-2 mb-1">
                      ৳{Number(profile.credit_limit || 0).toLocaleString()}
                    </h5>
                    <span className="badge bg-primary-subtle text-primary small">Approved ceiling</span>
                  </div>
                </div>

                <div className="col-12 col-md-3">
                  <div className="p-3 bg-light rounded-3 border text-center">
                    <span className="text-muted small fw-medium">Credit Grace Days</span>
                    <h5 className="fw-bold text-info mt-2 mb-1">{profile.credit_days ?? 30} Days</h5>
                    <span className="badge bg-info-subtle text-info small">From invoice date</span>
                  </div>
                </div>

                <div className="col-12 col-md-3">
                  <div className="p-3 bg-light rounded-3 border text-center">
                    <span className="text-muted small fw-medium">Security Deposit</span>
                    <h5 className="fw-bold text-success mt-2 mb-1">
                      ৳{Number(profile.security_deposit || 0).toLocaleString()}
                    </h5>
                    <span className="badge bg-success-subtle text-success small">Deposit held</span>
                  </div>
                </div>

                <div className="col-12 col-md-6">
                  <div className="p-3 bg-light rounded-3 border">
                    <span className="text-muted small fw-semibold d-block mb-1">Billing Cycle Specification</span>
                    <div className="d-flex align-items-center gap-2">
                      <span className="badge bg-dark px-3 py-1.5 fs-7">{profile.billing_cycle || 'Monthly'}</span>
                      <span className="text-muted small">Invoicing generated automatically at end of period</span>
                    </div>
                  </div>
                </div>

                <div className="col-12 col-md-6">
                  <div className="p-3 bg-light rounded-3 border">
                    <span className="text-muted small fw-semibold d-block mb-1">Commercial Special Notes</span>
                    <p className="text-dark small mb-0 fst-italic">
                      {profile.notes || 'No special terms or commercial riders attached.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Business Info Modal */}
      {isEditModalOpen && (
        <div
          className="modal show d-block"
          tabIndex="-1"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}
        >
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content shadow-lg border-0 rounded-3">
              <div className="modal-header bg-light border-bottom py-3">
                <h5 className="modal-title fw-bold text-dark d-flex align-items-center gap-2">
                  <Edit size={18} className="text-primary" /> Edit Business Information & Commercials
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setIsEditModalOpen(false)}
                />
              </div>

              <form onSubmit={handleSubmit}>
                <div className="modal-body p-4" style={{ maxHeight: '75vh', overflowY: 'auto' }}>
                  {errorMsg && (
                    <div className="alert alert-danger d-flex align-items-center gap-2 py-2 mb-3">
                      <AlertCircle size={18} />
                      <span className="small">{errorMsg}</span>
                    </div>
                  )}

                  {/* Section A: Business Identity */}
                  <h6 className="fw-bold text-primary mb-3 pb-2 border-bottom">
                    1. Business Identity
                  </h6>
                  <div className="row g-3 mb-4">
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold">Business Brand Name</label>
                      <input
                        type="text"
                        name="business_name"
                        className="form-control form-control-sm"
                        value={formData.business_name}
                        onChange={handleFormChange}
                        placeholder="e.g. Dhaka Broadband Ltd."
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold">Legal Registered Name</label>
                      <input
                        type="text"
                        name="legal_name"
                        className="form-control form-control-sm"
                        value={formData.legal_name}
                        onChange={handleFormChange}
                        placeholder="Registered commercial entity name"
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label small fw-semibold">Partner Type</label>
                      <select
                        name="partner_type"
                        className="form-select form-select-sm"
                        value={formData.partner_type}
                        onChange={handleFormChange}
                      >
                        <option value="ISP">ISP</option>
                        <option value="Reseller">Reseller</option>
                        <option value="Distributor">Distributor</option>
                        <option value="Corporate">Corporate</option>
                        <option value="Individual">Individual</option>
                      </select>
                    </div>
                    <div className="col-md-4">
                      <label className="form-label small fw-semibold">Partner Category (Tier)</label>
                      <select
                        name="partner_category"
                        className="form-select form-select-sm"
                        value={formData.partner_category}
                        onChange={handleFormChange}
                      >
                        <option value="A">Tier A (Enterprise / Prime)</option>
                        <option value="B">Tier B (Standard)</option>
                        <option value="C">Tier C (Developing)</option>
                        <option value="D">Tier D (Micro)</option>
                      </select>
                    </div>
                    <div className="col-md-4">
                      <label className="form-label small fw-semibold">Operating Area</label>
                      <input
                        type="text"
                        name="profile.operating_area"
                        className="form-control form-control-sm"
                        value={formData.profile.operating_area}
                        onChange={handleFormChange}
                        placeholder="e.g. Dhanmondi, Gulshan"
                      />
                    </div>
                  </div>

                  {/* Section B: Hierarchy & Managers */}
                  <h6 className="fw-bold text-primary mb-3 pb-2 border-bottom">
                    2. Hierarchy & Account Management
                  </h6>
                  <div className="row g-3 mb-4">
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold">Account Manager</label>
                      <select
                        name="account_manager_id"
                        className="form-select form-select-sm"
                        value={formData.account_manager_id}
                        onChange={handleFormChange}
                      >
                        <option value="">-- Unassigned --</option>
                        {lookups?.account_managers?.map((am) => (
                          <option key={am.id} value={am.id}>
                            {am.name} ({am.email})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold">Relationship Manager</label>
                      <select
                        name="relationship_manager_id"
                        className="form-select form-select-sm"
                        value={formData.relationship_manager_id}
                        onChange={handleFormChange}
                      >
                        <option value="">-- Unassigned --</option>
                        {lookups?.account_managers?.map((am) => (
                          <option key={am.id} value={am.id}>
                            {am.name} ({am.email})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Section C: Contract & Commercial Tenor */}
                  <h6 className="fw-bold text-primary mb-3 pb-2 border-bottom">
                    3. Contract & Commercial Tenor
                  </h6>
                  <div className="row g-3 mb-4">
                    <div className="col-md-4">
                      <label className="form-label small fw-semibold">Contract Type</label>
                      <select
                        name="profile.contract_type"
                        className="form-select form-select-sm"
                        value={formData.profile.contract_type}
                        onChange={handleFormChange}
                      >
                        <option value="Standard">Standard</option>
                        <option value="Enterprise SLA">Enterprise SLA</option>
                        <option value="Custom Agreement">Custom Agreement</option>
                        <option value="Trial / Pilot">Trial / Pilot</option>
                      </select>
                    </div>
                    <div className="col-md-4">
                      <label className="form-label small fw-semibold">Contract Start Date</label>
                      <input
                        type="date"
                        name="profile.contract_start_date"
                        className="form-control form-control-sm"
                        value={formData.profile.contract_start_date}
                        onChange={handleFormChange}
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label small fw-semibold">Contract End Date</label>
                      <input
                        type="date"
                        name="profile.contract_end_date"
                        className="form-control form-control-sm"
                        value={formData.profile.contract_end_date}
                        onChange={handleFormChange}
                      />
                    </div>
                  </div>

                  {/* Section D: Financial Terms & Credit */}
                  <h6 className="fw-bold text-primary mb-3 pb-2 border-bottom">
                    4. Financial Terms & Governance
                  </h6>
                  <div className="row g-3 mb-4">
                    <div className="col-md-3">
                      <label className="form-label small fw-semibold">Payment Terms</label>
                      <select
                        name="profile.payment_terms"
                        className="form-select form-select-sm"
                        value={formData.profile.payment_terms}
                        onChange={handleFormChange}
                      >
                        <option value="Advance">Advance</option>
                        <option value="Net 7">Net 7</option>
                        <option value="Net 15">Net 15</option>
                        <option value="Net 30">Net 30</option>
                        <option value="Net 60">Net 60</option>
                      </select>
                    </div>
                    <div className="col-md-3">
                      <label className="form-label small fw-semibold">Credit Limit (৳)</label>
                      <input
                        type="number"
                        min="0"
                        name="profile.credit_limit"
                        className="form-control form-control-sm"
                        value={formData.profile.credit_limit}
                        onChange={handleFormChange}
                      />
                    </div>
                    <div className="col-md-3">
                      <label className="form-label small fw-semibold">Credit Days</label>
                      <input
                        type="number"
                        min="0"
                        name="profile.credit_days"
                        className="form-control form-control-sm"
                        value={formData.profile.credit_days}
                        onChange={handleFormChange}
                      />
                    </div>
                    <div className="col-md-3">
                      <label className="form-label small fw-semibold">Security Deposit (৳)</label>
                      <input
                        type="number"
                        min="0"
                        name="profile.security_deposit"
                        className="form-control form-control-sm"
                        value={formData.profile.security_deposit}
                        onChange={handleFormChange}
                      />
                    </div>

                    <div className="col-md-4">
                      <label className="form-label small fw-semibold">Billing Cycle</label>
                      <select
                        name="profile.billing_cycle"
                        className="form-select form-select-sm"
                        value={formData.profile.billing_cycle}
                        onChange={handleFormChange}
                      >
                        <option value="Monthly">Monthly</option>
                        <option value="Quarterly">Quarterly</option>
                        <option value="Half-Yearly">Half-Yearly</option>
                        <option value="Yearly">Yearly</option>
                      </select>
                    </div>
                    <div className="col-md-4">
                      <label className="form-label small fw-semibold">Pricing Model</label>
                      <input
                        type="text"
                        name="profile.pricing_model"
                        className="form-control form-control-sm"
                        value={formData.profile.pricing_model}
                        onChange={handleFormChange}
                        placeholder="e.g. Standard Tiered"
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label small fw-semibold">Commission Model</label>
                      <input
                        type="text"
                        name="profile.commission_model"
                        className="form-control form-control-sm"
                        value={formData.profile.commission_model}
                        onChange={handleFormChange}
                        placeholder="e.g. RevShare 10%"
                      />
                    </div>

                    <div className="col-12">
                      <label className="form-label small fw-semibold">Commercial Notes</label>
                      <textarea
                        name="profile.notes"
                        rows="2"
                        className="form-control form-control-sm"
                        value={formData.profile.notes}
                        onChange={handleFormChange}
                        placeholder="Any special remarks or stipulations..."
                      />
                    </div>
                  </div>
                </div>

                <div className="modal-footer bg-light border-top py-2">
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setIsEditModalOpen(false)}
                    disabled={updateMutation.isPending}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary btn-sm d-flex align-items-center gap-1.5 px-3"
                    disabled={updateMutation.isPending}
                  >
                    {updateMutation.isPending ? (
                      <>
                        <Loader2 size={14} className="spin" /> Saving...
                      </>
                    ) : (
                      <>
                        <Save size={14} /> Save Changes
                      </>
                    )}
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
