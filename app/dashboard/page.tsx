// app/dashboard/page.tsx
// Server component - fetches data with Decimal conversion

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import jwt from 'jsonwebtoken'
import { prisma } from '@/lib/prisma'
import DashboardClient from './DashboardClient'

async function getLandlordData(userId: string) {
  try {
    const [properties, payments, tenants] = await Promise.all([
      prisma.property.findMany({
        where: { landlordId: userId },
        include: { 
          units: true,
          floors: true
        }
      }),
      prisma.payment.findMany({
        where: { 
          tenant: { 
            unit: { 
              property: { 
                landlordId: userId 
              } 
            } 
          } 
        },
        include: { 
          tenant: {
            include: {
              unit: {
                include: {
                  property: true
                }
              }
            }
          }
        },
        take: 50,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.tenant.findMany({
        where: { 
          unit: { 
            property: { 
              landlordId: userId 
            } 
          }, 
          isActive: true 
        },
        include: { 
          unit: {
            include: {
              property: true
            }
          }
        }
      })
    ])

    // Convert Decimal objects to numbers
    const serializedProperties = properties.map(p => ({
      id: p.id,
      name: p.name,
      location: p.location,
      description: p.description,
      totalFloors: Number(p.totalFloors),
      totalUnits: Number(p.totalUnits),
      status: p.status,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
      units: p.units.map(u => ({
        id: u.id,
        unitNumber: u.unitNumber,
        unitType: u.unitType,
        rentAmount: Number(u.rentAmount),
        depositAmount: u.depositAmount ? Number(u.depositAmount) : null,
        sizeSqm: u.sizeSqm ? Number(u.sizeSqm) : null,
        isOccupied: u.isOccupied,
        status: u.status
      })),
      floors: p.floors.map(f => ({
        id: f.id,
        floorNumber: Number(f.floorNumber),
        floorName: f.floorName,
        unitsPerFloor: Number(f.unitsPerFloor)
      }))
    }))

    const serializedPayments = payments.map(p => ({
      id: p.id,
      amount: Number(p.amount),
      status: p.status,
      paymentMethod: p.paymentMethod,
      month: p.month?.toISOString() || new Date().toISOString(),
      createdAt: p.createdAt.toISOString(),
      paidAt: p.paidAt?.toISOString() || null,
      tenant: p.tenant ? {
        id: p.tenant.id,
        fullName: p.tenant.fullName,
        phone: p.tenant.phone,
        unit: p.tenant.unit ? {
          unitNumber: p.tenant.unit.unitNumber,
          property: p.tenant.unit.property ? {
            name: p.tenant.unit.property.name
          } : null
        } : null
      } : null
    }))

    const serializedTenants = tenants.map(t => ({
      id: t.id,
      fullName: t.fullName,
      phone: t.phone,
      email: t.email,
      rentAmount: Number(t.unit?.rentAmount || 0),
      unitNumber: t.unit?.unitNumber || '',
      propertyName: t.unit?.property?.name || '',
      isActive: t.isActive,
      leaseStartDate: t.leaseStartDate?.toISOString() || null,
      leaseEndDate: t.leaseEndDate?.toISOString() || null,
      rentCreditBalance: Number(t.rentCreditBalance),
      rentPaidUntil: t.rentPaidUntil?.toISOString() || null
    }))

    return { 
      properties: serializedProperties, 
      payments: serializedPayments, 
      tenants: serializedTenants 
    }
  } catch (error) {
    console.error('Error fetching landlord data:', error)
    return { properties: [], payments: [], tenants: [] }
  }
}

export default async function DashboardPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('token')?.value
  
  if (!token) {
    redirect('/login')
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string }
    const data = await getLandlordData(decoded.userId)
    
    return <DashboardClient initialData={data} />
  } catch (error) {
    console.error('JWT verification failed:', error)
    redirect('/login')
  }
}