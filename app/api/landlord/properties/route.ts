// app/api/landlord/properties/route.ts
// API endpoint for GET all properties and POST new property - Named exports

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import { prisma } from '@/lib/prisma'

// GET - Fetch all properties for the landlord
export async function GET() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string }

    const properties = await prisma.property.findMany({
      where: { landlordId: decoded.userId },
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

    return NextResponse.json(properties)
  } catch (error) {
    console.error('GET properties error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create a new property
// app/api/landlord/properties/route.ts - POST method only (replace your existing POST)

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string }
    const body = await request.json()
    const { name, location, description, totalFloors } = body

    if (!name || !location) {
      return NextResponse.json(
        { error: 'Name and location are required' },
        { status: 400 }
      )
    }

    const landlord = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { landlordProfile: true }
    })

    const currentPropertyCount = await prisma.property.count({
      where: { landlordId: decoded.userId }
    })

    if (currentPropertyCount >= (landlord?.registeredProperties || 0)) {
      return NextResponse.json(
        { error: 'You have reached your property limit. Please upgrade your subscription.' },
        { status: 403 }
      )
    }

    // Create property
    const property = await prisma.property.create({
      data: {
        name,
        location,
        description: description || null,
        totalFloors: totalFloors || 0,
        landlordId: decoded.userId,
        status: 'ACTIVE'
      }
    })

    // Auto-create floors
    const floorsToCreate = []
    
    floorsToCreate.push({
      propertyId: property.id,
      floorNumber: 0,
      floorName: 'Ground Floor',
      unitsPerFloor: 0
    })
    
    for (let i = 1; i <= totalFloors; i++) {
      const suffix = i === 1 ? 'st' : i === 2 ? 'nd' : i === 3 ? 'rd' : 'th'
      floorsToCreate.push({
        propertyId: property.id,
        floorNumber: i,
        floorName: `${i}${suffix} Floor`,
        unitsPerFloor: 0
      })
    }
    
    await prisma.floor.createMany({
      data: floorsToCreate
    })

    const propertyWithFloors = await prisma.property.findUnique({
      where: { id: property.id },
      include: {
        floors: { orderBy: { floorNumber: 'asc' } },
        units: true
      }
    })

    await prisma.landlordProfile.update({
      where: { userId: decoded.userId },
      data: { propertyCount: { increment: 1 } }
    })

    return NextResponse.json(propertyWithFloors, { status: 201 })
  } catch (error) {
    console.error('POST property error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}