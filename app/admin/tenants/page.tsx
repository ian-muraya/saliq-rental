// app/admin/tenants/page.tsx
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import jwt from 'jsonwebtoken'
import { prisma } from '@/lib/prisma'
import TenantsClient from './TenantsClient'

async function getTenantsData() {
  try {
    const tenants = await prisma.tenant.findMany({
      include: { 
        unit: { 
          include: { 
            property: { 
              include: { landlord: true } 
            } 
          } 
        } 
      },
      orderBy: { createdAt: 'desc' }
    })
    
    // Convert Decimal to numbers
    const serializedTenants = tenants.map(t => ({
      id: t.id,
      fullName: t.fullName,
      phone: t.phone,
      email: t.email,
      isActive: t.isActive,
      createdAt: t.createdAt.toISOString(),
      rentAmount: Number(t.unit?.rentAmount || 0),
      unitNumber: t.unit?.unitNumber || '',
      propertyName: t.unit?.property?.name || '',
      landlordName: t.unit?.property?.landlord?.companyName || t.unit?.property?.landlord?.email || 'N/A',
      landlordEmail: t.unit?.property?.landlord?.email || '',
      landlordPhone: t.unit?.property?.landlord?.phone || ''
    }))
    
    return { tenants: serializedTenants }
  } catch (error) {
    console.error('Error fetching tenants:', error)
    return { tenants: [] }
  }
}

export default async function AdminTenantsPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('token')?.value

  if (!token) redirect('/admin-login')
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { role: string }
    if (decoded.role !== 'ADMIN') redirect('/dashboard')
    const data = await getTenantsData()
    return <TenantsClient initialData={data} />
  } catch (error) {
    redirect('/admin-login')
  }
}