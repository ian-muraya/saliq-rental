// app/register/RegisterForm.tsx
// Registration form with dynamic pricing from database

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, Building2, Mail, Phone, Lock, Home, CreditCard } from 'lucide-react'

export default function RegisterForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [pricing, setPricing] = useState({ monthlyRate: 1500, yearlyRate: 12000 })
  const [loadingPricing, setLoadingPricing] = useState(true)
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    password: '',
    companyName: '',
    propertyCount: 1,
    billingPeriod: 'MONTHLY'
  })

  // Fetch current pricing from public API
  useEffect(() => {
    const fetchPricing = async () => {
      try {
        const res = await fetch('/api/public/pricing')
        if (res.ok) {
          const data = await res.json()
          setPricing({
            monthlyRate: data.monthlyRatePerProperty || 1500,
            yearlyRate: data.yearlyRatePerProperty || 12000
          })
        }
      } catch (error) {
        console.error('Failed to fetch pricing:', error)
      } finally {
        setLoadingPricing(false)
      }
    }
    fetchPricing()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error)
      }

      alert('Registration successful! Please login.')
      window.location.href = '/login'
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const calculatedPrice = formData.billingPeriod === 'YEARLY' 
    ? formData.propertyCount * pricing.yearlyRate
    : formData.propertyCount * pricing.monthlyRate

  const monthlyPrice = formData.propertyCount * pricing.monthlyRate
  const yearlyPrice = formData.propertyCount * pricing.yearlyRate
  const savingsPercent = Math.round((1 - (pricing.yearlyRate / (pricing.monthlyRate * 12))) * 100)

  if (loadingPricing) {
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
      <div className="glass-orb w-[300px] h-[300px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-float" style={{ animationDelay: '4s' }} />
      
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4 md:p-8">
        <div className="w-full max-w-6xl grid md:grid-cols-2 gap-8 items-center animate-fade-in">
          
          <div className="hidden md:block space-y-6 p-8">
            <div className="inline-flex items-center gap-2 bg-gold-400/10 backdrop-blur-sm px-4 py-2 rounded-full border border-gold-400/30">
              <span className="text-gold-500 text-sm font-semibold">PREMIUM PROPERTY MANAGEMENT</span>
            </div>
            <h1 className="heading-premium">
              Saliq Rental<br />Management
            </h1>
            <p className="text-navy-600 text-lg leading-relaxed">
              Join Kenya's most trusted platform for landlords. 
              Manage properties, track payments, and grow your real estate portfolio.
            </p>
            <div className="space-y-4 pt-8">
              {[
                '🏢 Track multiple properties effortlessly',
                '💰 Automated M-Pesa payment collection',
                '📊 Real-time analytics & reports',
                '👥 Bulk tenant management'
              ].map((feature, i) => (
                <div key={i} className="flex items-center gap-3 text-navy-700">
                  <div className="w-2 h-2 rounded-full bg-gold-400" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card p-6 md:p-8 animate-slide-up">
            <div className="text-center mb-6">
              <h2 className="font-serif text-3xl text-navy-700">Create Account</h2>
              <p className="text-gold-500 mt-2">Start your premium journey</p>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-600 px-4 py-3 rounded-xl mb-6 backdrop-blur-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="label">
                  <Building2 className="inline-block w-4 h-4 mr-2" />
                  Company/Organization Name
                </label>
                <input
                  type="text"
                  required
                  className="input-field"
                  placeholder="e.g., Kilimani Properties Ltd"
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                />
              </div>

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
                  <Phone className="inline-block w-4 h-4 mr-2" />
                  Phone Number
                </label>
                <input
                  type="tel"
                  required
                  className="input-field"
                  placeholder="254712345678"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
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

              <div>
                <label className="label">
                  <Home className="inline-block w-4 h-4 mr-2" />
                  Number of Properties
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  className="input-field"
                  value={formData.propertyCount}
                  onChange={(e) => setFormData({ ...formData, propertyCount: parseInt(e.target.value) })}
                />
              </div>

              <div>
                <label className="label">
                  <CreditCard className="inline-block w-4 h-4 mr-2" />
                  Billing Period
                </label>
                <select
                  className="input-field"
                  value={formData.billingPeriod}
                  onChange={(e) => setFormData({ ...formData, billingPeriod: e.target.value })}
                >
                  <option value="MONTHLY">Monthly</option>
                  <option value="YEARLY">Yearly (Save {savingsPercent}%)</option>
                </select>
              </div>

              <div className="mt-3 p-4 bg-gold-400/5 rounded-xl border border-gold-400/20">
                <p className="text-sm text-navy-600 font-medium mb-2">Pricing Summary:</p>
                <div className="flex justify-between text-sm">
                  <span className="text-navy-500">Monthly Rate:</span>
                  <span className="font-semibold text-gold-500">KSh {pricing.monthlyRate.toLocaleString()}/property</span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span className="text-navy-500">Yearly Rate:</span>
                  <span className="font-semibold text-gold-500">KSh {pricing.yearlyRate.toLocaleString()}/property</span>
                </div>
                <div className="border-t border-gold-200/30 my-2 pt-2">
                  <div className="flex justify-between text-sm font-semibold">
                    <span className="text-navy-700">Total Due:</span>
                    <span className="text-gold-600">KSh {calculatedPrice.toLocaleString()}</span>
                  </div>
                </div>
                <p className="text-xs text-navy-400 mt-2">*First payment due within 7 days of registration</p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Creating Account...
                  </span>
                ) : (
                  `Start Premium Journey → (KSh ${calculatedPrice.toLocaleString()})`
                )}
              </button>
            </form>

            <p className="text-center text-sm text-navy-500 mt-6">
              Already have an account?{' '}
              <Link href="/login" className="text-gold-500 hover:text-gold-600 font-semibold transition-colors">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}