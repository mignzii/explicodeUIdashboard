'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Plus, Pencil, Trash2, Quote, Eye, FileEdit, Upload } from 'lucide-react'
import { ColumnDef } from '@tanstack/react-table'
import { PageHeader } from '@/components/shared/page-header'
import { StatsCard } from '@/components/shared/stats-card'
import { DataTable } from '@/components/shared/data-table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Thought, thoughtsApi } from '@/lib/thoughtsApi'
import {
  CAPTION_MAX, DEFAULT_FORM, PHOTO_MAX_BYTES, TEXT_MAX, THOUGHT_BACKGROUNDS, THOUGHT_DURATIONS,
  ThoughtForm, disappearsLabel, expiryLabel, formFromThought, nextPublished, statusOf, toPayload, toUpdatePayload, validateThought,
} from '@/lib/thoughtsForm'
import { ThoughtPhonePreview } from '@/components/thoughts/thought-phone-preview'
import toast from 'react-hot-toast'

function Thumb({ t }: { t: Thought }) {
  if (t.kind === 'photo' && t.imageUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={t.imageUrl} alt="" className="w-10 h-14 rounded-lg object-cover flex-shrink-0" />
  }
  const style = THOUGHT_BACKGROUNDS.find(b => b.value === t.background) ?? THOUGHT_BACKGROUNDS[0]
  return (
    <div
      className="w-10 h-14 rounded-lg flex items-center justify-center flex-shrink-0 border"
      style={{ background: style.bg, color: style.accent }}
    >
      <Quote className="w-4 h-4" />
    </div>
  )
}

export default function ThoughtsPage() {
  const [items, setItems] = useState<Thought[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Thought | null>(null)
  const [form, setForm] = useState<ThoughtForm>(DEFAULT_FORM)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const now = new Date()

  const load = useCallback(async () => {
    try {
      setItems(await thoughtsApi.list())
    } catch {
      toast.error('Erreur de chargement des pensées')
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

  const openEdit = (t: Thought) => {
    setEditing(t)
    setForm(formFromThought(t))
    setModalOpen(true)
  }

  const handlePhoto = async (file: File | undefined) => {
    if (!file) return
    if (file.size > PHOTO_MAX_BYTES) {
      toast.error('La photo dépasse 5 Mo')
      return
    }
    setUploading(true)
    try {
      const { url } = await thoughtsApi.uploadImage(file)
      setForm(f => ({ ...f, imageUrl: url }))
    } catch {
      toast.error('Envoi de la photo impossible')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const handleSave = async () => {
    const error = validateThought(form)
    if (error) {
      toast.error(error)
      return
    }
    setSaving(true)
    try {
      if (editing) {
        const updated = await thoughtsApi.update(editing.id, toUpdatePayload(form))
        setItems(prev => prev.map(i => (i.id === editing.id ? updated : i)))
        toast.success('Pensée mise à jour')
      } else {
        const created = await thoughtsApi.create(toPayload(form))
        setItems(prev => [created, ...prev])
        toast.success(created.isPublished ? 'Pensée publiée dans l’app' : 'Brouillon enregistré')
      }
      setModalOpen(false)
    } catch {
      toast.error('Erreur lors de l’enregistrement')
    } finally {
      setSaving(false)
    }
  }

  const togglePublished = async (t: Thought) => {
    try {
      const updated = await thoughtsApi.update(t.id, { isPublished: nextPublished(statusOf(t, new Date())) })
      setItems(prev => prev.map(i => (i.id === t.id ? updated : i)))
      toast.success(updated.isPublished ? 'Pensée publiée dans l’app' : 'Pensée retirée de l’app')
    } catch {
      toast.error('Erreur lors de la mise à jour')
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await thoughtsApi.delete(id)
      setItems(prev => prev.filter(i => i.id !== id))
      toast.success('Pensée supprimée')
    } catch {
      toast.error('Erreur lors de la suppression')
    }
  }

  const visible = items.filter(i => statusOf(i, now) === 'visible').length
  const drafts = items.filter(i => statusOf(i, now) === 'draft').length

  const columns: ColumnDef<Thought>[] = [
    {
      id: 'content',
      header: 'Pensée',
      cell: ({ row }) => (
        <div className="flex items-center gap-3 max-w-md">
          <Thumb t={row.original} />
          <p className="font-medium text-sm line-clamp-2">
            {row.original.kind === 'photo' ? row.original.caption || 'Photo sans légende' : row.original.text}
          </p>
        </div>
      ),
    },
    {
      accessorKey: 'kind',
      header: 'Type',
      cell: ({ row }) => <Badge variant="gray">{row.original.kind === 'photo' ? 'Photo' : 'Texte'}</Badge>,
    },
    {
      accessorKey: 'durationHours',
      header: 'Visible pendant',
      cell: ({ row }) => (
        <span className="text-xs text-gray-500">
          {THOUGHT_DURATIONS.find(d => d.value === row.original.durationHours)?.label ?? `${row.original.durationHours} h`}
        </span>
      ),
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
      id: 'status',
      header: 'Dans l’app',
      cell: ({ row }) => {
        const status = statusOf(row.original, now)
        return (
          <div className="flex items-center gap-2">
            <Switch
              checked={status === 'visible'}
              onCheckedChange={() => togglePublished(row.original)}
              aria-label="Visible dans l’app"
            />
            <div>
              <p className="text-xs text-gray-500">{status === 'visible' ? 'Visible' : expiryLabel(row.original, now)}</p>
              {status === 'visible' && <p className="text-xs text-gray-400">{expiryLabel(row.original, now)}</p>}
            </div>
          </div>
        )
      },
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
                <AlertDialogTitle>Supprimer la pensée</AlertDialogTitle>
                <AlertDialogDescription>Elle disparaîtra de l’app et de cette liste.</AlertDialogDescription>
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

  const pill = (active: boolean) =>
    `px-3 py-1.5 rounded-full border text-sm transition ${
      active ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-gray-700 hover:bg-gray-50'
    }`

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pensées"
        subtitle="Les pensées courtes affichées dans la bulle de l’accueil de l’app"
        action={
          <Button onClick={openCreate} className="gap-2">
            <Plus className="w-4 h-4" /> Nouvelle pensée
          </Button>
        }
      />

      <div className="grid grid-cols-3 gap-4">
        <StatsCard title="Visibles dans l’app" value={visible} icon={Eye} color="green" />
        <StatsCard title="Brouillons" value={drafts} icon={FileEdit} color="amber" />
        <StatsCard title="Total" value={items.length} icon={Quote} color="blue" />
      </div>

      <div className="bg-white rounded-xl border p-4">
        {loading ? (
          <div className="py-16 text-center text-gray-400 text-sm">Chargement...</div>
        ) : (
          <DataTable columns={columns} data={items} searchPlaceholder="Rechercher une pensée..." />
        )}
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Modifier la pensée' : 'Nouvelle pensée'}</DialogTitle>
            <DialogDescription>
              Écris simplement : chaque pensée est lue en quelques secondes sur un téléphone.
            </DialogDescription>
          </DialogHeader>

          <div className="flex gap-8">
            <div className="flex-1 min-w-0 space-y-4">
              <div>
                <Label>Type</Label>
                <div className="mt-1 flex gap-2">
                  {(['text', 'photo'] as const).map(k => (
                    <button
                      key={k}
                      type="button"
                      disabled={!!editing}
                      onClick={() => setForm(f => ({ ...f, kind: k }))}
                      className={`${pill(form.kind === k)} disabled:opacity-60`}
                    >
                      {k === 'text' ? 'Texte' : 'Photo'}
                    </button>
                  ))}
                </div>
              </div>

              {form.kind === 'text' ? (
                <>
                  <div>
                    <Label>Ta pensée * <span className="text-gray-400 font-normal">({form.text.length}/{TEXT_MAX})</span></Label>
                    <Textarea
                      value={form.text}
                      maxLength={TEXT_MAX}
                      rows={4}
                      onChange={e => setForm(f => ({ ...f, text: e.target.value }))}
                      className="mt-1"
                    />
                    <p className="mt-1 text-xs text-gray-400">Une ou deux phrases : elle s’affiche en grand sur le téléphone.</p>
                  </div>
                  <div>
                    <Label>Fond</Label>
                    <div className="mt-2 flex gap-4">
                      {THOUGHT_BACKGROUNDS.map(b => (
                        <button
                          key={b.value}
                          type="button"
                          onClick={() => setForm(f => ({ ...f, background: b.value }))}
                          className="flex flex-col items-center gap-2"
                          aria-pressed={form.background === b.value}
                        >
                          <span
                            className={`w-11 h-11 rounded-full border ${form.background === b.value ? 'ring-2 ring-offset-2 ring-blue-600' : ''}`}
                            style={{ background: b.bg }}
                          />
                          <span className="text-xs text-gray-600">{b.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <Label>Photo *</Label>
                    <div className="mt-1 flex items-center gap-3 rounded-lg border p-2.5">
                      {form.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={form.imageUrl} alt="" className="w-[60px] h-20 rounded-lg object-cover" />
                      ) : (
                        <div className="w-[60px] h-20 rounded-lg bg-gray-100" />
                      )}
                      <div className="flex-1">
                        <Button type="button" variant="outline" size="sm" className="gap-1.5" disabled={uploading} onClick={() => fileRef.current?.click()}>
                          <Upload className="w-3.5 h-3.5" /> {uploading ? 'Envoi...' : form.imageUrl ? 'Changer' : 'Choisir une photo'}
                        </Button>
                        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={e => handlePhoto(e.target.files?.[0])} />
                      </div>
                    </div>
                    <p className="mt-1 text-xs text-gray-400">Format vertical conseillé. JPG, PNG ou WebP, 5 Mo maximum.</p>
                  </div>
                  <div>
                    <Label>Légende <span className="text-gray-400 font-normal">(facultative, {form.caption.length}/{CAPTION_MAX})</span></Label>
                    <Input
                      value={form.caption}
                      maxLength={CAPTION_MAX}
                      onChange={e => setForm(f => ({ ...f, caption: e.target.value }))}
                      className="mt-1"
                    />
                  </div>
                </>
              )}

              <div>
                <Label>Visible pendant</Label>
                <div className="mt-1 flex gap-2">
                  {THOUGHT_DURATIONS.map(d => (
                    <button key={d.value} type="button" onClick={() => setForm(f => ({ ...f, durationHours: d.value }))} className={pill(form.durationHours === d.value)}>
                      {d.label}
                    </button>
                  ))}
                </div>
                <p className="mt-1 text-xs text-gray-400">
                  {form.isPublished
                    ? `Elle disparaît de l’app le ${disappearsLabel(form, editing, new Date())}.`
                    : 'La durée court à partir de la publication.'}
                </p>
              </div>

              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="text-sm font-medium">Publier dans l’app</p>
                  <p className="text-xs text-gray-400">Sinon, la pensée reste en brouillon.</p>
                </div>
                <Switch checked={form.isPublished} onCheckedChange={v => setForm(f => ({ ...f, isPublished: v }))} />
              </div>
            </div>

            <div className="w-[234px] flex-shrink-0">
              <p className="text-sm font-medium mb-2">Aperçu dans l’app</p>
              <ThoughtPhonePreview form={form} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Annuler</Button>
            <Button onClick={handleSave} disabled={saving || uploading}>
              {saving ? 'Enregistrement...' : form.isPublished ? 'Publier' : 'Enregistrer le brouillon'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
