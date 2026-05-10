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
  image_filename: string
  image_url: string | null
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

export async function getPreview(jobId: string): Promise<LessonPreview> {
  const res = await fetch(`${PIPELINE_URL}/pipeline/preview/${jobId}`)
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export async function commitPipeline(jobId: string): Promise<{ lesson_id: string; sub_lessons_count: number }> {
  const res = await fetch(`${PIPELINE_URL}/pipeline/commit/${jobId}`, { method: 'POST' })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}
