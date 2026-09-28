import React, { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Users,
  UserCheck,
  UserX,
  UserMinus,
  UserPlus,
  TrendingUp,
  Search,
  Filter,
  Plus,
  Download,
  CheckCircle2,
  AlertCircle,
  Clock,
  Package,
  Layers,
  Phone,
  Mail,
  Wifi,
  X
} from 'lucide-react'
import { fetchCustomerGrowth, fetchPackagePerformance, recordCustomerMetric } from '../../api/marketing'

export default function UsersCustomersTab({ partnerId, partner }) {
  const queryClient = useQueryClient()

  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false)
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    phone: '',
    email: '',
    package_name: 'Standard 20 Mbps',
    bandwidth_mbps: '20',
    identifier: '',
    monthly_bill: '1000',
    status: 'Active',
    joined_date: new Date().toISOString().split('T')[0],
  })

  // 1. Fetch customer growth metric data from backend
  const { data: growthData, isLoading: growthLoading } = useQuery({
    queryKey: ['partnerCustomerGrowth', partnerId],
    queryFn: () => fetchCustomerGrowth(partnerId),
    enabled: Boolean(partnerId),
  })

  // 2. Fetch package performance data
  const { data: packageData } = useQuery({
    queryKey: ['partnerPackagePerformance', partnerId],
    queryFn: () => fetchPackagePerformance(partnerId),
    enabled: Boolean(partnerId),
  })

  // Local state for active customer records (seeded with sample + user additions)
  const [customersList, setCustomersList] = useState([
    {
      id: 'CUST-1041',
      name: 'TechSolutions Ltd',
      phone: '+880 1711-234567',
      email: 'admin@techsolutions.bd',
      package_name: 'Enterprise 50 Mbps',
      bandwidth_mbps: 50,
      identifier: '00:1A:2B:99:4C:11',
      monthly_bill: 4500,
      status: 'Active',
      joined_date: '2025-02-15',
    },
    {
      id: 'CUST-1042',
      name: 'Rahman Textiles Corp',
      phone: '+880 1819-876543',
      email: 'it@rahmantextiles.com',
      package_name: 'Business Pro 30 Mbps',
      bandwidth_mbps: 30,
      identifier: 'E4:95:6E:44:21:88',
      monthly_bill: 3000,
      status: 'Active',
      joined_date: '2025-05-10',
    },
    {
      id: 'CUST-1043',
      name: 'Apex Cyber Cafe',
      phone: '+880 1912-345678',
      email: 'apexcafe@gmail.com',
      package_name: 'Commercial 20 Mbps',
      bandwidth_mbps: 20,
      identifier: '48:8D:36:12:FF:09',
      monthly_bill: 2200,
      status: 'Suspended',
      joined_date: '2024-11-01',
    },
    {
      id: 'CUST-1044',
      name: 'Dr. Kamal Hossain (Clinic)',
      phone: '+880 1715-998877',
      email: 'clinic.kamal@health.bd',
      package_name: 'Standard 15 Mbps',
      bandwidth_mbps: 15,
      identifier: 'F0:B4:79:AB:CC:33',
      monthly_bill: 1500,
      status: 'Active',
      joined_date: '2025-08-20',
    },
    {
      id: 'CUST-1045',
      name: 'Global Overseas Logistics',
      phone: '+880 1611-001122',
      email: 'ops@globaloverseas.com',
      package_name: 'Dedicated 50 Mbps',
      bandwidth_mbps: 50,
      identifier: 'CC:2D:E0:55:12:76',
      monthly_bill: 5000,
      status: 'Expired',
      joined_date: '2024-03-12',
    },
  ])

  // Filtered customers
  const filteredCustomers = useMemo(() => {
    return customersList.filter((c) => {
      const matchSearch =
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phone.includes(searchTerm) ||
        c.identifier.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.package_name.toLowerCase().includes(searchTerm.toLowerCase())

      const matchStatus = statusFilter === 'All' || c.status === statusFilter
      return matchSearch && matchStatus
    })
  }, [customersList, searchTerm, statusFilter])

  // Aggregate metrics
  const totalCustomers = customersList.length
  const activeCustomers = customersList.filter((c) => c.status === 'Active').length
  const suspendedCustomers = customersList.filter((c) => c.status === 'Suspended').length
  const expiredCustomers = customersList.filter((c) => c.status === 'Expired').length
  const churnedCustomers = customersList.filter((c) => c.status === 'Terminated').length

  const handleAddCustomer = (e) => {
    e.preventDefault()
    const nextId = `CUST-${1040 + customersList.length + 1}`
    setCustomersList([
      {
        id: nextId,
        name: newCustomer.name,
        phone: newCustomer.phone,
        email: newCustomer.email || 'N/A',
        package_name: newCustomer.package_name,
        bandwidth_mbps: Number(newCustomer.bandwidth_mbps),
        identifier: newCustomer.identifier || 'Pending',
        monthly_bill: Number(newCustomer.monthly_bill),
        status: newCustomer.status,
        joined_date: newCustomer.joined_date,
      },
      ...customersList,
    ])
    setIsAddCustomerOpen(false)
    setNewCustomer({
      name: '',
      phone: '',
      email: '',
      package_name: 'Standard 20 Mbps',
      bandwidth_mbps: '20',
      identifier: '',
      monthly_bill: '1000',
      status: 'Active',
      joined_date: new Date().toISOString().split('T')[0],
    })
  }

  const handleToggleStatus = (id, newSt) => {
    setCustomersList((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: newSt } : c))
    )
  }

  return (
    <div className="fade-in">
      {/* ── Section Header ── */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <h5 className="fw-bold mb-1 text-primary d-flex align-items-center gap-2">
            <Users size={22} /> Users & Connected Customers Management
          </h5>
          <p className="text-muted small mb-0">
            End-customer lifecycle, active connections, churn tracking & package performance.
          </p>
        </div>
        <div className="d-flex align-items-center gap-2">
          <button
            className="pm-btn pm-btn-primary d-flex align-items-center gap-2 pm-btn-sm shadow-sm"
            onClick={() => setIsAddCustomerOpen(true)}
          >
            <UserPlus size={15} /> Add End Customer
          </button>
        </div>
      </div>

      {/* ── Customer Lifecycle KPI Grid ── */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-md-3 col-xl-2">
          <div className="card border-0 shadow-sm p-3 h-100 bg-light">
            <div className="text-muted fs-8 fw-semibold text-uppercase">Total Customers</div>
            <div className="fs-3 fw-bold text-dark mt-1">{totalCustomers}</div>
            <div className="fs-8 text-muted mt-1">Registered base</div>
          </div>
        </div>

        <div className="col-6 col-md-3 col-xl-2">
          <div className="card border-0 shadow-sm p-3 h-100" style={{ borderLeft: '4px solid #10b981' }}>
            <div className="text-muted fs-8 fw-semibold text-uppercase">Active Users</div>
            <div className="fs-3 fw-bold text-success mt-1">{activeCustomers}</div>
            <div className="fs-8 text-success mt-1 d-flex align-items-center gap-1">
              <CheckCircle2 size={12} /> {totalCustomers > 0 ? Math.round((activeCustomers / totalCustomers) * 100) : 0}% Active
            </div>
          </div>
        </div>

        <div className="col-6 col-md-3 col-xl-2">
          <div className="card border-0 shadow-sm p-3 h-100" style={{ borderLeft: '4px solid #f59e0b' }}>
            <div className="text-muted fs-8 fw-semibold text-uppercase">Suspended</div>
            <div className="fs-3 fw-bold text-warning-emphasis mt-1">{suspendedCustomers}</div>
            <div className="fs-8 text-muted mt-1">Pending dues</div>
          </div>
        </div>

        <div className="col-6 col-md-3 col-xl-2">
          <div className="card border-0 shadow-sm p-3 h-100" style={{ borderLeft: '4px solid #64748b' }}>
            <div className="text-muted fs-8 fw-semibold text-uppercase">Expired / Renewal</div>
            <div className="fs-3 fw-bold text-secondary mt-1">{expiredCustomers}</div>
            <div className="fs-8 text-muted mt-1">Needs renewal</div>
          </div>
        </div>

        <div className="col-6 col-md-3 col-xl-2">
          <div className="card border-0 shadow-sm p-3 h-100" style={{ borderLeft: '4px solid #ef4444' }}>
            <div className="text-muted fs-8 fw-semibold text-uppercase">Terminated / Churn</div>
            <div className="fs-3 fw-bold text-danger mt-1">{churnedCustomers}</div>
            <div className="fs-8 text-danger mt-1">Lost accounts</div>
          </div>
        </div>

        <div className="col-6 col-md-3 col-xl-2">
          <div className="card border-0 shadow-sm p-3 h-100" style={{ borderLeft: '4px solid #3b82f6' }}>
            <div className="text-muted fs-8 fw-semibold text-uppercase">Est. Monthly ARPU</div>
            <div className="fs-3 fw-bold text-primary mt-1">
              ৳{activeCustomers > 0 ? Math.round(customersList.reduce((acc, c) => acc + (c.status === 'Active' ? c.monthly_bill : 0), 0) / activeCustomers).toLocaleString() : 0}
            </div>
            <div className="fs-8 text-muted mt-1">Avg revenue / user</div>
          </div>
        </div>
      </div>

      {/* ── Package Breakdown Summary ── */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body p-3">
          <h6 className="fw-bold mb-3 d-flex align-items-center gap-2">
            <Package size={16} className="text-primary" /> Popular Package Distribution
          </h6>
          <div className="row g-2">
            <div className="col-12 col-md-4">
              <div className="p-2 border rounded bg-light d-flex align-items-center justify-content-between">
                <div>
                  <div className="fw-semibold fs-7">Enterprise 50 Mbps</div>
                  <div className="text-muted fs-8">৳4,500 / month</div>
                </div>
                <span className="badge bg-primary fs-7">2 Subscribers</span>
              </div>
            </div>
            <div className="col-12 col-md-4">
              <div className="p-2 border rounded bg-light d-flex align-items-center justify-content-between">
                <div>
                  <div className="fw-semibold fs-7">Business Pro 30 Mbps</div>
                  <div className="text-muted fs-8">৳3,000 / month</div>
                </div>
                <span className="badge bg-info text-dark fs-7">1 Subscriber</span>
              </div>
            </div>
            <div className="col-12 col-md-4">
              <div className="p-2 border rounded bg-light d-flex align-items-center justify-content-between">
                <div>
                  <div className="fw-semibold fs-7">Commercial 20 Mbps</div>
                  <div className="text-muted fs-8">৳2,200 / month</div>
                </div>
                <span className="badge bg-secondary fs-7">2 Subscribers</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Search & Filter Bar ── */}
      <div className="card border-0 shadow-sm mb-3">
        <div className="card-body p-3">
          <div className="row g-2 align-items-center">
            <div className="col-12 col-md-6">
              <div className="input-group input-group-sm">
                <span className="input-group-text bg-white border-end-0 text-muted">
                  <Search size={14} />
                </span>
                <input
                  type="text"
                  className="form-control border-start-0"
                  placeholder="Search by customer name, ID, phone, package, or MAC..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <button className="btn btn-outline-secondary border-start-0" onClick={() => setSearchTerm('')}>
                    <X size={12} />
                  </button>
                )}
              </div>
            </div>

            <div className="col-6 col-md-3">
              <select
                className="form-select form-select-sm"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="All">All Customer Statuses</option>
                <option value="Active">Active Only</option>
                <option value="Suspended">Suspended Only</option>
                <option value="Expired">Expired Only</option>
                <option value="Terminated">Terminated / Churned</option>
              </select>
            </div>

            <div className="col-6 col-md-3 text-end">
              <span className="small text-muted">
                Showing <strong>{filteredCustomers.length}</strong> of {totalCustomers} customers
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Customers Table ── */}
      <div className="card border-0 shadow-sm overflow-hidden mb-4">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light fs-7">
              <tr>
                <th>Customer ID</th>
                <th>Client Name & Details</th>
                <th>Subscribed Package</th>
                <th>Assigned Device / MAC</th>
                <th>Monthly Bill</th>
                <th>Status</th>
                <th>Joined Date</th>
                <th className="text-end pe-3">Change Status</th>
              </tr>
            </thead>
            <tbody className="fs-7">
              {filteredCustomers.length > 0 ? (
                filteredCustomers.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <span className="badge bg-primary-subtle text-primary border border-primary-subtle font-monospace">
                        {c.id}
                      </span>
                    </td>
                    <td>
                      <div className="fw-bold text-dark">{c.name}</div>
                      <div className="small text-muted d-flex align-items-center gap-2 mt-1">
                        <span className="d-flex align-items-center gap-1">
                          <Phone size={11} /> {c.phone}
                        </span>
                        {c.email && c.email !== 'N/A' && (
                          <span className="d-flex align-items-center gap-1">
                            <Mail size={11} /> {c.email}
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="fw-semibold text-dark">{c.package_name}</div>
                      <div className="small text-muted d-flex align-items-center gap-1">
                        <Wifi size={11} className="text-primary" /> {c.bandwidth_mbps} Mbps Bandwidth
                      </div>
                    </td>
                    <td>
                      <code className="px-2 py-1 bg-light border rounded text-dark fs-8">
                        {c.identifier}
                      </code>
                    </td>
                    <td className="fw-bold text-success">
                      ৳{Number(c.monthly_bill).toLocaleString()}
                    </td>
                    <td>
                      {c.status === 'Active' && (
                        <span className="badge bg-success-subtle text-success border border-success-subtle px-2 py-1">
                          <CheckCircle2 size={11} className="me-1" /> Active
                        </span>
                      )}
                      {c.status === 'Suspended' && (
                        <span className="badge bg-warning-subtle text-warning border border-warning-subtle px-2 py-1">
                          <Clock size={11} className="me-1" /> Suspended
                        </span>
                      )}
                      {c.status === 'Expired' && (
                        <span className="badge bg-secondary-subtle text-secondary border border-secondary-subtle px-2 py-1">
                          Expired
                        </span>
                      )}
                      {c.status === 'Terminated' && (
                        <span className="badge bg-danger-subtle text-danger border border-danger-subtle px-2 py-1">
                          Terminated
                        </span>
                      )}
                    </td>
                    <td className="small text-muted">{c.joined_date}</td>
                    <td className="text-end pe-3">
                      <select
                        className="form-select form-select-sm d-inline-block w-auto py-0 px-2 fs-8"
                        value={c.status}
                        onChange={(e) => handleToggleStatus(c.id, e.target.value)}
                      >
                        <option value="Active">Active</option>
                        <option value="Suspended">Suspended</option>
                        <option value="Expired">Expired</option>
                        <option value="Terminated">Terminated</option>
                      </select>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="text-center py-5 text-muted">
                    No customers found matching current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Add End Customer Modal ── */}
      {isAddCustomerOpen && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content shadow-lg border-0">
              <div className="modal-header border-bottom">
                <h5 className="modal-title fw-bold d-flex align-items-center gap-2">
                  <UserPlus size={20} className="text-primary" /> Register New Customer / Subscriber
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setIsAddCustomerOpen(false)}
                />
              </div>
              <form onSubmit={handleAddCustomer}>
                <div className="modal-body p-4">
                  <div className="mb-3">
                    <label className="form-label small fw-semibold">
                      Customer / Organization Name <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="e.g. Acme Corporation or Rafiqul Islam"
                      value={newCustomer.name}
                      onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                      required
                    />
                  </div>

                  <div className="row g-2 mb-3">
                    <div className="col-6">
                      <label className="form-label small fw-semibold">
                        Phone Number <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        placeholder="+880 17XXXXXXXX"
                        value={newCustomer.phone}
                        onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                        required
                      />
                    </div>
                    <div className="col-6">
                      <label className="form-label small fw-semibold">Email Address</label>
                      <input
                        type="email"
                        className="form-control form-control-sm"
                        placeholder="client@mail.com"
                        value={newCustomer.email}
                        onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="row g-2 mb-3">
                    <div className="col-6">
                      <label className="form-label small fw-semibold">Package</label>
                      <select
                        className="form-select form-select-sm"
                        value={newCustomer.package_name}
                        onChange={(e) => setNewCustomer({ ...newCustomer, package_name: e.target.value })}
                      >
                        <option value="Standard 15 Mbps">Standard 15 Mbps</option>
                        <option value="Commercial 20 Mbps">Commercial 20 Mbps</option>
                        <option value="Business Pro 30 Mbps">Business Pro 30 Mbps</option>
                        <option value="Enterprise 50 Mbps">Enterprise 50 Mbps</option>
                        <option value="Dedicated 100 Mbps">Dedicated 100 Mbps</option>
                      </select>
                    </div>
                    <div className="col-6">
                      <label className="form-label small fw-semibold">Bandwidth (Mbps)</label>
                      <input
                        type="number"
                        className="form-control form-control-sm"
                        value={newCustomer.bandwidth_mbps}
                        onChange={(e) => setNewCustomer({ ...newCustomer, bandwidth_mbps: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="row g-2 mb-3">
                    <div className="col-6">
                      <label className="form-label small fw-semibold">Monthly Fee (৳)</label>
                      <input
                        type="number"
                        className="form-control form-control-sm"
                        value={newCustomer.monthly_bill}
                        onChange={(e) => setNewCustomer({ ...newCustomer, monthly_bill: e.target.value })}
                      />
                    </div>
                    <div className="col-6">
                      <label className="form-label small fw-semibold">Device MAC / Identifier</label>
                      <input
                        type="text"
                        className="form-control form-control-sm font-monospace"
                        placeholder="XX:XX:XX:XX:XX:XX"
                        value={newCustomer.identifier}
                        onChange={(e) => setNewCustomer({ ...newCustomer, identifier: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="row g-2 mb-3">
                    <div className="col-6">
                      <label className="form-label small fw-semibold">Initial Status</label>
                      <select
                        className="form-select form-select-sm"
                        value={newCustomer.status}
                        onChange={(e) => setNewCustomer({ ...newCustomer, status: e.target.value })}
                      >
                        <option value="Active">Active</option>
                        <option value="Suspended">Suspended</option>
                        <option value="Expired">Expired</option>
                      </select>
                    </div>
                    <div className="col-6">
                      <label className="form-label small fw-semibold">Connection Date</label>
                      <input
                        type="date"
                        className="form-control form-control-sm"
                        value={newCustomer.joined_date}
                        onChange={(e) => setNewCustomer({ ...newCustomer, joined_date: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
                <div className="modal-footer bg-light border-top">
                  <button
                    type="button"
                    className="btn btn-sm btn-secondary"
                    onClick={() => setIsAddCustomerOpen(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-sm btn-primary">
                    Save Customer
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
