// ─────────────────────────────────────────────────────────────────────────────
// Community & Jobs API — Appels vers le backend NestJS
// ─────────────────────────────────────────────────────────────────────────────

import api from './api'
import type {
  Job, JobApplication, Post,
  CreateJobPayload, UpdateJobPayload, UpdateApplicationStatusPayload,
} from '@/types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function unwrap(response: { data: any }): any {
  const d = response.data
  return d?.data ?? d
}

// ── Jobs ──────────────────────────────────────────────────────────────────────

export const jobsApi = {
  list: (): Promise<Job[]> =>
    api.get('/jobs/admin/all').then(unwrap),

  create: (payload: CreateJobPayload): Promise<Job> =>
    api.post('/jobs', payload).then(unwrap),

  update: (id: string, payload: UpdateJobPayload): Promise<Job> =>
    api.patch(`/jobs/${id}`, payload).then(unwrap),

  delete: (id: string): Promise<void> =>
    api.delete(`/jobs/${id}`).then(() => undefined),

  getApplications: (): Promise<JobApplication[]> =>
    api.get('/jobs/admin/applications').then(unwrap),

  updateApplicationStatus: (id: string, payload: UpdateApplicationStatusPayload): Promise<JobApplication> =>
    api.patch(`/jobs/admin/applications/${id}`, payload).then(unwrap),
}

// ── Community Posts ───────────────────────────────────────────────────────────

export const postsApi = {
  list: (): Promise<Post[]> =>
    api.get('/community/posts/admin').then(unwrap),

  delete: (id: string): Promise<void> =>
    api.delete(`/community/posts/${id}`).then(() => undefined),

  flag: (id: string, isFlagged: boolean): Promise<Post> =>
    api.patch(`/community/posts/${id}/flag`, { isFlagged }).then(unwrap),

  deleteComment: (postId: string, commentId: string): Promise<void> =>
    api.delete(`/community/posts/${postId}/comments/${commentId}`).then(() => undefined),
}
