import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom'
import AppLayout from './components/layout/AppLayout'
import PlaceholderPage from './components/common/PlaceholderPage'
import PartnersListPage from './pages/Partners/PartnersListPage'
import PartnerFormPage from './pages/Partners/PartnerFormPage'
import PartnerDetailsPage from './pages/Partners/PartnerDetailsPage'
import PartnerEditPage from './pages/Partners/PartnerEditPage'
import AuditLogsPage from './pages/AuditLogs/AuditLogsPage'
import Dashboard from './pages/Dashboard'
import CommissionDashboardPage from './pages/Commission/CommissionDashboardPage'
import BandwidthDashboardPage from './pages/Bandwidth/BandwidthDashboardPage'
import EndDevicesPage from './pages/EndDevices/EndDevicesPage'
import SupportCenterDashboardPage from './pages/SupportCenter/SupportCenterDashboardPage'
import ReportsPage from './pages/Reports/ReportsPage'
import NotificationsPage from './pages/Notifications/NotificationsPage'
import LoginPage from './pages/Auth/LoginPage'
import SettingsPage from './pages/Settings/SettingsPage'
import PartnerAccountsPage from './pages/PartnerAccounts/PartnerAccountsPage'
import { AuthProvider } from './context/AuthContext'
import { PermissionProvider } from './context/PermissionContext'
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

const placeholders = {}


export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AuthProvider>
          <PermissionProvider>
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
                  <Route
                    path="/audit-logs"
                    element={
                      <RoleRoute permission="audit-log.view">
                        <AuditLogsPage />
                      </RoleRoute>
                    }
                  />
                  <Route
                    path="/commission"
                    element={
                      <RoleRoute allow={['*']}>
                        <CommissionDashboardPage />
                      </RoleRoute>
                    }
                  />
                  <Route
                    path="/bw-dashboard"
                    element={
                      <RoleRoute allow={['*']}>
                        <BandwidthDashboardPage />
                      </RoleRoute>
                    }
                  />
                  <Route
                    path="/end-devices"
                    element={
                      <RoleRoute allow={['*']}>
                        <EndDevicesPage />
                      </RoleRoute>
                    }
                  />
                  <Route
                    path="/support-centers"
                    element={
                      <RoleRoute allow={['*']}>
                        <SupportCenterDashboardPage />
                      </RoleRoute>
                    }
                  />
                  <Route
                    path="/reports"
                    element={
                      <RoleRoute allow={['*']}>
                        <ReportsPage />
                      </RoleRoute>
                    }
                  />
                  <Route
                    path="/notifications"
                    element={
                      <RoleRoute allow={['*']}>
                        <NotificationsPage />
                      </RoleRoute>
                    }
                  />
                  <Route
                    path="/partner-accounts"
                    element={
                      <RoleRoute permission="payment.view">
                        <PartnerAccountsPage />
                      </RoleRoute>
                    }
                  />
                  <Route
                    path="/settings"
                    element={
                      <RoleRoute permission="setting.manage">
                        <SettingsPage />
                      </RoleRoute>
                    }
                  />
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
          </PermissionProvider>
        </AuthProvider>
      </Router>
    </QueryClientProvider>
  )
}


