import axios from 'axios'

/**
 * Central axios instance for the Partner Management API.
 * Base URL comes from VITE_API_URL (.env.local), e.g. http://localhost:8000/api/v1
 */
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1',
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
})

// Attach Sanctum token when available (set by AuthContext in Phase 2)
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export default apiClient
