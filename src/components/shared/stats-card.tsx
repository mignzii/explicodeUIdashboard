import React from 'react'
import { cn } from '@/lib/utils'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface StatsCardProps {
  title: string
  value: string | number
  icon: React.ComponentType<{ className?: string }>
  trend?: number
  trendLabel?: string
  color?: 'blue' | 'green' | 'red' | 'amber' | 'purple' | 'cyan' | 'pink' | 'indigo'
  subtitle?: string
}

const colorMap = {
  blue: {
    bg: 'bg-blue-50',
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    border: 'border-blue-100',
    value: 'text-blue-700',
  },
  green: {
    bg: 'bg-emerald-50',
    iconBg: 'bg-emerald-100',
    iconColor: 'text-emerald-600',
    border: 'border-emerald-100',
    value: 'text-emerald-700',
  },
  red: {
    bg: 'bg-red-50',
    iconBg: 'bg-red-100',
    iconColor: 'text-red-600',
    border: 'border-red-100',
    value: 'text-red-700',
  },
  amber: {
    bg: 'bg-amber-50',
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600',
    border: 'border-amber-100',
    value: 'text-amber-700',
  },
  purple: {
    bg: 'bg-purple-50',
    iconBg: 'bg-purple-100',
    iconColor: 'text-purple-600',
    border: 'border-purple-100',
    value: 'text-purple-700',
  },
  cyan: {
    bg: 'bg-cyan-50',
    iconBg: 'bg-cyan-100',
    iconColor: 'text-cyan-600',
    border: 'border-cyan-100',
    value: 'text-cyan-700',
  },
  pink: {
    bg: 'bg-pink-50',
    iconBg: 'bg-pink-100',
    iconColor: 'text-pink-600',
    border: 'border-pink-100',
    value: 'text-pink-700',
  },
  indigo: {
    bg: 'bg-indigo-50',
    iconBg: 'bg-indigo-100',
    iconColor: 'text-indigo-600',
    border: 'border-indigo-100',
    value: 'text-indigo-700',
  },
}

export function StatsCard({
  title,
  value,
  icon: Icon,
  trend,
  trendLabel,
  color = 'blue',
  subtitle,
}: StatsCardProps) {
  const colors = colorMap[color]
  const isPositive = trend !== undefined && trend >= 0

  return (
    <div className={cn(
      'bg-white rounded-xl border p-5 shadow-sm hover:shadow-md transition-shadow',
      colors.border
    )}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
          <p className={cn('text-3xl font-bold', colors.value)}>{value}</p>
          {subtitle && (
            <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
          )}
        </div>
        <div className={cn('p-3 rounded-xl', colors.iconBg)}>
          <Icon className={cn('w-6 h-6', colors.iconColor)} />
        </div>
      </div>
      {trend !== undefined && (
        <div className="mt-3 flex items-center gap-1">
          {isPositive ? (
            <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
          ) : (
            <TrendingDown className="w-3.5 h-3.5 text-red-500" />
          )}
          <span className={cn('text-xs font-medium', isPositive ? 'text-emerald-600' : 'text-red-600')}>
            {isPositive ? '+' : ''}{trend}%
          </span>
          {trendLabel && (
            <span className="text-xs text-gray-400">{trendLabel}</span>
          )}
        </div>
      )}
    </div>
  )
}
