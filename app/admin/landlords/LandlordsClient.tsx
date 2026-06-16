// app/admin/landlords/LandlordsClient.tsx
'use client'

import { useState } from 'react'
import { Users, Mail, Phone, Eye, Edit2, Ban, Check, Shield, Building2, Home, CreditCard, X, Save, AlertCircle, CheckCircle, Search } from 'lucide-react'

export default function LandlordsClient({ initialData }: { initialData: { landlords: any[] } }) {
  const [landlords, setLandlords] = useState(initialData.landlords)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedLandlord, setSelectedLandlord] = useState<any>(null)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isRestrictModalOpen, setIsRestrictModalOpen] = useState(false)
  const [selectedForAction, setSelectedForAction] = useState<any>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: string } | null>(null)
  const [editForm, setEditForm] = useState({ companyName: '', email: '', phone: '', businessRegNo: '', physicalAddress: '', registeredProperties: 0 })

  const showToast = (message: string, type: string) => { setToast({ message, type }); setTimeout(() => setToast(null), 3000) }
  const formatDate = (d: string) => new Date(d).toLocaleDateString()

  const filteredLandlords = landlords.filter(l => 
    l.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.phone.includes(searchTerm)
  )

  const handleRestrict = async (id: string, action: string) => {
    setActionLoading(true)
    try {
      const res = await fetch('/api/admin/restrict-access', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ landlordId: id, action }) })
      if (res.ok) { showToast(`Account ${action === 'restrict' ? 'restricted' : 'allowed'}`, 'success'); window.location.reload() }
      else showToast('Failed', 'error')
    } catch (error) { showToast('Error', 'error') }
    finally { setActionLoading(false); setIsRestrictModalOpen(false) }
  }

  const handleUpdate = async () => {
    if (!selectedForAction) return
    setActionLoading(true)
    try {
      const res = await fetch('/api/admin/update-landlord', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ landlordId: selectedForAction.id, ...editForm }) })
      if (res.ok) { showToast('Updated successfully', 'success'); window.location.reload() }
      else showToast('Failed', 'error')
    } catch (error) { showToast('Error', 'error') }
    finally { setActionLoading(false); setIsEditModalOpen(false) }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream-200 via-cream-100 to-cream-200 p-6 md:p-10">
      {toast && <div className="fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 bg-green-500 text-white"><CheckCircle size={18} />{toast.message}</div>}
      
      <div className="flex justify-between items-center mb-8">
        <div><h1 className="heading-premium">Landlords</h1><p className="text-navy-500">Manage all registered landlords</p><div className="h-px w-24 bg-gradient-to-r from-gold-400 to-transparent mt-2" /></div>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gold-500" size={20} />
        <input type="text" placeholder="Search by name, email, or phone..." className="input-field pl-12" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gold-200/30 bg-gold-400/5">
                <th className="text-left py-4 px-6">Company</th>
                <th className="text-left py-4 px-6">Contact</th>
                <th className="text-left py-4 px-6">Properties</th>
                <th className="text-left py-4 px-6">Status</th>
                <th className="text-left py-4 px-6">Joined</th>
                <th className="text-left py-4 px-6">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredLandlords.map(l => (
                <tr key={l.id} className="border-b border-gold-200/20 hover:bg-gold-400/5">
                  <td className="py-4 px-6 font-semibold">{l.companyName || 'N/A'}</td>
                  <td className="py-4 px-6">
                    <div className="flex flex-col gap-1">
                      <span className="text-sm flex items-center gap-1"><Mail size={12} />{l.email}</span>
                      <span className="text-sm flex items-center gap-1"><Phone size={12} />{l.phone}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6">{l.properties?.length || 0} / {l.registeredProperties}</td>
                  <td className="py-4 px-6">
                    <span className={`px-2 py-1 rounded-full text-xs ${l.isRestricted ? 'bg-red-500/10 text-red-600' : 'bg-green-500/10 text-green-600'}`}>
                      {l.isRestricted ? 'Restricted' : 'Active'}
                    </span>
                  </td>
                  <td className="py-4 px-6">{formatDate(l.createdAt)}</td>
                  <td className="py-4 px-6">
                    <div className="flex gap-2">
                      <button onClick={() => { setSelectedLandlord(l); setIsViewModalOpen(true); }} className="p-1 hover:bg-gold-400/10 rounded">
                        <Eye size={18} className="text-gold-500" />
                      </button>
                      <button onClick={() => { setSelectedForAction(l); setEditForm({ companyName: l.companyName || '', email: l.email, phone: l.phone, businessRegNo: l.landlordProfile?.businessRegNo || '', physicalAddress: l.landlordProfile?.physicalAddress || '', registeredProperties: l.registeredProperties }); setIsEditModalOpen(true); }} className="p-1 hover:bg-gold-400/10 rounded">
                        <Edit2 size={18} className="text-gold-500" />
                      </button>
                      <button onClick={() => { setSelectedForAction(l); setIsRestrictModalOpen(true); }} className="p-1 hover:bg-red-500/10 rounded">
                        {l.isRestricted ? <Check size={18} className="text-green-500" /> : <Ban size={18} className="text-red-500" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Details Modal */}
      {isViewModalOpen && selectedLandlord && (
        <div className="fixed inset-0 bg-navy-900/60 z-50 flex items-center justify-center p-4">
          <div className="glass-card max-w-md w-full p-6">
            <div className="flex justify-between">
              <h2 className="font-serif text-2xl">Landlord Details</h2>
              <button onClick={() => setIsViewModalOpen(false)}><X size={20} /></button>
            </div>
            <div className="space-y-3 mt-4">
              <p><strong>Company:</strong> {selectedLandlord.companyName || 'N/A'}</p>
              <p><strong>Email:</strong> {selectedLandlord.email}</p>
              <p><strong>Phone:</strong> {selectedLandlord.phone}</p>
              <p><strong>Properties:</strong> {selectedLandlord.properties?.length} / {selectedLandlord.registeredProperties}</p>
              <p><strong>Status:</strong> {selectedLandlord.isRestricted ? 'Restricted' : 'Active'}</p>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditModalOpen && selectedForAction && (
        <div className="fixed inset-0 bg-navy-900/60 z-50 flex items-center justify-center p-4">
          <div className="glass-card max-w-md w-full p-6">
            <h2 className="font-serif text-2xl mb-4">Edit Landlord</h2>
            <div className="space-y-3">
              <input placeholder="Company Name" className="input-field" value={editForm.companyName} onChange={e => setEditForm({...editForm, companyName: e.target.value})} />
              <input placeholder="Email" className="input-field" value={editForm.email} onChange={e => setEditForm({...editForm, email: e.target.value})} />
              <input placeholder="Phone" className="input-field" value={editForm.phone} onChange={e => setEditForm({...editForm, phone: e.target.value})} />
              <input placeholder="Business Reg No" className="input-field" value={editForm.businessRegNo} onChange={e => setEditForm({...editForm, businessRegNo: e.target.value})} />
              <textarea placeholder="Physical Address" className="input-field" rows={2} value={editForm.physicalAddress} onChange={e => setEditForm({...editForm, physicalAddress: e.target.value})} />
              <input type="number" placeholder="Property Limit" className="input-field" value={editForm.registeredProperties} onChange={e => setEditForm({...editForm, registeredProperties: parseInt(e.target.value)})} />
              <div className="flex gap-3">
                <button onClick={handleUpdate} disabled={actionLoading} className="btn-primary flex-1">{actionLoading ? 'Saving...' : 'Save Changes'}</button>
                <button onClick={() => setIsEditModalOpen(false)} className="btn-secondary flex-1">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Restrict Modal */}
      {isRestrictModalOpen && selectedForAction && (
        <div className="fixed inset-0 bg-navy-900/60 z-50 flex items-center justify-center p-4">
          <div className="glass-card max-w-md w-full p-6">
            <h2 className="font-serif text-2xl">{selectedForAction.isRestricted ? 'Allow Access' : 'Restrict Access'}</h2>
            <p className="my-4">
              {selectedForAction.isRestricted 
                ? `Allow ${selectedForAction.companyName || selectedForAction.email} to access their account?` 
                : `Restrict ${selectedForAction.companyName || selectedForAction.email}'s access?`}
            </p>
            <div className="flex gap-3">
              <button onClick={() => handleRestrict(selectedForAction.id, selectedForAction.isRestricted ? 'allow' : 'restrict')} className="btn-primary flex-1">Confirm</button>
              <button onClick={() => setIsRestrictModalOpen(false)} className="btn-secondary flex-1">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}