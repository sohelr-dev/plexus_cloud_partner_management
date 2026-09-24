import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { CheckCircle, XCircle, AlertTriangle, ShieldCheck, Loader2, X } from 'lucide-react'
import api from '../../api/client'

/**
 * Handles Partner status changes and approvals.
 */
export default function StatusActionModal({ isOpen, onClose, partner, mode = 'status_change' }) {
  const queryClient = useQueryClient()
  const [decision, setDecision] = useState('Approved')
  const [targetStatus, setTargetStatus] = useState(partner?.status ?? 'Active')
  const [reason, setReason] = useState('')
  const [error, setError] = useState(null)

  // Status Change Mutation
  const statusMutation = useMutation({
    mutationFn: async () => {
      const res = await api.put(`/partners/${partner.id}/status`, {
        status: targetStatus,
        reason: reason,
      })
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['partners'])
      queryClient.invalidateQueries(['partner', String(partner.id)])
      onClose()
    },
    onError: (err) => {
      setError(err?.response?.data?.message ?? 'Failed to update partner status')
    },
  })

  // Approval Mutation
  const approveMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post(`/partners/${partner.id}/approve`, {
        decision: decision,
        reason: reason,
      })
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['partners'])
      queryClient.invalidateQueries(['partner', String(partner.id)])
      onClose()
    },
    onError: (err) => {
      setError(err?.response?.data?.message ?? 'Failed to process approval request')
    },
  })

  if (!isOpen || !partner) return null

  const isPending = statusMutation.isPending || approveMutation.isPending

  const handleSubmit = (e) => {
    e.preventDefault()
    setError(null)
    if (mode === 'approve') {
      approveMutation.mutate()
    } else {
      statusMutation.mutate()
    }
  }

  return (
    <div
      className="modal fade show d-block"
      tabIndex="-1"
      style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)' }}
    >
      <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: 500 }}>
        <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '16px', overflow: 'hidden' }}>
          {/* Modal Header */}
          <div className="modal-header border-bottom px-4 py-3 bg-light">
            <div className="d-flex align-items-center gap-2">
              {mode === 'approve' ? (
                <ShieldCheck className="text-primary" size={22} />
              ) : (
                <AlertTriangle className="text-warning" size={22} />
              )}
              <h5 className="modal-title fw-bold text-dark mb-0" style={{ fontSize: '1.05rem' }}>
                {mode === 'approve' ? 'Partner Approval Decision' : 'Update Partner Status'}
              </h5>
            </div>
            <button
              type="button"
              className="btn-close"
              onClick={onClose}
              disabled={isPending}
            ></button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="modal-body p-4">
              {/* Partner Banner */}
              <div className="p-3 bg-primary-subtle bg-opacity-10 border border-primary-subtle rounded-3 mb-3">
                <div className="fw-bold text-dark">{partner.partner_name}</div>
                <div className="text-muted small">
                  {partner.partner_code} ({partner.partner_id}) • Current Status:{' '}
                  <span className="badge bg-secondary ms-1">{partner.status}</span>
                </div>
              </div>

              {error && (
                <div className="alert alert-danger py-2 px-3 mb-3 small" role="alert">
                  {error}
                </div>
              )}

              {/* Mode 1: APPROVE / REJECT */}
              {mode === 'approve' ? (
                <div className="mb-3">
                  <label className="form-label fw-medium style-sm">Approval Decision *</label>
                  <div className="d-flex gap-2">
                    <button
                      type="button"
                      className={`btn flex-grow-1 d-flex align-items-center justify-content-center gap-2 py-2.5 fw-semibold ${
                        decision === 'Approved' ? 'btn-success text-white' : 'btn-outline-success'
                      }`}
                      onClick={() => setDecision('Approved')}
                    >
                      <CheckCircle size={18} /> Approve Partner
                    </button>
                    <button
                      type="button"
                      className={`btn flex-grow-1 d-flex align-items-center justify-content-center gap-2 py-2.5 fw-semibold ${
                        decision === 'Rejected' ? 'btn-danger text-white' : 'btn-outline-danger'
                      }`}
                      onClick={() => setDecision('Rejected')}
                    >
                      <XCircle size={18} /> Reject Partner
                    </button>
                  </div>
                </div>
              ) : (
                /* Mode 2: STATUS CHANGE */
                <div className="mb-3">
                  <label className="form-label fw-medium style-sm">Select New Status *</label>
                  <select
                    className="form-select"
                    value={targetStatus}
                    onChange={(e) => setTargetStatus(e.target.value)}
                    required
                  >
                    <option value="Active">Active (Operational)</option>
                    <option value="Pending Approval">Pending Approval</option>
                    <option value="Under Review">Under Review</option>
                    <option value="Suspended">Suspended (Temporary Hold)</option>
                    <option value="Blocked">Blocked (Restricted Access)</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Terminated">Terminated (Contract Ended)</option>
                  </select>
                </div>
              )}

              {/* Reason / Approval Notes */}
              <div className="mb-2">
                <label className="form-label fw-medium style-sm">
                  Reason / Management Notes {mode === 'approve' ? '*' : '(Optional)'}
                </label>
                <textarea
                  className="form-control"
                  rows="3"
                  placeholder={
                    mode === 'approve'
                      ? 'Enter approval rationale or rejection reason...'
                      : 'State reason for status update (recorded in Audit Trail)...'
                  }
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  required={mode === 'approve'}
                ></textarea>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="modal-footer border-top px-4 py-3 bg-light">
              <button
                type="button"
                className="btn btn-ghost text-secondary me-2"
                onClick={onClose}
                disabled={isPending}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={`btn ${
                  mode === 'approve' && decision === 'Rejected' ? 'btn-danger' : 'btn-primary'
                } px-4 d-flex align-items-center gap-2`}
                disabled={isPending}
              >
                {isPending && <Loader2 className="spin" size={16} />}
                Confirm {mode === 'approve' ? decision : 'Status Update'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
