'use client'

import { useState, useRef, useEffect } from 'react'
import {
  runPipeline, getJobStatus, getPreview, commitPipeline,
  getModules, getCategories,
  LessonPreview, JobStatus, Module, Category,
} from '@/lib/pipelineApi'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

type Step = 'upload' | 'processing' | 'preview' | 'done'

export default function PipelinePage() {
  const [step, setStep] = useState<Step>('upload')

  // Upload form
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [imageFiles, setImageFiles] = useState<File[]>([])

  // Override (shown in preview)
  const [modules, setModules] = useState<Module[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [overrideModuleId, setOverrideModuleId] = useState('')
  const [overrideCategoryName, setOverrideCategoryName] = useState('')
  const [showOverride, setShowOverride] = useState(false)

  // Pipeline state
  const [jobId, setJobId] = useState<string | null>(null)
  const [progress, setProgress] = useState('')
  const [preview, setPreview] = useState<LessonPreview | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<{ lesson_id: string; sub_lessons_count: number } | null>(null)
  const pollRef = useRef<NodeJS.Timeout | null>(null)

  // Load modules for override UI
  useEffect(() => {
    getModules().then(data => setModules(Array.isArray(data) ? data : [])).catch(() => {})
  }, [])

  useEffect(() => {
    if (!overrideModuleId) return
    getCategories(overrideModuleId).then(data => setCategories(Array.isArray(data) ? data : [])).catch(() => {})
  }, [overrideModuleId])

  const handleSubmit = async () => {
    if (!pdfFile || imageFiles.length === 0) {
      setError('Sélectionne un PDF et les images correspondantes')
      return
    }
    setError(null)
    const fd = new FormData()
    fd.append('pdf', pdfFile)
    imageFiles.forEach(f => fd.append('images', f))

    try {
      const { job_id } = await runPipeline(fd)
      setJobId(job_id)
      setStep('processing')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erreur inconnue')
    }
  }

  useEffect(() => {
    if (step !== 'processing' || !jobId) return
    pollRef.current = setInterval(async () => {
      try {
        const status: JobStatus = await getJobStatus(jobId)
        setProgress(status.progress)
        if (status.status === 'preview_ready') {
          clearInterval(pollRef.current!)
          const data = await getPreview(jobId)
          setPreview(data)
          setOverrideModuleId(data.module_id)
          setOverrideCategoryName(data.category_name)
          setStep('preview')
        }
        if (status.status === 'error') {
          clearInterval(pollRef.current!)
          setError(status.progress)
          setStep('upload')
        }
      } catch { /* ignore polling errors */ }
    }, 2000)
    return () => clearInterval(pollRef.current!)
  }, [step, jobId])

  const handleCommit = async () => {
    if (!jobId) return
    try {
      const r = await commitPipeline(jobId)
      setResult(r)
      setStep('done')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erreur inconnue')
    }
  }

  const reset = () => {
    setStep('upload'); setPreview(null); setJobId(null)
    setResult(null); setError(null); setPdfFile(null)
    setImageFiles([]); setShowOverride(false)
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Pipeline IA — Ingestion de contenu</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded text-sm">{error}</div>
      )}

      {/* Étape 1 — Upload simplifié */}
      {step === 'upload' && (
        <Card>
          <CardHeader>
            <CardTitle>Upload du contenu</CardTitle>
            <p className="text-sm text-gray-500 mt-1">Le module et la catégorie seront détectés automatiquement depuis le PDF.</p>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-1.5">
              <Label>PDF de la leçon</Label>
              <Input type="file" accept=".pdf" onChange={e => setPdfFile(e.target.files?.[0] || null)} />
              {pdfFile && <p className="text-xs text-gray-500">{pdfFile.name}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>
                Images des panneaux{' '}
                <span className="text-gray-400 font-normal">(nommées 01_xxx.png, 02_xxx.png…)</span>
              </Label>
              <Input type="file" accept="image/*" multiple onChange={e => setImageFiles(Array.from(e.target.files || []))} />
              {imageFiles.length > 0 && (
                <p className="text-xs text-gray-500">{imageFiles.length} image(s) sélectionnée(s)</p>
              )}
            </div>
            <Button onClick={handleSubmit} disabled={!pdfFile || imageFiles.length === 0} className="w-full">
              Analyser et traiter
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Étape 2 — Traitement */}
      {step === 'processing' && (
        <Card>
          <CardHeader><CardTitle>Traitement en cours…</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600" />
              <p className="text-gray-600 text-sm">{progress || 'Démarrage…'}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Étape 3 — Preview */}
      {step === 'preview' && preview && (
        <div className="space-y-4">
          {/* Contexte détecté */}
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="space-y-0.5">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Module détecté</p>
                  <p className="font-medium">{preview.module_title || preview.module_id}</p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Catégorie</p>
                  <p className="font-medium">{overrideCategoryName || preview.category_name}</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => setShowOverride(v => !v)}>
                  {showOverride ? 'Fermer' : '✏️ Modifier'}
                </Button>
              </div>

              {showOverride && (
                <div className="mt-4 pt-4 border-t grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Module</Label>
                    <select
                      className="w-full border rounded-md px-3 py-2 text-sm bg-white"
                      value={overrideModuleId}
                      onChange={e => setOverrideModuleId(e.target.value)}
                    >
                      <option value="">— Choisir —</option>
                      {modules.map(m => (
                        <option key={m.id} value={m.id}>{m.icon} {m.title}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Catégorie</Label>
                    <select
                      className="w-full border rounded-md px-3 py-2 text-sm bg-white"
                      value={overrideCategoryName}
                      onChange={e => setOverrideCategoryName(e.target.value)}
                    >
                      <option value={overrideCategoryName}>{overrideCategoryName} (détectée)</option>
                      {categories.filter(c => c.title !== overrideCategoryName).map(c => (
                        <option key={c.id} value={c.title}>{c.title}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Sous-leçons */}
          <Card>
            <CardHeader>
              <CardTitle>Validation — {preview.sub_lessons.length} sous-leçons</CardTitle>
              <p className="text-sm text-gray-500 mt-1">« {preview.title} »</p>
            </CardHeader>
            <CardContent className="space-y-3">
              {preview.sub_lessons.map(sl => (
                <div key={sl.number} className="border rounded-lg p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">#{sl.number}</Badge>
                    <span className="font-medium text-sm">{sl.title}</span>
                  </div>
                  {sl.image_url && (
                    <img src={sl.image_url} alt={sl.title} className="h-16 w-16 object-contain border rounded" />
                  )}
                  <p className="text-sm text-gray-700">{sl.content.description}</p>
                  {sl.content.bullets.length > 0 && (
                    <ul className="text-sm text-gray-600 list-disc list-inside space-y-0.5">
                      {sl.content.bullets.map((b, i) => <li key={i}>{b}</li>)}
                    </ul>
                  )}
                  {sl.content.did_you_know && (
                    <p className="text-sm italic text-indigo-600">💡 {sl.content.did_you_know}</p>
                  )}
                </div>
              ))}
              <Button onClick={handleCommit} className="w-full mt-2">
                ✅ Valider et insérer en base de données
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Étape 4 — Succès */}
      {step === 'done' && result && (
        <Card>
          <CardHeader><CardTitle>✅ Contenu inséré avec succès</CardTitle></CardHeader>
          <CardContent>
            <p className="text-gray-700">{result.sub_lessons_count} sous-leçons créées.</p>
            <Button variant="outline" className="mt-4" onClick={reset}>
              Traiter un autre PDF
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
