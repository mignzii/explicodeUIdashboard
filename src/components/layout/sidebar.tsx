'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/lib/auth'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  LayoutDashboard,
  Users,
  BookOpen,
  HelpCircle,
  FileQuestion,
  AlertTriangle,
  ShieldAlert,
  MessageSquare,
  Briefcase,
  FileText,
  Truck,
  TrendingUp,
  Settings,
  LogOut,
  Shield,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  ClipboardList,
} from 'lucide-react'

interface NavItem {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

interface NavSection {
  title: string
  items: NavItem[]
}

const navSections: NavSection[] = [
  {
    title: 'APERÇU',
    items: [
      { label: 'Tableau de bord', href: '/', icon: LayoutDashboard },
    ],
  },
  {
    title: 'GESTION UTILISATEURS',
    items: [
      { label: 'Utilisateurs', href: '/users', icon: Users },
    ],
  },
  {
    title: 'CONTENU',
    items: [
      { label: 'Modules', href: '/modules', icon: BookOpen },
      { label: 'Quiz', href: '/quiz', icon: HelpCircle },
      { label: 'Catégories quiz', href: '/quiz/categories', icon: LayoutGrid },
      { label: 'Questions', href: '/quiz/questions', icon: FileQuestion },
      { label: 'Examens blancs', href: '/quiz/exam-blanc', icon: ClipboardList },
    ],
  },
  {
    title: 'RAPPORTS',
    items: [
      { label: 'Signalements', href: '/infractions/reports', icon: AlertTriangle },
      { label: 'Infractions', href: '/infractions', icon: ShieldAlert },
    ],
  },
  {
    title: 'COMMUNAUTÉ',
    items: [
      { label: 'Publications', href: '/community', icon: MessageSquare },
      { label: 'Emplois', href: '/jobs', icon: Briefcase },
    ],
  },
  {
    title: 'DOCUMENTS',
    items: [
      { label: 'Documents', href: '/documents', icon: FileText },
    ],
  },
  {
    title: 'OUTILS',
    items: [
      { label: 'Codes ADR', href: '/adr', icon: Truck },
      { label: 'Progression', href: '/progression', icon: TrendingUp },
    ],
  },
  {
    title: 'SYSTÈME',
    items: [
      { label: 'Paramètres', href: '/settings', icon: Settings },
    ],
  },
]

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname()
  const { user, logout } = useAuthStore()

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 h-screen bg-slate-900 text-white flex flex-col transition-all duration-300 z-30 shadow-xl',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className={cn(
        'flex items-center h-16 px-4 border-b border-slate-700',
        collapsed ? 'justify-center' : 'gap-3'
      )}>
        <div className="flex-shrink-0 w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center">
          <Shield className="w-5 h-5 text-white" />
        </div>
        {!collapsed && (
          <div>
            <p className="font-bold text-white text-sm leading-none">Explicode</p>
            <p className="text-xs text-slate-400 mt-0.5">Administration</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 scrollbar-thin">
        {navSections.map((section) => (
          <div key={section.title} className="mb-2">
            {!collapsed && (
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-2 mb-1 mt-4 first:mt-0">
                {section.title}
              </p>
            )}
            {collapsed && <div className="h-3" />}
            {section.items.map((item) => {
              const Icon = item.icon
              const active = isActive(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-2 py-2 rounded-lg transition-all duration-150 mb-0.5 group',
                    collapsed ? 'justify-center' : '',
                    active
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  )}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon className={cn('flex-shrink-0 w-5 h-5', active ? 'text-white' : 'text-slate-400 group-hover:text-white')} />
                  {!collapsed && (
                    <span className="text-sm font-medium truncate">{item.label}</span>
                  )}
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      {/* User + Logout */}
      <div className="border-t border-slate-700 p-3">
        {!collapsed && user && (
          <div className="flex items-center gap-3 px-2 py-2 mb-2">
            <Avatar className="h-8 w-8 bg-blue-600">
              <AvatarFallback className="bg-blue-600 text-white text-xs font-bold">
                {user.firstName.charAt(0)}{user.lastName.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user.firstName} {user.lastName}</p>
              <p className="text-xs text-slate-400 truncate">{user.role}</p>
            </div>
          </div>
        )}
        <button
          onClick={logout}
          className={cn(
            'flex items-center gap-3 px-2 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-red-600/20 hover:text-red-400 transition-all w-full',
            collapsed ? 'justify-center' : ''
          )}
          title={collapsed ? 'Déconnexion' : undefined}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span className="text-sm font-medium">Déconnexion</span>}
        </button>
        <button
          onClick={onToggle}
          className="mt-2 flex items-center gap-3 px-2 py-2 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition-all w-full justify-center"
          title={collapsed ? 'Développer' : 'Réduire'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          {!collapsed && <span className="text-xs">Réduire</span>}
        </button>
      </div>
    </aside>
  )
}
