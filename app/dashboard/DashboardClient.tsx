// app/dashboard/DashboardClient.tsx
// Client component with loading states and error handling

'use client'

import { useState, useEffect } from 'react'
import { 
  Building2, 
  Users, 
  CreditCard, 
  AlertCircle,
  CheckCircle,
  Clock,
  Home,
  TrendingUp
} from 'lucide-react'
import Sidebar from '@/components/ui/Sidebar'

interface DashboardClientProps {
  initialData: {
    properties: any[]
    payments: any[]
    tenants: any[]
  }
}

export default function DashboardClient({ initialData }: DashboardClientProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="min-h-screen bg-cream-200 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gold-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-navy-600">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  const totalProperties = initialData.properties?.length || 0
  const totalUnits = initialData.properties?.reduce((acc, p) => acc + (p.totalUnits || 0), 0) || 0
  const totalTenants = initialData.tenants?.length || 0
  const totalCollected = initialData.payments
    ?.filter(p => p.status === 'COMPLETED')
    .reduce((acc, p) => acc + (p.amount || 0), 0) || 0
  
  const pendingPayments = initialData.payments?.filter(p => p.status === 'PENDING').length || 0
  const occupancyRate = totalUnits > 0 ? (totalTenants / totalUnits) * 100 : 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream-200 via-cream-100 to-cream-200 relative overflow-x-hidden">
      <div className="glass-orb w-[600px] h-[600px] -top-48 -right-48 animate-float" />
      <div className="glass-orb w-[500px] h-[500px] bottom-32 -left-48 animate-float" style={{ animationDelay: '2s' }} />
      
      <Sidebar />
      
      <main className="lg:ml-80 p-4 md:p-8 transition-all duration-300 relative z-10">
        {/* Header */}
        <div className="mb-8 animate-fade-in">
          <h1 className="font-serif text-3xl md:text-4xl text-navy-700">Dashboard</h1>
          <p className="text-gold-500 mt-2">Welcome back to your premium portfolio</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8 animate-slide-up">
          <div className="glass-card p-4 md:p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-gold-400/10 text-gold-500">
                <Building2 size={24} />
              </div>
            </div>
            <h3 className="text-navy-500 text-sm font-medium mb-1">Total Properties</h3>
            <p className="font-serif text-2xl md:text-3xl text-navy-700">{totalProperties}</p>
          </div>

          <div className="glass-card p-4 md:p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-gold-400/10 text-gold-500">
                <Home size={24} />
              </div>
            </div>
            <h3 className="text-navy-500 text-sm font-medium mb-1">Total Units</h3>
            <p className="font-serif text-2xl md:text-3xl text-navy-700">{totalUnits}</p>
          </div>

          <div className="glass-card p-4 md:p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-gold-400/10 text-gold-500">
                <Users size={24} />
              </div>
            </div>
            <h3 className="text-navy-500 text-sm font-medium mb-1">Active Tenants</h3>
            <p className="font-serif text-2xl md:text-3xl text-navy-700">{totalTenants}</p>
          </div>

          <div className="glass-card p-4 md:p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-gold-400/10 text-gold-500">
                <CreditCard size={24} />
              </div>
            </div>
            <h3 className="text-navy-500 text-sm font-medium mb-1">Rent Collected</h3>
            <p className="font-serif text-2xl md:text-3xl text-navy-700">
              KSh {totalCollected.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Second Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Occupancy Rate Card */}
          <div className="glass-card p-6">
            <h3 className="font-serif text-xl text-navy-700 mb-4">Occupancy Rate</h3>
            <div className="relative h-4 bg-gold-200/30 rounded-full overflow-hidden">
              <div 
                className="absolute left-0 top-0 h-full bg-gradient-to-r from-gold-400 to-gold-500 rounded-full transition-all duration-1000"
                style={{ width: `${Math.min(occupancyRate, 100)}%` }}
              />
            </div>
            <p className="text-3xl font-serif text-navy-700 mt-3">{occupancyRate.toFixed(1)}%</p>
            <p className="text-navy-500 text-sm mt-1">{totalTenants} of {totalUnits} units occupied</p>
          </div>

          {/* Payment Status Card */}
          <div className="glass-card p-6">
            <h3 className="font-serif text-xl text-navy-700 mb-4">Payment Overview</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-green-500/10">
                <div className="flex items-center gap-3">
                  <CheckCircle size={20} className="text-green-500" />
                  <span className="text-navy-700">Completed</span>
                </div>
                <span className="font-semibold text-green-600">
                  {initialData.payments?.filter(p => p.status === 'COMPLETED').length || 0}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-yellow-500/10">
                <div className="flex items-center gap-3">
                  <Clock size={20} className="text-yellow-500" />
                  <span className="text-navy-700">Pending</span>
                </div>
                <span className="font-semibold text-yellow-600">{pendingPayments}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-red-500/10">
                <div className="flex items-center gap-3">
                  <AlertCircle size={20} className="text-red-500" />
                  <span className="text-navy-700">Overdue</span>
                </div>
                <span className="font-semibold text-red-600">
                  {initialData.payments?.filter(p => p.status === 'FAILED').length || 0}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        {initialData.payments && initialData.payments.length > 0 && (
          <div className="glass-card p-6 animate-slide-up">
            <h3 className="font-serif text-xl text-navy-700 mb-4">Recent Payments</h3>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[500px]">
                <thead>
                  <tr className="border-b border-gold-200/30">
                    <th className="text-left py-3 text-navy-500 font-medium">Tenant</th>
                    <th className="text-left py-3 text-navy-500 font-medium">Amount</th>
                    <th className="text-left py-3 text-navy-500 font-medium">Status</th>
                    <th className="text-left py-3 text-navy-500 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {initialData.payments.slice(0, 5).map((payment) => (
                    <tr key={payment.id} className="border-b border-gold-200/20 hover:bg-gold-400/5 transition-colors">
                      <td className="py-3 text-navy-700">{payment.tenant?.fullName || 'N/A'}</td>
                      <td className="py-3 text-navy-700">KSh {payment.amount?.toLocaleString() || 0}</td>
                      <td className="py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          payment.status === 'COMPLETED' ? 'bg-green-500/10 text-green-600' :
                          payment.status === 'PENDING' ? 'bg-yellow-500/10 text-yellow-600' :
                          'bg-red-500/10 text-red-600'
                        }`}>
                          {payment.status}
                        </span>
                      </td>
                      <td className="py-3 text-navy-500">
                        {payment.createdAt ? new Date(payment.createdAt).toLocaleDateString() : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Empty state */}
        {(!initialData.properties || initialData.properties.length === 0) && (
          <div className="glass-card p-12 text-center animate-slide-up">
            <Building2 size={48} className="mx-auto text-gold-400 mb-4" />
            <h3 className="font-serif text-2xl text-navy-700 mb-2">Welcome to Saliq!</h3>
            <p className="text-navy-500 mb-6">Get started by adding your first property</p>
            <a href="/dashboard/properties" className="btn-primary inline-block">Add Property →</a>
          </div>
        )}
      </main>
    </div>
  )
}