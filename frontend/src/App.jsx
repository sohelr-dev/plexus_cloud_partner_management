import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom'
import AppLayout from './components/layout/AppLayout'
import PlaceholderPage from './components/common/PlaceholderPage'
import PartnersListPage from './pages/Partners/PartnersListPage'
import PartnerFormPage from './pages/Partners/PartnerFormPage'
import PartnerDetailsPage from './pages/Partners/PartnerDetailsPage'
import PartnerEditPage from './pages/Partners/PartnerEditPage'
import Dashboard from './pages/Dashboard'
import LoginPage from './pages/Auth/LoginPage'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './routes/ProtectedRoute'
import RoleRoute, { ForbiddenPage } from './routes/RoleRoute'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

const placeholders = {
  '/bandwidth': {
    title: 'Bandwidth',
    description: 'Allocation, upgrade/downgrade workflow .',
    items: ['Allocations', 'Upgrade Requests', 'History'],
  },
  '/commission': {
    title: 'Commission',
    description: 'Commission rules, calculation and approval .',
    items: ['Rules', 'Commissions', 'Dashboard'],
  },
  '/support-centers': {
    title: 'Support Centers',
    description: 'Branch management, staff, costs ',
    items: ['Branches', 'Staff', 'Performance'],
  },
  '/partner-accounts': {
    title: 'Partner Accounts',
    description: 'Consolidated financial view for Accounts role — after ',
    items: ['Outstanding List', 'Commission Payable', 'Payment Entry'],
  },
  '/reports': {
    title: 'Reports',
    description: '7 report types with PDF/Excel/CSV export .',
    items: ['Partner Report', 'Financial Report', 'Full Partner Report'],
  },
  '/settings': {
    title: 'Settings',
    description: 'Configurable options (approval, health weights, alerts) .',
    items: ['General', 'Approval', 'Notifications'],
  },
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AuthProvider>
          <Routes>
            {/* Public */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/forbidden" element={<ForbiddenPage />} />

            {/* Protected shell */}
            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/partners" element={<PartnersListPage />} />
                <Route path="/partners/new" element={<PartnerFormPage />} />
                <Route path="/partners/:id" element={<PartnerDetailsPage />} />
                <Route path="/partners/:id/edit" element={<PartnerEditPage />} />
                {Object.entries(placeholders).map(([path, props]) => (
                  <Route
                    key={path}
                    path={path}
                    element={
                      <RoleRoute allow={['*']}>
                        <PlaceholderPage {...props} />
                      </RoleRoute>
                    }
                  />
                ))}
              </Route>
            </Route>

            {/* Unknown → back to shell root */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </Router>
    </QueryClientProvider>
  )
}


