// app/admin/properties/PropertiesClient.tsx
'use client'

import { useState } from 'react'
import { Building2, Search, Home, Users, CreditCard, Mail, Phone } from 'lucide-react'

export default function PropertiesClient({ initialData }: any) {
  const [search, setSearch] = useState('')
  const filtered = initialData.properties.filter((p: any) => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.location?.toLowerCase().includes(search.toLowerCase()) || 
    p.landlord?.companyName?.toLowerCase().includes(search.toLowerCase())
  )
  return (
    <div className="min-h-screen bg-gradient-to-br from-cream-200 via-cream-100 to-cream-200 p-6 md:p-10">
      <div className="mb-8">
        <h1 className="heading-premium">Properties</h1>
        <p className="text-navy-500">View all properties across all landlords</p>
        <div className="h-px w-24 bg-gradient-to-r from-gold-400 to-transparent mt-2" />
      </div>
      
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gold-500" size={20} />
        <input type="text" placeholder="Search properties by name, location, or landlord..." className="input-field pl-12" value={search} onChange={e => setSearch(e.target.value)} />
      </div>
      
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gold-200/30 bg-gold-400/5">
                <th className="p-4 text-left">Property</th>
                <th className="p-4 text-left">Landlord</th>
                <th className="p-4 text-left">Location</th>
                <th className="p-4 text-left">Units</th>
                <th className="p-4 text-left">Paybill</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p: any) => (
                <tr key={p.id} className="border-b hover:bg-gold-400/5">
                  <td className="p-4 font-semibold">{p.name}</td>
                  <td className="p-4">
                    <div>{p.landlord?.companyName || 'N/A'}</div>
                    <div className="text-xs text-navy-500 flex gap-2 mt-1">
                      <Mail size={10} /> {p.landlord?.email}
                      <Phone size={10} /> {p.landlord?.phone}
                    </div>
                  </td>
                  <td className="p-4">{p.location || '-'}</td>
                  <td className="p-4">{p.units?.length || 0}</td>
                  <td className="p-4 font-mono text-gold-600">{p.paybillNumber || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}