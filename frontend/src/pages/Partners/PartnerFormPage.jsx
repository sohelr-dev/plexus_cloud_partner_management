import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft,
  ArrowRight,
  Save,
  Check,
  Building,
  Briefcase,
  Layers,
  CreditCard,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Globe,
  DollarSign,
  Smartphone,
  Store
} from 'lucide-react'
import api from '../../api/client'

const STEPS = [
  { id: 1, title: 'Basic Info', icon: Building, desc: 'Partner identity & contact' },
  { id: 2, title: 'Business Models', icon: Layers, desc: 'Assign business models' },
  { id: 3, title: 'Commercials', icon: CreditCard, desc: 'Payment & contract terms' },
  { id: 4, title: 'Location & Manager', icon: MapPin, desc: 'Territory & account lead' },
  { id: 5, title: 'Review & Submit', icon: CheckCircle2, desc: 'Verify & finalize' },
]

export default function PartnerFormPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [currentStep, setCurrentStep] = useState(1)
  const [error, setError] = useState(null)

  // Fetch Lookups (Business Models, Areas, Zones, Territories, Account Managers)
  const { data: lookups, isLoading: loadingLookups } = useQuery({
    queryKey: ['partner-lookups'],
    queryFn: async () => {
      const res = await api.get('/partners/lookups')
      return res.data
    },
  })

  // Form State
  const [formData, setFormData] = useState({
    // Step 1: Basic Info
    partner_name: '',
    legal_name: '',
    business_name: '',
    partner_type: 'ISP',
    partner_category: 'A',
    contact_person: '',
    contact_number: '',
    email: '',
    address: '',

    // Step 2: Business Models (array of IDs)
    business_model_ids: [],

    // Step 3: Profile (Commercials)
    profile: {
      business_type: '',
      contract_type: 'Standard',
      contract_start_date: new Date().toISOString().split('T')[0],
      contract_end_date: '',
      payment_terms: 'Net 30',
      credit_limit: 0,
      credit_days: 30,
      security_deposit: 0,
      billing_cycle: 'Monthly',
      notes: '',
    },

    // Step 4: Location & Manager
    territory_id: '',
    zone_id: '',
    area_id: '',
    account_manager_id: '',
    relationship_manager_id: '',
    status: 'Pending Approval',
  })

  // Pre-select first business model when lookups load if empty
  useEffect(() => {
    if (lookups?.business_models?.length > 0 && formData.business_model_ids.length === 0) {
      setFormData((prev) => ({
        ...prev,
        business_model_ids: [lookups.business_models[0].id],
      }))
    }
  }, [lookups])

  // Submit Mutation
  const { mutate, isPending } = useMutation({
    mutationFn: async (data) => {
      // Clean empty string IDs to null
      const payload = {
        ...data,
        territory_id: data.territory_id ? Number(data.territory_id) : null,
        zone_id: data.zone_id ? Number(data.zone_id) : null,
        area_id: data.area_id ? Number(data.area_id) : null,
        account_manager_id: data.account_manager_id ? Number(data.account_manager_id) : null,
        relationship_manager_id: data.relationship_manager_id ? Number(data.relationship_manager_id) : null,
      }
      const res = await api.post('/partners', payload)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['partners'])
      navigate('/partners')
    },
    onError: (err) => {
      setError(
        err?.response?.data?.message ??
          Object.values(err?.response?.data?.errors ?? {})[0]?.[0] ??
          'Failed to create partner'
      )
    },
  })

  // Handlers
  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleProfileChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      profile: { ...prev.profile, [field]: value },
    }))
  }

  const toggleBusinessModel = (modelId) => {
    setFormData((prev) => {
      const exists = prev.business_model_ids.includes(modelId)
      return {
        ...prev,
        business_model_ids: exists
          ? prev.business_model_ids.filter((id) => id !== modelId)
          : [...prev.business_model_ids, modelId],
      }
    })
  }

  // Step Validation
  const validateStep = (step) => {
    if (step === 1) {
      if (!formData.partner_name.trim()) return 'Partner Name is required.'
      if (!formData.partner_type) return 'Partner Type is required.'
    }
    if (step === 2) {
      if (formData.business_model_ids.length === 0) {
        return 'Please select at least one Business Model.'
      }
    }
    return null
  }

  const handleNext = () => {
    setError(null)
    const err = validateStep(currentStep)
    if (err) {
      setError(err)
      return
    }
    setCurrentStep((prev) => Math.min(prev + 1, 5))
  }

  const handleBack = () => {
    setError(null)
    setCurrentStep((prev) => Math.max(prev - 1, 1))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setError(null)
    const err = validateStep(currentStep)
    if (err) {
      setError(err)
      return
    }
    mutate(formData)
  }

  // Helper icons for Business Model Cards
  const getModelIcon = (name) => {
    if (name.includes('Bandwidth')) return Globe
    if (name.includes('Commission')) return DollarSign
    if (name.includes('End Device')) return Smartphone
    return Store
  }

  return (
    <div className="pm-page">
      {/* Page Header */}
      <div className="pm-page-header mb-4">
        <div>
          <button
            onClick={() => navigate('/partners')}
            className="btn btn-link text-decoration-none p-0 mb-2 d-flex align-items-center gap-1 text-secondary"
            style={{ fontSize: '0.85rem' }}
          >
            <ArrowLeft size={16} /> Back to Directory
          </button>
          <h1 className="pm-page-title">New Partner Registration Wizard</h1>
          <p className="pm-page-subtitle">Multi-step partner setup & business model assignment.</p>
        </div>
      </div>

      {/* Stepper Header */}
      <div className="pm-card mb-4 p-3">
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
          {STEPS.map((step) => {
            const Icon = step.icon
            const isActive = currentStep === step.id
            const isCompleted = currentStep > step.id
            return (
              <div
                key={step.id}
                className="d-flex align-items-center gap-2 cursor-pointer"
                onClick={() => {
                  if (step.id < currentStep) setCurrentStep(step.id)
                }}
                style={{ flex: '1 1 150px' }}
              >
                <div
                  className={`rounded-circle d-flex align-items-center justify-content-center fw-bold transition-all ${
                    isCompleted
                      ? 'bg-success text-white'
                      : isActive
                      ? 'bg-primary text-white shadow-sm'
                      : 'bg-light text-muted border'
                  }`}
                  style={{ width: 38, height: 38, fontSize: '0.9rem' }}
                >
                  {isCompleted ? <Check size={18} /> : <Icon size={18} />}
                </div>
                <div>
                  <div
                    className={`fw-semibold text-nowrap style-sm ${
                      isActive ? 'text-primary' : isCompleted ? 'text-dark' : 'text-muted'
                    }`}
                    style={{ fontSize: '0.85rem' }}
                  >
                    Step {step.id}: {step.title}
                  </div>
                  <div className="text-muted d-none d-lg-block" style={{ fontSize: '0.75rem' }}>
                    {step.desc}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Error Alert Box */}
      {error && (
        <div className="pm-error-box p-3 mb-4 rounded bg-danger-subtle text-danger border border-danger-subtle d-flex align-items-center gap-2">
          <AlertCircle size={20} className="flex-shrink-0" />
          <div style={{ fontSize: '0.9rem' }}>{error}</div>
        </div>
      )}

      {/* Main Wizard Form Card */}
      <div className="pm-card p-4 mx-auto" style={{ maxWidth: 850 }}>
        <form onSubmit={handleSubmit}>
          {/* STEP 1: BASIC & CONTACT INFO */}
          {currentStep === 1 && (
            <div>
              <h5 className="fw-bold mb-1 d-flex align-items-center gap-2">
                <Building className="text-primary" size={20} /> Step 1: Partner Identity & Contact
              </h5>
              <p className="text-muted mb-4" style={{ fontSize: '0.85rem' }}>
                Enter legal, trade, and primary point-of-contact information.
              </p>

              <div className="row g-3">
                <div className="col-md-8">
                  <label className="form-label fw-medium">Partner Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Apex Telecom Ltd"
                    value={formData.partner_name}
                    onChange={(e) => handleInputChange('partner_name', e.target.value)}
                    required
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label fw-medium">Partner Type *</label>
                  <select
                    className="form-select"
                    value={formData.partner_type}
                    onChange={(e) => handleInputChange('partner_type', e.target.value)}
                    required
                  >
                    <option value="ISP">ISP</option>
                    <option value="Reseller">Reseller</option>
                    <option value="Distributor">Distributor</option>
                    <option value="Corporate">Corporate</option>
                    <option value="Individual">Individual</option>
                  </select>
                </div>

                <div className="col-md-6">
                  <label className="form-label fw-medium">Legal Registered Name</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Official trade license name"
                    value={formData.legal_name}
                    onChange={(e) => handleInputChange('legal_name', e.target.value)}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-medium">Brand / Business Name</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Doing Business As (DBA)"
                    value={formData.business_name}
                    onChange={(e) => handleInputChange('business_name', e.target.value)}
                  />
                </div>

                <div className="col-md-4">
                  <label className="form-label fw-medium">Category Grade</label>
                  <select
                    className="form-select"
                    value={formData.partner_category}
                    onChange={(e) => handleInputChange('partner_category', e.target.value)}
                  >
                    <option value="A">Grade A (Enterprise)</option>
                    <option value="B">Grade B (Medium)</option>
                    <option value="C">Grade C (Small)</option>
                    <option value="D">Grade D (Micro)</option>
                  </select>
                </div>
                <div className="col-md-4">
                  <label className="form-label fw-medium">Contact Person</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Key account contact"
                    value={formData.contact_person}
                    onChange={(e) => handleInputChange('contact_person', e.target.value)}
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label fw-medium">Contact Number</label>
                  <input
                    type="tel"
                    className="form-control"
                    placeholder="+880 17..."
                    value={formData.contact_number}
                    onChange={(e) => handleInputChange('contact_number', e.target.value)}
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label fw-medium">Email Address</label>
                  <input
                    type="email"
                    className="form-control"
                    placeholder="partner@company.com"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-medium">Office Address</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Full physical address"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: BUSINESS MODELS */}
          {currentStep === 2 && (
            <div>
              <h5 className="fw-bold mb-1 d-flex align-items-center gap-2">
                <Layers className="text-primary" size={20} /> Step 2: Assign Business Models (BR-01)
              </h5>
              <p className="text-muted mb-4" style={{ fontSize: '0.85rem' }}>
                Select one or multiple business relationship models for this partner.
              </p>

              {loadingLookups ? (
                <div className="text-center py-5">
                  <Loader2 className="spin text-primary" size={32} />
                  <div className="mt-2 text-muted">Loading available business models...</div>
                </div>
              ) : (
                <div className="row g-3">
                  {lookups?.business_models?.map((model) => {
                    const isSelected = formData.business_model_ids.includes(model.id)
                    const Icon = getModelIcon(model.name)
                    return (
                      <div key={model.id} className="col-md-6">
                        <div
                          className={`card h-100 border-2 cursor-pointer transition-all p-3 ${
                            isSelected
                              ? 'border-primary bg-primary-subtle bg-opacity-10 shadow-sm'
                              : 'border-light bg-light hover-shadow'
                          }`}
                          onClick={() => toggleBusinessModel(model.id)}
                        >
                          <div className="d-flex align-items-start gap-3">
                            <div
                              className={`rounded-3 p-2.5 d-flex align-items-center justify-content-center ${
                                isSelected ? 'bg-primary text-white' : 'bg-white text-secondary border'
                              }`}
                            >
                              <Icon size={24} />
                            </div>
                            <div className="flex-grow-1">
                              <div className="d-flex justify-content-between align-items-center mb-1">
                                <h6 className="fw-bold mb-0">{model.name}</h6>
                                <input
                                  type="checkbox"
                                  className="form-check-input"
                                  checked={isSelected}
                                  onChange={() => {}} // handled by div click
                                />
                              </div>
                              <p className="text-muted mb-0" style={{ fontSize: '0.8rem' }}>
                                {model.description}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* STEP 3: COMMERCIAL & PAYMENT TERMS */}
          {currentStep === 3 && (
            <div>
              <h5 className="fw-bold mb-1 d-flex align-items-center gap-2">
                <CreditCard className="text-primary" size={20} /> Step 3: Commercial & Contract Terms
              </h5>
              <p className="text-muted mb-4" style={{ fontSize: '0.85rem' }}>
                Define credit limits, billing frequency, and contract duration.
              </p>

              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label fw-medium">Contract Type</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.profile.contract_type}
                    onChange={(e) => handleProfileChange('contract_type', e.target.value)}
                    placeholder="e.g. Standard SLA, Custom Franchise"
                  />
                </div>
                <div className="col-md-3">
                  <label className="form-label fw-medium">Contract Start Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={formData.profile.contract_start_date}
                    onChange={(e) => handleProfileChange('contract_start_date', e.target.value)}
                  />
                </div>
                <div className="col-md-3">
                  <label className="form-label fw-medium">Contract End Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={formData.profile.contract_end_date}
                    onChange={(e) => handleProfileChange('contract_end_date', e.target.value)}
                  />
                </div>

                <div className="col-md-4">
                  <label className="form-label fw-medium">Billing Cycle</label>
                  <select
                    className="form-select"
                    value={formData.profile.billing_cycle}
                    onChange={(e) => handleProfileChange('billing_cycle', e.target.value)}
                  >
                    <option value="Monthly">Monthly</option>
                    <option value="Quarterly">Quarterly</option>
                    <option value="Half-Yearly">Half-Yearly</option>
                    <option value="Yearly">Yearly</option>
                  </select>
                </div>
                <div className="col-md-4">
                  <label className="form-label fw-medium">Payment Terms</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.profile.payment_terms}
                    onChange={(e) => handleProfileChange('payment_terms', e.target.value)}
                    placeholder="e.g. Net 30, Advance"
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label fw-medium">Credit Days Limit</label>
                  <input
                    type="number"
                    className="form-control"
                    min="0"
                    value={formData.profile.credit_days}
                    onChange={(e) => handleProfileChange('credit_days', Number(e.target.value))}
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label fw-medium">Credit Limit Amount (BDT)</label>
                  <div className="input-group">
                    <span className="input-group-text">৳</span>
                    <input
                      type="number"
                      className="form-control"
                      min="0"
                      step="1000"
                      value={formData.profile.credit_limit}
                      onChange={(e) => handleProfileChange('credit_limit', Number(e.target.value))}
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-medium">Security Deposit (BDT)</label>
                  <div className="input-group">
                    <span className="input-group-text">৳</span>
                    <input
                      type="number"
                      className="form-control"
                      min="0"
                      step="1000"
                      value={formData.profile.security_deposit}
                      onChange={(e) => handleProfileChange('security_deposit', Number(e.target.value))}
                    />
                  </div>
                </div>

                <div className="col-12">
                  <label className="form-label fw-medium">Special Commercial Notes</label>
                  <textarea
                    className="form-control"
                    rows="2"
                    placeholder="Additional discount or custom terms..."
                    value={formData.profile.notes}
                    onChange={(e) => handleProfileChange('notes', e.target.value)}
                  ></textarea>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: LOCATION & MANAGER */}
          {currentStep === 4 && (
            <div>
              <h5 className="fw-bold mb-1 d-flex align-items-center gap-2">
                <MapPin className="text-primary" size={20} /> Step 4: Geographic Territory & Manager
              </h5>
              <p className="text-muted mb-4" style={{ fontSize: '0.85rem' }}>
                Assign geographic hierarchy and internal relationship managers.
              </p>

              <div className="row g-3">
                <div className="col-md-4">
                  <label className="form-label fw-medium">Territory</label>
                  <select
                    className="form-select"
                    value={formData.territory_id}
                    onChange={(e) => handleInputChange('territory_id', e.target.value)}
                  >
                    <option value="">Select Territory</option>
                    {lookups?.territories?.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-md-4">
                  <label className="form-label fw-medium">Zone</label>
                  <select
                    className="form-select"
                    value={formData.zone_id}
                    onChange={(e) => handleInputChange('zone_id', e.target.value)}
                  >
                    <option value="">Select Zone</option>
                    {lookups?.zones?.map((z) => (
                      <option key={z.id} value={z.id}>
                        {z.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-md-4">
                  <label className="form-label fw-medium">Area</label>
                  <select
                    className="form-select"
                    value={formData.area_id}
                    onChange={(e) => handleInputChange('area_id', e.target.value)}
                  >
                    <option value="">Select Area</option>
                    {lookups?.areas?.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-md-6">
                  <label className="form-label fw-medium">Assigned Account Manager</label>
                  <select
                    className="form-select"
                    value={formData.account_manager_id}
                    onChange={(e) => handleInputChange('account_manager_id', e.target.value)}
                  >
                    <option value="">Unassigned</option>
                    {lookups?.account_managers?.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-md-6">
                  <label className="form-label fw-medium">Initial Status</label>
                  <select
                    className="form-select"
                    value={formData.status}
                    onChange={(e) => handleInputChange('status', e.target.value)}
                  >
                    <option value="Draft">Draft (Hold)</option>
                    <option value="Pending Approval">Pending Approval (Submit to Management)</option>
                    <option value="Active">Active Immediately</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: REVIEW & SUBMIT */}
          {currentStep === 5 && (
            <div>
              <h5 className="fw-bold mb-1 d-flex align-items-center gap-2">
                <CheckCircle2 className="text-success" size={20} /> Step 5: Review & Confirm Registration
              </h5>
              <p className="text-muted mb-4" style={{ fontSize: '0.85rem' }}>
                Please review all information before submitting to database.
              </p>

              <div className="row g-3">
                {/* Summary Card 1 */}
                <div className="col-md-6">
                  <div className="p-3 bg-light rounded border h-100">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <h6 className="fw-bold text-primary mb-0">Basic Identity</h6>
                      <button
                        type="button"
                        className="btn btn-sm btn-link p-0 text-decoration-none"
                        onClick={() => setCurrentStep(1)}
                      >
                        Edit
                      </button>
                    </div>
                    <div style={{ fontSize: '0.85rem' }}>
                      <div><strong>Name:</strong> {formData.partner_name}</div>
                      <div><strong>Type:</strong> {formData.partner_type} ({formData.partner_category})</div>
                      <div><strong>Contact:</strong> {formData.contact_person || 'N/A'} ({formData.contact_number || 'N/A'})</div>
                      <div><strong>Email:</strong> {formData.email || 'N/A'}</div>
                    </div>
                  </div>
                </div>

                {/* Summary Card 2 */}
                <div className="col-md-6">
                  <div className="p-3 bg-light rounded border h-100">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <h6 className="fw-bold text-primary mb-0">Assigned Business Models</h6>
                      <button
                        type="button"
                        className="btn btn-sm btn-link p-0 text-decoration-none"
                        onClick={() => setCurrentStep(2)}
                      >
                        Edit
                      </button>
                    </div>
                    <div className="d-flex flex-wrap gap-1">
                      {formData.business_model_ids.map((id) => {
                        const m = lookups?.business_models?.find((bm) => bm.id === id)
                        return (
                          <span key={id} className="badge bg-primary-subtle text-primary border px-2 py-1">
                            {m?.name ?? `Model #${id}`}
                          </span>
                        )
                      })}
                    </div>
                  </div>
                </div>

                {/* Summary Card 3 */}
                <div className="col-md-6">
                  <div className="p-3 bg-light rounded border h-100">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <h6 className="fw-bold text-primary mb-0">Commercial Terms</h6>
                      <button
                        type="button"
                        className="btn btn-sm btn-link p-0 text-decoration-none"
                        onClick={() => setCurrentStep(3)}
                      >
                        Edit
                      </button>
                    </div>
                    <div style={{ fontSize: '0.85rem' }}>
                      <div><strong>Billing Cycle:</strong> {formData.profile.billing_cycle}</div>
                      <div><strong>Credit Limit:</strong> ৳{formData.profile.credit_limit.toLocaleString()}</div>
                      <div><strong>Security Deposit:</strong> ৳{formData.profile.security_deposit.toLocaleString()}</div>
                    </div>
                  </div>
                </div>

                {/* Summary Card 4 */}
                <div className="col-md-6">
                  <div className="p-3 bg-light rounded border h-100">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <h6 className="fw-bold text-primary mb-0">Location & Status</h6>
                      <button
                        type="button"
                        className="btn btn-sm btn-link p-0 text-decoration-none"
                        onClick={() => setCurrentStep(4)}
                      >
                        Edit
                      </button>
                    </div>
                    <div style={{ fontSize: '0.85rem' }}>
                      <div><strong>Initial Status:</strong> <span className="badge bg-info">{formData.status}</span></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Form Actions Footer */}
          <div className="d-flex justify-content-between align-items-center mt-5 pt-3 border-top">
            <button
              type="button"
              className="pm-btn pm-btn-ghost"
              onClick={handleBack}
              disabled={currentStep === 1 || isPending}
            >
              <ArrowLeft size={16} /> Previous Step
            </button>

            <div className="d-flex gap-2">
              {currentStep < 5 ? (
                <button
                  type="button"
                  className="pm-btn pm-btn-primary"
                  onClick={handleNext}
                >
                  Next Step <ArrowRight size={16} />
                </button>
              ) : (
                <button
                  type="submit"
                  className="pm-btn pm-btn-primary bg-success border-success"
                  disabled={isPending}
                >
                  {isPending ? <Loader2 className="spin" size={18} /> : <Save size={18} />}
                  Complete Registration
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
