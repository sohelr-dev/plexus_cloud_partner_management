import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  AlertTriangle,
  CalendarClock,
  Download,
  Eye,
  FileText,
  Folder,
  History as HistoryIcon,
  PlusCircle,
  ShieldCheck,
  Trash2,
  Upload,
} from 'lucide-react'
import {
  addDocumentVersion,
  acknowledgeExpiryAlert,
  changeDocumentStatus,
  deleteDocument,
  DOCUMENT_CATEGORIES,
  DOCUMENT_STATUSES,
  fetchDocumentVersions,
  fetchDocuments,
  fetchExpiryAlerts,
  uploadDocument,
} from '../../api/documents'
import { usePermissions } from '../../context/PermissionContext'


const statusBadge = (status) => {
  switch (status) {
    case 'Active':
      return 'pm-badge pm-badge-success'
    case 'Pending Approval':
      return 'pm-badge pm-badge-warning'
    case 'Expired':
      return 'pm-badge pm-badge-danger'
    case 'Rejected':
      return 'pm-badge pm-badge-danger'
    case 'Archived':
      return 'pm-badge pm-badge-secondary'
    default:
      return 'pm-badge pm-badge-blue'
  }
}

const expiryBadge = (level) => {
  switch (level) {
    case 'Expired':
      return 'pm-badge pm-badge-danger'
    case 'Critical':
      return 'pm-badge pm-badge-danger'
    case 'Warning':
      return 'pm-badge pm-badge-warning'
    case 'Info':
      return 'pm-badge pm-badge-info'
    default:
      return 'pm-badge pm-badge-secondary'
  }
}

const fmtDate = (value) => (value ? new Date(value).toLocaleDateString() : '—')
const fmtSize = (bytes) => {
  if (!bytes) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1048576).toFixed(1)} MB`
}


export default function DocumentsTab({ partnerId }) {
  const queryClient = useQueryClient()
  const { can } = usePermissions()

  const [activeModal, setActiveModal] = useState(null) // 'upload' | 'version' | 'delete'
  const [selectedDoc, setSelectedDoc] = useState(null)
  const [viewVersionsOf, setViewVersionsOf] = useState(null)
  const [filterCategory, setFilterCategory] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [search, setSearch] = useState('')

  const [uploadForm, setUploadForm] = useState({
    document_name: '',
    category: 'Legal',
    document_type: 'Partner Agreement',
    status: 'Active',
    effective_date: '',
    expiry_date: '',
    remarks: '',
    file: null,
  })
  const [versionForm, setVersionForm] = useState({
    version: '',
    effective_date: '',
    expiry_date: '',
    change_notes: '',
    file: null,
  })
  const [deleteReason, setDeleteReason] = useState('')

  /* ── Data ── */
  const { data, isLoading } = useQuery({
    queryKey: ['partnerDocuments', partnerId],
    queryFn: () => fetchDocuments(partnerId),
    enabled: Boolean(partnerId),
  })

  const { data: alerts } = useQuery({
    queryKey: ['partnerDocumentAlerts', partnerId],
    queryFn: () => fetchExpiryAlerts(partnerId),
    enabled: Boolean(partnerId),
  })

  const { data: versions } = useQuery({
    queryKey: ['documentVersions', viewVersionsOf],
    queryFn: () => fetchDocumentVersions(viewVersionsOf),
    enabled: Boolean(viewVersionsOf),
  })

  /* Mutations  */
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['partnerDocuments', partnerId] })
    queryClient.invalidateQueries({ queryKey: ['partnerDocumentAlerts', partnerId] })
    queryClient.invalidateQueries({ queryKey: ['partnerHistory', partnerId] })
    queryClient.invalidateQueries({ queryKey: ['partnerHistorySummary', partnerId] })
  }

  const uploadMutation = useMutation({
    mutationFn: (payload) => uploadDocument(partnerId, payload),
    onSuccess: () => {
      invalidate()
      setActiveModal(null)
      setUploadForm({
        document_name: '',
        category: 'Legal',
        document_type: 'Partner Agreement',
        status: 'Active',
        effective_date: '',
        expiry_date: '',
        remarks: '',
        file: null,
      })
    },
    onError: (err) => alert(err?.response?.data?.message ?? 'Upload failed.'),
  })

  const versionMutation = useMutation({
    mutationFn: ({ docId, payload }) => addDocumentVersion(docId, payload),
    onSuccess: () => {
      invalidate()
      queryClient.invalidateQueries({ queryKey: ['documentVersions', viewVersionsOf] })
      setActiveModal(null)
      setVersionForm({ version: '', effective_date: '', expiry_date: '', change_notes: '', file: null })
    },
    onError: (err) => alert(err?.response?.data?.message ?? 'Could not add version.'),
  })

  const statusMutation = useMutation({
    mutationFn: ({ docId, status, reason }) => changeDocumentStatus(docId, status, reason),
    onSuccess: () => invalidate(),
    onError: (err) => alert(err?.response?.data?.message ?? 'Status change failed.'),
  })

  const deleteMutation = useMutation({
    mutationFn: ({ docId, reason }) => deleteDocument(docId, reason),
    onSuccess: () => {
      invalidate()
      setActiveModal(null)
      setSelectedDoc(null)
      setDeleteReason('')
    },
    onError: (err) => alert(err?.response?.data?.message ?? 'Delete failed.'),
  })

  const ackMutation = useMutation({
    mutationFn: (alertId) => acknowledgeExpiryAlert(alertId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partnerDocumentAlerts', partnerId] })
      queryClient.invalidateQueries({ queryKey: ['partnerDocuments', partnerId] })
    },
  })

  /* Derived  */
  const documents = data?.documents ?? []

  const filtered = useMemo(() => {
    return documents.filter((d) => {
      if (filterCategory && d.category !== filterCategory) return false
      if (filterStatus && d.status !== filterStatus) return false
      if (search) {
        const term = search.toLowerCase()
        const hay = `${d.document_name} ${d.document_id} ${d.document_type}`.toLowerCase()
        if (!hay.includes(term)) return false
      }
      return true
    })
  }, [documents, filterCategory, filterStatus, search])

  const kpis = [
    { label: 'Total Documents', value: data?.total_documents ?? 0, icon: Folder, cls: 'pm-stat-blue' },
    { label: 'Active', value: data?.active_documents ?? 0, icon: ShieldCheck, cls: 'pm-stat-green' },
    { label: 'Expiring ≤ 90 days', value: data?.expiring_soon ?? 0, icon: CalendarClock, cls: 'pm-stat-amber' },
    { label: 'Expired', value: data?.expired_documents ?? 0, icon: AlertTriangle, cls: 'pm-stat-red' },
  ]


  return (
    <div className="p-3">
      {/* KPI strip */}
      <div className="pm-stat-row mb-3">
        {kpis.map((k) => {
          const Icon = k.icon
          return (
            <div key={k.label} className={`pm-stat-card ${k.cls}`}>
              <div className="pm-stat-icon"><Icon size={18} strokeWidth={2.5} /></div>
              <div className="pm-stat-body">
                <div className="pm-stat-value">{k.value}</div>
                <div className="pm-stat-label">{k.label}</div>
              </div>
            </div>
          )
        })}
      </div>

      {alerts && alerts.total_alerts > 0 && (
        <div className="alert alert-warning d-flex align-items-start gap-2 py-2 px-3 mb-3">
          <AlertTriangle size={18} className="flex-shrink-0 mt-1" />
          <div className="flex-grow-1">
            <strong style={{ fontSize: '0.85rem' }}>
              Document Expiry Alerts ({alerts.unacknowledged} unacknowledged)
            </strong>
            <div className="d-flex flex-wrap gap-2 mt-2">
              {alerts.alerts.slice(0, 6).map((a) => (
                <span key={a.id} className={expiryBadge(a.level)} title={a.document?.document_name}>
                  {a.document?.document_name ?? '—'} · {a.level === 'Expired' ? 'Expired' : `${a.alert_days}d`}
                  {!a.acknowledged && can('document.upload') && (
                    <button
                      className="btn btn-sm p-0 ms-2 border-0 bg-transparent text-reset"
                      title="Acknowledge"
                      disabled={ackMutation.isPending}
                      onClick={() => ackMutation.mutate(a.id)}
                    >
                      ✓
                    </button>
                  )}
                </span>
              ))}
              {alerts.alerts.length > 6 && (
                <span className="pm-badge pm-badge-secondary">+{alerts.alerts.length - 6} more</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="pm-card mb-3">
        <div className="pm-card-header">
          <h6 className="pm-card-title mb-0">
            <Folder size={16} className="me-2" />Documents
          </h6>
          {can('document.upload') && (
            <button className="btn btn-primary btn-sm d-flex align-items-center gap-1" onClick={() => setActiveModal('upload')}>
              <PlusCircle size={15} /> Upload Document
            </button>
          )}
        </div>

        <div className="row g-2 px-3 pb-2">
          <div className="col-md-5">
            <input
              className="form-control form-control-sm"
              placeholder="Search by name, ID or type…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="col-md-3">
            <select className="form-select form-select-sm" value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
              <option value="">All Categories</option>
              {Object.keys(DOCUMENT_CATEGORIES).map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="col-md-3">
            <select className="form-select form-select-sm" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <option value="">All Statuses</option>
              {DOCUMENT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="col-md-1 text-end">
            <span className="text-muted" style={{ fontSize: '0.72rem', lineHeight: '2' }}>{filtered.length} shown</span>
          </div>
        </div>

        {/* Table */}
        <div className="table-responsive">
          {isLoading ? (
            <div className="text-center py-4"><span className="spinner-border spinner-border-sm me-2" />Loading documents…</div>
          ) : filtered.length ? (
            <table className="pm-table">
              <thead>
                <tr>
                  <th>Document</th>
                  <th>Category / Type</th>
                  <th>Version</th>
                  <th>Effective</th>
                  <th>Expiry</th>
                  <th>Status</th>
                  <th style={{ width: '190px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((doc) => (
                  <tr key={doc.id}>
                    <td>
                      <div className="d-flex align-items-center gap-2">
                        <FileText size={16} className="text-primary flex-shrink-0" />
                        <div>
                          <div className="fw-semibold" style={{ fontSize: '0.82rem' }}>{doc.document_name}</div>
                          <div className="text-muted" style={{ fontSize: '0.68rem' }}>
                            {doc.document_id}
                            {doc.file_size ? ` · ${fmtSize(doc.file_size)}` : ''}
                            {doc.uploaded_by ? ` · by ${doc.uploaded_by.name}` : ''}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="pm-badge pm-badge-blue">{doc.category}</span>
                      <div className="text-muted mt-1" style={{ fontSize: '0.68rem' }}>{doc.document_type}</div>
                    </td>
                    <td>
                      <button
                        className="btn btn-sm btn-outline-secondary py-0 px-2 d-flex align-items-center gap-1"
                        style={{ fontSize: '0.7rem' }}
                        onClick={() => setViewVersionsOf(doc.id)}
                        title="View version history"
                      >
                        <HistoryIcon size={12} /> v{doc.version}
                      </button>
                    </td>
                    <td style={{ fontSize: '0.78rem' }}>{fmtDate(doc.effective_date)}</td>
                    <td>
                      <div style={{ fontSize: '0.78rem' }}>{fmtDate(doc.expiry_date)}</div>
                      {doc.expiry_level && (
                        <span className={expiryBadge(doc.expiry_level)} style={{ fontSize: '0.62rem' }}>
                          {doc.expiry_level === 'Expired' ? 'Expired' : `${doc.days_to_expiry}d left`}
                        </span>
                      )}
                    </td>
                    <td><span className={statusBadge(doc.status)}>{doc.status}</span></td>
                    <td>
                      <div className="d-flex flex-wrap gap-1">
                        {doc.file_url && (
                          <a className="btn btn-sm btn-outline-primary py-0 px-2" style={{ fontSize: '0.68rem' }} href={doc.file_url} target="_blank" rel="noreferrer" title="Download file">
                            <Download size={12} />
                          </a>
                        )}
                        {can('document.upload') && (
                          <>
                            <button
                              className="btn btn-sm btn-outline-secondary py-0 px-2"
                              style={{ fontSize: '0.68rem' }}
                              title="Upload new version"
                              onClick={() => {
                                setSelectedDoc(doc)
                                setVersionForm({ version: '', effective_date: '', expiry_date: doc.expiry_date ?? '', change_notes: '', file: null })
                                setActiveModal('version')
                              }}
                            >
                              <Upload size={12} /> New Version
                            </button>
                            <select
                              className="form-select form-select-sm py-0"
                              style={{ fontSize: '0.68rem', width: 'auto' }}
                              value=""
                              onChange={(e) => e.target.value && statusMutation.mutate({ docId: doc.id, status: e.target.value, reason: 'Status updated from Documents tab' })}
                              disabled={statusMutation.isPending}
                            >
                              <option value="">Status…</option>
                              {DOCUMENT_STATUSES.filter((s) => s !== doc.status).map((s) => (
                                <option key={s} value={s}>{s}</option>
                              ))}
                            </select>
                          </>
                        )}
                        {can('document.delete') && (
                          <button
                            className="btn btn-sm btn-outline-danger py-0 px-2"
                            style={{ fontSize: '0.68rem' }}
                            title="Delete document"
                            onClick={() => { setSelectedDoc(doc); setDeleteReason(''); setActiveModal('delete') }}
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-5 text-muted">
              <Folder size={32} className="mb-2 d-block mx-auto text-secondary" />
              <div style={{ fontSize: '0.85rem' }}>
                {documents.length ? 'No documents match the current filters.' : 'No documents uploaded yet.'}
              </div>
              {!documents.length && can('document.upload') && (
                <button className="btn btn-primary btn-sm mt-2" onClick={() => setActiveModal('upload')}>
                  <PlusCircle size={14} className="me-1" /> Upload the first document
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* By-category breakdown */}
      {data?.by_category && Object.keys(data.by_category).length > 0 && (
        <div className="pm-card">
          <div className="pm-card-header"><h6 className="pm-card-title mb-0">Documents by Category</h6></div>
          <div className="d-flex flex-wrap gap-3 px-3 pb-3 pt-1">
            {Object.entries(data.by_category).map(([cat, count]) => (
              <div key={cat} className="d-flex align-items-center gap-2">
                <span className="fw-semibold" style={{ fontSize: '0.82rem' }}>{cat}</span>
                <span className="pm-badge pm-badge-blue">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══ Upload Document Modal ══ */}
      {activeModal === 'upload' && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title fw-bold">Upload Partner Document</h5>
                <button type="button" className="btn-close" onClick={() => setActiveModal(null)} />
              </div>
              <div className="modal-body">
                <div className="row g-3">
                  <div className="col-md-8">
                    <label className="form-label small fw-semibold">Document Name *</label>
                    <input className="form-control" value={uploadForm.document_name} onChange={(e) => setUploadForm({ ...uploadForm, document_name: e.target.value })} placeholder="e.g. Master Partner Agreement 2026" />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label small fw-semibold">Category *</label>
                    <select
                      className="form-select"
                      value={uploadForm.category}
                      onChange={(e) => {
                        const category = e.target.value
                        setUploadForm({ ...uploadForm, category, document_type: DOCUMENT_CATEGORIES[category][0] })
                      }}
                    >
                      {Object.keys(DOCUMENT_CATEGORIES).map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label small fw-semibold">Document Type *</label>
                    <select className="form-select" value={uploadForm.document_type} onChange={(e) => setUploadForm({ ...uploadForm, document_type: e.target.value })}>
                      {(DOCUMENT_CATEGORIES[uploadForm.category] ?? []).map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="col-md-3">
                    <label className="form-label small fw-semibold">Effective Date</label>
                    <input type="date" className="form-control" value={uploadForm.effective_date} onChange={(e) => setUploadForm({ ...uploadForm, effective_date: e.target.value })} />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label small fw-semibold">Expiry Date</label>
                    <input type="date" className="form-control" value={uploadForm.expiry_date} onChange={(e) => setUploadForm({ ...uploadForm, expiry_date: e.target.value })} />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label small fw-semibold">Status</label>
                    <select className="form-select" value={uploadForm.status} onChange={(e) => setUploadForm({ ...uploadForm, status: e.target.value })}>
                      {DOCUMENT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="col-md-8">
                    <label className="form-label small fw-semibold">Attach File <span className="text-muted">(PDF, DOC, XLS, image — max 20 MB)</span></label>
                    <input
                      type="file"
                      className="form-control"
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif"
                      onChange={(e) => setUploadForm({ ...uploadForm, file: e.target.files?.[0] ?? null })}
                    />
                  </div>
                  <div className="col-12">
                    <label className="form-label small fw-semibold">Remarks</label>
                    <textarea className="form-control" rows="2" value={uploadForm.remarks} onChange={(e) => setUploadForm({ ...uploadForm, remarks: e.target.value })} />
                  </div>
                </div>
                {uploadForm.expiry_date && (
                  <div className="alert alert-info py-2 small mt-3 mb-0">
                    <strong></strong> Expiry alerts will be generated automatically at 90 / 60 / 30 / 15 / 7 days before expiry.
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setActiveModal(null)}>Cancel</button>
                <button
                  className="btn btn-primary d-flex align-items-center gap-1"
                  disabled={uploadMutation.isPending || !uploadForm.document_name || !uploadForm.document_type}
                  onClick={() => uploadMutation.mutate(uploadForm)}
                >
                  {uploadMutation.isPending && <span className="spinner-border spinner-border-sm me-1" />}
                  {uploadMutation.isPending ? 'Uploading…' : 'Upload Document'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══ Add Version Modal  ══ */}
      {activeModal === 'version' && selectedDoc && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title fw-bold">Upload New Version</h5>
                <button type="button" className="btn-close" onClick={() => setActiveModal(null)} />
              </div>
              <div className="modal-body">
                <div className="alert alert-success py-2 small">
                  <strong></strong> Versioning is enforced. <strong>{selectedDoc.document_name}</strong> is currently at
                  <strong> v{selectedDoc.version}</strong> — the previous version stays available in history.
                </div>
                <div className="row g-3">
                  <div className="col-md-4">
                    <label className="form-label small fw-semibold">New Version *</label>
                    <input className="form-control" value={versionForm.version} onChange={(e) => setVersionForm({ ...versionForm, version: e.target.value })} placeholder="e.g. 1.1 or 2.0" />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label small fw-semibold">Effective Date</label>
                    <input type="date" className="form-control" value={versionForm.effective_date} onChange={(e) => setVersionForm({ ...versionForm, effective_date: e.target.value })} />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label small fw-semibold">Expiry Date</label>
                    <input type="date" className="form-control" value={versionForm.expiry_date} onChange={(e) => setVersionForm({ ...versionForm, expiry_date: e.target.value })} />
                  </div>
                  <div className="col-12">
                    <label className="form-label small fw-semibold">New File <span className="text-muted">(optional — keeps the existing file if omitted)</span></label>
                    <input
                      type="file"
                      className="form-control"
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif"
                      onChange={(e) => setVersionForm({ ...versionForm, file: e.target.files?.[0] ?? null })}
                    />
                  </div>
                  <div className="col-12">
                    <label className="form-label small fw-semibold">Change Notes</label>
                    <textarea className="form-control" rows="2" value={versionForm.change_notes} onChange={(e) => setVersionForm({ ...versionForm, change_notes: e.target.value })} placeholder="What changed in this version?" />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setActiveModal(null)}>Cancel</button>
                <button
                  className="btn btn-primary d-flex align-items-center gap-1"
                  disabled={versionMutation.isPending || !versionForm.version}
                  onClick={() => versionMutation.mutate({ docId: selectedDoc.id, payload: versionForm })}
                >
                  {versionMutation.isPending && <span className="spinner-border spinner-border-sm me-1" />}
                  {versionMutation.isPending ? 'Saving…' : 'Save New Version'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══ Version History Modal ══ */}
      {viewVersionsOf && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title fw-bold">
                  Version History — {versions?.document_id ?? ''}
                </h5>
                <button type="button" className="btn-close" onClick={() => setViewVersionsOf(null)} />
              </div>
              <div className="modal-body">
                <div className="alert alert-info py-2 small">
                  <strong> v{versions?.current_version ?? '—'}</strong>. Suggested next:
                  <strong> v{versions?.next_version ?? '—'}</strong>.
                </div>
                {versions?.versions?.length ? (
                  <div className="table-responsive">
                    <table className="pm-table">
                      <thead>
                        <tr>
                          <th>Version</th>
                          <th>Effective</th>
                          <th>Expiry</th>
                          <th>Uploaded</th>
                          <th>Change Notes</th>
                        </tr>
                      </thead>
                      <tbody>
                        {versions.versions.map((v) => (
                          <tr key={v.id}>
                            <td>
                              <span className={v.is_current ? 'pm-badge pm-badge-success' : 'pm-badge pm-badge-secondary'}>
                                v{v.version}{v.is_current ? ' · current' : ''}
                              </span>
                            </td>
                            <td style={{ fontSize: '0.78rem' }}>{fmtDate(v.effective_date)}</td>
                            <td style={{ fontSize: '0.78rem' }}>{fmtDate(v.expiry_date)}</td>
                            <td style={{ fontSize: '0.72rem' }}>
                              {v.uploaded_by ?? '—'}
                              <div className="text-muted">{v.created_at ? new Date(v.created_at).toLocaleString() : ''}</div>
                            </td>
                            <td style={{ fontSize: '0.75rem' }}>{v.change_notes ?? '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center text-muted py-3"><span className="spinner-border spinner-border-sm me-2" />Loading versions…</div>
                )}
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setViewVersionsOf(null)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══ Delete Confirmation ══ */}
      {activeModal === 'delete' && selectedDoc && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-sm">
            <div className="modal-content">
              <div className="modal-header">
                <h6 className="modal-title fw-bold">Delete Document</h6>
                <button type="button" className="btn-close" onClick={() => setActiveModal(null)} />
              </div>
              <div className="modal-body">
                <p className="small mb-2">
                  Delete <strong>{selectedDoc.document_name}</strong> ({selectedDoc.document_id})?
                  The record is soft-deleted and stays traceable in the audit trail.
                </p>
                <label className="form-label small fw-semibold">Reason</label>
                <textarea className="form-control" rows="2" value={deleteReason} onChange={(e) => setDeleteReason(e.target.value)} placeholder="Reason for deletion…" />
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary btn-sm" onClick={() => setActiveModal(null)}>Cancel</button>
                <button
                  className="btn btn-danger btn-sm d-flex align-items-center gap-1"
                  disabled={deleteMutation.isPending}
                  onClick={() => deleteMutation.mutate({ docId: selectedDoc.id, reason: deleteReason })}
                >
                  {deleteMutation.isPending && <span className="spinner-border spinner-border-sm" />}
                  {deleteMutation.isPending ? 'Deleting…' : 'Confirm Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}