// ─────────────────────────────────────────────────────────────────────────────
// Accès au pipeline IA (FastAPI) — génération de leçons, audio, express.
//
// Le pipeline exige le jeton de l'administrateur connecté (il le fait vérifier
// par l'API). En production il est servi par le même hôte que l'API, sous
// /pipeline : son adresse se déduit de NEXT_PUBLIC_API_URL, rien à configurer.
// ─────────────────────────────────────────────────────────────────────────────

import api from './api'

function defaultPipelineUrl(): string {
  if (process.env.NODE_ENV === 'development') return 'http://localhost:8000'
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://38.180.154.173.nip.io/api/v1'
  try {
    return `${new URL(apiUrl).origin}/pipeline`
  } catch {
    return 'http://localhost:8000'
  }
}

export const PIPELINE_URL = process.env.NEXT_PUBLIC_PIPELINE_URL || defaultPipelineUrl()

/** Le pipeline est joignable (en local il tourne sur localhost:8000). */
export const pipelineAvailable = !PIPELINE_URL.startsWith('http://localhost') || process.env.NODE_ENV === 'development'

function authHeader(): Record<string, string> {
  if (typeof window === 'undefined') return {}
  const token = localStorage.getItem('accessToken')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

/**
 * fetch vers le pipeline avec le jeton admin. Si le jeton a expiré (401), un
 * appel à l'API déclenche son renouvellement, puis la requête est rejouée.
 */
export async function pipelineFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const send = () =>
    fetch(`${PIPELINE_URL}${path}`, { ...init, headers: { ...(init.headers || {}), ...authHeader() } })
  const res = await send()
  if (res.status !== 401) return res
  try {
    await api.get('/users/me')
  } catch {
    return res
  }
  return send()
}
