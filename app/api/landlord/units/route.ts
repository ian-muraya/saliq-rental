// app/api/landlord/units/route.ts
// API endpoint for unit management - Named exports

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import { prisma } from '@/lib/prisma'

// POST - Create a new unit
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string }
    const body = await request.json()
    const { propertyId, floorId, unitNumber, unitType, rentAmount, depositAmount, sizeSqm } = body

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

    // Check if unit number already exists in this property
    const existingUnit = await prisma.unit.findFirst({
      where: {
        propertyId,
        unitNumber
      }
    })

    if (existingUnit) {
      return NextResponse.json(
        { error: `Unit ${unitNumber} already exists in this property` },
        { status: 400 }
      )
    }

    // If floorId provided, verify it belongs to property
    if (floorId) {
      const floor = await prisma.floor.findFirst({
        where: {
          id: floorId,
          propertyId
        }
      })
      if (!floor) {
        return NextResponse.json({ error: 'Floor not found for this property' }, { status: 400 })
      }
    }

    // Create unit
    const unit = await prisma.unit.create({
      data: {
        propertyId,
        floorId: floorId || null,
        unitNumber,
        unitType: unitType || 'ONE_BEDROOM',
        rentAmount,
        depositAmount: depositAmount || null,
        sizeSqm: sizeSqm || null,
        status: 'AVAILABLE'
      }
    })

    // Update property total units count
    await prisma.property.update({
      where: { id: propertyId },
      data: { totalUnits: { increment: 1 } }
    })

    // If floor specified, update floor units count
    if (floorId) {
      await prisma.floor.update({
        where: { id: floorId },
        data: { unitsPerFloor: { increment: 1 } }
      })
    }

    return NextResponse.json(unit, { status: 201 })
  } catch (error) {
    console.error('POST unit error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Delete a unit
export async function DELETE(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('token')?.value
    const { searchParams } = new URL(request.url)
    const unitId = searchParams.get('id')

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string }

    if (!unitId) {
      return NextResponse.json({ error: 'Unit ID required' }, { status: 400 })
    }

    // Get unit to verify ownership
    const unit = await prisma.unit.findFirst({
      where: {
        id: unitId,
        property: {
          landlordId: decoded.userId
        }
      }
    })

    if (!unit) {
      return NextResponse.json({ error: 'Unit not found' }, { status: 404 })
    }

    // Check if unit has active tenants
    const hasActiveTenant = await prisma.tenant.findFirst({
      where: {
        unitId,
        isActive: true
      }
    })

    if (hasActiveTenant) {
      return NextResponse.json(
        { error: 'Cannot delete unit with active tenant. Please move or deactivate the tenant first.' },
        { status: 400 }
      )
    }

    // Delete unit
    await prisma.unit.delete({ where: { id: unitId } })

    // Update property total units count
    await prisma.property.update({
      where: { id: unit.propertyId },
      data: { totalUnits: { decrement: 1 } }
    })

    return NextResponse.json({ message: 'Unit deleted successfully' })
  } catch (error) {
    console.error('DELETE unit error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}