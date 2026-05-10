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

  // Form state
  const [modules, setModules] = useState<Module[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedModuleId, setSelectedModuleId] = useState('')
  const [selectedCategoryId, setSelectedCategoryId] = useState('')
  const [newCategoryName, setNewCategoryName] = useState('')
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [imageFiles, setImageFiles] = useState<File[]>([])

  // Pipeline state
  const [jobId, setJobId] = useState<string | null>(null)
  const [progress, setProgress] = useState('')
  const [preview, setPreview] = useState<LessonPreview | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<{ lesson_id: string; sub_lessons_count: number } | null>(null)
  const pollRef = useRef<NodeJS.Timeout | null>(null)

  // Load modules on mount
  useEffect(() => {
    getModules()
      .then(setModules)
      .catch(() => setError('Impossible de charger les modules'))
  }, [])

  // Load categories when module changes
  useEffect(() => {
    if (!selectedModuleId) { setCategories([]); setSelectedCategoryId(''); return }
    getCategories(selectedModuleId)
      .then(setCategories)
      .catch(() => setError('Impossible de charger les catégories'))
  }, [selectedModuleId])

  const categoryName = selectedCategoryId === '__new__'
    ? newCategoryName
    : categories.find(c => c.id === selectedCategoryId)?.title ?? ''

  const canSubmit = pdfFile && imageFiles.length > 0 && selectedModuleId &&
    (selectedCategoryId !== '' && selectedCategoryId !== '__new__' || newCategoryName.trim() !== '')

  const handleSubmit = async () => {
    if (!canSubmit) { setError('Tous les champs sont requis'); return }
    setError(null)
    const fd = new FormData()
    fd.append('module_id', selectedModuleId)
    fd.append('category_name', categoryName)
    fd.append('pdf', pdfFile!)
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
      const status: JobStatus = await getJobStatus(jobId)
      setProgress(status.progress)
      if (status.status === 'preview_ready') {
        clearInterval(pollRef.current!)
        const data = await getPreview(jobId)
        setPreview(data)
        setStep('preview')
      }
      if (status.status === 'error') {
        clearInterval(pollRef.current!)
        setError(status.progress)
        setStep('upload')
      }
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
    setStep('upload')
    setPreview(null)
    setJobId(null)
    setResult(null)
    setError(null)
    setPdfFile(null)
    setImageFiles([])
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Pipeline IA — Ingestion de contenu</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded text-sm">
          {error}
        </div>
      )}

      {/* Étape 1 — Upload */}
      {step === 'upload' && (
        <Card>
          <CardHeader><CardTitle>Étape 1 — Configurer et uploader</CardTitle></CardHeader>
          <CardContent className="space-y-5">

            {/* Module */}
            <div className="space-y-1.5">
              <Label>Module</Label>
              <select
                className="w-full border rounded-md px-3 py-2 text-sm bg-white"
                value={selectedModuleId}
                onChange={e => setSelectedModuleId(e.target.value)}
              >
                <option value="">— Sélectionner un module —</option>
                {modules.map(m => (
                  <option key={m.id} value={m.id}>{m.icon} {m.title}</option>
                ))}
              </select>
            </div>

            {/* Catégorie */}
            {selectedModuleId && (
              <div className="space-y-1.5">
                <Label>Catégorie</Label>
                <select
                  className="w-full border rounded-md px-3 py-2 text-sm bg-white"
                  value={selectedCategoryId}
                  onChange={e => setSelectedCategoryId(e.target.value)}
                >
                  <option value="">— Sélectionner une catégorie —</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.title}</option>
                  ))}
                  <option value="__new__">+ Créer une nouvelle catégorie</option>
                </select>
                {selectedCategoryId === '__new__' && (
                  <Input
                    placeholder="Nom de la nouvelle catégorie"
                    value={newCategoryName}
                    onChange={e => setNewCategoryName(e.target.value)}
                    className="mt-2"
                  />
                )}
              </div>
            )}

            {/* PDF */}
            <div className="space-y-1.5">
              <Label>PDF de la leçon</Label>
              <Input
                type="file"
                accept=".pdf"
                onChange={e => setPdfFile(e.target.files?.[0] || null)}
              />
              {pdfFile && <p className="text-xs text-gray-500">{pdfFile.name}</p>}
            </div>

            {/* Images */}
            <div className="space-y-1.5">
              <Label>Images des panneaux <span className="text-gray-400 font-normal">(nommées 01_xxx.png, 02_xxx.png…)</span></Label>
              <Input
                type="file"
                accept="image/*"
                multiple
                onChange={e => setImageFiles(Array.from(e.target.files || []))}
              />
              {imageFiles.length > 0 && (
                <p className="text-xs text-gray-500">{imageFiles.length} image(s) sélectionnée(s)</p>
              )}
            </div>

            <Button onClick={handleSubmit} disabled={!canSubmit} className="w-full">
              Lancer le traitement
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Étape 2 — Traitement */}
      {step === 'processing' && (
        <Card>
          <CardHeader><CardTitle>Étape 2 — Traitement en cours…</CardTitle></CardHeader>
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
        <Card>
          <CardHeader>
            <CardTitle>Étape 3 — Validation</CardTitle>
            <p className="text-sm text-gray-500 mt-1">
              <span className="font-medium">{preview.title}</span> · {preview.sub_lessons.length} sous-leçons · catégorie <span className="font-medium">{preview.category_name}</span>
            </p>
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
