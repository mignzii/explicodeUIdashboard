import type { Thought, ThoughtBackground, ThoughtDuration, ThoughtKind, ThoughtPayload } from './thoughtsApi'

export const TEXT_MAX = 140
export const CAPTION_MAX = 100
export const PHOTO_MAX_BYTES = 5 * 1024 * 1024

/** Fonds de la charte, avec la couleur du texte qui reste lisible dessus. */
export const THOUGHT_BACKGROUNDS: {
  value: ThoughtBackground
  label: string
  bg: string
  fg: string
  accent: string
}[] = [
  { value: 'nuit', label: 'Nuit', bg: '#0F1B33', fg: '#FFFFFF', accent: '#C5E128' },
  { value: 'citron', label: 'Citron', bg: '#C5E128', fg: '#0F1B33', accent: '#0F1B33' },
  { value: 'foret', label: 'Forêt', bg: '#2F7A2F', fg: '#FFFFFF', accent: '#C5E128' },
  { value: 'sable', label: 'Sable', bg: '#F4F8E2', fg: '#0F1B33', accent: '#2F7A2F' },
]

export const THOUGHT_DURATIONS: { value: ThoughtDuration; label: string }[] = [
  { value: 24, label: '24 h' },
  { value: 72, label: '3 jours' },
  { value: 168, label: '7 jours' },
]

export interface ThoughtForm {
  kind: ThoughtKind
  text: string
  caption: string
  background: ThoughtBackground
  imageUrl: string
  durationHours: ThoughtDuration
  isPublished: boolean
}

export const DEFAULT_FORM: ThoughtForm = {
  kind: 'text',
  text: '',
  caption: '',
  background: 'nuit',
  imageUrl: '',
  durationHours: 72,
  isPublished: true,
}

/** Message d'erreur à montrer, ou null si le formulaire est prêt à partir. */
export function validateThought(form: ThoughtForm): string | null {
  if (form.kind === 'text') {
    if (!form.text.trim()) return 'Écris ta pensée'
    if (form.text.length > TEXT_MAX) return `La pensée fait plus de ${TEXT_MAX} caractères`
    return null
  }
  if (!form.imageUrl) return 'Ajoute une photo'
  if (form.caption.length > CAPTION_MAX) return `La légende fait plus de ${CAPTION_MAX} caractères`
  return null
}

/** Ce que reçoit le serveur : seuls les champs du type choisi. */
export function toPayload(form: ThoughtForm): ThoughtPayload {
  const base = { durationHours: form.durationHours, isPublished: form.isPublished }
  if (form.kind === 'text') {
    return { kind: 'text', text: form.text.trim(), background: form.background, ...base }
  }
  const caption = form.caption.trim()
  return { kind: 'photo', imageUrl: form.imageUrl, ...(caption ? { caption } : {}), ...base }
}

/**
 * Ce que reçoit le serveur pour une modification : le type ne change jamais, et une
 * légende vidée part en `null` — sinon l'ancienne resterait affichée dans l'app.
 */
export function toUpdatePayload(form: ThoughtForm): Omit<ThoughtPayload, 'kind'> {
  const base = { durationHours: form.durationHours, isPublished: form.isPublished }
  if (form.kind === 'text') return { text: form.text.trim(), background: form.background, ...base }
  return { imageUrl: form.imageUrl, caption: form.caption.trim() || null, ...base }
}

export function formFromThought(t: Thought): ThoughtForm {
  return {
    kind: t.kind,
    text: t.text ?? '',
    caption: t.caption ?? '',
    background: t.background ?? 'nuit',
    imageUrl: t.imageUrl ?? '',
    durationHours: (t.durationHours as ThoughtDuration) ?? 72,
    isPublished: t.isPublished,
  }
}

export type ThoughtStatus = 'visible' | 'draft' | 'expired'

export function statusOf(t: Pick<Thought, 'isPublished' | 'expiresAt'>, now: Date): ThoughtStatus {
  if (!t.isPublished) return 'draft'
  if (!t.expiresAt || new Date(t.expiresAt).getTime() <= now.getTime()) return 'expired'
  return 'visible'
}

/** « 3 oct. à 14:30 » : date de disparition d'une pensée publiée à `from`. */
export function disappearsAt(durationHours: number, from: Date): string {
  const end = new Date(from.getTime() + durationHours * 3_600_000)
  const date = end.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
  const time = end.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  return `${date} à ${time}`
}

export function expiryLabel(t: Pick<Thought, 'isPublished' | 'expiresAt'>, now: Date): string {
  const status = statusOf(t, now)
  if (status === 'draft') return 'Brouillon'
  if (status === 'expired') return 'Expirée'
  return `Expire le ${disappearsAt(0, new Date(t.expiresAt as string))}`
}

/**
 * Date de disparition annoncée dans la fenêtre. Une pensée encore visible garde son
 * début réel ; une nouvelle, une expirée ou un brouillon repartent de maintenant
 * (c'est ce que fait le serveur à la publication).
 */
export function disappearsLabel(
  form: Pick<ThoughtForm, 'durationHours'>,
  existing: Pick<Thought, 'isPublished' | 'expiresAt' | 'publishedAt'> | null,
  now: Date,
): string {
  const live = existing && statusOf(existing, now) === 'visible' && existing.publishedAt
  return disappearsAt(form.durationHours, live ? new Date(existing.publishedAt as string) : now)
}

/** Ce que fait l'interrupteur « Dans l'app » : retire une pensée visible, publie (ou republie) les autres. */
export function nextPublished(status: ThoughtStatus): boolean {
  return status !== 'visible'
}
