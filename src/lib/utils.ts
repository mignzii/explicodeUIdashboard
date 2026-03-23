import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date, formatStr: string = 'dd/MM/yyyy'): string {
  const d = new Date(date)
  const day = d.getDate().toString().padStart(2, '0')
  const month = (d.getMonth() + 1).toString().padStart(2, '0')
  const year = d.getFullYear()
  const hours = d.getHours().toString().padStart(2, '0')
  const minutes = d.getMinutes().toString().padStart(2, '0')

  return formatStr
    .replace('dd', day)
    .replace('MM', month)
    .replace('yyyy', year.toString())
    .replace('HH', hours)
    .replace('mm', minutes)
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('fr-SN').format(amount) + ' FCFA'
}

export function formatPhone(phone: string): string {
  // Format Senegalese phone: +221 XX XXX XX XX
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.startsWith('221') && cleaned.length === 12) {
    return `+221 ${cleaned.slice(3, 5)} ${cleaned.slice(5, 8)} ${cleaned.slice(8, 10)} ${cleaned.slice(10, 12)}`
  }
  return phone
}

export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str
  return str.slice(0, maxLength) + '...'
}

export function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
}
