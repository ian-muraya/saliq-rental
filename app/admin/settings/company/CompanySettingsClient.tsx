// app/admin/settings/company/CompanySettingsClient.tsx
// Company Settings Form

'use client'

import { useState } from 'react'
import { Building2, Mail, Phone, MapPin, Globe, Facebook, Twitter, Instagram, Linkedin, Youtube, Clock, Save, CheckCircle, AlertCircle } from 'lucide-react'

interface CompanySettings {
  id: string
  companyName: string
  email: string
  phone: string
  phoneAlt: string | null
  physicalAddress: string | null
  facebookUrl: string | null
  twitterUrl: string | null
  instagramUrl: string | null
  linkedinUrl: string | null
  youtubeUrl: string | null
  supportHours: string | null
}

export default function CompanySettingsClient({ initialData }: { initialData: CompanySettings }) {
  const [formData, setFormData] = useState(initialData)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch('/api/admin/company-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      if (res.ok) {
        showToast('Company settings updated successfully', 'success')
      } else {
        const error = await res.json()
        showToast(error.error || 'Failed to update settings', 'error')
      }
    } catch (error) {
      showToast('Something went wrong', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream-200 via-cream-100 to-cream-200">
      {toast && (
        <div className="fixed top-4 right-4 z-50 animate-slide-up">
          <div className={`px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 ${toast.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
            {toast.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
            {toast.message}
          </div>
        </div>
      )}

      <main className="p-6 md:p-10">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Building2 className="text-gold-500" size={28} />
            <h1 className="heading-premium">Company Settings</h1>
          </div>
          <p className="text-navy-500 mt-2">Manage your company contact information and social media links</p>
          <div className="h-px w-24 bg-gradient-to-r from-gold-400 to-transparent mt-4" />
        </div>

        <form onSubmit={handleSubmit} className="glass-card p-6 max-w-2xl">
          <div className="space-y-6">
            {/* Basic Information */}
            <div>
              <h2 className="font-serif text-xl text-navy-700 mb-4 flex items-center gap-2">
                <Building2 size={18} className="text-gold-500" /> Basic Information
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="label">Company Name</label>
                  <input type="text" className="input-field" value={formData.companyName} onChange={(e) => setFormData({ ...formData, companyName: e.target.value })} />
                </div>
                <div>
                  <label className="label">Support Email</label>
                  <input type="email" className="input-field" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                </div>
                <div>
                  <label className="label">Primary Phone</label>
                  <input type="tel" className="input-field" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                </div>
                <div>
                  <label className="label">Secondary Phone (Optional)</label>
                  <input type="tel" className="input-field" value={formData.phoneAlt || ''} onChange={(e) => setFormData({ ...formData, phoneAlt: e.target.value || null })} />
                </div>
                <div>
                  <label className="label">Physical Address</label>
                  <textarea rows={2} className="input-field" value={formData.physicalAddress || ''} onChange={(e) => setFormData({ ...formData, physicalAddress: e.target.value || null })} />
                </div>
                <div>
                  <label className="label">Support Hours</label>
                  <input type="text" className="input-field" value={formData.supportHours || ''} onChange={(e) => setFormData({ ...formData, supportHours: e.target.value || null })} placeholder="e.g., Monday - Friday: 9am - 5pm EAT" />
                </div>
              </div>
            </div>

            {/* Social Media Links */}
            <div>
              <h2 className="font-serif text-xl text-navy-700 mb-4 flex items-center gap-2">
                <Globe size={18} className="text-gold-500" /> Social Media Links
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="label flex items-center gap-2"><Facebook size={16} /> Facebook</label>
                  <input type="url" className="input-field" value={formData.facebookUrl || ''} onChange={(e) => setFormData({ ...formData, facebookUrl: e.target.value || null })} placeholder="https://facebook.com/yourpage" />
                </div>
                <div>
                  <label className="label flex items-center gap-2"><Twitter size={16} /> Twitter/X</label>
                  <input type="url" className="input-field" value={formData.twitterUrl || ''} onChange={(e) => setFormData({ ...formData, twitterUrl: e.target.value || null })} />
                </div>
                <div>
                  <label className="label flex items-center gap-2"><Instagram size={16} /> Instagram</label>
                  <input type="url" className="input-field" value={formData.instagramUrl || ''} onChange={(e) => setFormData({ ...formData, instagramUrl: e.target.value || null })} />
                </div>
                <div>
                  <label className="label flex items-center gap-2"><Linkedin size={16} /> LinkedIn</label>
                  <input type="url" className="input-field" value={formData.linkedinUrl || ''} onChange={(e) => setFormData({ ...formData, linkedinUrl: e.target.value || null })} />
                </div>
                <div>
                  <label className="label flex items-center gap-2"><Youtube size={16} /> YouTube</label>
                  <input type="url" className="input-field" value={formData.youtubeUrl || ''} onChange={(e) => setFormData({ ...formData, youtubeUrl: e.target.value || null })} />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-gold-200/30">
              <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
                <Save size={18} /> {saving ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </div>
        </form>
      </main>
    </div>
  )
}