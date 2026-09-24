'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Phone, MapPin, Calendar, Clock, BookOpen, Target, FileText, RefreshCw, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle
} from '@/components/ui/alert-dialog'
import { usersApi, apiMessage, profileLabels, displayName, formatPhone, type UserDetail } from '@/lib/usersApi'
import toast from 'react-hot-toast'

const docTypes: Record<string, string> = {
  permis: 'Permis de conduire',
  assurance: 'Assurance',
  carte_grise: 'Carte grise',
  visite_tech: 'Visite technique',
  facture: 'Facture',
  autre: 'Autre',
}

const docStatus: Record<string, { label: string; variant: 'success' | 'warning' | 'red' }> = {
  ok: { label: 'Valide', variant: 'success' },
  warning: { label: 'Expire bientôt', variant: 'warning' },
  expired: { label: 'Expiré', variant: 'red' },
}

const date = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString('fr-SN') : '—')

function duration(seconds: number | null): string {
  if (!seconds) return '—'
  const m = Math.floor(seconds / 60)
  return m ? `${m} min ${seconds % 60} s` : `${seconds} s`
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-gray-500 py-10 text-center">{children}</p>
}

export default function UserDetailPage() {
  const params = useParams()
  const router = useRouter()
  const userId = params.id as string

  const [data, setData] = useState<UserDetail | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [confirm, setConfirm] = useState<'deactivate' | 'delete' | null>(null)

  const load = useCallback(async () => {
    setError(null)
    try {
      setData(await usersApi.detail(userId))
    } catch (e) {
      setError(apiMessage(e, 'Impossible de charger ce profil.'))
    }
  }, [userId])

  useEffect(() => { load() }, [load])

  const setActive = async (isActive: boolean) => {
    if (!data) return
    setBusy(true)
    try {
      await usersApi.setActive(userId, isActive)
      setData({ ...data, user: { ...data.user, isActive } })
      toast.success(isActive ? 'Compte réactivé' : 'Compte désactivé')
    } catch (e) {
      toast.error(apiMessage(e, 'Le changement de statut a échoué.'))
    } finally {
      setBusy(false)
    }
  }

  const remove = async () => {
    setBusy(true)
    try {
      await usersApi.remove(userId)
      toast.success('Compte supprimé')
      router.push('/users')
    } catch (e) {
      toast.error(apiMessage(e, 'La suppression a échoué.'))
      setBusy(false)
    }
  }

  const back = (
    <Button variant="ghost" onClick={() => router.push('/users')} className="gap-2 text-gray-600">
      <ArrowLeft className="w-4 h-4" /> Utilisateurs
    </Button>
  )

  if (error) {
    return (
      <div className="space-y-6">
        {back}
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <p className="text-sm text-gray-600">{error}</p>
            <Button variant="outline" size="sm" className="gap-2" onClick={load}>
              <RefreshCw className="w-4 h-4" /> Réessayer
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="space-y-6">
        {back}
        <Skeleton className="h-36 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    )
  }

  const { user, progress, quiz, documents } = data
  const isAdmin = user.profileType === 'admin'
  const initials = `${user.firstName?.charAt(0) ?? ''}${user.lastName?.charAt(0) ?? ''}` || user.phone.slice(-2)
  const current = progress.currentLesson

  return (
    <div className="space-y-6">
      {back}

      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-center gap-6">
            <Avatar className="h-20 w-20">
              <AvatarFallback className="bg-blue-600 text-white text-2xl font-bold">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-2xl font-bold text-gray-900">{displayName(user)}</h2>
                <Badge variant={user.isActive ? 'success' : 'gray'}>{user.isActive ? 'Actif' : 'Désactivé'}</Badge>
                <Badge variant="info">{profileLabels[user.profileType]}</Badge>
              </div>
              <div className="flex flex-wrap gap-x-5 gap-y-2 mt-3 text-sm text-gray-600">
                <span className="flex items-center gap-1.5 tabular-nums"><Phone className="w-4 h-4" /> {formatPhone(user.phone)}</span>
                <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" /> {user.region || 'Région non renseignée'}</span>
                <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /> Inscrit le {date(user.createdAt)}</span>
                <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> Dernière activité : {date(user.lastSeenAt)}</span>
              </div>
            </div>
            {!isAdmin && (
              <div className="flex flex-col gap-3 lg:items-end">
                <label className="flex items-center gap-3 text-sm text-gray-700">
                  <span>{user.isActive ? 'Peut se connecter' : 'Connexion bloquée'}</span>
                  <Switch
                    checked={user.isActive}
                    disabled={busy}
                    onCheckedChange={(on) => (on ? setActive(true) : setConfirm('deactivate'))}
                  />
                </label>
                <Button variant="ghost" size="sm" className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50" disabled={busy}
                  onClick={() => setConfirm('delete')}>
                  <Trash2 className="w-4 h-4" /> Supprimer le compte
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="progression">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="progression" className="gap-2"><BookOpen className="w-4 h-4" /> Progression</TabsTrigger>
          <TabsTrigger value="quiz" className="gap-2"><Target className="w-4 h-4" /> Quiz ({quiz.attempts})</TabsTrigger>
          <TabsTrigger value="documents" className="gap-2"><FileText className="w-4 h-4" /> Documents ({documents.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="progression" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle className="text-base">Cours</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Leçons terminées</span>
                  <span className="font-semibold tabular-nums">{progress.completedSubLessons}/{progress.totalSubLessons}</span>
                </div>
                <Progress value={progress.completionRate} className="h-2" />
                <p className="text-xs text-gray-500">{progress.completionRate} % du programme</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">Dernière leçon terminée</CardTitle></CardHeader>
              <CardContent>
                {current ? (
                  <div className="space-y-1">
                    <p className="font-medium text-gray-900">{current.lessonTitle}</p>
                    <p className="text-sm text-gray-500">
                      {[current.moduleTitle, current.categoryTitle].filter(Boolean).join(' › ')}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Aucune leçon terminée pour l’instant.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="quiz" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {quiz.attempts
                  ? `Moyenne ${quiz.averageScore} % · meilleur score ${quiz.bestScore} %`
                  : 'Quiz et examens blancs'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {quiz.history.length === 0 ? (
                <Empty>Aucun quiz passé pour l’instant.</Empty>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Quiz</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead>Durée</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {quiz.history.map(a => (
                      <TableRow key={a.id}>
                        <TableCell className="font-medium">
                          {a.isExamBlanc ? 'Examen blanc' : a.categoryTitle || 'Entraînement'}
                        </TableCell>
                        <TableCell className="tabular-nums">
                          <span className={`font-bold ${a.score >= 70 ? 'text-emerald-600' : 'text-red-500'}`}>{a.score} %</span>
                          <span className="text-xs text-gray-400 ml-1">({a.correctCount}/{a.totalCount})</span>
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">{duration(a.durationSeconds)}</TableCell>
                        <TableCell className="text-xs text-gray-500">{date(a.completedAt)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Documents enregistrés dans l’app</CardTitle></CardHeader>
            <CardContent>
              {documents.length === 0 ? (
                <Empty>Aucun document enregistré.</Empty>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Document</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Ajouté le</TableHead>
                      <TableHead>Expire le</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {documents.map(d => {
                      const s = docStatus[d.status] ?? docStatus.ok
                      return (
                        <TableRow key={d.id}>
                          <TableCell>
                            <p className="font-medium">{docTypes[d.type] ?? d.type}</p>
                            {d.organisme && <p className="text-xs text-gray-500">{d.organisme}</p>}
                          </TableCell>
                          <TableCell><Badge variant={s.variant}>{s.label}</Badge></TableCell>
                          <TableCell className="text-sm text-gray-500">{date(d.uploadedAt)}</TableCell>
                          <TableCell className="text-sm text-gray-500">{date(d.expiryDate)}</TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <AlertDialog open={!!confirm} onOpenChange={(open) => !open && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            {confirm === 'deactivate' ? (
              <>
                <AlertDialogTitle>Désactiver {displayName(user)} ?</AlertDialogTitle>
                <AlertDialogDescription>
                  La personne est déconnectée de l’app et ne pourra plus se connecter avec le {formatPhone(user.phone)}.
                  Ses données sont conservées : vous pourrez réactiver le compte à tout moment.
                </AlertDialogDescription>
              </>
            ) : (
              <>
                <AlertDialogTitle>Supprimer le compte de {displayName(user)} ?</AlertDialogTitle>
                <AlertDialogDescription>
                  Le profil, la progression, les résultats de quiz et les documents sont effacés. Ses publications
                  restent visibles sous le nom « Utilisateur supprimé ». Le {formatPhone(user.phone)} pourra créer un
                  nouveau compte. Cette action est définitive.
                </AlertDialogDescription>
              </>
            )}
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => { const c = confirm; setConfirm(null); if (c === 'deactivate') setActive(false); else remove() }}
            >
              {confirm === 'deactivate' ? 'Désactiver' : 'Supprimer définitivement'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
