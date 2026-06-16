// app/admin/invoices/InvoicesClient.tsx
// Admin Invoices Management Client Component

'use client'

import { useState, useMemo } from 'react'
import { 
  FileText, 
  Search, 
  Eye, 
  X,
  CheckCircle,
  Clock,
  AlertCircle,
  Download,
  Mail,
  RefreshCw,
  Calendar,
  DollarSign,
  Building2,
  User
} from 'lucide-react'

interface Invoice {
  id: string
  propertyCount: number
  amount: number
  billingPeriod: string
  dueDate: string
  paidAt: string | null
  status: string
  mpesaReceipt: string | null
  createdAt: string
  landlord: {
    id: string
    email: string
    companyName: string | null
    phone: string
  }
}

interface InvoicesClientProps {
  initialData: {
    invoices: Invoice[]
  }
}

export default function InvoicesClient({ initialData }: InvoicesClientProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [statusFilter, setStatusFilter] = useState('all')
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

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

  const refreshData = async () => {
    setRefreshing(true)
    try {
      const res = await fetch('/api/admin/invoices')
      if (res.ok) {
        const data = await res.json()
        // Update local state
        showToast('Data refreshed successfully', 'success')
      }
    } catch (error) {
      showToast('Failed to refresh data', 'error')
    } finally {
      setRefreshing(false)
    }
  }

  const filteredInvoices = useMemo(() => {
    let filtered = initialData.invoices
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(inv =>
        inv.landlord.companyName?.toLowerCase().includes(term) ||
        inv.landlord.email.toLowerCase().includes(term) ||
        inv.mpesaReceipt?.toLowerCase().includes(term) ||
        inv.id.toLowerCase().includes(term)
      )
    }
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(inv => inv.status === statusFilter)
    }
    
    return filtered
  }, [initialData.invoices, searchTerm, statusFilter])

  const stats = {
    total: initialData.invoices.length,
    paid: initialData.invoices.filter(i => i.status === 'PAID').length,
    pending: initialData.invoices.filter(i => i.status === 'PENDING').length,
    overdue: initialData.invoices.filter(i => i.status === 'OVERDUE').length,
    totalAmount: initialData.invoices.reduce((sum, i) => sum + i.amount, 0),
    collectedAmount: initialData.invoices.filter(i => i.status === 'PAID').reduce((sum, i) => sum + i.amount, 0)
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

      <div className="glass-orb w-[600px] h-[600px] -top-48 -right-48 animate-float" />
      <div className="glass-orb w-[500px] h-[500px] bottom-32 -left-48 animate-float" style={{ animationDelay: '2s' }} />
      
      <main className="p-6 md:p-10 transition-all duration-300 relative z-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-10 animate-fade-in">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <FileText className="text-gold-500" size={28} />
              <h1 className="heading-premium">Subscription Invoices</h1>
            </div>
            <p className="text-navy-500 mt-2">Track landlord subscription payments</p>
            <div className="h-px w-24 bg-gradient-to-r from-gold-400 to-transparent mt-4" />
          </div>
          <button onClick={refreshData} disabled={refreshing} className="btn-secondary flex items-center gap-2 mt-4 sm:mt-0">
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-8 animate-slide-up">
          <div className="glass-card p-3 text-center">
            <FileText size={18} className="mx-auto mb-1 text-navy-600" />
            <p className="text-navy-500 text-xs">Total</p>
            <p className="font-serif text-lg font-bold text-navy-700">{stats.total}</p>
          </div>
          <div className="glass-card p-3 text-center">
            <CheckCircle size={18} className="mx-auto mb-1 text-green-500" />
            <p className="text-navy-500 text-xs">Paid</p>
            <p className="font-serif text-lg font-bold text-green-600">{stats.paid}</p>
          </div>
          <div className="glass-card p-3 text-center">
            <Clock size={18} className="mx-auto mb-1 text-yellow-500" />
            <p className="text-navy-500 text-xs">Pending</p>
            <p className="font-serif text-lg font-bold text-yellow-600">{stats.pending}</p>
          </div>
          <div className="glass-card p-3 text-center">
            <AlertCircle size={18} className="mx-auto mb-1 text-red-500" />
            <p className="text-navy-500 text-xs">Overdue</p>
            <p className="font-serif text-lg font-bold text-red-600">{stats.overdue}</p>
          </div>
          <div className="glass-card p-3 text-center">
            <DollarSign size={18} className="mx-auto mb-1 text-gold-500" />
            <p className="text-navy-500 text-xs">Total Amount</p>
            <p className="font-serif text-sm font-bold text-navy-700">{formatCurrency(stats.totalAmount)}</p>
          </div>
          <div className="glass-card p-3 text-center">
            <CheckCircle size={18} className="mx-auto mb-1 text-green-500" />
            <p className="text-navy-500 text-xs">Collected</p>
            <p className="font-serif text-sm font-bold text-green-600">{formatCurrency(stats.collectedAmount)}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8 animate-slide-up">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gold-500" size={20} />
            <input
              type="text"
              placeholder="Search by landlord name, email, or receipt number..."
              className="input-field pl-12"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="input-field w-full sm:w-48"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="PAID">Paid</option>
            <option value="PENDING">Pending</option>
            <option value="OVERDUE">Overdue</option>
          </select>
        </div>

        {/* Invoices Table */}
        {filteredInvoices.length === 0 ? (
          <div className="glass-card p-16 text-center animate-slide-up">
            <FileText size={64} className="mx-auto text-gold-400 mb-6" />
            <h3 className="font-serif text-2xl text-navy-700 mb-3">No Invoices Found</h3>
            <p className="text-navy-500">No subscription invoices match your search criteria.</p>
          </div>
        ) : (
          <div className="glass-card overflow-hidden animate-slide-up">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gold-200/30 bg-gold-400/5">
                    <th className="text-left py-4 px-6 text-navy-600 font-semibold">Landlord</th>
                    <th className="text-left py-4 px-6 text-navy-600 font-semibold">Properties</th>
                    <th className="text-left py-4 px-6 text-navy-600 font-semibold">Amount</th>
                    <th className="text-left py-4 px-6 text-navy-600 font-semibold">Period</th>
                    <th className="text-left py-4 px-6 text-navy-600 font-semibold">Due Date</th>
                    <th className="text-left py-4 px-6 text-navy-600 font-semibold">Status</th>
                    <th className="text-left py-4 px-6 text-navy-600 font-semibold">Receipt</th>
                    <th className="text-left py-4 px-6 text-navy-600 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInvoices.map((invoice) => {
                    const status = getStatusBadge(invoice.status)
                    const StatusIcon = status.icon
                    return (
                      <tr key={invoice.id} className="border-b border-gold-200/20 hover:bg-gold-400/5 transition-colors">
                        <td className="py-4 px-6">
                          <p className="font-semibold text-navy-700">{invoice.landlord.companyName || invoice.landlord.email}</p>
                          <p className="text-xs text-navy-500">{invoice.landlord.email}</p>
                        </td>
                        <td className="py-4 px-6 text-navy-700">{invoice.propertyCount} property{invoice.propertyCount !== 1 ? 's' : ''}</td>
                        <td className="py-4 px-6 font-semibold text-gold-600">{formatCurrency(invoice.amount)}</td>
                        <td className="py-4 px-6 text-navy-700 capitalize">{invoice.billingPeriod.toLowerCase()}</td>
                        <td className="py-4 px-6 text-navy-500 text-sm">{formatDate(invoice.dueDate)}</td>
                        <td className="py-4 px-6">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${status.bg} ${status.text}`}>
                            <StatusIcon size={12} /> {status.label}
                          </span>
                         </td>
                        <td className="py-4 px-6">
                          {invoice.mpesaReceipt ? (
                            <span className="font-mono text-xs text-gold-600">{invoice.mpesaReceipt}</span>
                          ) : (
                            <span className="text-navy-400 text-sm">-</span>
                          )}
                         </td>
                        <td className="py-4 px-6">
                          <button
                            onClick={() => { setSelectedInvoice(invoice); setIsModalOpen(true); }}
                            className="p-1 hover:bg-gold-400/10 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <Eye size={18} className="text-gold-500" />
                          </button>
                        </td>
                       </tr>
                    )
                  })}
                </tbody>
               </table>
            </div>
          </div>
        )}
      </main>

      {/* Invoice Details Modal */}
      {isModalOpen && selectedInvoice && (
        <div className="fixed inset-0 bg-navy-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto" onClick={() => setIsModalOpen(false)}>
          <div className="glass-card max-w-md w-full p-6 animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-serif text-2xl text-navy-700">Invoice Details</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-1 hover:bg-gold-400/10 rounded-lg"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <div className="text-center border-b border-gold-200/30 pb-4">
                <FileText size={32} className="mx-auto text-gold-500 mb-2" />
                <p className="font-mono text-sm text-gold-600">{selectedInvoice.id}</p>
              </div>
              <div className="flex justify-between">
                <span className="text-navy-500">Landlord:</span>
                <span className="font-semibold text-navy-700">{selectedInvoice.landlord.companyName || selectedInvoice.landlord.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-navy-500">Email:</span>
                <span className="text-navy-700">{selectedInvoice.landlord.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-navy-500">Phone:</span>
                <span className="text-navy-700">{selectedInvoice.landlord.phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-navy-500">Properties:</span>
                <span className="text-navy-700">{selectedInvoice.propertyCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-navy-500">Amount:</span>
                <span className="font-bold text-gold-600 text-lg">{formatCurrency(selectedInvoice.amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-navy-500">Billing Period:</span>
                <span className="text-navy-700 capitalize">{selectedInvoice.billingPeriod.toLowerCase()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-navy-500">Due Date:</span>
                <span className="text-navy-700">{formatDate(selectedInvoice.dueDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-navy-500">Status:</span>
                <span className={`font-semibold ${
                  selectedInvoice.status === 'PAID' ? 'text-green-600' : 
                  selectedInvoice.status === 'PENDING' ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {selectedInvoice.status}
                </span>
              </div>
              {selectedInvoice.mpesaReceipt && (
                <div className="flex justify-between">
                  <span className="text-navy-500">M-Pesa Receipt:</span>
                  <span className="font-mono text-gold-600">{selectedInvoice.mpesaReceipt}</span>
                </div>
              )}
              {selectedInvoice.paidAt && (
                <div className="flex justify-between">
                  <span className="text-navy-500">Paid On:</span>
                  <span className="text-navy-700">{formatDate(selectedInvoice.paidAt)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}