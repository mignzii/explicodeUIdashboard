'use client'

import React from 'react'
import Link from 'next/link'
import {
  AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import { Users, UserCheck, Target, AlertTriangle, BookOpen, Briefcase, ArrowRight, Eye } from 'lucide-react'
import { StatsCard } from '@/components/shared/stats-card'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

// TODO: Replace with API call to /stats
const stats = {
  totalUsers: 12847,
  activeUsers: 3241,
  quizCompleted: 45632,
  pendingReports: 18,
  publishedModules: 12,
  activeJobs: 34,
}

// TODO: Replace with API call to /stats/daily
const registrationData = [
  { date: '10/02', users: 45 }, { date: '11/02', users: 72 }, { date: '12/02', users: 58 },
  { date: '13/02', users: 91 }, { date: '14/02', users: 64 }, { date: '15/02', users: 83 },
  { date: '16/02', users: 110 }, { date: '17/02', users: 95 }, { date: '18/02', users: 78 },
  { date: '19/02', users: 122 }, { date: '20/02', users: 87 }, { date: '21/02', users: 142 },
  { date: '22/02', users: 98 }, { date: '23/02', users: 134 }, { date: '24/02', users: 156 },
  { date: '25/02', users: 112 }, { date: '26/02', users: 89 }, { date: '27/02', users: 167 },
  { date: '28/02', users: 143 }, { date: '01/03', users: 178 }, { date: '02/03', users: 134 },
  { date: '03/03', users: 201 }, { date: '04/03', users: 189 }, { date: '05/03', users: 167 },
  { date: '06/03', users: 223 }, { date: '07/03', users: 198 }, { date: '08/03', users: 245 },
  { date: '09/03', users: 212 }, { date: '10/03', users: 267 }, { date: '11/03', users: 234 },
]

const profileData = [
  { name: 'Apprenants', value: 8234, color: '#1B4FD8' },
  { name: 'Chauffeurs', value: 2891, color: '#F59E0B' },
  { name: 'Agents routiers', value: 1234, color: '#10B981' },
  { name: 'Auto-écoles', value: 488, color: '#8B5CF6' },
]

// TODO: Replace with API call to /users?limit=5&sort=createdAt
const recentUsers = [
  { id: '1', firstName: 'Mamadou', lastName: 'Diallo', phone: '+221 77 234 56 78', profileType: 'APPRENANT', region: 'Dakar', createdAt: '2024-03-11T08:23:00Z' },
  { id: '2', firstName: 'Fatou', lastName: 'Sow', phone: '+221 76 345 67 89', profileType: 'CHAUFFEUR', region: 'Thiès', createdAt: '2024-03-11T07:15:00Z' },
  { id: '3', firstName: 'Ibrahim', lastName: 'Ndoye', phone: '+221 70 456 78 90', profileType: 'APPRENANT', region: 'Saint-Louis', createdAt: '2024-03-11T06:45:00Z' },
  { id: '4', firstName: 'Aminata', lastName: 'Fall', phone: '+221 77 567 89 01', profileType: 'AUTO_ECOLE', region: 'Kaolack', createdAt: '2024-03-10T22:30:00Z' },
  { id: '5', firstName: 'Ousmane', lastName: 'Ba', phone: '+221 78 678 90 12', profileType: 'AGENT_ROUTIER', region: 'Ziguinchor', createdAt: '2024-03-10T21:00:00Z' },
]

// TODO: Replace with API call to /infractions/reports?status=PENDING&limit=5
const recentReports = [
  { id: '1', user: 'Mamadou Diallo', type: 'Excès de vitesse', location: 'Autoroute A1, Dakar', plate: 'DK-1234-A', status: 'PENDING', createdAt: '2024-03-11T10:30:00Z' },
  { id: '2', user: 'Fatou Ndiaye', type: 'Stationnement interdit', location: 'Rue Carnot, Dakar', plate: 'DK-5678-B', status: 'PENDING', createdAt: '2024-03-11T09:15:00Z' },
  { id: '3', user: 'Amadou Diop', type: 'Grillage de feu rouge', location: 'Rond-point Liberté 6', plate: 'TH-2345-C', status: 'PENDING', createdAt: '2024-03-11T08:00:00Z' },
  { id: '4', user: 'Khady Sarr', type: 'Téléphone au volant', location: 'VDN, Dakar', plate: 'DK-9012-D', status: 'PENDING', createdAt: '2024-03-10T19:45:00Z' },
  { id: '5', user: 'Pape Gueye', type: 'Surcharge', location: 'Route de Rufisque', plate: 'DK-3456-E', status: 'PENDING', createdAt: '2024-03-10T17:30:00Z' },
]

const profileColors: Record<string, string> = {
  APPRENANT: 'info',
  CHAUFFEUR: 'warning',
  AGENT_ROUTIER: 'success',
  AUTO_ECOLE: 'purple',
}

const profileLabels: Record<string, string> = {
  APPRENANT: 'Apprenant',
  CHAUFFEUR: 'Chauffeur',
  AGENT_ROUTIER: 'Agent routier',
  AUTO_ECOLE: 'Auto-école',
}

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6 gap-4">
        <StatsCard
          title="Total Utilisateurs"
          value={stats.totalUsers.toLocaleString('fr-SN')}
          icon={Users}
          trend={12}
          trendLabel="ce mois"
          color="blue"
        />
        <StatsCard
          title="Actifs aujourd'hui"
          value={stats.activeUsers.toLocaleString('fr-SN')}
          icon={UserCheck}
          trend={8}
          trendLabel="vs hier"
          color="green"
        />
        <StatsCard
          title="Quiz complétés"
          value={stats.quizCompleted.toLocaleString('fr-SN')}
          icon={Target}
          trend={23}
          trendLabel="ce mois"
          color="purple"
        />
        <StatsCard
          title="Signalements en attente"
          value={stats.pendingReports}
          icon={AlertTriangle}
          trend={-5}
          trendLabel="vs hier"
          color="red"
        />
        <StatsCard
          title="Modules publiés"
          value={stats.publishedModules}
          icon={BookOpen}
          color="amber"
        />
        <StatsCard
          title="Offres d'emploi"
          value={stats.activeJobs}
          icon={Briefcase}
          trend={15}
          trendLabel="ce mois"
          color="cyan"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Registrations Chart */}
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Inscriptions sur 30 jours</CardTitle>
            <CardDescription>Nouveaux utilisateurs inscrits quotidiennement</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={registrationData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1B4FD8" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#1B4FD8" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                  labelStyle={{ fontWeight: 600, color: '#1e293b' }}
                />
                <Area
                  type="monotone"
                  dataKey="users"
                  stroke="#1B4FD8"
                  strokeWidth={2}
                  fill="url(#colorUsers)"
                  name="Inscriptions"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Profile Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Répartition des profils</CardTitle>
            <CardDescription>Distribution par type d&apos;utilisateur</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={profileData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {profileData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => [value.toLocaleString('fr-SN'), '']}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2 mt-2">
              {profileData.map((item) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="text-xs text-gray-600">{item.name}</span>
                  </div>
                  <span className="text-xs font-semibold text-gray-800">{item.value.toLocaleString('fr-SN')}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Recent Users */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base">Derniers inscrits</CardTitle>
              <CardDescription>5 utilisateurs récents</CardDescription>
            </div>
            <Link href="/users">
              <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 gap-1">
                Voir tout <ArrowRight className="w-3 h-3" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-gray-100">
              {recentUsers.map((user) => (
                <div key={user.id} className="flex items-center gap-3 px-6 py-3 hover:bg-gray-50 transition-colors">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-blue-100 text-blue-700 text-xs font-bold">
                      {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{user.firstName} {user.lastName}</p>
                    <p className="text-xs text-gray-500">{user.phone} · {user.region}</p>
                  </div>
                  <Badge variant={profileColors[user.profileType] as 'info' | 'warning' | 'success' | 'purple'} className="text-xs flex-shrink-0">
                    {profileLabels[user.profileType]}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Reports */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base">Signalements en attente</CardTitle>
              <CardDescription>5 derniers signalements</CardDescription>
            </div>
            <Link href="/infractions/reports">
              <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 gap-1">
                Voir tout <ArrowRight className="w-3 h-3" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-gray-100">
              {recentReports.map((report) => (
                <div key={report.id} className="flex items-center gap-3 px-6 py-3 hover:bg-gray-50 transition-colors">
                  <div className="w-9 h-9 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{report.type}</p>
                    <p className="text-xs text-gray-500 truncate">{report.user} · {report.location}</p>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <Badge variant="warning" className="text-xs">{report.plate}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Actions rapides</CardTitle>
          <CardDescription>Accéder rapidement aux fonctionnalités principales</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {[
              { label: 'Utilisateurs', href: '/users', icon: Users, color: 'bg-blue-50 text-blue-600 hover:bg-blue-100' },
              { label: 'Modules', href: '/modules', icon: BookOpen, color: 'bg-amber-50 text-amber-600 hover:bg-amber-100' },
              { label: 'Questions', href: '/quiz/questions', icon: Target, color: 'bg-purple-50 text-purple-600 hover:bg-purple-100' },
              { label: 'Signalements', href: '/infractions/reports', icon: AlertTriangle, color: 'bg-red-50 text-red-600 hover:bg-red-100' },
              { label: 'Emplois', href: '/jobs', icon: Briefcase, color: 'bg-cyan-50 text-cyan-600 hover:bg-cyan-100' },
              { label: 'Documents', href: '/documents', icon: Eye, color: 'bg-green-50 text-green-600 hover:bg-green-100' },
            ].map((action) => {
              const Icon = action.icon
              return (
                <Link key={action.href} href={action.href}>
                  <div className={`flex flex-col items-center gap-2 p-4 rounded-xl transition-colors cursor-pointer ${action.color}`}>
                    <Icon className="w-6 h-6" />
                    <span className="text-xs font-medium">{action.label}</span>
                  </div>
                </Link>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
