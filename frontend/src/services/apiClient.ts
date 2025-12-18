import axios, { AxiosError } from 'axios'
import toast from 'react-hot-toast'

const toastOnce = (message: string) => {
  toast.error(message, { id: message })
}

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
    if ((error.config as unknown as { suppressToast?: boolean } | undefined)?.suppressToast) {
      return Promise.reject(error)
    }

    if (error.response?.status === 429) {
      toastOnce('Too many requests. Please wait a moment.')
    } else if (error.response?.status === 500) {
      toastOnce('Server error. Please try again later.')
    } else if (error.response?.status === 404) {
      toastOnce('Resource not found.')
    } else if (!error.response) {
      toastOnce('Network error. Check your connection.')
    } else if (
      error.response?.data &&
      typeof error.response.data === 'object' &&
      'detail' in error.response.data
    ) {
      toastOnce(String(error.response.data.detail))
    }
    return Promise.reject(error)
  },
)
