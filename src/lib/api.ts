import axios, { AxiosInstance, AxiosRequestConfig } from 'axios'

const API_BASE_URL = 'http://38.180.154.173:3000/api/v1'

const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
})

// Request interceptor - attach Authorization header
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const accessToken = localStorage.getItem('accessToken')
      if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`
      }
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor - handle 401 and token refresh
let isRefreshing = false
let failedQueue: Array<{
  resolve: (value: unknown) => void
  reject: (reason?: unknown) => void
  config: AxiosRequestConfig
}> = []

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject, config }) => {
    if (error) {
      reject(error)
    } else {
      if (config.headers) {
        config.headers.Authorization = `Bearer ${token}`
      }
      resolve(api(config))
    }
  })
  failedQueue = []
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject, config: originalRequest })
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        const refreshToken = typeof window !== 'undefined'
          ? localStorage.getItem('refreshToken')
          : null

        if (!refreshToken) {
          throw new Error('No refresh token')
        }

        const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refreshToken,
        })

        // Backend wraps in { success, data, timestamp } via TransformInterceptor
        const payload = response.data?.data ?? response.data
        const { accessToken, refreshToken: newRefreshToken } = payload

        if (typeof window !== 'undefined') {
          localStorage.setItem('accessToken', accessToken)
          if (newRefreshToken) {
            localStorage.setItem('refreshToken', newRefreshToken)
          }
        }

        api.defaults.headers.common.Authorization = `Bearer ${accessToken}`
        originalRequest.headers.Authorization = `Bearer ${accessToken}`

        processQueue(null, accessToken)
        isRefreshing = false

        return api(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError as Error, null)
        isRefreshing = false

        if (typeof window !== 'undefined') {
          localStorage.removeItem('accessToken')
          localStorage.removeItem('refreshToken')
          localStorage.removeItem('user')
          window.location.href = '/login'
        }

        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)

export default api
