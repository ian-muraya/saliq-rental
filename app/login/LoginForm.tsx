// app/login/LoginForm.tsx
// Client component login form with hard redirect and restriction handling

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Eye, EyeOff, Mail, Lock, Sparkles } from 'lucide-react'

export default function LoginForm() {
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })

  useEffect(() => {
    const errorParam = searchParams.get('error')
    if (errorParam === 'restricted') {
      setError('Your account has been restricted. Please contact support.')
    }
  }, [searchParams])

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/me')
        if (res.ok) {
          const data = await res.json()
          if (data.role === 'ADMIN') {
            window.location.href = '/admin'
          } else if (data.role === 'LANDLORD') {
            window.location.href = '/dashboard'
          }
        }
      } catch (error) {
        // Not logged in
      } finally {
        setCheckingAuth(false)
      }
    }
    checkAuth()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await res.json()

      if (!res.ok) {
        if (res.status === 403 && data.error?.includes('restricted')) {
          setError('Your account has been restricted. Please contact support.')
        } else {
          throw new Error(data.error || 'Login failed')
        }
        setLoading(false)
        return
      }

      if (data.user?.role === 'ADMIN') {
        window.location.href = '/admin'
      } else {
        window.location.href = '/dashboard'
      }
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cream-200 via-cream-100 to-cream-200 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gold-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-navy-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-cream-200 via-cream-100 to-cream-200">
      <div className="glass-orb w-[500px] h-[500px] -top-48 -right-48 animate-float" />
      <div className="glass-orb w-[400px] h-[400px] bottom-32 -left-48 animate-float" style={{ animationDelay: '2s' }} />
      
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4 md:p-8">
        <div className="w-full max-w-5xl grid md:grid-cols-2 gap-8 items-center animate-fade-in">
          
          <div className="hidden md:block space-y-6 p-8">
            <div className="inline-flex items-center gap-2 bg-gold-400/10 backdrop-blur-sm px-4 py-2 rounded-full border border-gold-400/30">
              <Sparkles className="w-4 h-4 text-gold-500" />
              <span className="text-gold-500 text-sm font-semibold">WELCOME BACK</span>
            </div>
            <h1 className="heading-premium">
              Your Properties,<br />One Dashboard
            </h1>
            <p className="text-navy-600 text-lg leading-relaxed">
              Access your rental portfolio, track payments, and manage tenants all from one premium platform.
            </p>
            <div className="pt-8">
              <div className="border-l-4 border-gold-400 pl-4">
                <p className="text-navy-500 italic">"Saliq has transformed how we manage our 50+ properties. The M-Pesa integration is seamless."</p>
                <p className="text-sm text-gold-500 mt-2">— James M., Nairobi</p>
              </div>
            </div>
          </div>

          <div className="glass-card p-6 md:p-8 animate-slide-up">
            <div className="text-center mb-6">
              <h2 className="font-serif text-3xl text-navy-700">Sign In</h2>
              <p className="text-gold-500 mt-2">Access your premium dashboard</p>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-600 px-4 py-3 rounded-xl mb-6 backdrop-blur-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="label">
                  <Mail className="inline-block w-4 h-4 mr-2" />
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  className="input-field"
                  placeholder="admin@yourcompany.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div>
                <label className="label">
                  <Lock className="inline-block w-4 h-4 mr-2" />
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    className="input-field pr-12"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gold-500 hover:text-gold-600"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Signing In...
                  </span>
                ) : (
                  'Sign In →'
                )}
              </button>
            </form>

            <p className="text-center text-sm text-navy-500 mt-6">
              Don't have an account?{' '}
              <Link href="/register" className="text-gold-500 hover:text-gold-600 font-semibold transition-colors">
                Create Account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}