// app/dashboard/payments/PaymentsClient.tsx
// Complete payment management with STK Push, SMS reminders, and proper transaction filtering

'use client'

import { useState, useMemo } from 'react'
import { 
  CreditCard, 
  Search, 
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  Smartphone,
  DollarSign,
  Eye,
  X,
  Send,
  Users,
  Home,
  Phone,
  Building2,
  TrendingUp,
  Wallet,
  CalendarDays,
  ChevronDown,
  ChevronUp,
  ArrowUpRight,
  ArrowDownRight,
  PieChart,
  Landmark,
  MessageSquare,
  Mail,
  Filter
} from 'lucide-react'
import Sidebar from '@/components/ui/Sidebar'

interface Tenant {
  id: string
  fullName: string
  phone: string
  email: string | null
  rentAmount: number
  propertyId: string
  propertyName: string
  propertyPaybill: string | null
  propertyTill: string | null
  unitNumber: string
  rentCreditBalance: number
  rentPaidUntil: string | null
  isActive: boolean
  leaseStartDate: string | null
  leaseEndDate: string | null
}

interface Payment {
  id: string
  amount: number
  status: string
  paymentMethod: string
  mpesaReceipt: string | null
  paymentDate: string
  allocatedFrom: string | null
  allocatedTo: string | null
  monthsCovered: number | null
  remainingCredit: number
  tenant: {
    fullName: string
    phone: string
    unit: {
      unitNumber: string
      property: {
        name: string
      }
    }
  }
}

interface PropertyAnalytics {
  id: string
  name: string
  totalUnits: number
  occupiedUnits: number
  occupancyRate: number
  expectedMonthlyRent: number
  collectedThisMonth: number
  collectionRate: number
  overdueCount: number
  prepaidCount: number
  paybillNumber: string | null
  tillNumber: string | null
}

interface SummaryStats {
  totalProperties: number
  totalUnits: number
  totalTenants: number
  totalExpectedRent: number
  totalCollectedRent: number
  totalOverdueTenants: number
  totalPrepaidTenants: number
  totalMonthlyPaying: number
  overallCollectionRate: number
}

interface PaymentsClientProps {
  initialData: {
    tenants: Tenant[]
    payments: Payment[]
    propertyAnalytics: PropertyAnalytics[]
    summaryStats: SummaryStats
    overdueTenants: Tenant[]
    prepaidTenants: Tenant[]
    monthlyPayingTenants: Tenant[]
  }
}

export default function PaymentsClient({ initialData }: PaymentsClientProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null)
  const [isTenantModalOpen, setIsTenantModalOpen] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false)
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false)
  const [customAmount, setCustomAmount] = useState('')
  const [reminderMessage, setReminderMessage] = useState('')
  const [sendingRequest, setSendingRequest] = useState(false)
  const [sendingReminder, setSendingReminder] = useState(false)
  const [viewMode, setViewMode] = useState<'tenants' | 'payments' | 'properties'>('tenants')
  const [expandedProperties, setExpandedProperties] = useState<Set<string>>(new Set())
  const [showAllTenants, setShowAllTenants] = useState<'overdue' | 'prepaid' | 'monthly' | null>(null)
  const [showLimit] = useState(5)
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'pending' | 'failed'>('all')

  const formatCurrency = (amount: number) => {
    return `KSh ${amount.toLocaleString()}`
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

  // Enhanced search for tenants
  const filteredTenants = useMemo(() => {
    const term = searchTerm.toLowerCase()
    return initialData.tenants.filter(tenant => {
      return (
        tenant.fullName.toLowerCase().includes(term) ||
        tenant.phone.includes(term) ||
        tenant.unitNumber.toLowerCase().includes(term) ||
        tenant.propertyName.toLowerCase().includes(term) ||
        (tenant.email && tenant.email.toLowerCase().includes(term))
      )
    })
  }, [initialData.tenants, searchTerm])

  // Enhanced search for payments with status filter
  const filteredPayments = useMemo(() => {
    const term = searchTerm.toLowerCase()
    let filtered = initialData.payments.filter(payment => {
      return (
        payment.tenant.fullName.toLowerCase().includes(term) ||
        payment.tenant.unit.unitNumber.includes(term) ||
        (payment.mpesaReceipt && payment.mpesaReceipt.toLowerCase().includes(term))
      )
    })
    
    // Apply status filter - only show COMPLETED, PENDING, or FAILED
    if (statusFilter !== 'all') {
      filtered = filtered.filter(p => p.status === statusFilter.toUpperCase())
    }
    
    return filtered
  }, [initialData.payments, searchTerm, statusFilter])

  const getPaymentStatus = (tenant: Tenant) => {
    const today = new Date()
    const paidUntil = tenant.rentPaidUntil ? new Date(tenant.rentPaidUntil) : null
    
    if (!paidUntil) {
      return { status: 'overdue', label: 'Overdue', color: 'text-red-600', bg: 'bg-red-500/10', icon: AlertCircle }
    }
    
    if (paidUntil > today) {
      const monthsPrepaid = Math.ceil((paidUntil.getTime() - today.getTime()) / (1000 * 60 * 60 * 24 * 30))
      return { 
        status: 'prepaid', 
        label: `Prepaid (${monthsPrepaid} mo)`, 
        color: 'text-green-600', 
        bg: 'bg-green-500/10',
        icon: CheckCircle
      }
    }
    
    const daysOverdue = Math.floor((today.getTime() - paidUntil.getTime()) / (1000 * 60 * 60 * 24))
    return { 
      status: 'overdue', 
      label: `Overdue (${daysOverdue} d)`, 
      color: 'text-red-600', 
      bg: 'bg-red-500/10',
      icon: AlertCircle
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  }

  // Generate reminder message with tenant details
  const generateReminderMessage = (tenant: Tenant) => {
    const today = new Date()
    const paidUntil = tenant.rentPaidUntil ? new Date(tenant.rentPaidUntil) : null
    const daysOverdue = paidUntil ? Math.floor((today.getTime() - paidUntil.getTime()) / (1000 * 60 * 60 * 24)) : 30
    
    return `Dear ${tenant.fullName},

This is a friendly reminder that your rent payment is overdue.

📋 Property: ${tenant.propertyName}
🏠 Unit: ${tenant.unitNumber}
💰 Monthly Rent: ${formatCurrency(tenant.rentAmount)}
⏰ Days Overdue: ${daysOverdue > 0 ? daysOverdue : 'Payment due'}

Please make your payment as soon as possible to avoid any penalties.

Paybill: ${tenant.propertyPaybill || '[Your Paybill Number]'}
Account: ${tenant.unitNumber}

If you have already made the payment, please disregard this message.

Best regards,
${tenant.propertyName} Management`
  }

  const handleSendMpesaRequest = async () => {
    if (!selectedTenant) return
    setSendingRequest(true)
    try {
      const res = await fetch('/api/payments/mpesa/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: selectedTenant.id,
          amount: customAmount || selectedTenant.rentAmount.toString(),
          phone: selectedTenant.phone
        })
      })
      if (res.ok) {
        alert(`STK Push payment request sent to ${selectedTenant.fullName}`)
        setIsRequestModalOpen(false)
        setSelectedTenant(null)
        setCustomAmount('')
      } else {
        const error = await res.json()
        alert(error.error || 'Failed to send request')
      }
    } catch (error) {
      alert('Failed to send request')
    } finally {
      setSendingRequest(false)
    }
  }

  const handleSendReminder = async () => {
    if (!selectedTenant) return
    if (!reminderMessage.trim()) {
      alert('Please enter a reminder message')
      return
    }
    if (!selectedTenant.email) {
      alert('This tenant does not have an email address on file.')
      return
    }
    
    setSendingReminder(true)
    try {
      const res = await fetch('/api/landlord/send-reminder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: selectedTenant.id,
          email: selectedTenant.email,
          subject: `Rent Payment Reminder - ${selectedTenant.propertyName}`,
          message: reminderMessage
        })
      })
      if (res.ok) {
        alert(`Reminder email sent to ${selectedTenant.fullName}`)
        setIsReminderModalOpen(false)
        setSelectedTenant(null)
        setReminderMessage('')
      } else {
        const error = await res.json()
        alert(error.error || 'Failed to send reminder')
      }
    } catch (error) {
      alert('Failed to send reminder')
    } finally {
      setSendingReminder(false)
    }
  }

  const stats = initialData.summaryStats

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
              <CreditCard className="text-gold-500" size={28} />
              <h1 className="heading-premium">Rent Collection</h1>
            </div>
            <p className="text-navy-500 mt-2">Track payments, manage tenants, and monitor collections</p>
            <div className="h-px w-24 bg-gradient-to-r from-gold-400 to-transparent mt-4" />
          </div>
          <div className="flex gap-2 mt-4 sm:mt-0">
            <button onClick={() => setViewMode('tenants')} className={`px-4 py-2 rounded-lg transition-all duration-300 ${viewMode === 'tenants' ? 'bg-navy-700 text-cream-100' : 'bg-gold-400/10 text-navy-600 hover:bg-gold-400/20'}`}>
              <Users size={16} className="inline mr-2" /> Tenants
            </button>
            <button onClick={() => setViewMode('properties')} className={`px-4 py-2 rounded-lg transition-all duration-300 ${viewMode === 'properties' ? 'bg-navy-700 text-cream-100' : 'bg-gold-400/10 text-navy-600 hover:bg-gold-400/20'}`}>
              <Building2 size={16} className="inline mr-2" /> Properties
            </button>
            <button onClick={() => setViewMode('payments')} className={`px-4 py-2 rounded-lg transition-all duration-300 ${viewMode === 'payments' ? 'bg-navy-700 text-cream-100' : 'bg-gold-400/10 text-navy-600 hover:bg-gold-400/20'}`}>
              <CreditCard size={16} className="inline mr-2" /> Transactions
            </button>
          </div>
        </div>

        {/* Summary Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-8 animate-slide-up">
          <div className="glass-card p-3 text-center">
            <p className="text-navy-500 text-xs mb-1">Properties</p>
            <p className="font-serif text-xl text-navy-700">{stats.totalProperties}</p>
          </div>
          <div className="glass-card p-3 text-center">
            <p className="text-navy-500 text-xs mb-1">Units</p>
            <p className="font-serif text-xl text-navy-700">{stats.totalUnits}</p>
          </div>
          <div className="glass-card p-3 text-center">
            <p className="text-navy-500 text-xs mb-1">Tenants</p>
            <p className="font-serif text-xl text-navy-700">{stats.totalTenants}</p>
          </div>
          <div className="glass-card p-3 text-center">
            <p className="text-navy-500 text-xs mb-1">Expected</p>
            <p className="font-serif text-sm text-navy-700">{formatCurrency(stats.totalExpectedRent)}</p>
          </div>
          <div className="glass-card p-3 text-center">
            <p className="text-navy-500 text-xs mb-1">Collected</p>
            <p className="font-serif text-sm text-green-600">{formatCurrency(stats.totalCollectedRent)}</p>
          </div>
          <div className="glass-card p-3 text-center">
            <p className="text-navy-500 text-xs mb-1">Collection Rate</p>
            <p className={`font-serif text-xl ${stats.overallCollectionRate >= 70 ? 'text-green-600' : 'text-red-600'}`}>{stats.overallCollectionRate}%</p>
          </div>
          <div className="glass-card p-3 text-center">
            <p className="text-navy-500 text-xs mb-1">Overdue</p>
            <p className="font-serif text-xl text-red-600">{stats.totalOverdueTenants}</p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-8 animate-slide-up">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gold-500" size={20} />
            <input
              type="text"
              placeholder={viewMode === 'tenants' ? "Search by tenant name, phone, unit, property, or email..." : viewMode === 'payments' ? "Search by tenant name, unit number, or receipt number..." : "Search by property name..."}
              className="input-field pl-12"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* PROPERTIES VIEW */}
        {viewMode === 'properties' && (
          <div className="space-y-4 animate-slide-up">
            {initialData.propertyAnalytics.map((property) => (
              <div key={property.id} className="glass-card overflow-hidden">
                <div 
                  className="p-5 cursor-pointer hover:bg-gold-400/5 transition-colors"
                  onClick={() => togglePropertyExpand(property.id)}
                >
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-gold-400/10">
                        <Building2 size={20} className="text-gold-500" />
                      </div>
                      <div>
                        <h3 className="font-serif text-xl text-navy-700">{property.name}</h3>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs text-navy-500">{property.totalUnits} units</span>
                          <span className="text-xs text-green-600">{property.occupiedUnits} occupied</span>
                          {property.paybillNumber && (
                            <span className="text-xs font-mono text-gold-600">Paybill: {property.paybillNumber}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-xs text-navy-500">Expected</p>
                        <p className="font-semibold text-navy-700">{formatCurrency(property.expectedMonthlyRent)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-navy-500">Collected</p>
                        <p className="font-semibold text-green-600">{formatCurrency(property.collectedThisMonth)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-navy-500">Collection Rate</p>
                        <p className={`font-semibold ${property.collectionRate >= 70 ? 'text-green-600' : 'text-red-600'}`}>{property.collectionRate}%</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-navy-500">Occupancy</p>
                        <p className="font-semibold text-navy-700">{property.occupancyRate}%</p>
                      </div>
                      {expandedProperties.has(property.id) ? <ChevronUp size={20} className="text-gold-500" /> : <ChevronDown size={20} className="text-gold-500" />}
                    </div>
                  </div>
                </div>
                
                {expandedProperties.has(property.id) && (
                  <div className="border-t border-gold-200/30 p-5 bg-gold-400/5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold text-navy-700 mb-3 flex items-center gap-2"><AlertCircle size={16} className="text-red-500" /> Overdue Tenants ({property.overdueCount})</h4>
                        {initialData.overdueTenants.filter(t => t.propertyId === property.id).length > 0 ? (
                          <div className="space-y-2">
                            {initialData.overdueTenants.filter(t => t.propertyId === property.id).map(tenant => (
                              <div key={tenant.id} className="flex items-center justify-between p-2 bg-red-500/5 rounded-lg">
                                <div>
                                  <p className="font-medium text-navy-700">{tenant.fullName}</p>
                                  <p className="text-xs text-navy-500">Unit {tenant.unitNumber} · {tenant.phone}</p>
                                </div>
                                <div className="flex gap-2">
                                  <button 
                                    onClick={() => { 
                                      setSelectedTenant(tenant);
                                      setReminderMessage(generateReminderMessage(tenant));
                                      setIsReminderModalOpen(true); 
                                    }} 
                                    className="text-sm text-blue-500 hover:text-blue-600 flex items-center gap-1"
                                  >
                                    <Mail size={14} /> Email
                                  </button>
                                  <button 
                                    onClick={() => { 
                                      setSelectedTenant(tenant); 
                                      setIsRequestModalOpen(true); 
                                    }} 
                                    className="text-sm text-gold-500 hover:text-gold-600 flex items-center gap-1"
                                  >
                                    <Smartphone size={14} /> STK Push
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : <p className="text-sm text-green-600">No overdue tenants</p>}
                      </div>
                      <div>
                        <h4 className="font-semibold text-navy-700 mb-3 flex items-center gap-2"><CheckCircle size={16} className="text-green-500" /> Prepaid Tenants ({property.prepaidCount})</h4>
                        {initialData.prepaidTenants.filter(t => t.propertyId === property.id).length > 0 ? (
                          <div className="space-y-2">
                            {initialData.prepaidTenants.filter(t => t.propertyId === property.id).map(tenant => (
                              <div key={tenant.id} className="flex items-center justify-between p-2 bg-green-500/5 rounded-lg">
                                <div>
                                  <p className="font-medium text-navy-700">{tenant.fullName}</p>
                                  <p className="text-xs text-navy-500">Unit {tenant.unitNumber} · Paid until {formatDate(tenant.rentPaidUntil)}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : <p className="text-sm text-navy-500">No prepaid tenants</p>}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* TENANTS VIEW */}
        {viewMode === 'tenants' && (
          <div className="space-y-6 animate-slide-up">
            {/* Overdue Tenants Card */}
            {initialData.overdueTenants.length > 0 && (
              <div className="glass-card overflow-hidden border-l-4 border-l-red-500">
                <div className="p-5 bg-red-500/5">
                  <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
                    <div className="flex items-center gap-2">
                      <AlertCircle size={24} className="text-red-500" />
                      <h2 className="font-serif text-xl text-navy-700">Overdue Tenants</h2>
                      <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{initialData.overdueTenants.length}</span>
                    </div>
                    <button 
                      onClick={() => setShowAllTenants(showAllTenants === 'overdue' ? null : 'overdue')}
                      className="text-sm text-gold-500 hover:text-gold-600"
                    >
                      {showAllTenants === 'overdue' ? 'Show Less' : `Show All (${initialData.overdueTenants.length})`}
                    </button>
                  </div>
                  <div className="space-y-3">
                    {(showAllTenants === 'overdue' ? initialData.overdueTenants : initialData.overdueTenants.slice(0, showLimit)).map((tenant) => (
                      <div key={tenant.id} className="flex items-center justify-between p-3 bg-white/50 rounded-lg hover:shadow-md transition-shadow cursor-pointer" onClick={() => { setSelectedTenant(tenant); setIsTenantModalOpen(true); }}>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 flex-wrap">
                            <p className="font-semibold text-navy-700">{tenant.fullName}</p>
                            <p className="text-xs text-navy-500">{tenant.propertyName} - Unit {tenant.unitNumber}</p>
                          </div>
                          <div className="flex items-center gap-4 mt-1 text-sm text-navy-500">
                            <span className="flex items-center gap-1"><Phone size={12} /> {tenant.phone}</span>
                            <span className="flex items-center gap-1"><DollarSign size={12} /> {formatCurrency(tenant.rentAmount)}/month</span>
                            {tenant.email && <span className="flex items-center gap-1"><Mail size={12} /> {tenant.email}</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-red-600 font-semibold">Due: {formatDate(tenant.rentPaidUntil)}</span>
                          <button 
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              setSelectedTenant(tenant);
                              setReminderMessage(generateReminderMessage(tenant));
                              setIsReminderModalOpen(true); 
                            }} 
                            className="btn-secondary text-sm py-1.5 px-3 flex items-center gap-1"
                          >
                            <Mail size={14} /> Send Reminder
                          </button>
                          <button 
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              setSelectedTenant(tenant); 
                              setIsRequestModalOpen(true); 
                            }} 
                            className="btn-primary text-sm py-1.5 px-3 flex items-center gap-1"
                          >
                            <Smartphone size={14} /> STK Push
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Prepaid Tenants Card */}
            {initialData.prepaidTenants.length > 0 && (
              <div className="glass-card overflow-hidden border-l-4 border-l-green-500">
                <div className="p-5 bg-green-500/5">
                  <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle size={24} className="text-green-500" />
                      <h2 className="font-serif text-xl text-navy-700">Prepaid Tenants</h2>
                      <span className="bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">{initialData.prepaidTenants.length}</span>
                    </div>
                    <button 
                      onClick={() => setShowAllTenants(showAllTenants === 'prepaid' ? null : 'prepaid')}
                      className="text-sm text-gold-500 hover:text-gold-600"
                    >
                      {showAllTenants === 'prepaid' ? 'Show Less' : `Show All (${initialData.prepaidTenants.length})`}
                    </button>
                  </div>
                  <div className="space-y-3">
                    {(showAllTenants === 'prepaid' ? initialData.prepaidTenants : initialData.prepaidTenants.slice(0, showLimit)).map((tenant) => (
                      <div key={tenant.id} className="flex items-center justify-between p-3 bg-white/50 rounded-lg hover:shadow-md transition-shadow cursor-pointer" onClick={() => { setSelectedTenant(tenant); setIsTenantModalOpen(true); }}>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 flex-wrap">
                            <p className="font-semibold text-navy-700">{tenant.fullName}</p>
                            <p className="text-xs text-navy-500">{tenant.propertyName} - Unit {tenant.unitNumber}</p>
                          </div>
                          <div className="flex items-center gap-4 mt-1 text-sm text-navy-500">
                            <span className="flex items-center gap-1"><Phone size={12} /> {tenant.phone}</span>
                            <span className="flex items-center gap-1"><DollarSign size={12} /> {formatCurrency(tenant.rentAmount)}/month</span>
                            {tenant.rentCreditBalance > 0 && <span className="flex items-center gap-1 text-green-600"><Wallet size={12} /> Credit: {formatCurrency(tenant.rentCreditBalance)}</span>}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-green-600 font-semibold">Paid until {formatDate(tenant.rentPaidUntil)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Monthly Paying Tenants */}
            {initialData.monthlyPayingTenants.length > 0 && (
              <div className="glass-card">
                <div className="p-5">
                  <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
                    <div className="flex items-center gap-2">
                      <CalendarDays size={24} className="text-gold-500" />
                      <h2 className="font-serif text-xl text-navy-700">Monthly Paying Tenants</h2>
                      <span className="bg-gold-500 text-white text-xs px-2 py-0.5 rounded-full">{initialData.monthlyPayingTenants.length}</span>
                    </div>
                    <button 
                      onClick={() => setShowAllTenants(showAllTenants === 'monthly' ? null : 'monthly')}
                      className="text-sm text-gold-500 hover:text-gold-600"
                    >
                      {showAllTenants === 'monthly' ? 'Show Less' : `Show All (${initialData.monthlyPayingTenants.length})`}
                    </button>
                  </div>
                  <div className="space-y-3">
                    {(showAllTenants === 'monthly' ? initialData.monthlyPayingTenants : initialData.monthlyPayingTenants.slice(0, showLimit)).map((tenant) => (
                      <div key={tenant.id} className="flex items-center justify-between p-3 bg-gold-400/5 rounded-lg hover:shadow-md transition-shadow cursor-pointer" onClick={() => { setSelectedTenant(tenant); setIsTenantModalOpen(true); }}>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 flex-wrap">
                            <p className="font-semibold text-navy-700">{tenant.fullName}</p>
                            <p className="text-xs text-navy-500">{tenant.propertyName} - Unit {tenant.unitNumber}</p>
                          </div>
                          <div className="flex items-center gap-4 mt-1 text-sm text-navy-500">
                            <span className="flex items-center gap-1"><Phone size={12} /> {tenant.phone}</span>
                            <span className="flex items-center gap-1"><DollarSign size={12} /> {formatCurrency(tenant.rentAmount)}/month</span>
                          </div>
                        </div>
                        <button 
                          onClick={(e) => { e.stopPropagation(); setSelectedTenant(tenant); setIsRequestModalOpen(true); }} 
                          className="btn-primary text-sm py-1.5 px-3 flex items-center gap-1"
                        >
                          <Smartphone size={14} /> STK Push
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TRANSACTIONS VIEW - Only Completed M-Pesa Transactions */}
        {viewMode === 'payments' && (
          <div className="space-y-4 animate-slide-up">
            {/* Status Filter */}
            <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1 rounded-full text-sm transition-all duration-300 ${statusFilter === 'all' ? 'bg-gold-500 text-white' : 'bg-gold-400/10 text-navy-600 hover:bg-gold-400/20'}`}
              >
                All
              </button>
              <button
                onClick={() => setStatusFilter('completed')}
                className={`px-3 py-1 rounded-full text-sm transition-all duration-300 ${statusFilter === 'completed' ? 'bg-green-500 text-white' : 'bg-green-500/10 text-green-600 hover:bg-green-500/20'}`}
              >
                ✅ Completed
              </button>
              <button
                onClick={() => setStatusFilter('pending')}
                className={`px-3 py-1 rounded-full text-sm transition-all duration-300 ${statusFilter === 'pending' ? 'bg-yellow-500 text-white' : 'bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20'}`}
              >
                ⏳ Pending
              </button>
              <button
                onClick={() => setStatusFilter('failed')}
                className={`px-3 py-1 rounded-full text-sm transition-all duration-300 ${statusFilter === 'failed' ? 'bg-red-500 text-white' : 'bg-red-500/10 text-red-600 hover:bg-red-500/20'}`}
              >
                ❌ Failed
              </button>
            </div>

            <div className="glass-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gold-200/30 bg-gold-400/5">
                      <th className="text-left py-4 px-6 text-navy-600 font-semibold">Date</th>
                      <th className="text-left py-4 px-6 text-navy-600 font-semibold">Tenant</th>
                      <th className="text-left py-4 px-6 text-navy-600 font-semibold">Property/Unit</th>
                      <th className="text-left py-4 px-6 text-navy-600 font-semibold">Amount</th>
                      <th className="text-left py-4 px-6 text-navy-600 font-semibold">Period Covered</th>
                      <th className="text-left py-4 px-6 text-navy-600 font-semibold">Status</th>
                      <th className="text-left py-4 px-6 text-navy-600 font-semibold">Receipt</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPayments.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-navy-500">
                          No transactions found matching your search criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredPayments.map((payment) => {
                        const statusMap = {
                          'COMPLETED': { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-500/10' },
                          'PENDING': { icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-500/10' },
                          'FAILED': { icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-500/10' }
                        }
                        const StatusIcon = statusMap[payment.status as keyof typeof statusMap]?.icon || AlertCircle
                        const statusColor = statusMap[payment.status as keyof typeof statusMap]?.color || 'text-gray-600'
                        const statusBg = statusMap[payment.status as keyof typeof statusMap]?.bg || 'bg-gray-500/10'
                        
                        return (
                          <tr 
                            key={payment.id} 
                            className="border-b border-gold-200/20 hover:bg-gold-400/5 transition-colors cursor-pointer" 
                            onClick={() => { setSelectedPayment(payment); setIsPaymentModalOpen(true); }}
                          >
                            <td className="py-4 px-6 text-navy-700 text-sm">{formatDate(payment.paymentDate)}</td>
                            <td className="py-4 px-6">
                              <p className="font-semibold text-navy-700">{payment.tenant.fullName}</p>
                              <p className="text-xs text-navy-500">{payment.tenant.phone}</p>
                            </td>
                            <td className="py-4 px-6">
                              <p className="text-navy-700">{payment.tenant.unit.property.name}</p>
                              <p className="text-xs text-navy-500">Unit {payment.tenant.unit.unitNumber}</p>
                            </td>
                            <td className="py-4 px-6">
                              <p className="font-semibold text-gold-600">{formatCurrency(payment.amount)}</p>
                              {payment.monthsCovered && payment.monthsCovered > 1 && (
                                <p className="text-xs text-green-600">{payment.monthsCovered} months prepaid</p>
                              )}
                            </td>
                            <td className="py-4 px-6">
                              {payment.allocatedFrom && payment.allocatedTo ? (
                                <div className="text-sm">
                                  <span className="text-navy-700">{formatDate(payment.allocatedFrom)}</span>
                                  <span className="text-navy-400"> - </span>
                                  <span className="text-navy-700">{formatDate(payment.allocatedTo)}</span>
                                </div>
                              ) : (
                                <span className="text-navy-400 text-sm">One-time</span>
                              )}
                            </td>
                            <td className="py-4 px-6">
                              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${statusBg} ${statusColor}`}>
                                <StatusIcon size={12} /> {payment.status}
                              </span>
                            </td>
                            <td className="py-4 px-6">
                              {payment.mpesaReceipt ? (
                                <span className="font-mono text-xs text-gold-600">{payment.mpesaReceipt}</span>
                              ) : (
                                <span className="text-navy-400 text-sm">-</span>
                              )}
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Tenant Details Modal */}
      {isTenantModalOpen && selectedTenant && (
        <div className="fixed inset-0 bg-navy-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto" onClick={() => setIsTenantModalOpen(false)}>
          <div className="glass-card max-w-md w-full p-6 animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-serif text-2xl text-navy-700">Tenant Details</h2>
              <button onClick={() => setIsTenantModalOpen(false)} className="p-1 hover:bg-gold-400/10 rounded-lg"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between border-b border-gold-200/30 pb-2">
                <span className="text-navy-500">Full Name</span>
                <span className="font-semibold text-navy-700">{selectedTenant.fullName}</span>
              </div>
              <div className="flex justify-between border-b border-gold-200/30 pb-2">
                <span className="text-navy-500">Phone Number</span>
                <span className="text-navy-700">{selectedTenant.phone}</span>
              </div>
              {selectedTenant.email && (
                <div className="flex justify-between border-b border-gold-200/30 pb-2">
                  <span className="text-navy-500">Email</span>
                  <span className="text-navy-700">{selectedTenant.email}</span>
                </div>
              )}
              <div className="flex justify-between border-b border-gold-200/30 pb-2">
                <span className="text-navy-500">Property</span>
                <span className="text-navy-700">{selectedTenant.propertyName}</span>
              </div>
              <div className="flex justify-between border-b border-gold-200/30 pb-2">
                <span className="text-navy-500">Unit Number</span>
                <span className="text-navy-700">{selectedTenant.unitNumber}</span>
              </div>
              <div className="flex justify-between border-b border-gold-200/30 pb-2">
                <span className="text-navy-500">Monthly Rent</span>
                <span className="font-bold text-gold-600 text-lg">{formatCurrency(selectedTenant.rentAmount)}</span>
              </div>
              <div className="flex justify-between border-b border-gold-200/30 pb-2">
                <span className="text-navy-500">Payment Status</span>
                <span className={`font-semibold ${getPaymentStatus(selectedTenant).color}`}>{getPaymentStatus(selectedTenant).label}</span>
              </div>
              <div className="flex justify-between border-b border-gold-200/30 pb-2">
                <span className="text-navy-500">Paid Until</span>
                <span className="text-navy-700">{formatDate(selectedTenant.rentPaidUntil)}</span>
              </div>
              <div className="flex justify-between border-b border-gold-200/30 pb-2">
                <span className="text-navy-500">Credit Balance</span>
                <span className={selectedTenant.rentCreditBalance > 0 ? "text-green-600 font-semibold" : "text-navy-500"}>
                  {formatCurrency(selectedTenant.rentCreditBalance)}
                </span>
              </div>
              {selectedTenant.propertyPaybill && (
                <div className="flex justify-between border-b border-gold-200/30 pb-2">
                  <span className="text-navy-500">Paybill Number</span>
                  <span className="font-mono text-gold-600">{selectedTenant.propertyPaybill}</span>
                </div>
              )}
              {selectedTenant.leaseStartDate && (
                <div className="flex justify-between border-b border-gold-200/30 pb-2">
                  <span className="text-navy-500">Lease Period</span>
                  <span className="text-navy-700 text-sm">{formatDate(selectedTenant.leaseStartDate)} - {formatDate(selectedTenant.leaseEndDate)}</span>
                </div>
              )}
              <div className="pt-4 flex gap-3">
                <button
                  onClick={() => {
                    setIsTenantModalOpen(false)
                    setReminderMessage(generateReminderMessage(selectedTenant))
                    setIsReminderModalOpen(true)
                  }}
                  className="btn-secondary flex-1 flex items-center justify-center gap-2"
                >
                  <Mail size={18} /> Send Reminder
                </button>
                <button
                  onClick={() => {
                    setIsTenantModalOpen(false)
                    setIsRequestModalOpen(true)
                  }}
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                >
                  <Smartphone size={18} /> STK Push
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Details Modal */}
      {isPaymentModalOpen && selectedPayment && (
        <div className="fixed inset-0 bg-navy-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setIsPaymentModalOpen(false)}>
          <div className="glass-card max-w-md w-full p-6 animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-serif text-2xl text-navy-700">Transaction Details</h2>
              <button onClick={() => setIsPaymentModalOpen(false)} className="p-1 hover:bg-gold-400/10 rounded-lg"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between border-b border-gold-200/30 pb-2">
                <span className="text-navy-500">Date</span>
                <span className="text-navy-700">{formatDate(selectedPayment.paymentDate)}</span>
              </div>
              <div className="flex justify-between border-b border-gold-200/30 pb-2">
                <span className="text-navy-500">Tenant</span>
                <span className="font-semibold text-navy-700">{selectedPayment.tenant.fullName}</span>
              </div>
              <div className="flex justify-between border-b border-gold-200/30 pb-2">
                <span className="text-navy-500">Property/Unit</span>
                <span className="text-navy-700">{selectedPayment.tenant.unit.property.name} - Unit {selectedPayment.tenant.unit.unitNumber}</span>
              </div>
              <div className="flex justify-between border-b border-gold-200/30 pb-2">
                <span className="text-navy-500">Amount</span>
                <span className="font-bold text-gold-600 text-lg">{formatCurrency(selectedPayment.amount)}</span>
              </div>
              <div className="flex justify-between border-b border-gold-200/30 pb-2">
                <span className="text-navy-500">Status</span>
                <span className={`font-semibold ${
                  selectedPayment.status === 'COMPLETED' ? 'text-green-600' : 
                  selectedPayment.status === 'PENDING' ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {selectedPayment.status}
                </span>
              </div>
              {selectedPayment.monthsCovered && selectedPayment.monthsCovered > 1 && (
                <div className="flex justify-between border-b border-gold-200/30 pb-2">
                  <span className="text-navy-500">Prepaid Months</span>
                  <span className="text-green-600 font-semibold">{selectedPayment.monthsCovered} months</span>
                </div>
              )}
              {selectedPayment.allocatedFrom && selectedPayment.allocatedTo && (
                <div className="flex justify-between border-b border-gold-200/30 pb-2">
                  <span className="text-navy-500">Period Covered</span>
                  <span className="text-navy-700 text-sm">{formatDate(selectedPayment.allocatedFrom)} - {formatDate(selectedPayment.allocatedTo)}</span>
                </div>
              )}
              {selectedPayment.remainingCredit > 0 && (
                <div className="flex justify-between border-b border-gold-200/30 pb-2">
                  <span className="text-navy-500">Remaining Credit</span>
                  <span className="text-green-600 font-semibold">{formatCurrency(selectedPayment.remainingCredit)}</span>
                </div>
              )}
              {selectedPayment.mpesaReceipt && (
                <div className="flex justify-between">
                  <span className="text-navy-500">M-Pesa Receipt</span>
                  <span className="font-mono text-gold-600 text-sm">{selectedPayment.mpesaReceipt}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Send STK Push Request Modal */}
      {isRequestModalOpen && selectedTenant && (
        <div className="fixed inset-0 bg-navy-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setIsRequestModalOpen(false)}>
          <div className="glass-card max-w-md w-full p-6 animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-serif text-2xl text-navy-700">Send STK Push Request</h2>
              <button onClick={() => setIsRequestModalOpen(false)} className="p-1 hover:bg-gold-400/10 rounded-lg"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <div className="bg-gold-400/10 rounded-lg p-3">
                <p className="text-sm text-navy-600">Tenant: <span className="font-semibold text-navy-700">{selectedTenant.fullName}</span></p>
                <p className="text-sm text-navy-600 mt-1">Phone: <span className="font-semibold text-navy-700">{selectedTenant.phone}</span></p>
                <p className="text-sm text-navy-600 mt-1">Property: <span className="font-semibold text-navy-700">{selectedTenant.propertyName} - Unit {selectedTenant.unitNumber}</span></p>
                <p className="text-sm text-navy-600 mt-1">Monthly Rent: <span className="font-semibold text-gold-600">{formatCurrency(selectedTenant.rentAmount)}</span></p>
                {selectedTenant.propertyPaybill && (
                  <p className="text-sm text-navy-600 mt-1">Paybill: <span className="font-mono text-gold-600">{selectedTenant.propertyPaybill}</span></p>
                )}
              </div>
              <div>
                <label className="label">Amount (KSh)</label>
                <input
                  type="number"
                  className="input-field"
                  placeholder={`Default: ${selectedTenant.rentAmount.toLocaleString()}`}
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                />
                <p className="text-xs text-navy-500 mt-1">STK Push sends a prompt directly to the tenant's phone.</p>
              </div>
              <button
                onClick={handleSendMpesaRequest}
                disabled={sendingRequest}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                <Smartphone size={18} />
                {sendingRequest ? 'Sending...' : `Send STK Push to ${selectedTenant.fullName}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Send Email Reminder Modal */}
      {isReminderModalOpen && selectedTenant && (
        <div className="fixed inset-0 bg-navy-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto" onClick={() => setIsReminderModalOpen(false)}>
          <div className="glass-card max-w-2xl w-full p-6 animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-serif text-2xl text-navy-700">Send Email Reminder</h2>
              <button onClick={() => setIsReminderModalOpen(false)} className="p-1 hover:bg-gold-400/10 rounded-lg"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <div className="bg-gold-400/5 rounded-lg p-3">
                <p className="text-sm text-navy-600">To: <span className="font-semibold text-navy-700">{selectedTenant.email || 'No email on file'}</span></p>
                <p className="text-sm text-navy-600 mt-1">Tenant: <span className="font-semibold text-navy-700">{selectedTenant.fullName}</span></p>
                <p className="text-sm text-navy-600 mt-1">Property: <span className="font-semibold text-navy-700">{selectedTenant.propertyName} - Unit {selectedTenant.unitNumber}</span></p>
                {!selectedTenant.email && (
                  <p className="text-sm text-red-500 mt-2">⚠️ This tenant does not have an email address. Please add one in the Tenant details.</p>
                )}
              </div>
              <div>
                <label className="label">Reminder Message</label>
                <textarea
                  rows={10}
                  className="input-field"
                  value={reminderMessage}
                  onChange={(e) => setReminderMessage(e.target.value)}
                  placeholder="Edit the reminder message..."
                />
                <p className="text-xs text-navy-500 mt-1">Customize the message before sending.</p>
              </div>
              <button
                onClick={handleSendReminder}
                disabled={sendingReminder || !selectedTenant.email}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                <Mail size={18} />
                {sendingReminder ? 'Sending...' : `Send Reminder to ${selectedTenant.fullName}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}