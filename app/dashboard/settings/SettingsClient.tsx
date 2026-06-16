// app/dashboard/settings/SettingsClient.tsx
// Complete settings with property selection, real-time updates, billing, and password change

'use client'

import { useState, useEffect } from 'react'
import { 
  Settings, 
  User, 
  Building2, 
  CreditCard, 
  Bell, 
  Shield,
  Save,
  Smartphone,
  Landmark,
  AlertCircle,
  CheckCircle,
  Clock,
  X,
  Edit2,
  Phone,
  Mail,
  MapPin,
  Briefcase,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Lock,
  Eye,
  EyeOff
} from 'lucide-react'
import Sidebar from '@/components/ui/Sidebar'

interface SettingsClientProps {
  initialData: {
    user: any
    properties: any[]
    invoices: any[]
  }
}

export default function SettingsClient({ initialData }: SettingsClientProps) {
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'payments' | 'billing'>('profile')
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [userData, setUserData] = useState(initialData.user)
  const [properties, setProperties] = useState(initialData.properties)
  const [invoices, setInvoices] = useState(initialData.invoices)
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>(properties[0]?.id || '')
  const [expandedProperties, setExpandedProperties] = useState<Set<string>>(new Set())

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

  const [formData, setFormData] = useState({
    companyName: userData?.companyName || '',
    phone: userData?.phone || '',
    email: userData?.email || '',
    businessRegNo: userData?.landlordProfile?.businessRegNo || '',
    physicalAddress: userData?.landlordProfile?.physicalAddress || ''
  })

  const [propertyPaymentData, setPropertyPaymentData] = useState({
    paybillNumber: '',
    tillNumber: ''
  })

  // Refresh data from server
  const refreshData = async () => {
    setRefreshing(true)
    try {
      const res = await fetch('/api/landlord/profile')
      if (res.ok) {
        const data = await res.json()
        setUserData(data)
        setFormData({
          companyName: data.companyName || '',
          phone: data.phone || '',
          email: data.email || '',
          businessRegNo: data.landlordProfile?.businessRegNo || '',
          physicalAddress: data.landlordProfile?.physicalAddress || ''
        })
        setProperties(data.properties || [])
      }
      const invoicesRes = await fetch('/api/landlord/invoices')
      if (invoicesRes.ok) {
        const invoicesData = await invoicesRes.json()
        setInvoices(invoicesData)
      }
    } catch (error) {
      console.error('Error refreshing data:', error)
    } finally {
      setRefreshing(false)
    }
  }

  // Load property payment settings when selected property changes
  useEffect(() => {
    if (selectedPropertyId) {
      const selectedProperty = properties.find(p => p.id === selectedPropertyId)
      if (selectedProperty) {
        setPropertyPaymentData({
          paybillNumber: selectedProperty.paybillNumber || '',
          tillNumber: selectedProperty.tillNumber || ''
        })
      }
    }
  }, [selectedPropertyId, properties])

  const formatCurrency = (amount: number) => {
    return `KSh ${amount.toLocaleString()}`
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PAID':
        return { bg: 'bg-green-500/10', text: 'text-green-600', icon: CheckCircle, label: 'Paid' }
      case 'PENDING':
        return { bg: 'bg-yellow-500/10', text: 'text-yellow-600', icon: Clock, label: 'Pending' }
      case 'OVERDUE':
        return { bg: 'bg-red-500/10', text: 'text-red-600', icon: AlertCircle, label: 'Overdue' }
      default:
        return { bg: 'bg-gray-500/10', text: 'text-gray-600', icon: AlertCircle, label: status }
    }
  }

  const togglePropertyExpand = (propertyId: string) => {
    const newSet = new Set(expandedProperties)
    if (newSet.has(propertyId)) {
      newSet.delete(propertyId)
    } else {
      newSet.add(propertyId)
    }
    setExpandedProperties(newSet)
  }

  const handleSaveProfile = async () => {
    setLoading(true)
    setMessage(null)
    try {
      const res = await fetch('/api/landlord/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: formData.companyName,
          phone: formData.phone,
          businessRegNo: formData.businessRegNo,
          physicalAddress: formData.physicalAddress
        })
      })
      if (res.ok) {
        const data = await res.json()
        setUserData({
          ...userData,
          companyName: data.user.companyName,
          phone: data.user.phone,
          landlordProfile: {
            ...userData?.landlordProfile,
            businessRegNo: data.user.landlordProfile?.businessRegNo,
            physicalAddress: data.user.landlordProfile?.physicalAddress
          }
        })
        setFormData({
          ...formData,
          companyName: data.user.companyName || '',
          phone: data.user.phone || '',
          businessRegNo: data.user.landlordProfile?.businessRegNo || '',
          physicalAddress: data.user.landlordProfile?.physicalAddress || ''
        })
        setMessage({ type: 'success', text: 'Profile updated successfully!' })
        setIsEditing(false)
      } else {
        const error = await res.json()
        setMessage({ type: 'error', text: error.error || 'Failed to update profile' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Something went wrong' })
    } finally {
      setLoading(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' })
      return
    }
    if (passwordForm.newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters' })
      return
    }

    setChangingPassword(true)
    setMessage(null)
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
        setMessage({ type: 'success', text: 'Password changed successfully!' })
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to change password' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Something went wrong' })
    } finally {
      setChangingPassword(false)
    }
  }

  const handleSavePropertyPaymentSettings = async () => {
  if (!selectedPropertyId) {
    setMessage({ type: 'error', text: 'Please select a property first' })
    return
  }
  
  setLoading(true)
  setMessage(null)
  try {
    const res = await fetch(`/api/landlord/properties/${selectedPropertyId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        paybillNumber: propertyPaymentData.paybillNumber,
        tillNumber: propertyPaymentData.tillNumber
      })
    })
    
    const data = await res.json()
    
    if (res.ok) {
      // Update local properties state with the saved data
      setProperties(properties.map(p => 
        p.id === selectedPropertyId 
          ? { ...p, paybillNumber: data.paybillNumber, tillNumber: data.tillNumber }
          : p
      ))
      setMessage({ type: 'success', text: 'Payment settings saved successfully!' })
      
      // Refresh the property list to confirm persistence
      setTimeout(() => refreshData(), 1000)
    } else {
      setMessage({ type: 'error', text: data.error || 'Failed to update payment settings' })
    }
  } catch (error) {
    console.error('Error saving payment settings:', error)
    setMessage({ type: 'error', text: 'Something went wrong' })
  } finally {
    setLoading(false)
  }
}

  const subscriptionStatus = userData?.landlordProfile?.subscriptionStatus
  const subscriptionExpiry = userData?.landlordProfile?.subscriptionExpiresAt
  const registeredProperties = userData?.registeredProperties || 0
  const activeProperties = properties.length

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream-200 via-cream-100 to-cream-200 relative overflow-x-hidden">
      <div className="glass-orb w-[600px] h-[600px] -top-48 -right-48 animate-float" />
      <div className="glass-orb w-[500px] h-[500px] bottom-32 -left-48 animate-float" style={{ animationDelay: '2s' }} />
      
      <Sidebar />
      
      <main className="lg:ml-80 p-6 md:p-10 transition-all duration-300 relative z-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-10 animate-fade-in">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Settings className="text-gold-500" size={28} />
              <h1 className="heading-premium">Settings</h1>
            </div>
            <p className="text-navy-500 mt-2">Manage your account, security, and billing preferences</p>
            <div className="h-px w-24 bg-gradient-to-r from-gold-400 to-transparent mt-4" />
          </div>
          <button onClick={refreshData} disabled={refreshing} className="btn-secondary flex items-center gap-2 mt-4 sm:mt-0">
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 animate-slide-up border-b border-gold-200/30 overflow-x-auto">
          <button onClick={() => setActiveTab('profile')} className={`px-6 py-3 rounded-t-lg transition-all duration-300 whitespace-nowrap flex items-center gap-2 ${activeTab === 'profile' ? 'bg-gold-400/10 text-gold-600 border-b-2 border-gold-500' : 'text-navy-500 hover:text-gold-500'}`}>
            <User size={18} /> Profile
          </button>
          <button onClick={() => setActiveTab('security')} className={`px-6 py-3 rounded-t-lg transition-all duration-300 whitespace-nowrap flex items-center gap-2 ${activeTab === 'security' ? 'bg-gold-400/10 text-gold-600 border-b-2 border-gold-500' : 'text-navy-500 hover:text-gold-500'}`}>
            <Lock size={18} /> Security
          </button>
          <button onClick={() => setActiveTab('payments')} className={`px-6 py-3 rounded-t-lg transition-all duration-300 whitespace-nowrap flex items-center gap-2 ${activeTab === 'payments' ? 'bg-gold-400/10 text-gold-600 border-b-2 border-gold-500' : 'text-navy-500 hover:text-gold-500'}`}>
            <Smartphone size={18} /> Payment Settings
          </button>
          <button onClick={() => setActiveTab('billing')} className={`px-6 py-3 rounded-t-lg transition-all duration-300 whitespace-nowrap flex items-center gap-2 ${activeTab === 'billing' ? 'bg-gold-400/10 text-gold-600 border-b-2 border-gold-500' : 'text-navy-500 hover:text-gold-500'}`}>
            <CreditCard size={18} /> Billing
          </button>
        </div>

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="animate-slide-up">
            <div className="glass-card p-6 mb-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="font-serif text-xl text-navy-700">Company Information</h2>
                {!isEditing && (
                  <button onClick={() => setIsEditing(true)} className="text-gold-500 hover:text-gold-600 flex items-center gap-1">
                    <Edit2 size={16} /> Edit
                  </button>
                )}
              </div>
              
              {message && (
                <div className={`mb-4 p-3 rounded-lg flex items-center gap-2 ${message.type === 'success' ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'}`}>
                  {message.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                  {message.text}
                </div>
              )}
              
              <div className="space-y-4">
                <div>
                  <label className="label">Company Name</label>
                  {isEditing ? (
                    <input type="text" className="input-field" value={formData.companyName} onChange={(e) => setFormData({ ...formData, companyName: e.target.value })} />
                  ) : (
                    <p className="text-navy-700">{userData?.companyName || 'Not set'}</p>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Email Address</label>
                    <p className="text-navy-700 bg-gold-400/10 p-2 rounded-lg">{userData?.email}</p>
                    <p className="text-xs text-navy-500 mt-1">Email cannot be changed. Contact admin for assistance.</p>
                  </div>
                  <div>
                    <label className="label">Phone Number</label>
                    {isEditing ? (
                      <input type="tel" className="input-field" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                    ) : (
                      <p className="text-navy-700">{userData?.phone}</p>
                    )}
                  </div>
                </div>
                <div>
                  <label className="label">Business Registration Number</label>
                  {isEditing ? (
                    <input type="text" className="input-field" value={formData.businessRegNo} onChange={(e) => setFormData({ ...formData, businessRegNo: e.target.value })} />
                  ) : (
                    <p className="text-navy-700">{userData?.landlordProfile?.businessRegNo || 'Not set'}</p>
                  )}
                </div>
                <div>
                  <label className="label">Physical Address</label>
                  {isEditing ? (
                    <textarea className="input-field" rows={2} value={formData.physicalAddress} onChange={(e) => setFormData({ ...formData, physicalAddress: e.target.value })} />
                  ) : (
                    <p className="text-navy-700">{userData?.landlordProfile?.physicalAddress || 'Not set'}</p>
                  )}
                </div>
                {isEditing && (
                  <div className="flex gap-3 pt-4">
                    <button onClick={handleSaveProfile} disabled={loading} className="btn-primary flex items-center gap-2">
                      <Save size={16} /> {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button onClick={() => setIsEditing(false)} className="btn-secondary">Cancel</button>
                  </div>
                )}
              </div>
            </div>

            {/* Properties Overview */}
            <div className="glass-card p-6">
              <h2 className="font-serif text-xl text-navy-700 mb-4">Properties Overview</h2>
              <div className="mb-3 p-3 bg-gold-400/5 rounded-lg">
                <p className="text-sm text-navy-600">
                  Registered Properties Limit: <span className="font-semibold">{registeredProperties}</span> | 
                  Active Properties: <span className="font-semibold">{activeProperties}</span>
                </p>
                {activeProperties > registeredProperties && (
                  <p className="text-xs text-red-500 mt-1">Warning: You have exceeded your registered property limit. Please contact admin.</p>
                )}
              </div>
              <div className="space-y-3">
                {properties.map((property: any) => (
                  <div key={property.id} className="border border-gold-200/30 rounded-lg overflow-hidden">
                    <div className="flex items-center justify-between p-3 cursor-pointer hover:bg-gold-400/5 transition-colors" onClick={() => togglePropertyExpand(property.id)}>
                      <div><p className="font-semibold text-navy-700">{property.name}</p>{property.paybillNumber && <p className="text-xs text-gold-600">Paybill: {property.paybillNumber}</p>}</div>
                      {expandedProperties.has(property.id) ? <ChevronUp size={18} className="text-gold-500" /> : <ChevronDown size={18} className="text-gold-500" />}
                    </div>
                    {expandedProperties.has(property.id) && (
                      <div className="border-t border-gold-200/30 p-3 bg-gold-400/5">
                        <p className="text-sm text-navy-600">Property ID: {property.id}</p>
                        <p className="text-sm text-navy-600">Paybill: {property.paybillNumber || 'Not set'}</p>
                        <p className="text-sm text-navy-600">Till: {property.tillNumber || 'Not set'}</p>
                      </div>
                    )}
                  </div>
                ))}
                {properties.length === 0 && <p className="text-center text-navy-500 py-4">No properties added yet.</p>}
              </div>
            </div>
          </div>
        )}

        {/* Security Tab - Password Change */}
        {activeTab === 'security' && (
          <div className="animate-slide-up">
            <div className="glass-card p-6 max-w-md">
              <h2 className="font-serif text-xl text-navy-700 mb-4 flex items-center gap-2">
                <Lock size={20} className="text-gold-500" /> Change Password
              </h2>
              <p className="text-navy-500 text-sm mb-6">
                Update your password to keep your account secure.
              </p>
              
              {message && (
                <div className={`mb-4 p-3 rounded-lg flex items-center gap-2 ${message.type === 'success' ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'}`}>
                  {message.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                  {message.text}
                </div>
              )}
              
              <form onSubmit={handleChangePassword} className="space-y-5">
                <div>
                  <label className="label">Current Password</label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      required
                      className="input-field pr-12"
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    />
                    <button type="button" onClick={() => setShowCurrentPassword(!showCurrentPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gold-500">
                      {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="label">New Password</label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      required
                      className="input-field pr-12"
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    />
                    <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gold-500">
                      {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  <p className="text-xs text-navy-500 mt-1">Password must be at least 6 characters</p>
                </div>
                <div>
                  <label className="label">Confirm New Password</label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      className="input-field pr-12"
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    />
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

        {/* Payment Settings Tab */}
        {activeTab === 'payments' && (
          <div className="animate-slide-up">
            <div className="glass-card p-6 mb-6">
              <h2 className="font-serif text-xl text-navy-700 mb-4 flex items-center gap-2">
                <Smartphone size={20} className="text-gold-500" /> M-Pesa Collection Settings
              </h2>
              <p className="text-navy-500 text-sm mb-6">
                Configure Paybill or Till numbers for each property. Tenants will use these details to pay rent.
              </p>
              
              <div className="mb-6">
                <label className="label">Select Property</label>
                <select className="input-field" value={selectedPropertyId} onChange={(e) => setSelectedPropertyId(e.target.value)}>
                  {properties.map((property: any) => (<option key={property.id} value={property.id}>{property.name}</option>))}
                </select>
                {properties.length === 0 && <p className="text-xs text-red-500 mt-1">No properties found. Please add a property first.</p>}
              </div>

              {message && (
                <div className={`mb-4 p-3 rounded-lg flex items-center gap-2 ${message.type === 'success' ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'}`}>
                  {message.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                  {message.text}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="label">Paybill Number</label>
                  <input type="text" className="input-field" placeholder="e.g., 123456" value={propertyPaymentData.paybillNumber} onChange={(e) => setPropertyPaymentData({ ...propertyPaymentData, paybillNumber: e.target.value })} />
                  <p className="text-xs text-navy-500 mt-1">Tenants will pay using this Paybill number with their unit number as account number.</p>
                </div>
                <div>
                  <label className="label">Till Number (Optional)</label>
                  <input type="text" className="input-field" placeholder="e.g., 1234567" value={propertyPaymentData.tillNumber} onChange={(e) => setPropertyPaymentData({ ...propertyPaymentData, tillNumber: e.target.value })} />
                </div>
                <button onClick={handleSavePropertyPaymentSettings} disabled={loading || properties.length === 0} className="btn-primary flex items-center gap-2">
                  <Save size={16} /> {loading ? 'Saving...' : 'Save Payment Settings'}
                </button>
              </div>
            </div>

            <div className="glass-card p-6">
              <h2 className="font-serif text-xl text-navy-700 mb-4 flex items-center gap-2">
                <Building2 size={20} className="text-gold-500" /> Property Payment Details
              </h2>
              <div className="space-y-4">
                {properties.map((property: any) => (
                  <div key={property.id} className="border border-gold-200/30 rounded-lg p-4">
                    <h3 className="font-semibold text-navy-700 mb-2">{property.name}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div><span className="text-navy-500">Paybill Number:</span><span className="ml-2 font-mono text-gold-600">{property.paybillNumber || 'Not set'}</span></div>
                      <div><span className="text-navy-500">Till Number:</span><span className="ml-2 font-mono text-gold-600">{property.tillNumber || 'Not set'}</span></div>
                    </div>
                    <p className="text-xs text-navy-400 mt-2">Instruct tenants: Paybill {property.paybillNumber || '[your paybill]'}, Account: Unit Number</p>
                  </div>
                ))}
                {properties.length === 0 && <p className="text-center text-navy-500 py-4">No properties added yet.</p>}
              </div>
            </div>
          </div>
        )}

        {/* Billing Tab */}
        {activeTab === 'billing' && (
          <div className="animate-slide-up">
            <div className="glass-card p-6 mb-6">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <h2 className="font-serif text-xl text-navy-700">Subscription Status</h2>
                  <p className="text-navy-500 text-sm mt-1">Plan: {registeredProperties} Properties (KSh {registeredProperties * 1500}/month)</p>
                </div>
                <div className={`px-4 py-2 rounded-full flex items-center gap-2 ${subscriptionStatus === 'ACTIVE' ? 'bg-green-500/10 text-green-600' : subscriptionStatus === 'PENDING_PAYMENT' ? 'bg-yellow-500/10 text-yellow-600' : 'bg-red-500/10 text-red-600'}`}>
                  {subscriptionStatus === 'ACTIVE' ? <CheckCircle size={16} /> : subscriptionStatus === 'PENDING_PAYMENT' ? <Clock size={16} /> : <AlertCircle size={16} />}
                  {subscriptionStatus === 'ACTIVE' ? 'Active' : subscriptionStatus === 'PENDING_PAYMENT' ? 'Payment Pending' : 'Expired'}
                </div>
              </div>
              {subscriptionExpiry && (
                <div className="mt-4 p-3 bg-gold-400/5 rounded-lg">
                  <p className="text-sm text-navy-600">Next billing date: <span className="font-semibold">{formatDate(subscriptionExpiry)}</span></p>
                  <p className="text-xs text-navy-500 mt-1">Rate: KSh {registeredProperties * 1500}/month or KSh {registeredProperties * 12000}/year (Save 20%)</p>
                </div>
              )}
            </div>

            <div className="glass-card p-6">
              <h2 className="font-serif text-xl text-navy-700 mb-4">Billing History</h2>
              {invoices.length === 0 ? (
                <div className="text-center py-8"><CreditCard size={48} className="mx-auto text-gold-400 mb-3" /><p className="text-navy-500">No billing history yet.</p></div>
              ) : (
                <div className="space-y-3">
                  {invoices.map((invoice: any) => {
                    const status = getStatusBadge(invoice.status)
                    const StatusIcon = status.icon
                    return (
                      <div key={invoice.id} className="flex items-center justify-between p-3 bg-gold-400/5 rounded-lg">
                        <div><p className="font-semibold text-navy-700">{invoice.billingPeriod}</p><p className="text-xs text-navy-500">Due: {formatDate(invoice.dueDate)}</p></div>
                        <div className="text-right"><p className="font-semibold text-gold-600">{formatCurrency(invoice.amount)}</p><p className={`text-xs flex items-center gap-1 ${status.text}`}><StatusIcon size={12} /> {status.label}</p></div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}