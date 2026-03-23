'use client'

import React, { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import {
  Target, Clock, TrendingUp, CheckCircle, FileQuestion, BookOpen,
  ClipboardList, LayoutGrid, RefreshCw,
} from 'lucide-react'
import { StatsCard } from '@/components/shared/stats-card'
import { PageHeader } from '@/components/shared/page-header'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/shared/data-table'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { ColumnDef } from '@tanstack/react-table'
import { quizCategoriesApi, quizQuestionsApi, examBlancApi, quizAttemptsApi } from '@/lib/quizApi'
import type { QuizCategory, ExamBlanc, QuizAttempt, QuizStats } from '@/types'
import toast from 'react-hot-toast'

const CATEGORY_COLORS = [
  '#1B4FD8', '#10B981', '#F59E0B', '#EF4444',
  '#8B5CF6', '#64748B', '#16A34A', '#EC4899',
]

export default function QuizPage() {
  const [loading, setLoading] = useState(true)
  const [categories, setCategories] = useState<QuizCategory[]>([])
  const [examBlancs, setExamBlancs] = useState<ExamBlanc[]>([])
  const [attempts, setAttempts] = useState<QuizAttempt[]>([])
  const [stats, setStats] = useState<QuizStats | null>(null)
  const [totalQuestions, setTotalQuestions] = useState(0)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [cats, questionsRes, exams, history, quizStats] = await Promise.all([
        quizCategoriesApi.list(),
        quizQuestionsApi.list({ page: 1, limit: 1 }),
        examBlancApi.list(),
        quizAttemptsApi.getGlobalHistory(20),
        quizAttemptsApi.getGlobalStats(),
      ])
      setCategories(cats)
      setTotalQuestions(questionsRes?.meta?.total ?? 0)
      setExamBlancs(exams)
      setAttempts(history)
      setStats(quizStats)
    } catch {
      toast.error('Erreur lors du chargement des données')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const chartData = categories.map((cat, i) => ({
    category: cat.title.length > 12 ? cat.title.slice(0, 12) + '…' : cat.title,
    questions: cat.questions?.length ?? 0,
    color: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
  }))

  const attemptColumns: ColumnDef<QuizAttempt>[] = [
    {
      id: 'user',
      header: 'Utilisateur',
      cell: ({ row }) => {
        const u = row.original.user
        if (!u) return <span className="text-xs text-gray-400">{row.original.userId.slice(0, 8)}…</span>
        return (
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-blue-100 text-blue-700 text-xs font-bold">
                {u.firstName.charAt(0)}{u.lastName.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium">{u.firstName} {u.lastName}</span>
          </div>
        )
      },
    },
    {
      accessorKey: 'categoryId',
      header: 'Catégorie',
      cell: ({ getValue }) => {
        const cat = categories.find(c => c.id === getValue<string>())
        const val = getValue<string | null>()
        return <span className="text-sm text-gray-600">{cat?.title ?? (val ? val.slice(0, 10) + '…' : <span className="italic text-gray-400">Exam blanc</span>)}</span>
      },
    },
    {
      accessorKey: 'score',
      header: 'Score',
      cell: ({ row }) => {
        const passed = row.original.score >= 70
        return (
          <div className="flex items-center gap-1">
            <span className={`font-bold text-sm ${passed ? 'text-emerald-600' : 'text-red-500'}`}>
              {row.original.score}%
            </span>
            <span className="text-xs text-gray-400">
              ({row.original.correctCount}/{row.original.totalCount})
            </span>
          </div>
        )
      },
    },
    {
      accessorKey: 'durationSeconds',
      header: 'Durée',
      cell: ({ getValue }) => {
        const s = getValue<number>() ?? 0
        return <span className="text-sm text-gray-500">{Math.floor(s / 60)}m {s % 60}s</span>
      },
    },
    {
      accessorKey: 'isExamBlanc',
      header: 'Type',
      cell: ({ getValue }) => (
        <Badge variant={getValue<boolean>() ? 'default' : 'outline'} className="text-xs">
          {getValue<boolean>() ? 'Exam blanc' : 'Catégorie'}
        </Badge>
      ),
    },
    {
      accessorKey: 'completedAt',
      header: 'Date',
      cell: ({ getValue }) => (
        <span className="text-xs text-gray-500">
          {new Date(getValue<string>()).toLocaleDateString('fr-SN')}
        </span>
      ),
    },
    {
      id: 'result',
      header: 'Résultat',
      cell: ({ row }) => {
        const passed = row.original.score >= 70
        return (
          <Badge variant={passed ? 'success' : 'destructive'}>
            {passed ? 'Réussi' : 'Échoué'}
          </Badge>
        )
      },
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quiz et examens"
        subtitle="Vue d'ensemble, statistiques et tentatives"
        action={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={load} className="gap-2">
              <RefreshCw className="w-4 h-4" /> Actualiser
            </Button>
            <Link href="/quiz/questions">
              <Button className="gap-2">
                <FileQuestion className="w-4 h-4" /> Questions
              </Button>
            </Link>
          </div>
        }
      />

      {/* Quick nav */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Catégories', href: '/quiz/categories', icon: LayoutGrid, color: 'text-blue-600 bg-blue-50' },
          { label: 'Questions', href: '/quiz/questions', icon: FileQuestion, color: 'text-emerald-600 bg-emerald-50' },
          { label: 'Exam Blancs', href: '/quiz/exam-blanc', icon: ClipboardList, color: 'text-amber-600 bg-amber-50' },
          { label: 'Modules', href: '/modules', icon: BookOpen, color: 'text-purple-600 bg-purple-50' },
        ].map(item => (
          <Link key={item.href} href={item.href}>
            <div className="bg-white rounded-xl border p-4 flex items-center gap-3 hover:shadow-sm transition-shadow cursor-pointer">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${item.color}`}>
                <item.icon className="w-5 h-5" />
              </div>
              <span className="text-sm font-medium text-gray-700">{item.label}</span>
            </div>
          </Link>
        ))}
      </div>

      {/* Stats cards */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatsCard title="Total questions" value={totalQuestions.toLocaleString('fr-SN')} icon={FileQuestion} color="blue" />
          <StatsCard title="Catégories actives" value={categories.filter(c => c.isActive).length} icon={LayoutGrid} color="green" />
          <StatsCard title="Exam blancs actifs" value={examBlancs.filter(e => e.isActive).length} icon={ClipboardList} color="amber" />
          <StatsCard
            title="Score moyen"
            value={stats ? `${stats.averageScore}%` : '—'}
            icon={TrendingUp}
            color="purple"
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Catégories de quiz</CardTitle>
            <CardDescription>Questions par catégorie</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-56 w-full" />
            ) : chartData.length === 0 ? (
              <div className="h-56 flex items-center justify-center text-gray-400 text-sm">
                Aucune catégorie —{' '}
                <Link href="/quiz/categories" className="text-blue-600 ml-1 underline">En créer une</Link>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="category" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                  <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} allowDecimals={false} />
                  <Tooltip
                    formatter={(v: number) => [v, 'Questions']}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
                  />
                  <Bar dataKey="questions" radius={[5, 5, 0, 0]}>
                    {chartData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Exam blancs list */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base">Examens blancs</CardTitle>
              <CardDescription>Actifs dans l&apos;application</CardDescription>
            </div>
            <Link href="/quiz/exam-blanc">
              <Button variant="outline" size="sm">Gérer</Button>
            </Link>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-14 rounded-lg" />)}
              </div>
            ) : examBlancs.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-sm">
                Aucun exam blanc —{' '}
                <Link href="/quiz/exam-blanc" className="text-blue-600 underline">En créer un</Link>
              </div>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {examBlancs.map(eb => (
                  <div key={eb.id} className="flex items-center justify-between p-3 rounded-lg border bg-gray-50/50">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{eb.title}</p>
                      <p className="text-xs text-gray-500">
                        {eb.questionCount} q · {eb.durationMinutes}min · seuil {eb.passingScore}%
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Badge variant={eb.mode === 'random' ? 'default' : 'outline'} className="text-xs">
                        {eb.mode}
                      </Badge>
                      <Badge variant={eb.isActive ? 'success' : 'secondary'} className="text-xs">
                        {eb.isActive ? 'Actif' : 'Inactif'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Exam blanc stats */}
      {stats?.examBlanc && stats.examBlanc.attempts > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatsCard title="Tentatives exam blanc" value={stats.examBlanc.attempts} icon={Target} color="indigo" />
          <StatsCard title="Score moyen exam blanc" value={`${stats.examBlanc.averageScore}%`} icon={TrendingUp} color="cyan" />
          <StatsCard title="Meilleur score exam blanc" value={`${stats.examBlanc.bestScore}%`} icon={CheckCircle} color="green" />
        </div>
      )}

      {/* Recent attempts */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-base">Dernières tentatives</CardTitle>
            <CardDescription>20 dernières tentatives de tous les utilisateurs</CardDescription>
          </div>
          <Clock className="w-4 h-4 text-gray-400" />
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-40 w-full" />
          ) : (
            <DataTable
              columns={attemptColumns}
              data={attempts}
              searchPlaceholder="Rechercher…"
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
