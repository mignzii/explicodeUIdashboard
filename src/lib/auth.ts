'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import api from './api'

export interface AdminUser {
  id: string
  phone: string
  firstName: string
  lastName: string
  role: 'AGENT_ROUTIER' | 'AUTO_ECOLE' | 'ADMIN'
  avatarUrl?: string
  region?: string
}

interface AuthState {
  user: AdminUser | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (phone: string, otp: string) => Promise<void>
  requestOtp: (phone: string) => Promise<string | null>
  logout: () => void
  setUser: (user: AdminUser) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,

      requestOtp: async (phone: string) => {
        const response = await api.post('/auth/send-otp', { phone })
        const payload = response.data?.data ?? response.data
        return (payload?.demoOtp ?? payload?.otp ?? null) as string | null
      },

      login: async (phone: string, otp: string) => {
        set({ isLoading: true })
        try {
          const response = await api.post('/auth/verify-otp', { phone, code: otp })
          // Backend wraps in { success, data, timestamp } via TransformInterceptor
          const payload = response.data?.data ?? response.data
          const { accessToken, refreshToken } = payload

          if (typeof window !== 'undefined') {
            localStorage.setItem('accessToken', accessToken)
            localStorage.setItem('refreshToken', refreshToken)
          }

          // Fetch user profile with the new token
          const meResponse = await api.get('/users/me', {
            headers: { Authorization: `Bearer ${accessToken}` },
          })
          const mePayload = meResponse.data?.data ?? meResponse.data
          const adminUser: AdminUser = {
            id: mePayload.id,
            phone: mePayload.phone,
            firstName: mePayload.firstName ?? '',
            lastName: mePayload.lastName ?? '',
            role: mePayload.profileType ?? 'ADMIN',
            avatarUrl: mePayload.avatarUrl,
            region: mePayload.region,
          }

          set({
            user: adminUser,
            accessToken,
            refreshToken,
            isAuthenticated: true,
            isLoading: false,
          })
        } catch (error) {
          set({ isLoading: false })
          throw error
        }
      },

      logout: () => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('accessToken')
          localStorage.removeItem('refreshToken')
        }
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        })
      },

      setUser: (user: AdminUser) => {
        set({ user })
      },
    }),
    {
      name: 'explicode-admin-auth',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)
