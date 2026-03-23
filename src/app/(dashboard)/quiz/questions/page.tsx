'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  Plus, Pencil, Trash2, Upload, FileQuestion, ImageIcon,
  Volume2, ChevronDown, ChevronUp, RefreshCw, X, BookOpen,
} from 'lucide-react'
import { ColumnDef } from '@tanstack/react-table'
import { PageHeader } from '@/components/shared/page-header'
import { DataTable } from '@/components/shared/data-table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import type { QuizQuestion, QuizCategory, QuestionType, QuestionDifficulty, CreateQuizQuestionPayload, LearningModule, Category, Lesson } from '@/types'
import { quizQuestionsApi, quizCategoriesApi } from '@/lib/quizApi'
import { modulesApi, categoriesApi, lessonsApi } from '@/lib/learningApi'
import toast from 'react-hot-toast'

const LANGUAGES = [
  { value: 'FR', label: 'Français', flag: '🇫🇷' },
  { value: 'WO', label: 'Wolof', flag: '🇸🇳' },
  { value: 'PU', label: 'Pulaar', flag: '🇸🇳' },
  { value: 'SE', label: 'Sérère', flag: '🇸🇳' },
  { value: 'JO', label: 'Diola', flag: '🇸🇳' },
]

const DIFFICULTY_CONFIG = {
  easy: { label: 'Facile', variant: 'success' as const },
  medium: { label: 'Moyen', variant: 'warning' as const },
  hard: { label: 'Difficile', variant: 'destructive' as const },
}

interface QuestionForm {
  text: string
  categoryId: string
  moduleId: string
  lang: string
  type: QuestionType
  options: string[]
  correctIndices: number[]
  difficulty: QuestionDifficulty
  explanation: string
  imageUrl: string
  audioUrls: Record<string, string>
  lessonId: string
  hasSubQuestion: boolean
  subQuestion: {
    text: string
    options: string[]
    correctIndices: number[]
    type: QuestionType
    explanation: string
    audioUrls: Record<string, string>
  }
}

const DEFAULT_FORM: QuestionForm = {
  text: '',
  categoryId: '',
  moduleId: '',
  lang: 'FR',
  type: 'single',
  options: ['', ''],
  correctIndices: [0],
  difficulty: 'easy',
  explanation: '',
  imageUrl: '',
  audioUrls: {},
  lessonId: '',
  hasSubQuestion: false,
  subQuestion: {
    text: '',
    options: ['', ''],
    correctIndices: [0],
    type: 'single',
    explanation: '',
    audioUrls: {},
  },
}

export default function QuestionsPage() {
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [categories, setCategories] = useState<QuizCategory[]>([])
  const [totalQuestions, setTotalQuestions] = useState(0)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingQuestion, setEditingQuestion] = useState<QuizQuestion | null>(null)
  const [form, setForm] = useState<QuestionForm>(DEFAULT_FORM)
  const [catFilter, setCatFilter] = useState('ALL')
  const [langFilter, setLangFilter] = useState('ALL')
  const [diffFilter, setDiffFilter] = useState('ALL')
  const [showAudioSection, setShowAudioSection] = useState(false)
  const [page, setPage] = useState(1)
  const PAGE_SIZE = 20

  // Sélecteur de leçon en cascade
  const [lessonModules, setLessonModules] = useState<LearningModule[]>([])
  const [lessonCategories, setLessonCategories] = useState<Category[]>([])
  const [lessonList, setLessonList] = useState<Lesson[]>([])
  const [lessonModuleId, setLessonModuleId] = useState('')
  const [lessonCategoryId, setLessonCategoryId] = useState('')
  const [loadingLessonCats, setLoadingLessonCats] = useState(false)
  const [loadingLessons, setLoadingLessons] = useState(false)

  const loadCategories = useCallback(async () => {
    try {
      const cats = await quizCategoriesApi.list()
      setCategories(cats)
    } catch {
      // silently fail
    }
  }, [])

  const loadLessonModules = useCallback(async () => {
    try {
      const mods = await modulesApi.list()
      setLessonModules(mods as LearningModule[])
    } catch { /* silently fail */ }
  }, [])

  const onLessonModuleChange = async (moduleId: string) => {
    setLessonModuleId(moduleId)
    setLessonCategoryId('')
    setLessonList([])
    setForm(f => ({ ...f, lessonId: '' }))
    if (!moduleId) { setLessonCategories([]); return }
    setLoadingLessonCats(true)
    try {
      const cats = await categoriesApi.list(moduleId)
      setLessonCategories(cats as Category[])
    } catch { setLessonCategories([]) }
    finally { setLoadingLessonCats(false) }
  }

  const onLessonCategoryChange = async (categoryId: string) => {
    setLessonCategoryId(categoryId)
    setLessonList([])
    setForm(f => ({ ...f, lessonId: '' }))
    if (!categoryId) return
    setLoadingLessons(true)
    try {
      const lessons = await lessonsApi.list(categoryId)
      setLessonList(lessons as Lesson[])
    } catch { setLessonList([]) }
    finally { setLoadingLessons(false) }
  }

  const loadQuestions = useCallback(async () => {
    setLoading(true)
    try {
      const res = await quizQuestionsApi.list({
        categoryId: catFilter !== 'ALL' ? catFilter : undefined,
        lang: langFilter !== 'ALL' ? langFilter : undefined,
        difficulty: diffFilter !== 'ALL' ? diffFilter as QuestionDifficulty : undefined,
        page,
        limit: PAGE_SIZE,
      })
      setQuestions(res?.data ?? [])
      setTotalQuestions(res?.meta?.total ?? 0)
    } catch {
      toast.error('Erreur chargement questions')
    } finally {
      setLoading(false)
    }
  }, [catFilter, langFilter, diffFilter, page])

  useEffect(() => { loadCategories() }, [loadCategories])
  useEffect(() => { loadQuestions() }, [loadQuestions])
  useEffect(() => { loadLessonModules() }, [loadLessonModules])

  const openCreate = () => {
    setEditingQuestion(null)
    setForm({ ...DEFAULT_FORM, categoryId: categories[0]?.id ?? '' })
    setShowAudioSection(false)
    setLessonModuleId('')
    setLessonCategoryId('')
    setLessonCategories([])
    setLessonList([])
    loadLessonModules()
    setIsModalOpen(true)
  }

  const openEdit = (q: QuizQuestion) => {
    setEditingQuestion(q)
    setForm({
      text: q.text,
      categoryId: q.categoryId,
      moduleId: q.moduleId ?? '',
      lang: q.lang,
      type: q.type,
      options: q.options,
      correctIndices: q.correctIndices,
      difficulty: q.difficulty,
      explanation: q.explanation ?? '',
      imageUrl: q.imageUrl ?? '',
      audioUrls: q.audioUrls ?? {},
      lessonId: q.lessonId ?? '',
      hasSubQuestion: !!(q.subQuestions?.length),
      subQuestion: q.subQuestions?.[0] ? {
        text: q.subQuestions[0].text,
        options: q.subQuestions[0].options,
        correctIndices: q.subQuestions[0].correctIndices,
        type: q.subQuestions[0].type,
        explanation: q.subQuestions[0].explanation ?? '',
        audioUrls: q.subQuestions[0].audioUrls ?? {},
      } : DEFAULT_FORM.subQuestion,
    })
    setShowAudioSection(!!(q.audioUrls && Object.keys(q.audioUrls).length > 0))
    // Reset lesson selectors when editing (lesson already stored as ID)
    setLessonModuleId('')
    setLessonCategoryId('')
    setLessonCategories([])
    setLessonList([])
    loadLessonModules()
    setIsModalOpen(true)
  }

  const toggleCorrect = (idx: number, isSubQ = false) => {
    if (isSubQ) {
      const t = form.subQuestion.type
      if (t === 'single') {
        setForm(f => ({ ...f, subQuestion: { ...f.subQuestion, correctIndices: [idx] } }))
      } else {
        setForm(f => {
          const current = f.subQuestion.correctIndices
          const next = current.includes(idx) ? current.filter(i => i !== idx) : [...current, idx]
          return { ...f, subQuestion: { ...f.subQuestion, correctIndices: next.length ? next : [idx] } }
        })
      }
    } else {
      if (form.type === 'single') {
        setForm(f => ({ ...f, correctIndices: [idx] }))
      } else {
        setForm(f => {
          const current = f.correctIndices
          const next = current.includes(idx) ? current.filter(i => i !== idx) : [...current, idx]
          return { ...f, correctIndices: next.length ? next : [idx] }
        })
      }
    }
  }

  const handleSave = async () => {
    if (!form.text.trim()) { toast.error('La question est requise'); return }
    if (!form.categoryId) { toast.error('La catégorie est requise'); return }
    if (form.options.length < 2) { toast.error('Minimum 2 options requises'); return }
    if (form.options.some(o => !o.trim())) { toast.error('Toutes les options sont requises'); return }
    if (form.hasSubQuestion) {
      if (!form.subQuestion.text.trim()) { toast.error('Le texte de la sous-question est requis'); return }
      if (form.subQuestion.options.length < 2) { toast.error('Minimum 2 options pour la sous-question'); return }
      if (form.subQuestion.options.some(o => !o.trim())) { toast.error('Toutes les options de la sous-question sont requises'); return }
    }

    setSaving(true)
    try {
      const payload: CreateQuizQuestionPayload = {
        categoryId: form.categoryId,
        moduleId: form.moduleId || undefined,
        lang: form.lang,
        text: form.text,
        options: form.options,
        correctIndices: form.correctIndices,
        type: form.type,
        difficulty: form.difficulty,
        explanation: form.explanation || undefined,
        imageUrl: form.imageUrl || undefined,
        audioUrls: Object.keys(form.audioUrls).length ? form.audioUrls : undefined,
        lessonId: form.lessonId || undefined,
        subQuestion: form.hasSubQuestion ? {
          text: form.subQuestion.text,
          options: form.subQuestion.options,
          correctIndices: form.subQuestion.correctIndices,
          type: form.subQuestion.type,
          explanation: form.subQuestion.explanation || undefined,
          audioUrls: Object.keys(form.subQuestion.audioUrls).length ? form.subQuestion.audioUrls : undefined,
        } : undefined,
      }

      if (editingQuestion) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { subQuestion: _sub, ...updatePayload } = payload
        await quizQuestionsApi.update(editingQuestion.id, updatePayload)
        toast.success('Question mise à jour')
      } else {
        await quizQuestionsApi.create(payload)
        toast.success('Question créée')
      }
      setIsModalOpen(false)
      loadQuestions()
    } catch {
      toast.error('Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  const deleteQuestion = async (id: string) => {
    try {
      await quizQuestionsApi.delete(id)
      toast.success('Question supprimée')
      loadQuestions()
    } catch {
      toast.error('Erreur lors de la suppression')
    }
  }

  const resetFilters = () => { setCatFilter('ALL'); setLangFilter('ALL'); setDiffFilter('ALL'); setPage(1) }

  const columns: ColumnDef<QuizQuestion>[] = [
    {
      accessorKey: 'text',
      header: 'Question',
      cell: ({ row }) => (
        <div>
          <p className="text-sm max-w-xs truncate font-medium">{row.original.text}</p>
          {row.original.subQuestions?.length ? (
            <span className="text-xs text-blue-500 mt-0.5 block">+ sous-question</span>
          ) : null}
        </div>
      ),
    },
    {
      accessorKey: 'categoryId',
      header: 'Catégorie',
      cell: ({ getValue }) => {
        const cat = categories.find(c => c.id === getValue<string>())
        return (
          <div className="flex items-center gap-1.5">
            {cat?.color && (
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
            )}
            <span className="text-xs text-gray-600">{cat?.title ?? '—'}</span>
          </div>
        )
      },
    },
    {
      accessorKey: 'lang',
      header: 'Langue',
      cell: ({ getValue }) => {
        const lang = LANGUAGES.find(l => l.value === getValue<string>())
        return <span className="text-xs">{lang?.flag} {lang?.label ?? getValue<string>()}</span>
      },
    },
    {
      accessorKey: 'type',
      header: 'Type',
      cell: ({ getValue }) => (
        <Badge variant={getValue<string>() === 'multiple' ? 'default' : 'outline'} className="text-xs">
          {getValue<string>() === 'multiple' ? 'Multiple' : 'Simple'}
        </Badge>
      ),
    },
    {
      accessorKey: 'correctIndices',
      header: 'Réponse(s)',
      cell: ({ getValue }) => (
        <div className="flex gap-1 flex-wrap">
          {getValue<number[]>().map(i => (
            <Badge key={i} variant="success" className="text-xs font-bold">
              {String.fromCharCode(65 + i)}
            </Badge>
          ))}
        </div>
      ),
    },
    {
      accessorKey: 'difficulty',
      header: 'Difficulté',
      cell: ({ getValue }) => {
        const d = getValue<string>() as keyof typeof DIFFICULTY_CONFIG
        const cfg = DIFFICULTY_CONFIG[d] || DIFFICULTY_CONFIG.easy
        return <Badge variant={cfg.variant} className="text-xs">{cfg.label}</Badge>
      },
    },
    {
      id: 'media',
      header: 'Média',
      cell: ({ row }) => (
        <div className="flex gap-1">
          {row.original.imageUrl && <ImageIcon className="w-4 h-4 text-gray-400" />}
          {row.original.audioUrls && Object.keys(row.original.audioUrls).length > 0 && (
            <Volume2 className="w-4 h-4 text-gray-400" />
          )}
          {row.original.lessonId && (
            <BookOpen className="w-4 h-4 text-indigo-400" />
          )}
        </div>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex gap-1">
          <Button variant="ghost" size="icon-sm" onClick={() => openEdit(row.original)}>
            <Pencil className="w-3.5 h-3.5" />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon-sm" className="text-red-400 hover:text-red-600">
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Supprimer la question</AlertDialogTitle>
                <AlertDialogDescription>
                  Cette action est irréversible. La sous-question liée sera également supprimée.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => deleteQuestion(row.original.id)}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Supprimer
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestion des questions"
        subtitle={`${totalQuestions} questions dans la base de données`}
        action={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={loadQuestions} className="gap-2">
              <RefreshCw className="w-4 h-4" />
            </Button>
            <Button variant="outline" className="gap-2" onClick={() => toast.success('Import CSV — bientôt disponible')}>
              <Upload className="w-4 h-4" /> Importer CSV
            </Button>
            <Button onClick={openCreate} className="gap-2">
              <Plus className="w-4 h-4" /> Nouvelle question
            </Button>
          </div>
        }
      />

      {/* Filters */}
      <div className="bg-white rounded-xl border p-4 flex flex-wrap gap-3 items-center">
        <Select value={catFilter} onValueChange={v => { setCatFilter(v); setPage(1) }}>
          <SelectTrigger className="w-48 h-9"><SelectValue placeholder="Catégorie" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Toutes catégories</SelectItem>
            {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={langFilter} onValueChange={v => { setLangFilter(v); setPage(1) }}>
          <SelectTrigger className="w-36 h-9"><SelectValue placeholder="Langue" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Toutes langues</SelectItem>
            {LANGUAGES.map(l => <SelectItem key={l.value} value={l.value}>{l.flag} {l.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={diffFilter} onValueChange={v => { setDiffFilter(v); setPage(1) }}>
          <SelectTrigger className="w-36 h-9"><SelectValue placeholder="Difficulté" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Toutes difficultés</SelectItem>
            <SelectItem value="easy">Facile</SelectItem>
            <SelectItem value="medium">Moyen</SelectItem>
            <SelectItem value="hard">Difficile</SelectItem>
          </SelectContent>
        </Select>
        {(catFilter !== 'ALL' || langFilter !== 'ALL' || diffFilter !== 'ALL') && (
          <Button variant="ghost" size="sm" onClick={resetFilters}>
            <X className="w-3.5 h-3.5 mr-1" /> Réinitialiser
          </Button>
        )}
        <span className="ml-auto text-sm text-gray-500">{totalQuestions} résultats</span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border p-4">
        {loading ? (
          <div className="space-y-3">
            {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-12 w-full rounded" />)}
          </div>
        ) : (
          <>
            <DataTable columns={columns} data={questions} searchPlaceholder="Rechercher une question…" />
            {/* Pagination simple */}
            {totalQuestions > PAGE_SIZE && (
              <div className="flex items-center justify-between mt-4 pt-3 border-t">
                <span className="text-sm text-gray-500">
                  Page {page} · {Math.ceil(totalQuestions / PAGE_SIZE)} pages
                </span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                    Précédent
                  </Button>
                  <Button variant="outline" size="sm" disabled={page >= Math.ceil(totalQuestions / PAGE_SIZE)} onClick={() => setPage(p => p + 1)}>
                    Suivant
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileQuestion className="w-5 h-5 text-blue-600" />
              {editingQuestion ? 'Modifier la question' : 'Nouvelle question'}
            </DialogTitle>
            <DialogDescription>
              Remplissez tous les champs. Les images et audios sont liés via URL externe.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-1">
            {/* Texte + catégorie */}
            <div>
              <Label className="text-sm font-semibold">Question *</Label>
              <Textarea
                value={form.text}
                onChange={e => setForm(f => ({ ...f, text: e.target.value }))}
                placeholder="Saisissez la question…"
                className="mt-1 min-h-[80px]"
              />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="col-span-2">
                <Label className="text-sm font-semibold">Catégorie *</Label>
                <Select value={form.categoryId} onValueChange={val => setForm(f => ({ ...f, categoryId: val }))}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Choisir…" /></SelectTrigger>
                  <SelectContent>
                    {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm font-semibold">Langue</Label>
                <Select value={form.lang} onValueChange={val => setForm(f => ({ ...f, lang: val }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {LANGUAGES.map(l => <SelectItem key={l.value} value={l.value}>{l.flag} {l.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm font-semibold">Difficulté</Label>
                <Select value={form.difficulty} onValueChange={val => setForm(f => ({ ...f, difficulty: val as QuestionDifficulty }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">Facile</SelectItem>
                    <SelectItem value="medium">Moyen</SelectItem>
                    <SelectItem value="hard">Difficile</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Type de réponse */}
            <div>
              <Label className="text-sm font-semibold">Type de réponse</Label>
              <div className="flex gap-4 mt-2">
                {(['single', 'multiple'] as QuestionType[]).map(t => (
                  <label key={t} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="qtype"
                      checked={form.type === t}
                      onChange={() => setForm(f => ({ ...f, type: t, correctIndices: [0] }))}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-sm">{t === 'single' ? 'Une seule réponse' : '2 réponses correctes'}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Options */}
            <div>
              <Label className="text-sm font-semibold">Options de réponse *</Label>
              <p className="text-xs text-gray-400 mt-0.5 mb-2">
                {form.type === 'single'
                  ? 'Cliquez sur le bouton radio pour choisir la bonne réponse'
                  : 'Cochez les bonnes réponses'}
              </p>
              <div className="space-y-2">
                {form.options.map((option, idx) => {
                  const isCorrect = form.correctIndices.includes(idx)
                  return (
                    <div key={idx} className="flex items-center gap-3">
                      <input
                        type={form.type === 'single' ? 'radio' : 'checkbox'}
                        name="correctAnswer"
                        checked={isCorrect}
                        onChange={() => toggleCorrect(idx)}
                        className="w-4 h-4 text-blue-600 flex-shrink-0"
                      />
                      <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${isCorrect ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <Input
                        value={option}
                        onChange={e => {
                          const opts = [...form.options]
                          opts[idx] = e.target.value
                          setForm(f => ({ ...f, options: opts }))
                        }}
                        placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                        className={isCorrect ? 'border-blue-300 bg-blue-50' : ''}
                      />
                      {form.options.length > 2 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          className="text-red-400 hover:text-red-600 flex-shrink-0"
                          onClick={() => {
                            const opts = form.options.filter((_, i) => i !== idx)
                            const newCorrect = form.correctIndices
                              .filter(i => i !== idx)
                              .map(i => i > idx ? i - 1 : i)
                            setForm(f => ({
                              ...f,
                              options: opts,
                              correctIndices: newCorrect.length ? newCorrect : [0],
                            }))
                          }}
                        >
                          <X className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                  )
                })}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-2 gap-1.5 text-xs"
                onClick={() => setForm(f => ({ ...f, options: [...f.options, ''] }))}
              >
                <Plus className="w-3.5 h-3.5" /> Ajouter une option
              </Button>
            </div>

            {/* Explication */}
            <div>
              <Label className="text-sm font-semibold">Explication (optionnel)</Label>
              <Textarea
                value={form.explanation}
                onChange={e => setForm(f => ({ ...f, explanation: e.target.value }))}
                placeholder="Pourquoi cette réponse est-elle correcte ?"
                className="mt-1"
              />
            </div>

            {/* Image */}
            <div>
              <Label className="text-sm font-semibold flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-gray-400" /> Image (URL)
              </Label>
              <Input
                value={form.imageUrl}
                onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value }))}
                placeholder="https://cdn.example.com/image.jpg"
                className="mt-1"
              />
              <p className="text-xs text-gray-400 mt-1">
                Partagée avec la sous-question si mode cascade.
              </p>
            </div>

            {/* Lier à une leçon */}
            <div className="border rounded-lg overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 bg-gray-50">
                <BookOpen className="w-4 h-4 text-indigo-500" />
                <div className="flex-1">
                  <span className="text-sm font-semibold text-gray-700">Lier à une leçon</span>
                  <p className="text-xs text-gray-400 mt-0.5">Active le bouton &quot;Réviser la leçon&quot; dans le récapitulatif</p>
                </div>
                {form.lessonId && (
                  <button
                    type="button"
                    onClick={() => { setForm(f => ({ ...f, lessonId: '' })); setLessonModuleId(''); setLessonCategoryId(''); setLessonList([]); setLessonCategories([]) }}
                    className="text-xs text-red-400 hover:text-red-600 flex items-center gap-1"
                  >
                    <X className="w-3 h-3" /> Retirer
                  </button>
                )}
              </div>
              <div className="p-4 bg-white space-y-3">
                {form.lessonId ? (
                  <div className="flex items-center gap-2 p-2 bg-indigo-50 rounded-lg border border-indigo-200">
                    <BookOpen className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                    <span className="text-sm text-indigo-700 font-medium truncate">
                      {lessonList.find(l => l.id === form.lessonId)?.title ?? `Leçon liée (${form.lessonId.slice(0, 8)}…)`}
                    </span>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-2">
                    <Select value={lessonModuleId} onValueChange={onLessonModuleChange}>
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="1. Choisir un module…" />
                      </SelectTrigger>
                      <SelectContent>
                        {lessonModules.map(m => (
                          <SelectItem key={m.id} value={m.id}>{m.icon} {m.title}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {lessonModuleId && (
                      <Select value={lessonCategoryId} onValueChange={onLessonCategoryChange} disabled={loadingLessonCats}>
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder={loadingLessonCats ? 'Chargement…' : '2. Choisir une catégorie…'} />
                        </SelectTrigger>
                        <SelectContent>
                          {lessonCategories.map(c => (
                            <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}

                    {lessonCategoryId && (
                      <Select
                        value={form.lessonId}
                        onValueChange={val => setForm(f => ({ ...f, lessonId: val }))}
                        disabled={loadingLessons}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder={loadingLessons ? 'Chargement…' : '3. Choisir une leçon…'} />
                        </SelectTrigger>
                        <SelectContent>
                          {lessonList.map(l => (
                            <SelectItem key={l.id} value={l.id}>{l.title}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Audios */}
            <div className="border rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={() => setShowAudioSection(v => !v)}
                className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-sm font-semibold text-gray-700"
              >
                <span className="flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-gray-500" />
                  Audios par langue (optionnel)
                  {Object.keys(form.audioUrls).length > 0 && (
                    <Badge variant="default" className="text-xs ml-1">
                      {Object.keys(form.audioUrls).length} langue(s)
                    </Badge>
                  )}
                </span>
                {showAudioSection ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              {showAudioSection && (
                <div className="p-4 space-y-3 bg-white">
                  {LANGUAGES.map(lang => (
                    <div key={lang.value} className="flex items-center gap-3">
                      <span className="w-24 text-sm font-medium text-gray-600 flex-shrink-0">
                        {lang.flag} {lang.label}
                      </span>
                      <Input
                        value={form.audioUrls[lang.value] ?? ''}
                        onChange={e => setForm(f => ({
                          ...f,
                          audioUrls: e.target.value
                            ? { ...f.audioUrls, [lang.value]: e.target.value }
                            : Object.fromEntries(Object.entries(f.audioUrls).filter(([k]) => k !== lang.value)),
                        }))}
                        placeholder={`URL audio ${lang.label}…`}
                        className="flex-1 text-sm"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Sous-question cascade */}
            <div className="border rounded-lg overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 bg-gray-50">
                <div>
                  <span className="text-sm font-semibold text-gray-700">Sous-question en cascade</span>
                  <p className="text-xs text-gray-400 mt-0.5">Partage l&apos;image de la question principale</p>
                </div>
                <Switch
                  checked={form.hasSubQuestion}
                  onCheckedChange={v => setForm(f => ({ ...f, hasSubQuestion: v }))}
                />
              </div>

              {form.hasSubQuestion && (
                <div className="p-4 space-y-4 bg-white border-t">
                  <div>
                    <Label className="text-sm font-semibold">Texte de la sous-question *</Label>
                    <Textarea
                      value={form.subQuestion.text}
                      onChange={e => setForm(f => ({ ...f, subQuestion: { ...f.subQuestion, text: e.target.value } }))}
                      placeholder="Saisissez la sous-question…"
                      className="mt-1 min-h-[70px]"
                    />
                  </div>

                  <div>
                    <Label className="text-sm font-semibold">Type</Label>
                    <div className="flex gap-4 mt-1">
                      {(['single', 'multiple'] as QuestionType[]).map(t => (
                        <label key={t} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="sqtype"
                            checked={form.subQuestion.type === t}
                            onChange={() => setForm(f => ({
                              ...f,
                              subQuestion: { ...f.subQuestion, type: t, correctIndices: [0] },
                            }))}
                            className="w-4 h-4 text-blue-600"
                          />
                          <span className="text-sm">{t === 'single' ? 'Une seule réponse' : '2 réponses'}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-semibold">Options sous-question *</Label>
                    <div className="space-y-2 mt-1">
                      {form.subQuestion.options.map((option, idx) => {
                        const isCorrect = form.subQuestion.correctIndices.includes(idx)
                        return (
                          <div key={idx} className="flex items-center gap-3">
                            <input
                              type={form.subQuestion.type === 'single' ? 'radio' : 'checkbox'}
                              name="sqAnswer"
                              checked={isCorrect}
                              onChange={() => toggleCorrect(idx, true)}
                              className="w-4 h-4 text-blue-600 flex-shrink-0"
                            />
                            <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${isCorrect ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
                              {String.fromCharCode(65 + idx)}
                            </span>
                            <Input
                              value={option}
                              onChange={e => {
                                const opts = [...form.subQuestion.options]
                                opts[idx] = e.target.value
                                setForm(f => ({ ...f, subQuestion: { ...f.subQuestion, options: opts } }))
                              }}
                              placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                              className={isCorrect ? 'border-blue-300 bg-blue-50' : ''}
                            />
                            {form.subQuestion.options.length > 2 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon-sm"
                                className="text-red-400 hover:text-red-600 flex-shrink-0"
                                onClick={() => {
                                  const opts = form.subQuestion.options.filter((_, i) => i !== idx)
                                  const newCorrect = form.subQuestion.correctIndices
                                    .filter(i => i !== idx)
                                    .map(i => i > idx ? i - 1 : i)
                                  setForm(f => ({
                                    ...f,
                                    subQuestion: {
                                      ...f.subQuestion,
                                      options: opts,
                                      correctIndices: newCorrect.length ? newCorrect : [0],
                                    },
                                  }))
                                }}
                              >
                                <X className="w-3.5 h-3.5" />
                              </Button>
                            )}
                          </div>
                        )
                      })}
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="mt-2 gap-1.5 text-xs"
                      onClick={() => setForm(f => ({
                        ...f,
                        subQuestion: { ...f.subQuestion, options: [...f.subQuestion.options, ''] },
                      }))}
                    >
                      <Plus className="w-3.5 h-3.5" /> Ajouter une option
                    </Button>
                  </div>

                  <div>
                    <Label className="text-sm font-semibold">Explication sous-question</Label>
                    <Textarea
                      value={form.subQuestion.explanation}
                      onChange={e => setForm(f => ({ ...f, subQuestion: { ...f.subQuestion, explanation: e.target.value } }))}
                      placeholder="Explication…"
                      className="mt-1"
                    />
                  </div>

                  {/* Audios sous-question */}
                  <div>
                    <Label className="text-sm font-semibold flex items-center gap-2">
                      <Volume2 className="w-4 h-4 text-gray-400" /> Audios sous-question
                    </Label>
                    <div className="space-y-2 mt-2">
                      {LANGUAGES.map(lang => (
                        <div key={lang.value} className="flex items-center gap-3">
                          <span className="w-24 text-sm text-gray-600 flex-shrink-0">
                            {lang.flag} {lang.label}
                          </span>
                          <Input
                            value={form.subQuestion.audioUrls[lang.value] ?? ''}
                            onChange={e => setForm(f => ({
                              ...f,
                              subQuestion: {
                                ...f.subQuestion,
                                audioUrls: e.target.value
                                  ? { ...f.subQuestion.audioUrls, [lang.value]: e.target.value }
                                  : Object.fromEntries(Object.entries(f.subQuestion.audioUrls).filter(([k]) => k !== lang.value)),
                              },
                            }))}
                            placeholder={`URL audio ${lang.label}…`}
                            className="flex-1 text-sm"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Annuler</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Sauvegarde…' : editingQuestion ? 'Sauvegarder' : 'Créer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
