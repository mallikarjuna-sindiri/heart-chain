/**
 * API Configuration
 * Axios instance with interceptors for authentication
 */
import axios from 'axios'
import toast from 'react-hot-toast'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor - Add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor - Handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const data = error.response?.data
    let message = 'An error occurred'

    // Normalize FastAPI validation errors (detail can be a list of errors)
    if (data?.detail) {
      if (Array.isArray(data.detail)) {
        message = data.detail.map((d) => d.msg || d.message || JSON.stringify(d)).join('\n')
      } else if (typeof data.detail === 'object') {
        message = data.detail.msg || data.detail.message || JSON.stringify(data.detail)
      } else {
        message = String(data.detail)
      }
    } else if (data?.message) {
      message = data.message
    }

    // Handle authentication errors
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
      toast.error('Session expired. Please login again.')
    } else {
      toast.error(message)
    }

    return Promise.reject(error)
  }
)

export default api
