export default function PlaceholderPage({ title, description, items = [] }) {
  return (
    <div>
      <p className="text-secondary">{description}</p>
      <div className="row g-3">
        {items.map((item) => (
          <div className="col-md-4" key={item}>
            <div className="card pm-placeholder-card shadow-sm h-100">
              <div className="card-body">{item}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
