// ─────────────────────────────────────────────────────────────────────────────
// Learning API — Appels vers le backend NestJS
// Utilise le client axios avec refresh token automatique
// ─────────────────────────────────────────────────────────────────────────────

import api from './api'

// ── Types payload ─────────────────────────────────────────────────────────

export interface CreateModulePayload {
  title: string
  icon?: string
  color?: string
  order?: number
  isLocked?: boolean
}

export interface CreateCategoryPayload {
  moduleId: string
  title: string
  order?: number
}

export interface CreateLessonPayload {
  categoryId: string
  title: string
  order?: number
  isLocked?: boolean
  icon?: string
  iconColor?: string
  iconBg?: string
}

export interface CreateSubLessonPayload {
  lessonId: string
  number: number
  title: string
  order?: number
  status?: 'locked' | 'in_progress' | 'completed'
  imageUrl?: string
}

export interface CreateContentPayload {
  subLessonId: string
  lang?: 'FR' | 'WO' | 'PU' | 'SE' | 'JO'
  type?: 'slide' | 'audio' | 'video'
  description?: string
  bullets?: string[]
  didYouKnow?: string
  hasVideo?: boolean
  videoUrl?: string
  audioUrl?: string
  readMinutes?: number
  order?: number
}

// ── Helpers ───────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function unwrap(response: { data: any }): unknown {
  const d = response.data
  return d?.data ?? d
}

// ── Modules ───────────────────────────────────────────────────────────────

export const modulesApi = {
  list: async () => unwrap(await api.get('/modules')),
  get: async (id: string) => unwrap(await api.get(`/modules/${id}`)),
  create: async (data: CreateModulePayload) => unwrap(await api.post('/modules', data)),
  update: async (id: string, data: Partial<CreateModulePayload>) => unwrap(await api.patch(`/modules/${id}`, data)),
  delete: async (id: string) => api.delete(`/modules/${id}`),
}

// ── Categories ────────────────────────────────────────────────────────────

export const categoriesApi = {
  list: async (moduleId: string) => unwrap(await api.get(`/modules/${moduleId}/categories`)),
  create: async (data: CreateCategoryPayload) => unwrap(await api.post('/categories', data)),
  update: async (id: string, data: Partial<CreateCategoryPayload>) => unwrap(await api.patch(`/categories/${id}`, data)),
  delete: async (id: string) => api.delete(`/categories/${id}`),
}

// ── Lessons ───────────────────────────────────────────────────────────────

export const lessonsApi = {
  list: async (categoryId: string) => unwrap(await api.get(`/categories/${categoryId}/lessons`)),
  create: async (data: CreateLessonPayload) => unwrap(await api.post('/lessons', data)),
  update: async (id: string, data: Partial<CreateLessonPayload>) => unwrap(await api.patch(`/lessons/${id}`, data)),
  delete: async (id: string) => api.delete(`/lessons/${id}`),
}

// ── Sub-lessons ───────────────────────────────────────────────────────────

export const subLessonsApi = {
  list: async (lessonId: string) => unwrap(await api.get(`/lessons/${lessonId}/sub-lessons`)),
  create: async (data: CreateSubLessonPayload) => unwrap(await api.post('/sub-lessons', data)),
  update: async (id: string, data: Partial<CreateSubLessonPayload>) => unwrap(await api.patch(`/sub-lessons/${id}`, data)),
  delete: async (id: string) => api.delete(`/sub-lessons/${id}`),
}

// ── Uploads ───────────────────────────────────────────────────────────────

export const uploadsApi = {
  lessonImage: async (file: File): Promise<{ url: string }> => {
    const form = new FormData()
    form.append('image', file)
    const res = await api.post('/uploads/lesson-image', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return (res.data?.data ?? res.data) as { url: string }
  },
}

// ── Content ───────────────────────────────────────────────────────────────

export const contentApi = {
  list: async (subLessonId: string, lang = 'FR') =>
    unwrap(await api.get(`/sub-lessons/${subLessonId}/content`, { params: { lang } })),
  create: async (data: CreateContentPayload) => unwrap(await api.post('/content', data)),
  update: async (id: string, data: Partial<CreateContentPayload>) => unwrap(await api.patch(`/content/${id}`, data)),
  delete: async (id: string) => api.delete(`/content/${id}`),
}
