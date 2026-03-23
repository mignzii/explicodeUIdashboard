'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Plus, Pencil, Trash2, Users, Briefcase, Clock, Eye, CheckCircle, XCircle } from 'lucide-react'
import { ColumnDef } from '@tanstack/react-table'
import { PageHeader } from '@/components/shared/page-header'
import { StatsCard } from '@/components/shared/stats-card'
import { DataTable } from '@/components/shared/data-table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from '@/components/ui/alert-dialog'
import { Job, JobApplication } from '@/types'
import { jobsApi } from '@/lib/communityApi'
import toast from 'react-hot-toast'

interface JobForm {
  title: string
  company: string
  city: string
  region: string
  salary: string
  contractType: string
  description: string
  requirements: string
  expiresAt: string
  contactEmail: string
  contactPhone: string
  imageUrl: string
}

const DEFAULT_FORM: JobForm = {
  title: '', company: '', city: 'Dakar', region: '', salary: '',
  contractType: '', description: '', requirements: '', expiresAt: '',
  contactEmail: '', contactPhone: '', imageUrl: ''
}

const CITIES = ['Dakar', 'Thiès', 'Saint-Louis', 'Ziguinchor', 'Kaolack', 'Diourbel', 'Louga', 'Touba', 'Mbour', 'Richard-Toll']

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [applications, setApplications] = useState<JobApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingJob, setEditingJob] = useState<Job | null>(null)
  const [form, setForm] = useState<JobForm>(DEFAULT_FORM)
  const [applicantsModal, setApplicantsModal] = useState<Job | null>(null)
  const [saving, setSaving] = useState(false)

  const loadData = useCallback(async () => {
    try {
      const [jobsData, appsData] = await Promise.all([
        jobsApi.list(),
        jobsApi.getApplications(),
      ])
      setJobs(jobsData)
      setApplications(appsData)
    } catch {
      toast.error('Erreur de chargement')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const openCreate = () => {
    setEditingJob(null)
    setForm(DEFAULT_FORM)
    setIsModalOpen(true)
  }

  const openEdit = (job: Job) => {
    setEditingJob(job)
    setForm({
      title: job.title, company: job.company, city: job.city, region: job.region || '',
      salary: job.salary || '', contractType: job.contractType || '',
      description: job.description, requirements: job.requirements.join('\n'),
      expiresAt: job.expiresAt ? job.expiresAt.split('T')[0] : '',
      contactEmail: job.contactEmail || '', contactPhone: job.contactPhone || '',
      imageUrl: job.imageUrl || ''
    })
    setIsModalOpen(true)
  }

  const handleSave = async () => {
    if (!form.title.trim() || !form.company.trim()) {
      toast.error('Le titre et l\'entreprise sont requis')
      return
    }
    setSaving(true)
    const payload = {
      ...form,
      requirements: form.requirements.split('\n').filter(r => r.trim()),
      expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    }
    try {
      if (editingJob) {
        const updated = await jobsApi.update(editingJob.id, payload)
        setJobs(prev => prev.map(j => j.id === editingJob.id ? updated : j))
        toast.success('Offre mise à jour')
      } else {
        const created = await jobsApi.create(payload)
        setJobs(prev => [created, ...prev])
        toast.success('Offre créée')
      }
      setIsModalOpen(false)
    } catch {
      toast.error('Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await jobsApi.delete(id)
      setJobs(prev => prev.filter(j => j.id !== id))
      toast.success('Offre supprimée')
    } catch {
      toast.error('Erreur lors de la suppression')
    }
  }

  const handleApplicationStatus = async (appId: string, status: 'ACCEPTED' | 'REJECTED') => {
    try {
      const updated = await jobsApi.updateApplicationStatus(appId, { status })
      setApplications(prev => prev.map(a => a.id === appId ? updated : a))
      toast.success(status === 'ACCEPTED' ? 'Candidature acceptée' : 'Candidature refusée')
    } catch {
      toast.error('Erreur lors de la mise à jour')
    }
  }

  const now = new Date()
  const activeJobs = jobs.filter(j => j.isActive && (!j.expiresAt || new Date(j.expiresAt) > now))
  const expiringSoon = jobs.filter(j => {
    if (!j.expiresAt) return false
    const expDate = new Date(j.expiresAt)
    const diff = (expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    return diff > 0 && diff <= 7
  })
  const totalApplications = applications.length

  const jobApplications = applicantsModal
    ? applications.filter(a => a.jobId === applicantsModal.id)
    : []

  const columns: ColumnDef<Job>[] = [
    {
      accessorKey: 'title',
      header: 'Poste',
      cell: ({ row }) => (
        <div>
          <p className="font-medium text-sm">{row.original.title}</p>
          <p className="text-xs text-gray-400">{row.original.company}</p>
        </div>
      ),
    },
    {
      accessorKey: 'city',
      header: 'Ville',
      cell: ({ getValue }) => <span className="text-sm text-gray-600">{getValue<string>()}</span>,
    },
    {
      accessorKey: 'salary',
      header: 'Salaire',
      cell: ({ getValue }) => <span className="text-xs font-medium text-emerald-600">{getValue<string>() || '—'}</span>,
    },
    {
      accessorKey: 'applicationsCount',
      header: 'Candidatures',
      cell: ({ row }) => (
        <button
          onClick={() => setApplicantsModal(row.original)}
          className="flex items-center gap-1 text-sm font-bold text-blue-600 hover:text-blue-800"
        >
          <Users className="w-3.5 h-3.5" />
          {row.original.applicationsCount}
        </button>
      ),
    },
    {
      accessorKey: 'postedAt',
      header: 'Publiée le',
      cell: ({ getValue }) => {
        const v = getValue<string>()
        return <span className="text-xs text-gray-500">{v ? new Date(v).toLocaleDateString('fr-SN') : '—'}</span>
      },
    },
    {
      accessorKey: 'expiresAt',
      header: 'Expiration',
      cell: ({ getValue }) => {
        const v = getValue<string>()
        if (!v) return <span className="text-xs text-gray-400">—</span>
        const expDate = new Date(v)
        const diff = Math.round((expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        return (
          <span className={`text-xs font-medium ${diff < 0 ? 'text-red-500' : diff <= 7 ? 'text-amber-500' : 'text-gray-500'}`}>
            {diff < 0 ? 'Expirée' : diff === 0 ? 'Aujourd\'hui' : `${diff}j restants`}
          </span>
        )
      },
    },
    {
      accessorKey: 'isActive',
      header: 'Statut',
      cell: ({ row }) => {
        const expired = row.original.expiresAt && new Date(row.original.expiresAt) <= now
        return (
          <Badge variant={row.original.isActive && !expired ? 'success' : 'gray'}>
            {expired ? 'Expirée' : row.original.isActive ? 'Active' : 'Inactive'}
          </Badge>
        )
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex gap-1">
          <Button variant="ghost" size="icon-sm" onClick={() => setApplicantsModal(row.original)} title="Voir candidatures">
            <Eye className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={() => openEdit(row.original)}>
            <Pencil className="w-3.5 h-3.5" />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon-sm" className="text-red-400 hover:text-red-600">
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Supprimer l&apos;offre</AlertDialogTitle>
                <AlertDialogDescription>Supprimer &quot;{row.original.title}&quot; ?</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction onClick={() => handleDelete(row.original.id)} className="bg-red-600 hover:bg-red-700">Supprimer</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Offres d'emploi"
        subtitle="Gérez les offres d'emploi de la plateforme"
        action={
          <Button onClick={openCreate} className="gap-2">
            <Plus className="w-4 h-4" /> Nouvelle offre
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <StatsCard title="Offres actives" value={activeJobs.length} icon={Briefcase} color="blue" />
        <StatsCard title="Total candidatures" value={totalApplications} icon={Users} color="green" />
        <StatsCard title="Expirent dans 7j" value={expiringSoon.length} icon={Clock} color="amber" />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border p-4">
        {loading ? (
          <div className="py-16 text-center text-gray-400 text-sm">Chargement...</div>
        ) : (
          <DataTable columns={columns} data={jobs} searchPlaceholder="Rechercher une offre..." />
        )}
      </div>

      {/* Create/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingJob ? 'Modifier l\'offre' : 'Nouvelle offre d\'emploi'}</DialogTitle>
            <DialogDescription>Remplissez les informations de l&apos;offre d&apos;emploi</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Titre du poste *</Label>
              <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="mt-1" placeholder="Ex: Chauffeur de taxi" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Entreprise *</Label>
                <Input value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} className="mt-1" placeholder="Nom de l'entreprise" />
              </div>
              <div>
                <Label>Ville</Label>
                <Input value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} className="mt-1" list="cities-list" placeholder="Ville" />
                <datalist id="cities-list">
                  {CITIES.map(c => <option key={c} value={c} />)}
                </datalist>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Région</Label>
                <Input value={form.region} onChange={e => setForm(f => ({ ...f, region: e.target.value }))} className="mt-1" placeholder="Ex: Dakar" />
              </div>
              <div>
                <Label>Type de contrat</Label>
                <Input value={form.contractType} onChange={e => setForm(f => ({ ...f, contractType: e.target.value }))} className="mt-1" list="contract-types" placeholder="Ex: CDI, CDD, Freelance" />
                <datalist id="contract-types">
                  {['CDI', 'CDD', 'Freelance', 'Stage', 'Temps partiel', 'Mission'].map(c => <option key={c} value={c} />)}
                </datalist>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Salaire</Label>
                <Input value={form.salary} onChange={e => setForm(f => ({ ...f, salary: e.target.value }))} className="mt-1" placeholder="Ex: 250 000 - 400 000 FCFA" />
              </div>
              <div>
                <Label>Date d&apos;expiration</Label>
                <Input type="date" value={form.expiresAt} onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))} className="mt-1" />
              </div>
            </div>
            <div>
              <Label>URL de l&apos;image (logo entreprise)</Label>
              <Input value={form.imageUrl} onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value }))} className="mt-1" placeholder="https://exemple.com/logo.png" />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="mt-1" placeholder="Description du poste..." />
            </div>
            <div>
              <Label>Exigences (une par ligne)</Label>
              <Textarea value={form.requirements} onChange={e => setForm(f => ({ ...f, requirements: e.target.value }))} className="mt-1" placeholder="Permis B valide&#10;3 ans d'expérience&#10;..." />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Email de contact</Label>
                <Input type="email" value={form.contactEmail} onChange={e => setForm(f => ({ ...f, contactEmail: e.target.value }))} className="mt-1" placeholder="contact@entreprise.sn" />
              </div>
              <div>
                <Label>Téléphone de contact</Label>
                <Input value={form.contactPhone} onChange={e => setForm(f => ({ ...f, contactPhone: e.target.value }))} className="mt-1" placeholder="+221 77 XXX XX XX" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Annuler</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? 'Sauvegarde...' : editingJob ? 'Sauvegarder' : 'Publier l\'offre'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Applicants Modal */}
      <Dialog open={!!applicantsModal} onOpenChange={() => setApplicantsModal(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Candidatures — {applicantsModal?.title}</DialogTitle>
            <DialogDescription>{jobApplications.length} candidature(s) reçues</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {jobApplications.length === 0 ? (
              <p className="text-center text-sm text-gray-400 py-8">Aucune candidature pour le moment</p>
            ) : (
              jobApplications.map(app => (
                <div key={app.id} className="flex items-center gap-3 p-3 rounded-lg border hover:bg-gray-50">
                  <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-sm">
                    {app.user?.firstName?.charAt(0)}{app.user?.lastName?.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{app.user?.firstName} {app.user?.lastName}</p>
                    <p className="text-xs text-gray-400">{app.user?.phone} · {new Date(app.appliedAt).toLocaleDateString('fr-SN')}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Badge variant={app.status === 'ACCEPTED' ? 'success' : app.status === 'REJECTED' ? 'destructive' : 'warning'} className="text-xs">
                      {app.status === 'ACCEPTED' ? 'Accepté' : app.status === 'REJECTED' ? 'Refusé' : 'En attente'}
                    </Badge>
                    {app.status === 'PENDING' && (
                      <>
                        <Button variant="ghost" size="icon-sm" className="text-green-500 hover:text-green-700" onClick={() => handleApplicationStatus(app.id, 'ACCEPTED')} title="Accepter">
                          <CheckCircle className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon-sm" className="text-red-400 hover:text-red-600" onClick={() => handleApplicationStatus(app.id, 'REJECTED')} title="Refuser">
                          <XCircle className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
