'use client'

import React, { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Phone, MapPin, Calendar, Star, BookOpen, Target, FileText, Activity } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

// TODO: Replace with API call to /users/:id
const mockUser = {
  id: '1',
  firstName: 'Mamadou',
  lastName: 'Diallo',
  phone: '+221 77 123 45 67',
  region: 'Dakar',
  profileType: 'APPRENANT',
  isActive: true,
  createdAt: '2024-01-15T10:00:00Z',
  xp: 3450,
  level: 12,
  streakDays: 7,
}

const mockProgression = {
  modulesCompleted: 7,
  totalModules: 12,
  lessonsCompleted: 48,
  totalLessons: 87,
  quizzesPassed: 34,
  badges: [
    { id: '1', name: 'Premier Pas', icon: '🎯', color: '#10B981', description: 'Première leçon terminée' },
    { id: '2', name: 'Assidu', icon: '🔥', color: '#F59E0B', description: '7 jours consécutifs' },
    { id: '3', name: 'Quiz Master', icon: '🏆', color: '#8B5CF6', description: '10 quiz réussis' },
    { id: '4', name: 'Explorateur', icon: '🗺️', color: '#1B4FD8', description: '5 modules débloqués' },
  ],
}

const mockQuizHistory = [
  { id: '1', category: 'Code de la route', score: 85, total: 20, duration: 420, date: '2024-03-10T14:00:00Z', passed: true },
  { id: '2', category: 'Signalisation', score: 70, total: 20, duration: 380, date: '2024-03-08T16:00:00Z', passed: true },
  { id: '3', category: 'Priorités', score: 55, total: 20, duration: 450, date: '2024-03-06T10:00:00Z', passed: false },
  { id: '4', category: 'Infractions', score: 90, total: 20, duration: 360, date: '2024-03-04T11:00:00Z', passed: true },
  { id: '5', category: 'Conduite défensive', score: 75, total: 20, duration: 410, date: '2024-03-02T15:00:00Z', passed: true },
]

const mockDocuments = [
  { id: '1', type: 'PERMIS_CONDUIRE', status: 'OK', uploadedAt: '2024-01-15T10:00:00Z', expiryDate: '2030-01-15' },
  { id: '2', type: 'ASSURANCE', status: 'WARNING', uploadedAt: '2024-02-01T09:00:00Z', expiryDate: '2024-04-01' },
  { id: '3', type: 'CARTE_GRISE', status: 'OK', uploadedAt: '2024-01-20T14:00:00Z', expiryDate: '2026-01-20' },
]

const docTypes: Record<string, string> = {
  PERMIS_CONDUIRE: 'Permis de conduire',
  ASSURANCE: 'Assurance',
  CARTE_GRISE: 'Carte grise',
  VISITE_TECHNIQUE: 'Visite technique',
  AUTRE: 'Autre',
}

const statusConfig: Record<string, { label: string; variant: 'success' | 'warning' | 'destructive' }> = {
  OK: { label: 'Valide', variant: 'success' },
  WARNING: { label: 'Expire bientôt', variant: 'warning' },
  EXPIRED: { label: 'Expiré', variant: 'destructive' },
}

export default function UserDetailPage() {
  const params = useParams()
  const router = useRouter()
  const userId = params.id as string

  // TODO: Replace with API call to /users/:id
  const user = mockUser

  const moduleProgress = Math.round((mockProgression.modulesCompleted / mockProgression.totalModules) * 100)
  const lessonProgress = Math.round((mockProgression.lessonsCompleted / mockProgression.totalLessons) * 100)

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Button variant="ghost" onClick={() => router.back()} className="gap-2 text-gray-600">
        <ArrowLeft className="w-4 h-4" /> Retour
      </Button>

      {/* Profile Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <Avatar className="h-20 w-20">
              <AvatarFallback className="bg-blue-600 text-white text-2xl font-bold">
                {user.firstName.charAt(0)}{user.lastName.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-2xl font-bold text-gray-900">{user.firstName} {user.lastName}</h2>
                <Badge variant={user.isActive ? 'success' : 'gray'}>
                  {user.isActive ? 'Actif' : 'Inactif'}
                </Badge>
                <Badge variant="info">
                  {user.profileType === 'APPRENANT' ? 'Apprenant' :
                   user.profileType === 'CHAUFFEUR' ? 'Chauffeur' :
                   user.profileType === 'AGENT_ROUTIER' ? 'Agent routier' : 'Auto-école'}
                </Badge>
              </div>
              <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-600">
                <span className="flex items-center gap-1"><Phone className="w-4 h-4" /> {user.phone}</span>
                <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {user.region}</span>
                <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> Inscrit le {new Date(user.createdAt).toLocaleDateString('fr-SN')}</span>
              </div>
            </div>
            <div className="flex gap-6 text-center">
              <div className="bg-purple-50 rounded-xl px-4 py-3">
                <p className="text-2xl font-bold text-purple-700">{user.xp.toLocaleString('fr-SN')}</p>
                <p className="text-xs text-purple-500 font-medium">XP Total</p>
              </div>
              <div className="bg-amber-50 rounded-xl px-4 py-3">
                <p className="text-2xl font-bold text-amber-700">Niv. {user.level}</p>
                <p className="text-xs text-amber-500 font-medium">Niveau actuel</p>
              </div>
              <div className="bg-orange-50 rounded-xl px-4 py-3">
                <p className="text-2xl font-bold text-orange-700">{user.streakDays}</p>
                <p className="text-xs text-orange-500 font-medium">Jours consécutifs</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="progression">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="progression" className="gap-2">
            <BookOpen className="w-4 h-4" /> Progression
          </TabsTrigger>
          <TabsTrigger value="quiz" className="gap-2">
            <Target className="w-4 h-4" /> Historique Quiz
          </TabsTrigger>
          <TabsTrigger value="documents" className="gap-2">
            <FileText className="w-4 h-4" /> Documents
          </TabsTrigger>
          <TabsTrigger value="activity" className="gap-2">
            <Activity className="w-4 h-4" /> Activité
          </TabsTrigger>
        </TabsList>

        {/* Progression Tab */}
        <TabsContent value="progression" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Progression des modules</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">Modules terminés</span>
                    <span className="font-semibold">{mockProgression.modulesCompleted}/{mockProgression.totalModules}</span>
                  </div>
                  <Progress value={moduleProgress} className="h-2" />
                  <p className="text-xs text-gray-400 mt-1">{moduleProgress}% complété</p>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">Leçons terminées</span>
                    <span className="font-semibold">{mockProgression.lessonsCompleted}/{mockProgression.totalLessons}</span>
                  </div>
                  <Progress value={lessonProgress} className="h-2" />
                  <p className="text-xs text-gray-400 mt-1">{lessonProgress}% complété</p>
                </div>
                <div className="pt-3 border-t">
                  <div className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-purple-500" />
                    <span className="text-sm text-gray-600">Quiz réussis:</span>
                    <span className="font-bold text-purple-700">{mockProgression.quizzesPassed}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Badges obtenus</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  {mockProgression.badges.map(badge => (
                    <div
                      key={badge.id}
                      className="flex items-center gap-3 p-3 rounded-lg border bg-gray-50 hover:bg-white transition-colors"
                    >
                      <span className="text-2xl">{badge.icon}</span>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{badge.name}</p>
                        <p className="text-xs text-gray-500">{badge.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Quiz History Tab */}
        <TabsContent value="quiz" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Historique des quiz</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Catégorie</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Durée</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Résultat</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockQuizHistory.map(attempt => (
                    <TableRow key={attempt.id}>
                      <TableCell className="font-medium">{attempt.category}</TableCell>
                      <TableCell>
                        <span className={`font-bold ${attempt.score >= 70 ? 'text-emerald-600' : 'text-red-500'}`}>
                          {attempt.score}%
                        </span>
                        <span className="text-xs text-gray-400 ml-1">({Math.round(attempt.score * attempt.total / 100)}/{attempt.total})</span>
                      </TableCell>
                      <TableCell className="text-gray-600 text-sm">
                        {Math.floor(attempt.duration / 60)}m {attempt.duration % 60}s
                      </TableCell>
                      <TableCell className="text-xs text-gray-500">
                        {new Date(attempt.date).toLocaleDateString('fr-SN')}
                      </TableCell>
                      <TableCell>
                        <Badge variant={attempt.passed ? 'success' : 'destructive'}>
                          {attempt.passed ? 'Réussi' : 'Échoué'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Documents soumis</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type de document</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Date d&apos;upload</TableHead>
                    <TableHead>Date d&apos;expiration</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockDocuments.map(doc => {
                    const config = statusConfig[doc.status]
                    return (
                      <TableRow key={doc.id}>
                        <TableCell className="font-medium">{docTypes[doc.type] || doc.type}</TableCell>
                        <TableCell>
                          <Badge variant={config.variant}>{config.label}</Badge>
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {new Date(doc.uploadedAt).toLocaleDateString('fr-SN')}
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {doc.expiryDate ? new Date(doc.expiryDate).toLocaleDateString('fr-SN') : '-'}
                        </TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm" className="gap-1 text-xs">
                            <FileText className="w-3 h-3" /> Voir
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity" className="mt-4">
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                {[
                  { icon: '✅', text: 'A terminé le module "Signalisation routière"', time: 'Il y a 2h' },
                  { icon: '🎯', text: 'Score de 85% au quiz "Code de la route"', time: 'Il y a 3h' },
                  { icon: '📚', text: 'A commencé la leçon "Priorités aux intersections"', time: 'Hier' },
                  { icon: '🏆', text: 'Badge "Assidu" débloqué - 7 jours consécutifs', time: 'Il y a 2 jours' },
                  { icon: '📱', text: 'Connexion depuis Dakar', time: 'Il y a 2 jours' },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3 pb-4 border-b last:border-0">
                    <span className="text-xl">{item.icon}</span>
                    <div className="flex-1">
                      <p className="text-sm text-gray-800">{item.text}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{item.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
