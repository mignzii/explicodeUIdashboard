'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { ColumnDef } from '@tanstack/react-table'
import { Eye, Pencil, Trash2, Download, Users, UserCheck, UserX, MoreHorizontal } from 'lucide-react'
import { DataTable } from '@/components/shared/data-table'
import { PageHeader } from '@/components/shared/page-header'
import { StatsCard } from '@/components/shared/stats-card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from '@/components/ui/alert-dialog'
import { Switch } from '@/components/ui/switch'
import { User } from '@/types'
import toast from 'react-hot-toast'

// TODO: Replace with API call to /users
const mockUsers: User[] = [
  { id: '1', phone: '+221771234567', firstName: 'Mamadou', lastName: 'Diallo', region: 'Dakar', profileType: 'APPRENANT', isActive: true, createdAt: '2024-01-15T10:00:00Z', xp: 1250, level: 5 },
  { id: '2', phone: '+221763456789', firstName: 'Fatou', lastName: 'Sow', region: 'Thiès', profileType: 'CHAUFFEUR', isActive: true, createdAt: '2024-01-20T14:30:00Z', xp: 3400, level: 12 },
  { id: '3', phone: '+221704567890', firstName: 'Ibrahim', lastName: 'Ndoye', region: 'Saint-Louis', profileType: 'APPRENANT', isActive: false, createdAt: '2024-02-01T09:00:00Z', xp: 450, level: 2 },
  { id: '4', phone: '+221775678901', firstName: 'Aminata', lastName: 'Fall', region: 'Kaolack', profileType: 'AUTO_ECOLE', isActive: true, createdAt: '2024-02-10T11:00:00Z', xp: 8900, level: 25 },
  { id: '5', phone: '+221786789012', firstName: 'Ousmane', lastName: 'Ba', region: 'Ziguinchor', profileType: 'AGENT_ROUTIER', isActive: true, createdAt: '2024-02-15T16:00:00Z', xp: 5600, level: 18 },
  { id: '6', phone: '+221777890123', firstName: 'Mariama', lastName: 'Diop', region: 'Dakar', profileType: 'APPRENANT', isActive: true, createdAt: '2024-02-20T08:00:00Z', xp: 2100, level: 8 },
  { id: '7', phone: '+221768901234', firstName: 'Cheikh', lastName: 'Ndiaye', region: 'Louga', profileType: 'CHAUFFEUR', isActive: false, createdAt: '2024-02-25T13:00:00Z', xp: 890, level: 3 },
  { id: '8', phone: '+221709012345', firstName: 'Rokhaya', lastName: 'Kane', region: 'Diourbel', profileType: 'APPRENANT', isActive: true, createdAt: '2024-03-01T10:00:00Z', xp: 3200, level: 11 },
  { id: '9', phone: '+221770123456', firstName: 'Abdou', lastName: 'Gueye', region: 'Fatick', profileType: 'APPRENANT', isActive: true, createdAt: '2024-03-05T15:00:00Z', xp: 780, level: 3 },
  { id: '10', phone: '+221761234560', firstName: 'Ndéye', lastName: 'Mbaye', region: 'Dakar', profileType: 'AUTO_ECOLE', isActive: true, createdAt: '2024-03-08T12:00:00Z', xp: 12400, level: 35 },
  { id: '11', phone: '+221792345671', firstName: 'Bamba', lastName: 'Sarr', region: 'Matam', profileType: 'CHAUFFEUR', isActive: true, createdAt: '2024-03-09T09:30:00Z', xp: 1800, level: 7 },
  { id: '12', phone: '+221783456782', firstName: 'Daba', lastName: 'Diallo', region: 'Tambacounda', profileType: 'APPRENANT', isActive: false, createdAt: '2024-03-10T11:00:00Z', xp: 340, level: 1 },
]

const profileConfig: Record<string, { label: string; variant: string }> = {
  APPRENANT: { label: 'Apprenant', variant: 'info' },
  CHAUFFEUR: { label: 'Chauffeur', variant: 'warning' },
  AGENT_ROUTIER: { label: 'Agent routier', variant: 'success' },
  AUTO_ECOLE: { label: 'Auto-école', variant: 'purple' },
}

const REGIONS = [
  'Dakar', 'Thiès', 'Saint-Louis', 'Ziguinchor', 'Diourbel',
  'Louga', 'Fatick', 'Kaolack', 'Matam', 'Tambacounda',
  'Kédougou', 'Kolda', 'Sédhiou'
]

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>(mockUsers)
  const [profileFilter, setProfileFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [regionFilter, setRegionFilter] = useState('ALL')

  const filteredUsers = users.filter(u => {
    if (profileFilter !== 'ALL' && u.profileType !== profileFilter) return false
    if (statusFilter === 'ACTIVE' && !u.isActive) return false
    if (statusFilter === 'INACTIVE' && u.isActive) return false
    if (regionFilter !== 'ALL' && u.region !== regionFilter) return false
    return true
  })

  const toggleUserStatus = (userId: string) => {
    setUsers(prev => prev.map(u =>
      u.id === userId ? { ...u, isActive: !u.isActive } : u
    ))
    const user = users.find(u => u.id === userId)
    toast.success(`Utilisateur ${user?.isActive ? 'désactivé' : 'activé'}`)
  }

  const deleteUser = (userId: string) => {
    setUsers(prev => prev.filter(u => u.id !== userId))
    toast.success('Utilisateur supprimé')
  }

  const exportCSV = () => {
    const headers = ['ID', 'Prénom', 'Nom', 'Téléphone', 'Région', 'Profil', 'Statut', 'Inscription']
    const rows = filteredUsers.map(u => [
      u.id, u.firstName, u.lastName, u.phone, u.region,
      profileConfig[u.profileType]?.label, u.isActive ? 'Actif' : 'Inactif', u.createdAt
    ])
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'utilisateurs.csv'; a.click()
    toast.success('Export CSV téléchargé')
  }

  const columns: ColumnDef<User>[] = [
    {
      accessorKey: 'firstName',
      header: 'Utilisateur',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-blue-100 text-blue-700 text-xs font-bold">
              {row.original.firstName.charAt(0)}{row.original.lastName.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium text-sm">{row.original.firstName} {row.original.lastName}</p>
            <p className="text-xs text-gray-500">{row.original.phone}</p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'profileType',
      header: 'Profil',
      cell: ({ getValue }) => {
        const type = getValue<string>()
        const cfg = profileConfig[type]
        return <Badge variant={cfg?.variant as 'info' | 'warning' | 'success' | 'purple'}>{cfg?.label}</Badge>
      },
    },
    {
      accessorKey: 'region',
      header: 'Région',
      cell: ({ getValue }) => <span className="text-sm text-gray-600">{getValue<string>()}</span>,
    },
    {
      accessorKey: 'xp',
      header: 'XP',
      cell: ({ getValue }) => <span className="text-sm font-medium text-purple-600">{getValue<number>()?.toLocaleString('fr-SN')} XP</span>,
    },
    {
      accessorKey: 'isActive',
      header: 'Statut',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Switch
            checked={row.original.isActive}
            onCheckedChange={() => toggleUserStatus(row.original.id)}
          />
          <span className={`text-xs font-medium ${row.original.isActive ? 'text-emerald-600' : 'text-gray-400'}`}>
            {row.original.isActive ? 'Actif' : 'Inactif'}
          </span>
        </div>
      ),
    },
    {
      accessorKey: 'createdAt',
      header: 'Inscription',
      cell: ({ getValue }) => {
        const d = new Date(getValue<string>())
        return <span className="text-xs text-gray-500">{d.toLocaleDateString('fr-SN')}</span>
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <Link href={`/users/${row.original.id}`}>
              <DropdownMenuItem>
                <Eye className="mr-2 h-4 w-4" /> Voir le profil
              </DropdownMenuItem>
            </Link>
            <DropdownMenuItem>
              <Pencil className="mr-2 h-4 w-4" /> Modifier
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-red-600">
                  <Trash2 className="mr-2 h-4 w-4" /> Supprimer
                </DropdownMenuItem>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
                  <AlertDialogDescription>
                    Voulez-vous vraiment supprimer {row.original.firstName} {row.original.lastName} ? Cette action est irréversible.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => deleteUser(row.original.id)}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Supprimer
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]

  const activeCount = users.filter(u => u.isActive).length
  const byProfile = {
    APPRENANT: users.filter(u => u.profileType === 'APPRENANT').length,
    CHAUFFEUR: users.filter(u => u.profileType === 'CHAUFFEUR').length,
    AGENT_ROUTIER: users.filter(u => u.profileType === 'AGENT_ROUTIER').length,
    AUTO_ECOLE: users.filter(u => u.profileType === 'AUTO_ECOLE').length,
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestion des utilisateurs"
        subtitle={`${users.length} utilisateurs enregistrés`}
        action={
          <Button onClick={exportCSV} variant="outline" className="gap-2">
            <Download className="w-4 h-4" /> Exporter CSV
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatsCard title="Total" value={users.length} icon={Users} color="blue" />
        <StatsCard title="Actifs" value={activeCount} icon={UserCheck} color="green" />
        <StatsCard title="Inactifs" value={users.length - activeCount} icon={UserX} color="red" />
        <StatsCard title="Auto-écoles" value={byProfile.AUTO_ECOLE} icon={Users} color="purple" />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border p-4 flex flex-wrap gap-3">
        <Select value={profileFilter} onValueChange={setProfileFilter}>
          <SelectTrigger className="w-44 h-9"><SelectValue placeholder="Type de profil" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Tous les profils</SelectItem>
            <SelectItem value="APPRENANT">Apprenants</SelectItem>
            <SelectItem value="CHAUFFEUR">Chauffeurs</SelectItem>
            <SelectItem value="AGENT_ROUTIER">Agents routiers</SelectItem>
            <SelectItem value="AUTO_ECOLE">Auto-écoles</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40 h-9"><SelectValue placeholder="Statut" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Tous les statuts</SelectItem>
            <SelectItem value="ACTIVE">Actifs</SelectItem>
            <SelectItem value="INACTIVE">Inactifs</SelectItem>
          </SelectContent>
        </Select>
        <Select value={regionFilter} onValueChange={setRegionFilter}>
          <SelectTrigger className="w-44 h-9"><SelectValue placeholder="Région" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Toutes les régions</SelectItem>
            {REGIONS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
          </SelectContent>
        </Select>
        {(profileFilter !== 'ALL' || statusFilter !== 'ALL' || regionFilter !== 'ALL') && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { setProfileFilter('ALL'); setStatusFilter('ALL'); setRegionFilter('ALL') }}
            className="text-gray-500"
          >
            Réinitialiser les filtres
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border p-4">
        <DataTable
          columns={columns}
          data={filteredUsers}
          searchPlaceholder="Rechercher par nom ou téléphone..."
        />
      </div>
    </div>
  )
}
