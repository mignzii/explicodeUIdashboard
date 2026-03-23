import React from 'react'
import { cn } from '@/lib/utils'

interface PageHeaderProps {
  title: string
  subtitle?: string
  action?: React.ReactNode
  className?: string
}

export function PageHeader({ title, subtitle, action, className }: PageHeaderProps) {
  return (
    <div className={cn('flex items-start justify-between mb-6', className)}>
      <div>
        <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
        {subtitle && (
          <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
        )}
      </div>
      {action && (
        <div className="flex-shrink-0 ml-4">{action}</div>
      )}
    </div>
  )
}
