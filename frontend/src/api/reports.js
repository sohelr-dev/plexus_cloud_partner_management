import api from './client'

export const fetchReportTypes = async () => {
  const { data } = await api.get('/reports/types')
  return data
}

export const fetchReportData = async (type, params = {}) => {
  const { data } = await api.get(`/reports/${type}/data`, { params })
  return data
}

/**
 * Serialize params to query string with proper array support.
 * e.g. sections: ['a','b'] → sections[]=a&sections[]=b
 */
function paramsSerializer(params) {
  const parts = []
  for (const [key, val] of Object.entries(params)) {
    if (val === undefined || val === null || val === '') continue
    if (Array.isArray(val)) {
      val.forEach((v) => parts.push(`${encodeURIComponent(key)}[]=${encodeURIComponent(v)}`))
    } else {
      parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(val)}`)
    }
  }
  return parts.join('&')
}

/**
 * Download a blob response from the API and trigger browser download.
 */
async function triggerDownload(axiosPromise, fallbackFilename) {
  const response = await axiosPromise

  // Try to get filename from Content-Disposition header (needs cors exposed_headers)
  const disposition = response.headers['content-disposition']
  let filename = fallbackFilename
  if (disposition) {
    const match = disposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/)
    if (match && match[1]) filename = match[1].replace(/['"]/g, '').trim()
  }

  const blob = new Blob([response.data], {
    type: response.headers['content-type'] || 'application/octet-stream',
  })
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  window.URL.revokeObjectURL(url)
}

/**
 * Open a print window by loading HTML content from the API.
 */
async function triggerPrint(endpoint, params) {
  const response = await api.get(endpoint, {
    params,
    paramsSerializer,
    headers: { Accept: 'text/html' },
  })
  const win = window.open('', '_blank')
  if (!win) {
    alert('Pop-ups are blocked. Please allow pop-ups for this site and try again.')
    return
  }
  win.document.write(typeof response.data === 'string' ? response.data : JSON.stringify(response.data))
  win.document.close()
  win.focus()
  setTimeout(() => win.print(), 600)
}

// ─── Domain Reports (7 types) ──────────────────────────────────────────────

export const downloadReport = async (type, params = {}, format = 'pdf') => {
  const cleanParams = {}
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') cleanParams[k] = v
  })

  if (format === 'print') {
    await triggerPrint(`/reports/${type}/export`, { ...cleanParams, format })
    return
  }

  const ext = format === 'excel' ? 'xlsx' : format
  const filename = `${type}_report_${new Date().toISOString().slice(0, 10)}.${ext}`

  await triggerDownload(
    api.get(`/reports/${type}/export`, {
      params: { ...cleanParams, format },
      paramsSerializer,
      responseType: 'blob',
    }),
    filename
  )
}

// ─── Full Partner Profile Report (18 sections) ─────────────────────────────

export const downloadPartnerFullReport = async (partnerId, params = {}, format = 'pdf') => {
  const cleanParams = {}
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') cleanParams[k] = v
  })

  if (format === 'print') {
    await triggerPrint(`/partners/${partnerId}/export`, { ...cleanParams, format })
    return
  }

  const ext = format === 'excel' ? 'xlsx' : format
  const filename = `partner_${partnerId}_full_report_${new Date().toISOString().slice(0, 10)}.${ext}`

  await triggerDownload(
    api.get(`/partners/${partnerId}/export`, {
      params: { ...cleanParams, format },
      paramsSerializer,
      responseType: 'blob',
    }),
    filename
  )
}
