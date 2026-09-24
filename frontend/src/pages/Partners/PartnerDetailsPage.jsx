import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Building2, MapPin, Mail, Phone, Calendar, Edit, ShieldAlert } from 'lucide-react'
import api from '../../api/client'

export default function PartnerDetailsPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const { data: partner, isLoading, isError, error } = useQuery({
    queryKey: ['partner', id],
    queryFn: async () => {
      const res = await api.get(`/partners/${id}`)
      return res.data.data ?? res.data
    }
  })

  if (isLoading) {
    return (
      <div className="pm-page pm-loading">
        <div className="spinner-border text-primary" />
        <div className="mt-2 text-secondary">Loading partner details...</div>
      </div>
    )
  }

  if (isError || !partner) {
    return (
      <div className="pm-page pm-loading">
        <ShieldAlert size={40} className="text-danger mb-2" />
        <div className="fw-semibold">Partner not found</div>
        <small className="text-secondary">{error?.message}</small>
        <button className="pm-btn pm-btn-ghost mt-3" onClick={() => navigate('/partners')}>
          Go Back
        </button>
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
          <div className="d-flex align-items-center gap-3">
            <div className="pm-partner-avatar" style={{ width: 48, height: 48, fontSize: '1.5rem' }}>
              {(partner.partner_name ?? '?').charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="pm-page-title mb-0">{partner.partner_name}</h1>
              <p className="pm-page-subtitle mb-0">{partner.partner_code} · {partner.partner_id}</p>
            </div>
          </div>
        </div>
        <Link to={`/partners/${id}/edit`} className="pm-btn pm-btn-outline text-decoration-none">
          <Edit size={18} /> Edit Partner
        </Link>
      </div>

      <div className="row g-4 mt-2">
        <div className="col-12 col-xl-8">
          <div className="pm-card h-100">
            <div className="pm-section-title mb-4">Core Information</div>
            
            <div className="row g-4">
              <div className="col-md-6">
                <div className="text-secondary small mb-1">Partner Type</div>
                <div className="fw-medium d-flex align-items-center gap-2">
                  <Building2 size={16} className="text-primary" /> {partner.partner_type ?? 'N/A'}
                </div>
              </div>
              <div className="col-md-6">
                <div className="text-secondary small mb-1">Status</div>
                <span className={`pm-badge ${partner.status === 'Active' ? 'pm-badge-success' : 'pm-badge-secondary'}`}>
                  {partner.status}
                </span>
              </div>
              
              <div className="col-12 border-top pt-3"></div>

              <div className="col-md-6">
                <div className="text-secondary small mb-1">Contact Person</div>
                <div className="fw-medium">{partner.contact_person ?? 'N/A'}</div>
              </div>
              <div className="col-md-6">
                <div className="text-secondary small mb-1">Contact Number</div>
                <div className="fw-medium d-flex align-items-center gap-2">
                  <Phone size={16} className="text-secondary" /> {partner.contact_number ?? 'N/A'}
                </div>
              </div>

              <div className="col-md-6">
                <div className="text-secondary small mb-1">Email Address</div>
                <div className="fw-medium d-flex align-items-center gap-2">
                  <Mail size={16} className="text-secondary" /> {partner.email ?? 'N/A'}
                </div>
              </div>
              <div className="col-md-6">
                <div className="text-secondary small mb-1">Partner Since</div>
                <div className="fw-medium d-flex align-items-center gap-2">
                  <Calendar size={16} className="text-secondary" /> 
                  {partner.partner_since ? new Date(partner.partner_since).toLocaleDateString() : 'N/A'}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-xl-4">
          <div className="pm-card h-100">
            <div className="pm-section-title mb-4">Location & Health</div>
            
            <div className="mb-4">
              <div className="text-secondary small mb-1">Territory / Area</div>
              <div className="fw-medium d-flex align-items-center gap-2">
                <MapPin size={16} className="text-danger" /> 
                {partner.territory?.name ?? 'Not Assigned'}
              </div>
            </div>

            <div className="mb-4">
              <div className="text-secondary small mb-2">Health Score</div>
              <div className="d-flex align-items-center gap-3">
                <div className="pm-health-label fs-3 fw-bold" style={{ color: partner.health_score >= 80 ? 'var(--green-500)' : partner.health_score >= 50 ? 'var(--amber-500)' : 'var(--red-500)' }}>
                  {partner.health_score ?? 0}%
                </div>
                <div className="flex-grow-1 pm-health-bar bg-light" style={{ height: 8 }}>
                  <div 
                    className="pm-health-fill" 
                    style={{ 
                      width: `${Math.max(0, Math.min(100, partner.health_score || 0))}%`,
                      backgroundColor: partner.health_score >= 80 ? 'var(--green-500)' : partner.health_score >= 50 ? 'var(--amber-500)' : 'var(--red-500)'
                    }} 
                  />
                </div>
              </div>
            </div>
            
            <div className="p-3 bg-light rounded text-center small text-secondary">
              Profile completeness and detailed analytics will be displayed here in future updates.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
