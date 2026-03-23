'use client'

import React, { useState } from 'react'
import { Plus, Pencil, Trash2, Truck, Info } from 'lucide-react'
import { ColumnDef } from '@tanstack/react-table'
import { PageHeader } from '@/components/shared/page-header'
import { DataTable } from '@/components/shared/data-table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from '@/components/ui/alert-dialog'
import toast from 'react-hot-toast'

interface AdrCode {
  id: string
  code: string
  description: string
  details: string
  hazardClass?: string
}

// TODO: Replace with API call to /adr/kemler
const initialKemlerCodes: AdrCode[] = [
  { id: '1', code: '30', description: 'Liquide inflammable', details: 'Liquide inflammable (point d\'éclair entre 23°C et 60°C)', hazardClass: '3' },
  { id: '2', code: '33', description: 'Liquide très inflammable', details: 'Liquide très inflammable (point d\'éclair < 23°C)', hazardClass: '3' },
  { id: '3', code: '336', description: 'Liquide très inflammable et toxique', details: 'Liquide très inflammable et toxique', hazardClass: '3' },
  { id: '4', code: '44', description: 'Solide inflammable', details: 'Solide inflammable ou auto-réactif', hazardClass: '4.1' },
  { id: '5', code: '50', description: 'Comburant', details: 'Matière comburante (favorise l\'incendie)', hazardClass: '5.1' },
  { id: '6', code: '55', description: 'Matière fortement comburante', details: 'Matière fortement comburante ou peroxyde organique', hazardClass: '5.1' },
  { id: '7', code: '60', description: 'Matière toxique', details: 'Matière toxique ou légèrement toxique', hazardClass: '6.1' },
  { id: '8', code: '66', description: 'Matière très toxique', details: 'Matière très toxique', hazardClass: '6.1' },
  { id: '9', code: '80', description: 'Matière corrosive', details: 'Matière corrosive ou légèrement corrosive', hazardClass: '8' },
  { id: '10', code: '88', description: 'Matière très corrosive', details: 'Matière très corrosive', hazardClass: '8' },
  { id: '11', code: '22', description: 'Gaz réfrigéré non inflammable', details: 'Gaz réfrigéré, non inflammable, non toxique', hazardClass: '2' },
  { id: '12', code: '23', description: 'Gaz inflammable réfrigéré', details: 'Gaz réfrigéré inflammable', hazardClass: '2' },
]

// TODO: Replace with API call to /adr/onu
const initialOnuCodes: AdrCode[] = [
  { id: '1', code: '1203', description: 'Essence', details: 'Carburant pour moteurs à allumage (essence)', hazardClass: '3' },
  { id: '2', code: '1202', description: 'Gasoil / Diesel', details: 'Gasoil, diesel ou huile de chauffe légère', hazardClass: '3' },
  { id: '3', code: '1075', description: 'Gaz de pétrole liquéfié', details: 'GPL — mélange propane/butane', hazardClass: '2' },
  { id: '4', code: '1072', description: 'Oxygène comprimé', details: 'Oxygène comprimé, non liquéfié', hazardClass: '2' },
  { id: '5', code: '1005', description: 'Ammoniac anhydre', details: 'Ammoniac anhydre, liquéfié', hazardClass: '2' },
  { id: '6', code: '1017', description: 'Chlore', details: 'Chlore liquéfié sous pression', hazardClass: '2' },
  { id: '7', code: '1230', description: 'Méthanol', details: 'Méthanol (alcool méthylique)', hazardClass: '3' },
  { id: '8', code: '1789', description: 'Acide chlorhydrique', details: 'Acide chlorhydrique en solution aqueuse', hazardClass: '8' },
  { id: '9', code: '1824', description: 'Soude caustique', details: 'Solution de soude caustique', hazardClass: '8' },
  { id: '10', code: '2794', description: 'Batteries au plomb', details: 'Accumulateurs électriques, remplis d\'électrolyte acide', hazardClass: '8' },
]

function AdrTable({ codes, onEdit, onDelete }: { codes: AdrCode[], onEdit: (c: AdrCode) => void, onDelete: (id: string) => void }) {
  const columns: ColumnDef<AdrCode>[] = [
    {
      accessorKey: 'code',
      header: 'Code',
      cell: ({ row }) => (
        <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-1 rounded">{row.original.code}</span>
      ),
    },
    {
      accessorKey: 'description',
      header: 'Description',
      cell: ({ row }) => <span className="font-medium text-gray-900">{row.original.description}</span>,
    },
    {
      accessorKey: 'details',
      header: 'Détails',
      cell: ({ row }) => <span className="text-sm text-gray-600">{row.original.details}</span>,
    },
    {
      accessorKey: 'hazardClass',
      header: 'Classe',
      cell: ({ row }) => row.original.hazardClass ? (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700 border border-orange-200">
          Classe {row.original.hazardClass}
        </span>
      ) : null,
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex items-center gap-1 justify-end">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(row.original)}>
            <Pencil className="w-4 h-4" />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50">
                <Trash2 className="w-4 h-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Supprimer ce code ?</AlertDialogTitle>
                <AlertDialogDescription>Le code ADR {row.original.code} sera supprimé du cache Redis.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={() => onDelete(row.original.id)}>Supprimer</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      ),
    },
  ]
  return <DataTable columns={columns} data={codes} searchPlaceholder="Rechercher un code..." />
}

export default function AdrPage() {
  const [kemlerCodes, setKemlerCodes] = useState<AdrCode[]>(initialKemlerCodes)
  const [onuCodes, setOnuCodes] = useState<AdrCode[]>(initialOnuCodes)
  const [editingCode, setEditingCode] = useState<AdrCode | null>(null)
  const [activeTab, setActiveTab] = useState<'kemler' | 'onu'>('kemler')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [form, setForm] = useState({ code: '', description: '', details: '', hazardClass: '' })

  const openAdd = () => {
    setEditingCode(null)
    setForm({ code: '', description: '', details: '', hazardClass: '' })
    setIsModalOpen(true)
  }

  const openEdit = (code: AdrCode) => {
    setEditingCode(code)
    setForm({ code: code.code, description: code.description, details: code.details, hazardClass: code.hazardClass || '' })
    setIsModalOpen(true)
  }

  const handleSave = () => {
    if (!form.code || !form.description) { toast.error('Code et description obligatoires'); return }
    const setter = activeTab === 'kemler' ? setKemlerCodes : setOnuCodes
    if (editingCode) {
      setter(prev => prev.map(c => c.id === editingCode.id ? { ...c, ...form } : c))
      toast.success('Code mis à jour')
    } else {
      setter(prev => [...prev, { id: Date.now().toString(), ...form }])
      toast.success('Code ajouté — pensez à redémarrer le service pour recharger le cache Redis')
    }
    setIsModalOpen(false)
  }

  const handleDelete = (id: string, tab: 'kemler' | 'onu') => {
    const setter = tab === 'kemler' ? setKemlerCodes : setOnuCodes
    setter(prev => prev.filter(c => c.id !== id))
    toast.success('Code supprimé')
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Codes ADR"
        subtitle="Gestion des codes Kemler et ONU pour le transport de matières dangereuses"
        action={<Button onClick={openAdd}><Plus className="w-4 h-4 mr-2" /> Nouveau code</Button>}
      />

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-blue-800">Cache Redis</p>
          <p className="text-sm text-blue-700 mt-0.5">
            Ces données sont pré-chargées en cache Redis au démarrage de l&apos;API via <code className="bg-blue-100 px-1 rounded font-mono text-xs">OnModuleInit</code>. 
            Toute modification sera effective au prochain redémarrage du service.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
            <Truck className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{kemlerCodes.length}</p>
            <p className="text-sm text-gray-500">Codes Kemler</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
            <Truck className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{onuCodes.length}</p>
            <p className="text-sm text-gray-500">Codes ONU</p>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'kemler' | 'onu')}>
        <TabsList className="bg-white border border-gray-200">
          <TabsTrigger value="kemler" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            Codes Kemler ({kemlerCodes.length})
          </TabsTrigger>
          <TabsTrigger value="onu" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            Codes ONU ({onuCodes.length})
          </TabsTrigger>
        </TabsList>
        <TabsContent value="kemler">
          <AdrTable codes={kemlerCodes} onEdit={openEdit} onDelete={(id) => handleDelete(id, 'kemler')} />
        </TabsContent>
        <TabsContent value="onu">
          <AdrTable codes={onuCodes} onEdit={openEdit} onDelete={(id) => handleDelete(id, 'onu')} />
        </TabsContent>
      </Tabs>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingCode ? 'Modifier le code ADR' : 'Nouveau code ADR'}</DialogTitle>
            <DialogDescription>
              {activeTab === 'kemler' ? 'Code Kemler — identification du danger' : 'Code ONU — identification de la matière'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Code *</Label>
                <Input placeholder="Ex: 33" value={form.code} onChange={e => setForm(p => ({ ...p, code: e.target.value }))} className="font-mono" />
              </div>
              <div className="space-y-1.5">
                <Label>Classe de danger</Label>
                <Input placeholder="Ex: 3" value={form.hazardClass} onChange={e => setForm(p => ({ ...p, hazardClass: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Description *</Label>
              <Input placeholder="Ex: Liquide très inflammable" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Détails</Label>
              <Textarea placeholder="Description complète..." value={form.details} onChange={e => setForm(p => ({ ...p, details: e.target.value }))} rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Annuler</Button>
            <Button onClick={handleSave}>{editingCode ? 'Enregistrer' : 'Ajouter'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
