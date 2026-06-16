// app/dashboard/properties/page.tsx
// Server component - fetches properties data and converts Decimal to numbers

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import jwt from 'jsonwebtoken'
import { prisma } from '@/lib/prisma'
import PropertiesClient from './PropertiesClient'

async function getPropertiesData(userId: string) {
  try {
    const properties = await prisma.property.findMany({
      where: { landlordId: userId },
      include: {
        floors: {
          orderBy: { floorNumber: 'asc' }
        },
        units: {
          include: {
            tenants: {
              where: { isActive: true },
              take: 1
            }
          },
          orderBy: { unitNumber: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Convert Decimal objects to numbers for client-side compatibility
    const serializedProperties = properties.map(property => ({
      ...property,
      totalFloors: Number(property.totalFloors),
      totalUnits: Number(property.totalUnits),
      floors: property.floors.map(floor => ({
        ...floor,
        floorNumber: Number(floor.floorNumber),
        unitsPerFloor: Number(floor.unitsPerFloor)
      })),
      units: property.units.map(unit => ({
        ...unit,
        rentAmount: Number(unit.rentAmount),
        depositAmount: unit.depositAmount ? Number(unit.depositAmount) : null,
        sizeSqm: unit.sizeSqm ? Number(unit.sizeSqm) : null,
        isOccupied: Boolean(unit.isOccupied)
      }))
    }))

    return serializedProperties
  } catch (error) {
    console.error('Error fetching properties:', error)
    return []
  }
}

export default async function PropertiesPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('token')?.value
  
  if (!token) {
    redirect('/login')
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string }
    const properties = await getPropertiesData(decoded.userId)
    
    return <PropertiesClient initialProperties={properties} />
  } catch (error) {
    console.error('JWT verification failed:', error)
    redirect('/login')
  }
}