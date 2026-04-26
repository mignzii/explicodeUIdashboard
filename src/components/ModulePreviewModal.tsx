'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import {
  ChevronRight, ChevronDown, Clock, Headphones, Video,
  BookOpen, X, Layers,
} from 'lucide-react'
import { categoriesApi, lessonsApi, subLessonsApi, contentApi } from '@/lib/learningApi'
import type { Category, Lesson, SubLesson, LessonContent } from '@/types'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type Lang = 'FR' | 'WO' | 'PU' | 'SE' | 'JO'
const LANGS: Lang[] = ['FR', 'WO', 'PU', 'SE', 'JO']
const LANG_LABELS: Record<Lang, string> = { FR: '🇫🇷 FR', WO: 'WO', PU: 'PU', SE: 'SE', JO: 'JO' }

interface Props {
  moduleId: string
  moduleName: string
  moduleIcon: string
  moduleColor: string
  open: boolean
  onClose: () => void
}

type ContentMap = Record<string, Partial<Record<Lang, LessonContent | null>>>

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────

export function ModulePreviewModal({ moduleId, moduleName, moduleIcon, moduleColor, open, onClose }: Props) {
  const [categories, setCategories] = useState<Category[]>([])
  const [lessonsMap, setLessonsMap] = useState<Record<string, Lesson[]>>({})
  const [subLessonsMap, setSubLessonsMap] = useState<Record<string, SubLesson[]>>({})
  const [contentMap, setContentMap] = useState<ContentMap>({})
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set())
  const [expandedLessons, setExpandedLessons] = useState<Set<string>>(new Set())
  const [selectedSub, setSelectedSub] = useState<SubLesson | null>(null)
  const [selectedLang, setSelectedLang] = useState<Lang>('FR')
  const [loading, setLoading] = useState(false)
  const [loadingLessons, setLoadingLessons] = useState<Set<string>>(new Set())
  const [loadingContent, setLoadingContent] = useState(false)

  // ── Reset + load on open ──────────────────────────────────────────────────

  useEffect(() => {
    if (!open) {
      setCategories([])
      setLessonsMap({})
      setSubLessonsMap({})
      setContentMap({})
      setExpandedCats(new Set())
      setExpandedLessons(new Set())
      setSelectedSub(null)
      setSelectedLang('FR')
      return
    }
    loadCategories()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, moduleId])

  async function loadCategories() {
    setLoading(true)
    try {
      const cats = await categoriesApi.list(moduleId) as Category[]
      const sorted = [...cats].sort((a, b) => a.order - b.order)
      setCategories(sorted)
      // Auto-expand first category and select first sub-lesson
      if (sorted.length > 0) autoExpand(sorted[0])
    } finally {
      setLoading(false)
    }
  }

  async function autoExpand(cat: Category) {
    setExpandedCats(new Set([cat.id]))
    const lessons = await fetchLessons(cat.id)
    if (lessons.length > 0) {
      const first = lessons[0]
      setExpandedLessons(new Set([first.id]))
      const subs = await fetchSubLessons(first.id)
      if (subs.length > 0) selectSub(subs[0])
    }
  }

  // ── Data fetching helpers ─────────────────────────────────────────────────

  async function fetchLessons(catId: string): Promise<Lesson[]> {
    if (lessonsMap[catId]) return lessonsMap[catId]
    setLoadingLessons(prev => new Set(prev).add(catId))
    try {
      const lessons = await lessonsApi.list(catId) as Lesson[]
      const sorted = [...lessons].sort((a, b) => a.order - b.order)
      setLessonsMap(prev => ({ ...prev, [catId]: sorted }))
      return sorted
    } finally {
      setLoadingLessons(prev => { const s = new Set(prev); s.delete(catId); return s })
    }
  }

  async function fetchSubLessons(lessonId: string): Promise<SubLesson[]> {
    if (subLessonsMap[lessonId]) return subLessonsMap[lessonId]
    setLoadingLessons(prev => new Set(prev).add(lessonId))
    try {
      const subs = await subLessonsApi.list(lessonId) as SubLesson[]
      const sorted = [...subs].sort((a, b) => a.order - b.order)
      setSubLessonsMap(prev => ({ ...prev, [lessonId]: sorted }))
      return sorted
    } finally {
      setLoadingLessons(prev => { const s = new Set(prev); s.delete(lessonId); return s })
    }
  }

  const fetchContent = useCallback(async (sub: SubLesson) => {
    if (contentMap[sub.id]) return
    setLoadingContent(true)
    try {
      const results = await Promise.allSettled(
        LANGS.map(lang => contentApi.list(sub.id, lang) as Promise<LessonContent[]>)
      )
      const map: Partial<Record<Lang, LessonContent | null>> = {}
      LANGS.forEach((lang, i) => {
        const r = results[i]
        if (r.status === 'fulfilled') {
          const arr = r.value as LessonContent[]
          map[lang] = arr.length > 0 ? arr[0] : null
        } else {
          map[lang] = null
        }
      })
      setContentMap(prev => ({ ...prev, [sub.id]: map }))
    } finally {
      setLoadingContent(false)
    }
  }, [contentMap])

  // ── Sidebar interactions ──────────────────────────────────────────────────

  function toggleCat(cat: Category) {
    setExpandedCats(prev => {
      const s = new Set(prev)
      if (s.has(cat.id)) { s.delete(cat.id) } else {
        s.add(cat.id)
        fetchLessons(cat.id)
      }
      return s
    })
  }

  function toggleLesson(lesson: Lesson) {
    setExpandedLessons(prev => {
      const s = new Set(prev)
      if (s.has(lesson.id)) { s.delete(lesson.id) } else {
        s.add(lesson.id)
        fetchSubLessons(lesson.id)
      }
      return s
    })
  }

  function selectSub(sub: SubLesson) {
    setSelectedSub(sub)
    fetchContent(sub)
  }

  // ── Derived data ──────────────────────────────────────────────────────────

  const currentContent = selectedSub ? contentMap[selectedSub.id]?.[selectedLang] ?? undefined : undefined
  const langAvailability: Record<Lang, boolean | undefined> = LANGS.reduce((acc, lang) => {
    acc[lang] = selectedSub ? contentMap[selectedSub.id]?.[lang] !== undefined
      ? contentMap[selectedSub.id]?.[lang] !== null
      : undefined
    : undefined
    return acc
  }, {} as Record<Lang, boolean | undefined>)

  const totalLessons = Object.values(lessonsMap).reduce((sum, arr) => sum + arr.length, 0)

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] w-[1200px] h-[92vh] p-0 flex flex-col gap-0 overflow-hidden">

        {/* ── Header ── */}
        <div className="flex items-center gap-3 px-5 py-3.5 border-b bg-white flex-shrink-0">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
            style={{ backgroundColor: moduleColor + '22' }}
          >
            {moduleIcon}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-bold text-gray-900 text-base leading-tight truncate">{moduleName}</h2>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-gray-400 flex items-center gap-1">
                <Layers className="w-3 h-3" /> {categories.length} catégorie{categories.length !== 1 ? 's' : ''}
              </span>
              {totalLessons > 0 && (
                <span className="text-xs text-gray-400 flex items-center gap-1">
                  <BookOpen className="w-3 h-3" /> {totalLessons} leçon{totalLessons !== 1 ? 's' : ''}
                </span>
              )}
              <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: moduleColor + '18', color: moduleColor }}>
                Prévisualisation
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-red-50 hover:text-red-500 flex items-center justify-center text-gray-400 transition-colors flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── Body ── */}
        <div className="grid flex-1 overflow-hidden" style={{ gridTemplateColumns: '280px 1fr' }}>

          {/* ── Sidebar ── */}
          <div className="border-r bg-gray-50 overflow-hidden flex flex-col">
            <ScrollArea className="flex-1">
              <div className="p-2">
                {loading ? (
                  <div className="space-y-1.5 p-2">
                    {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-7 w-full rounded-md" />)}
                  </div>
                ) : categories.length === 0 ? (
                  <div className="text-center py-10 text-gray-400 text-sm">Aucune catégorie</div>
                ) : (
                  categories.map(cat => (
                    <div key={cat.id}>
                      {/* Catégorie */}
                      <button
                        onClick={() => toggleCat(cat)}
                        className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg hover:bg-white text-left transition-colors group"
                      >
                        {expandedCats.has(cat.id)
                          ? <ChevronDown className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                          : <ChevronRight className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />}
                        <span className="text-xs font-semibold text-gray-700 flex-1 truncate">{cat.title}</span>
                        {loadingLessons.has(cat.id) && (
                          <span className="w-3 h-3 border border-gray-300 border-t-blue-500 rounded-full animate-spin flex-shrink-0" />
                        )}
                      </button>

                      {/* Leçons */}
                      {expandedCats.has(cat.id) && (
                        <div className="ml-3 pl-2 border-l border-gray-200 mb-1">
                          {!lessonsMap[cat.id] ? null : lessonsMap[cat.id].length === 0 ? (
                            <p className="text-xs text-gray-400 px-2 py-1.5">Aucune leçon</p>
                          ) : lessonsMap[cat.id].map(lesson => (
                            <div key={lesson.id}>
                              {/* Leçon */}
                              <button
                                onClick={() => toggleLesson(lesson)}
                                className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-white text-left transition-colors"
                              >
                                {expandedLessons.has(lesson.id)
                                  ? <ChevronDown className="w-3 h-3 text-gray-400 flex-shrink-0" />
                                  : <ChevronRight className="w-3 h-3 text-gray-400 flex-shrink-0" />}
                                <span className="text-[10px] text-gray-500 flex-shrink-0">{lesson.icon ?? '📖'}</span>
                                <span className="text-xs text-gray-600 flex-1 truncate">{lesson.title}</span>
                                {loadingLessons.has(lesson.id) && (
                                  <span className="w-3 h-3 border border-gray-300 border-t-blue-500 rounded-full animate-spin flex-shrink-0" />
                                )}
                              </button>

                              {/* Sous-leçons */}
                              {expandedLessons.has(lesson.id) && (
                                <div className="ml-3 pl-2 border-l border-gray-100 mb-1">
                                  {!subLessonsMap[lesson.id] ? null : subLessonsMap[lesson.id].length === 0 ? (
                                    <p className="text-xs text-gray-400 px-2 py-1">Aucune sous-leçon</p>
                                  ) : subLessonsMap[lesson.id].map(sub => (
                                    <button
                                      key={sub.id}
                                      onClick={() => selectSub(sub)}
                                      className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-left transition-all ${
                                        selectedSub?.id === sub.id
                                          ? 'bg-blue-50 border-l-2 border-blue-500 -ml-px pl-[7px]'
                                          : 'hover:bg-white'
                                      }`}
                                    >
                                      <span className={`text-[10px] font-bold w-5 text-center flex-shrink-0 ${
                                        selectedSub?.id === sub.id ? 'text-blue-500' : 'text-gray-400'
                                      }`}>
                                        {String(sub.number).padStart(2, '0')}
                                      </span>
                                      <span className={`text-xs flex-1 truncate ${
                                        selectedSub?.id === sub.id ? 'text-blue-700 font-medium' : 'text-gray-500'
                                      }`}>
                                        {sub.title}
                                      </span>
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>

          {/* ── Content panel ── */}
          <div className="flex flex-col overflow-hidden bg-[#0d1424]">

            {/* Lang bar */}
            <div className="flex items-center gap-2 px-5 py-2.5 border-b border-white/10 flex-shrink-0 bg-[#0f172a]">
              <span className="text-xs text-slate-500 font-medium mr-1">Langue</span>
              {LANGS.map(lang => {
                const available = langAvailability[lang]
                const isActive = selectedLang === lang
                return (
                  <button
                    key={lang}
                    onClick={() => setSelectedLang(lang)}
                    disabled={!selectedSub}
                    className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30'
                        : available === true
                          ? 'bg-slate-700 text-slate-300 hover:bg-slate-600 border border-slate-600'
                          : available === false
                            ? 'text-slate-600 border border-slate-800 italic'
                            : 'text-slate-600 border border-slate-800'
                    }`}
                  >
                    {LANG_LABELS[lang]}
                  </button>
                )
              })}
              {currentContent?.readMinutes && (
                <div className="ml-auto flex items-center gap-1.5 text-slate-500 text-xs">
                  <Clock className="w-3.5 h-3.5" />
                  {currentContent.readMinutes} min
                </div>
              )}
            </div>

            {/* Phone zone */}
            <div className="flex-1 overflow-y-auto flex items-start justify-center py-8 px-6"
              style={{ background: 'radial-gradient(ellipse at 50% 20%, rgba(27,79,216,0.06) 0%, transparent 65%)' }}>
              {!selectedSub ? (
                <EmptyState />
              ) : (
                <PhoneFrame
                  sub={selectedSub}
                  content={currentContent}
                  loading={loadingContent}
                  moduleColor={moduleColor}
                />
              )}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 px-5 py-2 border-t border-white/5 bg-[#0a0f1a] flex-shrink-0">
              <div className="flex items-center gap-1.5 text-xs text-slate-600">
                <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
                Langue active
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-600">
                <span className="w-2 h-2 rounded-full bg-slate-600 inline-block" />
                Contenu disponible
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-700 italic">
                <span className="w-2 h-2 rounded-full bg-slate-800 inline-block" />
                Non renseigné
              </div>
              <span className="ml-auto text-xs text-slate-700">Cliquer sur une sous-leçon pour la prévisualiser</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Empty state
// ─────────────────────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 text-slate-600 py-20">
      <div className="w-16 h-16 rounded-full bg-slate-800/60 flex items-center justify-center">
        <BookOpen className="w-8 h-8 text-slate-600" />
      </div>
      <p className="text-sm text-slate-500">Sélectionne une sous-leçon dans la sidebar</p>
      <p className="text-xs text-slate-700">Le rendu apparaîtra ici, fidèle à l'app mobile</p>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Phone frame
// ─────────────────────────────────────────────────────────────────────────────

interface PhoneFrameProps {
  sub: SubLesson
  content: LessonContent | null | undefined
  loading: boolean
  moduleColor: string
}

function PhoneFrame({ sub, content, loading, moduleColor }: PhoneFrameProps) {
  return (
    <div className="w-[320px] flex-shrink-0">
      {/* Phone shell */}
      <div className="bg-[#1c2333] rounded-[36px] p-3 border-2 border-slate-700 shadow-2xl shadow-black/60 relative"
        style={{ boxShadow: '0 30px 80px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.04)' }}>
        {/* Notch */}
        <div className="w-16 h-[5px] bg-[#0f172a] rounded-full mx-auto mb-3" />

        {/* Screen */}
        <div className="bg-[#0f172a] rounded-[24px] overflow-hidden">
          {/* Status bar */}
          <div className="flex justify-between items-center px-4 pt-3 pb-1">
            <span className="text-[10px] text-slate-500 font-medium">9:41</span>
            <span className="text-[10px] text-slate-500">●●●● WiFi 🔋</span>
          </div>

          {/* App bar */}
          <div className="flex items-center justify-between px-4 pb-3 border-b border-white/5">
            <span className="text-[10px] text-blue-500">← Retour</span>
            <span className="text-xs font-bold text-white truncate max-w-[160px]">{sub.title}</span>
            <span className="text-slate-600 text-base">···</span>
          </div>

          {/* Content */}
          <div className="px-4 py-4 space-y-4">

            {loading ? (
              <div className="space-y-3">
                <Skeleton className="h-[130px] w-full rounded-xl bg-slate-800" />
                <Skeleton className="h-4 w-2/3 rounded bg-slate-800" />
                <Skeleton className="h-3 w-full rounded bg-slate-800" />
                <Skeleton className="h-3 w-5/6 rounded bg-slate-800" />
                <Skeleton className="h-3 w-4/6 rounded bg-slate-800" />
              </div>
            ) : (
              <>
                {/* Image */}
                {sub.imageUrl ? (
                  <img
                    src={sub.imageUrl}
                    alt={sub.title}
                    className="w-full h-[130px] object-cover rounded-xl"
                  />
                ) : (
                  <div
                    className="w-full h-[130px] rounded-xl flex items-center justify-center"
                    style={{ background: `linear-gradient(135deg, ${moduleColor}22, ${moduleColor}08)` }}
                  >
                    <span className="text-5xl opacity-60">📖</span>
                  </div>
                )}

                {/* Subtitle + title */}
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-widest mb-1" style={{ color: moduleColor }}>
                    Sous-leçon {String(sub.number).padStart(2, '0')}
                  </p>
                  <h3 className="text-[15px] font-bold text-white leading-snug">{sub.title}</h3>
                </div>

                {/* Description */}
                {content?.description ? (
                  <div>
                    <p className="text-[9px] text-slate-500 uppercase tracking-wider font-semibold mb-1.5">Description</p>
                    <p className="text-[11px] text-slate-400 leading-relaxed">{content.description}</p>
                  </div>
                ) : (
                  <div className="bg-slate-800/60 rounded-lg px-3 py-2.5 border border-slate-700/50">
                    <p className="text-[10px] text-slate-600 italic text-center">Aucun contenu pour cette langue</p>
                  </div>
                )}

                {/* Bullets */}
                {content?.bullets && content.bullets.length > 0 && (
                  <div>
                    <p className="text-[9px] text-slate-500 uppercase tracking-wider font-semibold mb-2">Points clés</p>
                    <ul className="space-y-1.5">
                      {content.bullets.map((b, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="w-[5px] h-[5px] rounded-full flex-shrink-0 mt-[5px]" style={{ backgroundColor: moduleColor }} />
                          <span className="text-[11px] text-slate-300 leading-relaxed">{b}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Did you know */}
                {content?.didYouKnow && (
                  <div className="rounded-lg px-3 py-3 border-l-[3px] border-amber-400"
                    style={{ background: 'linear-gradient(135deg, rgba(30,41,59,0.8), rgba(22,32,50,0.8))' }}>
                    <p className="text-[10px] font-bold text-amber-400 mb-1 flex items-center gap-1">
                      💡 Le saviez-vous ?
                    </p>
                    <p className="text-[10px] text-slate-400 leading-relaxed">{content.didYouKnow}</p>
                  </div>
                )}

                {/* Audio */}
                {content?.audioUrl && (
                  <div>
                    <p className="text-[9px] text-slate-500 uppercase tracking-wider font-semibold mb-2">Audio</p>
                    <div className="flex items-center gap-3 bg-slate-800 rounded-xl px-3 py-2.5">
                      <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 shadow-md shadow-blue-500/30">
                        <Headphones className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] text-slate-300 font-medium">Écouter la leçon</p>
                        <div className="mt-1.5 h-[3px] bg-slate-700 rounded-full">
                          <div className="h-full w-2/5 rounded-full bg-blue-500" />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Video */}
                {content?.hasVideo && content.videoUrl && (
                  <div className="flex items-center gap-2.5 bg-slate-800/60 border border-slate-700/60 rounded-xl px-3 py-2.5">
                    <div className="w-7 h-7 rounded-lg bg-red-500/20 flex items-center justify-center flex-shrink-0">
                      <Video className="w-4 h-4 text-red-400" />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-300 font-medium">Vidéo disponible</p>
                      <p className="text-[9px] text-slate-600 truncate max-w-[200px]">{content.videoUrl}</p>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Home bar */}
          <div className="w-16 h-1 bg-slate-700 rounded-full mx-auto my-3" />
        </div>
      </div>
    </div>
  )
}
