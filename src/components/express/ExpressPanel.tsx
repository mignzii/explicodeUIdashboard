'use client'

import React, { useCallback, useEffect, useState } from 'react'
import type { ExpressLesson, ExpressSlide, SubLesson } from '@/types'
import {
  expressApi, generateExpress, previewExpress, commitExpress, pipelineAvailable,
} from '@/lib/expressApi'

const MAX = { headline: 60, body: 140, title: 120, hook: 160 }

/** Brouillon vide pour la rédaction à la main (id vide = pas encore enregistré). */
const emptyDraft = (subLessonId: string, title: string): ExpressLesson => ({
  id: '',
  subLessonId,
  lang: 'FR',
  title,
  hook: '',
  theme: 'ocean',
  badge: null,
  status: 'draft',
  slides: [1, 2, 3].map((order) => ({ order, headline: '', body: '' })),
  question: '',
  options: ['', '', ''],
  correctIndex: 0,
  explanation: '',
})

/** Ce qui empêche d'enregistrer (null si tout est bon). */
function problemOf(e: ExpressLesson): string | null {
  const over = (v: string, max: number) => v.length > max
  if (!e.title.trim() || !e.hook.trim()) return 'Le titre et l’accroche sont requis.'
  if (over(e.title, MAX.title) || over(e.hook, MAX.hook)) return 'Le titre ou l’accroche dépasse la longueur maximale.'
  if (e.slides.some((s) => !s.headline.trim() || !s.body.trim())) return 'Chaque carte doit avoir un titre et un texte.'
  if (e.slides.some((s) => over(s.headline, MAX.headline) || over(s.body, MAX.body))) return 'Une carte dépasse la longueur maximale.'
  if (!e.question.trim() || !e.explanation.trim()) return 'La question et son explication sont requises.'
  const filled = e.options.filter((o) => o.trim())
  if (filled.length < 2) return 'Il faut au moins deux réponses.'
  if (!e.options[e.correctIndex]?.trim()) return 'La bonne réponse cochée est vide.'
  return null
}

interface Props {
  subLesson: SubLesson
  onClose: () => void
}

export default function ExpressPanel({ subLesson, onClose }: Props) {
  const [express, setExpress] = useState<ExpressLesson | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState('')
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setExpress(await expressApi.bySubLesson(subLesson.id))
    } catch {
      setExpress(null)
    } finally {
      setLoading(false)
    }
  }, [subLesson.id])

  useEffect(() => { void load() }, [load])

  /** Génère un brouillon, attend la fin du job, puis le commit en base. */
  const handleGenerate = async () => {
    setBusy(true)
    setError(null)
    setProgress('Démarrage…')
    try {
      const { job_id } = await generateExpress(subLesson.id)

      for (let i = 0; i < 60; i++) {
        await new Promise((r) => setTimeout(r, 2000))
        const p = await previewExpress(job_id)
        setProgress(p.progress)
        if (p.status === 'error') throw new Error(p.error || 'Génération échouée')
        if (p.status === 'done') {
          await commitExpress(job_id)
          await load()
          return
        }
      }
      throw new Error('La génération a dépassé deux minutes')
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
      setProgress('')
    }
  }

  const patch = (changes: Partial<ExpressLesson>) =>
    setExpress((prev) => (prev ? { ...prev, ...changes } : prev))

  const patchSlide = (index: number, changes: Partial<ExpressSlide>) =>
    setExpress((prev) =>
      prev
        ? {
            ...prev,
            slides: prev.slides.map((s, i) => (i === index ? { ...s, ...changes } : s)),
          }
        : prev,
    )

  const handleSave = async (publish: boolean) => {
    if (!express) return
    const problem = problemOf(express)
    if (problem) {
      setError(problem)
      return
    }
    setBusy(true)
    setError(null)
    // Les réponses vides (3e réponse facultative) sont retirées ; l'index de
    // la bonne réponse suit.
    const kept = express.options.map((o, i) => ({ o: o.trim(), i })).filter((x) => x.o)
    const payload = {
      title: express.title.trim(),
      hook: express.hook.trim(),
      badge: express.badge || undefined,
      theme: express.theme,
      slides: express.slides.map((s, i) => ({ order: i + 1, headline: s.headline.trim(), body: s.body.trim() })),
      question: express.question.trim(),
      options: kept.map((x) => x.o),
      correctIndex: kept.findIndex((x) => x.i === express.correctIndex),
      explanation: express.explanation.trim(),
      ...(publish ? { status: 'published' as const } : {}),
    }
    try {
      const saved = express.id
        ? await expressApi.update(express.id, payload)
        : await expressApi.create({ ...payload, subLessonId: subLesson.id, lang: 'FR', status: publish ? 'published' : 'draft' } as Omit<ExpressLesson, 'id'>)
      setExpress({ ...saved, options: saved.options.length < 3 ? [...saved.options, ''] : saved.options })
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold">Leçon express</h2>
            <p className="text-sm text-gray-500">{subLesson.title}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>

        {error && (
          <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>
        )}

        {loading ? (
          <p className="text-sm text-gray-500">Chargement…</p>
        ) : !express ? (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Cette sous-leçon n&apos;a pas encore de leçon express : 3 à 5 cartes courtes, puis une question.
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setExpress(emptyDraft(subLesson.id, subLesson.title))}
                disabled={busy}
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                Rédiger à la main
              </button>
              {pipelineAvailable && (
                <button
                  onClick={handleGenerate}
                  disabled={busy}
                  className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {busy ? progress || 'Génération…' : 'Générer un brouillon avec l’IA'}
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="flex items-center gap-2">
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                  express.status === 'published'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-amber-100 text-amber-700'
                }`}
              >
                {!express.id ? 'Nouvelle, pas encore enregistrée' : express.status === 'published' ? 'Publiée' : 'Brouillon'}
              </span>
            </div>

            <Field
              label="Titre"
              value={express.title}
              max={MAX.title}
              onChange={(v) => patch({ title: v })}
            />
            <Field
              label="Accroche"
              value={express.hook}
              max={MAX.hook}
              onChange={(v) => patch({ hook: v })}
            />

            {express.slides.map((slide, i) => (
              <div key={i} className="rounded-xl border border-gray-200 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase text-gray-400">Carte {i + 1}</p>
                  {express.slides.length > 3 && (
                    <button
                      onClick={() => patch({ slides: express.slides.filter((_, j) => j !== i) })}
                      className="text-xs text-red-500 hover:text-red-700"
                    >
                      Retirer
                    </button>
                  )}
                </div>
                <Field
                  label="Titre"
                  value={slide.headline}
                  max={MAX.headline}
                  onChange={(v) => patchSlide(i, { headline: v })}
                />
                <Field
                  label="Texte"
                  value={slide.body}
                  max={MAX.body}
                  onChange={(v) => patchSlide(i, { body: v })}
                />
              </div>
            ))}

            {express.slides.length < 5 && (
              <button
                onClick={() =>
                  patch({ slides: [...express.slides, { order: express.slides.length + 1, headline: '', body: '' }] })
                }
                className="w-full rounded-xl border border-dashed border-gray-300 py-2 text-sm text-gray-500 hover:bg-gray-50"
              >
                + Ajouter une carte ({express.slides.length}/5)
              </button>
            )}

            <div className="rounded-xl border border-gray-200 p-3">
              <p className="mb-2 text-xs font-semibold uppercase text-gray-400">Question</p>
              <Field
                label="Énoncé"
                value={express.question}
                onChange={(v) => patch({ question: v })}
              />
              <p className="mb-2 text-xs text-gray-400">Coche la bonne réponse. La 3ᵉ réponse est facultative.</p>
              {express.options.map((opt, i) => (
                <label key={i} className="mb-2 flex items-center gap-2">
                  <input
                    type="radio"
                    checked={express.correctIndex === i}
                    onChange={() => patch({ correctIndex: i })}
                  />
                  <input
                    className="flex-1 rounded-lg border border-gray-300 px-2 py-1 text-sm"
                    value={opt}
                    onChange={(e) =>
                      patch({
                        options: express.options.map((o, j) =>
                          j === i ? e.target.value : o,
                        ),
                      })
                    }
                  />
                </label>
              ))}
              <Field
                label="Explication"
                value={express.explanation}
                onChange={(v) => patch({ explanation: v })}
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => handleSave(false)}
                disabled={busy}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold disabled:opacity-50"
              >
                Enregistrer
              </button>
              <button
                onClick={() => handleSave(true)}
                disabled={busy}
                className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                Publier
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function Field({
  label, value, max, onChange,
}: {
  label: string
  value: string
  max?: number
  onChange: (v: string) => void
}) {
  const over = max !== undefined && value.length > max
  return (
    <div className="mb-3">
      <div className="mb-1 flex items-baseline justify-between">
        <label className="text-xs font-medium text-gray-600">{label}</label>
        {max !== undefined && (
          <span className={`text-xs ${over ? 'text-red-600' : 'text-gray-400'}`}>
            {value.length}/{max}
          </span>
        )}
      </div>
      <input
        className={`w-full rounded-lg border px-3 py-2 text-sm ${
          over ? 'border-red-400' : 'border-gray-300'
        }`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  )
}
