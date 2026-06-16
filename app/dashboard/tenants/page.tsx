// app/dashboard/tenants/page.tsx
// Server component - fetches tenants data with Decimal conversion

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import jwt from 'jsonwebtoken'
import { prisma } from '@/lib/prisma'
import TenantsClient from './TenantsClient'

async function getTenantsData(userId: string) {
  try {
    const tenants = await prisma.tenant.findMany({
      where: {
        unit: {
          property: {
            landlordId: userId
          }
        }
      },
      include: {
        unit: {
          include: {
            property: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    const properties = await prisma.property.findMany({
      where: { landlordId: userId },
      select: { 
        id: true, 
        name: true, 
        units: { 
          select: { 
            id: true, 
            unitNumber: true,
            rentAmount: true
          } 
        } 
      }
    })

    // Convert Decimal to numbers in properties units
    const serializedProperties = properties.map(property => ({
      ...property,
      units: property.units.map(unit => ({
        ...unit,
        rentAmount: Number(unit.rentAmount)
      }))
    }))

    // Convert ALL Decimal values in tenants
    const serializedTenants = tenants.map(tenant => ({
      id: tenant.id,
      fullName: tenant.fullName,
      phone: tenant.phone,
      email: tenant.email,
      isActive: tenant.isActive,
      leaseStartDate: tenant.leaseStartDate?.toISOString() || null,
      leaseEndDate: tenant.leaseEndDate?.toISOString() || null,
      movedInAt: tenant.movedInAt.toISOString(),
      movedOutAt: tenant.movedOutAt?.toISOString() || null,
      rentDueDay: tenant.rentDueDay,
      rentCreditBalance: Number(tenant.rentCreditBalance),
      rentPaidUntil: tenant.rentPaidUntil?.toISOString() || null,
      createdAt: tenant.createdAt.toISOString(),
      updatedAt: tenant.updatedAt.toISOString(),
      unit: {
        id: tenant.unit.id,
        unitNumber: tenant.unit.unitNumber,
        unitType: tenant.unit.unitType,
        rentAmount: Number(tenant.unit.rentAmount),
        depositAmount: tenant.unit.depositAmount ? Number(tenant.unit.depositAmount) : null,
        sizeSqm: tenant.unit.sizeSqm ? Number(tenant.unit.sizeSqm) : null,
        isOccupied: tenant.unit.isOccupied,
        status: tenant.unit.status,
        property: tenant.unit.property ? {
          id: tenant.unit.property.id,
          name: tenant.unit.property.name,
          location: tenant.unit.property.location,
          paybillNumber: tenant.unit.property.paybillNumber,
          tillNumber: tenant.unit.property.tillNumber
        } : null
      }
    }))

    return { tenants: serializedTenants, properties: serializedProperties }
  } catch (error) {
    console.error('Error fetching tenants:', error)
    return { tenants: [], properties: [] }
  }
}

export default async function TenantsPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('token')?.value
  
  if (!token) {
    redirect('/login')
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string }
    const data = await getTenantsData(decoded.userId)
    
    return <TenantsClient initialTenants={data.tenants} properties={data.properties} />
  } catch (error) {
    console.error('JWT verification failed:', error)
    redirect('/login')
  }
}