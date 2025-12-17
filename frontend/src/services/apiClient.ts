import axios, { AxiosError } from 'axios'
import toast from 'react-hot-toast'

export const apiClient = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 429) {
      toast.error('Too many requests. Please wait a moment.')
    } else if (error.response?.status === 500) {
      toast.error('Server error. Please try again later.')
    } else if (error.response?.status === 404) {
      toast.error('Resource not found.')
    } else if (!error.response) {
      toast.error('Network error. Check your connection.')
    } else if (
      error.response?.data &&
      typeof error.response.data === 'object' &&
      'detail' in error.response.data
    ) {
      toast.error(String(error.response.data.detail))
    }
    return Promise.reject(error)
  },
)
