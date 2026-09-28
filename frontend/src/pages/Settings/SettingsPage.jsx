import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getAllSettings,
  updateSetting,
  bulkUpdateSettings,
  resetSetting,
} from '../../api/settings'
import { getRolesPermissions, updateRolePermissions } from '../../api/roles'
import {
  getBusinessModels,
  createBusinessModel,
  updateBusinessModel,
  deleteBusinessModel,
} from '../../api/businessModels'
import { usePermissions } from '../../context/PermissionContext'

const Icon = ({ path, size = 18, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d={path} />
  </svg>
)

const ICONS = {
  general:         'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5',
  health:          'M22 12h-4l-3 9L9 3l-3 9H2',
  commission:      'M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6',
  documents:       'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6',
  bandwidth:       'M1.05 12a11 11 0 0121.9 0M5.84 15.67a7 7 0 0112.32 0M9.17 17.5a3 3 0 015.66 0',
  notifications:   'M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0',
  reset:           'M1 4v6h6M23 20v-6h-6M20.49 9A9 9 0 005.64 5.64L1 10M23 14l-4.64 4.36A9 9 0 013.51 15',
  save:            'M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2zM17 21v-8H7v8M7 3v5h8',
  check:           'M20 6L9 17l-5-5',
  info:            'M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM12 16v-4M12 8h.01',
  shield:          'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
  briefcase:       'M20 7h-4V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2zM10 5h4v2h-4V5z',
  plus:            'M12 5v14M5 12h14',
  edit:            'M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z',
  trash:           'M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2',
}

const TABS = [
  { key: 'general',         label: 'General',             icon: ICONS.general,       color: '#6366f1' },
  { key: 'business-models', label: 'Business Models',     icon: ICONS.briefcase,     color: '#0ea5e9' },
  { key: 'health',          label: 'Health Score',        icon: ICONS.health,        color: '#10b981' },
  { key: 'commission',      label: 'Commission',          icon: ICONS.commission,    color: '#f59e0b' },
  { key: 'documents',       label: 'Documents',           icon: ICONS.documents,     color: '#3b82f6' },
  { key: 'bandwidth',       label: 'Bandwidth',           icon: ICONS.bandwidth,     color: '#8b5cf6' },
  { key: 'notifications',   label: 'Notifications',       icon: ICONS.notifications, color: '#ef4444' },
  { key: 'roles',           label: 'Roles & Permissions', icon: ICONS.shield,        color: '#0f172a' },
]

function SettingControl({ setting, onSave, onReset, isSaving, isResetting }) {
  const initVal = setting.type === 'json'
    ? JSON.stringify(setting.value, null, 2)
    : String(setting.value ?? '')

  const [localValue, setLocalValue] = useState(initVal)
  const [saved, setSaved]           = useState(false)

  const isDirty = localValue !== initVal

  const handleSave = () => {
    let val = localValue
    if (setting.type === 'json') {
      try { val = JSON.parse(localValue) } catch { return }
    }
    onSave(setting.key, val)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="setting-row">
      <div className="setting-info">
        <div className="setting-label-row">
          <span className="setting-label">{setting.label}</span>
          {setting.is_modified && (
            <span className="setting-modified-badge">Modified</span>
          )}
        </div>
        {setting.description && (
          <p className="setting-description">{setting.description}</p>
        )}
        <span className="setting-default">
          Default: <code>{String(setting.default_value)}</code>
        </span>
      </div>

      <div className="setting-control">
        {setting.type === 'boolean' ? (
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={localValue === 'true' || localValue === true}
              onChange={(e) => setLocalValue(e.target.checked ? 'true' : 'false')}
            />
            <span className="toggle-slider" />
            <span className="toggle-label">
              {localValue === 'true' || localValue === true ? 'Enabled' : 'Disabled'}
            </span>
          </label>
        ) : setting.type === 'select' ? (
          <select
            value={localValue}
            onChange={(e) => setLocalValue(e.target.value)}
            className="setting-select"
          >
            {(setting.options || []).map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        ) : setting.type === 'json' ? (
          <textarea
            value={localValue}
            onChange={(e) => setLocalValue(e.target.value)}
            className="setting-textarea"
            rows={4}
            spellCheck={false}
          />
        ) : (
          <input
            type={setting.type === 'integer' || setting.type === 'decimal' ? 'number' : 'text'}
            value={localValue}
            onChange={(e) => setLocalValue(e.target.value)}
            className="setting-input"
            step={setting.type === 'decimal' ? '0.01' : '1'}
          />
        )}

        <div className="setting-actions">
          <button
            className={`btn-save-setting ${saved ? 'saved' : ''}`}
            onClick={handleSave}
            disabled={isSaving}
            title="Save this setting"
          >
            {isSaving ? (
              <span className="spinner-xs" />
            ) : (
              <Icon path={ICONS.save} size={14} />
            )}
            Save
          </button>
          {setting.is_modified && (
            <button
              className="btn-reset-setting"
              onClick={() => onReset(setting.key)}
              disabled={isResetting}
              title="Reset to default"
            >
              <Icon path={ICONS.reset} size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function HealthWeightsSection({ settings, onBulkSave, isSaving }) {
  const weightKeys = settings.filter((s) => s.key.startsWith('health_weight_'))
  const [weights, setWeights] = useState(() =>
    Object.fromEntries(weightKeys.map((s) => [s.key, Number(s.value)]))
  )

  const total = Object.values(weights).reduce((a, b) => a + b, 0)
  const isValid = total === 100

  const handleSave = () => {
    const payload = Object.entries(weights).map(([key, val]) => ({
      key,
      value: String(val),
    }))
    onBulkSave(payload)
  }

  return (
    <div className="health-weights-card">
      <div className="health-weights-header">
        <h4>Health Score Category Weights</h4>
        <div className={`total-badge ${isValid ? 'valid' : 'invalid'}`}>
          Total: {total}% {isValid ? '✓' : `(must be 100%)`}
        </div>
      </div>
      <div className="weights-grid">
        {weightKeys.map((s) => (
          <div key={s.key} className="weight-item">
            <label className="weight-label">{s.label.replace(' Weight (%)', '')}</label>
            <div className="weight-input-row">
              <input
                type="range"
                min={0}
                max={50}
                value={weights[s.key] ?? 0}
                onChange={(e) =>
                  setWeights((prev) => ({ ...prev, [s.key]: Number(e.target.value) }))
                }
                className="weight-slider"
                style={{
                  '--pct': `${(weights[s.key] ?? 0) / 50 * 100}%`,
                }}
              />
              <span className="weight-value">{weights[s.key]}%</span>
            </div>
          </div>
        ))}
      </div>
      <button
        className="btn-save-weights"
        onClick={handleSave}
        disabled={!isValid || isSaving}
      >
        {isSaving ? <span className="spinner-xs" /> : <Icon path={ICONS.save} size={16} />}
        Save Weights
      </button>
    </div>
  )
}

function NotificationsGrid({ settings, onSave, isSaving }) {
  const notifSettings = settings.filter((s) => s.key.startsWith('notify_'))
  const [state, setState] = useState(() =>
    Object.fromEntries(notifSettings.map((s) => [s.key, s.value === true || s.value === 'true']))
  )

  const handleToggle = (key) => {
    const newVal = !state[key]
    setState((prev) => ({ ...prev, [key]: newVal }))
    onSave(key, newVal ? 'true' : 'false')
  }

  const label = (s) =>
    s.label.replace('Notify: ', '')

  return (
    <div className="notifications-grid">
      {notifSettings.map((s) => (
        <div
          key={s.key}
          className={`notif-card ${state[s.key] ? 'notif-on' : 'notif-off'}`}
          onClick={() => handleToggle(s.key)}
        >
          <div className="notif-icon-wrap">
            <Icon path={ICONS.notifications} size={20} />
          </div>
          <div className="notif-info">
            <span className="notif-name">{label(s)}</span>
            <span className="notif-desc">{s.description?.split('.')[0]}</span>
          </div>
          <label className="toggle-switch small" onClick={(e) => e.stopPropagation()}>
            <input
              type="checkbox"
              checked={state[s.key]}
              onChange={() => handleToggle(s.key)}
            />
            <span className="toggle-slider" />
          </label>
        </div>
      ))}
    </div>
  )
}

//  Roles & Permissions Section 
function RolesPermissionsSection() {
  const queryClient = useQueryClient()
  const [toast, setToast] = useState(null)
  
  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const { data, isLoading, error } = useQuery({
    queryKey: ['roles-permissions'],
    queryFn: getRolesPermissions,
  })

  const updateMut = useMutation({
    mutationFn: ({ roleId, permissions }) => updateRolePermissions(roleId, permissions),
    onSuccess: () => {
      queryClient.invalidateQueries(['roles-permissions'])
      showToast('Permissions updated successfully.')
    },
    onError: () => showToast('Failed to update permissions.', 'error'),
  })

  if (isLoading) return <div className="settings-loading"><span className="spinner-lg" /></div>
  if (error) return <div className="settings-error">Failed to load roles.</div>

  const handleToggle = (role, perm) => {
    const current = role.permissions || []
    const next = current.includes(perm)
      ? current.filter((p) => p !== perm)
      : [...current, perm]
    
    updateMut.mutate({ roleId: role.id, permissions: next })
  }

  return (
    <div className="roles-section">
      {toast && (
        <div className={`settings-toast ${toast.type}`}>
          <Icon path={ICONS.check} size={16} />
          {toast.msg}
        </div>
      )}
      <div className="settings-section-title" style={{ marginTop: '1rem' }}>
        Permission Matrix (Auto-Saves)
      </div>
      <div className="table-responsive bg-white rounded border" style={{ maxHeight: '600px', overflow: 'auto' }}>
        <table className="table pm-table m-0" style={{ fontSize: '0.85rem' }}>
          <thead>
            <tr>
              <th style={{ width: '220px', position: 'sticky', left: 0, top: 0, background: '#f8fafc', zIndex: 3, borderBottom: '2px solid #e2e8f0' }}>Role</th>
              {data.all_permissions.map((p) => (
                <th key={p} className="text-center font-monospace" style={{ fontSize: '0.75rem', padding: '0.5rem', whiteSpace: 'nowrap', position: 'sticky', top: 0, background: '#f8fafc', zIndex: 2, borderBottom: '2px solid #e2e8f0' }}>
                  {p}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.roles.map((role) => (
              <tr key={role.id}>
                <td style={{ position: 'sticky', left: 0, background: '#fff', zIndex: 1, borderRight: '1px solid #e2e8f0' }} className="fw-bold text-dark">
                  {role.name}
                </td>
                {data.all_permissions.map((p) => (
                  <td key={p} className="text-center" style={{ borderRight: '1px solid #f1f5f9' }}>
                    <input 
                      type="checkbox" 
                      className="form-check-input roles-matrix-checkbox"
                      checked={(role.permissions || []).includes(p)}
                      onChange={() => handleToggle(role, p)}
                      disabled={updateMut.isPending}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

//  Business Models Master Section 
function BusinessModelsSection() {
  const queryClient = useQueryClient()
  const [toast, setToast] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingModel, setEditingModel] = useState(null)
  const [formData, setFormData] = useState({ name: '', description: '', is_active: true })

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const { data: models = [], isLoading, error } = useQuery({
    queryKey: ['business-models'],
    queryFn: getBusinessModels,
  })

  const createMut = useMutation({
    mutationFn: createBusinessModel,
    onSuccess: () => {
      queryClient.invalidateQueries(['business-models'])
      showToast('Business model created successfully.')
      setIsModalOpen(false)
      setFormData({ name: '', description: '', is_active: true })
    },
    onError: (err) => showToast(err?.response?.data?.message || 'Failed to create business model.', 'error'),
  })

  const updateMut = useMutation({
    mutationFn: ({ id, data }) => updateBusinessModel(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['business-models'])
      showToast('Business model updated successfully.')
      setEditingModel(null)
      setIsModalOpen(false)
    },
    onError: (err) => showToast(err?.response?.data?.message || 'Failed to update business model.', 'error'),
  })

  const deleteMut = useMutation({
    mutationFn: deleteBusinessModel,
    onSuccess: () => {
      queryClient.invalidateQueries(['business-models'])
      showToast('Business model deleted successfully.')
    },
    onError: (err) => showToast(err?.response?.data?.message || 'Failed to delete business model.', 'error'),
  })

  const openCreateModal = () => {
    setEditingModel(null)
    setFormData({ name: '', description: '', is_active: true })
    setIsModalOpen(true)
  }

  const openEditModal = (model) => {
    setEditingModel(model)
    setFormData({ name: model.name, description: model.description || '', is_active: Boolean(model.is_active) })
    setIsModalOpen(true)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!formData.name.trim()) return
    if (editingModel) {
      updateMut.mutate({ id: editingModel.id, data: formData })
    } else {
      createMut.mutate(formData)
    }
  }

  const handleToggle = (model) => {
    updateMut.mutate({ id: model.id, data: { is_active: !model.is_active } })
  }

  const handleDelete = (model) => {
    if (model.partners_count > 0) {
      alert(`Cannot delete "${model.name}" because it is currently assigned to ${model.partners_count} partner(s). Please deactivate it instead.`)
      return
    }
    if (window.confirm(`Are you sure you want to delete "${model.name}"?`)) {
      deleteMut.mutate(model.id)
    }
  }

  if (isLoading) return <div className="settings-loading"><span className="spinner-lg" /></div>
  if (error) return <div className="settings-error">Failed to load business models.</div>

  return (
    <div className="business-models-section">
      {toast && (
        <div className={`settings-toast ${toast.type}`}>
          <Icon path={ICONS.check} size={16} />
          {toast.msg}
        </div>
      )}

      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h4 className="fw-bold mb-1" style={{ fontSize: '1.1rem', color: '#1e293b' }}>
            Business Models Master List (PRD Section 4)
          </h4>
          <p className="text-muted small m-0">
            Define and manage official business models available for partner assignment.
          </p>
        </div>
        <button
          className="btn btn-primary btn-sm d-flex align-items-center gap-2"
          onClick={openCreateModal}
          style={{ background: '#0ea5e9', borderColor: '#0ea5e9' }}
        >
          <Icon path={ICONS.plus} size={15} />
          Add Business Model
        </button>
      </div>

      <div className="table-responsive bg-white rounded border shadow-sm">
        <table className="table table-hover align-middle m-0">
          <thead className="table-light">
            <tr style={{ fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              <th style={{ width: '60px' }}>ID</th>
              <th>Model Name</th>
              <th>Description</th>
              <th className="text-center">Assigned Partners</th>
              <th className="text-center">Status</th>
              <th className="text-end">Actions</th>
            </tr>
          </thead>
          <tbody style={{ fontSize: '0.88rem' }}>
            {models.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center py-4 text-muted">
                  No business models found. Click "Add Business Model" to create one.
                </td>
              </tr>
            ) : (
              models.map((m) => (
                <tr key={m.id}>
                  <td className="text-muted fw-mono">#{m.id}</td>
                  <td>
                    <span className="badge bg-light text-dark border px-2 py-1 fw-bold">
                      {m.name}
                    </span>
                  </td>
                  <td className="text-muted small" style={{ maxWidth: '350px' }}>
                    {m.description || '—'}
                  </td>
                  <td className="text-center">
                    <span className="badge bg-info-subtle text-info border border-info-subtle px-2 py-1">
                      {m.partners_count ?? 0} Partners
                    </span>
                  </td>
                  <td className="text-center">
                    <label className="toggle-switch small d-inline-block">
                      <input
                        type="checkbox"
                        checked={Boolean(m.is_active)}
                        onChange={() => handleToggle(m)}
                        disabled={updateMut.isPending}
                      />
                      <span className="toggle-slider" />
                    </label>
                  </td>
                  <td className="text-end">
                    <div className="d-flex justify-content-end gap-1">
                      <button
                        className="btn btn-outline-secondary btn-sm p-1 px-2"
                        title="Edit"
                        onClick={() => openEditModal(m)}
                      >
                        <Icon path={ICONS.edit} size={14} />
                      </button>
                      <button
                        className="btn btn-outline-danger btn-sm p-1 px-2"
                        title="Delete"
                        onClick={() => handleDelete(m)}
                        disabled={deleteMut.isPending}
                      >
                        <Icon path={ICONS.trash} size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── Modal for Add / Edit ── */}
      {isModalOpen && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content shadow-lg border-0">
              <div className="modal-header border-bottom">
                <h5 className="modal-title fw-bold">
                  {editingModel ? 'Edit Business Model' : 'New Business Model'}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setIsModalOpen(false)}
                />
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body p-4">
                  <div className="mb-3">
                    <label className="form-label fw-semibold small">Business Model Name *</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Bandwidth Sales, Commission Based"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-semibold small">Description</label>
                    <textarea
                      className="form-control"
                      rows={3}
                      placeholder="Commercial characteristics and revenue model summary..."
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                  </div>
                  <div className="form-check form-switch mt-2">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="is_active_toggle"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    />
                    <label className="form-check-label small fw-semibold" htmlFor="is_active_toggle">
                      Active (Available for Partner selection)
                    </label>
                  </div>
                </div>
                <div className="modal-footer border-top bg-light">
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setIsModalOpen(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary btn-sm"
                    disabled={createMut.isPending || updateMut.isPending}
                    style={{ background: '#0ea5e9', borderColor: '#0ea5e9' }}
                  >
                    {createMut.isPending || updateMut.isPending ? 'Saving…' : 'Save Business Model'}
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

export default function SettingsPage() {
  const { can } = usePermissions()
  const [activeTab, setActiveTab] = useState('general')
  const [toast, setToast] = useState(null)
  const queryClient = useQueryClient()

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const { data: allSettings, isLoading, error } = useQuery({
    queryKey: ['settings'],
    queryFn: getAllSettings,
  })

  const updateMut = useMutation({
    mutationFn: ({ key, value }) => updateSetting(key, value),
    onSuccess: (_, { key }) => {
      queryClient.invalidateQueries(['settings'])
      showToast(`Setting saved successfully.`)
    },
    onError: () => showToast('Failed to save setting.', 'error'),
  })

  const bulkMut = useMutation({
    mutationFn: (settings) => bulkUpdateSettings(settings),
    onSuccess: () => {
      queryClient.invalidateQueries(['settings'])
      showToast('Settings saved successfully.')
    },
    onError: () => showToast('Bulk update failed.', 'error'),
  })

  const resetMut = useMutation({
    mutationFn: (key) => resetSetting(key),
    onSuccess: (_, key) => {
      queryClient.invalidateQueries(['settings'])
      showToast(`Reset to default.`)
    },
    onError: () => showToast('Reset failed.', 'error'),
  })

  const tabSettings = useCallback(
    (tab) => {
      if (!allSettings) return []
      const group = allSettings[tab]
      return Array.isArray(group) ? group : []
    },
    [allSettings]
  )

  if (isLoading) {
    return (
      <div className="settings-loading">
        <span className="spinner-lg" />
        <p>Loading settings…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="settings-error">
        <Icon path={ICONS.info} size={32} className="error-icon" />
        <h3>Could not load settings</h3>
        <p>Make sure you have <strong>system-admin</strong> role permissions.</p>
      </div>
    )
  }

  const current = tabSettings(activeTab)

  return (
    <div className="settings-page">
      {/* ── Toast ── */}
      {toast && (
        <div className={`settings-toast ${toast.type}`}>
          <Icon path={ICONS.check} size={16} />
          {toast.msg}
        </div>
      )}

      {/* ── Header ── */}
      <div className="settings-header">
        <div>
          <h1 className="settings-title">System Settings</h1>
          <p className="settings-subtitle">
            Configure system-wide behaviour — all changes take effect immediately.
          </p>
        </div>
      </div>

      {/* ── Tab Nav ── */}
      <div className="settings-tabs">
        {TABS.filter(t => t.key !== 'roles' || can('role.manage')).map((tab) => (
          <button
            key={tab.key}
            className={`settings-tab ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
            style={{ '--tab-color': tab.color }}
          >
            <Icon path={tab.icon} size={16} />
            {tab.label}
            {tab.key !== 'roles' && tab.key !== 'business-models' && (
              <span className="tab-count">
                {tabSettings(tab.key).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Tab Content ── */}
      <div className="settings-content">

        {/* Business Models tab */}
        {activeTab === 'business-models' && <BusinessModelsSection />}

        {activeTab === 'health' && (
          <>
            <HealthWeightsSection
              settings={current}
              onBulkSave={(payload) => bulkMut.mutate(payload)}
              isSaving={bulkMut.isPending}
            />
            <div className="settings-section-title">Health Status Thresholds</div>
            {current
              .filter((s) => s.key.startsWith('health_threshold_'))
              .map((s) => (
                <SettingControl
                  key={s.key}
                  setting={s}
                  onSave={(key, val) => updateMut.mutate({ key, value: val })}
                  onReset={(key) => resetMut.mutate(key)}
                  isSaving={updateMut.isPending && updateMut.variables?.key === s.key}
                  isResetting={resetMut.isPending && resetMut.variables === s.key}
                />
              ))}
          </>
        )}

        {/* Notifications: card grid */}
        {activeTab === 'notifications' && (
          <NotificationsGrid
            settings={current}
            onSave={(key, val) => updateMut.mutate({ key, value: val })}
            isSaving={updateMut.isPending}
          />
        )}

        {/* Roles tab */}
        {activeTab === 'roles' && <RolesPermissionsSection />}

        {/* All other tabs: generic list */}
        {activeTab !== 'health' && activeTab !== 'notifications' && activeTab !== 'roles' && activeTab !== 'business-models' && (
          <div className="settings-list">
            {current.length === 0 ? (
              <div className="settings-empty">No settings in this group.</div>
            ) : (
              current.map((s) => (
                <SettingControl
                  key={s.key}
                  setting={s}
                  onSave={(key, val) => updateMut.mutate({ key, value: val })}
                  onReset={(key) => resetMut.mutate(key)}
                  isSaving={updateMut.isPending && updateMut.variables?.key === s.key}
                  isResetting={resetMut.isPending && resetMut.variables === s.key}
                />
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}
