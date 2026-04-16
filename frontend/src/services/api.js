import axios from 'axios'

// In dev:  Vite proxies /api/* → http://localhost:8000 (Flask), same-origin, no CORS.
// In prod:  VITE_API_URL is the CloudFront domain; requests go to /api/epdm-service/*.
const BASE_URL = (() => {
  const apiUrl = import.meta.env.VITE_API_URL || ''
  return apiUrl && !apiUrl.includes('localhost') ? `${apiUrl}/api/epdm-service` : '/api'
})()
const api = axios.create({ baseURL: BASE_URL })

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && !window.location.pathname.includes('/login')) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

// Auth
export const login    = (data) => api.post('/auth/login', data)
export const register = (data) => api.post('/auth/register', data)
export const getMe    = ()     => api.get('/auth/me')

// Employees
export const getEmployees    = (params)   => api.get('/employees', { params })
export const getAllEmployees = ()          => api.get('/employees', { params: { status: 'all' } })
export const getEmployee     = (id)       => api.get(`/employees/${id}`)
export const createEmployee  = (data)     => api.post('/employees', data)
export const updateEmployee  = (id, data) => api.put(`/employees/${id}`, data)
export const deleteEmployee  = (id)       => api.delete(`/employees/${id}`)

// Reviews
export const getReviews   = (params)   => api.get('/reviews', { params })
export const getReview    = (id)       => api.get(`/reviews/${id}`)
export const createReview = (data)     => api.post('/reviews', data)
export const updateReview = (id, data) => api.put(`/reviews/${id}`, data)
export const deleteReview = (id)       => api.delete(`/reviews/${id}`)

// Development Plans
export const getPlans   = (params)   => api.get('/plans', { params })
export const getPlan    = (id)       => api.get(`/plans/${id}`)
export const createPlan = (data)     => api.post('/plans', data)
export const updatePlan = (id, data) => api.put(`/plans/${id}`, data)
export const deletePlan = (id)       => api.delete(`/plans/${id}`)

// Goals
export const createGoal = (data)     => api.post('/goals', data)
export const updateGoal = (id, data) => api.put(`/goals/${id}`, data)

// Competencies
export const getCompetencies    = ()           => api.get('/competencies')
export const createCompetency   = (data)       => api.post('/competencies', data)
export const updateCompetency   = (id, data)   => api.put(`/competencies/${id}`, data)
export const deleteCompetency   = (id)         => api.delete(`/competencies/${id}`)

// Employee Competencies
export const getEmployeeCompetencies = (params) => api.get('/employee-competencies', { params })
export const assignCompetency        = (data)   => api.post('/employee-competencies', data)

// Training
export const getTraining    = (params) => api.get('/training', { params })
export const createTraining = (data)   => api.post('/training', data)
export const deleteTraining = (id)     => api.delete(`/training/${id}`)

// Dashboard
export const getDashboard = () => api.get('/dashboard')

// Analytics
export const getAnalyticsEmployeesByRole       = () => api.get('/analytics/employees-by-role')
export const getAnalyticsPerformanceDist       = () => api.get('/analytics/performance-distribution')
export const getAnalyticsTrainingCompletion    = () => api.get('/analytics/training-completion')
export const getAnalyticsMonthlyTrend          = () => api.get('/analytics/monthly-performance-trend')

export default api
