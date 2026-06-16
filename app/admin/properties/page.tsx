// app/admin/properties/page.tsx
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import jwt from 'jsonwebtoken'
import { prisma } from '@/lib/prisma'
import PropertiesClient from './PropertiesClient'

async function getPropertiesData() {
  try {
    const properties = await prisma.property.findMany({
      include: { 
        landlord: { 
          select: { companyName: true, email: true, phone: true } 
        }, 
        units: true 
      },
      orderBy: { createdAt: 'desc' }
    })
    
    // Convert Decimal to numbers
    const serializedProperties = properties.map(p => ({
      id: p.id,
      name: p.name,
      location: p.location,
      totalUnits: p.totalUnits,
      status: p.status,
      paybillNumber: p.paybillNumber,
      tillNumber: p.tillNumber,
      createdAt: p.createdAt.toISOString(),
      landlord: p.landlord ? {
        companyName: p.landlord.companyName,
        email: p.landlord.email,
        phone: p.landlord.phone
      } : null,
      units: p.units.map(u => ({
        id: u.id,
        unitNumber: u.unitNumber,
        unitType: u.unitType,
        rentAmount: Number(u.rentAmount),
        depositAmount: u.depositAmount ? Number(u.depositAmount) : null,
        sizeSqm: u.sizeSqm ? Number(u.sizeSqm) : null,
        isOccupied: u.isOccupied,
        status: u.status
      }))
    }))
    
    return { properties: serializedProperties }
  } catch (error) {
    console.error('Error fetching properties:', error)
    return { properties: [] }
  }
}

export default async function AdminPropertiesPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('token')?.value

  if (!token) redirect('/admin-login')
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { role: string }
    if (decoded.role !== 'ADMIN') redirect('/dashboard')
    const data = await getPropertiesData()
    return <PropertiesClient initialData={data} />
  } catch (error) {
    redirect('/admin-login')
  }
}