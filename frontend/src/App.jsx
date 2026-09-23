import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom'
import AppLayout from './components/layout/AppLayout'
import PlaceholderPage from './components/common/PlaceholderPage'
import Dashboard from './pages/Dashboard'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

const placeholders = {
  '/partners': {
    title: 'Partners',
    description: 'Partner list, search, filters and create wizard .',
    items: ['Partner List', 'Create Wizard', 'Partner Profile (Tab-based)'],
  },
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
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Dashboard />} />
            {Object.entries(placeholders).map(([path, props]) => (
              <Route
                key={path}
                path={path}
                element={<PlaceholderPage {...props} />}
              />
            ))}
          </Route>
        </Routes>
      </Router>
    </QueryClientProvider>
  )
}


