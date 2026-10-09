// ─────────────────────────────────────────────────────────────────────────────
// Pensées — statuts courts affichés dans la bulle de l'accueil de l'app
// ─────────────────────────────────────────────────────────────────────────────

import api from './api'

export type ThoughtKind = 'text' | 'photo'
export type ThoughtBackground = 'nuit' | 'citron' | 'foret' | 'sable'
export type ThoughtDuration = 24 | 72 | 168

export interface Thought {
  id: string
  kind: ThoughtKind
  text: string | null
  caption: string | null
  background: ThoughtBackground | null
  imageUrl: string | null
  durationHours: number
  isPublished: boolean
  publishedAt: string | null
  expiresAt: string | null
  createdAt: string
  updatedAt: string
}

export interface ThoughtPayload {
  kind: ThoughtKind
  text?: string
  /** `null` efface la légende d'une pensée déjà enregistrée. */
  caption?: string | null
  background?: ThoughtBackground
  imageUrl?: string
  durationHours: ThoughtDuration
  isPublished: boolean
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function unwrap(response: { data: any }): any {
  const d = response.data
  return d?.data ?? d
}

export const thoughtsApi = {
  list: (): Promise<Thought[]> => api.get('/thoughts/admin/all').then(unwrap),

  create: (payload: ThoughtPayload): Promise<Thought> => api.post('/thoughts', payload).then(unwrap),

  // Le type ne change jamais après la création : on n'envoie donc pas `kind`.
  update: (id: string, payload: Partial<Omit<ThoughtPayload, 'kind'>>): Promise<Thought> =>
    api.patch(`/thoughts/${id}`, payload).then(unwrap),

  delete: (id: string): Promise<void> => api.delete(`/thoughts/${id}`).then(() => undefined),

  uploadImage: async (file: File): Promise<{ url: string }> => {
    const form = new FormData()
    form.append('image', file)
    const res = await api.post('/uploads/thought-image', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return (res.data?.data ?? res.data) as { url: string }
  },
}
