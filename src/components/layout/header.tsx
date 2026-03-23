'use client'

import React, { useState } from 'react'
import { usePathname } from 'next/navigation'
import { Bell, Search, ChevronDown, User, LogOut, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuthStore } from '@/lib/auth'
import { useRouter } from 'next/navigation'

const pageNames: Record<string, string> = {
  '/': 'Tableau de bord',
  '/users': 'Gestion des utilisateurs',
  '/modules': 'Modules de formation',
  '/quiz': 'Quiz et examens',
  '/quiz/questions': 'Gestion des questions',
  '/infractions': 'Catalogue des infractions',
  '/infractions/reports': 'Signalements d\'infractions',
  '/community': 'Communauté',
  '/jobs': 'Offres d\'emploi',
  '/documents': 'Documents',
  '/adr': 'Codes ADR',
  '/progression': 'Analyse & Progression',
  '/settings': 'Paramètres',
}

interface HeaderProps {
  sidebarCollapsed: boolean
}

export function Header({ sidebarCollapsed }: HeaderProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuthStore()
  const [notifCount] = useState(3)

  const pageTitle = pageNames[pathname] || 'Administration'

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  return (
    <header className={`fixed top-0 right-0 h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 z-20 transition-all duration-300 ${sidebarCollapsed ? 'left-16' : 'left-64'}`}>
      {/* Page title */}
      <div>
        <h1 className="text-lg font-semibold text-gray-900">{pageTitle}</h1>
        <p className="text-xs text-gray-400 hidden sm:block">PermisXpress Administration</p>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Rechercher..."
            className="pl-9 w-56 h-9 text-sm bg-gray-50 border-gray-200"
          />
        </div>

        {/* Notifications */}
        <div className="relative">
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="w-5 h-5 text-gray-600" />
            {notifCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                {notifCount}
              </span>
            )}
          </Button>
        </div>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-blue-600 text-white text-xs font-bold">
                  {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-medium text-gray-900 leading-none">{user?.firstName} {user?.lastName}</p>
                <p className="text-xs text-gray-500 mt-0.5">{user?.role}</p>
              </div>
              <ChevronDown className="w-4 h-4 text-gray-400 hidden sm:block" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel>Mon compte</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" />
              Profil
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push('/settings')}>
              <Settings className="mr-2 h-4 w-4" />
              Paramètres
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600">
              <LogOut className="mr-2 h-4 w-4" />
              Déconnexion
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
