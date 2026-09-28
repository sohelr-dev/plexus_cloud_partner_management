import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Layers,
  Wifi,
  CreditCard,
  HardDrive,
  Store,
  CheckCircle2,
  XCircle,
  Settings,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Loader2,
  Save,
  Activity,
  Plus,
} from 'lucide-react'
import api from '../../api/client'
import { usePermissions } from '../../context/PermissionContext'

// Standard PRD Section 4 Business Models Metadata
const MODEL_CONFIGS = {
  'bandwidth sales': {
    name: 'Bandwidth Sales',
    icon: Wifi,
    color: 'primary',
    bgLight: 'bg-primary-subtle',
    textClass: 'text-primary',
    targetTab: 'bandwidth',
    tabLabel: 'Bandwidth Allocations',
    description: 'Partners purchase or consume bandwidth and network transit services from the company.',
    examples: ['Dedicated Internet Access (DIA)', 'Google Global Cache (GGC)', 'Facebook FNA', 'BDIX Peering', 'MPLS/VPN'],

  },
  'commission based': {
    name: 'Commission Based',
    icon: CreditCard,
    color: 'success',
    bgLight: 'bg-success-subtle',
    textClass: 'text-success',
    targetTab: 'commission',
    tabLabel: 'Commission Rules & Earnings',
    description: 'Partners earn commission based on configurable business rules, activations, renewals, or sales share.',
    examples: ['Percentage of Revenue', 'Fixed Bounty per Activation', 'Renewal Residuals', 'Package Incentive Schemes'],

  },
  'end device based': {
    name: 'End Device Based',
    icon: HardDrive,
    color: 'info',
    bgLight: 'bg-info-subtle',
    textClass: 'text-info',
    targetTab: 'devices',
    tabLabel: 'Equipment & End Devices',
    description: 'The business relationship is anchored on individual network endpoint devices and customer premises equipment.',
    examples: ['MAC Address Binding', 'ONU / ONT Authorization', 'Router / CPE Tracking', 'Hardware Provisioning'],

  },
  'support center': {
    name: 'Support Center',
    icon: Store,
    color: 'warning',
    bgLight: 'bg-warning-subtle',
    textClass: 'text-warning-emphasis',
    targetTab: 'support_centers',
    tabLabel: 'Support Centers & Branches',
    description: 'The partner operates physical or operational Support Centers / Branches for local customer service and support.',
    examples: ['Physical Branch Operations', 'Local Technical Staffing', 'Regional Customer Walk-in Desk', 'Local Cost Allocation'],

  },
}

export default function BusinessModelsTab({ partner, onTabChange }) {
  const queryClient = useQueryClient()
  const { can } = usePermissions()
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false)
  const [errorMsg, setErrorMsg] = useState(null)

  const activeModels = partner.business_models || []
  const activeModelIds = activeModels.map((m) => m.id)

  // Fetch all available business models from master lookup
  const { data: lookups, isLoading: loadingLookups } = useQuery({
    queryKey: ['partner-lookups'],
    queryFn: async () => {
      const res = await api.get('/partners/lookups')
      return res.data
    },
    enabled: isConfigModalOpen,
  })

  // Selected IDs in configure modal
  const [selectedModelIds, setSelectedModelIds] = useState([])

  const openConfigModal = () => {
    setSelectedModelIds([...activeModelIds])
    setErrorMsg(null)
    setIsConfigModalOpen(true)
  }

  const toggleModelId = (id) => {
    setSelectedModelIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  const updateMutation = useMutation({
    mutationFn: async (modelIds) => {
      // Update partner with synced business_model_ids
      const res = await api.put(`/partners/${partner.id}`, {
        partner_name: partner.partner_name,
        partner_type: partner.partner_type,
        business_model_ids: modelIds,
      })
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['partner', String(partner.id)])
      queryClient.invalidateQueries(['partners'])
      setIsConfigModalOpen(false)
    },
    onError: (err) => {
      setErrorMsg(
        err?.response?.data?.message ||
          Object.values(err?.response?.data?.errors || {})[0]?.[0] ||
          'Failed to update business models'
      )
    },
  })

  const handleSaveModels = (e) => {
    e.preventDefault()
    setErrorMsg(null)
    updateMutation.mutate(selectedModelIds)
  }

  return (
    <div className="space-y-4">
      {/* Top Banner */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 p-3 bg-light rounded-3 border">
        <div>
          <h5 className="fw-bold text-dark mb-1 d-flex align-items-center gap-2">
            <Layers className="text-primary" size={22} />
            Partner Business Models
          </h5>
        </div>
        <div className="d-flex align-items-center gap-2">
          {can('edit_partner') && (
            <button
              onClick={openConfigModal}
              className="btn btn-primary d-flex align-items-center gap-1.5 px-3 py-2 text-white shadow-sm"
              style={{ fontSize: '0.875rem', borderRadius: '6px' }}
            >
              <Settings size={16} /> Configure Business Models
            </button>
          )}
        </div>
      </div>

      {/* Overview Badges & Summary */}
      <div className="card border shadow-sm rounded-3">
        <div className="card-body p-3">
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
            <div>
              <span className="text-muted small fw-semibold d-block mb-1">
                Currently Enabled Business Models:
              </span>
              <div className="d-flex flex-wrap gap-2">
                {activeModels.length > 0 ? (
                  activeModels.map((bm) => (
                    <span
                      key={bm.id}
                      className="badge bg-primary-subtle text-primary border border-primary-subtle px-3 py-2 fs-7 d-flex align-items-center gap-1.5"
                    >
                      <CheckCircle2 size={15} /> {bm.name}
                    </span>
                  ))
                ) : (
                  <span className="badge bg-warning-subtle text-warning-emphasis px-3 py-2">
                    No business models assigned yet
                  </span>
                )}
              </div>
            </div>

            <div className="d-flex align-items-center gap-3">
              <div className="text-end">
                <span className="text-muted small d-block">Active Models Count</span>
                <span className="fw-bold fs-5 text-primary">{activeModels.length}</span>
              </div>
              <div className="vr d-none d-sm-block my-1" style={{ height: 36 }} />
              <div className="text-end">
                <span className="text-muted small d-block">Multi-Model Architecture</span>
                <span className="badge bg-success-subtle text-success border border-success-subtle">
                  Compliant
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Cards for 4 Core PRD Business Models */}
      <div className="row g-4 mt-1">
        {Object.entries(MODEL_CONFIGS).map(([key, config]) => {
          const isAssigned = activeModels.some(
            (m) => m.name?.toLowerCase().includes(key) || key.includes(m.name?.toLowerCase())
          )
          const Icon = config.icon

          return (
            <div key={key} className="col-12 col-lg-6">
              <div
                className={`card h-100 border shadow-sm rounded-3 transition-all ${
                  isAssigned ? 'border-primary-subtle' : 'border-light-subtle opacity-75'
                }`}
              >
                <div className="card-header bg-white border-bottom py-3 d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center gap-2.5">
                    <div
                      className={`p-2 rounded-2 ${
                        isAssigned ? config.bgLight : 'bg-light text-muted'
                      }`}
                    >
                      <Icon size={20} className={isAssigned ? config.textClass : 'text-muted'} />
                    </div>
                    <div>
                      <h6 className="fw-bold text-dark mb-0">{config.name}</h6>
                      <span className="text-muted" style={{ fontSize: '0.72rem' }}>
                        {config.prdSection}
                      </span>
                    </div>
                  </div>

                  {isAssigned ? (
                    <span className="badge bg-success-subtle text-success border border-success-subtle px-2.5 py-1 d-flex align-items-center gap-1">
                      <CheckCircle2 size={13} /> Active / Enabled
                    </span>
                  ) : (
                    <span className="badge bg-secondary-subtle text-secondary px-2.5 py-1 d-flex align-items-center gap-1">
                      <XCircle size={13} /> Not Assigned
                    </span>
                  )}
                </div>

                <div className="card-body p-3 d-flex flex-column justify-content-between">
                  <div>
                    <p className="text-secondary small mb-3">{config.description}</p>

                    <div className="mb-3">
                      <span className="text-muted fw-semibold small d-block mb-1.5" style={{ fontSize: '0.75rem' }}>
                        Included Services / Capabilities:
                      </span>
                      <div className="d-flex flex-wrap gap-1.5">
                        {config.examples.map((ex, idx) => (
                          <span
                            key={idx}
                            className="badge bg-light text-dark border px-2 py-1"
                            style={{ fontSize: '0.72rem' }}
                          >
                            {ex}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-top mt-2 d-flex align-items-center justify-content-between">
                    <span className="text-muted small">
                      {isAssigned ? 'Service fully operational' : 'Can be activated via config'}
                    </span>
                    {onTabChange && (
                      <button
                        onClick={() => onTabChange(config.targetTab)}
                        className={`btn btn-sm d-flex align-items-center gap-1 ${
                          isAssigned
                            ? 'btn-outline-primary'
                            : 'btn-outline-secondary'
                        }`}
                        style={{ fontSize: '0.8rem' }}
                      >
                        Go to {config.tabLabel} <ArrowRight size={14} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Configure Business Models Modal */}
      {isConfigModalOpen && (
        <div
          className="modal show d-block"
          tabIndex="-1"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content shadow-lg border-0 rounded-3">
              <div className="modal-header bg-light border-bottom py-3">
                <h5 className="modal-title fw-bold text-dark d-flex align-items-center gap-2">
                  <Settings size={18} className="text-primary" /> Configure Partner Business Models
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setIsConfigModalOpen(false)}
                />
              </div>

              <form onSubmit={handleSaveModels}>
                <div className="modal-body p-4">
                  {errorMsg && (
                    <div className="alert alert-danger d-flex align-items-center gap-2 py-2 mb-3">
                      <AlertCircle size={18} />
                      <span className="small">{errorMsg}</span>
                    </div>
                  )}

                  <p className="text-muted small mb-3">
                    Select the business models that apply to <strong>{partner.partner_name}</strong>. Multiple models can be assigned .
                  </p>

                  {loadingLookups ? (
                    <div className="text-center py-4 text-secondary">
                      <Loader2 size={24} className="spin mb-2" />
                      <div className="small">Loading business models list...</div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {lookups?.business_models?.map((model) => {
                        const isChecked = selectedModelIds.includes(model.id)
                        return (
                          <div
                            key={model.id}
                            onClick={() => toggleModelId(model.id)}
                            className={`p-3 rounded-3 border cursor-pointer transition-all d-flex align-items-start gap-3 mb-2 ${
                              isChecked
                                ? 'bg-primary-subtle border-primary'
                                : 'bg-light hover-bg-light border-light-subtle'
                            }`}
                            style={{ cursor: 'pointer' }}
                          >
                            <input
                              type="checkbox"
                              className="form-check-input mt-1"
                              checked={isChecked}
                              onChange={() => {}} // handled by parent div
                            />
                            <div className="flex-grow-1">
                              <div className="fw-bold text-dark d-flex align-items-center justify-content-between">
                                <span>{model.name}</span>
                                {isChecked && (
                                  <span className="badge bg-primary text-white" style={{ fontSize: '0.7rem' }}>
                                    Selected
                                  </span>
                                )}
                              </div>
                              <p className="text-muted small mb-0 mt-1">
                                {model.description || 'Standard partner commercial and operational model.'}
                              </p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                <div className="modal-footer bg-light border-top py-2">
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setIsConfigModalOpen(false)}
                    disabled={updateMutation.isPending}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary btn-sm d-flex align-items-center gap-1.5 px-3"
                    disabled={updateMutation.isPending || loadingLookups}
                  >
                    {updateMutation.isPending ? (
                      <>
                        <Loader2 size={14} className="spin" /> Updating...
                      </>
                    ) : (
                      <>
                        <Save size={14} /> Save Assignments
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
