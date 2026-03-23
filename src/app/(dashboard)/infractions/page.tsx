'use client'

import React, { useState } from 'react'
import { Plus, Pencil, Trash2, ShieldAlert } from 'lucide-react'
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
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from '@/components/ui/alert-dialog'
import { Infraction } from '@/types'
import toast from 'react-hot-toast'
import { formatCurrency } from '@/lib/utils'

// TODO: Replace with API call to /infractions
const initialInfractions: Infraction[] = [
  { id: '1', code: 'INF-001', title: 'Excès de vitesse en agglomération', severity: 'MEDIUM', fine: 25000, points: 2, description: 'Dépassement de la vitesse limite en zone urbaine' },
  { id: '2', code: 'INF-002', title: 'Grillage de feu rouge', severity: 'HIGH', fine: 50000, points: 4, description: 'Franchissement d\'un feu rouge ou orange' },
  { id: '3', code: 'INF-003', title: 'Non-port de la ceinture', severity: 'LOW', fine: 15000, points: 1, description: 'Absence de ceinture de sécurité conducteur ou passager' },
  { id: '4', code: 'INF-004', title: 'Usage du téléphone au volant', severity: 'MEDIUM', fine: 30000, points: 2, description: 'Utilisation d\'un téléphone portable sans kit mains-libres' },
  { id: '5', code: 'INF-005', title: 'Conduite sous l\'emprise de l\'alcool', severity: 'HIGH', fine: 100000, points: 6, description: 'Taux d\'alcoolémie supérieur au seuil légal' },
  { id: '6', code: 'INF-006', title: 'Stationnement interdit', severity: 'LOW', fine: 10000, points: 0, description: 'Arrêt ou stationnement dans une zone interdite' },
  { id: '7', code: 'INF-007', title: 'Non-respect de la priorité', severity: 'HIGH', fine: 40000, points: 3, description: 'Refus de priorité à une intersection' },
  { id: '8', code: 'INF-008', title: 'Défaut de clignotant', severity: 'LOW', fine: 8000, points: 1, description: 'Non utilisation des clignotants lors d\'un changement de direction' },
  { id: '9', code: 'INF-009', title: 'Surcharge du véhicule', severity: 'MEDIUM', fine: 35000, points: 2, description: 'Chargement dépassant la charge autorisée du véhicule' },
  { id: '10', code: 'INF-010', title: 'Défaut de contrôle technique', severity: 'MEDIUM', fine: 20000, points: 0, description: 'Véhicule sans visite technique valide' },
  { id: '11', code: 'INF-011', title: 'Conduite sans permis', severity: 'HIGH', fine: 150000, points: 8, description: 'Conduite d\'un véhicule sans permis valide' },
  { id: '12', code: 'INF-012', title: 'Refus d\'obtempérer', severity: 'HIGH', fine: 75000, points: 5, description: 'Refus d\'obtempérer à une injonction des forces de l\'ordre' },
]

const severityConfig = {
  LOW: { label: 'Faible', variant: 'success' as const, bg: 'bg-emerald-50' },
  MEDIUM: { label: 'Moyen', variant: 'warning' as const, bg: 'bg-amber-50' },
  HIGH: { label: 'Élevé', variant: 'destructive' as const, bg: 'bg-red-50' },
}

interface InfractionForm {
  code: string
  title: string
  severity: 'LOW' | 'MEDIUM' | 'HIGH'
  fine: number
  points: number
  description: string
  legalRef: string
}

const DEFAULT_FORM: InfractionForm = {
  code: '', title: '', severity: 'LOW', fine: 0, points: 0, description: '', legalRef: ''
}

export default function InfractionsPage() {
  const [infractions, setInfractions] = useState<Infraction[]>(initialInfractions)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<Infraction | null>(null)
  const [form, setForm] = useState<InfractionForm>(DEFAULT_FORM)
  const [severityFilter, setSeverityFilter] = useState('ALL')

  const filtered = infractions.filter(i =>
    severityFilter === 'ALL' || i.severity === severityFilter
  )

  const openCreate = () => {
    setEditingItem(null)
    setForm({ ...DEFAULT_FORM, code: `INF-${String(infractions.length + 1).padStart(3, '0')}` })
    setIsModalOpen(true)
  }

  const openEdit = (item: Infraction) => {
    setEditingItem(item)
    setForm({
      code: item.code,
      title: item.title,
      severity: item.severity,
      fine: item.fine,
      points: item.points,
      description: item.description || '',
      legalRef: item.legalRef || '',
    })
    setIsModalOpen(true)
  }

  const handleSave = () => {
    if (!form.title.trim() || !form.code.trim()) {
      toast.error('Le code et le titre sont requis')
      return
    }
    if (editingItem) {
      setInfractions(prev => prev.map(i => i.id === editingItem.id ? { ...i, ...form } : i))
      toast.success('Infraction mise à jour')
    } else {
      const newItem: Infraction = { id: String(Date.now()), ...form }
      setInfractions(prev => [...prev, newItem])
      toast.success('Infraction créée')
    }
    setIsModalOpen(false)
  }

  const deleteItem = (id: string) => {
    setInfractions(prev => prev.filter(i => i.id !== id))
    toast.success('Infraction supprimée')
  }

  const columns: ColumnDef<Infraction>[] = [
    {
      accessorKey: 'code',
      header: 'Code',
      cell: ({ getValue }) => (
        <span className="font-mono text-xs font-bold bg-gray-100 px-2 py-1 rounded">{getValue<string>()}</span>
      ),
    },
    {
      accessorKey: 'title',
      header: 'Titre',
      cell: ({ getValue }) => <span className="text-sm font-medium">{getValue<string>()}</span>,
    },
    {
      accessorKey: 'severity',
      header: 'Gravité',
      cell: ({ getValue }) => {
        const s = getValue<'LOW' | 'MEDIUM' | 'HIGH'>()
        const cfg = severityConfig[s]
        return <Badge variant={cfg.variant}>{cfg.label}</Badge>
      },
    },
    {
      accessorKey: 'fine',
      header: 'Amende',
      cell: ({ getValue }) => (
        <span className="text-sm font-semibold text-red-600">{formatCurrency(getValue<number>())}</span>
      ),
    },
    {
      accessorKey: 'points',
      header: 'Points',
      cell: ({ getValue }) => {
        const pts = getValue<number>()
        return (
          <span className={`text-sm font-bold ${pts > 0 ? 'text-orange-600' : 'text-gray-400'}`}>
            {pts > 0 ? `-${pts} pts` : '—'}
          </span>
        )
      },
    },
    {
      id: 'actions',
      header: 'Actions',
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
                <AlertDialogTitle>Supprimer l&apos;infraction</AlertDialogTitle>
                <AlertDialogDescription>Supprimer &quot;{row.original.title}&quot; ? Action irréversible.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction onClick={() => deleteItem(row.original.id)} className="bg-red-600 hover:bg-red-700">Supprimer</AlertDialogAction>
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
        title="Catalogue des infractions"
        subtitle={`${infractions.length} infractions référencées`}
        action={
          <Button onClick={openCreate} className="gap-2">
            <Plus className="w-4 h-4" /> Nouvelle infraction
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {Object.entries(severityConfig).map(([key, cfg]) => (
          <div key={key} className={`${cfg.bg} rounded-xl border p-4`}>
            <div className="flex items-center gap-3">
              <ShieldAlert className={`w-5 h-5 ${key === 'LOW' ? 'text-emerald-600' : key === 'MEDIUM' ? 'text-amber-600' : 'text-red-600'}`} />
              <div>
                <p className="font-bold text-lg">{infractions.filter(i => i.severity === key).length}</p>
                <p className="text-sm text-gray-500">Gravité {cfg.label.toLowerCase()}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="bg-white rounded-xl border p-4 flex gap-3">
        <Select value={severityFilter} onValueChange={setSeverityFilter}>
          <SelectTrigger className="w-40 h-9"><SelectValue placeholder="Gravité" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Toutes</SelectItem>
            <SelectItem value="LOW">Faible</SelectItem>
            <SelectItem value="MEDIUM">Moyen</SelectItem>
            <SelectItem value="HIGH">Élevé</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border p-4">
        <DataTable columns={columns} data={filtered} searchPlaceholder="Rechercher par code ou titre..." />
      </div>

      {/* Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Modifier l\'infraction' : 'Nouvelle infraction'}</DialogTitle>
            <DialogDescription>Remplissez les informations de l&apos;infraction</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Code *</Label>
                <Input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} className="mt-1" placeholder="INF-001" />
              </div>
              <div>
                <Label>Gravité</Label>
                <Select value={form.severity} onValueChange={val => setForm(f => ({ ...f, severity: val as InfractionForm['severity'] }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Faible</SelectItem>
                    <SelectItem value="MEDIUM">Moyen</SelectItem>
                    <SelectItem value="HIGH">Élevé</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Titre *</Label>
              <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="mt-1" placeholder="Ex: Excès de vitesse" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Amende (FCFA)</Label>
                <Input type="number" min={0} value={form.fine} onChange={e => setForm(f => ({ ...f, fine: parseInt(e.target.value) || 0 }))} className="mt-1" />
              </div>
              <div>
                <Label>Points retirés</Label>
                <Input type="number" min={0} max={12} value={form.points} onChange={e => setForm(f => ({ ...f, points: parseInt(e.target.value) || 0 }))} className="mt-1" />
              </div>
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="mt-1" placeholder="Description de l'infraction..." />
            </div>
            <div>
              <Label>Référence légale</Label>
              <Input value={form.legalRef} onChange={e => setForm(f => ({ ...f, legalRef: e.target.value }))} className="mt-1" placeholder="Ex: Art. 123 du Code de la route" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Annuler</Button>
            <Button onClick={handleSave}>{editingItem ? 'Sauvegarder' : 'Créer'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
