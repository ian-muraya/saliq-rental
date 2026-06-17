// app/admin/settings/company/CompanySettingsClient.tsx
// Company Settings Form - Fixed icons

'use client'

import { useState } from 'react'
import { 
  Building2, 
  Mail, 
  Phone, 
  MapPin, 
  Globe, 
  Clock, 
  Save, 
  CheckCircle, 
  AlertCircle,
  Link2,
  Share2
} from 'lucide-react'

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

  // Get social media icon color
  const getSocialColor = (platform: string) => {
    switch (platform) {
      case 'facebook': return 'text-blue-600 border-blue-200 focus:ring-blue-500'
      case 'twitter': return 'text-sky-500 border-sky-200 focus:ring-sky-500'
      case 'instagram': return 'text-pink-600 border-pink-200 focus:ring-pink-500'
      case 'linkedin': return 'text-blue-700 border-blue-200 focus:ring-blue-700'
      case 'youtube': return 'text-red-600 border-red-200 focus:ring-red-500'
      default: return 'text-gold-500 border-gold-200 focus:ring-gold-500'
    }
  }

  // Get social media placeholder
  const getSocialPlaceholder = (platform: string) => {
    switch (platform) {
      case 'facebook': return 'https://facebook.com/yourpage'
      case 'twitter': return 'https://twitter.com/yourhandle'
      case 'instagram': return 'https://instagram.com/yourhandle'
      case 'linkedin': return 'https://linkedin.com/company/yourcompany'
      case 'youtube': return 'https://youtube.com/@yourchannel'
      default: return 'https://example.com'
    }
  }

  // Get social media label
  const getSocialLabel = (platform: string) => {
    switch (platform) {
      case 'facebook': return 'Facebook'
      case 'twitter': return 'Twitter/X'
      case 'instagram': return 'Instagram'
      case 'linkedin': return 'LinkedIn'
      case 'youtube': return 'YouTube'
      default: return platform
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
                  <input 
                    type="text" 
                    className="input-field" 
                    value={formData.companyName} 
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })} 
                    placeholder="Saliq Software Solutions"
                  />
                </div>
                <div>
                  <label className="label">Support Email</label>
                  <input 
                    type="email" 
                    className="input-field" 
                    value={formData.email} 
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })} 
                    placeholder="support@saliq.co.ke"
                  />
                </div>
                <div>
                  <label className="label">Primary Phone</label>
                  <input 
                    type="tel" 
                    className="input-field" 
                    value={formData.phone} 
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })} 
                    placeholder="+254700000000"
                  />
                </div>
                <div>
                  <label className="label">Secondary Phone (Optional)</label>
                  <input 
                    type="tel" 
                    className="input-field" 
                    value={formData.phoneAlt || ''} 
                    onChange={(e) => setFormData({ ...formData, phoneAlt: e.target.value || null })} 
                    placeholder="+254700000001"
                  />
                </div>
                <div>
                  <label className="label">Physical Address</label>
                  <textarea 
                    rows={2} 
                    className="input-field" 
                    value={formData.physicalAddress || ''} 
                    onChange={(e) => setFormData({ ...formData, physicalAddress: e.target.value || null })} 
                    placeholder="Nairobi, Kenya"
                  />
                </div>
                <div>
                  <label className="label">Support Hours</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    value={formData.supportHours || ''} 
                    onChange={(e) => setFormData({ ...formData, supportHours: e.target.value || null })} 
                    placeholder="Monday - Friday: 9am - 5pm EAT"
                  />
                </div>
              </div>
            </div>

            {/* Social Media Links */}
            <div>
              <h2 className="font-serif text-xl text-navy-700 mb-4 flex items-center gap-2">
                <Share2 size={18} className="text-gold-500" /> Social Media Links
              </h2>
              <p className="text-sm text-navy-500 mb-4">Add your social media profiles to help tenants connect with you.</p>
              <div className="space-y-4">
                {['facebook', 'twitter', 'instagram', 'linkedin', 'youtube'].map((platform) => (
                  <div key={platform}>
                    <label className={`label flex items-center gap-2 ${getSocialColor(platform)}`}>
                      <Link2 size={16} /> {getSocialLabel(platform)}
                    </label>
                    <input 
                      type="url" 
                      className="input-field" 
                      value={formData[`${platform}Url` as keyof CompanySettings] || ''} 
                      onChange={(e) => setFormData({ ...formData, [`${platform}Url`]: e.target.value || null })} 
                      placeholder={getSocialPlaceholder(platform)}
                    />
                  </div>
                ))}
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