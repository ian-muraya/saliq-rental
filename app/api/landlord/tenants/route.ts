// app/api/landlord/tenants/route.ts
// API endpoint for tenant management - Named exports

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import { prisma } from '@/lib/prisma'

// GET - Fetch all tenants for landlord
export async function GET() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string }

    const tenants = await prisma.tenant.findMany({
      where: {
        unit: {
          property: {
            landlordId: decoded.userId
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

    return NextResponse.json(tenants)
  } catch (error) {
    console.error('GET tenants error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create a new tenant
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string }
    const body = await request.json()
    const { fullName, phone, email, unitId, leaseStartDate, leaseEndDate } = body

    // Validate required fields
    if (!fullName || !phone || !unitId) {
      return NextResponse.json(
        { error: 'Full name, phone, and unit are required' },
        { status: 400 }
      )
    }

    // Verify unit belongs to landlord and is available
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

    if (unit.isOccupied) {
      return NextResponse.json(
        { error: 'This unit is already occupied' },
        { status: 400 }
      )
    }

    // Create tenant
    const tenant = await prisma.tenant.create({
      data: {
        fullName,
        phone,
        email: email || null,
        unitId,
        leaseStartDate: leaseStartDate ? new Date(leaseStartDate) : null,
        leaseEndDate: leaseEndDate ? new Date(leaseEndDate) : null,
        isActive: true,
        movedInAt: new Date()
      },
      include: {
        unit: {
          include: {
            property: true
          }
        }
      }
    })

    // Mark unit as occupied
    await prisma.unit.update({
      where: { id: unitId },
      data: { isOccupied: true, status: 'OCCUPIED' }
    })

    return NextResponse.json(tenant, { status: 201 })
  } catch (error) {
    console.error('POST tenant error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT - Update tenant
export async function PUT(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string }
    const body = await request.json()
    const { id, fullName, phone, email, leaseStartDate, leaseEndDate, isActive } = body

    if (!id) {
      return NextResponse.json({ error: 'Tenant ID required' }, { status: 400 })
    }

    // Verify tenant belongs to landlord
    const existingTenant = await prisma.tenant.findFirst({
      where: {
        id,
        unit: {
          property: {
            landlordId: decoded.userId
          }
        }
      }
    })

    if (!existingTenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
    }

    // Update tenant
    const tenant = await prisma.tenant.update({
      where: { id },
      data: {
        fullName: fullName || undefined,
        phone: phone || undefined,
        email: email !== undefined ? email : undefined,
        leaseStartDate: leaseStartDate ? new Date(leaseStartDate) : undefined,
        leaseEndDate: leaseEndDate ? new Date(leaseEndDate) : undefined,
        isActive: isActive !== undefined ? isActive : undefined,
        movedOutAt: isActive === false ? new Date() : undefined
      }
    })

    // If tenant is deactivated, mark unit as available
    if (isActive === false && existingTenant.isActive === true) {
      await prisma.unit.update({
        where: { id: existingTenant.unitId },
        data: { isOccupied: false, status: 'AVAILABLE' }
      })
    }

    return NextResponse.json(tenant)
  } catch (error) {
    console.error('PUT tenant error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}