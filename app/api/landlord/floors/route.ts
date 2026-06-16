// app/api/landlord/floors/route.ts
// API endpoint for floor management - Named exports

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import { prisma } from '@/lib/prisma'

// POST - Create a new floor (with ground floor support)
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string }
    const body = await request.json()
    const { propertyId, floorNumber, floorName, unitsPerFloor } = body

    // Verify property belongs to landlord
    const property = await prisma.property.findFirst({
      where: {
        id: propertyId,
        landlordId: decoded.userId
      }
    })

    if (!property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 })
    }

    // Check if floor already exists
    const existingFloor = await prisma.floor.findFirst({
      where: {
        propertyId,
        floorNumber
      }
    })

    if (existingFloor) {
      return NextResponse.json(
        { error: `Floor ${floorNumber === 0 ? 'Ground' : floorNumber} already exists` },
        { status: 400 }
      )
    }

    // Create floor
    const floor = await prisma.floor.create({
      data: {
        propertyId,
        floorNumber,
        floorName: floorName || (floorNumber === 0 ? 'Ground Floor' : `Floor ${floorNumber}`),
        unitsPerFloor: unitsPerFloor || 0
      }
    })

    return NextResponse.json(floor, { status: 201 })
  } catch (error) {
    console.error('POST floor error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}