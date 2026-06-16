// app/dashboard/properties/PropertiesClient.tsx
// Complete property management with bulk unit addition and template download

'use client'

import { useState, useEffect } from 'react'
import { 
  Building2, 
  Plus, 
  Edit2, 
  Trash2, 
  Home, 
  Layers,
  Users,
  MapPin,
  X,
  ChevronRight,
  Save,
  Upload,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle,
  Trash,
  Download
} from 'lucide-react'
import Sidebar from '@/components/ui/Sidebar'
import * as XLSX from 'xlsx'

interface Property {
  id: string
  name: string
  location: string
  description: string | null
  totalFloors: number
  totalUnits: number
  status: string
  floors: any[]
  units: any[]
}

interface UnitFormData {
  floorId: string
  floorName: string
  unitNumber: string
  unitType: string
  rentAmount: string
  depositAmount: string
  sizeSqm: string
  tenantName?: string
  tenantPhone?: string
  tenantEmail?: string
  tempId: string
}

interface PropertiesClientProps {
  initialProperties: Property[]
}

// Helper function to parse floor text to number
const parseFloorNumber = (floorValue: any): number => {
  if (!floorValue) return 0
  
  const str = String(floorValue).toLowerCase().trim()
  
  // Handle text like "Ground Floor", "Ground", "GF"
  if (str.includes('ground') || str === 'gf') return 0
  
  // Handle text like "First Floor", "First", "1st", "1st Floor"
  const firstMatch = str.match(/first|1st/)
  if (firstMatch) return 1
  
  // Handle text like "Second Floor", "Second", "2nd", "2nd Floor"
  const secondMatch = str.match(/second|2nd/)
  if (secondMatch) return 2
  
  // Handle text like "Third Floor", "Third", "3rd", "3rd Floor"
  const thirdMatch = str.match(/third|3rd/)
  if (thirdMatch) return 3
  
  // Handle text like "Fourth Floor", "Fourth", "4th"
  const fourthMatch = str.match(/fourth|4th/)
  if (fourthMatch) return 4
  
  // Handle text like "Fifth Floor", "Fifth", "5th"
  const fifthMatch = str.match(/fifth|5th/)
  if (fifthMatch) return 5
  
  // Try to extract a number
  const numMatch = str.match(/\d+/)
  if (numMatch) return parseInt(numMatch[0])
  
  return 0
}

// Helper function to get floor name from number
const getFloorNameFromNumber = (floorNumber: number): string => {
  if (floorNumber === 0) return 'Ground Floor'
  if (floorNumber === 1) return '1st Floor'
  if (floorNumber === 2) return '2nd Floor'
  if (floorNumber === 3) return '3rd Floor'
  return `${floorNumber}th Floor`
}

// Helper function to parse unit type from text
const parseUnitType = (type: string): string => {
  const str = String(type).toLowerCase().trim()
  if (str.includes('bedsitter') || str === 'bs') return 'BEDSITTER'
  if (str.includes('1 bed') || str.includes('1br') || str === 'one bedroom') return 'ONE_BEDROOM'
  if (str.includes('2 bed') || str.includes('2br') || str === 'two bedroom') return 'TWO_BEDROOM'
  if (str.includes('3 bed') || str.includes('3br') || str === 'three bedroom') return 'THREE_BEDROOM'
  if (str.includes('4 bed') || str.includes('4br') || str === 'four bedroom') return 'FOUR_BEDROOM'
  if (str.includes('5 bed') || str.includes('5br') || str === 'five bedroom') return 'FIVE_BEDROOM'
  if (str.includes('penthouse') || str === 'ph') return 'PENTHOUSE'
  if (str.includes('maisonette')) return 'MAISONETTE'
  if (str.includes('duplex')) return 'DUPLEX'
  if (str.includes('studio')) return 'STUDIO'
  if (str.includes('commercial') || str === 'shop' || str === 'office') return 'COMMERCIAL'
  return 'ONE_BEDROOM'
}

export default function PropertiesClient({ initialProperties }: PropertiesClientProps) {
  const [properties, setProperties] = useState(initialProperties)
  const [expandedUnitProperty, setExpandedUnitProperty] = useState<string | null>(null)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isBulkUploadModalOpen, setIsBulkUploadModalOpen] = useState(false)
  const [selectedPropertyForUnits, setSelectedPropertyForUnits] = useState<Property | null>(null)
  const [editingProperty, setEditingProperty] = useState<Property | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    description: '',
    totalFloors: 0
  })
  const [unitsByFloor, setUnitsByFloor] = useState<Record<string, UnitFormData[]>>({})
  const [newFloors, setNewFloors] = useState<{ floorNumber: number; floorName: string }[]>([])
  const [loading, setLoading] = useState(false)
  const [savingUnits, setSavingUnits] = useState(false)
  const [bulkUploadData, setBulkUploadData] = useState<any[]>([])
  const [bulkUploadPreview, setBulkUploadPreview] = useState<any[]>([])
  const [uploadStep, setUploadStep] = useState<'upload' | 'preview' | 'map'>('upload')
  const [columnMapping, setColumnMapping] = useState({
    unitNumber: '',
    floorNumber: '',
    floorName: '',
    unitType: '',
    rentAmount: '',
    depositAmount: '',
    sizeSqm: '',
    tenantName: '',
    tenantPhone: '',
    tenantEmail: ''
  })

  const getOrdinalSuffix = (n: number): string => {
    if (n === 0) return 'Ground'
    const j = n % 10
    const k = n % 100
    if (j === 1 && k !== 11) return 'st'
    if (j === 2 && k !== 12) return 'nd'
    if (j === 3 && k !== 13) return 'rd'
    return 'th'
  }

  const getFloorDisplayName = (floor: any): string => {
    if (floor.floorName) return floor.floorName
    if (floor.floorNumber === 0) return 'Ground Floor'
    return `${floor.floorNumber}${getOrdinalSuffix(floor.floorNumber)} Floor`
  }

  useEffect(() => {
    if (!isAddModalOpen) {
      setFormData({ name: '', location: '', description: '', totalFloors: 0 })
    }
  }, [isAddModalOpen])

  // Add Property
  const handleAddProperty = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/landlord/properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          totalFloors: Number(formData.totalFloors) || 0
        })
      })
      if (res.ok) {
        const newProperty = await res.json()
        setProperties([newProperty, ...properties])
        setIsAddModalOpen(false)
      } else {
        const error = await res.json()
        alert(error.error || 'Failed to add property')
      }
    } catch (error) {
      alert('Failed to add property')
    } finally {
      setLoading(false)
    }
  }

  // Edit Property
  const handleEditProperty = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingProperty) return
    setLoading(true)
    try {
      const res = await fetch(`/api/landlord/properties/${editingProperty.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          totalFloors: Number(formData.totalFloors) || 0
        })
      })
      if (res.ok) {
        const updatedProperty = await res.json()
        setProperties(properties.map(p => p.id === editingProperty.id ? updatedProperty : p))
        setIsEditModalOpen(false)
        setEditingProperty(null)
      } else {
        const error = await res.json()
        alert(error.error || 'Failed to update property')
      }
    } catch (error) {
      alert('Failed to update property')
    } finally {
      setLoading(false)
    }
  }

  // Delete Property
  const handleDeleteProperty = async (id: string) => {
    if (!confirm('Are you sure? This will delete everything.')) return
    try {
      const res = await fetch(`/api/landlord/properties/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setProperties(properties.filter(p => p.id !== id))
        if (expandedUnitProperty === id) setExpandedUnitProperty(null)
      } else {
        const error = await res.json()
        alert(error.error || 'Failed to delete property')
      }
    } catch (error) {
      alert('Failed to delete property')
    }
  }

  // Add a new floor to the temporary list
  const addNewFloor = () => {
    const nextFloorNumber = newFloors.length + (selectedPropertyForUnits?.floors?.length || 0)
    setNewFloors([...newFloors, { floorNumber: nextFloorNumber, floorName: '' }])
    setUnitsByFloor(prev => ({
      ...prev,
      [`new-floor-${nextFloorNumber}`]: []
    }))
  }

  // Remove a temporary floor
  const removeNewFloor = (index: number) => {
    const floorToRemove = newFloors[index]
    setNewFloors(newFloors.filter((_, i) => i !== index))
    setUnitsByFloor(prev => {
      const newState = { ...prev }
      delete newState[`new-floor-${floorToRemove.floorNumber}`]
      return newState
    })
  }

  // Add a unit to a specific floor
  const addUnitToFloor = (floorId: string, floorName: string) => {
    setUnitsByFloor(prev => ({
      ...prev,
      [floorId]: [
        ...(prev[floorId] || []),
        {
          floorId,
          floorName,
          unitNumber: '',
          unitType: 'ONE_BEDROOM',
          rentAmount: '',
          depositAmount: '',
          sizeSqm: '',
          tenantName: '',
          tenantPhone: '',
          tenantEmail: '',
          tempId: Date.now().toString() + Math.random()
        }
      ]
    }))
  }

  // Update a unit field
  const updateUnitField = (floorId: string, unitIndex: number, field: keyof UnitFormData, value: string) => {
    setUnitsByFloor(prev => {
      const floorUnits = [...(prev[floorId] || [])]
      floorUnits[unitIndex] = { ...floorUnits[unitIndex], [field]: value }
      return { ...prev, [floorId]: floorUnits }
    })
  }

  // Remove a unit from a floor
  const removeUnit = (floorId: string, unitIndex: number) => {
    setUnitsByFloor(prev => ({
      ...prev,
      [floorId]: (prev[floorId] || []).filter((_, i) => i !== unitIndex)
    }))
  }

  // Save all units and floors
  const saveAllUnitsAndFloors = async () => {
    if (!selectedPropertyForUnits) return

    const floorsToCreate = newFloors.map(floor => ({
      propertyId: selectedPropertyForUnits.id,
      floorNumber: floor.floorNumber,
      floorName: floor.floorName || (floor.floorNumber === 0 ? 'Ground Floor' : `${floor.floorNumber}${getOrdinalSuffix(floor.floorNumber)} Floor`),
      unitsPerFloor: (unitsByFloor[`new-floor-${floor.floorNumber}`] || []).length
    }))

    const allUnits: any[] = []
    Object.entries(unitsByFloor).forEach(([floorId, units]) => {
      units.forEach(unit => {
        if (unit.unitNumber && unit.rentAmount) {
          allUnits.push({
            propertyId: selectedPropertyForUnits.id,
            floorId: floorId.startsWith('new-floor-') ? undefined : floorId,
            unitNumber: unit.unitNumber,
            unitType: unit.unitType,
            rentAmount: parseFloat(unit.rentAmount),
            depositAmount: unit.depositAmount ? parseFloat(unit.depositAmount) : null,
            sizeSqm: unit.sizeSqm ? parseFloat(unit.sizeSqm) : null,
            tenant: unit.tenantName ? {
              fullName: unit.tenantName,
              phone: unit.tenantPhone,
              email: unit.tenantEmail
            } : null
          })
        }
      })
    })

    if (allUnits.length === 0) {
      alert('Please add at least one unit')
      return
    }

    setSavingUnits(true)
    try {
      if (floorsToCreate.length > 0) {
        for (const floor of floorsToCreate) {
          await fetch('/api/landlord/floors', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(floor)
          })
        }
      }

      const res = await fetch('/api/landlord/units/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ units: allUnits })
      })

      if (res.ok) {
        const propertyRes = await fetch(`/api/landlord/properties/${selectedPropertyForUnits.id}`)
        const updatedProperty = await propertyRes.json()
        setProperties(properties.map(p => p.id === selectedPropertyForUnits.id ? updatedProperty : p))
        setSelectedPropertyForUnits(updatedProperty)
        setUnitsByFloor({})
        setNewFloors([])
        alert(`Successfully saved ${allUnits.length} units!`)
      } else {
        const error = await res.json()
        alert(error.error || 'Failed to save units')
      }
    } catch (error) {
      alert('Failed to save units')
    } finally {
      setSavingUnits(false)
    }
  }

  // Download template
  const downloadTemplate = () => {
    const templateData = [
      {
        'Unit Number': '101',
        'Floor Number/Name': 'Ground Floor',
        'Unit Type': '1 Bedroom',
        'Rent Amount (KSh)': '25000',
        'Deposit Amount (KSh)': '50000',
        'Size (sqm)': '65.5',
        'Tenant Name': 'John Mwangi',
        'Tenant Phone': '254712345678',
        'Tenant Email': 'john@example.com'
      },
      {
        'Unit Number': '102',
        'Floor Number/Name': 'Ground Floor',
        'Unit Type': '2 Bedroom',
        'Rent Amount (KSh)': '35000',
        'Deposit Amount (KSh)': '70000',
        'Size (sqm)': '85.5',
        'Tenant Name': '',
        'Tenant Phone': '',
        'Tenant Email': ''
      },
      {
        'Unit Number': '201',
        'Floor Number/Name': '1st Floor',
        'Unit Type': 'Studio',
        'Rent Amount (KSh)': '18000',
        'Deposit Amount (KSh)': '36000',
        'Size (sqm)': '45.0',
        'Tenant Name': 'Mary Wanjiku',
        'Tenant Phone': '254798765432',
        'Tenant Email': 'mary@example.com'
      },
      {
        'Unit Number': '202',
        'Floor Number/Name': '1st Floor',
        'Unit Type': 'Bedsitter',
        'Rent Amount (KSh)': '15000',
        'Deposit Amount (KSh)': '30000',
        'Size (sqm)': '35.0',
        'Tenant Name': '',
        'Tenant Phone': '',
        'Tenant Email': ''
      },
      {
        'Unit Number': 'PH1',
        'Floor Number/Name': 'Penthouse',
        'Unit Type': 'Penthouse',
        'Rent Amount (KSh)': '80000',
        'Deposit Amount (KSh)': '160000',
        'Size (sqm)': '150.0',
        'Tenant Name': 'James Otieno',
        'Tenant Phone': '254733445566',
        'Tenant Email': 'james@example.com'
      }
    ]

    const ws = XLSX.utils.json_to_sheet(templateData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Unit Template')
    
    // Add instructions sheet
    const instructions = [
      { 'Column': 'Unit Number', 'Description': 'Required. Unique identifier for the unit (e.g., 101, A-1, B2)' },
      { 'Column': 'Floor Number/Name', 'Description': 'Optional. Can be a number (0=Ground,1=1st,2=2nd) or text (Ground Floor, 1st Floor, Penthouse)' },
      { 'Column': 'Unit Type', 'Description': 'Optional. Options: Bedsitter, 1 Bedroom, 2 Bedroom, 3 Bedroom, Studio, Penthouse, Maisonette, Duplex, Commercial' },
      { 'Column': 'Rent Amount (KSh)', 'Description': 'Required. Monthly rent in Kenyan Shillings' },
      { 'Column': 'Deposit Amount (KSh)', 'Description': 'Optional. Deposit amount in Kenyan Shillings' },
      { 'Column': 'Size (sqm)', 'Description': 'Optional. Unit size in square meters' },
      { 'Column': 'Tenant Name', 'Description': 'Optional. If provided, tenant will be created automatically' },
      { 'Column': 'Tenant Phone', 'Description': 'Required if Tenant Name is provided' },
      { 'Column': 'Tenant Email', 'Description': 'Optional' }
    ]
    const wsInstructions = XLSX.utils.json_to_sheet(instructions)
    XLSX.utils.book_append_sheet(wb, wsInstructions, 'Instructions')
    
    XLSX.writeFile(wb, `unit_template_${selectedPropertyForUnits?.name || 'property'}.xlsx`)
  }

  // Handle file upload for bulk units
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const data = event.target?.result
      const workbook = XLSX.read(data, { type: 'binary' })
      const sheetName = workbook.SheetNames[0]
      const sheet = workbook.Sheets[sheetName]
      const parsedData = XLSX.utils.sheet_to_json(sheet)
      setBulkUploadData(parsedData)
      setUploadStep('preview')
      setBulkUploadPreview(parsedData.slice(0, 5))
    }
    reader.readAsBinaryString(file)
  }

  // Process bulk upload with mapping and intelligent parsing
  const processBulkUpload = async () => {
    const mappedUnits: any[] = []
    
    bulkUploadData.forEach(row => {
      const unit: any = {}
      Object.entries(columnMapping).forEach(([field, columnName]) => {
        if (columnName && row[columnName]) {
          unit[field] = row[columnName]
        }
      })
      
      // Parse floor intelligently
      if (unit.floorNumber) {
        unit.floorNumber = parseFloorNumber(unit.floorNumber)
        unit.floorName = unit.floorName || getFloorNameFromNumber(unit.floorNumber)
      }
      
      // Parse unit type
      if (unit.unitType) {
        unit.unitType = parseUnitType(unit.unitType)
      }
      
      if (unit.unitNumber && unit.rentAmount) {
        mappedUnits.push(unit)
      }
    })

    if (mappedUnits.length === 0) {
      alert('No valid units found. Please check your column mapping.')
      return
    }

    setSavingUnits(true)
    try {
      const res = await fetch('/api/landlord/units/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          units: mappedUnits.map(u => ({
            propertyId: selectedPropertyForUnits?.id,
            unitNumber: u.unitNumber,
            floorId: u.floorNumber !== undefined ? undefined : undefined,
            floorNumber: u.floorNumber,
            floorName: u.floorName,
            unitType: u.unitType || 'ONE_BEDROOM',
            rentAmount: parseFloat(u.rentAmount),
            depositAmount: u.depositAmount ? parseFloat(u.depositAmount) : null,
            sizeSqm: u.sizeSqm ? parseFloat(u.sizeSqm) : null
          })),
          tenants: mappedUnits.filter(u => u.tenantName).map(u => ({
            fullName: u.tenantName,
            phone: u.tenantPhone,
            email: u.tenantEmail,
            unitNumber: u.unitNumber
          }))
        })
      })

      if (res.ok) {
        const propertyRes = await fetch(`/api/landlord/properties/${selectedPropertyForUnits?.id}`)
        const updatedProperty = await propertyRes.json()
        setProperties(properties.map(p => p.id === selectedPropertyForUnits?.id ? updatedProperty : p))
        setSelectedPropertyForUnits(updatedProperty)
        setIsBulkUploadModalOpen(false)
        setBulkUploadData([])
        setUploadStep('upload')
        alert(`Successfully uploaded ${mappedUnits.length} units!`)
      } else {
        const error = await res.json()
        alert(error.error || 'Failed to upload units')
      }
    } catch (error) {
      alert('Failed to upload units')
    } finally {
      setSavingUnits(false)
    }
  }

  const openUnitManager = (property: Property) => {
    setSelectedPropertyForUnits(property)
    setExpandedUnitProperty(property.id)
    setUnitsByFloor({})
    setNewFloors([])
  }

  const getTotalUnitCount = () => {
    let total = 0
    Object.values(unitsByFloor).forEach(units => {
      total += units.filter(u => u.unitNumber && u.rentAmount).length
    })
    return total
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
              <Building2 className="text-gold-500" size={28} />
              <h1 className="heading-premium">Properties</h1>
            </div>
            <p className="text-navy-500 mt-2">Manage your real estate portfolio</p>
            <div className="h-px w-24 bg-gradient-to-r from-gold-400 to-transparent mt-4" />
          </div>
          <button onClick={() => setIsAddModalOpen(true)} className="btn-primary flex items-center gap-2 mt-4 sm:mt-0">
            <Plus size={18} /> Add Property
          </button>
        </div>

        {/* Properties Grid */}
        {properties.length === 0 ? (
          <div className="glass-card p-16 text-center animate-slide-up">
            <Building2 size={64} className="mx-auto text-gold-400 mb-6" />
            <h3 className="font-serif text-2xl text-navy-700 mb-3">No Properties Yet</h3>
            <p className="text-navy-500 mb-8">Add your first property to start managing</p>
            <button onClick={() => setIsAddModalOpen(true)} className="btn-primary">Add Your First Property</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 animate-slide-up">
            {properties.map((property, idx) => (
              <div key={property.id} className="glass-card overflow-hidden transition-all duration-300 hover:scale-[1.02] group" style={{ animationDelay: `${idx * 100}ms` }}>
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-gradient-to-br from-gold-400/20 to-gold-500/10">
                        <Building2 size={20} className="text-gold-500" />
                      </div>
                      <h3 className="font-serif text-xl text-navy-700">{property.name}</h3>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => { setEditingProperty(property); setFormData({ name: property.name, location: property.location, description: property.description || '', totalFloors: property.totalFloors }); setIsEditModalOpen(true); }} className="p-2 rounded-lg hover:bg-gold-400/10 transition-colors">
                        <Edit2 size={16} className="text-gold-500" />
                      </button>
                      <button onClick={() => handleDeleteProperty(property.id)} className="p-2 rounded-lg hover:bg-red-500/10 transition-colors">
                        <Trash2 size={16} className="text-red-500" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-3 mb-4">
                    <div className="flex items-center gap-2 text-navy-600">
                      <MapPin size={14} className="text-gold-500" />
                      <span className="text-sm">{property.location}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <Layers size={14} className="text-gold-500" />
                        <span className="text-sm text-navy-600">
                          {property.floors?.length || property.totalFloors || 0} floor{(property.floors?.length || property.totalFloors || 0) !== 1 ? 's' : ''}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Home size={14} className="text-gold-500" />
                        <span className="text-sm text-navy-600">{property.totalUnits} units</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users size={14} className="text-gold-500" />
                        <span className="text-sm text-navy-600">{property.units?.filter(u => u.isOccupied).length || 0} occupied</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-gold-200/30">
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${property.status === 'ACTIVE' ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'}`}>
                      {property.status}
                    </span>
                    <div className="flex gap-2">
                      <button onClick={() => { setSelectedPropertyForUnits(property); setIsBulkUploadModalOpen(true); }} className="text-sm text-gold-500 hover:text-gold-600 flex items-center gap-1">
                        <Upload size={14} /> Bulk Upload
                      </button>
                      <button onClick={() => openUnitManager(property)} className="flex items-center gap-1 text-gold-500 hover:text-gold-600 transition-all group-hover:translate-x-1">
                        <span className="text-sm">Add Units</span>
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Add Property Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-navy-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="glass-card max-w-md w-full p-6 animate-slide-up">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-serif text-2xl text-navy-700">Add New Property</h2>
              <button onClick={() => setIsAddModalOpen(false)} className="p-1 hover:bg-gold-400/10 rounded-lg"><X size={20} /></button>
            </div>
            <form onSubmit={handleAddProperty} className="space-y-4">
              <div><label className="label">Property Name</label><input type="text" required className="input-field" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g., Kilimani Heights" /></div>
              <div><label className="label">Location</label><input type="text" required className="input-field" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} placeholder="e.g., Kilimani, Nairobi" /></div>
              <div><label className="label">Description (Optional)</label><textarea className="input-field" rows={3} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Additional details about the property" /></div>
              <div><label className="label">Number of Floors (Optional)</label><input type="number" min="0" className="input-field" value={formData.totalFloors} onChange={(e) => setFormData({ ...formData, totalFloors: parseInt(e.target.value) || 0 })} /><p className="text-xs text-navy-500 mt-1">Leave as 0 if you want to add floors later when adding units.</p></div>
              <button type="submit" disabled={loading} className="btn-primary w-full">{loading ? 'Creating...' : 'Create Property'}</button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Property Modal */}
      {isEditModalOpen && editingProperty && (
        <div className="fixed inset-0 bg-navy-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="glass-card max-w-md w-full p-6 animate-slide-up">
            <div className="flex justify-between items-center mb-6"><h2 className="font-serif text-2xl text-navy-700">Edit Property</h2><button onClick={() => setIsEditModalOpen(false)} className="p-1 hover:bg-gold-400/10 rounded-lg"><X size={20} /></button></div>
            <form onSubmit={handleEditProperty} className="space-y-4">
              <div><label className="label">Property Name</label><input type="text" required className="input-field" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} /></div>
              <div><label className="label">Location</label><input type="text" required className="input-field" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} /></div>
              <div><label className="label">Description</label><textarea className="input-field" rows={3} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} /></div>
              <button type="submit" disabled={loading} className="btn-primary w-full">{loading ? 'Saving...' : 'Save Changes'}</button>
            </form>
          </div>
        </div>
      )}

      {/* Unit Manager Modal */}
      {expandedUnitProperty && selectedPropertyForUnits && (
        <div className="fixed inset-0 bg-navy-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="glass-card max-w-6xl w-full max-h-[90vh] overflow-y-auto p-6 animate-slide-up">
            <div className="flex justify-between items-center mb-6 sticky top-0 bg-cream-50/95 backdrop-blur-sm py-2">
              <div><h2 className="font-serif text-2xl text-navy-700">{selectedPropertyForUnits.name}</h2><p className="text-gold-500 text-sm">Add units to each floor - All units save at once</p></div>
              <button onClick={() => { setExpandedUnitProperty(null); setSelectedPropertyForUnits(null); setUnitsByFloor({}); setNewFloors([]); }} className="p-1 hover:bg-gold-400/10 rounded-lg"><X size={24} /></button>
            </div>

            {/* Existing Floors */}
            {selectedPropertyForUnits.floors?.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold text-navy-700 mb-3">Existing Floors</h3>
                {selectedPropertyForUnits.floors.sort((a, b) => a.floorNumber - b.floorNumber).map((floor) => (
                  <div key={floor.id} className="border border-gold-200/30 rounded-lg mb-4 overflow-hidden">
                    <div className="bg-gold-400/10 px-4 py-2 flex justify-between items-center">
                      <span className="font-semibold">{getFloorDisplayName(floor)}</span>
                      <button onClick={() => addUnitToFloor(floor.id, getFloorDisplayName(floor))} className="text-sm text-gold-500 hover:text-gold-600"><Plus size={14} className="inline" /> Add Unit</button>
                    </div>
                    <div className="p-3">
                      {selectedPropertyForUnits.units?.filter(u => u.floorId === floor.id).map(unit => (
                        <div key={unit.id} className="bg-green-500/10 border border-green-500/30 rounded-lg p-2 mb-2 flex justify-between items-center">
                          <div><span className="font-semibold">Unit {unit.unitNumber}</span><span className="text-sm ml-2">KSh {unit.rentAmount?.toLocaleString()}/mo</span><span className="text-xs ml-2 text-navy-500">{unit.unitType?.replace('_', ' ')}</span></div>
                          {unit.isOccupied && <span className="text-xs text-green-600">Occupied</span>}
                        </div>
                      ))}
                      {(unitsByFloor[floor.id] || []).map((unit, idx) => (
                        <div key={unit.tempId} className="bg-gold-400/5 rounded-lg p-3 mb-2 border border-gold-200/30">
                          <div className="flex justify-between mb-2"><span className="font-medium text-sm">New Unit</span><button onClick={() => removeUnit(floor.id, idx)} className="text-red-500"><Trash size={14} /></button></div>
                          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                            <input type="text" placeholder="Unit # *" className="input-field py-1 text-sm" value={unit.unitNumber} onChange={(e) => updateUnitField(floor.id, idx, 'unitNumber', e.target.value)} />
                            <select className="input-field py-1 text-sm" value={unit.unitType} onChange={(e) => updateUnitField(floor.id, idx, 'unitType', e.target.value)}><option value="BEDSITTER">Bedsitter</option><option value="ONE_BEDROOM">1 Bedroom</option><option value="TWO_BEDROOM">2 Bedroom</option><option value="THREE_BEDROOM">3 Bedroom</option><option value="STUDIO">Studio</option><option value="COMMERCIAL">Commercial</option></select>
                            <input type="number" placeholder="Rent *" className="input-field py-1 text-sm" value={unit.rentAmount} onChange={(e) => updateUnitField(floor.id, idx, 'rentAmount', e.target.value)} />
                            <input type="number" placeholder="Deposit" className="input-field py-1 text-sm" value={unit.depositAmount} onChange={(e) => updateUnitField(floor.id, idx, 'depositAmount', e.target.value)} />
                            <input type="number" step="0.1" placeholder="Size sqm" className="input-field py-1 text-sm" value={unit.sizeSqm} onChange={(e) => updateUnitField(floor.id, idx, 'sizeSqm', e.target.value)} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* New Floors */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-3"><h3 className="font-semibold text-navy-700">Add New Floors</h3><button onClick={addNewFloor} className="btn-secondary text-sm py-1 px-3"><Plus size={14} className="inline" /> Add Floor</button></div>
              {newFloors.map((floor, idx) => (
                <div key={idx} className="border border-gold-200/30 rounded-lg mb-4 overflow-hidden">
                  <div className="bg-gold-400/10 px-4 py-2 flex justify-between items-center">
                    <div className="flex gap-2"><input type="number" placeholder="Floor Number" className="input-field py-1 w-24 text-sm" value={floor.floorNumber} onChange={(e) => { const newFloorsCopy = [...newFloors]; newFloorsCopy[idx].floorNumber = parseInt(e.target.value) || 0; setNewFloors(newFloorsCopy); }} /><input type="text" placeholder="Floor Name (e.g., Ground Floor)" className="input-field py-1 text-sm flex-1" value={floor.floorName} onChange={(e) => { const newFloorsCopy = [...newFloors]; newFloorsCopy[idx].floorName = e.target.value; setNewFloors(newFloorsCopy); }} /></div>
                    <button onClick={() => removeNewFloor(idx)} className="text-red-500"><Trash size={16} /></button>
                  </div>
                  <div className="p-3">
                    <button onClick={() => addUnitToFloor(`new-floor-${floor.floorNumber}`, floor.floorName || (floor.floorNumber === 0 ? 'Ground Floor' : `Floor ${floor.floorNumber}`))} className="text-sm text-gold-500 mb-2"><Plus size={14} className="inline" /> Add Unit to this Floor</button>
                    {(unitsByFloor[`new-floor-${floor.floorNumber}`] || []).map((unit, unitIdx) => (
                      <div key={unit.tempId} className="bg-gold-400/5 rounded-lg p-3 mb-2 border border-gold-200/30">
                        <div className="flex justify-between mb-2"><span className="font-medium text-sm">New Unit</span><button onClick={() => removeUnit(`new-floor-${floor.floorNumber}`, unitIdx)} className="text-red-500"><Trash size={14} /></button></div>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                          <input type="text" placeholder="Unit # *" className="input-field py-1 text-sm" value={unit.unitNumber} onChange={(e) => updateUnitField(`new-floor-${floor.floorNumber}`, unitIdx, 'unitNumber', e.target.value)} />
                          <select className="input-field py-1 text-sm" value={unit.unitType} onChange={(e) => updateUnitField(`new-floor-${floor.floorNumber}`, unitIdx, 'unitType', e.target.value)}><option value="BEDSITTER">Bedsitter</option><option value="ONE_BEDROOM">1 Bedroom</option><option value="TWO_BEDROOM">2 Bedroom</option><option value="THREE_BEDROOM">3 Bedroom</option><option value="STUDIO">Studio</option><option value="COMMERCIAL">Commercial</option></select>
                          <input type="number" placeholder="Rent *" className="input-field py-1 text-sm" value={unit.rentAmount} onChange={(e) => updateUnitField(`new-floor-${floor.floorNumber}`, unitIdx, 'rentAmount', e.target.value)} />
                          <input type="number" placeholder="Deposit" className="input-field py-1 text-sm" value={unit.depositAmount} onChange={(e) => updateUnitField(`new-floor-${floor.floorNumber}`, unitIdx, 'depositAmount', e.target.value)} />
                          <input type="number" step="0.1" placeholder="Size sqm" className="input-field py-1 text-sm" value={unit.sizeSqm} onChange={(e) => updateUnitField(`new-floor-${floor.floorNumber}`, unitIdx, 'sizeSqm', e.target.value)} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Save Button */}
            <div className="flex justify-end pt-4 border-t border-gold-200/30 sticky bottom-0 bg-cream-50/95 backdrop-blur-sm py-4">
              <button onClick={saveAllUnitsAndFloors} disabled={savingUnits || getTotalUnitCount() === 0} className="btn-primary flex items-center gap-2 px-8 py-3">
                <Save size={20} /> {savingUnits ? 'Saving...' : `Save ${getTotalUnitCount()} Unit${getTotalUnitCount() !== 1 ? 's' : ''}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Upload Modal with Template Download */}
      {isBulkUploadModalOpen && selectedPropertyForUnits && (
        <div className="fixed inset-0 bg-navy-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="glass-card max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6 animate-slide-up">
            <div className="flex justify-between items-center mb-6"><h2 className="font-serif text-2xl text-navy-700">Bulk Upload Units</h2><button onClick={() => { setIsBulkUploadModalOpen(false); setUploadStep('upload'); setBulkUploadData([]); }} className="p-1 hover:bg-gold-400/10 rounded-lg"><X size={24} /></button></div>
            
            {uploadStep === 'upload' && (
              <div className="text-center py-8">
                <FileSpreadsheet size={48} className="mx-auto text-gold-400 mb-4" />
                <p className="text-navy-600 mb-4">Upload an Excel (CSV/XLSX) file with your units</p>
                <p className="text-sm text-navy-500 mb-6">Supported columns: Unit Number, Floor Number/Name, Unit Type, Rent Amount, Deposit Amount, Size (sqm), Tenant Name, Tenant Phone, Tenant Email</p>
                <input type="file" accept=".csv,.xlsx,.xls" onChange={handleFileUpload} className="hidden" id="bulk-file-input" />
                <label htmlFor="bulk-file-input" className="btn-primary cursor-pointer inline-flex items-center gap-2"><Upload size={18} /> Choose File</label>
                <div className="mt-6 p-4 bg-gold-400/5 rounded-lg">
                  <button onClick={downloadTemplate} className="text-gold-500 text-sm flex items-center gap-2 hover:text-gold-600">
                    <Download size={16} /> Download Sample Template
                  </button>
                  <p className="text-xs text-navy-400 mt-2">Includes instructions and example data for units, floors, and optional tenants</p>
                </div>
              </div>
            )}

            {uploadStep === 'preview' && (
              <div>
                <h3 className="font-semibold mb-3">Column Mapping</h3>
                <p className="text-sm text-navy-500 mb-4">Map your file columns to the system fields</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
                  {Object.entries(columnMapping).map(([field, value]) => (
                    <div key={field}>
                      <label className="text-xs text-navy-500 capitalize">{field.replace(/([A-Z])/g, ' $1')}</label>
                      <select className="input-field py-1 text-sm w-full" value={value} onChange={(e) => setColumnMapping({ ...columnMapping, [field]: e.target.value })}>
                        <option value="">-- Select --</option>
                        {Object.keys(bulkUploadData[0] || {}).map(col => <option key={col} value={col}>{col}</option>)}
                      </select>
                    </div>
                  ))}
                </div>
                <h3 className="font-semibold mb-2">Preview (first 5 rows)</h3>
                <div className="overflow-x-auto mb-6">
                  <table className="w-full text-sm">
                    <thead>
                      <tr>{Object.keys(bulkUploadPreview[0] || {}).map(col => <th key={col} className="p-2 text-left border-b">{col}</th>)}</tr>
                    </thead>
                    <tbody>
                      {bulkUploadPreview.map((row, i) => (
                        <tr key={i}>{Object.values(row).map((val: any, j) => <td key={j} className="p-2 border-b">{String(val).slice(0, 30)}</td>)}</tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex gap-3 justify-end">
                  <button onClick={() => setUploadStep('upload')} className="btn-secondary">Back</button>
                  <button onClick={processBulkUpload} disabled={savingUnits} className="btn-primary">{savingUnits ? 'Uploading...' : 'Upload Units'}</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}