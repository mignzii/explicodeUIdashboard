// ─────────────────────────────────────────────────────────────────────────────
// Annonces — publiées dans l'écran « Annonces » de l'app (cloche de l'accueil)
// ─────────────────────────────────────────────────────────────────────────────

import api from './api'

export type AnnouncementCategory = 'examen' | 'reglementation' | 'pratique'

export interface Announcement {
  id: string
  title: string
  summary: string
  body: string
  category: AnnouncementCategory
  isPublished: boolean
  publishedAt: string | null
  createdAt: string
  updatedAt: string
}

export type AnnouncementPayload = Pick<Announcement, 'title' | 'summary' | 'body' | 'category' | 'isPublished'>

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function unwrap(response: { data: any }): any {
  const d = response.data
  return d?.data ?? d
}

export const announcementsApi = {
  list: (): Promise<Announcement[]> => api.get('/announcements/admin/all').then(unwrap),

  create: (payload: AnnouncementPayload): Promise<Announcement> => api.post('/announcements', payload).then(unwrap),

  update: (id: string, payload: Partial<AnnouncementPayload>): Promise<Announcement> =>
    api.patch(`/announcements/${id}`, payload).then(unwrap),

  delete: (id: string): Promise<void> => api.delete(`/announcements/${id}`).then(() => undefined),
}
