'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Plus, Pencil, Trash2, RefreshCw, LayoutGrid, X } from 'lucide-react'
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
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import type { QuizCategory, LearningModule, CreateQuizCategoryPayload } from '@/types'
import { quizCategoriesApi } from '@/lib/quizApi'
import { modulesApi } from '@/lib/learningApi'
import toast from 'react-hot-toast'

const ICON_OPTIONS = ['🚦', '🛑', '⚠️', '🚗', '🔧', '🌿', '📋', '🛡️', '🎓', '📍']
const COLOR_OPTIONS = [
  '#1B4FD8', '#10B981', '#F59E0B', '#EF4444',
  '#8B5CF6', '#64748B', '#16A34A', '#EC4899', '#06B6D4', '#F97316',
]

interface CategoryForm {
  title: string
  description: string
  icon: string
  color: string
  moduleId: string
  order: number
  isActive: boolean
}

const DEFAULT_FORM: CategoryForm = {
  title: '',
  description: '',
  icon: '📋',
  color: '#1B4FD8',
  moduleId: '',
  order: 0,
  isActive: true,
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<QuizCategory[]>([])
  const [modules, setModules] = useState<LearningModule[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<QuizCategory | null>(null)
  const [form, setForm] = useState<CategoryForm>(DEFAULT_FORM)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [cats, mods] = await Promise.all([
        quizCategoriesApi.list(),
        modulesApi.list() as Promise<LearningModule[]>,
      ])
      setCategories(cats)
      setModules(mods)
    } catch {
      toast.error('Erreur lors du chargement')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const openCreate = () => {
    setEditingCategory(null)
    setForm({ ...DEFAULT_FORM, order: categories.length })
    setIsModalOpen(true)
  }

  const openEdit = (cat: QuizCategory) => {
    setEditingCategory(cat)
    setForm({
      title: cat.title,
      description: cat.description ?? '',
      icon: cat.icon ?? '📋',
      color: cat.color ?? '#1B4FD8',
      moduleId: cat.moduleId ?? '',
      order: cat.order,
      isActive: cat.isActive,
    })
    setIsModalOpen(true)
  }

  const handleSave = async () => {
    if (!form.title.trim()) { toast.error('Le titre est requis'); return }
    setSaving(true)
    try {
      const payload: CreateQuizCategoryPayload = {
        title: form.title.trim(),
        description: form.description || undefined,
        icon: form.icon || undefined,
        color: form.color || undefined,
        moduleId: form.moduleId || undefined,
        order: form.order,
        isActive: form.isActive,
      }
      if (editingCategory) {
        await quizCategoriesApi.update(editingCategory.id, payload)
        toast.success('Catégorie mise à jour')
      } else {
        await quizCategoriesApi.create(payload)
        toast.success('Catégorie créée')
      }
      setIsModalOpen(false)
      load()
    } catch {
      toast.error('Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  const deleteCategory = async (id: string) => {
    try {
      await quizCategoriesApi.delete(id)
      toast.success('Catégorie supprimée')
      load()
    } catch {
      toast.error('Erreur lors de la suppression')
    }
  }

  const columns: ColumnDef<QuizCategory>[] = [
    {
      id: 'title',
      header: 'Catégorie',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center text-lg flex-shrink-0"
            style={{ backgroundColor: `${row.original.color ?? '#1B4FD8'}20` }}
          >
            {row.original.icon ?? '📋'}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-800">{row.original.title}</p>
            {row.original.description && (
              <p className="text-xs text-gray-400 truncate max-w-xs">{row.original.description}</p>
            )}
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'moduleId',
      header: 'Module',
      cell: ({ getValue }) => {
        const mod = modules.find(m => m.id === getValue<string>())
        return mod ? (
          <span className="text-xs text-gray-600">{mod.title}</span>
        ) : (
          <span className="text-xs text-gray-400 italic">Global</span>
        )
      },
    },
    {
      accessorKey: 'order',
      header: 'Ordre',
      cell: ({ getValue }) => (
        <span className="text-sm text-gray-600 font-mono">{getValue<number>()}</span>
      ),
    },
    {
      id: 'questionsCount',
      header: 'Questions',
      cell: ({ row }) => (
        <Badge variant="outline" className="text-xs font-mono">
          {row.original.questions?.length ?? 0}
        </Badge>
      ),
    },
    {
      accessorKey: 'isActive',
      header: 'Statut',
      cell: ({ getValue }) => (
        <Badge variant={getValue<boolean>() ? 'success' : 'secondary'} className="text-xs">
          {getValue<boolean>() ? 'Active' : 'Inactive'}
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
                <AlertDialogDescription>
                  Toutes les questions de cette catégorie seront également supprimées. Action irréversible.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => deleteCategory(row.original.id)}
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
        title="Catégories de quiz"
        subtitle={`${categories.length} catégorie(s) dans la base de données`}
        action={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={load} className="gap-2">
              <RefreshCw className="w-4 h-4" />
            </Button>
            <Button onClick={openCreate} className="gap-2">
              <Plus className="w-4 h-4" /> Nouvelle catégorie
            </Button>
          </div>
        }
      />

      {/* Stats rapides */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border p-4">
          <p className="text-xs text-gray-500 mb-1">Total catégories</p>
          <p className="text-2xl font-bold text-gray-800">{categories.length}</p>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <p className="text-xs text-gray-500 mb-1">Actives</p>
          <p className="text-2xl font-bold text-emerald-600">{categories.filter(c => c.isActive).length}</p>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <p className="text-xs text-gray-500 mb-1">Liées à un module</p>
          <p className="text-2xl font-bold text-blue-600">{categories.filter(c => c.moduleId).length}</p>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <p className="text-xs text-gray-500 mb-1">Globales</p>
          <p className="text-2xl font-bold text-gray-600">{categories.filter(c => !c.moduleId).length}</p>
        </div>
      </div>

      {/* Categories grid preview */}
      {!loading && categories.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {categories.map(cat => (
            <div
              key={cat.id}
              className="bg-white rounded-xl border p-4 flex items-center gap-3 cursor-pointer hover:shadow-sm transition-shadow"
              onClick={() => openEdit(cat)}
            >
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center text-xl flex-shrink-0"
                style={{ backgroundColor: `${cat.color ?? '#1B4FD8'}20` }}
              >
                {cat.icon ?? '📋'}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate">{cat.title}</p>
                <p className="text-xs text-gray-400">{cat.questions?.length ?? 0} questions</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border p-4">
        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full rounded" />)}
          </div>
        ) : (
          <DataTable columns={columns} data={categories} searchPlaceholder="Rechercher une catégorie…" />
        )}
      </div>

      {/* Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <LayoutGrid className="w-5 h-5 text-blue-600" />
              {editingCategory ? 'Modifier la catégorie' : 'Nouvelle catégorie'}
            </DialogTitle>
            <DialogDescription>
              Une catégorie peut être globale ou liée à un module d&apos;apprentissage.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-1">
            <div>
              <Label className="text-sm font-semibold">Titre *</Label>
              <Input
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="Ex: Signalisation routière"
                className="mt-1"
              />
            </div>

            <div>
              <Label className="text-sm font-semibold">Description (optionnel)</Label>
              <Textarea
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Brève description de la catégorie…"
                className="mt-1"
              />
            </div>

            {/* Icône */}
            <div>
              <Label className="text-sm font-semibold">Icône</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {ICON_OPTIONS.map(icon => (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, icon }))}
                    className={`w-10 h-10 rounded-lg text-xl flex items-center justify-center border-2 transition-colors ${
                      form.icon === icon ? 'border-blue-600 bg-blue-50' : 'border-transparent bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    {icon}
                  </button>
                ))}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">ou</span>
                  <Input
                    value={form.icon}
                    onChange={e => setForm(f => ({ ...f, icon: e.target.value }))}
                    placeholder="URL ou emoji"
                    className="w-32 h-9 text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Couleur */}
            <div>
              <Label className="text-sm font-semibold">Couleur</Label>
              <div className="flex flex-wrap gap-2 mt-2 items-center">
                {COLOR_OPTIONS.map(color => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, color }))}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${
                      form.color === color ? 'border-gray-800 scale-110' : 'border-transparent hover:scale-105'
                    }`}
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
                <div className="flex items-center gap-2">
                  <Input
                    type="color"
                    value={form.color}
                    onChange={e => setForm(f => ({ ...f, color: e.target.value }))}
                    className="w-10 h-9 p-1 cursor-pointer"
                  />
                  <Input
                    value={form.color}
                    onChange={e => setForm(f => ({ ...f, color: e.target.value }))}
                    placeholder="#1B4FD8"
                    className="w-28 h-9 text-sm font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Module lié */}
            <div>
              <Label className="text-sm font-semibold">Module lié (optionnel)</Label>
              <p className="text-xs text-gray-400 mt-0.5 mb-1">
                Laisser vide pour une catégorie globale (exam blanc, etc.)
              </p>
              <Select value={form.moduleId || 'NONE'} onValueChange={val => setForm(f => ({ ...f, moduleId: val === 'NONE' ? '' : val }))}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Aucun module (global)" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="NONE">— Aucun (catégorie globale)</SelectItem>
                  {modules.map(m => <SelectItem key={m.id} value={m.id}>{m.icon} {m.title}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-semibold">Ordre d&apos;affichage</Label>
                <Input
                  type="number"
                  value={form.order}
                  onChange={e => setForm(f => ({ ...f, order: parseInt(e.target.value) || 0 }))}
                  className="mt-1"
                  min={0}
                />
              </div>
              <div className="flex flex-col">
                <Label className="text-sm font-semibold mb-3">Statut</Label>
                <div className="flex items-center gap-3 mt-1">
                  <Switch
                    checked={form.isActive}
                    onCheckedChange={v => setForm(f => ({ ...f, isActive: v }))}
                  />
                  <span className="text-sm text-gray-600">
                    {form.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>

            {/* Preview */}
            <div>
              <Label className="text-sm font-semibold">Aperçu</Label>
              <div className="mt-2 flex items-center gap-3 p-4 rounded-xl border bg-gray-50">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                  style={{ backgroundColor: `${form.color}20` }}
                >
                  {form.icon}
                </div>
                <div>
                  <p className="font-semibold text-gray-800">{form.title || 'Titre de la catégorie'}</p>
                  <p className="text-xs text-gray-400">{form.description || 'Description…'}</p>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Annuler</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Sauvegarde…' : editingCategory ? 'Sauvegarder' : 'Créer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
