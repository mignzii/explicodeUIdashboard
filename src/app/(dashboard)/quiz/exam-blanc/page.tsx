'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  Plus, Pencil, Trash2, RefreshCw, ClipboardList, Shuffle, List,
  Search, X, GripVertical, CheckSquare,
} from 'lucide-react'
import { ColumnDef } from '@tanstack/react-table'
import { PageHeader } from '@/components/shared/page-header'
import { DataTable } from '@/components/shared/data-table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import type { ExamBlanc, QuizCategory, QuizQuestion, ExamBlancMode, CreateExamBlancPayload } from '@/types'
import { examBlancApi, quizCategoriesApi, quizQuestionsApi } from '@/lib/quizApi'
import toast from 'react-hot-toast'

interface ExamBlancForm {
  title: string
  description: string
  mode: ExamBlancMode
  questionCount: number
  durationMinutes: number
  passingScore: number
  categoryIds: string[]
  isActive: boolean
  // CUSTOM mode
  selectedQuestionIds: string[]
}

const DEFAULT_FORM: ExamBlancForm = {
  title: '',
  description: '',
  mode: 'random',
  questionCount: 40,
  durationMinutes: 40,
  passingScore: 70,
  categoryIds: [],
  isActive: true,
  selectedQuestionIds: [],
}

export default function ExamBlancPage() {
  const [examBlancs, setExamBlancs] = useState<ExamBlanc[]>([])
  const [categories, setCategories] = useState<QuizCategory[]>([])
  const [allQuestions, setAllQuestions] = useState<QuizQuestion[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingExamBlanc, setEditingExamBlanc] = useState<ExamBlanc | null>(null)
  const [form, setForm] = useState<ExamBlancForm>(DEFAULT_FORM)

  // Question picker for CUSTOM mode
  const [questionSearch, setQuestionSearch] = useState('')
  const [questionCatFilter, setQuestionCatFilter] = useState('ALL')
  const [loadingQuestions, setLoadingQuestions] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [exams, cats] = await Promise.all([
        examBlancApi.list(),
        quizCategoriesApi.list(),
      ])
      setExamBlancs(exams)
      setCategories(cats)
    } catch {
      toast.error('Erreur lors du chargement')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const loadQuestionsForPicker = useCallback(async () => {
    setLoadingQuestions(true)
    try {
      const res = await quizQuestionsApi.list({ limit: 200 })
      setAllQuestions(res?.data ?? [])
    } catch {
      // silently fail
    } finally {
      setLoadingQuestions(false)
    }
  }, [])

  const openCreate = () => {
    setEditingExamBlanc(null)
    setForm(DEFAULT_FORM)
    setQuestionSearch('')
    setQuestionCatFilter('ALL')
    setIsModalOpen(true)
    loadQuestionsForPicker()
  }

  const openEdit = (eb: ExamBlanc) => {
    setEditingExamBlanc(eb)
    setForm({
      title: eb.title,
      description: eb.description ?? '',
      mode: eb.mode,
      questionCount: eb.questionCount,
      durationMinutes: eb.durationMinutes,
      passingScore: eb.passingScore,
      categoryIds: eb.categoryIds ?? [],
      isActive: eb.isActive,
      selectedQuestionIds: eb.questions?.map(q => q.questionId) ?? [],
    })
    setQuestionSearch('')
    setQuestionCatFilter('ALL')
    setIsModalOpen(true)
    loadQuestionsForPicker()
  }

  const handleSave = async () => {
    if (!form.title.trim()) { toast.error('Le titre est requis'); return }
    if (form.mode === 'random' && form.questionCount < 1) { toast.error('Le nombre de questions doit être >= 1'); return }
    if (form.mode === 'custom' && form.selectedQuestionIds.length === 0) {
      toast.error('Sélectionnez au moins une question pour le mode custom'); return
    }
    setSaving(true)
    try {
      const payload: CreateExamBlancPayload = {
        title: form.title.trim(),
        description: form.description || undefined,
        mode: form.mode,
        questionCount: form.mode === 'random' ? form.questionCount : form.selectedQuestionIds.length,
        durationMinutes: form.durationMinutes,
        passingScore: form.passingScore,
        categoryIds: form.mode === 'random' && form.categoryIds.length > 0 ? form.categoryIds : undefined,
        questionIds: form.mode === 'custom' ? form.selectedQuestionIds : undefined,
        isActive: form.isActive,
      }
      if (editingExamBlanc) {
        await examBlancApi.update(editingExamBlanc.id, payload)
        toast.success('Exam blanc mis à jour')
      } else {
        await examBlancApi.create(payload)
        toast.success('Exam blanc créé')
      }
      setIsModalOpen(false)
      load()
    } catch {
      toast.error('Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  const deleteExamBlanc = async (id: string) => {
    try {
      await examBlancApi.delete(id)
      toast.success('Exam blanc supprimé')
      load()
    } catch {
      toast.error('Erreur lors de la suppression')
    }
  }

  const toggleCategory = (id: string) => {
    setForm(f => ({
      ...f,
      categoryIds: f.categoryIds.includes(id)
        ? f.categoryIds.filter(c => c !== id)
        : [...f.categoryIds, id],
    }))
  }

  const toggleQuestion = (id: string) => {
    setForm(f => ({
      ...f,
      selectedQuestionIds: f.selectedQuestionIds.includes(id)
        ? f.selectedQuestionIds.filter(q => q !== id)
        : [...f.selectedQuestionIds, id],
    }))
  }

  const removeSelectedQuestion = (id: string) => {
    setForm(f => ({
      ...f,
      selectedQuestionIds: f.selectedQuestionIds.filter(q => q !== id),
    }))
  }

  const filteredPickerQuestions = allQuestions.filter(q => {
    if (questionCatFilter !== 'ALL' && q.categoryId !== questionCatFilter) return false
    if (questionSearch && !q.text.toLowerCase().includes(questionSearch.toLowerCase())) return false
    return true
  }).slice(0, 50)

  const columns: ColumnDef<ExamBlanc>[] = [
    {
      id: 'title',
      header: 'Exam blanc',
      cell: ({ row }) => (
        <div>
          <p className="text-sm font-semibold text-gray-800">{row.original.title}</p>
          {row.original.description && (
            <p className="text-xs text-gray-400 truncate max-w-xs">{row.original.description}</p>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'mode',
      header: 'Mode',
      cell: ({ getValue }) => (
        <div className="flex items-center gap-2">
          {getValue<string>() === 'random' ? (
            <Shuffle className="w-3.5 h-3.5 text-blue-500" />
          ) : (
            <List className="w-3.5 h-3.5 text-amber-500" />
          )}
          <Badge variant={getValue<string>() === 'random' ? 'default' : 'warning'} className="text-xs">
            {getValue<string>()}
          </Badge>
        </div>
      ),
    },
    {
      accessorKey: 'questionCount',
      header: 'Questions',
      cell: ({ getValue }) => (
        <span className="text-sm font-mono text-gray-700">{getValue<number>()}</span>
      ),
    },
    {
      accessorKey: 'durationMinutes',
      header: 'Durée',
      cell: ({ getValue }) => (
        <span className="text-sm text-gray-600">{getValue<number>()} min</span>
      ),
    },
    {
      accessorKey: 'passingScore',
      header: 'Seuil',
      cell: ({ getValue }) => (
        <span className="text-sm font-medium text-gray-700">{getValue<number>()}%</span>
      ),
    },
    {
      id: 'categories',
      header: 'Filtres catégories',
      cell: ({ row }) => {
        const ids = row.original.categoryIds ?? []
        if (!ids.length) return <span className="text-xs text-gray-400 italic">Toutes</span>
        const names = ids.map(id => categories.find(c => c.id === id)?.title ?? id.slice(0, 6))
        return (
          <div className="flex flex-wrap gap-1 max-w-xs">
            {names.slice(0, 2).map((n, i) => (
              <Badge key={i} variant="outline" className="text-xs">{n}</Badge>
            ))}
            {names.length > 2 && <Badge variant="outline" className="text-xs">+{names.length - 2}</Badge>}
          </div>
        )
      },
    },
    {
      accessorKey: 'isActive',
      header: 'Statut',
      cell: ({ getValue }) => (
        <Badge variant={getValue<boolean>() ? 'success' : 'secondary'} className="text-xs">
          {getValue<boolean>() ? 'Actif' : 'Inactif'}
        </Badge>
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
                <AlertDialogTitle>Supprimer &ldquo;{row.original.title}&rdquo;</AlertDialogTitle>
                <AlertDialogDescription>Cette action est irréversible.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => deleteExamBlanc(row.original.id)}
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
        title="Examens blancs"
        subtitle={`${examBlancs.length} exam(s) blanc(s) configuré(s)`}
        action={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={load} className="gap-2">
              <RefreshCw className="w-4 h-4" />
            </Button>
            <Button onClick={openCreate} className="gap-2">
              <Plus className="w-4 h-4" /> Nouvel exam blanc
            </Button>
          </div>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border p-4">
          <p className="text-xs text-gray-500 mb-1">Total exam blancs</p>
          <p className="text-2xl font-bold text-gray-800">{examBlancs.length}</p>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <p className="text-xs text-gray-500 mb-1">Mode RANDOM</p>
          <p className="text-2xl font-bold text-blue-600">{examBlancs.filter(e => e.mode === 'random').length}</p>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <p className="text-xs text-gray-500 mb-1">Mode CUSTOM</p>
          <p className="text-2xl font-bold text-amber-600">{examBlancs.filter(e => e.mode === 'custom').length}</p>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <p className="text-xs text-gray-500 mb-1">Actifs</p>
          <p className="text-2xl font-bold text-emerald-600">{examBlancs.filter(e => e.isActive).length}</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border p-4">
        {loading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-14 w-full rounded" />)}
          </div>
        ) : (
          <DataTable columns={columns} data={examBlancs} searchPlaceholder="Rechercher un exam blanc…" />
        )}
      </div>

      {/* Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-blue-600" />
              {editingExamBlanc ? 'Modifier l\'exam blanc' : 'Nouvel exam blanc'}
            </DialogTitle>
            <DialogDescription>
              RANDOM : le système tire des questions aléatoirement à chaque session.
              CUSTOM : vous choisissez les questions dans un ordre précis.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-1">
            {/* Titre + description */}
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label className="text-sm font-semibold">Titre *</Label>
                <Input
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="Ex: Examen blanc officiel 2025"
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-sm font-semibold">Description (optionnel)</Label>
                <Textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Description ou instructions pour les candidats…"
                  className="mt-1"
                />
              </div>
            </div>

            {/* Mode */}
            <div>
              <Label className="text-sm font-semibold">Mode de sélection des questions</Label>
              <div className="grid grid-cols-2 gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, mode: 'random' }))}
                  className={`flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all ${
                    form.mode === 'random'
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <Shuffle className={`w-5 h-5 mt-0.5 flex-shrink-0 ${form.mode === 'random' ? 'text-blue-600' : 'text-gray-400'}`} />
                  <div>
                    <p className={`font-semibold text-sm ${form.mode === 'random' ? 'text-blue-700' : 'text-gray-700'}`}>
                      RANDOM
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      N questions tirées aléatoirement à chaque session depuis les catégories sélectionnées.
                    </p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, mode: 'custom' }))}
                  className={`flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all ${
                    form.mode === 'custom'
                      ? 'border-amber-500 bg-amber-50'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <List className={`w-5 h-5 mt-0.5 flex-shrink-0 ${form.mode === 'custom' ? 'text-amber-600' : 'text-gray-400'}`} />
                  <div>
                    <p className={`font-semibold text-sm ${form.mode === 'custom' ? 'text-amber-700' : 'text-gray-700'}`}>
                      CUSTOM
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Vous sélectionnez manuellement les questions dans un ordre précis.
                    </p>
                  </div>
                </button>
              </div>
            </div>

            <Separator />

            {/* Paramètres communs */}
            <div className="grid grid-cols-3 gap-4">
              {form.mode === 'random' && (
                <div>
                  <Label className="text-sm font-semibold">Nb de questions</Label>
                  <Input
                    type="number"
                    min={1}
                    value={form.questionCount}
                    onChange={e => setForm(f => ({ ...f, questionCount: parseInt(e.target.value) || 1 }))}
                    className="mt-1"
                  />
                </div>
              )}
              {form.mode === 'custom' && (
                <div>
                  <Label className="text-sm font-semibold">Nb de questions</Label>
                  <div className="mt-1 h-9 flex items-center px-3 rounded-md border bg-gray-50 text-sm text-gray-600 font-mono">
                    {form.selectedQuestionIds.length} sélectionnée(s)
                  </div>
                </div>
              )}
              <div>
                <Label className="text-sm font-semibold">Durée (minutes)</Label>
                <Input
                  type="number"
                  min={1}
                  value={form.durationMinutes}
                  onChange={e => setForm(f => ({ ...f, durationMinutes: parseInt(e.target.value) || 1 }))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-sm font-semibold">Seuil de réussite (%)</Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={form.passingScore}
                  onChange={e => setForm(f => ({ ...f, passingScore: parseInt(e.target.value) || 0 }))}
                  className="mt-1"
                />
              </div>
            </div>

            {/* RANDOM — Filtre catégories */}
            {form.mode === 'random' && (
              <div>
                <Label className="text-sm font-semibold">
                  Catégories source (optionnel)
                </Label>
                <p className="text-xs text-gray-400 mt-0.5 mb-2">
                  Laisser vide = puiser dans toute la base de questions.
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {categories.map(cat => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => toggleCategory(cat.id)}
                      className={`flex items-center gap-2 p-2.5 rounded-lg border text-left text-sm transition-all ${
                        form.categoryIds.includes(cat.id)
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300 text-gray-600'
                      }`}
                    >
                      <CheckSquare className={`w-4 h-4 flex-shrink-0 ${
                        form.categoryIds.includes(cat.id) ? 'text-blue-600' : 'text-gray-300'
                      }`} />
                      <span className="truncate">{cat.icon} {cat.title}</span>
                    </button>
                  ))}
                </div>
                {form.categoryIds.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setForm(f => ({ ...f, categoryIds: [] }))}
                    className="mt-2 text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1"
                  >
                    <X className="w-3 h-3" /> Effacer la sélection
                  </button>
                )}
              </div>
            )}

            {/* CUSTOM — Question picker */}
            {form.mode === 'custom' && (
              <div>
                <Label className="text-sm font-semibold">Sélectionner les questions</Label>
                <div className="mt-2 border rounded-xl overflow-hidden">
                  {/* Picker header */}
                  <div className="p-3 bg-gray-50 border-b flex gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-2.5 top-2 w-4 h-4 text-gray-400" />
                      <Input
                        value={questionSearch}
                        onChange={e => setQuestionSearch(e.target.value)}
                        placeholder="Rechercher une question…"
                        className="pl-8 h-9 text-sm"
                      />
                    </div>
                    <Select value={questionCatFilter} onValueChange={setQuestionCatFilter}>
                      <SelectTrigger className="w-44 h-9"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALL">Toutes catégories</SelectItem>
                        {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Two columns: available | selected */}
                  <div className="grid grid-cols-2 divide-x" style={{ height: '280px' }}>
                    {/* Available */}
                    <div className="overflow-y-auto p-2">
                      <p className="text-xs font-semibold text-gray-400 px-2 pb-1 sticky top-0 bg-white">
                        Disponibles ({filteredPickerQuestions.length})
                      </p>
                      {loadingQuestions ? (
                        <div className="space-y-2 p-2">
                          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-8 rounded" />)}
                        </div>
                      ) : filteredPickerQuestions.length === 0 ? (
                        <p className="text-xs text-gray-400 p-3 text-center">Aucune question trouvée</p>
                      ) : (
                        filteredPickerQuestions.map(q => {
                          const selected = form.selectedQuestionIds.includes(q.id)
                          const cat = categories.find(c => c.id === q.categoryId)
                          return (
                            <button
                              key={q.id}
                              type="button"
                              onClick={() => !selected && toggleQuestion(q.id)}
                              disabled={selected}
                              className={`w-full text-left p-2 rounded-lg text-sm mb-1 transition-colors ${
                                selected
                                  ? 'opacity-40 cursor-not-allowed bg-gray-50'
                                  : 'hover:bg-blue-50 hover:text-blue-700 cursor-pointer'
                              }`}
                            >
                              <p className="truncate font-medium leading-snug">{q.text}</p>
                              <p className="text-xs text-gray-400">{cat?.title}</p>
                            </button>
                          )
                        })
                      )}
                    </div>

                    {/* Selected */}
                    <div className="overflow-y-auto p-2">
                      <p className="text-xs font-semibold text-gray-400 px-2 pb-1 sticky top-0 bg-white">
                        Sélectionnées ({form.selectedQuestionIds.length})
                      </p>
                      {form.selectedQuestionIds.length === 0 ? (
                        <p className="text-xs text-gray-400 p-3 text-center">
                          Cliquez sur des questions pour les ajouter
                        </p>
                      ) : (
                        form.selectedQuestionIds.map((qid, idx) => {
                          const q = allQuestions.find(q => q.id === qid)
                          return (
                            <div
                              key={qid}
                              className="flex items-start gap-2 p-2 rounded-lg mb-1 bg-blue-50 border border-blue-100 group"
                            >
                              <span className="text-xs font-mono text-blue-400 mt-0.5 flex-shrink-0 w-5">{idx + 1}.</span>
                              <GripVertical className="w-3 h-3 text-gray-300 mt-1 flex-shrink-0" />
                              <p className="text-xs flex-1 text-gray-700 leading-snug truncate">
                                {q?.text ?? qid}
                              </p>
                              <button
                                type="button"
                                onClick={() => removeSelectedQuestion(qid)}
                                className="text-gray-300 hover:text-red-500 transition-colors flex-shrink-0"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )
                        })
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Statut */}
            <div className="flex items-center gap-3">
              <Switch
                checked={form.isActive}
                onCheckedChange={v => setForm(f => ({ ...f, isActive: v }))}
              />
              <div>
                <p className="text-sm font-semibold text-gray-700">
                  {form.isActive ? 'Exam blanc actif' : 'Exam blanc inactif'}
                </p>
                <p className="text-xs text-gray-400">
                  {form.isActive
                    ? 'Visible et accessible dans l\'application mobile'
                    : 'Masqué dans l\'application mobile'}
                </p>
              </div>
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Annuler</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Sauvegarde…' : editingExamBlanc ? 'Sauvegarder' : 'Créer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
