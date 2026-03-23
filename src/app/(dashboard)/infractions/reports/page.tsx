'use client'

import React, { useState } from 'react'
import { Eye, CheckCircle, XCircle, AlertTriangle, MapPin, Car } from 'lucide-react'
import { ColumnDef } from '@tanstack/react-table'
import { PageHeader } from '@/components/shared/page-header'
import { StatsCard } from '@/components/shared/stats-card'
import { DataTable } from '@/components/shared/data-table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from '@/components/ui/dialog'
import { InfractionReport } from '@/types'
import toast from 'react-hot-toast'

// TODO: Replace with API call to /infractions/reports
const initialReports: InfractionReport[] = [
  { id: '1', userId: '1', infractionId: '1', location: 'Autoroute A1, Km 12, Dakar', lat: 14.7167, lng: -17.4677, images: ['img1.jpg', 'img2.jpg'], plate: 'DK-1234-A', status: 'PENDING', createdAt: '2024-03-11T10:30:00Z', user: { id: '1', firstName: 'Mamadou', lastName: 'Diallo', phone: '+221771234567', region: 'Dakar', profileType: 'APPRENANT', isActive: true, createdAt: '2024-01-15T10:00:00Z' }, infraction: { id: '1', code: 'INF-001', title: 'Excès de vitesse', severity: 'MEDIUM', fine: 25000, points: 2 } },
  { id: '2', userId: '2', infractionId: '2', location: 'Rue Carnot, Plateau, Dakar', lat: 14.6937, lng: -17.4441, images: ['img3.jpg'], plate: 'DK-5678-B', status: 'PENDING', createdAt: '2024-03-11T09:15:00Z', user: { id: '2', firstName: 'Fatou', lastName: 'Sow', phone: '+221763456789', region: 'Thiès', profileType: 'CHAUFFEUR', isActive: true, createdAt: '2024-01-20T14:30:00Z' }, infraction: { id: '2', code: 'INF-002', title: 'Grillage de feu rouge', severity: 'HIGH', fine: 50000, points: 4 } },
  { id: '3', userId: '3', infractionId: '4', location: 'VDN, face Cité Keur Gorgui, Dakar', lat: 14.7297, lng: -17.4621, images: ['img4.jpg', 'img5.jpg', 'img6.jpg'], plate: 'TH-2345-C', status: 'REVIEWED', createdAt: '2024-03-10T14:00:00Z', reviewedAt: '2024-03-11T08:00:00Z', user: { id: '3', firstName: 'Ibrahim', lastName: 'Ndoye', phone: '+221704567890', region: 'Saint-Louis', profileType: 'APPRENANT', isActive: false, createdAt: '2024-02-01T09:00:00Z' }, infraction: { id: '4', code: 'INF-004', title: 'Usage du téléphone', severity: 'MEDIUM', fine: 30000, points: 2 } },
  { id: '4', userId: '4', infractionId: '3', location: 'Rond-point Liberté 6, Dakar', lat: 14.7456, lng: -17.4789, images: [], plate: 'DK-9012-D', status: 'DISMISSED', createdAt: '2024-03-10T11:00:00Z', user: { id: '4', firstName: 'Aminata', lastName: 'Fall', phone: '+221775678901', region: 'Kaolack', profileType: 'AUTO_ECOLE', isActive: true, createdAt: '2024-02-10T11:00:00Z' }, infraction: { id: '3', code: 'INF-003', title: 'Non-port ceinture', severity: 'LOW', fine: 15000, points: 1 } },
  { id: '5', userId: '5', infractionId: '6', location: 'Avenue Cheikh Anta Diop, Dakar', lat: 14.7223, lng: -17.4521, images: ['img7.jpg'], plate: 'DK-3456-E', status: 'PENDING', createdAt: '2024-03-10T08:00:00Z', user: { id: '5', firstName: 'Ousmane', lastName: 'Ba', phone: '+221786789012', region: 'Ziguinchor', profileType: 'AGENT_ROUTIER', isActive: true, createdAt: '2024-02-15T16:00:00Z' }, infraction: { id: '6', code: 'INF-006', title: 'Stationnement interdit', severity: 'LOW', fine: 10000, points: 0 } },
  { id: '6', userId: '6', infractionId: '5', location: 'Route de Rufisque, Km 5', lat: 14.7128, lng: -17.3995, images: ['img8.jpg', 'img9.jpg'], plate: 'DK-7890-F', status: 'PENDING', createdAt: '2024-03-09T16:00:00Z', user: { id: '6', firstName: 'Cheikh', lastName: 'Ndiaye', phone: '+221777890123', region: 'Dakar', profileType: 'CHAUFFEUR', isActive: true, createdAt: '2024-02-20T08:00:00Z' }, infraction: { id: '5', code: 'INF-005', title: 'Conduite sous alcool', severity: 'HIGH', fine: 100000, points: 6 } },
]

const statusConfig = {
  PENDING: { label: 'En attente', variant: 'warning' as const, icon: AlertTriangle },
  REVIEWED: { label: 'Examiné', variant: 'success' as const, icon: CheckCircle },
  DISMISSED: { label: 'Rejeté', variant: 'gray' as const, icon: XCircle },
}

const severityConfig = {
  LOW: { label: 'Faible', variant: 'success' as const },
  MEDIUM: { label: 'Moyen', variant: 'warning' as const },
  HIGH: { label: 'Élevé', variant: 'destructive' as const },
}

export default function ReportsPage() {
  const [reports, setReports] = useState<InfractionReport[]>(initialReports)
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [selectedReport, setSelectedReport] = useState<InfractionReport | null>(null)

  const filtered = reports.filter(r =>
    statusFilter === 'ALL' || r.status === statusFilter
  )

  const updateStatus = (id: string, status: 'REVIEWED' | 'DISMISSED') => {
    setReports(prev => prev.map(r => r.id === id ? { ...r, status, reviewedAt: new Date().toISOString() } : r))
    toast.success(status === 'REVIEWED' ? 'Signalement marqué comme examiné' : 'Signalement rejeté')
    setSelectedReport(null)
  }

  const columns: ColumnDef<InfractionReport>[] = [
    {
      id: 'user',
      header: 'Signalant',
      cell: ({ row }) => (
        <div>
          <p className="text-sm font-medium">{row.original.user?.firstName} {row.original.user?.lastName}</p>
          <p className="text-xs text-gray-400">{row.original.user?.phone}</p>
        </div>
      ),
    },
    {
      id: 'infraction',
      header: 'Type d\'infraction',
      cell: ({ row }) => (
        <div>
          <p className="text-sm font-medium">{row.original.infraction?.title}</p>
          {row.original.infraction && (
            <Badge variant={severityConfig[row.original.infraction.severity].variant} className="text-xs mt-0.5">
              {severityConfig[row.original.infraction.severity].label}
            </Badge>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'location',
      header: 'Localisation',
      cell: ({ getValue }) => (
        <span className="text-xs text-gray-600 flex items-start gap-1">
          <MapPin className="w-3 h-3 mt-0.5 flex-shrink-0 text-red-400" />
          {getValue<string>()}
        </span>
      ),
    },
    {
      accessorKey: 'plate',
      header: 'Plaque',
      cell: ({ getValue }) => (
        <span className="font-mono text-xs font-bold bg-gray-100 px-2 py-1 rounded">
          {getValue<string>() || '—'}
        </span>
      ),
    },
    {
      accessorKey: 'images',
      header: 'Photos',
      cell: ({ getValue }) => (
        <span className="text-xs text-gray-500">{getValue<string[]>().length} photo(s)</span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Statut',
      cell: ({ getValue }) => {
        const s = getValue<string>() as keyof typeof statusConfig
        const cfg = statusConfig[s]
        return <Badge variant={cfg.variant}>{cfg.label}</Badge>
      },
    },
    {
      accessorKey: 'createdAt',
      header: 'Date',
      cell: ({ getValue }) => (
        <span className="text-xs text-gray-500">{new Date(getValue<string>()).toLocaleDateString('fr-SN')}</span>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex gap-1">
          <Button variant="ghost" size="icon-sm" onClick={() => setSelectedReport(row.original)}>
            <Eye className="w-3.5 h-3.5" />
          </Button>
          {row.original.status === 'PENDING' && (
            <>
              <Button
                variant="ghost"
                size="icon-sm"
                className="text-emerald-600"
                onClick={() => updateStatus(row.original.id, 'REVIEWED')}
                title="Marquer comme examiné"
              >
                <CheckCircle className="w-3.5 h-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                className="text-red-400"
                onClick={() => updateStatus(row.original.id, 'DISMISSED')}
                title="Rejeter"
              >
                <XCircle className="w-3.5 h-3.5" />
              </Button>
            </>
          )}
        </div>
      ),
    },
  ]

  const pendingCount = reports.filter(r => r.status === 'PENDING').length
  const reviewedCount = reports.filter(r => r.status === 'REVIEWED').length
  const dismissedCount = reports.filter(r => r.status === 'DISMISSED').length

  return (
    <div className="space-y-6">
      <PageHeader
        title="Signalements d'infractions"
        subtitle="Gérez les rapports soumis par les utilisateurs"
      />

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <StatsCard title="En attente" value={pendingCount} icon={AlertTriangle} color="amber" />
        <StatsCard title="Examinés" value={reviewedCount} icon={CheckCircle} color="green" />
        <StatsCard title="Rejetés" value={dismissedCount} icon={XCircle} color="red" />
      </div>

      {/* Map Placeholder */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="h-48 bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center relative">
          <div className="text-center text-gray-400">
            <MapPin className="w-12 h-12 mx-auto mb-2 text-slate-300" />
            <p className="font-medium text-slate-500">Carte des signalements</p>
            <p className="text-sm text-slate-400">{reports.length} signalements géolocalisés sur la carte</p>
            <div className="flex gap-3 justify-center mt-3">
              {reports.filter(r => r.lat).map(r => (
                <div key={r.id} className="flex items-center gap-1 text-xs">
                  <span className={`w-2 h-2 rounded-full ${r.status === 'PENDING' ? 'bg-amber-400' : r.status === 'REVIEWED' ? 'bg-emerald-400' : 'bg-gray-400'}`} />
                  {r.infraction?.code}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="bg-white rounded-xl border p-4 flex gap-3">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44 h-9"><SelectValue placeholder="Statut" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Tous les statuts</SelectItem>
            <SelectItem value="PENDING">En attente</SelectItem>
            <SelectItem value="REVIEWED">Examinés</SelectItem>
            <SelectItem value="DISMISSED">Rejetés</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border p-4">
        <DataTable columns={columns} data={filtered} searchPlaceholder="Rechercher..." />
      </div>

      {/* Detail Modal */}
      <Dialog open={!!selectedReport} onOpenChange={() => setSelectedReport(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Détail du signalement</DialogTitle>
            <DialogDescription>Informations complètes sur le signalement</DialogDescription>
          </DialogHeader>
          {selectedReport && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 font-medium uppercase">Signalant</p>
                  <p className="font-medium">{selectedReport.user?.firstName} {selectedReport.user?.lastName}</p>
                  <p className="text-sm text-gray-500">{selectedReport.user?.phone}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium uppercase">Infraction</p>
                  <p className="font-medium">{selectedReport.infraction?.title}</p>
                  <Badge variant={selectedReport.infraction ? severityConfig[selectedReport.infraction.severity].variant : 'outline'} className="text-xs">
                    {selectedReport.infraction ? severityConfig[selectedReport.infraction.severity].label : ''}
                  </Badge>
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase mb-1">Localisation</p>
                <p className="text-sm flex items-center gap-1">
                  <MapPin className="w-4 h-4 text-red-400" />
                  {selectedReport.location}
                </p>
                {selectedReport.lat && (
                  <p className="text-xs text-gray-400 mt-1">Coordonnées: {selectedReport.lat}, {selectedReport.lng}</p>
                )}
              </div>
              {selectedReport.plate && (
                <div>
                  <p className="text-xs text-gray-500 font-medium uppercase mb-1">Plaque d&apos;immatriculation</p>
                  <span className="font-mono font-bold bg-gray-100 px-3 py-1.5 rounded">
                    <Car className="w-4 h-4 inline mr-2 text-gray-400" />
                    {selectedReport.plate}
                  </span>
                </div>
              )}
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase mb-2">Photos ({selectedReport.images.length})</p>
                {selectedReport.images.length > 0 ? (
                  <div className="grid grid-cols-3 gap-2">
                    {selectedReport.images.map((img, i) => (
                      <div key={i} className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 text-sm border">
                        📷 Photo {i + 1}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">Aucune photo soumise</p>
                )}
              </div>
              <div className="flex items-center justify-between pt-2 border-t">
                <div>
                  <Badge variant={statusConfig[selectedReport.status].variant}>{statusConfig[selectedReport.status].label}</Badge>
                  <p className="text-xs text-gray-400 mt-1">Soumis le {new Date(selectedReport.createdAt).toLocaleDateString('fr-SN')}</p>
                </div>
                {selectedReport.status === 'PENDING' && (
                  <div className="flex gap-2">
                    <Button variant="success" size="sm" onClick={() => updateStatus(selectedReport.id, 'REVIEWED')} className="gap-1">
                      <CheckCircle className="w-4 h-4" /> Examiner
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => updateStatus(selectedReport.id, 'DISMISSED')} className="gap-1">
                      <XCircle className="w-4 h-4" /> Rejeter
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
