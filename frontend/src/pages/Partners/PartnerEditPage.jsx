import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Save, AlertCircle, Loader2 } from 'lucide-react'
import api from '../../api/client'

export default function PartnerEditPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [error, setError] = useState(null)

  const [formData, setFormData] = useState({
    partner_name: '',
    partner_type: '',
    contact_person: '',
    contact_number: '',
    email: '',
    status: '',
  })

  // Fetch partner data
  const { data: partner, isLoading: isFetching } = useQuery({
    queryKey: ['partner', id],
    queryFn: async () => {
      const res = await api.get(`/partners/${id}`)
      return res.data.data ?? res.data
    }
  })

  useEffect(() => {
    if (partner) {
      setFormData({
        partner_name: partner.partner_name ?? '',
        partner_type: partner.partner_type ?? '',
        contact_person: partner.contact_person ?? '',
        contact_number: partner.contact_number ?? '',
        email: partner.email ?? '',
        status: partner.status ?? 'Pending Approval',
      })
    }
  }, [partner])

  const { mutate, isPending } = useMutation({
    mutationFn: async (data) => {
      const res = await api.put(`/partners/${id}`, data)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['partners'])
      queryClient.invalidateQueries(['partner', id])
      navigate('/partners')
    },
    onError: (err) => {
      setError(
        err?.response?.data?.message ??
        Object.values(err?.response?.data?.errors ?? {})[0]?.[0] ??
        'Failed to update partner'
      )
    }
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setError(null)
    mutate(formData)
  }

  if (isFetching) {
    return (
      <div className="pm-page pm-loading">
        <Loader2 className="spin text-primary mb-2" size={32} />
        <div className="text-secondary">Loading...</div>
      </div>
    )
  }

  return (
    <div className="pm-page">
      <div className="pm-page-header">
        <div>
          <button 
            onClick={() => navigate('/partners')}
            className="btn btn-link text-decoration-none p-0 mb-2 d-flex align-items-center gap-1 text-secondary"
            style={{ fontSize: '0.85rem' }}
          >
            <ArrowLeft size={16} /> Back to Directory
          </button>
          <h1 className="pm-page-title">Edit Partner: {partner?.partner_code}</h1>
          <p className="pm-page-subtitle">Update information for {partner?.partner_name}</p>
        </div>
      </div>

      <div className="pm-card mx-auto mt-4" style={{ maxWidth: 600 }}>
        {error && (
          <div className="pm-error-box p-3 mb-4 rounded bg-danger-subtle text-danger" style={{ textAlign: 'left', display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
            <AlertCircle size={20} className="me-2 flex-shrink-0" />
            <div>{error}</div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="pm-auth-label">Partner Name *</label>
            <input
              type="text"
              name="partner_name"
              className="pm-auth-input px-3"
              value={formData.partner_name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="row">
            <div className="col-md-6 mb-3">
              <label className="pm-auth-label">Partner Type *</label>
              <select
                name="partner_type"
                className="pm-auth-input px-3"
                value={formData.partner_type}
                onChange={handleChange}
                required
              >
                <option value="" disabled>Select Type</option>
                <option value="ISP">ISP</option>
                <option value="Reseller">Reseller</option>
                <option value="Distributor">Distributor</option>
                <option value="Corporate">Corporate</option>
                <option value="Individual">Individual</option>
              </select>
            </div>
            
            <div className="col-md-6 mb-3">
              <label className="pm-auth-label">Status</label>
              <select
                name="status"
                className="pm-auth-input px-3"
                value={formData.status}
                onChange={handleChange}
                required
              >
                <option value="Draft">Draft</option>
                <option value="Pending Approval">Pending Approval</option>
                <option value="Active">Active</option>
                <option value="Suspended">Suspended</option>
                <option value="Blocked">Blocked</option>
                <option value="Inactive">Inactive</option>
                <option value="Terminated">Terminated</option>
              </select>
            </div>
          </div>

          <div className="row">
            <div className="col-md-6 mb-3">
              <label className="pm-auth-label">Contact Person</label>
              <input
                type="text"
                name="contact_person"
                className="pm-auth-input px-3"
                value={formData.contact_person}
                onChange={handleChange}
              />
            </div>
            <div className="col-md-6 mb-3">
              <label className="pm-auth-label">Contact Number</label>
              <input
                type="tel"
                name="contact_number"
                className="pm-auth-input px-3"
                value={formData.contact_number}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="pm-auth-label">Email Address</label>
            <input
              type="email"
              name="email"
              className="pm-auth-input px-3"
              value={formData.email}
              onChange={handleChange}
            />
          </div>
          
          <div className="d-flex justify-content-end gap-2">
            <button 
              type="button" 
              className="pm-btn pm-btn-ghost"
              onClick={() => navigate('/partners')}
              disabled={isPending}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="pm-btn pm-btn-primary"
              disabled={isPending}
            >
              {isPending ? <Loader2 className="spin" size={18} /> : <Save size={18} />}
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
