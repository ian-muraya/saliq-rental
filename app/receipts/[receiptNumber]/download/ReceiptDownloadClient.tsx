// app/receipts/[receiptNumber]/download/ReceiptDownloadClient.tsx
// Client component for receipt download page

'use client'

import { useState, useEffect } from 'react'
import { Download, Printer, Mail, Share2, CheckCircle, Building2, User, Calendar, DollarSign, Home, FileText } from 'lucide-react'

interface ReceiptData {
  id: string
  receiptNumber: string
  tenantName: string
  propertyName: string
  unitNumber: string
  amountPaid: number
  monthPaid: string
  transactionCode: string
  generatedAt: string
  payment: {
    mpesaReceipt: string | null
    paymentDate: string | null
  }
}

export default function ReceiptDownloadClient({ receipt }: { receipt: ReceiptData }) {
  const [downloading, setDownloading] = useState(false)
  const [copied, setCopied] = useState(false)

  const formatCurrency = (amount: number) => {
    return `KSh ${amount.toLocaleString()}`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const handleDownload = async () => {
    setDownloading(true)
    try {
      // Call API to generate PDF
      const res = await fetch(`/api/receipts/${receipt.receiptNumber}/pdf`, {
        method: 'POST'
      })
      
      if (res.ok) {
        const blob = await res.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `receipt-${receipt.receiptNumber}.pdf`
        document.body.appendChild(a)
        a.click()
        a.remove()
        window.URL.revokeObjectURL(url)
      } else {
        alert('Failed to generate PDF. Please try again.')
      }
    } catch (error) {
      console.error('Download error:', error)
      alert('Failed to download receipt')
    } finally {
      setDownloading(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 3000)
  }

  const handleEmail = () => {
    const subject = `Rent Receipt - ${receipt.receiptNumber}`
    const body = `Dear ${receipt.tenantName},\n\nPlease find your rent receipt attached.\n\nReceipt Number: ${receipt.receiptNumber}\nAmount: ${formatCurrency(receipt.amountPaid)}\nMonth: ${receipt.monthPaid}\nProperty: ${receipt.propertyName} - Unit ${receipt.unitNumber}\n\nThank you.`
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream-200 via-cream-100 to-cream-200 py-10 px-4">
      <div className="max-w-2xl mx-auto animate-fade-in">
        {/* Receipt Card */}
        <div className="glass-card p-8 md:p-10">
          {/* Header */}
          <div className="text-center mb-8 border-b border-gold-200/30 pb-6">
            <div className="inline-block p-4 rounded-full bg-gold-400/10 mb-4">
              <Receipt size={48} className="text-gold-500" />
            </div>
            <h1 className="font-serif text-3xl text-navy-700">Official Rent Receipt</h1>
            <p className="text-navy-500 text-sm mt-1">Saliq Rental Management</p>
          </div>

          {/* Receipt Content */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-navy-500 font-medium uppercase tracking-wider">Receipt Number</p>
                <p className="font-mono text-gold-600 font-semibold">{receipt.receiptNumber}</p>
              </div>
              <div>
                <p className="text-xs text-navy-500 font-medium uppercase tracking-wider">Date Issued</p>
                <p className="text-navy-700">{formatDate(receipt.generatedAt)}</p>
              </div>
            </div>

            <div className="border-t border-gold-200/30 my-2 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-navy-500 font-medium uppercase tracking-wider flex items-center gap-1">
                    <User size={12} /> Tenant
                  </p>
                  <p className="font-semibold text-navy-700">{receipt.tenantName}</p>
                </div>
                <div>
                  <p className="text-xs text-navy-500 font-medium uppercase tracking-wider flex items-center gap-1">
                    <Home size={12} /> Property/Unit
                  </p>
                  <p className="text-navy-700">{receipt.propertyName} - Unit {receipt.unitNumber}</p>
                </div>
              </div>
            </div>

            <div className="border-t border-gold-200/30 my-2 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-navy-500 font-medium uppercase tracking-wider flex items-center gap-1">
                    <Calendar size={12} /> Month Paid
                  </p>
                  <p className="text-navy-700">{receipt.monthPaid}</p>
                </div>
                <div>
                  <p className="text-xs text-navy-500 font-medium uppercase tracking-wider flex items-center gap-1">
                    <DollarSign size={12} /> Amount Paid
                  </p>
                  <p className="font-bold text-gold-600 text-2xl">{formatCurrency(receipt.amountPaid)}</p>
                </div>
              </div>
            </div>

            {receipt.payment.mpesaReceipt && (
              <div className="border-t border-gold-200/30 my-2 pt-4">
                <p className="text-xs text-navy-500 font-medium uppercase tracking-wider">M-Pesa Transaction Code</p>
                <p className="font-mono text-sm text-gold-600">{receipt.payment.mpesaReceipt}</p>
              </div>
            )}

            <div className="border-t border-gold-200/30 my-2 pt-4">
              <p className="text-xs text-navy-500 font-medium uppercase tracking-wider">Transaction Reference</p>
              <p className="font-mono text-sm text-navy-600">{receipt.transactionCode}</p>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 pt-4 border-t border-gold-200/30 text-center text-xs text-navy-400">
            <p>This is a computer-generated receipt and does not require a signature.</p>
            <p className="mt-1">For any queries, please contact your property manager.</p>
          </div>

          {/* Action Buttons */}
          <div className="mt-8 flex flex-wrap gap-3 justify-center">
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="btn-primary flex items-center gap-2"
            >
              <Download size={18} />
              {downloading ? 'Generating...' : 'Download PDF'}
            </button>
            <button
              onClick={handlePrint}
              className="btn-secondary flex items-center gap-2"
            >
              <Printer size={18} />
              Print
            </button>
            <button
              onClick={handleEmail}
              className="btn-secondary flex items-center gap-2"
            >
              <Mail size={18} />
              Email
            </button>
            <button
              onClick={handleCopyLink}
              className="btn-secondary flex items-center gap-2"
            >
              {copied ? <CheckCircle size={18} className="text-green-500" /> : <Share2 size={18} />}
              {copied ? 'Copied!' : 'Copy Link'}
            </button>
          </div>
        </div>

        {/* Footer Note */}
        <p className="text-center text-xs text-navy-400 mt-6">
          This receipt is automatically generated for your records.
          {receipt.payment.mpesaReceipt && ` M-Pesa Reference: ${receipt.payment.mpesaReceipt}`}
        </p>
      </div>
    </div>
  )
}