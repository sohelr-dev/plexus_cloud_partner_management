import {
  Users, Activity, TrendingUp, DollarSign, Target, Building, Server, Cpu, LayoutDashboard
} from 'lucide-react'

const kpiGroups = [
  {
    title: 'Partner Health',
    metrics: [
      { label: 'Total Partners', value: '142', icon: Users, tone: 'blue', delta: 12 },
      { label: 'Active Now', value: '118', icon: Activity, tone: 'green', delta: 4 },
      { label: 'Pending Approval', value: '12', icon: Target, tone: 'amber', delta: -2 },
      { label: 'Suspended', value: '8', icon: Users, tone: 'red' },
    ]
  },
  {
    title: 'Financial Overview',
    metrics: [
      { label: 'Total Revenue', value: '$84.2k', icon: DollarSign, tone: 'cyan', delta: 8 },
      { label: 'Net Profit', value: '$32.1k', icon: TrendingUp, tone: 'green', delta: 15 },
      { label: 'Total Cost', value: '$52.1k', icon: Target, tone: 'red', delta: 5 },
      { label: 'Avg ROI', value: '28%', icon: Activity, tone: 'violet', delta: 2 },
    ]
  },
  {
    title: 'Operational Status',
    metrics: [
      { label: 'Bandwidth (Gbps)', value: '1,024', icon: Server, tone: 'blue', delta: 5 },
      { label: 'Active Devices', value: '3,842', icon: Cpu, tone: 'cyan', delta: 11 },
      { label: 'Support Centers', value: '16', icon: Building, tone: 'violet' },
      { label: 'Avg Utilization', value: '78%', icon: Activity, tone: 'amber', delta: -3 },
    ]
  }
]

export default function Dashboard() {
  return (
    <div className="pm-page">
      <div className="pm-page-header">
        <div>
          <h1 className="pm-page-title">
            <LayoutDashboard size={24} />
            Dashboard Overview
          </h1>
          <p className="pm-page-subtitle">Platform metrics, partner health, and financial snapshot.</p>
        </div>
      </div>

      <div className="d-flex flex-column gap-4 mt-2">
        {kpiGroups.map((group) => (
          <section key={group.title}>
            <div className="pm-section-title">{group.title}</div>
            <div className="pm-kpi-grid">
              {group.metrics.map((metric) => (
                <div className={`pm-kpi pm-kpi--${metric.tone}`} key={metric.label}>
                  <div className="pm-kpi-icon">
                    <metric.icon size={20} />
                  </div>
                  {metric.delta && (
                    <div className={`pm-kpi-delta ${metric.delta > 0 ? 'up' : 'down'}`}>
                      {metric.delta > 0 ? '+' : ''}{metric.delta}%
                    </div>
                  )}
                  <div className="mt-auto pt-2">
                    <div className="pm-kpi-value">{metric.value}</div>
                    <div className="pm-kpi-label">{metric.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
