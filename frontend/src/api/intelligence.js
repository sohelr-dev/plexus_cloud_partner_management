import api from './client';

export const fetchIntelligenceDashboard = async (partnerId) => {
  const res = await api.get(`/partners/${partnerId}/intelligence/dashboard`);
  return res.data.data;
};

export const recalculateIntelligence = async (partnerId) => {
  const res = await api.post(`/partners/${partnerId}/intelligence/recalculate`);
  return res.data.data;
};

export const fetchScoreHistory = async (partnerId, limit = 12) => {
  const res = await api.get(`/partners/${partnerId}/intelligence/score-history`, {
    params: { limit },
  });
  return res.data.data;
};

export const fetchRisks = async (partnerId, params = {}) => {
  const res = await api.get(`/partners/${partnerId}/intelligence/risks`, { params });
  return res.data.data;
};

export const HEALTH_STATUS_CONFIG = {
  Excellent: { color: '#22c55e', bg: 'bg-success-subtle', text: 'text-success', badge: 'success', min: 90 },
  Healthy:   { color: '#3b82f6', bg: 'bg-primary-subtle', text: 'text-primary', badge: 'primary', min: 75 },
  Watch:     { color: '#f59e0b', bg: 'bg-warning-subtle', text: 'text-warning', badge: 'warning', min: 60 },
  Risk:      { color: '#f97316', bg: 'bg-orange-subtle',  text: 'text-orange',  badge: 'warning', min: 40 },
  Critical:  { color: '#ef4444', bg: 'bg-danger-subtle',  text: 'text-danger',  badge: 'danger',  min: 0  },
};

export const RISK_SEVERITY_CONFIG = {
  Critical: { badge: 'danger',    icon: '🔴' },
  High:     { badge: 'warning',   icon: '🟠' },
  Medium:   { badge: 'info',      icon: '🟡' },
  Low:      { badge: 'secondary', icon: '⚪' },
};

export const SCORE_CATEGORIES = [
  { key: 'financial_health_score',  label: 'Financial Health',       weight: '25%', icon: '💰' },
  { key: 'revenue_growth_score',    label: 'Revenue Growth',         weight: '20%', icon: '📈' },
  { key: 'profitability_score',     label: 'Profitability',          weight: '20%', icon: '📊' },
  { key: 'payment_behavior_score',  label: 'Payment Behavior',       weight: '10%', icon: '💳' },
  { key: 'bandwidth_growth_score',  label: 'Bandwidth Growth',       weight: '10%', icon: '🌐' },
  { key: 'customer_growth_score',   label: 'Customer Growth',        weight: '10%', icon: '👥' },
  { key: 'operational_score',       label: 'Operational Performance', weight: '5%', icon: '⚙️' },
];
