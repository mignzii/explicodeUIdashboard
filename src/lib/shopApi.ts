// ─────────────────────────────────────────────────────────────────────────────
// Boutique — le livre vendu dans l'app (fiche, prix, numéro de commande)
// ─────────────────────────────────────────────────────────────────────────────

import api from './api'

export interface Book {
  id: string
  title: string
  shortTitle: string
  edition: string
  description: string
  priceXof: number
  highlights: string[]
  imageUrl: string | null
  /** International, sans « + » : 221762430964 */
  orderPhone: string
  /** Tel qu'affiché : 76 243 09 64 */
  orderPhoneLabel: string
  isActive: boolean
  updatedAt: string
}

export type BookPayload = Partial<Omit<Book, 'id' | 'updatedAt'>>

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function unwrap(response: { data: any }): any {
  const d = response.data
  return d?.data ?? d
}

export const shopApi = {
  get: (): Promise<Book> => api.get('/shop/admin/book').then(unwrap),
  update: (payload: BookPayload): Promise<Book> => api.patch('/shop/book', payload).then(unwrap),
}
