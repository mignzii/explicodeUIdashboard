'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft, Plus, Pencil, Trash2, Lock, Unlock, ChevronRight,
  ChevronDown, Loader2, FolderOpen, BookOpen, List, FileText, X, Video, Headphones
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from '@/components/ui/alert-dialog'
import { LearningModule, Category, Lesson, SubLesson, LessonContent } from '@/types'
import { modulesApi, categoriesApi, lessonsApi, subLessonsApi, contentApi } from '@/lib/learningApi'
import toast from 'react-hot-toast'

// ─────────────────────────────────────────────────────────────────────────────
// Constantes
// ─────────────────────────────────────────────────────────────────────────────

const EMOJI_ICONS = [
  '📖', '🚦', '⚠️', '🛑', '🚧', '🔄', '🏁', '🛤️', '🌧️', '☀️',
  '🦌', '🚶', '🚲', '🏍️', '🚗', '🚌', '🚛', '⚖️', '🛡️', '🔧',
  '🎯', '💡', '📋', '🔍', '🏆', '✅', '❌', '➡️', '⬅️', '🔀',
]

const LANG_OPTIONS = ['FR', 'WO', 'PU', 'SE', 'JO'] as const
type Lang = typeof LANG_OPTIONS[number]

const STATUS_OPTIONS = [
  { value: 'locked', label: 'Verrouillé' },
  { value: 'in_progress', label: 'En cours' },
  { value: 'completed', label: 'Terminé' },
] as const

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

export default function ModuleDetailPage() {
  const params = useParams()
  const router = useRouter()
  const moduleId = params.id as string

  const [module, setModule] = useState<LearningModule | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedCat, setExpandedCat] = useState<string | null>(null)
  const [lessonsMap, setLessonsMap] = useState<Record<string, Lesson[]>>({})
  const [expandedLesson, setExpandedLesson] = useState<string | null>(null)
  const [subLessonsMap, setSubLessonsMap] = useState<Record<string, SubLesson[]>>({})
  const [saving, setSaving] = useState(false)

  // ── États modaux ──────────────────────────────────────────────────────────

  const [catModal, setCatModal] = useState(false)
  const [editingCat, setEditingCat] = useState<Category | null>(null)
  const [catForm, setCatForm] = useState({ title: '', order: 1 })

  const [lessonModal, setLessonModal] = useState(false)
  const [lessonCategoryId, setLessonCategoryId] = useState('')
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null)
  const [lessonForm, setLessonForm] = useState({
    title: '', order: 1, isLocked: false,
    icon: '📖', iconColor: '#1B4FD8', iconBg: '#EEF2FF',
  })

  const [subModal, setSubModal] = useState(false)
  const [subLessonParentId, setSubLessonParentId] = useState('')
  const [editingSub, setEditingSub] = useState<SubLesson | null>(null)
  const [subForm, setSubForm] = useState({
    title: '', number: 1, order: 1,
    status: 'locked' as 'locked' | 'in_progress' | 'completed',
    imageUrl: '',
  })

  const [contentModal, setContentModal] = useState(false)
  const [contentSubLesson, setContentSubLesson] = useState<SubLesson | null>(null)
  const [contentLang, setContentLang] = useState<Lang>('FR')
  const [existingContentId, setExistingContentId] = useState<string | null>(null)
  const [loadingContent, setLoadingContent] = useState(false)
  const [contentForm, setContentForm] = useState({
    description: '',
    bullets: [] as string[],
    newBullet: '',
    didYouKnow: '',
    hasVideo: false,
    videoUrl: '',
    audioUrl: '',
    readMinutes: 3,
  })

  // ── Chargement ────────────────────────────────────────────────────────────

  useEffect(() => { loadModule() }, [moduleId])

  async function loadModule() {
    try {
      setLoading(true)
      const [mod, cats] = await Promise.all([
        modulesApi.get(moduleId) as Promise<LearningModule>,
        categoriesApi.list(moduleId) as Promise<Category[]>,
      ])
      setModule(mod)
      setCategories(cats)
    } catch {
      toast.error('Impossible de charger le module')
    } finally { setLoading(false) }
  }

  async function loadLessons(categoryId: string) {
    if (lessonsMap[categoryId]) return
    try {
      const data = await lessonsApi.list(categoryId) as Lesson[]
      setLessonsMap(prev => ({ ...prev, [categoryId]: data }))
    } catch { toast.error('Impossible de charger les leçons') }
  }

  async function loadSubLessons(lessonId: string) {
    if (subLessonsMap[lessonId]) return
    try {
      const data = await subLessonsApi.list(lessonId) as SubLesson[]
      setSubLessonsMap(prev => ({ ...prev, [lessonId]: data }))
    } catch { toast.error('Impossible de charger les sous-leçons') }
  }

  function toggleCategory(catId: string) {
    if (expandedCat === catId) setExpandedCat(null)
    else { setExpandedCat(catId); loadLessons(catId) }
  }

  function toggleLesson(lessonId: string) {
    if (expandedLesson === lessonId) setExpandedLesson(null)
    else { setExpandedLesson(lessonId); loadSubLessons(lessonId) }
  }

  // ── CRUD Catégories ───────────────────────────────────────────────────────

  const openCreateCat = () => { setEditingCat(null); setCatForm({ title: '', order: categories.length + 1 }); setCatModal(true) }
  const openEditCat = (cat: Category) => { setEditingCat(cat); setCatForm({ title: cat.title, order: cat.order }); setCatModal(true) }

  const saveCat = async () => {
    if (!catForm.title.trim()) { toast.error('Titre requis'); return }
    setSaving(true)
    try {
      if (editingCat) {
        const updated = await categoriesApi.update(editingCat.id, catForm) as Category
        setCategories(prev => prev.map(c => c.id === editingCat.id ? updated : c))
        toast.success('Catégorie mise à jour')
      } else {
        const created = await categoriesApi.create({ ...catForm, moduleId }) as Category
        setCategories(prev => [...prev, created])
        toast.success('Catégorie créée')
      }
      setCatModal(false)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erreur')
    } finally { setSaving(false) }
  }

  const deleteCat = async (id: string) => {
    try {
      await categoriesApi.delete(id)
      setCategories(prev => prev.filter(c => c.id !== id))
      const m = { ...lessonsMap }; delete m[id]; setLessonsMap(m)
      toast.success('Catégorie supprimée')
    } catch { toast.error('Erreur lors de la suppression') }
  }

  // ── CRUD Leçons ───────────────────────────────────────────────────────────

  const openCreateLesson = (categoryId: string) => {
    setLessonCategoryId(categoryId); setEditingLesson(null)
    const n = (lessonsMap[categoryId] ?? []).length
    setLessonForm({ title: '', order: n + 1, isLocked: false, icon: '📖', iconColor: '#1B4FD8', iconBg: '#EEF2FF' })
    setLessonModal(true)
  }

  const openEditLesson = (lesson: Lesson) => {
    setLessonCategoryId(lesson.categoryId); setEditingLesson(lesson)
    setLessonForm({
      title: lesson.title, order: lesson.order, isLocked: lesson.isLocked,
      icon: lesson.icon ?? '📖', iconColor: lesson.iconColor ?? '#1B4FD8', iconBg: lesson.iconBg ?? '#EEF2FF',
    })
    setLessonModal(true)
  }

  const saveLesson = async () => {
    if (!lessonForm.title.trim()) { toast.error('Titre requis'); return }
    setSaving(true)
    try {
      const { title, order, isLocked, icon, iconColor, iconBg } = lessonForm
      if (editingLesson) {
        const updated = await lessonsApi.update(editingLesson.id, { title, order, isLocked, icon, iconColor, iconBg }) as Lesson
        setLessonsMap(prev => ({ ...prev, [lessonCategoryId]: (prev[lessonCategoryId] ?? []).map(l => l.id === editingLesson.id ? updated : l) }))
        toast.success('Leçon mise à jour')
      } else {
        const created = await lessonsApi.create({ categoryId: lessonCategoryId, title, order, isLocked, icon, iconColor, iconBg }) as Lesson
        setLessonsMap(prev => ({ ...prev, [lessonCategoryId]: [...(prev[lessonCategoryId] ?? []), created] }))
        toast.success('Leçon créée')
      }
      setLessonModal(false)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erreur')
    } finally { setSaving(false) }
  }

  const deleteLesson = async (lesson: Lesson) => {
    try {
      await lessonsApi.delete(lesson.id)
      setLessonsMap(prev => ({ ...prev, [lesson.categoryId]: (prev[lesson.categoryId] ?? []).filter(l => l.id !== lesson.id) }))
      toast.success('Leçon supprimée')
    } catch { toast.error('Erreur lors de la suppression') }
  }

  // ── CRUD Sous-leçons ──────────────────────────────────────────────────────

  const openCreateSub = (lessonId: string) => {
    setSubLessonParentId(lessonId); setEditingSub(null)
    const n = (subLessonsMap[lessonId] ?? []).length
    setSubForm({ title: '', number: n + 1, order: n + 1, status: 'locked', imageUrl: '' })
    setSubModal(true)
  }

  const openEditSub = (sub: SubLesson) => {
    setSubLessonParentId(sub.lessonId); setEditingSub(sub)
    setSubForm({ title: sub.title, number: sub.number, order: sub.order, status: sub.status, imageUrl: sub.imageUrl ?? '' })
    setSubModal(true)
  }

  const saveSub = async () => {
    if (!subForm.title.trim()) { toast.error('Titre requis'); return }
    setSaving(true)
    try {
      const { title, number, order, status, imageUrl } = subForm
      const payload = { title, number, order, status, ...(imageUrl.trim() ? { imageUrl: imageUrl.trim() } : {}) }
      if (editingSub) {
        const updated = await subLessonsApi.update(editingSub.id, payload) as SubLesson
        setSubLessonsMap(prev => ({ ...prev, [subLessonParentId]: (prev[subLessonParentId] ?? []).map(s => s.id === editingSub.id ? updated : s) }))
        toast.success('Sous-leçon mise à jour')
      } else {
        const created = await subLessonsApi.create({ lessonId: subLessonParentId, ...payload }) as SubLesson
        setSubLessonsMap(prev => ({ ...prev, [subLessonParentId]: [...(prev[subLessonParentId] ?? []), created] }))
        toast.success('Sous-leçon créée')
      }
      setSubModal(false)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erreur')
    } finally { setSaving(false) }
  }

  const deleteSub = async (sub: SubLesson) => {
    try {
      await subLessonsApi.delete(sub.id)
      setSubLessonsMap(prev => ({ ...prev, [sub.lessonId]: (prev[sub.lessonId] ?? []).filter(s => s.id !== sub.id) }))
      toast.success('Sous-leçon supprimée')
    } catch { toast.error('Erreur lors de la suppression') }
  }

  // ── Contenu ───────────────────────────────────────────────────────────────

  const fetchContent = async (subId: string, lang: Lang) => {
    setLoadingContent(true)
    setExistingContentId(null)
    setContentForm({ description: '', bullets: [], newBullet: '', didYouKnow: '', hasVideo: false, videoUrl: '', audioUrl: '', readMinutes: 3 })
    try {
      const contents = await contentApi.list(subId, lang) as LessonContent[]
      if (contents.length > 0) {
        const c = contents[0]
        setExistingContentId(c.id)
        setContentForm({ description: c.description ?? '', bullets: c.bullets ?? [], newBullet: '', didYouKnow: c.didYouKnow ?? '', hasVideo: c.hasVideo, videoUrl: c.videoUrl ?? '', audioUrl: c.audioUrl ?? '', readMinutes: c.readMinutes })
      }
    } catch { toast.error('Impossible de charger le contenu') }
    finally { setLoadingContent(false) }
  }

  const openContentModal = (sub: SubLesson) => {
    setContentSubLesson(sub)
    setContentLang('FR')
    setContentModal(true)
    fetchContent(sub.id, 'FR')
  }

  const changeContentLang = (lang: Lang) => {
    if (!contentSubLesson) return
    setContentLang(lang)
    fetchContent(contentSubLesson.id, lang)
  }

  const addBullet = () => {
    if (!contentForm.newBullet.trim()) return
    setContentForm(f => ({ ...f, bullets: [...f.bullets, f.newBullet.trim()], newBullet: '' }))
  }

  const removeBullet = (i: number) => setContentForm(f => ({ ...f, bullets: f.bullets.filter((_, idx) => idx !== i) }))

  const saveContent = async () => {
    if (!contentSubLesson) return
    setSaving(true)
    try {
      const payload = {
        subLessonId: contentSubLesson.id,
        lang: contentLang,
        description: contentForm.description || undefined,
        bullets: contentForm.bullets.length > 0 ? contentForm.bullets : undefined,
        didYouKnow: contentForm.didYouKnow || undefined,
        hasVideo: contentForm.hasVideo,
        videoUrl: contentForm.videoUrl || undefined,
        audioUrl: contentForm.audioUrl || undefined,
        readMinutes: contentForm.readMinutes,
      }
      if (existingContentId) {
        await contentApi.update(existingContentId, payload)
        toast.success(`Contenu ${contentLang} mis à jour`)
      } else {
        const created = await contentApi.create(payload) as LessonContent
        setExistingContentId(created.id)
        toast.success(`Contenu ${contentLang} créé`)
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erreur')
    } finally { setSaving(false) }
  }

  // ── Rendu ─────────────────────────────────────────────────────────────────

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
    </div>
  )

  if (!module) return null

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => router.back()} className="gap-2 text-gray-600">
        <ArrowLeft className="w-4 h-4" /> Retour aux modules
      </Button>

      {/* Module Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-4xl" style={{ backgroundColor: module.color + '20' }}>
              {module.icon}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold text-gray-900">{module.title}</h2>
                <Badge variant={module.isLocked ? 'warning' : 'success'}>
                  {module.isLocked
                    ? <><Lock className="w-3 h-3 mr-1" />Verrouillé</>
                    : <><Unlock className="w-3 h-3 mr-1" />Déverrouillé</>
                  }
                </Badge>
              </div>
              <div className="flex gap-4 mt-2 text-sm text-gray-500">
                <span>{categories.length} catégorie{categories.length !== 1 ? 's' : ''}</span>
                <span>Ordre #{module.order}</span>
                <span className="flex items-center gap-1">
                  <span className="inline-block w-3 h-3 rounded-full border" style={{ backgroundColor: module.color }} />
                  {module.color}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Arbre : Catégories → Leçons → Sous-leçons */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FolderOpen className="w-5 h-5" /> Catégories
          </CardTitle>
          <Button onClick={openCreateCat} size="sm" className="gap-2">
            <Plus className="w-4 h-4" /> Ajouter
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {categories.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <p className="text-sm">Aucune catégorie — créez la première</p>
            </div>
          ) : (
            <div className="divide-y">
              {[...categories].sort((a, b) => a.order - b.order).map(cat => (
                <div key={cat.id}>
                  {/* Ligne catégorie */}
                  <div className="flex items-center px-4 py-3 hover:bg-gray-50">
                    <button onClick={() => toggleCategory(cat.id)} className="flex items-center gap-3 flex-1 text-left">
                      {expandedCat === cat.id ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                      <FolderOpen className="w-4 h-4 text-blue-500" />
                      <span className="font-medium text-sm">{cat.title}</span>
                      <span className="text-xs text-gray-400 ml-1">({lessonsMap[cat.id]?.length ?? '?'} leçon{lessonsMap[cat.id]?.length !== 1 ? 's' : ''})</span>
                    </button>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon-sm" onClick={() => openEditCat(cat)}><Pencil className="w-3.5 h-3.5" /></Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon-sm" className="text-red-400 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Supprimer la catégorie</AlertDialogTitle>
                            <AlertDialogDescription>Supprimer &quot;{cat.title}&quot; supprimera également toutes ses leçons.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Annuler</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteCat(cat.id)} className="bg-red-600 hover:bg-red-700">Supprimer</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>

                  {/* Leçons */}
                  {expandedCat === cat.id && (
                    <div className="bg-gray-50 border-t">
                      <div className="flex items-center justify-between px-8 py-2 border-b">
                        <span className="text-xs font-medium text-gray-500 flex items-center gap-1">
                          <BookOpen className="w-3.5 h-3.5" /> Leçons
                        </span>
                        <Button variant="ghost" size="sm" onClick={() => openCreateLesson(cat.id)} className="text-xs gap-1 h-7">
                          <Plus className="w-3 h-3" /> Ajouter
                        </Button>
                      </div>
                      {!lessonsMap[cat.id] ? (
                        <div className="px-8 py-4 flex items-center gap-2 text-gray-400 text-sm"><Loader2 className="w-4 h-4 animate-spin" /> Chargement...</div>
                      ) : lessonsMap[cat.id].length === 0 ? (
                        <div className="px-8 py-4 text-sm text-gray-400">Aucune leçon</div>
                      ) : (
                        <div className="divide-y divide-gray-100">
                          {[...lessonsMap[cat.id]].sort((a, b) => a.order - b.order).map(lesson => (
                            <div key={lesson.id}>
                              <div className="flex items-center px-8 py-2.5 hover:bg-white">
                                <button onClick={() => toggleLesson(lesson.id)} className="flex items-center gap-3 flex-1 text-left">
                                  {expandedLesson === lesson.id ? <ChevronDown className="w-3.5 h-3.5 text-gray-400" /> : <ChevronRight className="w-3.5 h-3.5 text-gray-400" />}
                                  <span
                                    className="w-7 h-7 rounded-lg flex items-center justify-center text-base flex-shrink-0"
                                    style={{ backgroundColor: lesson.iconBg ?? '#F1F5F9' }}
                                  >
                                    {lesson.icon ?? '📖'}
                                  </span>
                                  <span className="text-sm">{lesson.title}</span>
                                  {lesson.isLocked && <Lock className="w-3 h-3 text-amber-400" />}
                                  <span className="text-xs text-gray-400 ml-1">({subLessonsMap[lesson.id]?.length ?? '?'} sous-leçon{subLessonsMap[lesson.id]?.length !== 1 ? 's' : ''})</span>
                                </button>
                                <div className="flex items-center gap-1">
                                  <Button variant="ghost" size="icon-sm" onClick={() => openEditLesson(lesson)}><Pencil className="w-3 h-3" /></Button>
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button variant="ghost" size="icon-sm" className="text-red-400 hover:text-red-600"><Trash2 className="w-3 h-3" /></Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Supprimer la leçon</AlertDialogTitle>
                                        <AlertDialogDescription>Supprimer &quot;{lesson.title}&quot; et toutes ses sous-leçons ?</AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => deleteLesson(lesson)} className="bg-red-600 hover:bg-red-700">Supprimer</AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </div>
                              </div>

                              {/* Sous-leçons */}
                              {expandedLesson === lesson.id && (
                                <div className="bg-white border-t border-gray-100">
                                  <div className="flex items-center justify-between px-14 py-2 border-b border-gray-100">
                                    <span className="text-xs font-medium text-gray-500 flex items-center gap-1">
                                      <List className="w-3.5 h-3.5" /> Sous-leçons
                                    </span>
                                    <Button variant="ghost" size="sm" onClick={() => openCreateSub(lesson.id)} className="text-xs gap-1 h-7">
                                      <Plus className="w-3 h-3" /> Ajouter
                                    </Button>
                                  </div>
                                  {!subLessonsMap[lesson.id] ? (
                                    <div className="px-14 py-3 flex items-center gap-2 text-gray-400 text-sm"><Loader2 className="w-4 h-4 animate-spin" /> Chargement...</div>
                                  ) : subLessonsMap[lesson.id].length === 0 ? (
                                    <div className="px-14 py-3 text-sm text-gray-400">Aucune sous-leçon</div>
                                  ) : (
                                    <div className="divide-y divide-gray-50">
                                      {[...subLessonsMap[lesson.id]].sort((a, b) => a.order - b.order).map(sub => (
                                        <div key={sub.id} className="flex items-center px-14 py-2 hover:bg-gray-50 gap-2">
                                          <span className="w-6 text-xs font-bold text-gray-400 flex-shrink-0">{String(sub.number).padStart(2, '0')}</span>
                                          <span className="flex-1 text-sm min-w-0 truncate">{sub.title}</span>
                                          <Badge
                                            variant={sub.status === 'completed' ? 'success' : sub.status === 'in_progress' ? 'info' : 'gray'}
                                            className="text-xs flex-shrink-0"
                                          >
                                            {sub.status === 'completed' ? 'Terminé' : sub.status === 'in_progress' ? 'En cours' : 'Verrouillé'}
                                          </Badge>
                                          <Button
                                            variant="outline" size="sm"
                                            onClick={() => openContentModal(sub)}
                                            className="text-xs gap-1 h-7 flex-shrink-0"
                                          >
                                            <FileText className="w-3 h-3" /> Contenu
                                          </Button>
                                          <div className="flex items-center gap-1 flex-shrink-0">
                                            <Button variant="ghost" size="icon-sm" onClick={() => openEditSub(sub)}><Pencil className="w-3 h-3" /></Button>
                                            <AlertDialog>
                                              <AlertDialogTrigger asChild>
                                                <Button variant="ghost" size="icon-sm" className="text-red-400 hover:text-red-600"><Trash2 className="w-3 h-3" /></Button>
                                              </AlertDialogTrigger>
                                              <AlertDialogContent>
                                                <AlertDialogHeader>
                                                  <AlertDialogTitle>Supprimer la sous-leçon</AlertDialogTitle>
                                                  <AlertDialogDescription>Supprimer &quot;{sub.title}&quot; ?</AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                                                  <AlertDialogAction onClick={() => deleteSub(sub)} className="bg-red-600 hover:bg-red-700">Supprimer</AlertDialogAction>
                                                </AlertDialogFooter>
                                              </AlertDialogContent>
                                            </AlertDialog>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ═══════════════════════════════ MODAUX ═══════════════════════════════ */}

      {/* Modal Catégorie */}
      <Dialog open={catModal} onOpenChange={setCatModal}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{editingCat ? 'Modifier la catégorie' : 'Nouvelle catégorie'}</DialogTitle>
            <DialogDescription>Une catégorie représente un onglet dans le module</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Titre</Label>
              <Input value={catForm.title} onChange={e => setCatForm(f => ({ ...f, title: e.target.value }))} placeholder="Ex: Panneaux" className="mt-1" />
            </div>
            <div>
              <Label>Ordre</Label>
              <Input type="number" min={1} value={catForm.order} onChange={e => setCatForm(f => ({ ...f, order: parseInt(e.target.value) || 1 }))} className="mt-1" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCatModal(false)} disabled={saving}>Annuler</Button>
            <Button onClick={saveCat} disabled={saving}>{saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}{editingCat ? 'Sauvegarder' : 'Créer'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Leçon — avec icône + couleurs */}
      <Dialog open={lessonModal} onOpenChange={setLessonModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingLesson ? 'Modifier la leçon' : 'Nouvelle leçon'}</DialogTitle>
            <DialogDescription>Leçon thématique avec icône et couleurs</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Titre</Label>
              <Input value={lessonForm.title} onChange={e => setLessonForm(f => ({ ...f, title: e.target.value }))} placeholder="Ex: Panneaux de Danger" className="mt-1" />
            </div>

            {/* Sélecteur icône */}
            <div>
              <Label>Icône</Label>
              <div className="mt-1 grid grid-cols-10 gap-1 p-2 border rounded-lg bg-gray-50 max-h-24 overflow-y-auto">
                {EMOJI_ICONS.map(emoji => (
                  <button
                    key={emoji} type="button"
                    onClick={() => setLessonForm(f => ({ ...f, icon: emoji }))}
                    className={`text-lg p-1 rounded transition-colors hover:bg-white ${lessonForm.icon === emoji ? 'bg-white ring-2 ring-blue-400 shadow-sm' : ''}`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* Couleurs */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Couleur de l&apos;icône</Label>
                <div className="mt-1 flex items-center gap-2">
                  <input type="color" value={lessonForm.iconColor} onChange={e => setLessonForm(f => ({ ...f, iconColor: e.target.value }))} className="w-10 h-9 rounded cursor-pointer border flex-shrink-0" />
                  <Input value={lessonForm.iconColor} onChange={e => setLessonForm(f => ({ ...f, iconColor: e.target.value }))} placeholder="#1B4FD8" className="text-xs" />
                </div>
              </div>
              <div>
                <Label>Fond de l&apos;icône</Label>
                <div className="mt-1 flex items-center gap-2">
                  <input type="color" value={lessonForm.iconBg} onChange={e => setLessonForm(f => ({ ...f, iconBg: e.target.value }))} className="w-10 h-9 rounded cursor-pointer border flex-shrink-0" />
                  <Input value={lessonForm.iconBg} onChange={e => setLessonForm(f => ({ ...f, iconBg: e.target.value }))} placeholder="#EEF2FF" className="text-xs" />
                </div>
              </div>
            </div>

            {/* Aperçu */}
            <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 border rounded-lg">
              <span className="text-xs text-gray-400 font-medium w-16">Aperçu</span>
              <span className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ backgroundColor: lessonForm.iconBg }}>
                {lessonForm.icon}
              </span>
              <span className="text-sm font-semibold" style={{ color: lessonForm.iconColor }}>
                {lessonForm.title || 'Titre de la leçon'}
              </span>
            </div>

            <div className="flex gap-3">
              <div className="flex-1">
                <Label>Ordre</Label>
                <Input type="number" min={1} value={lessonForm.order} onChange={e => setLessonForm(f => ({ ...f, order: parseInt(e.target.value) || 1 }))} className="mt-1" />
              </div>
              <div className="flex items-center gap-2 mt-6">
                <Switch checked={lessonForm.isLocked} onCheckedChange={val => setLessonForm(f => ({ ...f, isLocked: val }))} />
                <Label>Verrouillée</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLessonModal(false)} disabled={saving}>Annuler</Button>
            <Button onClick={saveLesson} disabled={saving}>{saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}{editingLesson ? 'Sauvegarder' : 'Créer'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Sous-leçon */}
      <Dialog open={subModal} onOpenChange={setSubModal}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{editingSub ? 'Modifier la sous-leçon' : 'Nouvelle sous-leçon'}</DialogTitle>
            <DialogDescription>Utilisez &quot;Contenu&quot; pour rédiger le cours complet</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Titre</Label>
              <Input value={subForm.title} onChange={e => setSubForm(f => ({ ...f, title: e.target.value }))} placeholder="Ex: Introduction aux feux tricolores" className="mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Numéro</Label>
                <Input type="number" min={1} value={subForm.number} onChange={e => setSubForm(f => ({ ...f, number: parseInt(e.target.value) || 1 }))} className="mt-1" />
              </div>
              <div>
                <Label>Ordre</Label>
                <Input type="number" min={1} value={subForm.order} onChange={e => setSubForm(f => ({ ...f, order: parseInt(e.target.value) || 1 }))} className="mt-1" />
              </div>
            </div>
            <div>
              <Label>Statut</Label>
              <select
                value={subForm.status}
                onChange={e => setSubForm(f => ({ ...f, status: e.target.value as typeof subForm.status }))}
                className="mt-1 w-full border rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {STATUS_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <Label>Image (URL)</Label>
              <Input
                value={subForm.imageUrl}
                onChange={e => setSubForm(f => ({ ...f, imageUrl: e.target.value }))}
                placeholder="https://exemple.com/image.jpg"
                className="mt-1"
              />
              {subForm.imageUrl && (
                <img src={subForm.imageUrl} alt="preview" className="mt-2 rounded-lg w-full h-32 object-cover" />
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSubModal(false)} disabled={saving}>Annuler</Button>
            <Button onClick={saveSub} disabled={saving}>{saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}{editingSub ? 'Sauvegarder' : 'Créer'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Contenu — éditeur complet par langue */}
      <Dialog open={contentModal} onOpenChange={setContentModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-500" />
              Contenu : {contentSubLesson?.title}
            </DialogTitle>
            <DialogDescription>Rédigez le cours pour chaque langue disponible</DialogDescription>
          </DialogHeader>

          {/* Onglets de langue */}
          <div className="flex gap-1 p-1 bg-gray-100 rounded-lg w-fit">
            {LANG_OPTIONS.map(lang => (
              <button
                key={lang}
                onClick={() => changeContentLang(lang)}
                className={`px-3 py-1.5 rounded-md text-sm font-semibold transition-colors ${
                  contentLang === lang ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {lang}
              </button>
            ))}
          </div>

          {loadingContent ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : (
            <div className="space-y-5">

              {/* Description principale */}
              <div>
                <Label className="flex items-center gap-1.5 mb-1 text-sm font-semibold">
                  <FileText className="w-4 h-4 text-gray-400" /> Description du cours
                </Label>
                <textarea
                  value={contentForm.description}
                  onChange={e => setContentForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Rédigez le contenu principal du cours ici..."
                  rows={4}
                  className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              {/* Points clés */}
              <div>
                <Label className="flex items-center gap-1.5 mb-2 text-sm font-semibold">
                  Points clés ({contentForm.bullets.length})
                </Label>
                <div className="space-y-1.5 mb-2">
                  {contentForm.bullets.map((b, i) => (
                    <div key={i} className="flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-md px-3 py-2">
                      <span className="w-2 h-2 rounded-full bg-blue-400 flex-shrink-0" />
                      <span className="flex-1 text-sm">{b}</span>
                      <button onClick={() => removeBullet(i)} className="text-red-400 hover:text-red-600 flex-shrink-0">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={contentForm.newBullet}
                    onChange={e => setContentForm(f => ({ ...f, newBullet: e.target.value }))}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addBullet() } }}
                    placeholder="Ajouter un point clé (Entrée pour valider)"
                    className="text-sm"
                  />
                  <Button type="button" variant="outline" size="sm" onClick={addBullet} className="flex-shrink-0">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Le saviez-vous */}
              <div>
                <Label className="flex items-center gap-1.5 mb-1 text-sm font-semibold">
                  💡 Le saviez-vous ?
                </Label>
                <textarea
                  value={contentForm.didYouKnow}
                  onChange={e => setContentForm(f => ({ ...f, didYouKnow: e.target.value }))}
                  placeholder="Une anecdote ou un fait intéressant lié à cette leçon..."
                  rows={2}
                  className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              {/* Audio */}
              <div>
                <Label className="flex items-center gap-1.5 mb-1 text-sm font-semibold">
                  <Headphones className="w-4 h-4 text-gray-400" /> URL Audio ({contentLang})
                </Label>
                <Input
                  value={contentForm.audioUrl}
                  onChange={e => setContentForm(f => ({ ...f, audioUrl: e.target.value }))}
                  placeholder="https://cdn.example.com/audio/lecon-01-fr.mp3"
                  className="font-mono text-xs"
                />
                <p className="text-xs text-gray-400 mt-1">Format : MP3, OGG ou WAV hébergé sur un CDN</p>
              </div>

              {/* Durée de lecture */}
              <div>
                <Label className="mb-1 block text-sm font-semibold">Durée de lecture (minutes)</Label>
                <Input
                  type="number" min={1} max={120}
                  value={contentForm.readMinutes}
                  onChange={e => setContentForm(f => ({ ...f, readMinutes: parseInt(e.target.value) || 1 }))}
                  className="w-28"
                />
              </div>

              {/* Vidéo */}
              <div className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-1.5 text-sm font-semibold">
                    <Video className="w-4 h-4 text-gray-400" /> Vidéo associée
                  </Label>
                  <div className="flex items-center gap-2">
                    <Switch checked={contentForm.hasVideo} onCheckedChange={val => setContentForm(f => ({ ...f, hasVideo: val }))} />
                    <span className="text-sm text-gray-500">{contentForm.hasVideo ? 'Activée' : 'Désactivée'}</span>
                  </div>
                </div>
                {contentForm.hasVideo && (
                  <div>
                    <Input
                      value={contentForm.videoUrl}
                      onChange={e => setContentForm(f => ({ ...f, videoUrl: e.target.value }))}
                      placeholder="https://youtube.com/watch?v=... ou lien direct MP4"
                      className="font-mono text-xs"
                    />
                    <p className="text-xs text-gray-400 mt-1">YouTube, Vimeo ou lien MP4 direct</p>
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setContentModal(false)} disabled={saving}>Fermer</Button>
            <Button onClick={saveContent} disabled={saving || loadingContent}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {existingContentId ? 'Mettre à jour' : `Créer le contenu ${contentLang}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
