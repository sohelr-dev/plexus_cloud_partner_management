 import api from './client';


export const EXPORT_FORMATS = [
  { key: 'pdf', label: 'PDF', icon: 'FileText' },
  { key: 'excel', label: 'Excel', icon: 'FileSpreadsheet' },
  { key: 'csv', label: 'CSV', icon: 'FileSpreadsheet' },
  { key: 'print', label: 'Print', icon: 'Printer' },
];

export const EXPORT_SCOPES = [
  { key: 'current_view', label: 'Current View', hint: 'Key KPIs only' },
  { key: 'selected_sections', label: 'Selected Sections', hint: 'Choose what to include' },
  { key: 'full_report', label: 'Full Partner Report', hint: 'All 18 sections (Section 83)' },
  { key: 'custom_range', label: 'Custom Date Range', hint: 'Filter transaction sections' },
];

export const EXPORT_SECTIONS = [
  { key: 'partner_information', label: 'Partner Information' },
  { key: 'business_information', label: 'Business Information' },
  { key: 'marketing', label: 'Marketing Analysis' },
  { key: 'revenue', label: 'Revenue' },
  { key: 'cost', label: 'Cost' },
  { key: 'pnl', label: 'Profit & Loss' },
  { key: 'roi', label: 'ROI' },
  { key: 'bandwidth', label: 'Bandwidth' },
  { key: 'bandwidth_history', label: 'Bandwidth History' },
  { key: 'equipment', label: 'Equipment' },
  { key: 'users_devices', label: 'Users & Devices' },
  { key: 'commission', label: 'Commission' },
  { key: 'support_centers', label: 'Support Centers' },
  { key: 'documents', label: 'Documents' },
  { key: 'health', label: 'Health' },
  { key: 'risk', label: 'Risk' },
  { key: 'insights', label: 'Management Insights' },
  { key: 'history', label: 'History' },
];

export const fetchExportOptions = async (partnerId) => {
  const res = await api.get(`/partners/${partnerId}/export/options`);
  return res.data.data;
};


export const fetchExportPreview = async (partnerId, params) => {
  const res = await api.get(`/partners/${partnerId}/export/preview`, { params });
  return res.data.data;
};

export const downloadProfileExport = async (partnerId, params) => {
  const res = await api.get(`/partners/${partnerId}/export`, {
    params,
    responseType: 'blob',
  });

  const blob = new Blob([res.data], { type: res.headers['content-type'] });
  const url = window.URL.createObjectURL(blob);

  const disposition = res.headers['content-disposition'] ?? '';
  const match = /filename="?([^"]+)"?/.exec(disposition);
  const filename = match?.[1] ?? defaultFilename(params.format);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);

  return filename;
};

export const openPrintView = async (partnerId, params) => {
  const res = await api.get(`/partners/${partnerId}/export`, {
    params: { ...params, format: 'print' },
    responseType: 'text',
  });

  const win = window.open('', '_blank');
  if (win) {
    win.document.write(res.data);
    win.document.close();
  }

  return true;
};

function defaultFilename(format) {
  const stamp = new Date().toISOString().slice(0, 10);
  const ext = format === 'excel' ? 'xlsx' : format;
  return `partner-profile-${stamp}.${ext}`;
}