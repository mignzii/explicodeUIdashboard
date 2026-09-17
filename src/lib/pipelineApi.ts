const PIPELINE_URL = process.env.NEXT_PUBLIC_PIPELINE_URL || 'http://localhost:8000'

export interface Module {
  id: string
  title: string
  icon?: string
}

export interface Category {
  id: string
  title: string
}

export async function getModules(): Promise<Module[]> {
  const res = await fetch(`${PIPELINE_URL}/modules`)
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export async function getCategories(moduleId: string): Promise<Category[]> {
  const res = await fetch(`${PIPELINE_URL}/modules/${moduleId}/categories`)
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export interface SubLessonPreview {
  number: number
  title: string
  image_filename: string | null
  image_url: string | null
  match_method: string
  content: {
    description: string
    bullets: string[]
    did_you_know: string | null
  }
}

export interface LessonPreview {
  title: string
  module_id: string
  module_title: string
  category_name: string
  sub_lessons: SubLessonPreview[]
}

export interface PipelinePreviewResponse {
  lesson_draft: LessonPreview
  filename_to_url: Record<string, string>
}

export interface JobStatus {
  job_id: string
  status: 'pending' | 'processing' | 'preview_ready' | 'committed' | 'error'
  progress: string
}

export async function runPipeline(formData: FormData): Promise<{ job_id: string }> {
  const res = await fetch(`${PIPELINE_URL}/pipeline/run`, {
    method: 'POST',
    body: formData,
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export async function getJobStatus(jobId: string): Promise<JobStatus> {
  const res = await fetch(`${PIPELINE_URL}/pipeline/status/${jobId}`)
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export async function getPreview(jobId: string): Promise<PipelinePreviewResponse> {
  const res = await fetch(`${PIPELINE_URL}/pipeline/preview/${jobId}`)
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export async function commitPipeline(
  jobId: string,
  updatedDraft?: LessonPreview
): Promise<{ lesson_id: string; sub_lessons_count: number }> {
  const res = await fetch(`${PIPELINE_URL}/pipeline/commit/${jobId}`, {
    method: 'POST',
    headers: updatedDraft ? { 'Content-Type': 'application/json' } : {},
    body: updatedDraft ? JSON.stringify(updatedDraft) : undefined,
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

// ─── Narration audio (TTS ElevenLabs) ────────────────────────────────────────

export interface AudioSectionResult {
  content_id: string
  title?: string
  audio_url: string | null
  duration_seconds: number | null
  error: string | null
}

export interface AudioJobStatus {
  job_id: string
  lesson_id: string
  status: 'pending' | 'processing' | 'done' | 'error'
  progress: string
  total_sections: number
  completed_sections: number
  estimated_characters: number
  results: AudioSectionResult[]
  error: string | null
}

/** Extrait un message lisible d'une réponse d'erreur FastAPI ({detail}) ou texte brut. */
async function pipelineError(res: Response): Promise<string> {
  const text = await res.text()
  try {
    const j = JSON.parse(text)
    return j.detail ?? text
  } catch {
    return text
  }
}

/** Lance la génération audio pour toute une leçon (1 MP3 par section). */
export async function generateAudio(lessonId: string): Promise<{ job_id: string }> {
  const res = await fetch(`${PIPELINE_URL}/audio/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ lesson_id: lessonId }),
  })
  if (!res.ok) throw new Error(await pipelineError(res))
  return res.json()
}

/** Statut + progression d'un job audio. */
export async function getAudioStatus(jobId: string): Promise<AudioJobStatus> {
  const res = await fetch(`${PIPELINE_URL}/audio/status/${jobId}`)
  if (!res.ok) throw new Error(await pipelineError(res))
  return res.json()
}

/** Régénère l'audio d'une seule section. */
export async function regenerateAudio(
  lessonId: string,
  contentId: string
): Promise<{ job_id: string }> {
  const res = await fetch(`${PIPELINE_URL}/audio/regenerate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ lesson_id: lessonId, content_id: contentId }),
  })
  if (!res.ok) throw new Error(await pipelineError(res))
  return res.json()
}
