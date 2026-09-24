'use client'

import React, { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { ColumnDef } from '@tanstack/react-table'
import { Eye, Trash2, Download, Users, UserCheck, UserX, UserPlus, MoreHorizontal, Search, RefreshCw } from 'lucide-react'
import { DataTable } from '@/components/shared/data-table'
import { PageHeader } from '@/components/shared/page-header'
import { StatsCard } from '@/components/shared/stats-card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle
} from '@/components/ui/alert-dialog'
import { Switch } from '@/components/ui/switch'
import type { AdminUser, ProfileType } from '@/types'
import {
  usersApi, apiMessage, profileLabels, displayName, formatPhone,
  type UsersQuery, type UsersStats,
} from '@/lib/usersApi'
import toast from 'react-hot-toast'

const profileVariant: Record<ProfileType, 'info' | 'warning' | 'success' | 'purple' | 'gray'> = {
  apprentissage: 'info',
  chauffeur: 'warning',
  agent_routier: 'success',
  auto_ecole: 'purple',
  admin: 'gray',
}

const PAGE_SIZE = 20

/** « il y a 3 j », « aujourd'hui »… pour la dernière activité. */
function sinceLabel(iso: string | null): string {
  if (!iso) return 'Jamais'
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000)
  if (days <= 0) return 'Aujourd’hui'
  if (days === 1) return 'Hier'
  if (days < 30) return `Il y a ${days} j`
  return new Date(iso).toLocaleDateString('fr-SN')
}

function initials(u: AdminUser): string {
  const s = `${u.firstName?.charAt(0) ?? ''}${u.lastName?.charAt(0) ?? ''}`
  return s || u.phone.slice(-2)
}

type PendingAction = { kind: 'deactivate' | 'delete'; user: AdminUser }

export default function UsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [total, setTotal] = useState(0)
  const [stats, setStats] = useState<UsersStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [pending, setPending] = useState<PendingAction | null>(null)

  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [profileFilter, setProfileFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [regionFilter, setRegionFilter] = useState('ALL')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(PAGE_SIZE)

  // La recherche part au serveur 300 ms après la dernière frappe.
  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput.trim()); setPage(1) }, 300)
    return () => clearTimeout(t)
  }, [searchInput])

  const query: UsersQuery = {
    search: search || undefined,
    profileType: profileFilter === 'ALL' ? undefined : (profileFilter as ProfileType),
    status: statusFilter === 'ALL' ? undefined : (statusFilter as 'active' | 'inactive'),
    region: regionFilter === 'ALL' ? undefined : regionFilter,
  }
  const queryKey = JSON.stringify(query)

  const loadStats = useCallback(() => {
    usersApi.stats().then(setStats).catch(() => undefined)
  }, [])

  const loadUsers = useCallback(async () => {
    setLoading(true)
    setFailed(false)
    try {
      const res = await usersApi.list({ ...JSON.parse(queryKey), page, limit: pageSize })
      setUsers(res.items)
      setTotal(res.total)
    } catch {
      setFailed(true)
    } finally {
      setLoading(false)
    }
  }, [queryKey, page, pageSize])

  useEffect(() => { loadStats() }, [loadStats])
  useEffect(() => { loadUsers() }, [loadUsers])

  const resetFilters = () => {
    setSearchInput(''); setSearch('')
    setProfileFilter('ALL'); setStatusFilter('ALL'); setRegionFilter('ALL')
    setPage(1)
  }
  const onFilter = (set: (v: string) => void) => (v: string) => { set(v); setPage(1) }

  const setActive = async (user: AdminUser, isActive: boolean) => {
    setBusyId(user.id)
    try {
      await usersApi.setActive(user.id, isActive)
      setUsers(prev => prev.map(u => (u.id === user.id ? { ...u, isActive } : u)))
      toast.success(isActive ? `${displayName(user)} peut de nouveau se connecter` : `${displayName(user)} est désactivé`)
      loadStats()
    } catch (e) {
      toast.error(apiMessage(e, 'Le changement de statut a échoué.'))
    } finally {
      setBusyId(null)
    }
  }

  const remove = async (user: AdminUser) => {
    setBusyId(user.id)
    try {
      await usersApi.remove(user.id)
      toast.success(`Le compte de ${displayName(user)} est supprimé`)
      loadStats()
      loadUsers()
    } catch (e) {
      toast.error(apiMessage(e, 'La suppression a échoué.'))
    } finally {
      setBusyId(null)
    }
  }

  const confirmPending = () => {
    if (!pending) return
    if (pending.kind === 'deactivate') setActive(pending.user, false)
    else remove(pending.user)
    setPending(null)
  }

  const exportCSV = async () => {
    try {
      const all: AdminUser[] = []
      for (let p = 1; ; p++) {
        const res = await usersApi.list({ ...query, page: p, limit: 100 })
        all.push(...res.items)
        if (all.length >= res.total || res.items.length === 0) break
      }
      const cell = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`
      const headers = ['Prénom', 'Nom', 'Téléphone', 'Région', 'Profil', 'Statut', 'Leçons terminées', 'Dernière activité', 'Inscription']
      const rows = all.map(u => [
        u.firstName, u.lastName, u.phone, u.region, profileLabels[u.profileType],
        u.isActive ? 'Actif' : 'Désactivé', u.completedLessons,
        u.lastSeenAt ? new Date(u.lastSeenAt).toLocaleDateString('fr-SN') : '',
        new Date(u.createdAt).toLocaleDateString('fr-SN'),
      ])
      const csv = '﻿' + [headers, ...rows].map(r => r.map(cell).join(';')).join('\n')
      const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
      const a = document.createElement('a')
      a.href = url; a.download = 'utilisateurs-explicode.csv'; a.click()
      URL.revokeObjectURL(url)
      toast.success(`${all.length} utilisateur${all.length > 1 ? 's' : ''} exporté${all.length > 1 ? 's' : ''}`)
    } catch (e) {
      toast.error(apiMessage(e, 'L’export a échoué.'))
    }
  }

  const columns: ColumnDef<AdminUser>[] = [
    {
      id: 'user',
      header: 'Utilisateur',
      enableSorting: false,
      cell: ({ row }) => {
        const u = row.original
        const named = !!(u.firstName || u.lastName)
        return (
          <Link href={`/users/${u.id}`} className="flex items-center gap-3 group">
            <Avatar className="h-9 w-9">
              <AvatarFallback className="bg-blue-100 text-blue-700 text-xs font-bold">{initials(u)}</AvatarFallback>
            </Avatar>
            <div>
              <p className={`font-medium text-sm group-hover:underline ${named ? '' : 'text-gray-400 italic'}`}>{displayName(u)}</p>
              <p className="text-xs text-gray-500 tabular-nums">{formatPhone(u.phone)}</p>
            </div>
          </Link>
        )
      },
    },
    {
      id: 'profile',
      header: 'Profil',
      enableSorting: false,
      cell: ({ row }) => (
        <Badge variant={profileVariant[row.original.profileType]}>{profileLabels[row.original.profileType]}</Badge>
      ),
    },
    {
      id: 'region',
      header: 'Région',
      enableSorting: false,
      cell: ({ row }) => <span className="text-sm text-gray-600">{row.original.region || '—'}</span>,
    },
    {
      id: 'lessons',
      header: 'Leçons terminées',
      enableSorting: false,
      cell: ({ row }) => <span className="text-sm font-medium tabular-nums">{row.original.completedLessons}</span>,
    },
    {
      id: 'status',
      header: 'Statut',
      enableSorting: false,
      cell: ({ row }) => {
        const u = row.original
        const locked = u.profileType === 'admin'
        return (
          <div className="flex items-center gap-2">
            <Switch
              checked={u.isActive}
              disabled={locked || busyId === u.id}
              onCheckedChange={(on) => (on ? setActive(u, true) : setPending({ kind: 'deactivate', user: u }))}
              aria-label={u.isActive ? 'Désactiver le compte' : 'Réactiver le compte'}
            />
            <span className={`text-xs font-medium ${u.isActive ? 'text-emerald-600' : 'text-gray-400'}`}>
              {u.isActive ? 'Actif' : 'Désactivé'}
            </span>
          </div>
        )
      },
    },
    {
      id: 'lastSeen',
      header: 'Dernière activité',
      enableSorting: false,
      cell: ({ row }) => <span className="text-xs text-gray-500">{sinceLabel(row.original.lastSeenAt)}</span>,
    },
    {
      id: 'createdAt',
      header: 'Inscription',
      enableSorting: false,
      cell: ({ row }) => (
        <span className="text-xs text-gray-500">{new Date(row.original.createdAt).toLocaleDateString('fr-SN')}</span>
      ),
    },
    {
      id: 'actions',
      header: '',
      enableSorting: false,
      cell: ({ row }) => {
        const u = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm" aria-label="Actions">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <Link href={`/users/${u.id}`}>
                <DropdownMenuItem>
                  <Eye className="mr-2 h-4 w-4" /> Voir le profil
                </DropdownMenuItem>
              </Link>
              {u.profileType !== 'admin' && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-red-600" onSelect={() => setPending({ kind: 'delete', user: u })}>
                    <Trash2 className="mr-2 h-4 w-4" /> Supprimer le compte
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  const filtered = !!search || profileFilter !== 'ALL' || statusFilter !== 'ALL' || regionFilter !== 'ALL'

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestion des utilisateurs"
        subtitle={stats ? `${stats.total} compte${stats.total > 1 ? 's' : ''} dans l’app` : 'Comptes de l’app'}
        action={
          <Button onClick={exportCSV} variant="outline" className="gap-2" disabled={total === 0}>
            <Download className="w-4 h-4" /> Exporter CSV
          </Button>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatsCard title="Total" value={stats?.total ?? '—'} icon={Users} color="blue" />
        <StatsCard title="Actifs" value={stats?.active ?? '—'} icon={UserCheck} color="green" />
        <StatsCard title="Désactivés" value={stats?.inactive ?? '—'} icon={UserX} color="red" />
        <StatsCard title="Nouveaux (7 jours)" value={stats?.newThisWeek ?? '—'} icon={UserPlus} color="purple" />
      </div>

      <div className="bg-white rounded-xl border p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Nom, prénom ou numéro"
            className="pl-9 h-9"
          />
        </div>
        <Select value={profileFilter} onValueChange={onFilter(setProfileFilter)}>
          <SelectTrigger className="w-44 h-9"><SelectValue placeholder="Profil" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Tous les profils</SelectItem>
            {(Object.keys(profileLabels) as ProfileType[]).map(p => (
              <SelectItem key={p} value={p}>{profileLabels[p]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={onFilter(setStatusFilter)}>
          <SelectTrigger className="w-40 h-9"><SelectValue placeholder="Statut" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Tous les statuts</SelectItem>
            <SelectItem value="active">Actifs</SelectItem>
            <SelectItem value="inactive">Désactivés</SelectItem>
          </SelectContent>
        </Select>
        <Select value={regionFilter} onValueChange={onFilter(setRegionFilter)}>
          <SelectTrigger className="w-44 h-9"><SelectValue placeholder="Région" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Toutes les régions</SelectItem>
            {(stats?.regions ?? []).map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
          </SelectContent>
        </Select>
        {filtered && (
          <Button variant="ghost" size="sm" onClick={resetFilters} className="text-gray-500">
            Réinitialiser les filtres
          </Button>
        )}
      </div>

      <div className="bg-white rounded-xl border p-4">
        {failed ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <p className="text-sm text-gray-600">Impossible de charger les utilisateurs. Vérifiez la connexion à l’API.</p>
            <Button variant="outline" size="sm" className="gap-2" onClick={loadUsers}>
              <RefreshCw className="w-4 h-4" /> Réessayer
            </Button>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={users}
            loading={loading}
            searchable={false}
            serverPagination={{
              page,
              pageSize,
              total,
              onChange: (p, size) => { setPage(p); setPageSize(size) },
            }}
          />
        )}
      </div>

      <AlertDialog open={!!pending} onOpenChange={(open) => !open && setPending(null)}>
        <AlertDialogContent>
          {pending?.kind === 'deactivate' ? (
            <AlertDialogHeader>
              <AlertDialogTitle>Désactiver {displayName(pending.user)} ?</AlertDialogTitle>
              <AlertDialogDescription>
                La personne est déconnectée de l’app et ne pourra plus se connecter avec le {formatPhone(pending.user.phone)}.
                Ses données sont conservées : vous pourrez réactiver le compte à tout moment.
              </AlertDialogDescription>
            </AlertDialogHeader>
          ) : pending ? (
            <AlertDialogHeader>
              <AlertDialogTitle>Supprimer le compte de {displayName(pending.user)} ?</AlertDialogTitle>
              <AlertDialogDescription>
                Le profil, la progression, les résultats de quiz et les documents sont effacés. Ses publications
                restent visibles sous le nom « Utilisateur supprimé ». Le {formatPhone(pending.user.phone)} pourra
                créer un nouveau compte. Cette action est définitive.
              </AlertDialogDescription>
            </AlertDialogHeader>
          ) : null}
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={confirmPending} className="bg-red-600 hover:bg-red-700">
              {pending?.kind === 'deactivate' ? 'Désactiver' : 'Supprimer définitivement'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
