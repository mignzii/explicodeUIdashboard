'use client'

import React, { useCallback, useEffect, useState } from 'react'
import type { ExpressLesson, ExpressSlide, SubLesson } from '@/types'
import {
  expressApi, generateExpress, previewExpress, commitExpress,
} from '@/lib/expressApi'

const MAX = { headline: 60, body: 140, title: 120, hook: 160 }

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
    setBusy(true)
    setError(null)
    try {
      const saved = await expressApi.update(express.id, {
        title: express.title,
        hook: express.hook,
        badge: express.badge,
        theme: express.theme,
        slides: express.slides,
        question: express.question,
        options: express.options,
        correctIndex: express.correctIndex,
        explanation: express.explanation,
        ...(publish ? { status: 'published' as const } : {}),
      })
      setExpress(saved)
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
              Cette sous-leçon n&apos;a pas encore de leçon express.
            </p>
            <button
              onClick={handleGenerate}
              disabled={busy}
              className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {busy ? progress || 'Génération…' : 'Générer un brouillon'}
            </button>
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
                {express.status === 'published' ? 'Publiée' : 'Brouillon'}
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
                <p className="mb-2 text-xs font-semibold uppercase text-gray-400">
                  Slide {i + 1}
                </p>
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

            <div className="rounded-xl border border-gray-200 p-3">
              <p className="mb-2 text-xs font-semibold uppercase text-gray-400">Question</p>
              <Field
                label="Énoncé"
                value={express.question}
                onChange={(v) => patch({ question: v })}
              />
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
