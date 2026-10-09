'use client'

import React from 'react'
import { Quote, X } from 'lucide-react'
import { THOUGHT_BACKGROUNDS, type ThoughtForm } from '@/lib/thoughtsForm'

const NAVY = '#0F1B33'
const LIME = '#C5E128'

/**
 * Le lecteur de l'app en petit : ce que verra l'apprenant. Dessiné en 390×844
 * puis réduit, pour que les proportions soient celles du vrai téléphone.
 */
export function ThoughtPhonePreview({ form }: { form: ThoughtForm }) {
  const isPhoto = form.kind === 'photo'
  const style = THOUGHT_BACKGROUNDS.find(b => b.value === form.background) ?? THOUGHT_BACKGROUNDS[0]
  const bg = isPhoto ? NAVY : style.bg
  const fg = isPhoto ? '#FFFFFF' : style.fg
  const track = fg === '#FFFFFF' ? 'rgba(255,255,255,0.3)' : 'rgba(15,27,51,0.24)'

  return (
    <div
      className="relative flex-shrink-0 overflow-hidden rounded-[26px] border border-gray-200 shadow-lg"
      style={{ width: 234, height: 506 }}
      aria-label="Aperçu de la pensée dans l’app"
    >
      <div style={{ width: 390, height: 844, transform: 'scale(0.6)', transformOrigin: 'top left', position: 'relative', overflow: 'hidden', background: bg, color: fg, fontFamily: 'Inter, sans-serif' }}>
        {isPhoto && form.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={form.imageUrl} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
        )}

        <div style={{ position: 'absolute', left: 12, right: 12, top: 24, display: 'flex', gap: 4 }}>
          <span style={{ flexGrow: 1, height: 3, borderRadius: 3, background: track, overflow: 'hidden' }}>
            <span style={{ display: 'block', height: '100%', width: '40%', background: fg }} />
          </span>
        </div>

        <div style={{ position: 'absolute', left: 16, right: 8, top: 38, display: 'flex', alignItems: 'center', gap: 10, height: 52 }}>
          <span style={{ width: 36, height: 36, borderRadius: '50%', background: LIME, color: NAVY, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: '"Baloo 2", sans-serif', fontWeight: 600 }}>E</span>
          <span style={{ fontFamily: '"Baloo 2", sans-serif', fontSize: 16, fontWeight: 600 }}>Explicode</span>
          <span style={{ flexGrow: 1, fontSize: 13, fontWeight: 500 }}>maintenant</span>
          <span style={{ width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={22} /></span>
        </div>

        {isPhoto ? (
          <section style={{ position: 'absolute', left: 0, right: 0, bottom: 0, background: NAVY, borderRadius: '28px 28px 0 0', padding: '26px 28px 46px', display: form.caption ? 'block' : 'none' }}>
            <Quote size={26} color={LIME} />
            <p style={{ margin: '12px 0 0', fontFamily: '"Baloo 2", sans-serif', fontSize: 26, fontWeight: 600, lineHeight: 1.18, overflowWrap: 'anywhere' }}>{form.caption}</p>
          </section>
        ) : (
          <main style={{ position: 'absolute', left: 0, right: 0, top: 132, bottom: 60, padding: '0 28px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 22 }}>
            <Quote size={34} color={style.accent} />
            <p style={{ margin: 0, fontFamily: '"Baloo 2", sans-serif', fontSize: 36, fontWeight: 600, lineHeight: 1.14, letterSpacing: '-0.01em', overflowWrap: 'anywhere' }}>
              {form.text || 'Ta pensée apparaîtra ici'}
            </p>
          </main>
        )}
      </div>
    </div>
  )
}
