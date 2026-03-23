'use client'

import React, { useState } from 'react'
import { Settings, Shield, Bell, Link, CheckCircle, XCircle, Save } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import toast from 'react-hot-toast'

export default function SettingsPage() {
  const [generalSettings, setGeneralSettings] = useState({
    appName: 'PermisXpress / Explicode',
    defaultLanguage: 'FR',
    maintenanceMode: false,
    registrationEnabled: true,
    maxOtpAttempts: '3',
    supportPhone: '+221 33 867 00 00',
  })

  const [securitySettings, setSecuritySettings] = useState({
    otpExpiryMinutes: '5',
    accessTokenTtlMinutes: '15',
    refreshTokenTtlDays: '30',
    maxOtpAttempts: '3',
    rateLimitWindowMinutes: '10',
    rateLimitMaxRequests: '100',
  })

  const [notifSettings, setNotifSettings] = useState({
    smsEnabled: true,
    atUsername: 'explicode',
    atApiKey: '••••••••••••••••••••••••••••••••',
    smsFromNumber: '+221XXXXXXX',
    emailEnabled: false,
    emailSmtp: '',
  })

  const handleSaveGeneral = () => toast.success('Paramètres généraux enregistrés')
  const handleSaveSecurity = () => toast.success('Paramètres de sécurité enregistrés')
  const handleSaveNotifs = () => toast.success('Paramètres de notifications enregistrés')

  return (
    <div className="space-y-6">
      <PageHeader title="Paramètres" subtitle="Configuration globale de l'application PermisXpress" />

      <Tabs defaultValue="general">
        <TabsList className="bg-white border border-gray-200">
          <TabsTrigger value="general" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            <Settings className="w-4 h-4 mr-1.5" /> Général
          </TabsTrigger>
          <TabsTrigger value="security" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            <Shield className="w-4 h-4 mr-1.5" /> Sécurité
          </TabsTrigger>
          <TabsTrigger value="notifications" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            <Bell className="w-4 h-4 mr-1.5" /> Notifications
          </TabsTrigger>
          <TabsTrigger value="integrations" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            <Link className="w-4 h-4 mr-1.5" /> Intégrations
          </TabsTrigger>
        </TabsList>

        {/* GENERAL */}
        <TabsContent value="general">
          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle className="text-base">Paramètres généraux</CardTitle>
              <CardDescription>Configuration de base de l&apos;application</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <Label>Nom de l&apos;application</Label>
                  <Input value={generalSettings.appName} onChange={e => setGeneralSettings(p => ({ ...p, appName: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label>Langue par défaut</Label>
                  <Select value={generalSettings.defaultLanguage} onValueChange={v => setGeneralSettings(p => ({ ...p, defaultLanguage: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FR">Français (FR)</SelectItem>
                      <SelectItem value="WO">Wolof (WO)</SelectItem>
                      <SelectItem value="PU">Pulaar (PU)</SelectItem>
                      <SelectItem value="SE">Sérère (SE)</SelectItem>
                      <SelectItem value="JO">Joola (JO)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Téléphone support</Label>
                  <Input value={generalSettings.supportPhone} onChange={e => setGeneralSettings(p => ({ ...p, supportPhone: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label>Max tentatives OTP</Label>
                  <Input type="number" min={1} max={10} value={generalSettings.maxOtpAttempts} onChange={e => setGeneralSettings(p => ({ ...p, maxOtpAttempts: e.target.value }))} />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">Mode maintenance</p>
                    <p className="text-sm text-gray-500">L&apos;application affichera un message de maintenance aux utilisateurs</p>
                  </div>
                  <Switch checked={generalSettings.maintenanceMode} onCheckedChange={v => setGeneralSettings(p => ({ ...p, maintenanceMode: v }))} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">Inscription ouverte</p>
                    <p className="text-sm text-gray-500">Permettre aux nouveaux utilisateurs de s&apos;inscrire</p>
                  </div>
                  <Switch checked={generalSettings.registrationEnabled} onCheckedChange={v => setGeneralSettings(p => ({ ...p, registrationEnabled: v }))} />
                </div>
              </div>

              {generalSettings.maintenanceMode && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
                  ⚠️ Le mode maintenance est activé. Les utilisateurs ne peuvent pas accéder à l&apos;application.
                </div>
              )}

              <div className="flex justify-end">
                <Button onClick={handleSaveGeneral}><Save className="w-4 h-4 mr-2" /> Enregistrer</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SECURITY */}
        <TabsContent value="security">
          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle className="text-base">Sécurité & Authentification</CardTitle>
              <CardDescription>Configuration des tokens JWT, OTP et rate limiting</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-4">Tokens JWT</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Durée access token (minutes)</Label>
                    <Input type="number" value={securitySettings.accessTokenTtlMinutes} onChange={e => setSecuritySettings(p => ({ ...p, accessTokenTtlMinutes: e.target.value }))} />
                    <p className="text-xs text-gray-400">Recommandé : 15 min</p>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Durée refresh token (jours)</Label>
                    <Input type="number" value={securitySettings.refreshTokenTtlDays} onChange={e => setSecuritySettings(p => ({ ...p, refreshTokenTtlDays: e.target.value }))} />
                    <p className="text-xs text-gray-400">Recommandé : 30 jours</p>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-4">OTP (One-Time Password)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Expiration OTP (minutes)</Label>
                    <Input type="number" value={securitySettings.otpExpiryMinutes} onChange={e => setSecuritySettings(p => ({ ...p, otpExpiryMinutes: e.target.value }))} />
                    <p className="text-xs text-gray-400">Stocké dans Redis avec TTL</p>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Max tentatives OTP par IP</Label>
                    <Input type="number" value={securitySettings.maxOtpAttempts} onChange={e => setSecuritySettings(p => ({ ...p, maxOtpAttempts: e.target.value }))} />
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-4">Rate Limiting (@nestjs/throttler)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Fenêtre de temps (minutes)</Label>
                    <Input type="number" value={securitySettings.rateLimitWindowMinutes} onChange={e => setSecuritySettings(p => ({ ...p, rateLimitWindowMinutes: e.target.value }))} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Max requêtes par fenêtre</Label>
                    <Input type="number" value={securitySettings.rateLimitMaxRequests} onChange={e => setSecuritySettings(p => ({ ...p, rateLimitMaxRequests: e.target.value }))} />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveSecurity}><Save className="w-4 h-4 mr-2" /> Enregistrer</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* NOTIFICATIONS */}
        <TabsContent value="notifications">
          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle className="text-base">Notifications</CardTitle>
              <CardDescription>Configuration des SMS et emails</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700">Africa&apos;s Talking SMS</h3>
                    <p className="text-xs text-gray-500">Fournisseur SMS pour le Sénégal</p>
                  </div>
                  <Switch checked={notifSettings.smsEnabled} onCheckedChange={v => setNotifSettings(p => ({ ...p, smsEnabled: v }))} />
                </div>
                {notifSettings.smsEnabled && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label>Username Africa&apos;s Talking</Label>
                      <Input value={notifSettings.atUsername} onChange={e => setNotifSettings(p => ({ ...p, atUsername: e.target.value }))} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>API Key</Label>
                      <Input type="password" value={notifSettings.atApiKey} onChange={e => setNotifSettings(p => ({ ...p, atApiKey: e.target.value }))} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Numéro expéditeur</Label>
                      <Input value={notifSettings.smsFromNumber} onChange={e => setNotifSettings(p => ({ ...p, smsFromNumber: e.target.value }))} />
                    </div>
                  </div>
                )}
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Notifications email</p>
                  <p className="text-sm text-gray-500">Envoi d&apos;emails transactionnels (non disponible actuellement)</p>
                </div>
                <Switch checked={notifSettings.emailEnabled} onCheckedChange={v => setNotifSettings(p => ({ ...p, emailEnabled: v }))} disabled />
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveNotifs}><Save className="w-4 h-4 mr-2" /> Enregistrer</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* INTEGRATIONS */}
        <TabsContent value="integrations">
          <div className="space-y-4">
            {/* Redis */}
            <Card className="border-gray-200">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">Redis</CardTitle>
                    <CardDescription>Cache et stockage des sessions, OTP, refresh tokens</CardDescription>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-200 rounded-full">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-xs font-medium text-green-700">Connecté</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-gray-500 text-xs">Hôte</p>
                    <p className="font-mono font-medium mt-0.5">redis:6379</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-gray-500 text-xs">Version</p>
                    <p className="font-mono font-medium mt-0.5">7.2-alpine</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-gray-500 text-xs">Clés en cache</p>
                    <p className="font-mono font-medium mt-0.5">1 247</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-gray-500 text-xs">Mémoire utilisée</p>
                    <p className="font-mono font-medium mt-0.5">12.4 MB</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* PostgreSQL */}
            <Card className="border-gray-200">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">PostgreSQL</CardTitle>
                    <CardDescription>Base de données principale (TypeORM, pool de 20 connexions)</CardDescription>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-200 rounded-full">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-xs font-medium text-green-700">Connecté</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-gray-500 text-xs">Hôte</p>
                    <p className="font-mono font-medium mt-0.5">postgres:5432</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-gray-500 text-xs">Version</p>
                    <p className="font-mono font-medium mt-0.5">PostgreSQL 16</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-gray-500 text-xs">Connexions actives</p>
                    <p className="font-mono font-medium mt-0.5">8 / 20</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-gray-500 text-xs">Taille DB</p>
                    <p className="font-mono font-medium mt-0.5">234 MB</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* S3 */}
            <Card className="border-gray-200">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">S3 (Stockage fichiers)</CardTitle>
                    <CardDescription>Documents, avatars, audios des leçons — AWS S3 ou Cloudflare R2</CardDescription>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-full">
                    <div className="w-2 h-2 bg-amber-500 rounded-full" />
                    <span className="text-xs font-medium text-amber-700">Non configuré</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Bucket S3</Label>
                    <Input placeholder="explicode-docs" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Région AWS</Label>
                    <Input placeholder="eu-west-3" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Access Key ID</Label>
                    <Input type="password" placeholder="AKIA..." />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Secret Access Key</Label>
                    <Input type="password" placeholder="••••••••" />
                  </div>
                </div>
                <div className="flex justify-end mt-4">
                  <Button onClick={() => toast.success('Configuration S3 enregistrée')}><Save className="w-4 h-4 mr-2" /> Enregistrer</Button>
                </div>
              </CardContent>
            </Card>

            {/* Health */}
            <Card className="border-gray-200">
              <CardHeader>
                <CardTitle className="text-base">État du système</CardTitle>
                <CardDescription>@nestjs/terminus — Health checks</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { name: 'API NestJS', status: true, detail: 'http://localhost:3000/health' },
                    { name: 'Base de données PostgreSQL', status: true, detail: 'Connexion active' },
                    { name: 'Cache Redis', status: true, detail: '12.4 MB utilisés' },
                    { name: 'Stockage S3', status: false, detail: 'Non configuré' },
                    { name: 'SMS Africa\'s Talking', status: true, detail: 'API opérationnelle' },
                  ].map(item => (
                    <div key={item.name} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                      <div className="flex items-center gap-3">
                        {item.status
                          ? <CheckCircle className="w-4 h-4 text-green-500" />
                          : <XCircle className="w-4 h-4 text-red-400" />
                        }
                        <span className="text-sm font-medium text-gray-900">{item.name}</span>
                      </div>
                      <span className="text-xs text-gray-500">{item.detail}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
