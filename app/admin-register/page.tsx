// app/admin-register/page.tsx
// Create new admin accounts - Only accessible by existing admins

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Shield, Mail, Lock, Eye, EyeOff, AlertCircle, User, Phone, Building2, CheckCircle } from 'lucide-react'

export default function AdminRegisterPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    password: '',
    companyName: '',
    adminPermissions: {
      canManageAdmins: false,
      canManageLandlords: true,
      canViewAllData: true,
      canManageSystem: false
    }
  })

  // Check if current user is admin
  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const res = await fetch('/api/auth/check-admin')
        if (res.ok) {
          const data = await res.json()
          setIsAuthorized(data.isAdmin && data.canManageAdmins)
        }
      } catch (error) {
        setIsAuthorized(false)
      } finally {
        setCheckingAuth(false)
      }
    }
    checkAdmin()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const res = await fetch('/api/auth/admin-register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Registration failed')
      }

      setSuccess(`Admin account created for ${formData.email}`)
      setFormData({
        email: '',
        phone: '',
        password: '',
        companyName: '',
        adminPermissions: {
          canManageAdmins: false,
          canManageLandlords: true,
          canViewAllData: true,
          canManageSystem: false
        }
      })
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-navy-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gold-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gold-400">Verifying access...</p>
        </div>
      </div>
    )
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-navy-900 flex items-center justify-center p-4">
        <div className="glass-card p-8 text-center max-w-md" style={{ backgroundColor: 'rgba(10, 25, 47, 0.8)' }}>
          <Shield size={48} className="mx-auto text-red-500 mb-4" />
          <h2 className="font-serif text-2xl text-white mb-2">Access Denied</h2>
          <p className="text-gold-400/80 mb-4">You do not have permission to access this page.</p>
          <button onClick={() => router.push('/admin')} className="btn-primary">Return to Dashboard</button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-navy-900 via-navy-800 to-navy-900">
      <div className="glass-orb w-[600px] h-[600px] -top-48 -right-48 animate-float" />
      
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-2xl">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gold-500/10 border-2 border-gold-500/30 mb-4">
              <User size={40} className="text-gold-500" />
            </div>
            <h1 className="font-serif text-3xl text-white">Create Admin Account</h1>
            <p className="text-gold-400/80 mt-2">Add new administrators to the Saliq team</p>
          </div>

          <div className="glass-card p-8" style={{ backgroundColor: 'rgba(10, 25, 47, 0.8)', borderColor: 'rgba(197, 160, 89, 0.3)' }}>
            {error && (
              <div className="mb-6 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm flex items-center gap-2">
                <AlertCircle size={16} /> {error}
              </div>
            )}
            {success && (
              <div className="mb-6 p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400 text-sm flex items-center gap-2">
                <CheckCircle size={16} /> {success}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gold-400 mb-2">
                    <Mail size={14} className="inline mr-1" /> Email *
                  </label>
                  <input
                    type="email"
                    required
                    className="w-full px-4 py-2 rounded-lg bg-navy-800/50 border border-gold-500/30 text-white focus:outline-none focus:ring-2 focus:ring-gold-500"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gold-400 mb-2">
                    <Phone size={14} className="inline mr-1" /> Phone *
                  </label>
                  <input
                    type="tel"
                    required
                    className="w-full px-4 py-2 rounded-lg bg-navy-800/50 border border-gold-500/30 text-white focus:outline-none focus:ring-2 focus:ring-gold-500"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gold-400 mb-2">
                  <Building2 size={14} className="inline mr-1" /> Company/Organization
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-2 rounded-lg bg-navy-800/50 border border-gold-500/30 text-white focus:outline-none focus:ring-2 focus:ring-gold-500"
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gold-400 mb-2">
                  <Lock size={14} className="inline mr-1" /> Password *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    className="w-full px-4 py-2 rounded-lg bg-navy-800/50 border border-gold-500/30 text-white focus:outline-none focus:ring-2 focus:ring-gold-500 pr-12"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gold-500"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="pt-4">
                <h3 className="text-sm font-medium text-gold-400 mb-3">Admin Permissions</h3>
                <div className="space-y-2">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded border-gold-500/30 bg-navy-800 text-gold-500 focus:ring-gold-500"
                      checked={formData.adminPermissions.canManageAdmins}
                      onChange={(e) => setFormData({
                        ...formData,
                        adminPermissions: { ...formData.adminPermissions, canManageAdmins: e.target.checked }
                      })}
                    />
                    <span className="text-sm text-white">Can manage other admins (create, delete, modify)</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded border-gold-500/30 bg-navy-800 text-gold-500 focus:ring-gold-500"
                      checked={formData.adminPermissions.canManageLandlords}
                      onChange={(e) => setFormData({
                        ...formData,
                        adminPermissions: { ...formData.adminPermissions, canManageLandlords: e.target.checked }
                      })}
                    />
                    <span className="text-sm text-white">Can manage landlords (restrict, modify, change email)</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded border-gold-500/30 bg-navy-800 text-gold-500 focus:ring-gold-500"
                      checked={formData.adminPermissions.canViewAllData}
                      onChange={(e) => setFormData({
                        ...formData,
                        adminPermissions: { ...formData.adminPermissions, canViewAllData: e.target.checked }
                      })}
                    />
                    <span className="text-sm text-white">Can view all system data (reports, analytics)</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded border-gold-500/30 bg-navy-800 text-gold-500 focus:ring-gold-500"
                      checked={formData.adminPermissions.canManageSystem}
                      onChange={(e) => setFormData({
                        ...formData,
                        adminPermissions: { ...formData.adminPermissions, canManageSystem: e.target.checked }
                      })}
                    />
                    <span className="text-sm text-white">Can manage system settings (billing rates, etc.)</span>
                  </label>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gold-500 hover:bg-gold-600 text-navy-900 font-semibold py-3 px-4 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 mt-6"
              >
                {loading ? <div className="w-5 h-5 border-2 border-navy-900/30 border-t-navy-900 rounded-full animate-spin" /> : <Shield size={18} />}
                {loading ? 'Creating...' : 'Create Admin Account'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}