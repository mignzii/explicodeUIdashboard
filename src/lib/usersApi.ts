// ─────────────────────────────────────────────────────────────────────────────
// Utilisateurs — gestion des comptes de l'app (routes /admin/users)
// ─────────────────────────────────────────────────────────────────────────────

import api from './api'
import type { AdminUser, ProfileType } from '@/types'

export interface UsersQuery {
  search?: string
  profileType?: ProfileType
  status?: 'active' | 'inactive'
  region?: string
  page?: number
  limit?: number
}

export interface UsersPage {
  items: AdminUser[]
  total: number
  page: number
  limit: number
}

export interface UsersStats {
  total: number
  active: number
  inactive: number
  newThisWeek: number
  regions: string[]
}

export interface UserDetail {
  user: Omit<AdminUser, 'completedLessons'>
  progress: {
    completedSubLessons: number
    totalSubLessons: number
    completionRate: number
    currentLesson: {
      moduleTitle: string | null
      categoryTitle: string | null
      lessonTitle: string
    } | null
  }
  quiz: {
    attempts: number
    averageScore: number
    bestScore: number
    history: {
      id: string
      score: number
      correctCount: number
      totalCount: number
      durationSeconds: number | null
      isExamBlanc: boolean
      completedAt: string
      categoryTitle: string | null
    }[]
  }
  documents: {
    id: string
    type: string
    organisme: string | null
    expiryDate: string | null
    uploadedAt: string
    status: 'ok' | 'warning' | 'expired'
  }[]
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function unwrap(response: { data: any }): any {
  const d = response.data
  return d?.data ?? d
}

export const usersApi = {
  list: (query: UsersQuery): Promise<UsersPage> => {
    const params = Object.fromEntries(Object.entries(query).filter(([, v]) => v !== undefined && v !== ''))
    return api.get('/admin/users', { params }).then(unwrap)
  },

  stats: (): Promise<UsersStats> => api.get('/admin/users/stats').then(unwrap),

  detail: (id: string): Promise<UserDetail> => api.get(`/admin/users/${id}`).then(unwrap),

  setActive: (id: string, isActive: boolean): Promise<AdminUser> =>
    api.patch(`/admin/users/${id}/status`, { isActive }).then(unwrap),

  remove: (id: string): Promise<void> => api.delete(`/admin/users/${id}`).then(() => undefined),
}

/** Message d'erreur de l'API, sinon un repli lisible. */
export function apiMessage(error: unknown, fallback: string): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const m = (error as any)?.response?.data?.message
  if (Array.isArray(m)) return m.join(' ')
  return typeof m === 'string' ? m : fallback
}

export const profileLabels: Record<ProfileType, string> = {
  apprentissage: 'Apprenant',
  chauffeur: 'Chauffeur',
  agent_routier: 'Agent routier',
  auto_ecole: 'Auto-école',
  admin: 'Administrateur',
}

export function displayName(u: { firstName: string | null; lastName: string | null }): string {
  return [u.firstName, u.lastName].filter(Boolean).join(' ') || 'Profil non renseigné'
}

/** +221771234567 → +221 77 123 45 67 */
export function formatPhone(phone: string): string {
  const m = phone.match(/^\+221(\d{2})(\d{3})(\d{2})(\d{2})$/)
  return m ? `+221 ${m[1]} ${m[2]} ${m[3]} ${m[4]}` : phone
}
