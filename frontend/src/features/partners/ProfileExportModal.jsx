import { useMemo, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import {
  AlertCircle,
  CalendarRange,
  CheckSquare,
  Download,
  FileSpreadsheet,
  FileText,
  Printer,
  Square,
} from 'lucide-react'
import {
  downloadProfileExport,
  EXPORT_FORMATS,
  EXPORT_SCOPES,
  EXPORT_SECTIONS,
  fetchExportPreview,
  openPrintView,
} from '../../api/profileExport'

/*  Helpers  */

const formatIcon = (key) => {
  switch (key) {
    case 'excel':
    case 'csv':
      return FileSpreadsheet
    case 'print':
      return Printer
    default:
      return FileText
  }
}

const stringify = (value) => {
  if (value === null || value === undefined) return '—'
  if (Array.isArray(value)) return `${value.length} item(s)`
  if (typeof value === 'object') return JSON.stringify(value).slice(0, 60) + '…'
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  return String(value)
}

/*  Component  */

export default function ProfileExportModal({ partnerId, partnerName, onClose }) {
  const [format, setFormat] = useState('pdf')
  const [scope, setScope] = useState('full_report')
  const [selectedSections, setSelectedSections] = useState(EXPORT_SECTIONS.map((s) => s.key))
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [showPreview, setShowPreview] = useState(false)
  const [status, setStatus] = useState(null) // { type: 'success'|'error', text }

  const params = useMemo(() => {
    const p = { format, scope }
    if (scope === 'selected_sections') p.sections = selectedSections
    if (scope === 'custom_range' || dateFrom) p.date_from = dateFrom
    if (scope === 'custom_range' || dateTo) p.date_to = dateTo
    return p
  }, [format, scope, selectedSections, dateFrom, dateTo])

  const { data: preview, isFetching: previewLoading } = useQuery({
    queryKey: ['exportPreview', partnerId, params],
    queryFn: () => fetchExportPreview(partnerId, params),
    enabled: Boolean(partnerId) && showPreview,
  })

  const exportMutation = useMutation({
    mutationFn: async () => {
      if (format === 'print') {
        await openPrintView(partnerId, params)
        return 'print-opened'
      }
      return downloadProfileExport(partnerId, params)
    },
    onSuccess: (result) => {
      setStatus(
        result === 'print-opened'
          ? { type: 'success', text: 'Print view opened in a new tab — use the browser print dialog to save as PDF.' }
          : { type: 'success', text: `Export downloaded: ${result}` },
      )
    },
    onError: (err) =>
      setStatus({ type: 'error', text: err?.response?.data?.message ?? 'Export failed. Please try again.' }),
  })

  const toggleSection = (key) =>
    setSelectedSections((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    )

  const allSelected = selectedSections.length === EXPORT_SECTIONS.length

  return (
    <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-dialog-centered modal-lg modal-dialog-scrollable">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title fw-bold d-flex align-items-center gap-2">
              <Download size={18} /> Export Partner Profile
            </h5>
            <button type="button" className="btn-close" onClick={onClose} />
          </div>

          <div className="modal-body">
            <div className="alert alert-info py-2 small">
              <strong>PRD §82:</strong> Export <strong>{partnerName}</strong> as PDF, Excel, CSV or Print.
              Choose what to include below.
            </div>

            {/* ── Format ── */}
            <label className="form-label small fw-semibold">Export Format</label>
            <div className="d-flex flex-wrap gap-2 mb-3">
              {EXPORT_FORMATS.map((f) => {
                const Icon = formatIcon(f.key)
                const active = format === f.key
                return (
                  <button
                    key={f.key}
                    type="button"
                    className={`btn btn-sm d-flex align-items-center gap-1 ${active ? 'btn-primary' : 'btn-outline-secondary'}`}
                    onClick={() => setFormat(f.key)}
                  >
                    <Icon size={14} /> {f.label}
                  </button>
                )
              })}
            </div>

            {/* ── Scope ── */}
            <label className="form-label small fw-semibold">Export Scope</label>
            <div className="d-flex flex-column gap-2 mb-3">
              {EXPORT_SCOPES.map((s) => (
                <div
                  key={s.key}
                  role="button"
                  tabIndex={0}
                  className={`border rounded-3 px-3 py-2 ${scope === s.key ? 'border-primary bg-primary-subtle' : ''}`}
                  style={{ cursor: 'pointer' }}
                  onClick={() => setScope(s.key)}
                  onKeyDown={(e) => e.key === 'Enter' && setScope(s.key)}
                >
                  <div className="d-flex align-items-center gap-2">
                    <input className="form-check-input mt-0" type="radio" checked={scope === s.key} readOnly />
                    <span className="fw-semibold" style={{ fontSize: '0.85rem' }}>{s.label}</span>
                    <span className="text-muted ms-auto" style={{ fontSize: '0.7rem' }}>{s.hint}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* ── Sections (only for selected_sections) ── */}
            {scope === 'selected_sections' && (
              <div className="mb-3">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <label className="form-label small fw-semibold mb-0">
                    Sections to Include ({selectedSections.length}/{EXPORT_SECTIONS.length})
                  </label>
                  <button
                    type="button"
                    className="btn btn-sm btn-link p-0 text-decoration-none"
                    style={{ fontSize: '0.72rem' }}
                    onClick={() => setSelectedSections(allSelected ? [] : EXPORT_SECTIONS.map((s) => s.key))}
                  >
                    {allSelected ? 'Clear all' : 'Select all'}
                  </button>
                </div>
                <div className="row g-2">
                  {EXPORT_SECTIONS.map((s) => {
                    const checked = selectedSections.includes(s.key)
                    return (
                      <div className="col-md-6" key={s.key}>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-secondary w-100 d-flex align-items-center gap-2 text-start"
                          style={{ fontSize: '0.75rem' }}
                          onClick={() => toggleSection(s.key)}
                        >
                          {checked ? <CheckSquare size={13} className="text-primary" /> : <Square size={13} />}
                          {s.label}
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/*  Date range  */}
            {(scope === 'custom_range' || scope === 'full_report') && (
              <div className="mb-3">
                <label className="form-label small fw-semibold d-flex align-items-center gap-1">
                  <CalendarRange size={13} /> Date Range
                  <span className="text-muted fw-normal">(optional — filters transaction sections)</span>
                </label>
                <div className="row g-2">
                  <div className="col-md-6">
                    <input type="date" className="form-control form-control-sm" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
                  </div>
                  <div className="col-md-6">
                    <input type="date" className="form-control form-control-sm" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
                  </div>
                </div>
              </div>
            )}

            {/* ── Preview toggle ── */}
            <div className="d-flex align-items-center justify-content-between border-top pt-3 mb-2">
              <span className="fw-semibold" style={{ fontSize: '0.82rem' }}>Report Preview</span>
              <button className="btn btn-sm btn-outline-primary" onClick={() => setShowPreview((v) => !v)}>
                {showPreview ? 'Hide Preview' : 'Show Preview'}
              </button>
            </div>

            {showPreview && (
              <div className="border rounded-3 p-3" style={{ background: '#fbfcfe', maxHeight: 320, overflowY: 'auto' }}>
                {previewLoading ? (
                  <div className="text-center py-3"><span className="spinner-border spinner-border-sm me-2" />Building preview…</div>
                ) : preview ? (
                  <>
                    <div className="d-flex flex-wrap gap-3 mb-3">
                      <div className="text-center">
                        <div className="fw-bold text-primary" style={{ fontSize: '1.1rem' }}>{preview.sections ? Object.keys(preview.sections).length : 0}</div>
                        <div className="text-muted" style={{ fontSize: '0.68rem' }}>Sections</div>
                      </div>
                      <div className="text-center">
                        <div className="fw-bold text-primary" style={{ fontSize: '1.1rem' }}>{preview.rows?.length ?? 0}</div>
                        <div className="text-muted" style={{ fontSize: '0.68rem' }}>Data Rows</div>
                      </div>
                      <div className="text-center">
                        <div className="fw-bold text-primary" style={{ fontSize: '1.1rem' }}>{preview.kpis?.total_documents ?? 0}</div>
                        <div className="text-muted" style={{ fontSize: '0.68rem' }}>Documents</div>
                      </div>
                      <div className="text-center">
                        <div className="fw-bold text-primary" style={{ fontSize: '1.1rem' }}>{preview.kpis?.total_events ?? 0}</div>
                        <div className="text-muted" style={{ fontSize: '0.68rem' }}>History Events</div>
                      </div>
                    </div>

                    {Object.entries(preview.sections ?? {}).map(([key, fields]) => (
                      <div key={key} className="mb-3">
                        <div className="fw-semibold mb-1" style={{ fontSize: '0.78rem', color: '#1e40af' }}>
                          {previewSectionLabel(key)}
                        </div>
                        <table className="table table-sm mb-0" style={{ fontSize: '0.72rem' }}>
                          <tbody>
                            {Object.entries(fields).map(([f, v]) => (
                              <tr key={f}>
                                <td className="text-muted" style={{ width: '40%' }}>{f.replace(/_/g, ' ')}</td>
                                <td className="fw-semibold">{stringify(v)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ))}
                  </>
                ) : (
                  <div className="text-muted text-center py-3" style={{ fontSize: '0.8rem' }}>Preview unavailable.</div>
                )}
              </div>
            )}

            {/* ── Status ── */}
            {status && (
              <div className={`alert ${status.type === 'success' ? 'alert-success' : 'alert-danger'} py-2 small mt-3 mb-0 d-flex align-items-center gap-2`}>
                <AlertCircle size={14} /> {status.text}
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={onClose}>Close</button>
            <button
              className="btn btn-primary d-flex align-items-center gap-1"
              disabled={exportMutation.isPending || (scope === 'selected_sections' && selectedSections.length === 0)}
              onClick={() => { setStatus(null); exportMutation.mutate() }}
            >
              {exportMutation.isPending ? (
                <><span className="spinner-border spinner-border-sm me-1" />Generating…</>
              ) : (
                <><Download size={14} /> Export {format === 'excel' ? 'Excel' : format.toUpperCase()}</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function previewSectionLabel(key) {
  const found = EXPORT_SECTIONS.find((s) => s.key === key)
  return found?.label ?? key
}