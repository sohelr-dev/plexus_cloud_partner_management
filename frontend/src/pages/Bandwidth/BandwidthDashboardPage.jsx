import React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Activity, CheckCircle2, XCircle, ArrowUpRight, ArrowDownRight, Clock } from 'lucide-react'
import api from '../../api/client'
import { approveBandwidthChange, rejectBandwidthChange } from '../../api/bandwidth'

export default function BandwidthDashboardPage() {
  const queryClient = useQueryClient()

  // Fetch all pending bandwidth changes
  const { data: pendingChanges, isLoading } = useQuery({
    queryKey: ['globalPendingBandwidthApprovals'],
    queryFn: async () => {
      const res = await api.get('/bandwidth/pending-approvals')
      return res.data.data
    }
  })

  const approveBwMutation = useMutation({
    mutationFn: ({ changeId, reason }) => approveBandwidthChange(changeId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries(['globalPendingBandwidthApprovals'])
    },
  })

  const rejectBwMutation = useMutation({
    mutationFn: ({ changeId, reason }) => rejectBandwidthChange(changeId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries(['globalPendingBandwidthApprovals'])
    },
  })

  return (
    <div className="container-fluid py-4 fade-in">
      <div className="d-flex justify-content-between align-items-end mb-4">
        <div>
          <h2 className="fw-bold mb-1 d-flex align-items-center gap-2">
            <Activity size={28} className="text-primary" />
            Bandwidth Management Center
          </h2>
          <p className="text-muted mb-0">Global overview of pending upgrade/downgrade requests </p>
        </div>
      </div>

      <div className="pm-card p-4">
        <h5 className="fw-bold mb-3 d-flex align-items-center gap-2">
          <Clock size={18} className="text-warning" /> 
          Pending Capacity Change Requests
        </h5>
        
        {isLoading ? (
          <div className="text-center py-4"><span className="spinner-border text-primary" /></div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle border mb-0">
              <thead className="table-light fs-7">
                <tr>
                  <th>Date</th>
                  <th>Partner</th>
                  <th>Service</th>
                  <th>Type</th>
                  <th>Change (Mbps)</th>
                  <th>Impact (Profit)</th>
                  <th>Reason</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody className="fs-7">
                {pendingChanges?.length > 0 ? (
                  pendingChanges.map(change => (
                    <tr key={change.id}>
                      <td>{new Date(change.created_at).toLocaleDateString()}</td>
                      <td className="fw-bold text-primary">{change.partner?.partner_code || 'Unknown'}</td>
                      <td>{change.allocation?.service || '-'}</td>
                      <td>
                        {change.change_type === 'Upgrade' ? (
                          <span className="badge bg-success-subtle text-success"><ArrowUpRight size={12}/> Upgrade</span>
                        ) : (
                          <span className="badge bg-danger-subtle text-danger"><ArrowDownRight size={12}/> {change.change_type}</span>
                        )}
                      </td>
                      <td className="fw-bold">
                        {change.previous_mbps} → {change.new_mbps} 
                        <span className="text-muted ms-1">({change.difference_mbps > 0 ? '+' : ''}{change.difference_mbps})</span>
                      </td>
                      <td className={`fw-bold ${change.profit_impact >= 0 ? 'text-success' : 'text-danger'}`}>
                        ৳{Number(change.profit_impact).toLocaleString()}
                      </td>
                      <td className="small">{change.reason || '-'}</td>
                      <td>
                        <div className="d-flex gap-1">
                          <button
                            className="btn btn-xs btn-success d-flex align-items-center gap-1"
                            disabled={approveBwMutation.isPending}
                            onClick={() => approveBwMutation.mutate({ changeId: change.id, reason: 'Approved globally' })}
                          >
                            {approveBwMutation.isPending && approveBwMutation.variables?.changeId === change.id ? <span className="spinner-border spinner-border-sm" /> : <CheckCircle2 size={12} />}
                            Approve
                          </button>
                          <button
                            className="btn btn-xs btn-outline-danger d-flex align-items-center gap-1"
                            disabled={rejectBwMutation.isPending}
                            onClick={() => {
                              const r = prompt('Reason for rejection:')
                              if (r) rejectBwMutation.mutate({ changeId: change.id, reason: r })
                            }}
                          >
                            {rejectBwMutation.isPending && rejectBwMutation.variables?.changeId === change.id ? <span className="spinner-border spinner-border-sm" /> : <XCircle size={12} />}
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="8" className="text-center py-4 text-muted">No pending bandwidth requests found system-wide.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
