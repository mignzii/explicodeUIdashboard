'use client'

import React from 'react'
import {
  AreaChart, Area, BarChart, Bar, RadarChart, Radar, PolarGrid, PolarAngleAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import { TrendingUp, Trophy, Users, Target, Star } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { StatsCard } from '@/components/shared/stats-card'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'

// TODO: Replace with API calls
const activeUsersData = [
  { date: '10/02', actifs: 234 }, { date: '14/02', actifs: 312 }, { date: '18/02', actifs: 287 },
  { date: '22/02', actifs: 345 }, { date: '26/02', actifs: 398 }, { date: '01/03', actifs: 423 },
  { date: '05/03', actifs: 467 }, { date: '09/03', actifs: 512 }, { date: '11/03', actifs: 498 },
]

const quizScoresData = [
  { range: '0-20%', count: 120 }, { range: '20-40%', count: 280 }, { range: '40-60%', count: 645 },
  { range: '60-80%', count: 1234 }, { range: '80-100%', count: 876 },
]

const modulePerformanceData = [
  { module: 'Signalisation', completion: 78 },
  { module: 'Priorités', completion: 65 },
  { module: 'Conduite', completion: 82 },
  { module: 'Sécurité', completion: 71 },
  { module: 'Urgences', completion: 54 },
  { module: 'ADR', completion: 43 },
]

const radarData = [
  { subject: 'Signalisation', A: 78, fullMark: 100 },
  { subject: 'Priorités', A: 65, fullMark: 100 },
  { subject: 'Conduite', A: 82, fullMark: 100 },
  { subject: 'Sécurité', A: 71, fullMark: 100 },
  { subject: 'Urgences', A: 54, fullMark: 100 },
  { subject: 'ADR', A: 43, fullMark: 100 },
]

const badges = [
  { id: '1', name: 'Premier pas', icon: '🚗', description: 'Première leçon complétée', earnedBy: 9823, totalUsers: 12847, color: 'bg-blue-50 border-blue-200' },
  { id: '2', name: 'Apprenti conducteur', icon: '📚', description: '5 modules complétés', earnedBy: 4231, totalUsers: 12847, color: 'bg-purple-50 border-purple-200' },
  { id: '3', name: 'As du volant', icon: '⭐', description: 'Score parfait au quiz', earnedBy: 1876, totalUsers: 12847, color: 'bg-amber-50 border-amber-200' },
  { id: '4', name: 'Expert code', icon: '🏆', description: '10 quiz réussis > 90%', earnedBy: 876, totalUsers: 12847, color: 'bg-green-50 border-green-200' },
  { id: '5', name: 'Spécialiste ADR', icon: '☢️', description: 'Module ADR complété', earnedBy: 423, totalUsers: 12847, color: 'bg-orange-50 border-orange-200' },
  { id: '6', name: 'Marathonien', icon: '🔥', description: '30 jours consécutifs', earnedBy: 234, totalUsers: 12847, color: 'bg-red-50 border-red-200' },
]

const leaderboard = [
  { rank: 1, name: 'Mamadou Diallo', phone: '+221 77 123 45 67', region: 'Dakar', score: 9876, modules: 12, quizzes: 89 },
  { rank: 2, name: 'Fatou Sow', phone: '+221 76 234 56 78', region: 'Thiès', score: 9234, modules: 11, quizzes: 76 },
  { rank: 3, name: 'Ibrahima Fall', phone: '+221 70 345 67 89', region: 'Dakar', score: 8987, modules: 12, quizzes: 82 },
  { rank: 4, name: 'Aissatou Ba', phone: '+221 77 456 78 90', region: 'Saint-Louis', score: 8654, modules: 10, quizzes: 71 },
  { rank: 5, name: 'Ousmane Ndiaye', phone: '+221 78 567 89 01', region: 'Dakar', score: 8432, modules: 11, quizzes: 68 },
  { rank: 6, name: 'Mariama Cissé', phone: '+221 76 678 90 12', region: 'Ziguinchor', score: 8123, modules: 9, quizzes: 65 },
  { rank: 7, name: 'Cheikh Mbaye', phone: '+221 77 789 01 23', region: 'Diourbel', score: 7890, modules: 10, quizzes: 61 },
  { rank: 8, name: 'Ndéye Guèye', phone: '+221 70 890 12 34', region: 'Kaolack', score: 7654, modules: 9, quizzes: 58 },
  { rank: 9, name: 'Modou Diop', phone: '+221 77 901 23 45', region: 'Dakar', score: 7432, modules: 8, quizzes: 55 },
  { rank: 10, name: 'Rokhaya Sarr', phone: '+221 76 012 34 56', region: 'Thiès', score: 7210, modules: 8, quizzes: 52 },
]

const rankMedal = (rank: number) => {
  if (rank === 1) return '🥇'
  if (rank === 2) return '🥈'
  if (rank === 3) return '🥉'
  return `#${rank}`
}

export default function ProgressionPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Progression & Analytiques" subtitle="Suivez les performances des utilisateurs et leur progression dans l'application" />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatsCard title="Utilisateurs actifs" value="498" icon={Users} color="blue" trend={8} />
        <StatsCard title="Taux de complétion" value="67%" icon={Target} color="green" trend={3} />
        <StatsCard title="Score moyen quiz" value="71%" icon={TrendingUp} color="purple" trend={2} />
        <StatsCard title="Badges décernés" value="17 463" icon={Trophy} color="amber" trend={15} />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-gray-200">
          <CardHeader>
            <CardTitle className="text-base">Utilisateurs actifs (30 derniers jours)</CardTitle>
            <CardDescription>Nombre d&apos;utilisateurs actifs par jour</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={activeUsersData}>
                <defs>
                  <linearGradient id="colorActifs" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1B4FD8" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#1B4FD8" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Area type="monotone" dataKey="actifs" stroke="#1B4FD8" strokeWidth={2} fill="url(#colorActifs)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-gray-200">
          <CardHeader>
            <CardTitle className="text-base">Distribution des scores quiz</CardTitle>
            <CardDescription>Répartition des résultats par tranche</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={quizScoresData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="range" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#8B5CF6" radius={[4, 4, 0, 0]} name="Tentatives" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Radar + Module completion */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-gray-200">
          <CardHeader>
            <CardTitle className="text-base">Performance par module</CardTitle>
            <CardDescription>Taux de complétion moyen par catégorie</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11 }} />
                <Radar name="Complétion" dataKey="A" stroke="#1B4FD8" fill="#1B4FD8" fillOpacity={0.15} />
                <Tooltip formatter={(v) => [`${v}%`, 'Complétion']} />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-gray-200">
          <CardHeader>
            <CardTitle className="text-base">Taux de complétion par module</CardTitle>
            <CardDescription>Progression détaillée par module</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {modulePerformanceData.map(m => (
              <div key={m.module}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-700">{m.module}</span>
                  <span className="font-medium text-gray-900">{m.completion}%</span>
                </div>
                <Progress value={m.completion} className="h-2" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Badges */}
      <Card className="border-gray-200">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            Badges débloqués
          </CardTitle>
          <CardDescription>Statistiques sur les récompenses obtenues par les utilisateurs</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {badges.map(badge => (
              <div key={badge.id} className={`border rounded-xl p-4 ${badge.color}`}>
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{badge.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm">{badge.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{badge.description}</p>
                    <div className="mt-2">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-600">{badge.earnedBy.toLocaleString()} utilisateurs</span>
                        <span className="font-medium">{Math.round(badge.earnedBy / badge.totalUsers * 100)}%</span>
                      </div>
                      <Progress value={badge.earnedBy / badge.totalUsers * 100} className="h-1.5" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Leaderboard */}
      <Card className="border-gray-200">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Star className="w-5 h-5 text-amber-500" />
            Top 10 Utilisateurs
          </CardTitle>
          <CardDescription>Classement par score de progression global</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {leaderboard.map(user => (
              <div key={user.rank} className={`flex items-center gap-4 p-3 rounded-xl ${user.rank <= 3 ? 'bg-amber-50 border border-amber-100' : 'bg-gray-50'}`}>
                <span className="w-10 text-center text-lg font-bold">{rankMedal(user.rank)}</span>
                <Avatar className="w-8 h-8 flex-shrink-0">
                  <AvatarFallback className="text-xs bg-blue-100 text-blue-700">
                    {user.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm truncate">{user.name}</p>
                  <p className="text-xs text-gray-500">{user.region}</p>
                </div>
                <div className="hidden md:flex items-center gap-4 text-sm text-gray-600">
                  <span>{user.modules} modules</span>
                  <span>{user.quizzes} quiz</span>
                </div>
                <Badge variant="secondary" className="ml-auto font-bold text-blue-700 bg-blue-50">
                  {user.score.toLocaleString()} pts
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
