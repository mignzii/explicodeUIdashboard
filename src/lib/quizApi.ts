// ─────────────────────────────────────────────────────────────────────────────
// Quiz API — Appels vers le backend NestJS /quiz
// ─────────────────────────────────────────────────────────────────────────────

import api from './api'
import type {
  QuizCategory, QuizQuestion, ExamBlanc, QuizAttempt, QuizStats,
  CreateQuizCategoryPayload, CreateQuizQuestionPayload, CreateExamBlancPayload,
  PaginatedResponse, QuestionDifficulty,
} from '@/types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function unwrap(response: { data: any }): any {
  const d = response.data
  return d?.data ?? d
}

// ── Catégories ────────────────────────────────────────────────────────────────

export const quizCategoriesApi = {
  list: async (): Promise<QuizCategory[]> =>
    unwrap(await api.get('/quiz/categories')),

  create: async (data: CreateQuizCategoryPayload): Promise<QuizCategory> =>
    unwrap(await api.post('/quiz/categories', data)),

  update: async (id: string, data: Partial<CreateQuizCategoryPayload>): Promise<QuizCategory> =>
    unwrap(await api.patch(`/quiz/categories/${id}`, data)),

  delete: async (id: string): Promise<void> => {
    await api.delete(`/quiz/categories/${id}`)
  },
}

// ── Questions ─────────────────────────────────────────────────────────────────

export interface ListQuestionsParams {
  categoryId?: string
  moduleId?: string
  lang?: string
  difficulty?: QuestionDifficulty
  page?: number
  limit?: number
}

export const quizQuestionsApi = {
  list: async (params?: ListQuestionsParams): Promise<PaginatedResponse<QuizQuestion>> =>
    unwrap(await api.get('/quiz/questions', { params })),

  create: async (data: CreateQuizQuestionPayload): Promise<QuizQuestion> =>
    unwrap(await api.post('/quiz/questions', data)),

  update: async (id: string, data: Partial<CreateQuizQuestionPayload>): Promise<QuizQuestion> =>
    unwrap(await api.patch(`/quiz/questions/${id}`, data)),

  delete: async (id: string): Promise<void> => {
    await api.delete(`/quiz/questions/${id}`)
  },

  getByCategory: async (categoryId: string, limit?: number): Promise<QuizQuestion[]> =>
    unwrap(await api.get(`/quiz/${categoryId}/questions`, { params: { limit } })),

  getByModule: async (moduleId: string, limit?: number): Promise<QuizQuestion[]> =>
    unwrap(await api.get(`/quiz/module/${moduleId}/questions`, { params: { limit } })),
}

// ── Exam Blanc ────────────────────────────────────────────────────────────────

export const examBlancApi = {
  list: async (): Promise<ExamBlanc[]> =>
    unwrap(await api.get('/quiz/exam-blanc')),

  create: async (data: CreateExamBlancPayload): Promise<ExamBlanc> =>
    unwrap(await api.post('/quiz/exam-blanc', data)),

  update: async (id: string, data: Partial<CreateExamBlancPayload>): Promise<ExamBlanc> =>
    unwrap(await api.patch(`/quiz/exam-blanc/${id}`, data)),

  delete: async (id: string): Promise<void> => {
    await api.delete(`/quiz/exam-blanc/${id}`)
  },

  getQuestions: async (id: string): Promise<QuizQuestion[]> =>
    unwrap(await api.get(`/quiz/exam-blanc/${id}/questions`)),
}

// ── Tentatives & stats ────────────────────────────────────────────────────────

export const quizAttemptsApi = {
  getHistory: async (): Promise<QuizAttempt[]> =>
    unwrap(await api.get('/quiz/history')),

  getStats: async (): Promise<QuizStats> =>
    unwrap(await api.get('/quiz/stats')),

  getGlobalHistory: async (limit?: number): Promise<QuizAttempt[]> =>
    unwrap(await api.get('/quiz/admin/history', { params: { limit } })),

  getGlobalStats: async (): Promise<QuizStats> =>
    unwrap(await api.get('/quiz/admin/stats')),
}
