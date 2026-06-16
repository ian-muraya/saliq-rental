// app/admin/settings/AdminSettingsClient.tsx
// Admin System Settings Client Component with Pricing, Company Settings, and Security

'use client'

import { useState } from 'react'
import { 
  Settings, 
  Shield, 
  Users, 
  Building2, 
  Home, 
  CreditCard,
  DollarSign,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Mail,
  Phone,
  Calendar,
  User,
  Key,
  Globe,
  Briefcase,
  MapPin,
  Plus,
  Trash2,
  Edit2,
  X,
  Save,
  TrendingUp,
  Wallet,
  Percent,
  Clock,
  Link as LinkIcon,
  Lock,
  Eye,
  EyeOff
} from 'lucide-react'

interface Admin {
  id: string
  email: string
  phone: string
  companyName: string | null
  createdAt: string
  permissions: any
}

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

interface AdminSettingsClientProps {
  initialData: {
    admins: Admin[]
    systemStats: {
      totalLandlords: number
      totalProperties: number
      totalTenants: number
      totalPayments: number
      totalCollected: number
    }
    pricing: {
      monthlyRatePerProperty: number
      yearlyRatePerProperty: number
      currency: string
    }
    companySettings: CompanySettings
  }
}

export default function AdminSettingsClient({ initialData }: AdminSettingsClientProps) {
  const [admins, setAdmins] = useState(initialData.admins)
  const [activeTab, setActiveTab] = useState<'admins' | 'pricing' | 'company' | 'security' | 'stats'>('admins')
  const [isAddAdminModalOpen, setIsAddAdminModalOpen] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [pricingForm, setPricingForm] = useState({
    monthlyRatePerProperty: initialData.pricing.monthlyRatePerProperty,
    yearlyRatePerProperty: initialData.pricing.yearlyRatePerProperty,
    currency: initialData.pricing.currency
  })
  const [savingPricing, setSavingPricing] = useState(false)
  const [companyForm, setCompanyForm] = useState<CompanySettings>(initialData.companySettings)
  const [savingCompany, setSavingCompany] = useState(false)
  
  // Password change state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  
  const [newAdminForm, setNewAdminForm] = useState({
    email: '',
    phone: '',
    password: '',
    companyName: '',
    canManageAdmins: false,
    canManageLandlords: true,
    canViewAllData: true,
    canManageSystem: false
  })

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  }

  const formatCurrency = (amount: number) => {
    return `KSh ${amount.toLocaleString()}`
  }

  const handleSavePricing = async () => {
    setSavingPricing(true)
    try {
      const res = await fetch('/api/admin/settings/pricing', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pricingForm)
      })
      if (res.ok) {
        showToast('Pricing settings updated successfully', 'success')
      } else {
        const error = await res.json()
        showToast(error.error || 'Failed to update pricing', 'error')
      }
    } catch (error) {
      showToast('Something went wrong', 'error')
    } finally {
      setSavingPricing(false)
    }
  }

  const handleSaveCompanySettings = async () => {
    setSavingCompany(true)
    try {
      const res = await fetch('/api/admin/company-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(companyForm)
      })
      if (res.ok) {
        showToast('Company settings updated successfully', 'success')
      } else {
        const error = await res.json()
        showToast(error.error || 'Failed to update company settings', 'error')
      }
    } catch (error) {
      showToast('Something went wrong', 'error')
    } finally {
      setSavingCompany(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'New passwords do not match' })
      return
    }
    if (passwordForm.newPassword.length < 6) {
      setPasswordMessage({ type: 'error', text: 'Password must be at least 6 characters' })
      return
    }

    setChangingPassword(true)
    setPasswordMessage(null)
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword
        })
      })
      const data = await res.json()
      if (res.ok) {
        setPasswordMessage({ type: 'success', text: 'Password changed successfully!' })
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      } else {
        setPasswordMessage({ type: 'error', text: data.error || 'Failed to change password' })
      }
    } catch (error) {
      setPasswordMessage({ type: 'error', text: 'Something went wrong' })
    } finally {
      setChangingPassword(false)
    }
  }

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault()
    setActionLoading(true)
    try {
      const res = await fetch('/api/auth/admin-register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newAdminForm,
          adminPermissions: {
            canManageAdmins: newAdminForm.canManageAdmins,
            canManageLandlords: newAdminForm.canManageLandlords,
            canViewAllData: newAdminForm.canViewAllData,
            canManageSystem: newAdminForm.canManageSystem
          }
        })
      })
      if (res.ok) {
        const data = await res.json()
        showToast(`Admin ${data.admin.email} created successfully`, 'success')
        setIsAddAdminModalOpen(false)
        setNewAdminForm({
          email: '',
          phone: '',
          password: '',
          companyName: '',
          canManageAdmins: false,
          canManageLandlords: true,
          canViewAllData: true,
          canManageSystem: false
        })
        const refreshRes = await fetch('/api/admin/settings')
        if (refreshRes.ok) {
          const refreshData = await refreshRes.json()
          setAdmins(refreshData.admins)
        }
      } else {
        const error = await res.json()
        showToast(error.error || 'Failed to create admin', 'error')
      }
    } catch (error) {
      showToast('Something went wrong', 'error')
    } finally {
      setActionLoading(false)
    }
  }

  const stats = [
    { title: 'Total Landlords', value: initialData.systemStats.totalLandlords, icon: Users, color: 'text-navy-600' },
    { title: 'Total Properties', value: initialData.systemStats.totalProperties, icon: Building2, color: 'text-gold-600' },
    { title: 'Total Tenants', value: initialData.systemStats.totalTenants, icon: Home, color: 'text-green-600' },
    { title: 'Total Payments', value: initialData.systemStats.totalPayments, icon: CreditCard, color: 'text-blue-600' },
    { title: 'Total Collected', value: formatCurrency(initialData.systemStats.totalCollected || 0), icon: DollarSign, color: 'text-gold-600' },
    { title: 'Admins', value: admins.length, icon: Shield, color: 'text-purple-600' },
  ]

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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-10 animate-fade-in">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Settings className="text-gold-500" size={28} />
              <h1 className="heading-premium">System Settings</h1>
            </div>
            <p className="text-navy-500 mt-2">Manage administrators, pricing, company info, and system configuration</p>
            <div className="h-px w-24 bg-gradient-to-r from-gold-400 to-transparent mt-4" />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 border-b border-gold-200/30 overflow-x-auto">
          <button onClick={() => setActiveTab('admins')} className={`px-6 py-3 rounded-t-lg transition-all duration-300 whitespace-nowrap ${activeTab === 'admins' ? 'bg-gold-400/10 text-gold-600 border-b-2 border-gold-500' : 'text-navy-500 hover:text-gold-500'}`}>
            <Shield size={16} className="inline mr-2" /> Administrators
          </button>
          <button onClick={() => setActiveTab('pricing')} className={`px-6 py-3 rounded-t-lg transition-all duration-300 whitespace-nowrap ${activeTab === 'pricing' ? 'bg-gold-400/10 text-gold-600 border-b-2 border-gold-500' : 'text-navy-500 hover:text-gold-500'}`}>
            <DollarSign size={16} className="inline mr-2" /> Pricing Settings
          </button>
          <button onClick={() => setActiveTab('company')} className={`px-6 py-3 rounded-t-lg transition-all duration-300 whitespace-nowrap ${activeTab === 'company' ? 'bg-gold-400/10 text-gold-600 border-b-2 border-gold-500' : 'text-navy-500 hover:text-gold-500'}`}>
            <Building2 size={16} className="inline mr-2" /> Company Settings
          </button>
          <button onClick={() => setActiveTab('security')} className={`px-6 py-3 rounded-t-lg transition-all duration-300 whitespace-nowrap ${activeTab === 'security' ? 'bg-gold-400/10 text-gold-600 border-b-2 border-gold-500' : 'text-navy-500 hover:text-gold-500'}`}>
            <Lock size={16} className="inline mr-2" /> Security
          </button>
          <button onClick={() => setActiveTab('stats')} className={`px-6 py-3 rounded-t-lg transition-all duration-300 whitespace-nowrap ${activeTab === 'stats' ? 'bg-gold-400/10 text-gold-600 border-b-2 border-gold-500' : 'text-navy-500 hover:text-gold-500'}`}>
            <TrendingUp size={16} className="inline mr-2" /> System Stats
          </button>
        </div>

        {/* STATS TAB */}
        {activeTab === 'stats' && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 animate-slide-up">
            {stats.map((stat, idx) => (
              <div key={idx} className="glass-card p-4 text-center">
                <stat.icon size={24} className={`mx-auto mb-2 ${stat.color}`} />
                <p className="text-navy-500 text-sm">{stat.title}</p>
                <p className="font-serif text-xl font-bold text-navy-700">{stat.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* PRICING TAB */}
        {activeTab === 'pricing' && (
          <div className="glass-card p-6 max-w-md animate-slide-up">
            <h2 className="font-serif text-xl text-navy-700 mb-4 flex items-center gap-2">
              <DollarSign size={20} className="text-gold-500" /> Subscription Pricing
            </h2>
            <p className="text-navy-500 text-sm mb-6">
              Set the rates that landlords will be charged per property. Changes apply to new registrations.
            </p>
            <div className="space-y-5">
              <div>
                <label className="label">Monthly Rate (per property)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gold-500">KSh</span>
                  <input type="number" className="input-field pl-12" value={pricingForm.monthlyRatePerProperty} onChange={(e) => setPricingForm({ ...pricingForm, monthlyRatePerProperty: parseInt(e.target.value) || 0 })} min="0" step="100" />
                </div>
              </div>
              <div>
                <label className="label">Yearly Rate (per property)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gold-500">KSh</span>
                  <input type="number" className="input-field pl-12" value={pricingForm.yearlyRatePerProperty} onChange={(e) => setPricingForm({ ...pricingForm, yearlyRatePerProperty: parseInt(e.target.value) || 0 })} min="0" step="500" />
                </div>
              </div>
              <div>
                <label className="label">Currency</label>
                <select className="input-field" value={pricingForm.currency} onChange={(e) => setPricingForm({ ...pricingForm, currency: e.target.value })}>
                  <option value="KES">Kenyan Shilling (KES)</option>
                  <option value="USD">US Dollar (USD)</option>
                  <option value="UGX">Ugandan Shilling (UGX)</option>
                  <option value="TZS">Tanzanian Shilling (TZS)</option>
                </select>
              </div>
              <button onClick={handleSavePricing} disabled={savingPricing} className="btn-primary w-full flex items-center justify-center gap-2">
                <Save size={18} /> {savingPricing ? 'Saving...' : 'Save Pricing Settings'}
              </button>
            </div>
          </div>
        )}

        {/* COMPANY SETTINGS TAB */}
        {activeTab === 'company' && (
          <div className="glass-card p-6 max-w-2xl animate-slide-up">
            <h2 className="font-serif text-xl text-navy-700 mb-4 flex items-center gap-2">
              <Building2 size={20} className="text-gold-500" /> Company Information
            </h2>
            <p className="text-navy-500 text-sm mb-6">
              This information will be displayed in the Help Center and contact sections.
            </p>
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="label">Company Name</label><input type="text" className="input-field" value={companyForm.companyName} onChange={(e) => setCompanyForm({ ...companyForm, companyName: e.target.value })} /></div>
                <div><label className="label">Support Email</label><input type="email" className="input-field" value={companyForm.email} onChange={(e) => setCompanyForm({ ...companyForm, email: e.target.value })} /></div>
                <div><label className="label">Primary Phone</label><input type="tel" className="input-field" value={companyForm.phone} onChange={(e) => setCompanyForm({ ...companyForm, phone: e.target.value })} /></div>
                <div><label className="label">Secondary Phone (Optional)</label><input type="tel" className="input-field" value={companyForm.phoneAlt || ''} onChange={(e) => setCompanyForm({ ...companyForm, phoneAlt: e.target.value || null })} /></div>
                <div className="md:col-span-2"><label className="label">Physical Address</label><textarea rows={2} className="input-field" value={companyForm.physicalAddress || ''} onChange={(e) => setCompanyForm({ ...companyForm, physicalAddress: e.target.value || null })} /></div>
                <div className="md:col-span-2"><label className="label">Support Hours</label><input type="text" className="input-field" value={companyForm.supportHours || ''} onChange={(e) => setCompanyForm({ ...companyForm, supportHours: e.target.value || null })} placeholder="e.g., Monday - Friday: 9am - 5pm EAT" /></div>
              </div>

              <div className="pt-4 border-t border-gold-200/30">
                <h3 className="font-semibold text-navy-700 mb-4 flex items-center gap-2"><Globe size={18} className="text-gold-500" /> Social Media Links</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><label className="label">Facebook</label><input type="url" className="input-field" value={companyForm.facebookUrl || ''} onChange={(e) => setCompanyForm({ ...companyForm, facebookUrl: e.target.value || null })} /></div>
                  <div><label className="label">Twitter/X</label><input type="url" className="input-field" value={companyForm.twitterUrl || ''} onChange={(e) => setCompanyForm({ ...companyForm, twitterUrl: e.target.value || null })} /></div>
                  <div><label className="label">Instagram</label><input type="url" className="input-field" value={companyForm.instagramUrl || ''} onChange={(e) => setCompanyForm({ ...companyForm, instagramUrl: e.target.value || null })} /></div>
                  <div><label className="label">LinkedIn</label><input type="url" className="input-field" value={companyForm.linkedinUrl || ''} onChange={(e) => setCompanyForm({ ...companyForm, linkedinUrl: e.target.value || null })} /></div>
                  <div className="md:col-span-2"><label className="label">YouTube</label><input type="url" className="input-field" value={companyForm.youtubeUrl || ''} onChange={(e) => setCompanyForm({ ...companyForm, youtubeUrl: e.target.value || null })} /></div>
                </div>
              </div>

              <button onClick={handleSaveCompanySettings} disabled={savingCompany} className="btn-primary w-full flex items-center justify-center gap-2 mt-4">
                <Save size={18} /> {savingCompany ? 'Saving...' : 'Save Company Settings'}
              </button>
            </div>
          </div>
        )}

        {/* SECURITY TAB - Password Change */}
        {activeTab === 'security' && (
          <div className="animate-slide-up">
            <div className="glass-card p-6 max-w-md">
              <h2 className="font-serif text-xl text-navy-700 mb-4 flex items-center gap-2">
                <Lock size={20} className="text-gold-500" /> Change Password
              </h2>
              <p className="text-navy-500 text-sm mb-6">
                Update your password to keep your account secure.
              </p>
              
              {passwordMessage && (
                <div className={`mb-4 p-3 rounded-lg flex items-center gap-2 ${passwordMessage.type === 'success' ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'}`}>
                  {passwordMessage.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                  {passwordMessage.text}
                </div>
              )}
              
              <form onSubmit={handleChangePassword} className="space-y-5">
                <div>
                  <label className="label">Current Password</label>
                  <div className="relative">
                    <input type={showCurrentPassword ? 'text' : 'password'} required className="input-field pr-12" value={passwordForm.currentPassword} onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })} />
                    <button type="button" onClick={() => setShowCurrentPassword(!showCurrentPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gold-500">
                      {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="label">New Password</label>
                  <div className="relative">
                    <input type={showNewPassword ? 'text' : 'password'} required className="input-field pr-12" value={passwordForm.newPassword} onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} />
                    <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gold-500">
                      {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  <p className="text-xs text-navy-500 mt-1">Password must be at least 6 characters</p>
                </div>
                <div>
                  <label className="label">Confirm New Password</label>
                  <div className="relative">
                    <input type={showConfirmPassword ? 'text' : 'password'} required className="input-field pr-12" value={passwordForm.confirmPassword} onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })} />
                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gold-500">
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
                <button type="submit" disabled={changingPassword} className="btn-primary w-full flex items-center justify-center gap-2">
                  <Lock size={16} /> {changingPassword ? 'Changing...' : 'Change Password'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ADMINS TAB */}
        {activeTab === 'admins' && (
          <>
            <div className="flex justify-end mb-4">
              <button onClick={() => setIsAddAdminModalOpen(true)} className="btn-primary flex items-center gap-2">
                <Plus size={18} /> Add Admin
              </button>
            </div>
            <div className="glass-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gold-200/30 bg-gold-400/5">
                      <th className="text-left py-4 px-6">Name / Email</th>
                      <th className="text-left py-4 px-6">Contact</th>
                      <th className="text-left py-4 px-6">Permissions</th>
                      <th className="text-left py-4 px-6">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {admins.map((admin) => (
                      <tr key={admin.id} className="border-b border-gold-200/20 hover:bg-gold-400/5">
                        <td className="py-4 px-6"><p className="font-semibold">{admin.companyName || 'Admin User'}</p><p className="text-xs text-navy-500">{admin.email}</p></td>
                        <td className="py-4 px-6"><span className="text-sm flex items-center gap-1"><Phone size={12} /> {admin.phone}</span></td>
                        <td className="py-4 px-6"><div className="flex flex-wrap gap-1">
                          {admin.permissions?.canManageAdmins && <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600">Manage Admins</span>}
                          {admin.permissions?.canManageLandlords && <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600">Manage Landlords</span>}
                          {admin.permissions?.canViewAllData && <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-600">View All Data</span>}
                          {admin.permissions?.canManageSystem && <span className="text-xs px-2 py-0.5 rounded-full bg-gold-500/10 text-gold-600">System Config</span>}
                        </div></td>
                        <td className="py-4 px-6 text-sm">{formatDate(admin.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </main>

      {/* Add Admin Modal */}
      {isAddAdminModalOpen && (
        <div className="fixed inset-0 bg-navy-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto" onClick={() => setIsAddAdminModalOpen(false)}>
          <div className="glass-card max-w-md w-full p-6 animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-serif text-2xl text-navy-700">Add New Administrator</h2>
              <button onClick={() => setIsAddAdminModalOpen(false)} className="p-1 hover:bg-gold-400/10 rounded-lg"><X size={20} /></button>
            </div>
            <form onSubmit={handleCreateAdmin} className="space-y-4">
              <div><label className="label">Email Address *</label><input type="email" required className="input-field" value={newAdminForm.email} onChange={(e) => setNewAdminForm({ ...newAdminForm, email: e.target.value })} /></div>
              <div><label className="label">Phone Number *</label><input type="tel" required className="input-field" value={newAdminForm.phone} onChange={(e) => setNewAdminForm({ ...newAdminForm, phone: e.target.value })} /></div>
              <div><label className="label">Password *</label><input type="password" required className="input-field" value={newAdminForm.password} onChange={(e) => setNewAdminForm({ ...newAdminForm, password: e.target.value })} /></div>
              <div><label className="label">Company/Organization</label><input type="text" className="input-field" value={newAdminForm.companyName} onChange={(e) => setNewAdminForm({ ...newAdminForm, companyName: e.target.value })} /></div>
              <div className="pt-2"><label className="label">Permissions</label><div className="space-y-2 mt-2">
                <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={newAdminForm.canManageAdmins} onChange={(e) => setNewAdminForm({ ...newAdminForm, canManageAdmins: e.target.checked })} /><span className="text-sm">Can manage other admins</span></label>
                <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={newAdminForm.canManageLandlords} onChange={(e) => setNewAdminForm({ ...newAdminForm, canManageLandlords: e.target.checked })} /><span className="text-sm">Can manage landlords</span></label>
                <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={newAdminForm.canViewAllData} onChange={(e) => setNewAdminForm({ ...newAdminForm, canViewAllData: e.target.checked })} /><span className="text-sm">Can view all system data</span></label>
                <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={newAdminForm.canManageSystem} onChange={(e) => setNewAdminForm({ ...newAdminForm, canManageSystem: e.target.checked })} /><span className="text-sm">Can manage system settings</span></label>
              </div></div>
              <button type="submit" disabled={actionLoading} className="btn-primary w-full">{actionLoading ? 'Creating...' : 'Create Admin'}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}