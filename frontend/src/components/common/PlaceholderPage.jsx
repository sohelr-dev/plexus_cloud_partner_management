import { Settings } from 'lucide-react'

export default function PlaceholderPage({ title, description, items = [] }) {
  return (
    <div className="pm-page">
      <div className="pm-page-header">
        <div>
          <h1 className="pm-page-title">{title}</h1>
          <p className="pm-page-subtitle">{description}</p>
        </div>
      </div>

      <div className="pm-kpi-grid mt-2">
        {items.map((item) => (
          <div className="pm-placeholder-card" key={item}>
            <div className="pm-placeholder-icon">
              <Settings size={22} strokeWidth={2.5} />
            </div>
            <div className="pm-placeholder-label">{item}</div>
            <div className="pm-placeholder-soon">Coming Soon</div>
          </div>
        ))}
      </div>
    </div>
  )
}
