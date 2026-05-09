'use client'

import { useState, useRef, useEffect } from 'react'
import { runPipeline, getJobStatus, getPreview, commitPipeline, LessonPreview, JobStatus } from '@/lib/pipelineApi'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

type Step = 'upload' | 'processing' | 'preview' | 'done'

export default function PipelinePage() {
  const [step, setStep] = useState<Step>('upload')
  const [moduleId, setModuleId] = useState('')
  const [categoryName, setCategoryName] = useState('')
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [jobId, setJobId] = useState<string | null>(null)
  const [progress, setProgress] = useState('')
  const [preview, setPreview] = useState<LessonPreview | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<{ lesson_id: string; sub_lessons_count: number } | null>(null)
  const pollRef = useRef<NodeJS.Timeout | null>(null)

  const handleSubmit = async () => {
    if (!pdfFile || imageFiles.length === 0 || !moduleId || !categoryName) {
      setError('Tous les champs sont requis')
      return
    }
    setError(null)
    const fd = new FormData()
    fd.append('module_id', moduleId)
    fd.append('category_name', categoryName)
    fd.append('pdf', pdfFile)
    imageFiles.forEach(f => fd.append('images', f))

    try {
      const { job_id } = await runPipeline(fd)
      setJobId(job_id)
      setStep('processing')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e))
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
      setError(e instanceof Error ? e.message : String(e))
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Pipeline IA — Ingestion de contenu</h1>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded">{error}</div>}

      {/* Étape 1 — Upload */}
      {step === 'upload' && (
        <Card>
          <CardHeader><CardTitle>Étape 1 — Upload des fichiers</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>ID du Module</Label>
              <Input value={moduleId} onChange={e => setModuleId(e.target.value)} placeholder="uuid du module cible" />
            </div>
            <div>
              <Label>Nom de la Catégorie</Label>
              <Input value={categoryName} onChange={e => setCategoryName(e.target.value)} placeholder="ex: Panneaux d'Obligation" />
            </div>
            <div>
              <Label>PDF de la leçon</Label>
              <Input type="file" accept=".pdf" onChange={e => setPdfFile(e.target.files?.[0] || null)} />
            </div>
            <div>
              <Label>Images des panneaux (sélectionner tous les fichiers du dossier)</Label>
              <Input type="file" accept="image/*" multiple onChange={e => setImageFiles(Array.from(e.target.files || []))} />
              {imageFiles.length > 0 && <p className="text-sm text-gray-500 mt-1">{imageFiles.length} image(s) sélectionnée(s)</p>}
            </div>
            <Button onClick={handleSubmit} disabled={!pdfFile || imageFiles.length === 0}>
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
              <p className="text-gray-600">{progress || 'Démarrage…'}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Étape 3 — Preview */}
      {step === 'preview' && preview && (
        <Card>
          <CardHeader>
            <CardTitle>Étape 3 — Validation du contenu</CardTitle>
            <p className="text-sm text-gray-500">{preview.sub_lessons.length} sous-leçons générées pour « {preview.title} »</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {preview.sub_lessons.map(sl => (
              <div key={sl.number} className="border rounded p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">#{sl.number}</Badge>
                  <span className="font-medium">{sl.title}</span>
                </div>
                {sl.image_url && (
                  <img src={sl.image_url} alt={sl.title} className="h-16 w-16 object-contain border rounded" />
                )}
                <p className="text-sm text-gray-700">{sl.content.description}</p>
                {sl.content.bullets.length > 0 && (
                  <ul className="text-sm text-gray-600 list-disc list-inside">
                    {sl.content.bullets.map((b, i) => <li key={i}>{b}</li>)}
                  </ul>
                )}
                {sl.content.did_you_know && (
                  <p className="text-sm italic text-indigo-600">💡 {sl.content.did_you_know}</p>
                )}
              </div>
            ))}
            <Button onClick={handleCommit} className="w-full">
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
            <p>{result.sub_lessons_count} sous-leçons créées.</p>
            <Button variant="outline" className="mt-4" onClick={() => { setStep('upload'); setPreview(null); setJobId(null) }}>
              Traiter un autre PDF
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
