'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Plus, Pencil, Trash2, Megaphone, Eye, FileEdit } from 'lucide-react'
import { ColumnDef } from '@tanstack/react-table'
import { PageHeader } from '@/components/shared/page-header'
import { StatsCard } from '@/components/shared/stats-card'
import { DataTable } from '@/components/shared/data-table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Announcement, AnnouncementCategory, AnnouncementPayload, announcementsApi } from '@/lib/announcementsApi'
import toast from 'react-hot-toast'

const CATEGORIES: { value: AnnouncementCategory; label: string; variant: 'success' | 'warning' | 'gray' }[] = [
  { value: 'examen', label: 'Examen', variant: 'success' },
  { value: 'reglementation', label: 'Réglementation', variant: 'warning' },
  { value: 'pratique', label: 'Pratique', variant: 'gray' },
]

const categoryOf = (value: AnnouncementCategory) => CATEGORIES.find(c => c.value === value) ?? CATEGORIES[2]

const DEFAULT_FORM: AnnouncementPayload = { title: '', summary: '', body: '', category: 'examen', isPublished: false }

export default function AnnouncementsPage() {
  const [items, setItems] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Announcement | null>(null)
  const [form, setForm] = useState<AnnouncementPayload>(DEFAULT_FORM)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    try {
      setItems(await announcementsApi.list())
    } catch {
      toast.error('Erreur de chargement des annonces')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const openCreate = () => {
    setEditing(null)
    setForm(DEFAULT_FORM)
    setModalOpen(true)
  }

  const openEdit = (a: Announcement) => {
    setEditing(a)
    setForm({ title: a.title, summary: a.summary, body: a.body, category: a.category, isPublished: a.isPublished })
    setModalOpen(true)
  }

  const handleSave = async () => {
    if (form.title.trim().length < 3 || form.summary.trim().length < 3 || form.body.trim().length < 3) {
      toast.error('Le titre, le résumé et le texte sont requis')
      return
    }
    setSaving(true)
    const payload = { ...form, title: form.title.trim(), summary: form.summary.trim(), body: form.body.trim() }
    try {
      if (editing) {
        const updated = await announcementsApi.update(editing.id, payload)
        setItems(prev => prev.map(i => (i.id === editing.id ? updated : i)))
        toast.success('Annonce mise à jour')
      } else {
        const created = await announcementsApi.create(payload)
        setItems(prev => [created, ...prev])
        toast.success(created.isPublished ? 'Annonce publiée dans l’app' : 'Brouillon enregistré')
      }
      setModalOpen(false)
    } catch {
      toast.error('Erreur lors de l’enregistrement')
    } finally {
      setSaving(false)
    }
  }

  const togglePublished = async (a: Announcement) => {
    try {
      const updated = await announcementsApi.update(a.id, { isPublished: !a.isPublished })
      setItems(prev => prev.map(i => (i.id === a.id ? updated : i)))
      toast.success(updated.isPublished ? 'Annonce publiée dans l’app' : 'Annonce retirée de l’app')
    } catch {
      toast.error('Erreur lors de la mise à jour')
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await announcementsApi.delete(id)
      setItems(prev => prev.filter(i => i.id !== id))
      toast.success('Annonce supprimée')
    } catch {
      toast.error('Erreur lors de la suppression')
    }
  }

  const published = items.filter(i => i.isPublished).length

  const columns: ColumnDef<Announcement>[] = [
    {
      accessorKey: 'title',
      header: 'Annonce',
      cell: ({ row }) => (
        <div className="max-w-md">
          <p className="font-medium text-sm">{row.original.title}</p>
          <p className="text-xs text-gray-400 truncate">{row.original.summary}</p>
        </div>
      ),
    },
    {
      accessorKey: 'category',
      header: 'Catégorie',
      cell: ({ row }) => {
        const c = categoryOf(row.original.category)
        return <Badge variant={c.variant}>{c.label}</Badge>
      },
    },
    {
      accessorKey: 'publishedAt',
      header: 'Publiée le',
      cell: ({ getValue }) => {
        const v = getValue<string | null>()
        return <span className="text-xs text-gray-500">{v ? new Date(v).toLocaleDateString('fr-SN') : '—'}</span>
      },
    },
    {
      accessorKey: 'isPublished',
      header: 'Dans l’app',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Switch checked={row.original.isPublished} onCheckedChange={() => togglePublished(row.original)} />
          <span className="text-xs text-gray-500">{row.original.isPublished ? 'Visible' : 'Brouillon'}</span>
        </div>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex gap-1">
          <Button variant="ghost" size="icon-sm" onClick={() => openEdit(row.original)} title="Modifier">
            <Pencil className="w-3.5 h-3.5" />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon-sm" className="text-red-400 hover:text-red-600" title="Supprimer">
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Supprimer l&apos;annonce</AlertDialogTitle>
                <AlertDialogDescription>
                  Supprimer &quot;{row.original.title}&quot; ? Elle disparaîtra de l&apos;app.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction onClick={() => handleDelete(row.original.id)} className="bg-red-600 hover:bg-red-700">
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
        title="Annonces"
        subtitle="Les nouvelles affichées dans l’app : dates d’examen, règles, conseils"
        action={
          <Button onClick={openCreate} className="gap-2">
            <Plus className="w-4 h-4" /> Nouvelle annonce
          </Button>
        }
      />

      <div className="grid grid-cols-3 gap-4">
        <StatsCard title="Visibles dans l’app" value={published} icon={Eye} color="green" />
        <StatsCard title="Brouillons" value={items.length - published} icon={FileEdit} color="amber" />
        <StatsCard title="Total" value={items.length} icon={Megaphone} color="blue" />
      </div>

      <div className="bg-white rounded-xl border p-4">
        {loading ? (
          <div className="py-16 text-center text-gray-400 text-sm">Chargement...</div>
        ) : (
          <DataTable columns={columns} data={items} searchPlaceholder="Rechercher une annonce..." />
        )}
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Modifier l’annonce' : 'Nouvelle annonce'}</DialogTitle>
            <DialogDescription>
              Écris simplement : l’annonce est lue par des apprenants, parfois peu à l’aise avec l’écrit.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Catégorie</Label>
              <div className="mt-1 flex gap-2">
                {CATEGORIES.map(c => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, category: c.value }))}
                    className={`px-3 py-1.5 rounded-full border text-sm transition ${
                      form.category === c.value ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label>Titre * <span className="text-gray-400 font-normal">({form.title.length}/160)</span></Label>
              <Input
                value={form.title}
                maxLength={160}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                className="mt-1"
                placeholder="Ex : Inscriptions ouvertes pour la session d’octobre"
              />
            </div>
            <div>
              <Label>Résumé * <span className="text-gray-400 font-normal">({form.summary.length}/300, affiché sur la carte)</span></Label>
              <Textarea
                value={form.summary}
                maxLength={300}
                onChange={e => setForm(f => ({ ...f, summary: e.target.value }))}
                className="mt-1"
                rows={2}
                placeholder="Une ou deux phrases qui donnent l’essentiel."
              />
            </div>
            <div>
              <Label>Texte complet * <span className="text-gray-400 font-normal">(affiché dans « Lire la suite »)</span></Label>
              <Textarea
                value={form.body}
                onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
                className="mt-1"
                rows={7}
                placeholder="Les détails : dates, lieux, pièces à apporter…"
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium">Publier dans l’app</p>
                <p className="text-xs text-gray-400">Sinon, l’annonce reste en brouillon.</p>
              </div>
              <Switch checked={form.isPublished} onCheckedChange={v => setForm(f => ({ ...f, isPublished: v }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Annuler</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Enregistrement...' : form.isPublished ? 'Publier' : 'Enregistrer le brouillon'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
