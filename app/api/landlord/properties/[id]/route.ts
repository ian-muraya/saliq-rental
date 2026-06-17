// app/api/landlord/properties/[id]/route.ts
// API endpoint for single property operations (GET, PUT, DELETE)

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import { prisma } from '@/lib/prisma'

// GET - Fetch a single property by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string }
    const { id } = await params

    const property = await prisma.property.findFirst({
      where: {
        id,
        landlordId: decoded.userId
      },
      include: {
        floors: {
          orderBy: { floorNumber: 'asc' }
        },
        units: {
          include: {
            tenants: {
              where: { isActive: true }
            },
            floor: true
          },
          orderBy: { unitNumber: 'asc' }
        }
      }
    })

    if (!property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 })
    }

    // Convert Decimal to numbers
    const serializedProperty = {
      ...property,
      totalFloors: Number(property.totalFloors),
      totalUnits: Number(property.totalUnits),
      units: property.units.map(unit => ({
        ...unit,
        rentAmount: Number(unit.rentAmount),
        depositAmount: unit.depositAmount ? Number(unit.depositAmount) : null,
        sizeSqm: unit.sizeSqm ? Number(unit.sizeSqm) : null
      }))
    }

    return NextResponse.json(serializedProperty)
  } catch (error) {
    console.error('GET property error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT - Update a property
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string }
    const { id } = await params
    const body = await request.json()
    const { name, location, description, totalFloors, status, paybillNumber, tillNumber } = body

    // Verify property belongs to landlord
    const existingProperty = await prisma.property.findFirst({
      where: {
        id,
        landlordId: decoded.userId
      }
    })

    if (!existingProperty) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 })
    }

    // Update property
    const property = await prisma.property.update({
      where: { id },
      data: {
        name: name !== undefined ? name : undefined,
        location: location !== undefined ? location : undefined,
        description: description !== undefined ? description : undefined,
        totalFloors: totalFloors !== undefined ? totalFloors : undefined,
        status: status !== undefined ? status : undefined,
        paybillNumber: paybillNumber !== undefined ? paybillNumber : undefined,
        tillNumber: tillNumber !== undefined ? tillNumber : undefined
      },
      include: {
        floors: true,
        units: true
      }
    })

    return NextResponse.json({
      id: property.id,
      name: property.name,
      location: property.location,
      description: property.description,
      totalFloors: property.totalFloors,
      totalUnits: property.totalUnits,
      status: property.status,
      paybillNumber: property.paybillNumber,
      tillNumber: property.tillNumber
    })
  } catch (error) {
    console.error('PUT property error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Delete a property
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string }
    const { id } = await params

    const property = await prisma.property.findFirst({
      where: {
        id,
        landlordId: decoded.userId
      }
    })

    if (!property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 })
    }

    // Check for active tenants
    const hasActiveTenants = await prisma.tenant.findFirst({
      where: {
        unit: {
          propertyId: id
        },
        isActive: true
      }
    })

    if (hasActiveTenants) {
      return NextResponse.json(
        { error: 'Cannot delete property with active tenants' },
        { status: 400 }
      )
    }

    // Delete in correct order
    await prisma.payment.deleteMany({
      where: { tenant: { unit: { propertyId: id } } }
    })
    await prisma.tenant.deleteMany({
      where: { unit: { propertyId: id } }
    })
    await prisma.unit.deleteMany({
      where: { propertyId: id } 
    })
    await prisma.floor.deleteMany({
      where: { propertyId: id }
    })
    await prisma.property.delete({
      where: { id }
    })

    await prisma.landlordProfile.update({
      where: { userId: decoded.userId },
      data: { propertyCount: { decrement: 1 } }
    })

    return NextResponse.json({ message: 'Property deleted successfully' })
  } catch (error) {
    console.error('DELETE property error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}