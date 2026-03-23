'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Heart, MessageCircle, Flag, Trash2, Eye, AlertTriangle, TrendingUp, MessageSquare } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { StatsCard } from '@/components/shared/stats-card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from '@/components/ui/alert-dialog'
import { Post } from '@/types'
import { postsApi } from '@/lib/communityApi'
import toast from 'react-hot-toast'

export default function CommunityPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPost, setSelectedPost] = useState<Post | null>(null)
  const [flaggedOnly, setFlaggedOnly] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const loadPosts = useCallback(async () => {
    try {
      const data = await postsApi.list()
      setPosts(data)
    } catch {
      toast.error('Erreur de chargement')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadPosts() }, [loadPosts])

  const filteredPosts = posts.filter(p => {
    if (flaggedOnly && !p.isFlagged) return false
    if (searchQuery && !p.content.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  })

  const toggleFlag = async (post: Post) => {
    const newFlagged = !post.isFlagged
    try {
      const updated = await postsApi.flag(post.id, newFlagged)
      setPosts(prev => prev.map(p => p.id === post.id ? updated : p))
      toast.success(newFlagged ? 'Publication signalée' : 'Publication démarquée')
    } catch {
      toast.error('Erreur lors de la mise à jour')
    }
  }

  const deletePost = async (id: string) => {
    try {
      await postsApi.delete(id)
      setPosts(prev => prev.filter(p => p.id !== id))
      if (selectedPost?.id === id) setSelectedPost(null)
      toast.success('Publication supprimée')
    } catch {
      toast.error('Erreur lors de la suppression')
    }
  }

  const stats = {
    total: posts.length,
    today: posts.filter(p => new Date(p.createdAt).toDateString() === new Date().toDateString()).length,
    mostLiked: posts.length > 0 ? Math.max(...posts.map(p => p.likes)) : 0,
    flagged: posts.filter(p => p.isFlagged).length,
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestion de la communauté"
        subtitle="Modérez les publications de la communauté"
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatsCard title="Total publications" value={stats.total} icon={MessageSquare} color="blue" />
        <StatsCard title="Publiées aujourd'hui" value={stats.today} icon={TrendingUp} color="green" />
        <StatsCard title="Plus aimée" value={`${stats.mostLiked} ❤️`} icon={Heart} color="pink" />
        <StatsCard title="Signalées" value={stats.flagged} icon={Flag} color="red" />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border p-4 flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Switch checked={flaggedOnly} onCheckedChange={setFlaggedOnly} />
          <Label>Signalements seulement</Label>
        </div>
        <input
          type="text"
          placeholder="Rechercher dans les publications..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="flex-1 max-w-xs h-9 px-3 text-sm rounded-md border border-input bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <span className="text-sm text-gray-500">{filteredPosts.length} résultats</span>
      </div>

      {/* Posts Grid */}
      {loading ? (
        <div className="bg-white rounded-xl border p-16 text-center text-gray-400 text-sm">Chargement...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredPosts.map(post => (
            <div
              key={post.id}
              className={`bg-white rounded-xl border shadow-sm ${post.isFlagged ? 'border-red-300 bg-red-50/30' : ''}`}
            >
              {post.isFlagged && (
                <div className="bg-red-50 border-b border-red-200 px-4 py-2 flex items-center gap-2 rounded-t-xl">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                  <span className="text-xs font-medium text-red-600">{post.flagCount} signalement(s) utilisateur</span>
                </div>
              )}
              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="bg-blue-100 text-blue-700 text-xs font-bold">
                        {post.user?.firstName?.charAt(0)}{post.user?.lastName?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{post.user?.firstName} {post.user?.lastName}</p>
                      <p className="text-xs text-gray-400">{post.user?.region} · {new Date(post.createdAt).toLocaleDateString('fr-SN')}</p>
                    </div>
                  </div>
                  <Badge variant={
                    post.user?.profileType === 'APPRENANT' ? 'info' :
                    post.user?.profileType === 'CHAUFFEUR' ? 'warning' :
                    post.user?.profileType === 'AGENT_ROUTIER' ? 'success' : 'purple'
                  } className="text-xs flex-shrink-0">
                    {post.user?.profileType === 'APPRENANT' ? 'Apprenant' :
                     post.user?.profileType === 'CHAUFFEUR' ? 'Chauffeur' :
                     post.user?.profileType === 'AGENT_ROUTIER' ? 'Agent' : 'Auto-école'}
                  </Badge>
                </div>

                <p className="text-sm text-gray-700 mt-3 line-clamp-3">{post.content}</p>

                {post.images.length > 0 && (
                  <div className="flex gap-1 mt-2">
                    {post.images.slice(0, 3).map((_, i) => (
                      <div key={i} className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 text-xs border">
                        📷
                      </div>
                    ))}
                    {post.images.length > 3 && (
                      <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center text-xs font-bold text-gray-500 border">
                        +{post.images.length - 3}
                      </div>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between mt-4 pt-3 border-t">
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1"><Heart className="w-4 h-4 text-red-400" /> {post.likes}</span>
                    <span className="flex items-center gap-1"><MessageCircle className="w-4 h-4 text-blue-400" /> {post.commentsCount}</span>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon-sm" onClick={() => setSelectedPost(post)} title="Voir">
                      <Eye className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className={post.isFlagged ? 'text-red-500' : 'text-gray-400'}
                      onClick={() => toggleFlag(post)}
                      title={post.isFlagged ? 'Démarquer' : 'Signaler'}
                    >
                      <Flag className="w-3.5 h-3.5" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon-sm" className="text-red-400 hover:text-red-600">
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Supprimer la publication</AlertDialogTitle>
                          <AlertDialogDescription>Cette publication sera définitivement supprimée.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Annuler</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deletePost(post.id)} className="bg-red-600 hover:bg-red-700">Supprimer</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && filteredPosts.length === 0 && (
        <div className="bg-white rounded-xl border p-16 text-center">
          <MessageSquare className="w-12 h-12 mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium">Aucune publication trouvée</p>
          <p className="text-sm text-gray-400 mt-1">Modifiez vos filtres de recherche</p>
        </div>
      )}

      {/* View Post Modal */}
      <Dialog open={!!selectedPost} onOpenChange={() => setSelectedPost(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Publication complète</DialogTitle>
            <DialogDescription>Détails de la publication</DialogDescription>
          </DialogHeader>
          {selectedPost && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-blue-100 text-blue-700 font-bold">
                    {selectedPost.user?.firstName?.charAt(0)}{selectedPost.user?.lastName?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">{selectedPost.user?.firstName} {selectedPost.user?.lastName}</p>
                  <p className="text-xs text-gray-400">{selectedPost.user?.phone} · {selectedPost.user?.region}</p>
                </div>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed">{selectedPost.content}</p>
              {selectedPost.images.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {selectedPost.images.map((_, i) => (
                    <div key={i} className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 text-sm border">
                      📷 Photo {i + 1}
                    </div>
                  ))}
                </div>
              )}
              <div className="flex items-center gap-4 pt-2 border-t text-sm text-gray-500">
                <span className="flex items-center gap-1"><Heart className="w-4 h-4 text-red-400" /> {selectedPost.likes} j&apos;aime</span>
                <span className="flex items-center gap-1"><MessageCircle className="w-4 h-4 text-blue-400" /> {selectedPost.commentsCount} commentaires</span>
                <span className="ml-auto text-xs text-gray-400">{new Date(selectedPost.createdAt).toLocaleString('fr-SN')}</span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
