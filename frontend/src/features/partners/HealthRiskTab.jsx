import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Heart,
  AlertTriangle,
  Lightbulb,
  Target,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Activity,
  Shield,
  ChevronDown,
  ChevronUp,
  BarChart2,
} from 'lucide-react'
import {
  fetchIntelligenceDashboard,
  recalculateIntelligence,
  HEALTH_STATUS_CONFIG,
  RISK_SEVERITY_CONFIG,
  SCORE_CATEGORIES,
} from '../../api/intelligence'
import { usePermissions } from '../../context/PermissionContext'

const fmtScore = (v) => (typeof v === 'number' ? v.toFixed(1) : '—')

function ScoreGauge({ score, status }) {
  const cfg = HEALTH_STATUS_CONFIG[status] ?? HEALTH_STATUS_CONFIG.Watch
  const circumference = 2 * Math.PI * 54
  const offset = circumference - (score / 100) * circumference

  return (
    <div className="d-flex flex-column align-items-center justify-content-center" style={{ minWidth: 140 }}>
      <div className="position-relative" style={{ width: 140, height: 140 }}>
        <svg width="140" height="140" viewBox="0 0 140 140">
          <circle cx="70" cy="70" r="54" fill="none" stroke="#e9ecef" strokeWidth="14" />
          <circle
            cx="70" cy="70" r="54"
            fill="none"
            stroke={cfg.color}
            strokeWidth="14"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            transform="rotate(-90 70 70)"
            style={{ transition: 'stroke-dashoffset 1s ease' }}
          />
        </svg>
        <div className="position-absolute top-50 start-50 translate-middle text-center">
          <div className="fw-bold" style={{ fontSize: '2rem', color: cfg.color, lineHeight: 1 }}>
            {fmtScore(score)}
          </div>
          <div className="small text-muted" style={{ fontSize: '0.7rem' }}>/ 100</div>
        </div>
      </div>
      <span className={`badge bg-${cfg.badge} mt-2 px-3 py-2`} style={{ fontSize: '0.85rem' }}>
        {status}
      </span>
    </div>
  )
}

function CategoryBar({ label, score, weight, icon }) {
  const pct = Math.min(100, Math.max(0, score ?? 0))
  const color = pct >= 75 ? '#22c55e' : pct >= 50 ? '#f59e0b' : '#ef4444'

  return (
    <div className="mb-3">
      <div className="d-flex justify-content-between align-items-center mb-1">
        <span className="small fw-semibold">
          <span className="me-1">{icon}</span>{label}
        </span>
        <div className="d-flex align-items-center gap-2">
          <span className="badge bg-light text-muted border" style={{ fontSize: '0.65rem' }}>{weight}</span>
          <span className="fw-bold small" style={{ color, minWidth: 36, textAlign: 'right' }}>
            {fmtScore(pct)}
          </span>
        </div>
      </div>
      <div className="progress" style={{ height: 8, borderRadius: 4 }}>
        <div
          className="progress-bar"
          style={{
            width: `${pct}%`,
            backgroundColor: color,
            borderRadius: 4,
            transition: 'width 0.8s ease',
          }}
        />
      </div>
    </div>
  )
}

function RiskCard({ risk }) {
  const cfg = RISK_SEVERITY_CONFIG[risk.severity] ?? RISK_SEVERITY_CONFIG.Medium
  const [expanded, setExpanded] = useState(false)

  return (
    <div className={`alert alert-${cfg.badge === 'warning' ? 'warning' : cfg.badge === 'danger' ? 'danger' : cfg.badge === 'info' ? 'info' : 'secondary'} py-2 px-3 mb-2`}>
      <div className="d-flex align-items-start gap-2">
        <span style={{ fontSize: '1rem', flexShrink: 0 }}>{cfg.icon}</span>
        <div className="flex-grow-1 min-w-0">
          <div className="d-flex justify-content-between align-items-start gap-2 flex-wrap">
            <div>
              <span className={`badge bg-${cfg.badge} me-2`} style={{ fontSize: '0.6rem' }}>
                {risk.severity}
              </span>
              <span className="badge bg-light text-muted border me-2" style={{ fontSize: '0.6rem' }}>
                {risk.risk_category}
              </span>
              <span className="small fw-semibold">{risk.title}</span>
            </div>
            {risk.description && (
              <button
                className="btn btn-link btn-sm p-0 text-muted"
                style={{ fontSize: '0.7rem' }}
                onClick={() => setExpanded(!expanded)}
              >
                {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
            )}
          </div>
          {expanded && risk.description && (
            <div className="mt-1 small text-muted">{risk.description}</div>
          )}
        </div>
      </div>
    </div>
  )
}

function InsightCard({ item }) {
  const priorityColor = {
    Critical: 'danger', High: 'warning', Medium: 'primary', Low: 'secondary',
  }[item.priority] ?? 'secondary'

  return (
    <div className="d-flex align-items-start gap-2 py-2 border-bottom">
      <Lightbulb size={15} className={`text-${priorityColor} flex-shrink-0 mt-1`} />
      <div className="small">{item.content}</div>
    </div>
  )
}

function RecommendationCard({ item }) {
  const priorityColor = {
    Critical: 'danger', High: 'warning', Medium: 'primary', Low: 'secondary',
  }[item.priority] ?? 'secondary'

  return (
    <div className="d-flex align-items-start gap-3 py-2 border-bottom">
      <Target size={15} className={`text-${priorityColor} flex-shrink-0 mt-1`} />
      <div className="flex-grow-1">
        <div className="d-flex align-items-center gap-2 mb-1">
          {item.action && (
            <span className={`badge bg-${priorityColor}-subtle border border-${priorityColor}-subtle text-${priorityColor}`} style={{ fontSize: '0.65rem' }}>
              {item.action}
            </span>
          )}
          <span className={`badge bg-${priorityColor}`} style={{ fontSize: '0.6rem' }}>{item.priority}</span>
        </div>
        <div className="small">{item.content}</div>
      </div>
    </div>
  )
}

export default function HealthRiskTab({ partnerId }) {
  const queryClient = useQueryClient()
  const { can } = usePermissions()

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['partnerIntelligence', partnerId],
    queryFn: () => fetchIntelligenceDashboard(partnerId),
    staleTime: 1000 * 60 * 5,
  })

  const recalcMutation = useMutation({
    mutationFn: () => recalculateIntelligence(partnerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partnerIntelligence', partnerId] })
      queryClient.invalidateQueries({ queryKey: ['partner', partnerId] })
    },
  })

  if (isLoading) {
    return (
      <div className="d-flex align-items-center justify-content-center py-5">
        <span className="spinner-border text-primary me-2" />
        <span className="text-muted">Loading intelligence data…</span>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="alert alert-warning m-3">
        <AlertTriangle size={16} className="me-2" />
        {error?.response?.data?.message ?? 'Failed to load intelligence data.'}
        {can('partner.update') && (
          <button
            className="btn btn-sm btn-outline-primary ms-3"
            onClick={() => recalcMutation.mutate()}
            disabled={recalcMutation.isPending}
          >
            {recalcMutation.isPending ? <span className="spinner-border spinner-border-sm me-1" /> : <RefreshCw size={13} className="me-1" />}
            Calculate Now
          </button>
        )}
      </div>
    )
  }

  const health          = data?.health
  const risks           = data?.risks ?? []
  const riskSummary     = data?.risk_summary ?? {}
  const insights        = data?.insights ?? []
  const recommendations = data?.recommendations ?? []
  const scoreHistory    = data?.score_history ?? []

  const risksBySeverity = (s) => risks.filter((r) => r.severity === s)

  return (
    <div className="p-3">
      {/* Recalculate Button */}
      <div className="d-flex justify-content-end mb-3">
        {can('partner.update') && (
          <button
            className="btn btn-outline-primary btn-sm d-flex align-items-center gap-1"
            onClick={() => recalcMutation.mutate()}
            disabled={recalcMutation.isPending}
          >
            {recalcMutation.isPending
              ? <span className="spinner-border spinner-border-sm" />
              : <RefreshCw size={14} />}
            {recalcMutation.isPending ? 'Recalculating…' : 'Recalculate'}
          </button>
        )}
      </div>

      {recalcMutation.isSuccess && (
        <div className="alert alert-success py-2 small mb-3 d-flex align-items-center gap-2">
          <Activity size={15} /> Health score updated successfully.
        </div>
      )}
      <div className="pm-card mb-3">
        <div className="pm-card-header">
          <h6 className="pm-card-title mb-0">
            <Heart size={16} className="me-2 text-danger" />
            Partner Health Score
          </h6>
          {health?.calculated_at && (
            <span className="text-muted" style={{ fontSize: '0.7rem' }}>
              Last calculated: {new Date(health.calculated_at).toLocaleString()}
            </span>
          )}
        </div>

        {!health ? (
          <div className="text-center py-4 text-muted">
            <Heart size={36} className="mb-2 opacity-25" />
            <p className="small mb-2">No health score calculated yet.</p>
            {can('partner.update') && (
              <button
                className="btn btn-primary btn-sm"
                onClick={() => recalcMutation.mutate()}
                disabled={recalcMutation.isPending}
              >
                {recalcMutation.isPending ? 'Calculating…' : 'Calculate Now'}
              </button>
            )}
          </div>
        ) : (
          <div className="p-3">
            <div className="row g-3 align-items-center">
              {/* Gauge */}
              <div className="col-auto d-flex justify-content-center">
                <ScoreGauge score={health.total_score} status={health.status} />
              </div>
              {/* Category Bars */}
              <div className="col">
                {SCORE_CATEGORIES.map((cat) => (
                  <CategoryBar
                    key={cat.key}
                    label={cat.label}
                    score={health[cat.key]}
                    weight={cat.weight}
                    icon={cat.icon}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="pm-card mb-3">
        <div className="pm-card-header">
          <h6 className="pm-card-title mb-0">
            <Shield size={16} className="me-2 text-warning" />
            Risk Indicators
            {riskSummary.total > 0 && (
              <span className="badge bg-danger ms-2">{riskSummary.total}</span>
            )}
          </h6>
          <div className="d-flex gap-2 flex-wrap">
            {riskSummary.critical > 0 && (
              <span className="badge bg-danger-subtle text-danger border border-danger-subtle" style={{ fontSize: '0.65rem' }}>
                🔴 {riskSummary.critical} Critical
              </span>
            )}
            {riskSummary.high > 0 && (
              <span className="badge bg-warning-subtle text-warning border border-warning-subtle" style={{ fontSize: '0.65rem' }}>
                🟠 {riskSummary.high} High
              </span>
            )}
            {riskSummary.medium > 0 && (
              <span className="badge bg-info-subtle text-info border border-info-subtle" style={{ fontSize: '0.65rem' }}>
                🟡 {riskSummary.medium} Medium
              </span>
            )}
          </div>
        </div>

        <div className="p-3">
          {risks.length === 0 ? (
            <div className="text-center py-3 text-muted">
              <Shield size={32} className="mb-2 opacity-25" />
              <p className="small mb-0">No active risk indicators detected.</p>
            </div>
          ) : (
            <>
              {risksBySeverity('Critical').map((r) => <RiskCard key={r.id} risk={r} />)}
              {risksBySeverity('High').map((r) => <RiskCard key={r.id} risk={r} />)}
              {risksBySeverity('Medium').map((r) => <RiskCard key={r.id} risk={r} />)}
              {risksBySeverity('Low').map((r) => <RiskCard key={r.id} risk={r} />)}
            </>
          )}
        </div>
      </div>

      <div className="row g-3">
        <div className="col-md-6">
          <div className="pm-card h-100">
            <div className="pm-card-header">
              <h6 className="pm-card-title mb-0">
                <Lightbulb size={16} className="me-2 text-warning" />
                Management Insights
              </h6>
              {insights.length > 0 && (
                <span className="badge bg-secondary-subtle text-secondary border" style={{ fontSize: '0.65rem' }}>
                  {insights.length} insights
                </span>
              )}
            </div>
            <div className="px-3 py-2">
              {insights.length === 0 ? (
                <div className="text-center py-3 text-muted small">
                  <Lightbulb size={28} className="mb-2 opacity-25 d-block mx-auto" />
                  No insights generated yet.
                </div>
              ) : (
                insights.map((item) => <InsightCard key={item.id} item={item} />)
              )}
            </div>
          </div>
        </div>

        <div className="col-md-6">
          <div className="pm-card h-100">
            <div className="pm-card-header">
              <h6 className="pm-card-title mb-0">
                <Target size={16} className="me-2 text-primary" />
                Recommendations
              </h6>
              {recommendations.length > 0 && (
                <span className="badge bg-primary-subtle text-primary border" style={{ fontSize: '0.65rem' }}>
                  {recommendations.length} actions
                </span>
              )}
            </div>
            <div className="px-3 py-2">
              {recommendations.length === 0 ? (
                <div className="text-center py-3 text-muted small">
                  <Target size={28} className="mb-2 opacity-25 d-block mx-auto" />
                  No recommendations at this time.
                </div>
              ) : (
                recommendations.map((item) => <RecommendationCard key={item.id} item={item} />)
              )}
            </div>
          </div>
        </div>
      </div>

      {scoreHistory.length > 1 && (
        <div className="pm-card mt-3">
          <div className="pm-card-header">
            <h6 className="pm-card-title mb-0">
              <BarChart2 size={16} className="me-2" />
              Health Score Trend (Last {scoreHistory.length} calculations)
            </h6>
          </div>
          <div className="p-3">
            <div className="d-flex align-items-end gap-1" style={{ height: 80 }}>
              {[...scoreHistory].reverse().map((h, i) => {
                const cfg = HEALTH_STATUS_CONFIG[h.status] ?? HEALTH_STATUS_CONFIG.Watch
                const barHeight = Math.max(4, (h.total_score / 100) * 72)
                return (
                  <div
                    key={i}
                    className="flex-grow-1 rounded-top"
                    style={{
                      height: barHeight,
                      backgroundColor: cfg.color,
                      opacity: 0.8,
                      cursor: 'pointer',
                      transition: 'opacity 0.2s',
                      minWidth: 8,
                    }}
                    title={`${h.total_score} (${h.status}) — ${h.period ?? new Date(h.calculated_at).toLocaleDateString()}`}
                  />
                )
              })}
            </div>
            <div className="d-flex justify-content-between mt-1">
              <span className="text-muted" style={{ fontSize: '0.65rem' }}>
                {[...scoreHistory].reverse()[0]?.period ?? 'Oldest'}
              </span>
              <span className="text-muted" style={{ fontSize: '0.65rem' }}>
                {scoreHistory[0]?.period ?? 'Latest'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
