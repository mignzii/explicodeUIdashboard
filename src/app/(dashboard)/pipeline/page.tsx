'use client'

import { useState, useRef, useEffect } from 'react'
import {
  BookOpen,
} from 'lucide-react'
import {
  runPipeline, getJobStatus, getPreview, commitPipeline,
  getModules, getCategories,
  LessonPreview, JobStatus, Module, Category, SubLessonPreview,
  PipelinePreviewResponse,
} from '@/lib/pipelineApi'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'

type Step = 'upload' | 'processing' | 'preview' | 'done'

const MODULE_COLOR = '#6366f1'

export default function PipelinePage() {
  const [step, setStep] = useState<Step>('upload')

  // Upload
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [imageFiles, setImageFiles] = useState<File[]>([])

  // Pipeline state
  const [jobId, setJobId] = useState<string | null>(null)
  const [progress, setProgress] = useState('')
  const [previewData, setPreviewData] = useState<PipelinePreviewResponse | null>(null)
  const [draft, setDraft] = useState<LessonPreview | null>(null)
  const [filenameToUrl, setFilenameToUrl] = useState<Record<string, string>>({})
  const [selectedIdx, setSelectedIdx] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<{ lesson_id: string; sub_lessons_count: number } | null>(null)
  const pollRef = useRef<NodeJS.Timeout | null>(null)

  // Override UI
  const [modules, setModules] = useState<Module[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [overrideModuleId, setOverrideModuleId] = useState('')
  const [overrideCategoryName, setOverrideCategoryName] = useState('')
  const [showOverride, setShowOverride] = useState(false)

  useEffect(() => {
    getModules().then(d => setModules(Array.isArray(d) ? d : [])).catch(() => {})
  }, [])
  useEffect(() => {
    if (!overrideModuleId) return
    getCategories(overrideModuleId).then(d => setCategories(Array.isArray(d) ? d : [])).catch(() => {})
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
          setPreviewData(data)
          setDraft(data.lesson_draft)
          setFilenameToUrl(data.filename_to_url)
          setOverrideModuleId(data.lesson_draft.module_id)
          setOverrideCategoryName(data.lesson_draft.category_name)
          setSelectedIdx(0)
          setStep('preview')
        }
        if (status.status === 'error') {
          clearInterval(pollRef.current!)
          setError(status.progress)
          setStep('upload')
        }
      } catch { /* ignore */ }
    }, 2000)
    return () => clearInterval(pollRef.current!)
  }, [step, jobId])

  const reassignImage = (subIdx: number, newFilename: string) => {
    if (!draft) return
    const newSubs = draft.sub_lessons.map((sl, i) =>
      i === subIdx
        ? { ...sl, image_filename: newFilename || null, image_url: newFilename ? (filenameToUrl[newFilename] ?? null) : null }
        : sl
    )
    setDraft({ ...draft, sub_lessons: newSubs })
  }

  const handleCommit = async () => {
    if (!jobId || !draft) return
    const finalDraft = {
      ...draft,
      module_id: overrideModuleId || draft.module_id,
      category_name: overrideCategoryName || draft.category_name,
    }
    try {
      const r = await commitPipeline(jobId, finalDraft)
      setResult(r)
      setStep('done')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erreur inconnue')
    }
  }

  const reset = () => {
    setStep('upload'); setDraft(null); setJobId(null)
    setResult(null); setError(null); setPdfFile(null)
    setImageFiles([]); setShowOverride(false); setPreviewData(null)
  }

  const selectedSub = draft?.sub_lessons[selectedIdx] ?? null
  const allFilenames = Object.keys(filenameToUrl).sort()

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Pipeline IA — Ingestion de contenu</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded text-sm">{error}</div>
      )}

      {/* ── Étape 1 — Upload ── */}
      {step === 'upload' && (
        <Card>
          <CardHeader>
            <CardTitle>Upload du contenu</CardTitle>
            <p className="text-sm text-gray-500 mt-1">
              Le module et la catégorie sont détectés automatiquement depuis la page de couverture du PDF.
            </p>
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
                <span className="text-gray-400 font-normal text-xs">
                  (numérotées 01_B3.png ou simplement B3.png — le matching est automatique)
                </span>
              </Label>
              <Input
                type="file" accept="image/*" multiple
                onChange={e => setImageFiles(Array.from(e.target.files || []))}
              />
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

      {/* ── Étape 2 — Processing ── */}
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

      {/* ── Étape 3 — Preview ── */}
      {step === 'preview' && draft && (
        <div className="space-y-4">

          {/* Context card */}
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="space-y-0.5">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Module détecté</p>
                  <p className="font-medium">{draft.module_title || draft.module_id}</p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Catégorie</p>
                  <p className="font-medium">{overrideCategoryName || draft.category_name}</p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Leçon</p>
                  <p className="font-medium">{draft.title}</p>
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

          {/* Preview panel — sidebar + phone */}
          <div className="border rounded-xl overflow-hidden bg-[#0d1424]" style={{ height: '72vh' }}>
            <div className="grid h-full" style={{ gridTemplateColumns: '260px 1fr' }}>

              {/* Sidebar */}
              <div className="border-r border-white/10 bg-[#0a0f1a] flex flex-col overflow-hidden">
                <div className="px-3 py-2.5 border-b border-white/10">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    {draft.sub_lessons.length} sous-leçon{draft.sub_lessons.length > 1 ? 's' : ''}
                  </p>
                </div>
                <ScrollArea className="flex-1">
                  <div className="p-2 space-y-1">
                    {draft.sub_lessons.map((sl, idx) => (
                      <div key={sl.number}>
                        <button
                          onClick={() => setSelectedIdx(idx)}
                          className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left transition-all ${
                            selectedIdx === idx
                              ? 'bg-indigo-600/20 border border-indigo-500/30'
                              : 'hover:bg-white/5'
                          }`}
                        >
                          <span className={`text-[10px] font-bold w-5 text-center flex-shrink-0 ${
                            selectedIdx === idx ? 'text-indigo-400' : 'text-slate-600'
                          }`}>
                            {String(sl.number).padStart(2, '0')}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className={`text-xs truncate ${
                              selectedIdx === idx ? 'text-slate-200 font-medium' : 'text-slate-400'
                            }`}>
                              {sl.title}
                            </p>
                            <p className="text-[10px] text-slate-600 truncate flex items-center gap-1 mt-0.5">
                              {sl.image_filename ? (
                                <>
                                  <span className={sl.match_method === 'code' ? 'text-emerald-600' : 'text-slate-600'}>
                                    {sl.match_method === 'code' ? '⚡' : '↕'}
                                  </span>
                                  {sl.image_filename}
                                </>
                              ) : (
                                <span className="text-amber-700">⚠ pas d&apos;image</span>
                              )}
                            </p>
                          </div>
                        </button>

                        {/* Image reassignment dropdown — shown for selected */}
                        {selectedIdx === idx && allFilenames.length > 0 && (
                          <div className="mx-2 mb-1 mt-0.5">
                            <select
                              className="w-full text-[10px] bg-[#0f172a] border border-white/10 text-slate-400 rounded px-2 py-1"
                              value={sl.image_filename ?? ''}
                              onChange={e => reassignImage(idx, e.target.value)}
                            >
                              <option value="">— Pas d&apos;image —</option>
                              {allFilenames.map(f => (
                                <option key={f} value={f}>{f}</option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>

              {/* Phone frame zone */}
              <div className="flex flex-col overflow-hidden">
                <div className="flex-1 overflow-y-auto flex items-start justify-center py-8 px-6"
                  style={{ background: 'radial-gradient(ellipse at 50% 20%, rgba(27,79,216,0.06) 0%, transparent 65%)' }}>
                  {selectedSub ? (
                    <PipelinePhoneFrame sub={selectedSub} moduleColor={MODULE_COLOR} />
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-3 text-slate-600 py-20">
                      <BookOpen className="w-8 h-8" />
                      <p className="text-sm text-slate-500">Sélectionne une sous-leçon</p>
                    </div>
                  )}
                </div>

                {/* Legend */}
                <div className="flex items-center gap-4 px-5 py-2 border-t border-white/5 bg-[#0a0f1a] flex-shrink-0">
                  <div className="flex items-center gap-1.5 text-xs text-slate-600">
                    <span className="text-emerald-600">⚡</span> Matched par code
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-600">
                    <span>↕</span> Séquentiel
                  </div>
                  <span className="ml-auto text-xs text-slate-700">
                    Clique sur une sous-leçon pour prévisualiser · le dropdown change l&apos;image associée
                  </span>
                </div>
              </div>
            </div>
          </div>

          <Button onClick={handleCommit} className="w-full">
            ✅ Valider et insérer en base de données
          </Button>
        </div>
      )}

      {/* ── Étape 4 — Done ── */}
      {step === 'done' && result && (
        <Card>
          <CardHeader><CardTitle>✅ Contenu inséré avec succès</CardTitle></CardHeader>
          <CardContent>
            <p className="text-gray-700">{result.sub_lessons_count} sous-leçons créées.</p>
            <Button variant="outline" className="mt-4" onClick={reset}>Traiter un autre PDF</Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// ── Pipeline Phone Frame ───────────────────────────────────────────────────────

function PipelinePhoneFrame({ sub, moduleColor }: { sub: SubLessonPreview; moduleColor: string }) {
  return (
    <div className="w-[300px] flex-shrink-0">
      <div
        className="bg-[#1c2333] rounded-[36px] p-3 border-2 border-slate-700 shadow-2xl shadow-black/60"
        style={{ boxShadow: '0 30px 80px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.04)' }}
      >
        <div className="w-16 h-[5px] bg-[#0f172a] rounded-full mx-auto mb-3" />
        <div className="bg-[#0f172a] rounded-[24px] overflow-hidden">
          <div className="flex justify-between items-center px-4 pt-3 pb-1">
            <span className="text-[10px] text-slate-500 font-medium">9:41</span>
            <span className="text-[10px] text-slate-500">●●●● WiFi 🔋</span>
          </div>
          <div className="flex items-center justify-between px-4 pb-3 border-b border-white/5">
            <span className="text-[10px] text-blue-500">← Retour</span>
            <span className="text-xs font-bold text-white truncate max-w-[160px]">{sub.title}</span>
            <span className="text-slate-600 text-base">···</span>
          </div>

          <div className="px-4 py-4 space-y-4">
            {/* Image */}
            {sub.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={sub.image_url} alt={sub.title} className="w-full h-[130px] object-contain rounded-xl bg-slate-800/40" />
            ) : (
              <div
                className="w-full h-[130px] rounded-xl flex items-center justify-center"
                style={{ background: `linear-gradient(135deg, ${moduleColor}22, ${moduleColor}08)` }}
              >
                <span className="text-4xl opacity-40">🚦</span>
              </div>
            )}

            {/* Number + title */}
            <div>
              <p className="text-[9px] font-bold uppercase tracking-widest mb-1" style={{ color: moduleColor }}>
                Sous-leçon {String(sub.number).padStart(2, '0')}
              </p>
              <h3 className="text-[15px] font-bold text-white leading-snug">{sub.title}</h3>
            </div>

            {/* Description */}
            {sub.content.description ? (
              <div>
                <p className="text-[9px] text-slate-500 uppercase tracking-wider font-semibold mb-1.5">Description</p>
                <p className="text-[11px] text-slate-400 leading-relaxed">{sub.content.description}</p>
              </div>
            ) : (
              <div className="bg-slate-800/60 rounded-lg px-3 py-2.5 border border-slate-700/50">
                <p className="text-[10px] text-slate-600 italic text-center">Aucune description générée</p>
              </div>
            )}

            {/* Bullets */}
            {sub.content.bullets.length > 0 && (
              <div>
                <p className="text-[9px] text-slate-500 uppercase tracking-wider font-semibold mb-2">Points clés</p>
                <ul className="space-y-1.5">
                  {sub.content.bullets.map((b, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="w-[5px] h-[5px] rounded-full flex-shrink-0 mt-[5px]" style={{ backgroundColor: moduleColor }} />
                      <span className="text-[11px] text-slate-300 leading-relaxed">{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Did you know */}
            {sub.content.did_you_know && (
              <div
                className="rounded-lg px-3 py-3 border-l-[3px] border-amber-400"
                style={{ background: 'linear-gradient(135deg, rgba(30,41,59,0.8), rgba(22,32,50,0.8))' }}
              >
                <p className="text-[10px] font-bold text-amber-400 mb-1">💡 Le saviez-vous ?</p>
                <p className="text-[10px] text-slate-400 leading-relaxed">{sub.content.did_you_know}</p>
              </div>
            )}
          </div>

          <div className="w-16 h-1 bg-slate-700 rounded-full mx-auto my-3" />
        </div>
      </div>
    </div>
  )
}
