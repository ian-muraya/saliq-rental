// app/admin/AdminClient.tsx
// Complete admin dashboard with unified edit modal and tab routing

'use client'

import { useState, useMemo, useEffect } from 'react'
import { 
  Users, 
  Building2, 
  Home, 
  CreditCard, 
  AlertCircle,
  CheckCircle,
  Clock,
  Eye,
  X,
  Search,
  DollarSign,
  Shield,
  Ban,
  Check,
  Mail,
  Phone,
  Calendar,
  Edit2,
  Save,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  User,
  Key,
  Layers,
  Plus,
  Trash2,
  Globe,
  Briefcase,
  MapPin
} from 'lucide-react'

interface Tenant {
  id: string
  fullName: string
  phone: string
  email: string | null
  isActive: boolean
  leaseStartDate: string | null
  leaseEndDate: string | null
  rentPaidUntil: string | null
  rentCreditBalance: number
}

interface Unit {
  id: string
  unitNumber: string
  unitType: string
  rentAmount: number
  isOccupied: boolean
  status: string
  tenants?: Tenant[]
}

interface Property {
  id: string
  name: string
  location: string
  totalUnits: number
  occupiedUnits: number
  paybillNumber: string | null
  tillNumber: string | null
  status: string
  units?: Unit[]
}

interface Landlord {
  id: string
  email: string
  phone: string
  companyName: string
  registeredProperties: number
  isActive: boolean
  isRestricted: boolean
  createdAt: string
  landlordProfile: {
    businessRegNo: string | null
    physicalAddress: string | null
    subscriptionStatus: string
    subscriptionExpiresAt: string | null
    propertyCount: number
  }
  properties: Property[]
  invoices: any[]
}

interface AdminClientProps {
  initialData: {
    landlords: Landlord[]
    totalLandlords: number
    totalProperties: number
    totalUnits: number
    totalTenants: number
    totalCollected: number
    pendingInvoices: number
    properties: any[]
    invoices: any[]
  }
  activeTab?: string
}

export default function AdminClient({ initialData, activeTab = 'landlords' }: AdminClientProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [landlords, setLandlords] = useState(initialData.landlords)
  const [selectedLandlord, setSelectedLandlord] = useState<Landlord | null>(null)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isRestrictModalOpen, setIsRestrictModalOpen] = useState(false)
  const [selectedLandlordForAction, setSelectedLandlordForAction] = useState<Landlord | null>(null)
  const [editFormData, setEditFormData] = useState({
    companyName: '',
    email: '',
    phone: '',
    businessRegNo: '',
    physicalAddress: '',
    registeredProperties: 0,
    subscriptionStatus: 'ACTIVE'
  })
  const [actionLoading, setActionLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [expandedLandlords, setExpandedLandlords] = useState<Set<string>>(new Set())
  const [expandedProperties, setExpandedProperties] = useState<Set<string>>(new Set())
  const [selectedView, setSelectedView] = useState<'landlords' | 'properties' | 'tenants'>(activeTab as any)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  // Update URL when tab changes
  useEffect(() => {
    const url = new URL(window.location.href)
    url.searchParams.set('tab', selectedView)
    window.history.pushState({}, '', url.toString())
  }, [selectedView])

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const formatCurrency = (amount: number) => {
    return `KSh ${amount.toLocaleString()}`
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  }

  const toggleLandlordExpand = (landlordId: string) => {
    const newSet = new Set(expandedLandlords)
    if (newSet.has(landlordId)) {
      newSet.delete(landlordId)
    } else {
      newSet.add(landlordId)
    }
    setExpandedLandlords(newSet)
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

  const refreshData = async () => {
    setRefreshing(true)
    try {
      const res = await fetch('/api/admin/landlords')
      if (res.ok) {
        const data = await res.json()
        setLandlords(data)
        showToast('Data refreshed successfully', 'success')
      } else {
        showToast('Failed to refresh data', 'error')
      }
    } catch (error) {
      console.error('Error refreshing data:', error)
      showToast('Failed to refresh data', 'error')
    } finally {
      setRefreshing(false)
    }
  }

  const handleRestrictAccess = async (landlordId: string, action: 'restrict' | 'allow') => {
    setActionLoading(true)
    try {
      const res = await fetch('/api/admin/restrict-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ landlordId, action })
      })
      if (res.ok) {
        showToast(`Account ${action === 'restrict' ? 'restricted' : 'allowed'} successfully`, 'success')
        refreshData()
        setIsRestrictModalOpen(false)
        setSelectedLandlordForAction(null)
      } else {
        const error = await res.json()
        showToast(error.error || 'Failed to update access', 'error')
      }
    } catch (error) {
      showToast('Something went wrong', 'error')
    } finally {
      setActionLoading(false)
    }
  }

  const handleUpdateLandlord = async () => {
    if (!selectedLandlordForAction) return
    setActionLoading(true)
    try {
      const res = await fetch('/api/admin/update-landlord', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          landlordId: selectedLandlordForAction.id,
          companyName: editFormData.companyName,
          email: editFormData.email,
          phone: editFormData.phone,
          businessRegNo: editFormData.businessRegNo,
          physicalAddress: editFormData.physicalAddress,
          registeredProperties: editFormData.registeredProperties,
          subscriptionStatus: editFormData.subscriptionStatus
        })
      })
      if (res.ok) {
        showToast('Landlord information updated successfully', 'success')
        refreshData()
        setIsEditModalOpen(false)
        setSelectedLandlordForAction(null)
      } else {
        const error = await res.json()
        showToast(error.error || 'Failed to update landlord', 'error')
      }
    } catch (error) {
      showToast('Something went wrong', 'error')
    } finally {
      setActionLoading(false)
    }
  }

  const openEditModal = (landlord: Landlord) => {
    setSelectedLandlordForAction(landlord)
    setEditFormData({
      companyName: landlord.companyName || '',
      email: landlord.email,
      phone: landlord.phone,
      businessRegNo: landlord.landlordProfile?.businessRegNo || '',
      physicalAddress: landlord.landlordProfile?.physicalAddress || '',
      registeredProperties: landlord.registeredProperties,
      subscriptionStatus: landlord.landlordProfile?.subscriptionStatus || 'ACTIVE'
    })
    setIsEditModalOpen(true)
  }

  // Working search
  const filteredLandlords = useMemo(() => {
    if (!searchTerm.trim()) return landlords
    
    const term = searchTerm.toLowerCase()
    
    return landlords.filter(landlord => {
      const matchesLandlord = 
        landlord.companyName?.toLowerCase().includes(term) ||
        landlord.email.toLowerCase().includes(term) ||
        landlord.phone.includes(term)
      
      if (matchesLandlord) return true
      
      const hasMatchingProperty = landlord.properties?.some(property =>
        property.name.toLowerCase().includes(term) ||
        property.location?.toLowerCase().includes(term) ||
        property.paybillNumber?.includes(term)
      )
      
      if (hasMatchingProperty) return true
      
      const hasMatchingTenant = landlord.properties?.some(property =>
        property.units?.some(unit =>
          unit.tenants?.some(tenant =>
            tenant.fullName.toLowerCase().includes(term) ||
            tenant.phone.includes(term) ||
            tenant.email?.toLowerCase().includes(term)
          )
        )
      )
      
      return hasMatchingTenant
    })
  }, [landlords, searchTerm])

  // Properties with landlord names for properties view
  const propertiesWithLandlords = useMemo(() => {
    const result: any[] = []
    landlords.forEach(landlord => {
      landlord.properties?.forEach(property => {
        result.push({
          ...property,
          landlordName: landlord.companyName || landlord.email,
          landlordId: landlord.id,
          landlordEmail: landlord.email,
          landlordPhone: landlord.phone
        })
      })
    })
    
    if (!searchTerm.trim()) return result
    
    const term = searchTerm.toLowerCase()
    return result.filter(property =>
      property.name.toLowerCase().includes(term) ||
      property.location?.toLowerCase().includes(term) ||
      property.landlordName.toLowerCase().includes(term) ||
      property.paybillNumber?.includes(term)
    )
  }, [landlords, searchTerm])

  // Tenants with details for tenants view
  const allTenants = useMemo(() => {
    const result: any[] = []
    landlords.forEach(landlord => {
      landlord.properties?.forEach(property => {
        property.units?.forEach(unit => {
          unit.tenants?.forEach(tenant => {
            result.push({
              ...tenant,
              propertyName: property.name,
              propertyLocation: property.location,
              unitNumber: unit.unitNumber,
              landlordName: landlord.companyName || landlord.email,
              landlordId: landlord.id,
              rentAmount: unit.rentAmount
            })
          })
        })
      })
    })
    
    if (!searchTerm.trim()) return result
    
    const term = searchTerm.toLowerCase()
    return result.filter(tenant =>
      tenant.fullName.toLowerCase().includes(term) ||
      tenant.phone.includes(term) ||
      tenant.email?.toLowerCase().includes(term) ||
      tenant.propertyName.toLowerCase().includes(term) ||
      tenant.unitNumber.toLowerCase().includes(term) ||
      tenant.landlordName.toLowerCase().includes(term)
    )
  }, [landlords, searchTerm])

  const stats = [
    { title: 'Total Landlords', value: initialData.totalLandlords, icon: Users, color: 'text-navy-600' },
    { title: 'Total Properties', value: initialData.totalProperties, icon: Building2, color: 'text-gold-600' },
    { title: 'Total Units', value: initialData.totalUnits, icon: Home, color: 'text-blue-600' },
    { title: 'Total Tenants', value: initialData.totalTenants, icon: User, color: 'text-green-600' },
    { title: 'Total Collected', value: formatCurrency(initialData.totalCollected), icon: DollarSign, color: 'text-gold-600' },
    { title: 'Pending Invoices', value: initialData.pendingInvoices, icon: Clock, color: 'text-yellow-600' },
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

      <div className="glass-orb w-[600px] h-[600px] -top-48 -right-48 animate-float" />
      <div className="glass-orb w-[500px] h-[500px] bottom-32 -left-48 animate-float" style={{ animationDelay: '2s' }} />
      
      <main className="p-6 md:p-10 transition-all duration-300 relative z-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-10 animate-fade-in">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Shield className="text-gold-500" size={28} />
              <h1 className="heading-premium">Admin Dashboard</h1>
            </div>
            <p className="text-navy-500 mt-2">Complete oversight of landlords, properties, units, and tenants</p>
            <div className="h-px w-24 bg-gradient-to-r from-gold-400 to-transparent mt-4" />
          </div>
          <div className="flex gap-2 mt-4 sm:mt-0">
            <button onClick={() => setSelectedView('landlords')} className={`px-4 py-2 rounded-lg transition-all duration-300 ${selectedView === 'landlords' ? 'bg-navy-700 text-cream-100' : 'bg-gold-400/10 text-navy-600 hover:bg-gold-400/20'}`}>
              <Users size={16} className="inline mr-2" /> Landlords
            </button>
            <button onClick={() => setSelectedView('properties')} className={`px-4 py-2 rounded-lg transition-all duration-300 ${selectedView === 'properties' ? 'bg-navy-700 text-cream-100' : 'bg-gold-400/10 text-navy-600 hover:bg-gold-400/20'}`}>
              <Building2 size={16} className="inline mr-2" /> Properties
            </button>
            <button onClick={() => setSelectedView('tenants')} className={`px-4 py-2 rounded-lg transition-all duration-300 ${selectedView === 'tenants' ? 'bg-navy-700 text-cream-100' : 'bg-gold-400/10 text-navy-600 hover:bg-gold-400/20'}`}>
              <User size={16} className="inline mr-2" /> Tenants
            </button>
            <button onClick={refreshData} disabled={refreshing} className="btn-secondary flex items-center gap-2">
              <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-8 animate-slide-up">
          {stats.map((stat, idx) => (
            <div key={idx} className="glass-card p-3 text-center">
              <stat.icon size={18} className={`mx-auto mb-1 ${stat.color}`} />
              <p className="text-navy-500 text-xs">{stat.title}</p>
              <p className="font-serif text-lg font-bold text-navy-700">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Search Bar */}
        <div className="mb-8 animate-slide-up">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gold-500" size={20} />
            <input
              type="text"
              placeholder="Search by landlord, property, unit, or tenant..."
              className="input-field pl-12"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-navy-400 hover:text-navy-600"
              >
                <X size={16} />
              </button>
            )}
          </div>
          {searchTerm && (
            <p className="text-xs text-navy-500 mt-2">
              Found {filteredLandlords.length} landlord{filteredLandlords.length !== 1 ? 's' : ''}
              {selectedView === 'properties' && `, ${propertiesWithLandlords.length} properties`}
              {selectedView === 'tenants' && `, ${allTenants.length} tenants`}
            </p>
          )}
        </div>

        {/* LANDLORDS VIEW */}
        {selectedView === 'landlords' && (
          <div className="space-y-4 animate-slide-up">
            {filteredLandlords.length === 0 ? (
              <div className="glass-card p-12 text-center">
                <Users size={48} className="mx-auto text-gold-400 mb-4" />
                <p className="text-navy-500">No landlords found matching "{searchTerm}"</p>
              </div>
            ) : (
              filteredLandlords.map((landlord) => (
                <div key={landlord.id} className="glass-card overflow-hidden">
                  <div 
                    className="p-5 cursor-pointer hover:bg-gold-400/5 transition-colors"
                    onClick={() => toggleLandlordExpand(landlord.id)}
                  >
                    <div className="flex items-center justify-between flex-wrap gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-gold-400/10 flex items-center justify-center">
                          <Building2 size={24} className="text-gold-500" />
                        </div>
                        <div>
                          <h3 className="font-serif text-xl text-navy-700">{landlord.companyName || 'Individual Landlord'}</h3>
                          <div className="flex items-center gap-3 mt-1 flex-wrap">
                            <span className="text-xs text-navy-500 flex items-center gap-1"><Mail size={12} /> {landlord.email}</span>
                            <span className="text-xs text-navy-500 flex items-center gap-1"><Phone size={12} /> {landlord.phone}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${landlord.isRestricted ? 'bg-red-500/10 text-red-600' : 'bg-green-500/10 text-green-600'}`}>
                              {landlord.isRestricted ? 'Restricted' : 'Active'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <p className="text-xs text-navy-500">Properties</p>
                          <p className="font-semibold text-navy-700">{landlord.properties?.length || 0} / {landlord.registeredProperties}</p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={(e) => { e.stopPropagation(); setSelectedLandlord(landlord); setIsViewModalOpen(true); }}
                            className="p-2 hover:bg-gold-400/10 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <Eye size={18} className="text-gold-500" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); openEditModal(landlord); }}
                            className="p-2 hover:bg-gold-400/10 rounded-lg transition-colors"
                            title="Edit Landlord"
                          >
                            <Edit2 size={18} className="text-gold-500" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); setSelectedLandlordForAction(landlord); setIsRestrictModalOpen(true); }}
                            className="p-2 hover:bg-red-500/10 rounded-lg transition-colors"
                            title={landlord.isRestricted ? "Allow Access" : "Restrict Access"}
                          >
                            {landlord.isRestricted ? <Check size={18} className="text-green-500" /> : <Ban size={18} className="text-red-500" />}
                          </button>
                        </div>
                        {expandedLandlords.has(landlord.id) ? <ChevronUp size={20} className="text-gold-500" /> : <ChevronDown size={20} className="text-gold-500" />}
                      </div>
                    </div>
                  </div>

                  {expandedLandlords.has(landlord.id) && landlord.properties && landlord.properties.length > 0 && (
                    <div className="border-t border-gold-200/30 p-5 bg-gold-400/5">
                      <h4 className="font-semibold text-navy-700 mb-4 flex items-center gap-2">
                        <Layers size={16} className="text-gold-500" /> Properties ({landlord.properties.length})
                      </h4>
                      <div className="space-y-3">
                        {landlord.properties.map((property) => (
                          <div key={property.id} className="border border-gold-200/30 rounded-lg overflow-hidden">
                            <div 
                              className="p-4 cursor-pointer hover:bg-gold-400/5 transition-colors flex items-center justify-between flex-wrap gap-3"
                              onClick={() => togglePropertyExpand(property.id)}
                            >
                              <div>
                                <div className="flex items-center gap-2">
                                  <Home size={16} className="text-gold-500" />
                                  <h5 className="font-semibold text-navy-700">{property.name}</h5>
                                </div>
                                <p className="text-xs text-navy-500 mt-1">{property.location || 'Location not specified'}</p>
                              </div>
                              <div className="flex items-center gap-4">
                                <div className="text-right">
                                  <p className="text-xs text-navy-500">Units</p>
                                  <p className="text-sm font-semibold text-navy-700">{property.totalUnits || 0}</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-xs text-navy-500">Occupied</p>
                                  <p className="text-sm font-semibold text-green-600">{property.occupiedUnits || 0}</p>
                                </div>
                                {property.paybillNumber && (
                                  <div className="text-right">
                                    <p className="text-xs text-navy-500">Paybill</p>
                                    <p className="text-xs font-mono text-gold-600">{property.paybillNumber}</p>
                                  </div>
                                )}
                                {expandedProperties.has(property.id) ? <ChevronUp size={16} className="text-gold-500" /> : <ChevronDown size={16} className="text-gold-500" />}
                              </div>
                            </div>

                            {expandedProperties.has(property.id) && property.units && property.units.length > 0 && (
                              <div className="border-t border-gold-200/30 p-4 bg-cream-50/50">
                                <h6 className="text-sm font-semibold text-navy-700 mb-3 flex items-center gap-2">
                                  <Key size={14} className="text-gold-500" /> Units ({property.units.length})
                                </h6>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                  {property.units.map((unit) => (
                                    <div key={unit.id} className="border border-gold-200/30 rounded-lg p-3 bg-white/50">
                                      <div className="flex items-center justify-between mb-2">
                                        <span className="font-semibold text-navy-700">Unit {unit.unitNumber}</span>
                                        <span className={`text-xs px-2 py-0.5 rounded-full ${unit.isOccupied ? 'bg-green-500/10 text-green-600' : 'bg-gold-400/10 text-gold-600'}`}>
                                          {unit.isOccupied ? 'Occupied' : 'Vacant'}
                                        </span>
                                      </div>
                                      <p className="text-sm text-gold-600">Rent: {formatCurrency(unit.rentAmount)}/month</p>
                                      <p className="text-xs text-navy-500 mt-1 capitalize">{unit.unitType?.replace('_', ' ').toLowerCase()}</p>
                                      
                                      {unit.tenants && unit.tenants.length > 0 && (
                                        <div className="mt-3 pt-2 border-t border-gold-200/30">
                                          <p className="text-xs font-semibold text-navy-600 mb-1">Current Tenant:</p>
                                          {unit.tenants.map((tenant) => (
                                            <div key={tenant.id} className="text-sm">
                                              <p className="text-navy-700 font-medium">{tenant.fullName}</p>
                                              <p className="text-xs text-navy-500 flex items-center gap-1"><Phone size={10} /> {tenant.phone}</p>
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* PROPERTIES VIEW - With Landlord Info */}
        {selectedView === 'properties' && (
          <div className="glass-card overflow-hidden animate-slide-up">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gold-200/30 bg-gold-400/5">
                    <th className="text-left py-4 px-6 text-navy-600 font-semibold">Property</th>
                    <th className="text-left py-4 px-6 text-navy-600 font-semibold">Landlord</th>
                    <th className="text-left py-4 px-6 text-navy-600 font-semibold">Contact</th>
                    <th className="text-left py-4 px-6 text-navy-600 font-semibold">Location</th>
                    <th className="text-left py-4 px-6 text-navy-600 font-semibold">Units</th>
                    <th className="text-left py-4 px-6 text-navy-600 font-semibold">Occupied</th>
                    <th className="text-left py-4 px-6 text-navy-600 font-semibold">Paybill</th>
                  </tr>
                </thead>
                <tbody>
                  {propertiesWithLandlords.length === 0 ? (
                    <tr><td colSpan={7} className="py-8 text-center text-navy-500">No properties found matching "{searchTerm}"</td></tr>
                  ) : (
                    propertiesWithLandlords.map((property) => (
                      <tr key={property.id} className="border-b border-gold-200/20 hover:bg-gold-400/5 transition-colors">
                        <td className="py-4 px-6 font-semibold text-navy-700">{property.name}</td>
                        <td className="py-4 px-6"><p className="font-medium text-navy-700">{property.landlordName}</p></td>
                        <td className="py-4 px-6"><div className="flex flex-col gap-1"><span className="text-xs text-navy-500 flex items-center gap-1"><Mail size={12} /> {property.landlordEmail}</span><span className="text-xs text-navy-500 flex items-center gap-1"><Phone size={12} /> {property.landlordPhone}</span></div></td>
                        <td className="py-4 px-6 text-navy-500">{property.location || '-'}</td>
                        <td className="py-4 px-6 text-navy-700">{property.totalUnits || 0}</td>
                        <td className="py-4 px-6 text-green-600">{property.occupiedUnits || 0}</td>
                        <td className="py-4 px-6 font-mono text-xs text-gold-600">{property.paybillNumber || '-'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TENANTS VIEW */}
        {selectedView === 'tenants' && (
          <div className="glass-card overflow-hidden animate-slide-up">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gold-200/30 bg-gold-400/5">
                    <th className="text-left py-4 px-6 text-navy-600 font-semibold">Tenant</th>
                    <th className="text-left py-4 px-6 text-navy-600 font-semibold">Contact</th>
                    <th className="text-left py-4 px-6 text-navy-600 font-semibold">Property/Unit</th>
                    <th className="text-left py-4 px-6 text-navy-600 font-semibold">Landlord</th>
                    <th className="text-left py-4 px-6 text-navy-600 font-semibold">Monthly Rent</th>
                    <th className="text-left py-4 px-6 text-navy-600 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {allTenants.length === 0 ? (
                    <tr><td colSpan={6} className="py-8 text-center text-navy-500">No tenants found matching "{searchTerm}"</td></tr>
                  ) : (
                    allTenants.map((tenant) => (
                      <tr key={tenant.id} className="border-b border-gold-200/20 hover:bg-gold-400/5 transition-colors">
                        <td className="py-4 px-6"><p className="font-semibold text-navy-700">{tenant.fullName}</p></td>
                        <td className="py-4 px-6"><div className="flex flex-col gap-1"><span className="text-sm text-navy-600 flex items-center gap-1"><Phone size={12} /> {tenant.phone}</span>{tenant.email && <span className="text-xs text-navy-500 flex items-center gap-1"><Mail size={12} /> {tenant.email}</span>}</div></td>
                        <td className="py-4 px-6"><p className="text-navy-700">{tenant.propertyName}</p><p className="text-xs text-navy-500">Unit {tenant.unitNumber}</p></td>
                        <td className="py-4 px-6 text-navy-600">{tenant.landlordName}</td>
                        <td className="py-4 px-6 font-semibold text-gold-600">{formatCurrency(tenant.rentAmount)}</td>
                        <td className="py-4 px-6"><span className={`text-xs px-2 py-1 rounded-full ${tenant.isActive ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'}`}>{tenant.isActive ? 'Active' : 'Inactive'}</span></td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* VIEW DETAILS MODAL */}
        {isViewModalOpen && selectedLandlord && (
          <div className="fixed inset-0 bg-navy-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto" onClick={() => setIsViewModalOpen(false)}>
            <div className="glass-card max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 animate-slide-up" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-6">
                <h2 className="font-serif text-2xl text-navy-700">Landlord Details</h2>
                <button onClick={() => setIsViewModalOpen(false)} className="p-1 hover:bg-gold-400/10 rounded-lg"><X size={20} /></button>
              </div>
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold text-navy-700 border-b border-gold-200/30 pb-2 mb-3"><Briefcase size={16} className="inline mr-2 text-gold-500" /> Company Information</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div><span className="text-navy-500 text-sm">Company Name:</span><p className="text-navy-700 font-medium">{selectedLandlord.companyName || 'N/A'}</p></div>
                    <div><span className="text-navy-500 text-sm">Business Reg:</span><p className="text-navy-700">{selectedLandlord.landlordProfile?.businessRegNo || 'N/A'}</p></div>
                    <div><span className="text-navy-500 text-sm">Email:</span><p className="text-navy-700">{selectedLandlord.email}</p></div>
                    <div><span className="text-navy-500 text-sm">Phone:</span><p className="text-navy-700">{selectedLandlord.phone}</p></div>
                    <div className="col-span-2"><span className="text-navy-500 text-sm">Address:</span><p className="text-navy-700">{selectedLandlord.landlordProfile?.physicalAddress || 'N/A'}</p></div>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-navy-700 border-b border-gold-200/30 pb-2 mb-3"><Shield size={16} className="inline mr-2 text-gold-500" /> Subscription</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div><span className="text-navy-500 text-sm">Status:</span><span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${selectedLandlord.landlordProfile?.subscriptionStatus === 'ACTIVE' ? 'bg-green-500/10 text-green-600' : 'bg-yellow-500/10 text-yellow-600'}`}>{selectedLandlord.landlordProfile?.subscriptionStatus || 'PENDING'}</span></div>
                    <div><span className="text-navy-500 text-sm">Registered Limit:</span><p className="text-navy-700">{selectedLandlord.registeredProperties}</p></div>
                    <div><span className="text-navy-500 text-sm">Active Properties:</span><p className="text-navy-700">{selectedLandlord.landlordProfile?.propertyCount || 0}</p></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* UNIFIED EDIT MODAL */}
        {isEditModalOpen && selectedLandlordForAction && (
          <div className="fixed inset-0 bg-navy-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto" onClick={() => setIsEditModalOpen(false)}>
            <div className="glass-card max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 animate-slide-up" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-6">
                <h2 className="font-serif text-2xl text-navy-700">Edit Landlord</h2>
                <button onClick={() => setIsEditModalOpen(false)} className="p-1 hover:bg-gold-400/10 rounded-lg"><X size={20} /></button>
              </div>
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold text-navy-700 border-b border-gold-200/30 pb-2 mb-4"><Briefcase size={18} className="inline mr-2 text-gold-500" /> Company Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><label className="label">Company Name</label><input type="text" className="input-field" value={editFormData.companyName} onChange={(e) => setEditFormData({ ...editFormData, companyName: e.target.value })} /></div>
                    <div><label className="label">Business Registration No.</label><input type="text" className="input-field" value={editFormData.businessRegNo} onChange={(e) => setEditFormData({ ...editFormData, businessRegNo: e.target.value })} /></div>
                    <div><label className="label">Email Address</label><input type="email" className="input-field" value={editFormData.email} onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })} /></div>
                    <div><label className="label">Phone Number</label><input type="tel" className="input-field" value={editFormData.phone} onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })} /></div>
                    <div className="md:col-span-2"><label className="label">Physical Address</label><textarea className="input-field" rows={2} value={editFormData.physicalAddress} onChange={(e) => setEditFormData({ ...editFormData, physicalAddress: e.target.value })} /></div>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-navy-700 border-b border-gold-200/30 pb-2 mb-4"><Shield size={18} className="inline mr-2 text-gold-500" /> Subscription Settings</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><label className="label">Registered Property Limit</label><input type="number" className="input-field" value={editFormData.registeredProperties} onChange={(e) => setEditFormData({ ...editFormData, registeredProperties: parseInt(e.target.value) || 0 })} min={selectedLandlordForAction.properties?.length || 0} /><p className="text-xs text-navy-500 mt-1">Current active: {selectedLandlordForAction.properties?.length || 0} properties</p></div>
                    <div><label className="label">Subscription Status</label><select className="input-field" value={editFormData.subscriptionStatus} onChange={(e) => setEditFormData({ ...editFormData, subscriptionStatus: e.target.value })}><option value="ACTIVE">Active</option><option value="EXPIRED">Expired</option><option value="SUSPENDED">Suspended</option><option value="PENDING_PAYMENT">Pending Payment</option></select></div>
                  </div>
                </div>
                <div className="flex gap-3 pt-4 border-t border-gold-200/30">
                  <button onClick={handleUpdateLandlord} disabled={actionLoading} className="btn-primary flex-1 flex items-center justify-center gap-2"><Save size={18} /> {actionLoading ? 'Saving...' : 'Save All Changes'}</button>
                  <button onClick={() => setIsEditModalOpen(false)} className="btn-secondary flex-1">Cancel</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* RESTRICT ACCESS MODAL */}
        {isRestrictModalOpen && selectedLandlordForAction && (
          <div className="fixed inset-0 bg-navy-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setIsRestrictModalOpen(false)}>
            <div className="glass-card max-w-md w-full p-6 animate-slide-up" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-6">
                <h2 className="font-serif text-2xl text-navy-700">{selectedLandlordForAction.isRestricted ? 'Allow Access' : 'Restrict Access'}</h2>
                <button onClick={() => setIsRestrictModalOpen(false)} className="p-1 hover:bg-gold-400/10 rounded-lg"><X size={20} /></button>
              </div>
              <p className="text-navy-600 mb-6">{selectedLandlordForAction.isRestricted ? `Are you sure you want to allow ${selectedLandlordForAction.companyName || selectedLandlordForAction.email} to access their account?` : `Are you sure you want to restrict ${selectedLandlordForAction.companyName || selectedLandlordForAction.email}'s access?`}</p>
              <div className="flex gap-3">
                <button onClick={() => handleRestrictAccess(selectedLandlordForAction.id, selectedLandlordForAction.isRestricted ? 'allow' : 'restrict')} disabled={actionLoading} className="btn-primary flex-1">{actionLoading ? 'Processing...' : (selectedLandlordForAction.isRestricted ? 'Yes, Allow Access' : 'Yes, Restrict Access')}</button>
                <button onClick={() => setIsRestrictModalOpen(false)} className="btn-secondary flex-1">Cancel</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}