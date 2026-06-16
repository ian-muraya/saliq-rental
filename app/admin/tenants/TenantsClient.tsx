'use client'
import { useState } from 'react'
import { Users, Search, Home, Phone, Mail, DollarSign } from 'lucide-react'

export default function TenantsClient({ initialData }: any) {
  const [search, setSearch] = useState('')
  const filtered = initialData.tenants.filter((t: any) => t.fullName.toLowerCase().includes(search.toLowerCase()) || t.phone.includes(search) || t.unit?.property?.name?.toLowerCase().includes(search.toLowerCase()))
  return (
    <div className="min-h-screen bg-gradient-to-br from-cream-200 via-cream-100 to-cream-200 p-6 md:p-10">
      <h1 className="heading-premium">Tenants</h1>
      <div className="relative my-6"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gold-500" size={20} /><input type="text" placeholder="Search tenants..." className="input-field pl-12" value={search} onChange={e => setSearch(e.target.value)} /></div>
      <div className="glass-card overflow-hidden"><div className="overflow-x-auto"><table className="w-full"><thead><tr className="border-b border-gold-200/30 bg-gold-400/5"><th className="p-4 text-left">Tenant</th><th className="p-4 text-left">Contact</th><th className="p-4 text-left">Property/Unit</th><th className="p-4 text-left">Landlord</th><th className="p-4 text-left">Rent</th><th className="p-4 text-left">Status</th></tr></thead><tbody>{filtered.map((t: any) => (<tr key={t.id} className="border-b hover:bg-gold-400/5"><td className="p-4 font-semibold">{t.fullName}</td><td className="p-4"><div className="flex flex-col gap-1"><span className="text-sm flex items-center gap-1"><Phone size={12} />{t.phone}</span>{t.email && <span className="text-xs flex items-center gap-1"><Mail size={12} />{t.email}</span>}</div></td><td className="p-4"><div>{t.unit?.property?.name || 'N/A'}</div><div className="text-xs text-navy-500">Unit {t.unit?.unitNumber}</div></td><td className="p-4">{t.unit?.property?.landlord?.companyName || t.unit?.property?.landlord?.email || 'N/A'}</td><td className="p-4 font-semibold text-gold-600">KSh {t.rentAmount?.toLocaleString()}</td><td className="p-4"><span className={`px-2 py-1 rounded-full text-xs ${t.isActive ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'}`}>{t.isActive ? 'Active' : 'Inactive'}</span></td></tr>))}</tbody></table></div></div>
    </div>
  )
}