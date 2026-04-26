'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, Pencil, Trash2, Lock, Unlock, BookOpen, Loader2, Eye } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogFooter, DialogDescription
} from '@/components/ui/dialog'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from '@/components/ui/alert-dialog'
import { LearningModule, CreateModulePayload } from '@/types'
import { modulesApi } from '@/lib/learningApi'
import { ModulePreviewModal } from '@/components/ModulePreviewModal'
import toast from 'react-hot-toast'

interface ModuleForm {
  title: string
  icon: string
  color: string
  order: number
  isLocked: boolean
}

const DEFAULT_FORM: ModuleForm = {
  title: '',
  icon: '📚',
  color: '#1B4FD8',
  order: 1,
  isLocked: false,
}

const EMOJI_OPTIONS = ['📚', '🛣️', '🚦', '↗️', '🏙️', '🛤️', '⚖️', '🔧', '🛡️', '🚌', '🚛', '🚑', '🌱', '🎯', '💡', '🏆', '📋', '🔍']

export default function ModulesPage() {
  const [modules, setModules] = useState<LearningModule[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingModule, setEditingModule] = useState<LearningModule | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<ModuleForm>(DEFAULT_FORM)
  const [previewId, setPreviewId] = useState<string | null>(null)
  const previewMod = modules.find(m => m.id === previewId)

  useEffect(() => {
    loadModules()
  }, [])

  async function loadModules() {
    try {
      setLoading(true)
      const data = await modulesApi.list() as LearningModule[]
      setModules(data)
    } catch {
      toast.error('Impossible de charger les modules')
    } finally {
      setLoading(false)
    }
  }

  const openCreate = () => {
    setEditingModule(null)
    setForm({ ...DEFAULT_FORM, order: modules.length + 1 })
    setIsModalOpen(true)
  }

  const openEdit = (mod: LearningModule) => {
    setEditingModule(mod)
    setForm({ title: mod.title, icon: mod.icon, color: mod.color, order: mod.order, isLocked: mod.isLocked })
    setIsModalOpen(true)
  }

  const handleSave = async () => {
    if (!form.title.trim()) { toast.error('Le titre est requis'); return }
    setSaving(true)
    try {
      const payload: CreateModulePayload = form
      if (editingModule) {
        const updated = await modulesApi.update(editingModule.id, payload) as LearningModule
        setModules(prev => prev.map(m => m.id === editingModule.id ? updated : m))
        toast.success('Module mis à jour')
      } else {
        const created = await modulesApi.create(payload) as LearningModule
        setModules(prev => [...prev, created])
        toast.success('Module créé')
      }
      setIsModalOpen(false)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erreur')
    } finally {
      setSaving(false)
    }
  }

  const toggleLock = async (mod: LearningModule) => {
    try {
      const updated = await modulesApi.update(mod.id, { isLocked: !mod.isLocked }) as LearningModule
      setModules(prev => prev.map(m => m.id === mod.id ? updated : m))
      toast.success(`Module ${mod.isLocked ? 'déverrouillé' : 'verrouillé'}`)
    } catch { toast.error('Erreur lors du verrouillage') }
  }

  const deleteModule = async (id: string) => {
    try {
      await modulesApi.delete(id)
      setModules(prev => prev.filter(m => m.id !== id))
      toast.success('Module supprimé')
    } catch { toast.error('Erreur lors de la suppression') }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Modules de formation"
        subtitle={`${modules.length} modules disponibles`}
        action={
          <Button onClick={openCreate} className="gap-2">
            <Plus className="w-4 h-4" /> Nouveau module
          </Button>
        }
      />

      {modules.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-lg font-medium">Aucun module</p>
          <p className="text-sm mt-1">Créez votre premier module de formation</p>
          <Button onClick={openCreate} className="mt-4 gap-2">
            <Plus className="w-4 h-4" /> Créer un module
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...modules].sort((a, b) => a.order - b.order).map(mod => (
            <div key={mod.id} className="bg-white rounded-xl border shadow-sm hover:shadow-md transition-all">
              <div className="h-2 rounded-t-xl" style={{ backgroundColor: mod.color }} />
              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-3xl">{mod.icon}</span>
                    <p className="text-xs text-gray-400 font-medium">#{mod.order}</p>
                  </div>
                  {mod.isLocked && <Lock className="w-4 h-4 text-gray-400" />}
                </div>
                <h3 className="font-semibold text-gray-900 mb-1 text-sm leading-tight">{mod.title}</h3>
                <div className="flex items-center gap-2 mb-4 mt-2">
                  <BookOpen className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-xs text-gray-500">
                    {mod.categories?.length ?? 0} catégorie{(mod.categories?.length ?? 0) !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Link href={`/modules/${mod.id}`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full text-xs gap-1">
                      <BookOpen className="w-3 h-3" /> Contenu
                    </Button>
                  </Link>
                  <Button variant="ghost" size="icon-sm" title="Prévisualiser" onClick={() => setPreviewId(mod.id)}>
                    <Eye className="w-3.5 h-3.5 text-purple-500" />
                  </Button>
                  <Button variant="ghost" size="icon-sm" onClick={() => openEdit(mod)}>
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost" size="icon-sm"
                    onClick={() => toggleLock(mod)}
                    className={mod.isLocked ? 'text-amber-500' : 'text-gray-400'}
                  >
                    {mod.isLocked ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon-sm" className="text-red-400 hover:text-red-600">
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Supprimer le module</AlertDialogTitle>
                        <AlertDialogDescription>
                          Voulez-vous supprimer &quot;{mod.title}&quot; ? Toutes les catégories et leçons associées seront supprimées.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteModule(mod.id)} className="bg-red-600 hover:bg-red-700">
                          Supprimer
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Create/Edit */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingModule ? 'Modifier le module' : 'Nouveau module'}</DialogTitle>
            <DialogDescription>
              {editingModule ? 'Modifiez les informations du module' : 'Créez un nouveau module de formation'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Titre du module</Label>
              <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Ex: Signalisation" className="mt-1" />
            </div>
            <div>
              <Label>Icône</Label>
              <div className="mt-1 grid grid-cols-9 gap-1">
                {EMOJI_OPTIONS.map(emoji => (
                  <button key={emoji} type="button" onClick={() => setForm(f => ({ ...f, icon: emoji }))}
                    className={`text-xl p-1 rounded hover:bg-gray-100 ${form.icon === emoji ? 'bg-blue-100 ring-2 ring-blue-400' : ''}`}>
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label>Couleur</Label>
              <div className="mt-1 flex items-center gap-2">
                <input type="color" value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))} className="w-10 h-10 rounded cursor-pointer border" />
                <Input value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))} className="flex-1" placeholder="#1B4FD8" />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Label>Ordre d&apos;affichage</Label>
                <Input type="number" min={1} value={form.order} onChange={e => setForm(f => ({ ...f, order: parseInt(e.target.value) || 1 }))} className="mt-1" />
              </div>
              <div className="flex items-center gap-3 mt-5">
                <Switch checked={form.isLocked} onCheckedChange={val => setForm(f => ({ ...f, isLocked: val }))} />
                <Label className="flex items-center gap-1">
                  {form.isLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                  {form.isLocked ? 'Verrouillé' : 'Déverrouillé'}
                </Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)} disabled={saving}>Annuler</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editingModule ? 'Sauvegarder' : 'Créer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {previewMod && (
        <ModulePreviewModal
          moduleId={previewMod.id}
          moduleName={previewMod.title}
          moduleIcon={previewMod.icon ?? '📖'}
          moduleColor={previewMod.color}
          open={!!previewId}
          onClose={() => setPreviewId(null)}
        />
      )}
    </div>
  )
}
