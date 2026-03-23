'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Shield, Phone, KeyRound, ArrowRight, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuthStore } from '@/lib/auth'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const router = useRouter()
  const { login, requestOtp, isAuthenticated, isLoading } = useAuthStore()

  const [step, setStep] = useState<'phone' | 'otp'>('phone')
  const [phone, setPhone] = useState('+221 ')
  const [otp, setOtp] = useState('')
  const [countdown, setCountdown] = useState(0)
  const [isSendingOtp, setIsSendingOtp] = useState(false)
  const [error, setError] = useState('')
  const [receivedOtp, setReceivedOtp] = useState<string | null>(null)

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/')
    }
  }, [isAuthenticated, router])

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(c => c - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!phone || phone.length < 8) {
      setError('Veuillez saisir un numéro de téléphone valide')
      return
    }

    setIsSendingOtp(true)
    try {
      const receivedCode = await requestOtp(phone.replace(/\s/g, ''))
      setReceivedOtp(receivedCode)
      if (receivedCode) setOtp(receivedCode)
      setStep('otp')
      setCountdown(60)
      toast.success('Code OTP envoyé par SMS')
    } catch {
      setError('Impossible d\'envoyer l\'OTP. Vérifiez votre numéro.')
    } finally {
      setIsSendingOtp(false)
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (otp.length !== 6) {
      setError('Le code OTP doit contenir 6 chiffres')
      return
    }

    try {
      await login(phone.replace(/\s/g, ''), otp)
      toast.success('Connexion réussie! Bienvenue.')
      router.push('/')
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Code OTP invalide ou expiré'
      setError(errorMessage)
    }
  }

  const handleResendOtp = async () => {
    if (countdown > 0) return
    setIsSendingOtp(true)
    try {
      const receivedCode = await requestOtp(phone.replace(/\s/g, ''))
      setReceivedOtp(receivedCode)
      if (receivedCode) setOtp(receivedCode)
      setCountdown(60)
      toast.success('Nouveau code OTP envoyé')
    } catch {
      toast.error('Impossible de renvoyer l\'OTP')
    } finally {
      setIsSendingOtp(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo / Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl shadow-lg shadow-blue-500/30 mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">Explicode</h1>
          <p className="text-blue-300 mt-1 text-sm">Panneau d&apos;administration</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {step === 'phone' ? (
            <>
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Connexion administrateur</h2>
                <p className="text-sm text-gray-500 mt-1">Entrez votre numéro pour recevoir un code OTP</p>
              </div>

              <form onSubmit={handleSendOtp} className="space-y-5">
                <div>
                  <Label htmlFor="phone" className="text-gray-700">Numéro de téléphone</Label>
                  <div className="relative mt-1.5">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+221 77 123 45 67"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="pl-10 text-base"
                      autoFocus
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Format: +221 XX XXX XX XX</p>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full h-11 text-base font-semibold"
                  loading={isSendingOtp}
                >
                  {!isSendingOtp && (
                    <>
                      Recevoir le code OTP
                      <ArrowRight className="ml-2 w-4 h-4" />
                    </>
                  )}
                  {isSendingOtp && 'Envoi en cours...'}
                </Button>
              </form>

              <div className="mt-6 pt-6 border-t border-gray-100">
                <p className="text-xs text-center text-gray-400">
                  Accès réservé aux administrateurs et agents autorisés
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="mb-6">
                <button
                  onClick={() => { setStep('phone'); setOtp(''); setError('') }}
                  className="text-sm text-blue-600 hover:text-blue-700 mb-3 flex items-center gap-1"
                >
                  ← Changer de numéro
                </button>
                <h2 className="text-xl font-semibold text-gray-900">Code de vérification</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Code envoyé au <span className="font-medium text-gray-700">{phone}</span>
                </p>
              </div>

              <form onSubmit={handleLogin} className="space-y-5">
                <div>
                  <Label htmlFor="otp" className="text-gray-700">Code OTP (6 chiffres)</Label>
                  <div className="relative mt-1.5">
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="otp"
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      placeholder="• • • • • •"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                      className="pl-10 text-center text-2xl tracking-[0.5em] font-bold"
                      autoFocus
                    />
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full h-11 text-base font-semibold"
                  loading={isLoading}
                  disabled={otp.length !== 6}
                >
                  {!isLoading && (
                    <>
                      Se connecter
                      <ArrowRight className="ml-2 w-4 h-4" />
                    </>
                  )}
                  {isLoading && 'Vérification...'}
                </Button>
              </form>

              <div className="mt-4 text-center">
                <button
                  onClick={handleResendOtp}
                  disabled={countdown > 0 || isSendingOtp}
                  className="text-sm text-gray-500 hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 mx-auto transition-colors"
                >
                  <RefreshCw className="w-3 h-3" />
                  {countdown > 0 ? `Renvoyer dans ${countdown}s` : 'Renvoyer le code'}
                </button>
              </div>

              {receivedOtp && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-xs text-center text-gray-500 mb-1">Code reçu du backend :</p>
                  <p className="text-center text-lg font-bold tracking-widest text-blue-600">{receivedOtp}</p>
                </div>
              )}
            </>
          )}
        </div>

        <p className="text-center text-xs text-slate-500 mt-6">
          © 2024 PermisXpress Sénégal — Tous droits réservés
        </p>
      </div>
    </div>
  )
}
