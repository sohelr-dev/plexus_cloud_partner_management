import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  FileText,
  Download,
  Printer,
  FileSpreadsheet,
  Filter,
  Search,
  RefreshCw,
  Building2,
  DollarSign,
  Wifi,
  Server,
  Percent,
  TrendingUp,
  ShieldAlert,
  Calendar,
  CheckCircle2,
  Layers,
  ArrowUpRight,
  ExternalLink,
  Eye,
  ChevronDown,
  ChevronRight,
} from 'lucide-react'
import {
  fetchReportData,
  downloadReport,
  downloadPartnerFullReport,
} from '../../api/reports'
import api from '../../api/client'

const REPORT_TABS = [
  { key: 'partner',        label: 'Partner Performance', icon: Building2, desc: 'Revenue, profit, ROI, health score per partner' },
  { key: 'financial',      label: 'Financial & P&L',      icon: DollarSign, desc: 'Invoiced, collected, margin %, outstanding balances' },
  { key: 'marketing',      label: 'Marketing & Churn',    icon: TrendingUp, desc: 'Customer growth, churn rates, acquisitions' },
  { key: 'bandwidth',      label: 'Bandwidth & Usage',    icon: Wifi,       desc: 'Allocated capacity, peak usage, utilization %' },
  { key: 'equipment',      label: 'Equipment & Assets',   icon: Server,     desc: 'Inventory status, warranty expiry, asset values' },
  { key: 'commission',     label: 'Commission Payouts',   icon: Percent,    desc: 'Approved, pending, payable, and paid commissions' },
  { key: 'support_center', label: 'Support Centers',      icon: Layers,     desc: 'Branch operational costs, staff, coverage areas' },
  { key: 'full_partner',   label: 'Full Partner Report',  icon: FileText,   desc: 'PRD Section 83 — Complete 18-section profile report' },
]

const FULL_REPORT_SECTIONS = [
  { key: 'partner_information',  label: '1. Partner Information' },
  { key: 'business_information', label: '2. Business Information' },
  { key: 'marketing',            label: '3. Marketing Analysis' },
  { key: 'revenue',              label: '4. Revenue' },
  { key: 'cost',                 label: '5. Cost' },
  { key: 'pnl',                  label: '6. Profit & Loss' },
  { key: 'roi',                  label: '7. Return on Investment (ROI)' },
  { key: 'bandwidth',            label: '8. Bandwidth Allocation' },
  { key: 'bandwidth_history',    label: '9. Bandwidth History' },
  { key: 'equipment',            label: '10. Network Equipment' },
  { key: 'users_devices',        label: '11. End Devices' },
  { key: 'commission',           label: '12. Commission' },
  { key: 'support_centers',      label: '13. Support Centers / Branches' },
  { key: 'documents',            label: '14. Documents & Compliance' },
  { key: 'health',               label: '15. Health Score' },
  { key: 'risk',                 label: '16. Risk Analysis' },
  { key: 'insights',             label: '17. Management Insights' },
  { key: 'history',              label: '18. Timeline & History' },
]

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState('partner')
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    partner_id: '',
    date_from: '',
    date_to: '',
  })
  const [exportingFormat, setExportingFormat] = useState(null)

  const [selectedPartnerId, setSelectedPartnerId] = useState('')
  const [fullReportScope, setFullReportScope] = useState('full_report')
  const [selectedSections, setSelectedSections] = useState(FULL_REPORT_SECTIONS.map(s => s.key))
  const [showPreview, setShowPreview] = useState(false)
  const [expandedSection, setExpandedSection] = useState(null)

  const { data: partnersData } = useQuery({
    queryKey: ['partners-lookup-reports'],
    queryFn: async () => {
      const { data } = await api.get('/partners?per_page=100')
      return data.data || []
    },
  })

  useEffect(() => {
    if (partnersData && partnersData.length > 0 && !selectedPartnerId) {
      setSelectedPartnerId(partnersData[0].id)
    }
  }, [partnersData, selectedPartnerId])

  // Fetch domain report data
  const {
    data: reportResult,
    isLoading,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ['report-data', activeTab, filters],
    queryFn: () => fetchReportData(activeTab, filters),
    enabled: activeTab !== 'full_partner',
  })

  // Fetch full partner report preview
  const {
    data: previewResult,
    isLoading: previewLoading,
    refetch: refetchPreview,
  } = useQuery({
    queryKey: ['full-partner-preview', selectedPartnerId, filters.date_from, filters.date_to, selectedSections],
    queryFn: () => api.get(`/partners/${selectedPartnerId}/export/preview`, {
      params: {
        scope: fullReportScope,
        sections: selectedSections,
        date_from: filters.date_from || undefined,
        date_to: filters.date_to || undefined,
      },
      paramsSerializer: (params) => {
        const parts = []
        Object.entries(params).forEach(([k, v]) => {
          if (Array.isArray(v)) v.forEach(val => parts.push(`${k}[]=${encodeURIComponent(val)}`))
          else if (v !== undefined && v !== '') parts.push(`${k}=${encodeURIComponent(v)}`)
        })
        return parts.join('&')
      },
    }).then(r => r.data),
    enabled: activeTab === 'full_partner' && !!selectedPartnerId && showPreview,
  })

  const reportData = reportResult?.data || { summary: {}, columns: [], rows: [] }

  const handleExport = async (format) => {
    try {
      setExportingFormat(format)
      if (activeTab === 'full_partner') {
        if (!selectedPartnerId) {
          alert('Please select a partner first.')
          return
        }
        await downloadPartnerFullReport(
          selectedPartnerId,
          {
            scope: fullReportScope,
            sections: selectedSections,
            date_from: filters.date_from,
            date_to: filters.date_to,
          },
          format
        )
      } else {
        await downloadReport(activeTab, filters, format)
      }
    } catch (err) {
      console.error(err)
      alert(`Export failed: ${err.message || 'Unknown error'}`)
    } finally {
      setExportingFormat(null)
    }
  }

  const toggleSection = (key) => {
    if (selectedSections.includes(key)) {
      if (selectedSections.length === 1) return
      setSelectedSections(selectedSections.filter(s => s !== key))
    } else {
      setSelectedSections([...selectedSections, key])
    }
  }

  const selectAllSections = () => {
    setSelectedSections(FULL_REPORT_SECTIONS.map(s => s.key))
  }

  return (
    <div className="container-fluid p-3 p-md-4">
      {/* Page Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3 mb-4">
        <div>
          <h4 className="fw-bold mb-1 d-flex align-items-center gap-2">
            <FileText className="text-primary" size={24} />
            Executive Reports & Analytics Hub
          </h4>
          
        </div>

        {/* Global Export Action Buttons */}
        <div className="d-flex flex-wrap gap-2">
          <button
            className="btn btn-outline-danger btn-sm d-flex align-items-center gap-1.5 px-3 shadow-sm"
            onClick={() => handleExport('pdf')}
            disabled={exportingFormat !== null}
            title="Download formatted PDF report"
          >
            <Download size={15} />
            {exportingFormat === 'pdf' ? 'Generating...' : 'Export PDF'}
          </button>
          <button
            className="btn btn-outline-success btn-sm d-flex align-items-center gap-1.5 px-3 shadow-sm"
            onClick={() => handleExport('excel')}
            disabled={exportingFormat !== null}
            title="Download Excel spreadsheet"
          >
            <FileSpreadsheet size={15} />
            {exportingFormat === 'excel' ? 'Exporting...' : 'Export Excel'}
          </button>
          <button
            className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1.5 px-3 shadow-sm"
            onClick={() => handleExport('csv')}
            disabled={exportingFormat !== null}
            title="Download CSV raw data"
          >
            <FileText size={15} />
            {exportingFormat === 'csv' ? 'Exporting...' : 'Export CSV'}
          </button>
          <button
            className="btn btn-outline-primary btn-sm d-flex align-items-center gap-1.5 px-3 shadow-sm"
            onClick={() => handleExport('print')}
            disabled={exportingFormat !== null}
            title="Print or Save via Browser"
          >
            <Printer size={15} />
            Print
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="card shadow-sm border-0 mb-4 bg-body-tertiary">
        <div className="card-body p-2">
          <div className="nav nav-pills flex-nowrap overflow-x-auto gap-1 pb-1">
            {REPORT_TABS.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.key
              return (
                <button
                  key={tab.key}
                  className={`nav-link text-nowrap d-flex align-items-center gap-2 py-2 px-3 rounded-3 ${
                    isActive ? 'active bg-primary text-white shadow-sm' : 'text-body-secondary'
                  }`}
                  onClick={() => setActiveTab(tab.key)}
                >
                  <Icon size={16} />
                  <span className="fw-semibold small">{tab.label}</span>
                  {tab.key === 'full_partner' && (
                    <span className="badge bg-warning text-dark" style={{ fontSize: '0.65rem' }}>18 Sec</span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {activeTab === 'full_partner' ? (
        /* Full Partner Master Report */
        <div className="row g-4">
          <div className="col-lg-4">
            <div className="card shadow-sm border-0 rounded-4">
              <div className="card-header bg-transparent border-0 pt-4 px-4 pb-0">
                <h6 className="fw-bold mb-1 d-flex align-items-center gap-2">
                  <Building2 size={18} className="text-primary" />
                  Select Partner & Parameters
                </h6>
                <p className="text-secondary small">Choose the partner to generate the comprehensive report</p>
              </div>
              <div className="card-body px-4 pb-4">
                <div className="mb-3">
                  <label className="form-label small fw-semibold">Target Partner</label>
                  <select
                    className="form-select form-select-sm"
                    value={selectedPartnerId}
                    onChange={(e) => setSelectedPartnerId(e.target.value)}
                  >
                    <option value="">-- Choose Partner --</option>
                    {partnersData?.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.partner_id} — {p.partner_name} ({p.status})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-3">
                  <label className="form-label small fw-semibold">Report Scope</label>
                  <div className="d-flex flex-column gap-2">
                    <label className="form-check small">
                      <input
                        type="radio"
                        name="scope"
                        className="form-check-input"
                        checked={fullReportScope === 'full_report'}
                        onChange={() => {
                          setFullReportScope('full_report')
                          selectAllSections()
                        }}
                      />
                      <span><strong>Full Partner Report</strong> (All 18 PRD Sections)</span>
                    </label>
                    <label className="form-check small">
                      <input
                        type="radio"
                        name="scope"
                        className="form-check-input"
                        checked={fullReportScope === 'selected_sections'}
                        onChange={() => setFullReportScope('selected_sections')}
                      />
                      <span><strong>Selected Sections</strong> (Custom checklist)</span>
                    </label>
                  </div>
                </div>

                <div className="row g-2 mb-3">
                  <div className="col-6">
                    <label className="form-label small text-secondary">Date From</label>
                    <input
                      type="date"
                      className="form-control form-control-sm"
                      value={filters.date_from}
                      onChange={(e) => setFilters({ ...filters, date_from: e.target.value })}
                    />
                  </div>
                  <div className="col-6">
                    <label className="form-label small text-secondary">Date To</label>
                    <input
                      type="date"
                      className="form-control form-control-sm"
                      value={filters.date_to}
                      onChange={(e) => setFilters({ ...filters, date_to: e.target.value })}
                    />
                  </div>
                </div>

                <div className="d-grid gap-2 pt-2 border-top">
                  <button
                    className="btn btn-outline-info btn-sm d-flex align-items-center justify-content-center gap-2"
                    onClick={() => { setShowPreview(true); setExpandedSection(null) }}
                    disabled={!selectedPartnerId || previewLoading}
                  >
                    {previewLoading
                      ? <><span className="spinner-border spinner-border-sm" /> Loading Preview...</>
                      : <><Eye size={15} /> Preview Report Data</>
                    }
                  </button>
                  <button
                    className="btn btn-primary d-flex align-items-center justify-content-center gap-2 shadow-sm"
                    onClick={() => handleExport('pdf')}
                    disabled={exportingFormat !== null || !selectedPartnerId}
                  >
                    <Download size={16} />
                    {exportingFormat === 'pdf' ? 'Generating PDF...' : 'Download Full PDF Report'}
                  </button>
                  <button
                    className="btn btn-outline-success btn-sm d-flex align-items-center justify-content-center gap-2"
                    onClick={() => handleExport('excel')}
                    disabled={exportingFormat !== null || !selectedPartnerId}
                  >
                    <FileSpreadsheet size={16} />
                    Export Full Excel Spreadsheet
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="col-lg-8">
            <div className="card shadow-sm border-0 rounded-4">
              <div className="card-header bg-transparent border-0 pt-4 px-4 pb-2 d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="fw-bold mb-1">Report Sections</h6>
                  <p className="text-secondary small mb-0">Check or uncheck sections to include in the exported document</p>
                </div>
                {fullReportScope === 'selected_sections' && (
                  <button className="btn btn-sm btn-link text-decoration-none" onClick={selectAllSections}>
                    Select All
                  </button>
                )}
              </div>
              <div className="card-body p-4">
                <div className="row g-2">
                  {FULL_REPORT_SECTIONS.map((sec) => {
                    const isChecked = selectedSections.includes(sec.key)
                    return (
                      <div key={sec.key} className="col-md-6">
                        <div
                          className={`p-2.5 rounded-3 border d-flex align-items-center gap-2 cursor-pointer transition ${
                            isChecked ? 'border-primary-subtle bg-primary-subtle bg-opacity-25' : 'border-light-subtle'
                          }`}
                          onClick={() => fullReportScope === 'selected_sections' && toggleSection(sec.key)}
                          style={{ cursor: fullReportScope === 'selected_sections' ? 'pointer' : 'default' }}
                        >
                          <input
                            type="checkbox"
                            className="form-check-input mt-0"
                            checked={isChecked}
                            disabled={fullReportScope === 'full_report'}
                            onChange={() => {}}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (fullReportScope === 'selected_sections') toggleSection(sec.key);
                            }}
                          />
                          <span className={`small ${isChecked ? 'fw-semibold text-body' : 'text-secondary'}`}>
                            {sec.label}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>

                <div className="alert alert-info border-0 rounded-3 mt-4 mb-0 d-flex gap-3 align-items-center">
                  <CheckCircle2 size={24} className="text-info flex-shrink-0" />
                  <div className="small">
                    <strong>Audit & Compliance Verified:</strong> This full partner report consolidates CRM, network bandwidth history, equipment lifecycle, commission reconciliations, P&L audit numbers, and AI health/risk insights into an executive-ready package.
                  </div>
                </div>
              </div>
            </div>

            {/* Preview Panel */}
            {showPreview && (
              <div className="card shadow-sm border-0 rounded-4 mt-4">
                <div className="card-header bg-transparent border-0 pt-3 px-4 pb-2 d-flex justify-content-between align-items-center">
                  <div>
                    <h6 className="fw-bold mb-0 d-flex align-items-center gap-2">
                      <Eye size={16} className="text-info" />
                      Report Preview
                      {previewResult?.data?.partner && (
                        <span className="badge bg-primary-subtle text-primary ms-1" style={{ fontSize: '0.72rem' }}>
                          {previewResult.data.partner.partner_name}
                        </span>
                      )}
                    </h6>
                    <p className="text-secondary small mb-0">
                      {previewResult?.data?.sections ? Object.keys(previewResult.data.sections).length : 0} sections &bull; click section to expand
                    </p>
                  </div>
                  <button className="btn btn-sm btn-outline-secondary" onClick={() => setShowPreview(false)}>✕</button>
                </div>
                <div className="card-body px-3 pb-3 pt-0">
                  {previewLoading ? (
                    <div className="text-center py-4 text-secondary">
                      <div className="spinner-border spinner-border-sm text-primary me-2" />
                      Loading report preview...
                    </div>
                  ) : previewResult?.data?.sections ? (
                    <div className="d-flex flex-column gap-2">
                      {Object.entries(previewResult.data.sections).map(([sKey, sData]) => {
                        const secLabel = FULL_REPORT_SECTIONS.find(s => s.key === sKey)?.label || sKey
                        const isExpanded = expandedSection === sKey
                        const fieldCount = sData && typeof sData === 'object' ? Object.keys(sData).length : 0
                        return (
                          <div key={sKey} className="border rounded-3 overflow-hidden">
                            <button
                              className="w-100 btn btn-light d-flex justify-content-between align-items-center px-3 py-2 rounded-0 border-0 text-start"
                              onClick={() => setExpandedSection(isExpanded ? null : sKey)}
                            >
                              <span className="fw-semibold small text-body">{secLabel}</span>
                              <div className="d-flex align-items-center gap-2">
                                <span className="badge bg-secondary-subtle text-secondary" style={{ fontSize: '0.65rem' }}>{fieldCount} fields</span>
                                {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                              </div>
                            </button>
                            {isExpanded && sData && typeof sData === 'object' && (
                              <table className="table table-sm table-hover mb-0" style={{ fontSize: '0.8rem' }}>
                                <tbody>
                                  {Object.entries(sData).map(([field, val]) => (
                                    <tr key={field}>
                                      <td className="text-secondary ps-3 py-1" style={{ width: '42%' }}>
                                        {field.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                                      </td>
                                      <td className="fw-medium py-1 pe-3">
                                        {val === null || val === undefined || val === ''
                                          ? <span className="text-secondary">—</span>
                                          : typeof val === 'object'
                                          ? <span className="text-secondary small">{JSON.stringify(val)}</span>
                                          : String(val)
                                        }
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-secondary small">
                      Click "Preview Report Data" to load the report sections.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Domain Tab View  */
        <div>
          {/* Filter Bar */}
          <div className="card shadow-sm border-0 rounded-4 mb-4">
            <div className="card-body p-3">
              <div className="row g-2 align-items-center">
                <div className="col-md-3">
                  <div className="input-group input-group-sm">
                    <span className="input-group-text bg-transparent border-end-0">
                      <Search size={14} className="text-secondary" />
                    </span>
                    <input
                      type="text"
                      className="form-control border-start-0"
                      placeholder="Search partner or code..."
                      value={filters.search}
                      onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    />
                  </div>
                </div>

                <div className="col-md-2">
                  <select
                    className="form-select form-select-sm"
                    value={filters.status}
                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  >
                    <option value="">All Statuses</option>
                    <option value="Active">Active</option>
                    <option value="Pending Approval">Pending Approval</option>
                    <option value="Suspended">Suspended</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>

                <div className="col-md-2">
                  <select
                    className="form-select form-select-sm"
                    value={filters.partner_id}
                    onChange={(e) => setFilters({ ...filters, partner_id: e.target.value })}
                  >
                    <option value="">All Partners</option>
                    {partnersData?.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.partner_id} — {p.partner_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-md-2">
                  <input
                    type="date"
                    className="form-control form-control-sm"
                    value={filters.date_from}
                    onChange={(e) => setFilters({ ...filters, date_from: e.target.value })}
                    title="Date From"
                  />
                </div>

                <div className="col-md-2">
                  <input
                    type="date"
                    className="form-control form-control-sm"
                    value={filters.date_to}
                    onChange={(e) => setFilters({ ...filters, date_to: e.target.value })}
                    title="Date To"
                  />
                </div>

                <div className="col-md-1 d-flex justify-content-end">
                  <button
                    className="btn btn-outline-secondary btn-sm w-100 d-flex align-items-center justify-content-center"
                    onClick={() => refetch()}
                    disabled={isFetching}
                    title="Refresh Data"
                  >
                    <RefreshCw size={14} className={isFetching ? 'spin' : ''} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Summary KPI Cards */}
          {reportData.summary && Object.keys(reportData.summary).length > 0 && (
            <div className="row g-3 mb-4">
              {Object.entries(reportData.summary).map(([key, val]) => {
                const isCurrency = key.includes('revenue') || key.includes('cost') || key.includes('profit') || key.includes('paid') || key.includes('outstanding') || key.includes('value') || key.includes('generated') || key.includes('approved')
                const isPct = key.includes('pct') || key.includes('margin') || key.includes('rate') || key.includes('score')
                const formattedVal = isCurrency
                  ? `৳${Number(val).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                  : isPct
                  ? `${val}%`
                  : Number(val).toLocaleString()

                return (
                  <div key={key} className="col-6 col-md-4 col-lg-2">
                    <div className="card shadow-sm border-0 rounded-3 h-100 bg-body">
                      <div className="card-body p-3">
                        <div className="text-secondary small text-uppercase fw-semibold" style={{ fontSize: '0.68rem', letterSpacing: '0.5px' }}>
                          {key.replace(/_/g, ' ')}
                        </div>
                        <div className="fs-5 fw-bold mt-1 text-primary">
                          {formattedVal}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Interactive Data Table Card */}
          <div className="card shadow-sm border-0 rounded-4 overflow-hidden">
            <div className="card-header bg-transparent border-0 pt-3 px-3 d-flex justify-content-between align-items-center">
              <div>
                <h6 className="fw-bold mb-0">{REPORT_TABS.find(t => t.key === activeTab)?.label}</h6>
                <div className="text-secondary small">
                  Showing {reportData.rows?.length || 0} records
                </div>
              </div>
              <div className="text-secondary small d-flex align-items-center gap-2">
                <Calendar size={14} />
                <span>Generated: {new Date().toLocaleDateString()}</span>
              </div>
            </div>

            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0" style={{ fontSize: '0.85rem' }}>
                <thead className="table-light text-secondary text-uppercase small" style={{ fontSize: '0.72rem' }}>
                  <tr>
                    {reportData.columns?.map((col) => (
                      <th
                        key={col.key}
                        className={`py-3 px-3 ${['currency', 'number', 'percentage', 'score'].includes(col.format) ? 'text-end' : ''}`}
                      >
                        {col.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={reportData.columns?.length || 5} className="text-center py-5 text-secondary">
                        <div className="spinner-border spinner-border-sm text-primary me-2" role="status" />
                        Loading report data...
                      </td>
                    </tr>
                  ) : reportData.rows && reportData.rows.length > 0 ? (
                    reportData.rows.map((row, idx) => (
                      <tr key={idx}>
                        {reportData.columns?.map((col) => {
                          const val = row[col.key]
                          const fmt = col.format

                          let displayVal = val ?? '-'
                          if (fmt === 'currency' && typeof val === 'number') {
                            displayVal = `৳${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                          } else if (fmt === 'percentage' && typeof val === 'number') {
                            displayVal = `${val}%`
                          } else if (fmt === 'number' && typeof val === 'number') {
                            displayVal = val.toLocaleString()
                          } else if (fmt === 'score') {
                            displayVal = (
                              <span className={`badge ${val >= 75 ? 'bg-success-subtle text-success' : (val >= 60 ? 'bg-warning-subtle text-warning' : 'bg-danger-subtle text-danger')}`}>
                                {val} / 100
                              </span>
                            )
                          } else if (col.key === 'status') {
                            const badgeColor = ['Active', 'Approved', 'Completed', 'Paid'].includes(val)
                              ? 'bg-success-subtle text-success'
                              : ['Pending', 'Watch', 'Generated', 'Assigned'].includes(val)
                              ? 'bg-warning-subtle text-warning'
                              : 'bg-danger-subtle text-danger'
                            displayVal = <span className={`badge ${badgeColor}`}>{val}</span>
                          }

                          return (
                            <td
                              key={col.key}
                              className={`py-2.5 px-3 ${['currency', 'number', 'percentage', 'score'].includes(fmt) ? 'text-end' : ''}`}
                            >
                              {displayVal}
                            </td>
                          )
                        })}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={reportData.columns?.length || 5} className="text-center py-5 text-secondary">
                        No records found matching current filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
