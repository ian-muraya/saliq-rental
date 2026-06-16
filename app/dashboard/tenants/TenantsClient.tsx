// app/dashboard/tenants/TenantsClient.tsx
// Complete tenant management with flexible phone number, optional lease end date, and enhanced search

'use client'

import { useState, useEffect } from 'react'
import { 
  Users, 
  Plus, 
  Upload, 
  Search,
  Mail,
  Phone,
  Calendar,
  Home,
  Download,
  X,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle,
  Eye,
  Trash,
  RefreshCw,
  FileText,
  File
} from 'lucide-react'
import Sidebar from '@/components/ui/Sidebar'
import * as XLSX from 'xlsx'

interface Tenant {
  id: string
  fullName: string
  phone: string
  email: string | null
  leaseStartDate: string | null
  leaseEndDate: string | null
  rentCreditBalance: number
  rentPaidUntil: string | null

  unit: {
    unitNumber: string
    rentAmount: number
    property: {
      name: string
    }
  }
}

interface TenantsClientProps {
  initialTenants: Tenant[]
  properties: any[]
}

// Helper function to normalize phone number to international format
const normalizePhoneNumber = (phone: string): string => {
  if (!phone) return ''
  // Remove all non-numeric characters
  let cleaned = phone.replace(/\D/g, '')
  
  // Remove leading 0
  if (cleaned.startsWith('0')) {
    cleaned = '254' + cleaned.substring(1)
  } 
  // Remove +254 prefix
  else if (cleaned.startsWith('254') && cleaned.length === 12) {
    cleaned = cleaned
  }
  else if (cleaned.startsWith('254') && cleaned.length > 12) {
    cleaned = cleaned.substring(0, 12)
  }
  else if (!cleaned.startsWith('254') && cleaned.length === 9) {
    cleaned = '254' + cleaned
  }
  else if (cleaned.length === 10 && cleaned.startsWith('7')) {
    cleaned = '254' + cleaned
  }
  else if (cleaned.length === 10 && cleaned.startsWith('1')) {
    cleaned = '254' + cleaned
  }
  
  return cleaned
}

// Helper function to format phone number for display
const formatPhoneForDisplay = (phone: string): string => {
  if (!phone) return ''
  if (phone.startsWith('254')) {
    const withoutCode = phone.substring(3)
    if (withoutCode.length === 9) {
      return `0${withoutCode.substring(0,3)} ${withoutCode.substring(3,6)} ${withoutCode.substring(6)}`
    }
  }
  return phone
}

// Helper function to normalize phone for search
const normalizeForSearch = (phone: string): string => {
  if (!phone) return ''
  let cleaned = phone.replace(/\D/g, '')
  if (cleaned.startsWith('0')) {
    cleaned = cleaned.substring(1)
  }
  if (cleaned.startsWith('254')) {
    cleaned = cleaned.substring(3)
  }
  return cleaned
}

export default function TenantsClient({ initialTenants, properties }: TenantsClientProps) {
  const [tenants, setTenants] = useState(initialTenants)
  const [searchTerm, setSearchTerm] = useState('')
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false)
  const [selectedPropertyId, setSelectedPropertyId] = useState('')
  const [availableUnits, setAvailableUnits] = useState<any[]>([])
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    unitId: '',
    leaseStartDate: '',
    leaseEndDate: ''
  })
  const [loading, setLoading] = useState(false)
  const [bulkUploadData, setBulkUploadData] = useState<any[]>([])
  const [bulkUploadPreview, setBulkUploadPreview] = useState<any[]>([])
  const [uploadStep, setUploadStep] = useState<'upload' | 'preview' | 'map'>('upload')
  const [uploading, setUploading] = useState(false)
  const [columnMapping, setColumnMapping] = useState({
    fullName: '',
    phone: '',
    email: '',
    unitNumber: '',
    leaseStartDate: '',
    leaseEndDate: ''
  })

  // Reset form when modal closes
  useEffect(() => {
    if (!isAddModalOpen) {
      setFormData({
        fullName: '',
        phone: '',
        email: '',
        unitId: '',
        leaseStartDate: '',
        leaseEndDate: ''
      })
      setSelectedPropertyId('')
      setAvailableUnits([])
    }
  }, [isAddModalOpen])

  // Fetch available units when property is selected
  useEffect(() => {
    if (selectedPropertyId) {
      const property = properties.find(p => p.id === selectedPropertyId)
      if (property) {
        setAvailableUnits(property.units || [])
      }
    } else {
      setAvailableUnits([])
    }
  }, [selectedPropertyId, properties])

  // Enhanced search - filters by name, phone (any format), unit number, and email
  const filteredTenants = tenants.filter(tenant => {
    const searchLower = searchTerm.toLowerCase()
    const searchNumeric = searchTerm.replace(/\D/g, '')
    
    // Search by full name
    if (tenant.fullName.toLowerCase().includes(searchLower)) return true
    
    // Search by unit number
    if (tenant.unit.unitNumber.toLowerCase().includes(searchLower)) return true
    
    // Search by property name
    if (tenant.unit.property.name.toLowerCase().includes(searchLower)) return true
    
    // Search by phone number (supports both 0712345678 and 254712345678)
    if (tenant.phone.includes(searchTerm)) return true
    
    const tenantPhoneNormalized = normalizeForSearch(tenant.phone)
    if (searchNumeric && tenantPhoneNormalized.includes(searchNumeric)) return true
    
    // Search by email
    if (tenant.email && tenant.email.toLowerCase().includes(searchLower)) return true
    
    return false
  })

  const handleAddTenant = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const normalizedPhone = normalizePhoneNumber(formData.phone)
      
      const res = await fetch('/api/landlord/tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          phone: normalizedPhone,
          leaseEndDate: formData.leaseEndDate || null
        })
      })
      if (res.ok) {
        const newTenant = await res.json()
        setTenants([newTenant, ...tenants])
        setIsAddModalOpen(false)
        alert('Tenant added successfully!')
      } else {
        const error = await res.json()
        alert(error.error || 'Failed to add tenant')
      }
    } catch (error) {
      console.error('Failed to add tenant:', error)
      alert('Failed to add tenant')
    } finally {
      setLoading(false)
    }
  }

  // Download template
  const downloadTemplate = () => {
    const templateData = [
      {
        'Full Name': 'John Mwangi',
        'Phone Number': '0712345678',
        'Email': 'john@example.com',
        'Unit Number': '101',
        'Lease Start Date': '2024-01-01',
        'Lease End Date': '2025-01-01'
      },
      {
        'Full Name': 'Mary Wanjiku',
        'Phone Number': '+254798765432',
        'Email': 'mary@example.com',
        'Unit Number': '102',
        'Lease Start Date': '2024-02-01',
        'Lease End Date': ''
      },
      {
        'Full Name': 'James Otieno',
        'Phone Number': '254733445566',
        'Email': 'james@example.com',
        'Unit Number': '201',
        'Lease Start Date': '2024-03-01',
        'Lease End Date': ''
      }
    ]

    const ws = XLSX.utils.json_to_sheet(templateData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Tenant Template')
    
    const instructions = [
      { 'Column': 'Full Name', 'Description': 'Required. Tenant\'s full name' },
      { 'Column': 'Phone Number', 'Description': 'Required. Accepts formats: 0712345678, +254712345678, 254712345678, 712345678' },
      { 'Column': 'Email', 'Description': 'Optional. Tenant\'s email address' },
      { 'Column': 'Unit Number', 'Description': 'Required. Must match an existing unit number in your property' },
      { 'Column': 'Lease Start Date', 'Description': 'Optional. Format: YYYY-MM-DD' },
      { 'Column': 'Lease End Date', 'Description': 'Optional. Leave empty for open-ended leases' }
    ]
    const wsInstructions = XLSX.utils.json_to_sheet(instructions)
    XLSX.utils.book_append_sheet(wb, wsInstructions, 'Instructions')
    
    XLSX.writeFile(wb, `tenant_template_${new Date().toISOString().slice(0, 10)}.xlsx`)
  }

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const fileType = file.name.split('.').pop()?.toLowerCase()
    
    const reader = new FileReader()
    reader.onload = (event) => {
      const data = event.target?.result
      
      if (fileType === 'csv' || fileType === 'xlsx' || fileType === 'xls') {
        const workbook = XLSX.read(data, { type: 'binary' })
        const sheetName = workbook.SheetNames[0]
        const sheet = workbook.Sheets[sheetName]
        const parsedData = XLSX.utils.sheet_to_json(sheet)
        setBulkUploadData(parsedData)
        setUploadStep('preview')
        setBulkUploadPreview(parsedData.slice(0, 5))
      } else {
        alert('Unsupported file format. Please upload CSV, XLSX, or XLS files.')
        e.target.value = ''
      }
    }
    
    if (fileType === 'csv' || fileType === 'xlsx' || fileType === 'xls') {
      reader.readAsBinaryString(file)
    }
  }

  // Process bulk upload
  const processBulkUpload = async () => {
    if (!selectedPropertyId) {
      alert('Please select a property first')
      return
    }

    const property = properties.find(p => p.id === selectedPropertyId)
    if (!property) {
      alert('Property not found')
      return
    }

    const tenantsToCreate: any[] = []
    const errors: string[] = []

    bulkUploadData.forEach((row, index) => {
      const fullName = row[columnMapping.fullName] || ''
      let phone = row[columnMapping.phone] || ''
      const unitNumber = row[columnMapping.unitNumber] || ''
      
      if (!fullName) {
        errors.push(`Row ${index + 1}: Missing full name`)
        return
      }
      if (!phone) {
        errors.push(`Row ${index + 1}: Missing phone number`)
        return
      }
      if (!unitNumber) {
        errors.push(`Row ${index + 1}: Missing unit number`)
        return
      }

      phone = normalizePhoneNumber(phone)

      const unit = property.units?.find((u: any) => u.unitNumber === unitNumber.toString())
      if (!unit) {
        errors.push(`Row ${index + 1}: Unit "${unitNumber}" not found in property "${property.name}"`)
        return
      }
      if (unit.isOccupied) {
        errors.push(`Row ${index + 1}: Unit "${unitNumber}" is already occupied`)
        return
      }

      tenantsToCreate.push({
        fullName,
        phone,
        email: row[columnMapping.email] || '',
        unitId: unit.id,
        leaseStartDate: row[columnMapping.leaseStartDate] || null,
        leaseEndDate: row[columnMapping.leaseEndDate] || null
      })
    })

    if (errors.length > 0) {
      alert(`Validation errors:\n${errors.join('\n')}`)
      return
    }

    if (tenantsToCreate.length === 0) {
      alert('No valid tenants to upload')
      return
    }

    setUploading(true)
    let successCount = 0
    let failCount = 0

    for (const tenant of tenantsToCreate) {
      try {
        const res = await fetch('/api/landlord/tenants', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(tenant)
        })
        if (res.ok) {
          const newTenant = await res.json()
          setTenants(prev => [newTenant, ...prev])
          successCount++
        } else {
          failCount++
        }
      } catch (error) {
        failCount++
      }
    }

    alert(`Upload complete!\nSuccessfully added: ${successCount}\nFailed: ${failCount}`)
    
    if (successCount > 0) {
      setIsBulkModalOpen(false)
      setBulkUploadData([])
      setUploadStep('upload')
      setColumnMapping({
        fullName: '',
        phone: '',
        email: '',
        unitNumber: '',
        leaseStartDate: '',
        leaseEndDate: ''
      })
    }
    setUploading(false)
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
              <Users className="text-gold-500" size={28} />
              <h1 className="heading-premium">Tenants</h1>
            </div>
            <p className="text-navy-500 mt-2">Manage your tenants and leases</p>
            <div className="h-px w-24 bg-gradient-to-r from-gold-400 to-transparent mt-4" />
          </div>
          <div className="flex gap-3 mt-4 sm:mt-0">
            <button
              onClick={() => setIsBulkModalOpen(true)}
              className="btn-secondary flex items-center gap-2"
            >
              <FileSpreadsheet size={18} />
              Bulk Upload
            </button>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="btn-primary flex items-center gap-2"
            >
              <Plus size={18} />
              Add Tenant
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-8 animate-slide-up">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gold-500" size={20} />
            <input
              type="text"
              placeholder="Search by name, phone, unit, or property..."
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
              Found {filteredTenants.length} tenant{filteredTenants.length !== 1 ? 's' : ''} matching "{searchTerm}"
            </p>
          )}
        </div>

        {/* Tenants Table */}
        {tenants.length === 0 ? (
          <div className="glass-card p-16 text-center animate-slide-up">
            <Users size={64} className="mx-auto text-gold-400 mb-6" />
            <h3 className="font-serif text-2xl text-navy-700 mb-3">No Tenants Yet</h3>
            <p className="text-navy-500 mb-8">Add tenants to your properties to start tracking rent</p>
            <button onClick={() => setIsAddModalOpen(true)} className="btn-primary">
              Add Your First Tenant
            </button>
          </div>
        ) : filteredTenants.length === 0 ? (
          <div className="glass-card p-16 text-center animate-slide-up">
            <Users size={64} className="mx-auto text-gold-400 mb-6" />
            <h3 className="font-serif text-2xl text-navy-700 mb-3">No Results Found</h3>
            <p className="text-navy-500">No tenants match "{searchTerm}"</p>
            <button onClick={() => setSearchTerm('')} className="btn-secondary mt-4">
              Clear Search
            </button>
          </div>
        ) : (
          <div className="glass-card overflow-hidden animate-slide-up">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gold-200/30 bg-gold-400/5">
                    <th className="text-left py-4 px-6 text-navy-600 font-semibold">Tenant</th>
                    <th className="text-left py-4 px-6 text-navy-600 font-semibold">Contact</th>
                    <th className="text-left py-4 px-6 text-navy-600 font-semibold">Property/Unit</th>
                    <th className="text-left py-4 px-6 text-navy-600 font-semibold">Lease Period</th>
                    <th className="text-left py-4 px-6 text-navy-600 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTenants.map((tenant, idx) => (
                    <tr key={tenant.id} className="border-b border-gold-200/20 hover:bg-gold-400/5 transition-colors group">
                      <td className="py-4 px-6">
                        <p className="font-semibold text-navy-700">{tenant.fullName}</p>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2 text-sm text-navy-600">
                            <Phone size={12} className="text-gold-500" />
                            {formatPhoneForDisplay(tenant.phone)}
                          </div>
                          {tenant.email && (
                            <div className="flex items-center gap-2 text-sm text-navy-600">
                              <Mail size={12} className="text-gold-500" />
                              {tenant.email}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <Home size={14} className="text-gold-500" />
                          <span className="text-navy-700">{tenant.unit.property.name}</span>
                          <span className="text-navy-500">- Unit {tenant.unit.unitNumber}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2 text-sm text-navy-600">
                          <Calendar size={12} className="text-gold-500" />
                          {tenant.leaseStartDate ? new Date(tenant.leaseStartDate).toLocaleDateString() : 'N/A'} - 
                          {tenant.leaseEndDate ? new Date(tenant.leaseEndDate).toLocaleDateString() : 'Open-ended'}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <button 
                          onClick={() => { setSelectedTenant(tenant); setIsViewModalOpen(true); }}
                          className="text-gold-500 hover:text-gold-600 text-sm transition-colors"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Add Tenant Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-navy-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in overflow-y-auto">
          <div className="glass-card max-w-md w-full p-6 animate-slide-up">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-serif text-2xl text-navy-700">Add New Tenant</h2>
              <button onClick={() => setIsAddModalOpen(false)} className="p-1 hover:bg-gold-400/10 rounded-lg">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAddTenant} className="space-y-4">
              <div>
                <label className="label">Full Name *</label>
                <input
                  type="text"
                  required
                  className="input-field"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="e.g., John Mwangi"
                />
              </div>
              <div>
                <label className="label">Phone Number *</label>
                <input
                  type="tel"
                  required
                  className="input-field"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="0712345678 or +254712345678"
                />
                <p className="text-xs text-navy-500 mt-1">Accepts: 0712345678, +254712345678, 254712345678, 712345678</p>
              </div>
              <div>
                <label className="label">Email (Optional)</label>
                <input
                  type="email"
                  className="input-field"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="tenant@example.com"
                />
              </div>
              <div>
                <label className="label">Select Property *</label>
                <select
                  required
                  className="input-field"
                  value={selectedPropertyId}
                  onChange={(e) => setSelectedPropertyId(e.target.value)}
                >
                  <option value="">Select a property</option>
                  {properties.map((prop) => (
                    <option key={prop.id} value={prop.id}>{prop.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Select Unit *</label>
                <select
                  required
                  className="input-field"
                  value={formData.unitId}
                  onChange={(e) => setFormData({ ...formData, unitId: e.target.value })}
                  disabled={!selectedPropertyId}
                >
                  <option value="">Select a unit</option>
                  {availableUnits
                    .filter((unit: any) => !unit.isOccupied)
                    .map((unit: any) => (
                      <option key={unit.id} value={unit.id}>
                        Unit {unit.unitNumber} - KSh {unit.rentAmount?.toLocaleString()}/month
                      </option>
                    ))}
                </select>
                {selectedPropertyId && availableUnits.filter((u: any) => !u.isOccupied).length === 0 && (
                  <p className="text-xs text-red-500 mt-1">No available units in this property</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Lease Start Date</label>
                  <input
                    type="date"
                    className="input-field"
                    value={formData.leaseStartDate}
                    onChange={(e) => setFormData({ ...formData, leaseStartDate: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label">Lease End Date (Optional)</label>
                  <input
                    type="date"
                    className="input-field"
                    value={formData.leaseEndDate}
                    onChange={(e) => setFormData({ ...formData, leaseEndDate: e.target.value })}
                  />
                  <p className="text-xs text-navy-500 mt-1">Leave empty for open-ended lease</p>
                </div>
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? 'Adding...' : 'Add Tenant'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* View Tenant Modal */}
      {isViewModalOpen && selectedTenant && (
        <div className="fixed inset-0 bg-navy-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in overflow-y-auto">
          <div className="glass-card max-w-md w-full p-6 animate-slide-up">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-serif text-2xl text-navy-700">Tenant Details</h2>
              <button onClick={() => setIsViewModalOpen(false)} className="p-1 hover:bg-gold-400/10 rounded-lg">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div className="border-b border-gold-200/30 pb-2">
                <p className="text-xs text-navy-500">Full Name</p>
                <p className="font-semibold text-navy-700">{selectedTenant.fullName}</p>
              </div>
              <div className="border-b border-gold-200/30 pb-2">
                <p className="text-xs text-navy-500">Phone Number</p>
                <p className="text-navy-700">{formatPhoneForDisplay(selectedTenant.phone)}</p>
              </div>
              {selectedTenant.email && (
                <div className="border-b border-gold-200/30 pb-2">
                  <p className="text-xs text-navy-500">Email</p>
                  <p className="text-navy-700">{selectedTenant.email}</p>
                </div>
              )}
              <div className="border-b border-gold-200/30 pb-2">
                <p className="text-xs text-navy-500">Property</p>
                <p className="text-navy-700">{selectedTenant.unit.property.name}</p>
              </div>
              <div className="border-b border-gold-200/30 pb-2">
                <p className="text-xs text-navy-500">Unit Number</p>
                <p className="text-navy-700">Unit {selectedTenant.unit.unitNumber}</p>
              </div>
              <div className="border-b border-gold-200/30 pb-2">
                <p className="text-xs text-navy-500">Lease Period</p>
                <p className="text-navy-700">
                  {selectedTenant.leaseStartDate ? new Date(selectedTenant.leaseStartDate).toLocaleDateString() : 'N/A'} - 
                  {selectedTenant.leaseEndDate ? new Date(selectedTenant.leaseEndDate).toLocaleDateString() : 'Open-ended'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Upload Modal */}
      {isBulkModalOpen && (
        <div className="fixed inset-0 bg-navy-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in overflow-y-auto">
          <div className="glass-card max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6 animate-slide-up">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-serif text-2xl text-navy-700">Bulk Upload Tenants</h2>
              <button onClick={() => { setIsBulkModalOpen(false); setUploadStep('upload'); setBulkUploadData([]); }} className="p-1 hover:bg-gold-400/10 rounded-lg">
                <X size={24} />
              </button>
            </div>

            {uploadStep === 'upload' && (
              <div>
                <div className="p-4 bg-gold-400/10 rounded-xl mb-6">
                  <h3 className="font-semibold text-navy-700 mb-2 flex items-center gap-2">
                    <AlertCircle size={18} className="text-gold-500" />
                    Instructions:
                  </h3>
                  <ul className="text-sm text-navy-600 space-y-1 list-disc list-inside">
                    <li>Accepted file formats: <strong>Excel (.xlsx, .xls)</strong> or <strong>CSV (.csv)</strong></li>
                    <li>Make sure your file has a header row with column names</li>
                    <li>Required columns: <strong>Full Name, Phone Number, Unit Number</strong></li>
                    <li>Phone number accepts: 0712345678, +254712345678, 254712345678, 712345678</li>
                    <li>Unit Number must match an existing unit in your property</li>
                    <li>Leave "Lease End Date" empty for open-ended leases</li>
                    <li>Maximum 500 tenants per upload</li>
                  </ul>
                </div>
                
                <div className="mb-6">
                  <label className="label">Select Property *</label>
                  <select
                    className="input-field"
                    value={selectedPropertyId}
                    onChange={(e) => setSelectedPropertyId(e.target.value)}
                    required
                  >
                    <option value="">Select a property</option>
                    {properties.map((prop) => (
                      <option key={prop.id} value={prop.id}>{prop.name}</option>
                    ))}
                  </select>
                </div>

                <div className="mb-6">
                  <label className="label">Upload File</label>
                  <input
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleFileUpload}
                    className="input-field"
                    disabled={!selectedPropertyId}
                  />
                  <p className="text-xs text-navy-500 mt-1">Supported formats: CSV, XLSX, XLS</p>
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-gold-200/30">
                  <button onClick={downloadTemplate} className="text-gold-500 text-sm flex items-center gap-2 hover:text-gold-600">
                    <Download size={16} /> Download Sample Template
                  </button>
                  {bulkUploadData.length > 0 && (
                    <button onClick={() => setUploadStep('preview')} className="btn-primary">
                      Continue to Preview
                    </button>
                  )}
                </div>
              </div>
            )}

            {uploadStep === 'preview' && (
              <div>
                <h3 className="font-semibold mb-3">Column Mapping</h3>
                <p className="text-sm text-navy-500 mb-4">Map your file columns to the system fields</p>
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                  <div>
                    <label className="text-xs text-navy-500 font-semibold">Full Name *</label>
                    <select className="input-field py-1 text-sm w-full" value={columnMapping.fullName} onChange={(e) => setColumnMapping({ ...columnMapping, fullName: e.target.value })}>
                      <option value="">-- Select --</option>
                      {Object.keys(bulkUploadData[0] || {}).map(col => <option key={col} value={col}>{col}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-navy-500 font-semibold">Phone Number *</label>
                    <select className="input-field py-1 text-sm w-full" value={columnMapping.phone} onChange={(e) => setColumnMapping({ ...columnMapping, phone: e.target.value })}>
                      <option value="">-- Select --</option>
                      {Object.keys(bulkUploadData[0] || {}).map(col => <option key={col} value={col}>{col}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-navy-500 font-semibold">Unit Number *</label>
                    <select className="input-field py-1 text-sm w-full" value={columnMapping.unitNumber} onChange={(e) => setColumnMapping({ ...columnMapping, unitNumber: e.target.value })}>
                      <option value="">-- Select --</option>
                      {Object.keys(bulkUploadData[0] || {}).map(col => <option key={col} value={col}>{col}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-navy-500 font-semibold">Email</label>
                    <select className="input-field py-1 text-sm w-full" value={columnMapping.email} onChange={(e) => setColumnMapping({ ...columnMapping, email: e.target.value })}>
                      <option value="">-- Select --</option>
                      {Object.keys(bulkUploadData[0] || {}).map(col => <option key={col} value={col}>{col}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-navy-500 font-semibold">Lease Start Date</label>
                    <select className="input-field py-1 text-sm w-full" value={columnMapping.leaseStartDate} onChange={(e) => setColumnMapping({ ...columnMapping, leaseStartDate: e.target.value })}>
                      <option value="">-- Select --</option>
                      {Object.keys(bulkUploadData[0] || {}).map(col => <option key={col} value={col}>{col}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-navy-500 font-semibold">Lease End Date</label>
                    <select className="input-field py-1 text-sm w-full" value={columnMapping.leaseEndDate} onChange={(e) => setColumnMapping({ ...columnMapping, leaseEndDate: e.target.value })}>
                      <option value="">-- Select --</option>
                      {Object.keys(bulkUploadData[0] || {}).map(col => <option key={col} value={col}>{col}</option>)}
                    </select>
                  </div>
                </div>

                <h3 className="font-semibold mb-2">Preview (first 5 rows)</h3>
                <div className="overflow-x-auto mb-6 max-h-64 overflow-y-auto border border-gold-200/30 rounded-lg">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-cream-100">
                      <tr>{Object.keys(bulkUploadPreview[0] || {}).map(col => <th key={col} className="p-2 text-left border-b font-semibold text-navy-600">{col}</th>)}</tr>
                    </thead>
                    <tbody>
                      {bulkUploadPreview.map((row, i) => (
                        <tr key={i}>{Object.values(row).map((val: any, j) => <td key={j} className="p-2 border-b text-navy-600">{String(val).slice(0, 40)}</td>)}</tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex gap-3 justify-end">
                  <button onClick={() => setUploadStep('upload')} className="btn-secondary">Back</button>
                  <button 
                    onClick={processBulkUpload} 
                    disabled={uploading || !columnMapping.fullName || !columnMapping.phone || !columnMapping.unitNumber}
                    className="btn-primary"
                  >
                    {uploading ? 'Uploading...' : 'Upload Tenants'}
                  </button>
                </div>
                {(!columnMapping.fullName || !columnMapping.phone || !columnMapping.unitNumber) && (
                  <p className="text-xs text-red-500 mt-3">Please map the required fields (Full Name, Phone Number, Unit Number)</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}