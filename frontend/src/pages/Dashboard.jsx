const kpiGroups = [
  {
    title: 'Partner KPI',
    items: ['Total Partners', 'Active', 'Pending Approval', 'Suspended', 'Terminated', 'New (This Month)'],
  },
  {
    title: 'Financial KPI',
    items: ['Total Revenue', 'Total Cost', 'Net Profit', 'Outstanding', 'Commission', 'Avg ROI'],
  },
  {
    title: 'Operational KPI',
    items: ['Bandwidth Allocated', 'Customers', 'End Devices', 'Equipment', 'Support Centers', 'Utilization'],
  },
]

export default function Dashboard() {
  return (
    <div className="d-flex flex-column gap-4">
      {kpiGroups.map((group) => (
        <section key={group.title}>
          <h2 className="h6 text-uppercase text-secondary mb-3">{group.title}</h2>
          <div className="row g-3">
            {group.items.map((item) => (
              <div className="col-md-4 col-xl-2" key={item}>
                <div className="card pm-placeholder-card shadow-sm h-100">
                  <div className="card-body">
                    <div className="fs-6">{item}</div>
                    <div className="display-6">—</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
