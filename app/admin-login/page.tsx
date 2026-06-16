// app/admin-login/page.tsx
// Hidden admin login page - accessible via direct URL only

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Shield, Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react'

export default function AdminLoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })

  // Check if already logged in as admin
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/check-admin')
        const data = await res.json()
        if (data.isAdmin) {
          router.push('/admin')
        }
      } catch (error) {
        // Not logged in, stay on page
      }
    }
    checkAuth()
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      console.log('Sending login request for:', formData.email)
      
      const res = await fetch('/api/auth/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await res.json()
      console.log('Response status:', res.status)
      console.log('Response data:', data)

      if (!res.ok) {
        throw new Error(data.error || 'Login failed')
      }

      console.log('Login successful, redirecting to /admin...')
      // Use window.location for a hard redirect
      window.location.href = '/admin'
    } catch (err: any) {
      console.error('Login error:', err)
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-navy-900 via-navy-800 to-navy-900">
      {/* Decorative background elements */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSIjQzVBMDU5IiBmaWxsLW9wYWNpdHk9IjAuMDUiPjxwYXRoIGQ9Ik0zNiAzNHYtNGgtMnY0aC00djJoNHY0aDJ2LTRoNHYtMmgtNHptMC0zMFYwaC0ydjRoLTR2Mmg0djRoMlY2aDRWNEm0em0tMzAgMzB2LTRINHY0SDB2Mmg0djRoMnYtNGg0di0ySDZ6TTYgNFYwSDR2NEgwdjJoNHY0aDJWNmg0VjRINnoiLz48L2c+PC9zdmc+')] bg-repeat" />
      </div>
      
      <div className="glass-orb w-[600px] h-[600px] -top-48 -right-48 animate-float" />
      <div className="glass-orb w-[400px] h-[400px] bottom-32 -left-48 animate-float" style={{ animationDelay: '2s' }} />
      <div className="glass-orb w-[300px] h-[300px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-float" style={{ animationDelay: '4s', opacity: 0.1 }} />
      
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Admin Badge */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gold-500/10 border-2 border-gold-500/30 mb-4">
              <Shield size={40} className="text-gold-500" />
            </div>
            <h1 className="font-serif text-3xl text-white">Admin Portal</h1>
            <p className="text-gold-400/80 mt-2">Secure access for Saliq administrators</p>
          </div>

          {/* Login Form */}
          <div className="rounded-2xl p-8" style={{ backgroundColor: 'rgba(10, 25, 47, 0.8)', border: '1px solid rgba(197, 160, 89, 0.3)', backdropFilter: 'blur(12px)' }}>
            {error && (
              <div className="mb-6 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm flex items-center gap-2">
                <AlertCircle size={16} /> {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gold-400 mb-2">
                  <Mail size={16} className="inline mr-2" /> Email Address
                </label>
                <input
                  type="email"
                  required
                  className="w-full px-4 py-3 rounded-lg bg-navy-800/50 border border-gold-500/30 text-white placeholder-gold-500/40 focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-transparent transition-all"
                  placeholder="admin@saliq.co.ke"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gold-400 mb-2">
                  <Lock size={16} className="inline mr-2" /> Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    className="w-full px-4 py-3 rounded-lg bg-navy-800/50 border border-gold-500/30 text-white placeholder-gold-500/40 focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-transparent transition-all pr-12"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gold-500 hover:text-gold-400"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gold-500 hover:bg-gold-600 text-navy-900 font-semibold py-3 px-4 rounded-lg transition-all duration-300 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-navy-900/30 border-t-navy-900 rounded-full animate-spin" />
                ) : (
                  <>
                    <Shield size={18} /> Access Admin Dashboard
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 text-center text-sm text-gold-500/60">
              <p>Authorized personnel only</p>
              <p className="text-xs mt-2">Unauthorized access is prohibited</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}