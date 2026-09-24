// ─────────────────────────────────────────────────────────────────────────────
// Express API — leçons express (NestJS) et génération de brouillons (pipeline)
// ─────────────────────────────────────────────────────────────────────────────

import api from './api'
import type { ExpressLesson } from '@/types'

const PIPELINE_URL = process.env.NEXT_PUBLIC_PIPELINE_URL || 'http://localhost:8000'

/**
 * Génération par l'IA disponible ? En production, le pipeline n'est pas
 * déployé : sans NEXT_PUBLIC_PIPELINE_URL on n'affiche que la rédaction à la
 * main (en local, le pipeline tourne sur localhost:8000).
 */
export const pipelineAvailable =
  Boolean(process.env.NEXT_PUBLIC_PIPELINE_URL) || process.env.NODE_ENV === 'development'

const unwrap = <T,>(res: { data: unknown }): T => {
  const d = res.data as { data?: T }
  return (d?.data ?? (res.data as T)) as T
}

export const expressApi = {
  /** Express d'une sous-leçon, ou null si elle n'en a pas encore. */
  bySubLesson: async (subLessonId: string): Promise<ExpressLesson | null> =>
    unwrap<ExpressLesson | null>(await api.get(`/express/sub-lesson/${subLessonId}`)),

  /** Création directe (rédaction à la main), sans passer par le pipeline. */
  create: async (data: Omit<ExpressLesson, 'id'>): Promise<ExpressLesson> =>
    unwrap<ExpressLesson>(await api.post('/express', data)),

  update: async (id: string, data: Partial<ExpressLesson>): Promise<ExpressLesson> =>
    unwrap<ExpressLesson>(await api.patch(`/express/${id}`, data)),

  remove: async (id: string): Promise<void> => {
    await api.delete(`/express/${id}`)
  },
}

export interface ExpressPreview {
  job_id: string
  status: 'pending' | 'processing' | 'done' | 'error'
  progress: string
  draft: {
    title: string
    hook: string
    badge: string | null
    slides: { order: number; headline: string; body: string }[]
    question: string
    options: string[]
    correct_index: number
    explanation: string
  } | null
  committed_id: string | null
  error: string | null
}

export async function generateExpress(subLessonId: string): Promise<{ job_id: string }> {
  const res = await fetch(`${PIPELINE_URL}/express/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sub_lesson_id: subLessonId }),
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export async function previewExpress(jobId: string): Promise<ExpressPreview> {
  const res = await fetch(`${PIPELINE_URL}/express/preview/${jobId}`)
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export async function commitExpress(jobId: string): Promise<{ express_id: string }> {
  const res = await fetch(`${PIPELINE_URL}/express/commit/${jobId}`, { method: 'POST' })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}
