'use client'

import React, { useEffect, useState } from 'react'
import { Loader2, Plus, X } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Book, shopApi } from '@/lib/shopApi'
import { uploadsApi } from '@/lib/learningApi'
import toast from 'react-hot-toast'

interface BookForm {
  title: string
  shortTitle: string
  edition: string
  description: string
  price: string
  highlights: string[]
  imageUrl: string
  orderPhone: string
  orderPhoneLabel: string
  isActive: boolean
}

const toForm = (b: Book): BookForm => ({
  title: b.title,
  shortTitle: b.shortTitle,
  edition: b.edition,
  description: b.description,
  price: String(b.priceXof),
  highlights: b.highlights,
  imageUrl: b.imageUrl ?? '',
  orderPhone: b.orderPhone,
  orderPhoneLabel: b.orderPhoneLabel,
  isActive: b.isActive,
})

const formatPrice = (n: number) => `${n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} FCFA`

export default function ShopPage() {
  const [form, setForm] = useState<BookForm | null>(null)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    shopApi.get().then(b => setForm(toForm(b))).catch(() => toast.error('Impossible de charger le livre'))
  }, [])

  if (!form) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-gray-400" /></div>
  }

  const set = <K extends keyof BookForm>(key: K, value: BookForm[K]) => setForm(f => (f ? { ...f, [key]: value } : f))

  const handleImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setUploading(true)
    try {
      const { url } = await uploadsApi.lessonImage(file)
      set('imageUrl', url)
      toast.success('Couverture envoyée — pensez à enregistrer')
    } catch {
      toast.error("Échec de l'envoi (JPEG, PNG, WebP ou GIF, 5 Mo max)")
    } finally {
      setUploading(false)
    }
  }

  const save = async () => {
    const price = parseInt(form.price, 10)
    if (!form.title.trim() || !form.shortTitle.trim()) { toast.error('Les titres sont requis'); return }
    if (!Number.isFinite(price) || price < 0) { toast.error('Prix invalide'); return }
    const phone = form.orderPhone.replace(/\D/g, '')
    if (phone.length < 8) { toast.error('Numéro de commande invalide (format international, ex. 221762430964)'); return }
    setSaving(true)
    try {
      const updated = await shopApi.update({
        title: form.title.trim(),
        shortTitle: form.shortTitle.trim(),
        edition: form.edition.trim(),
        description: form.description.trim(),
        priceXof: price,
        highlights: form.highlights.map(h => h.trim()).filter(Boolean),
        // Chaîne vide = pas de couverture : null efface l'ancienne côté serveur.
        imageUrl: form.imageUrl.trim() || null,
        orderPhone: phone,
        orderPhoneLabel: form.orderPhoneLabel.trim(),
        isActive: form.isActive,
      })
      setForm(toForm(updated))
      toast.success('Boutique mise à jour — visible dans l’app dès sa prochaine ouverture')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erreur')
    } finally {
      setSaving(false)
    }
  }

  const price = parseInt(form.price, 10)

  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader title="Boutique" subtitle="Le livre officiel proposé dans l'app : fiche, prix et numéro de commande." />

      <div className="bg-white border rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold text-gray-900">Livre en vente</p>
            <p className="text-xs text-gray-400">Désactivé, il disparaît de l&apos;app : elle garde alors sa fiche intégrée.</p>
          </div>
          <Switch checked={form.isActive} onCheckedChange={v => set('isActive', v)} />
        </div>

        <div>
          <Label>Titre</Label>
          <Input className="mt-1" value={form.title} onChange={e => set('title', e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Titre court (commande)</Label>
            <Input className="mt-1" value={form.shortTitle} onChange={e => set('shortTitle', e.target.value)} />
          </div>
          <div>
            <Label>Édition</Label>
            <Input className="mt-1" value={form.edition} onChange={e => set('edition', e.target.value)} />
          </div>
        </div>
        <div>
          <Label>Description</Label>
          <Textarea className="mt-1" rows={3} value={form.description} onChange={e => set('description', e.target.value)} />
        </div>

        <div>
          <Label>Points forts</Label>
          <div className="mt-1 space-y-2">
            {form.highlights.map((h, i) => (
              <div key={i} className="flex gap-2">
                <Input value={h} onChange={e => set('highlights', form.highlights.map((x, j) => (j === i ? e.target.value : x)))} />
                <Button type="button" variant="ghost" size="icon-sm" onClick={() => set('highlights', form.highlights.filter((_, j) => j !== i))}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
            {form.highlights.length < 8 && (
              <Button type="button" variant="outline" size="sm" onClick={() => set('highlights', [...form.highlights, ''])}>
                <Plus className="w-3.5 h-3.5 mr-1" /> Ajouter un point
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white border rounded-xl p-5 space-y-4">
        <p className="font-semibold text-gray-900">Prix et commande</p>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <Label>Prix (FCFA)</Label>
            <Input className="mt-1" type="number" min={0} value={form.price} onChange={e => set('price', e.target.value)} />
            {Number.isFinite(price) && <p className="mt-1 text-xs text-gray-400">Affiché : {formatPrice(price)}</p>}
          </div>
          <div>
            <Label>N° de commande (international)</Label>
            <Input className="mt-1" value={form.orderPhone} onChange={e => set('orderPhone', e.target.value)} placeholder="221762430964" />
          </div>
          <div>
            <Label>N° affiché</Label>
            <Input className="mt-1" value={form.orderPhoneLabel} onChange={e => set('orderPhoneLabel', e.target.value)} placeholder="76 243 09 64" />
          </div>
        </div>
        <p className="text-xs text-gray-400">Les commandes arrivent sur ce numéro par WhatsApp, et le bouton « Appeler » compose le même.</p>
      </div>

      <div className="bg-white border rounded-xl p-5 space-y-3">
        <p className="font-semibold text-gray-900">Couverture</p>
        {form.imageUrl ? (
          <div className="relative w-40">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={form.imageUrl} alt="Couverture" className="rounded-lg w-40 h-52 object-cover border" />
            <Button type="button" variant="secondary" size="sm" className="absolute top-2 right-2" onClick={() => set('imageUrl', '')}>
              Retirer
            </Button>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center w-40 h-52 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50 text-center px-2">
            {uploading ? <Loader2 className="w-5 h-5 animate-spin text-gray-400" /> : <span className="text-xs text-gray-500">Cliquez pour choisir la couverture</span>}
            <input type="file" className="hidden" accept="image/jpeg,image/png,image/webp,image/gif" onChange={handleImage} disabled={uploading} />
          </label>
        )}
        <p className="text-xs text-gray-400">Sans couverture, l&apos;app dessine la sienne.</p>
      </div>

      <div className="flex justify-end">
        <Button onClick={save} disabled={saving}>
          {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Enregistrer
        </Button>
      </div>
    </div>
  )
}
