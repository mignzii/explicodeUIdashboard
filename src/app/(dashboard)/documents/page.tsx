'use client'

import React, { useState } from 'react'
import { FileText, AlertTriangle, CheckCircle, Clock, Eye, Trash2 } from 'lucide-react'
import { ColumnDef } from '@tanstack/react-table'
import { PageHeader } from '@/components/shared/page-header'
import { StatsCard } from '@/components/shared/stats-card'
import { DataTable } from '@/components/shared/data-table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from '@/components/ui/alert-dialog'
import { Document } from '@/types'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

// TODO: Replace with API call to /documents?admin=true
const initialDocuments: Document[] = [
  { id: '1', userId: 'u1', type: 'PERMIS_CONDUIRE', fileUrl: '#', expiryDate: '2027-06-15', status: 'OK', uploadedAt: '2024-01-10T09:00:00Z', user: { id: 'u1', phone: '+221 77 123 45 67', firstName: 'Mamadou', lastName: 'Diallo', region: 'Dakar', profileType: 'CHAUFFEUR', isActive: true, createdAt: '' } },
  { id: '2', userId: 'u2', type: 'ASSURANCE', fileUrl: '#', expiryDate: '2024-03-25', status: 'WARNING', uploadedAt: '2023-03-25T10:00:00Z', user: { id: 'u2', phone: '+221 76 234 56 78', firstName: 'Fatou', lastName: 'Sow', region: 'Thiès', profileType: 'CHAUFFEUR', isActive: true, createdAt: '' } },
  { id: '3', userId: 'u3', type: 'CARTE_GRISE', fileUrl: '#', expiryDate: '2023-12-01', status: 'EXPIRED', uploadedAt: '2022-12-01T08:00:00Z', user: { id: 'u3', phone: '+221 70 345 67 89', firstName: 'Ibrahima', lastName: 'Fall', region: 'Saint-Louis', profileType: 'CHAUFFEUR', isActive: true, createdAt: '' } },
  { id: '4', userId: 'u4', type: 'VISITE_TECHNIQUE', fileUrl: '#', expiryDate: '2024-04-10', status: 'WARNING', uploadedAt: '2023-04-10T11:00:00Z', user: { id: 'u4', phone: '+221 77 456 78 90', firstName: 'Aissatou', lastName: 'Ba', region: 'Dakar', profileType: 'CHAUFFEUR', isActive: true, createdAt: '' } },
  { id: '5', userId: 'u5', type: 'PERMIS_CONDUIRE', fileUrl: '#', expiryDate: '2028-09-20', status: 'OK', uploadedAt: '2024-02-15T14:00:00Z', user: { id: 'u5', phone: '+221 78 567 89 01', firstName: 'Ousmane', lastName: 'Ndiaye', region: 'Dakar', profileType: 'AGENT_ROUTIER', isActive: true, createdAt: '' } },
  { id: '6', userId: 'u6', type: 'ASSURANCE', fileUrl: '#', expiryDate: '2024-08-30', status: 'OK', uploadedAt: '2023-08-30T09:30:00Z', user: { id: 'u6', phone: '+221 76 678 90 12', firstName: 'Mariama', lastName: 'Cissé', region: 'Ziguinchor', profileType: 'CHAUFFEUR', isActive: true, createdAt: '' } },
  { id: '7', userId: 'u7', type: 'CARTE_GRISE', fileUrl: '#', expiryDate: '2024-01-05', status: 'EXPIRED', uploadedAt: '2023-01-05T08:00:00Z', user: { id: 'u7', phone: '+221 77 789 01 23', firstName: 'Cheikh', lastName: 'Mbaye', region: 'Diourbel', profileType: 'CHAUFFEUR', isActive: true, createdAt: '' } },
  { id: '8', userId: 'u8', type: 'VISITE_TECHNIQUE', fileUrl: '#', expiryDate: '2025-11-15', status: 'OK', uploadedAt: '2024-03-01T10:00:00Z', user: { id: 'u8', phone: '+221 70 890 12 34', firstName: 'Ndéye', lastName: 'Guèye', region: 'Kaolack', profileType: 'CHAUFFEUR', isActive: true, createdAt: '' } },
]

const docTypeLabels: Record<string, string> = {
  PERMIS_CONDUIRE: 'Permis de conduire',
  ASSURANCE: 'Assurance',
  CARTE_GRISE: 'Carte grise',
  VISITE_TECHNIQUE: 'Visite technique',
}

const statusConfig = {
  OK: { label: 'Valide', color: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircle },
  WARNING: { label: 'Expire bientôt', color: 'bg-amber-100 text-amber-700 border-amber-200', icon: Clock },
  EXPIRED: { label: 'Expiré', color: 'bg-red-100 text-red-700 border-red-200', icon: AlertTriangle },
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>(initialDocuments)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')

  const filtered = documents.filter(d => {
    if (statusFilter !== 'all' && d.status !== statusFilter) return false
    if (typeFilter !== 'all' && d.type !== typeFilter) return false
    return true
  })

  const handleDelete = (id: string) => {
    setDocuments(prev => prev.filter(d => d.id !== id))
    toast.success('Document supprimé')
  }

  const stats = {
    total: documents.length,
    ok: documents.filter(d => d.status === 'OK').length,
    warning: documents.filter(d => d.status === 'WARNING').length,
    expired: documents.filter(d => d.status === 'EXPIRED').length,
  }

  const columns: ColumnDef<Document>[] = [
    {
      header: 'Utilisateur',
      cell: ({ row }) => (
        <div>
          <p className="font-medium text-gray-900">{row.original.user?.firstName} {row.original.user?.lastName}</p>
          <p className="text-xs text-gray-500">{row.original.user?.phone}</p>
        </div>
      ),
    },
    {
      accessorKey: 'type',
      header: 'Type',
      cell: ({ row }) => (
        <span className="text-sm text-gray-700">{docTypeLabels[row.original.type] || row.original.type}</span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Statut',
      cell: ({ row }) => {
        const cfg = statusConfig[row.original.status as keyof typeof statusConfig]
        const Icon = cfg.icon
        return (
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${cfg.color}`}>
            <Icon className="w-3 h-3" />
            {cfg.label}
          </span>
        )
      },
    },
    {
      accessorKey: 'expiryDate',
      header: 'Expiration',
      cell: ({ row }) => (
        <span className="text-sm text-gray-600">
          {row.original.expiryDate ? format(new Date(row.original.expiryDate), 'dd MMM yyyy', { locale: fr }) : '—'}
        </span>
      ),
    },
    {
      accessorKey: 'uploadedAt',
      header: 'Déposé le',
      cell: ({ row }) => (
        <span className="text-sm text-gray-500">
          {format(new Date(row.original.uploadedAt), 'dd MMM yyyy', { locale: fr })}
        </span>
      ),
    },
    {
      header: 'Région',
      cell: ({ row }) => (
        <span className="text-sm text-gray-600">{row.original.user?.region}</span>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex items-center gap-1 justify-end">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => window.open(row.original.fileUrl, '_blank')}>
            <Eye className="w-4 h-4" />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50">
                <Trash2 className="w-4 h-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Supprimer ce document ?</AlertDialogTitle>
                <AlertDialogDescription>Cette action est irréversible. Le document sera définitivement supprimé.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={() => handleDelete(row.original.id)}>Supprimer</AlertDialogAction>
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
        title="Documents"
        subtitle="Gérez les documents des utilisateurs (permis, assurances, cartes grises)"
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatsCard title="Total documents" value={stats.total} icon={FileText} color="blue" />
        <StatsCard title="Valides" value={stats.ok} icon={CheckCircle} color="green" trend={12} />
        <StatsCard title="Expirent bientôt" value={stats.warning} icon={Clock} color="amber" />
        <StatsCard title="Expirés" value={stats.expired} icon={AlertTriangle} color="red" />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 bg-white p-4 rounded-xl border border-gray-200">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="OK">Valides</SelectItem>
            <SelectItem value="WARNING">Expirent bientôt</SelectItem>
            <SelectItem value="EXPIRED">Expirés</SelectItem>
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Type de document" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les types</SelectItem>
            <SelectItem value="PERMIS_CONDUIRE">Permis de conduire</SelectItem>
            <SelectItem value="ASSURANCE">Assurance</SelectItem>
            <SelectItem value="CARTE_GRISE">Carte grise</SelectItem>
            <SelectItem value="VISITE_TECHNIQUE">Visite technique</SelectItem>
          </SelectContent>
        </Select>
        <div className="ml-auto text-sm text-gray-500 flex items-center">
          {filtered.length} document{filtered.length > 1 ? 's' : ''}
        </div>
      </div>

      {stats.expired > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <p className="text-sm text-red-700">
            <strong>{stats.expired} document{stats.expired > 1 ? 's' : ''}</strong> expiré{stats.expired > 1 ? 's' : ''} — pensez à notifier les utilisateurs concernés.
          </p>
        </div>
      )}

      <DataTable columns={columns} data={filtered} searchPlaceholder="Rechercher par type..." />
    </div>
  )
}
