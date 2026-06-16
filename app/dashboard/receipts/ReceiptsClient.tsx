// app/dashboard/receipts/ReceiptsClient.tsx
// Client component for receipt management

'use client'

import { useState } from 'react'
import { 
  Receipt, 
  Search, 
  Download, 
  Eye,
  Calendar,
  DollarSign,
  Home,
  User,
  FileText,
  Printer,
  Mail,
  X,
  CheckCircle,
  ExternalLink
} from 'lucide-react'
import Sidebar from '@/components/ui/Sidebar'

interface Receipt {
  id: string
  receiptNumber: string
  generatedAt: string
  tenantName: string
  propertyName: string
  unitNumber: string
  amountPaid: number
  monthPaid: string
  transactionCode: string
  pdfUrl: string | null
  payment: {
    id: string
    paymentDate: string
    mpesaReceipt: string | null
    monthsCovered: number | null
  }
}

interface ReceiptsClientProps {
  initialData: {
    receipts: Receipt[]
  }
}

export default function ReceiptsClient({ initialData }: ReceiptsClientProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [downloading, setDownloading] = useState<string | null>(null)

  const filteredReceipts = initialData.receipts.filter(receipt => {
    const matchesSearch = receipt.tenantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      receipt.receiptNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      receipt.unitNumber.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    })
  }

  const formatCurrency = (amount: number) => {
    return `KSh ${amount.toLocaleString()}`
  }

  const handleDownload = async (receipt: Receipt) => {
    setDownloading(receipt.id)
    try {
      const response = await fetch(`/api/receipts/${receipt.receiptNumber}/pdf`, {
        method: 'POST'
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to generate PDF')
      }

      // Get the PDF blob
      const blob = await response.blob()
      
      // Create download link
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `receipt-${receipt.receiptNumber}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Download error:', error)
      alert('Failed to download receipt. Please try again.')
    } finally {
      setDownloading(null)
    }
  }

  const handleEmail = (receipt: Receipt) => {
    const subject = `Rent Receipt - ${receipt.receiptNumber}`
    const body = `Dear ${receipt.tenantName},\n\nPlease find your rent receipt attached.\n\nReceipt Number: ${receipt.receiptNumber}\nAmount: ${formatCurrency(receipt.amountPaid)}\nMonth: ${receipt.monthPaid}\nProperty: ${receipt.propertyName} - Unit ${receipt.unitNumber}\n\nThank you.`
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
  }

  const handlePrint = (receipt: Receipt) => {
    // Open the public download page which has a print button
    window.open(`/receipts/${receipt.receiptNumber}/download`, '_blank')
  }

  const handleViewPublicPage = (receipt: Receipt) => {
    window.open(`/receipts/${receipt.receiptNumber}/download`, '_blank')
  }

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
              <Receipt className="text-gold-500" size={28} />
              <h1 className="heading-premium">Receipts</h1>
            </div>
            <p className="text-navy-500 mt-2">View and download payment receipts</p>
            <div className="h-px w-24 bg-gradient-to-r from-gold-400 to-transparent mt-4" />
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 animate-slide-up">
          <div className="glass-card p-4">
            <p className="text-navy-500 text-sm mb-1">Total Receipts</p>
            <p className="font-serif text-2xl text-navy-700">{initialData.receipts.length}</p>
          </div>
          <div className="glass-card p-4">
            <p className="text-navy-500 text-sm mb-1">Total Amount</p>
            <p className="font-serif text-2xl text-green-600">
              {formatCurrency(initialData.receipts.reduce((sum, r) => sum + r.amountPaid, 0))}
            </p>
          </div>
          <div className="glass-card p-4">
            <p className="text-navy-500 text-sm mb-1">This Month</p>
            <p className="font-serif text-2xl text-gold-600">
              {initialData.receipts.filter(r => {
                const date = new Date(r.generatedAt)
                const now = new Date()
                return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
              }).length}
            </p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-8 animate-slide-up">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gold-500" size={20} />
            <input
              type="text"
              placeholder="Search by tenant name, receipt number, or unit number..."
              className="input-field pl-12"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Receipts Table */}
        {filteredReceipts.length === 0 ? (
          <div className="glass-card p-16 text-center animate-slide-up">
            <Receipt size={64} className="mx-auto text-gold-400 mb-6" />
            <h3 className="font-serif text-2xl text-navy-700 mb-3">No Receipts Found</h3>
            <p className="text-navy-500">Receipts will appear here after tenants make payments.</p>
          </div>
        ) : (
          <div className="glass-card overflow-hidden animate-slide-up">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gold-200/30 bg-gold-400/5">
                    <th className="text-left py-4 px-6 text-navy-600 font-semibold">Receipt #</th>
                    <th className="text-left py-4 px-6 text-navy-600 font-semibold">Tenant</th>
                    <th className="text-left py-4 px-6 text-navy-600 font-semibold">Property/Unit</th>
                    <th className="text-left py-4 px-6 text-navy-600 font-semibold">Amount</th>
                    <th className="text-left py-4 px-6 text-navy-600 font-semibold">Month</th>
                    <th className="text-left py-4 px-6 text-navy-600 font-semibold">Date</th>
                    <th className="text-left py-4 px-6 text-navy-600 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReceipts.map((receipt) => (
                    <tr key={receipt.id} className="border-b border-gold-200/20 hover:bg-gold-400/5 transition-colors">
                      <td className="py-4 px-6">
                        <span className="font-mono text-sm text-gold-600">{receipt.receiptNumber}</span>
                      </td>
                      <td className="py-4 px-6">
                        <p className="font-semibold text-navy-700">{receipt.tenantName}</p>
                      </td>
                      <td className="py-4 px-6">
                        <p className="text-navy-700">{receipt.propertyName}</p>
                        <p className="text-xs text-navy-500">Unit {receipt.unitNumber}</p>
                      </td>
                      <td className="py-4 px-6">
                        <p className="font-semibold text-green-600">{formatCurrency(receipt.amountPaid)}</p>
                        {receipt.payment.monthsCovered && receipt.payment.monthsCovered > 1 && (
                          <p className="text-xs text-gold-500">{receipt.payment.monthsCovered} months prepaid</p>
                        )}
                      </td>
                      <td className="py-4 px-6 text-navy-700">{receipt.monthPaid}</td>
                      <td className="py-4 px-6 text-navy-500 text-sm">{formatDate(receipt.generatedAt)}</td>
                      <td className="py-4 px-6">
                        <div className="flex gap-2">
                          <button
                            onClick={() => { setSelectedReceipt(receipt); setIsModalOpen(true); }}
                            className="p-1 hover:bg-gold-400/10 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <Eye size={18} className="text-gold-500" />
                          </button>
                          <button
                            onClick={() => handleDownload(receipt)}
                            disabled={downloading === receipt.id}
                            className="p-1 hover:bg-gold-400/10 rounded-lg transition-colors"
                            title="Download PDF"
                          >
                            {downloading === receipt.id ? (
                              <div className="w-4 h-4 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Download size={18} className="text-gold-500" />
                            )}
                          </button>
                          <button
                            onClick={() => handlePrint(receipt)}
                            className="p-1 hover:bg-gold-400/10 rounded-lg transition-colors"
                            title="Print"
                          >
                            <Printer size={18} className="text-gold-500" />
                          </button>
                          <button
                            onClick={() => handleEmail(receipt)}
                            className="p-1 hover:bg-gold-400/10 rounded-lg transition-colors"
                            title="Email to Tenant"
                          >
                            <Mail size={18} className="text-gold-500" />
                          </button>
                          <button
                            onClick={() => handleViewPublicPage(receipt)}
                            className="p-1 hover:bg-gold-400/10 rounded-lg transition-colors"
                            title="View Public Page"
                          >
                            <ExternalLink size={18} className="text-gold-500" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Receipt Details Modal */}
      {isModalOpen && selectedReceipt && (
        <div className="fixed inset-0 bg-navy-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto" onClick={() => setIsModalOpen(false)}>
          <div className="glass-card max-w-md w-full p-6 animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-serif text-2xl text-navy-700">Receipt Details</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-1 hover:bg-gold-400/10 rounded-lg"><X size={20} /></button>
            </div>
            
            {/* Receipt Header */}
            <div className="text-center mb-6 border-b border-gold-200/30 pb-4">
              <div className="inline-block p-3 rounded-full bg-gold-400/10 mb-3">
                <Receipt size={32} className="text-gold-500" />
              </div>
              <h3 className="font-serif text-xl text-navy-700">SALIQ RENTAL MANAGEMENT</h3>
              <p className="text-xs text-navy-500 mt-1">Official Rent Receipt</p>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-navy-500">Receipt Number:</span>
                <span className="font-mono text-gold-600 font-semibold">{selectedReceipt.receiptNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-navy-500">Date Issued:</span>
                <span className="text-navy-700">{formatDate(selectedReceipt.generatedAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-navy-500">Tenant Name:</span>
                <span className="font-semibold text-navy-700">{selectedReceipt.tenantName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-navy-500">Property:</span>
                <span className="text-navy-700">{selectedReceipt.propertyName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-navy-500">Unit Number:</span>
                <span className="text-navy-700">{selectedReceipt.unitNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-navy-500">Month Paid:</span>
                <span className="text-navy-700">{selectedReceipt.monthPaid}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-navy-500">Amount Paid:</span>
                <span className="font-bold text-green-600 text-lg">{formatCurrency(selectedReceipt.amountPaid)}</span>
              </div>
              {selectedReceipt.payment.monthsCovered && selectedReceipt.payment.monthsCovered > 1 && (
                <div className="flex justify-between">
                  <span className="text-navy-500">Prepaid Months:</span>
                  <span className="text-green-600 font-semibold">{selectedReceipt.payment.monthsCovered} months</span>
                </div>
              )}
              {selectedReceipt.payment.mpesaReceipt && (
                <div className="flex justify-between">
                  <span className="text-navy-500">M-Pesa Code:</span>
                  <span className="font-mono text-gold-600 text-sm">{selectedReceipt.payment.mpesaReceipt}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-navy-500">Transaction Date:</span>
                <span className="text-navy-700 text-sm">{formatDate(selectedReceipt.payment.paymentDate)}</span>
              </div>
            </div>
            
            <div className="mt-6 pt-4 border-t border-gold-200/30">
              <div className="flex gap-3">
                <button 
                  onClick={() => { 
                    setIsModalOpen(false)
                    handleDownload(selectedReceipt)
                  }} 
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                >
                  <Download size={16} /> Download PDF
                </button>
                <button 
                  onClick={() => { 
                    setIsModalOpen(false)
                    handleViewPublicPage(selectedReceipt)
                  }} 
                  className="btn-secondary flex-1 flex items-center justify-center gap-2"
                >
                  <ExternalLink size={16} /> View Public Page
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}