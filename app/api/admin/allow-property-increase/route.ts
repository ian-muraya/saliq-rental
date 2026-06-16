// app/api/admin/allow-property-increase/route.ts
// Admin API to increase landlord property limit

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string; role: string }
    
    // Check if user is admin
    if (decoded.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { landlordId, newPropertyCount } = body

    if (newPropertyCount <= 0) {
      return NextResponse.json({ error: 'Property count must be greater than 0' }, { status: 400 })
    }

    const landlord = await prisma.user.update({
      where: { id: landlordId, role: 'LANDLORD' },
      data: { registeredProperties: newPropertyCount }
    })

    return NextResponse.json({
      success: true,
      message: `Property limit increased to ${newPropertyCount}`,
      landlord
    })
  } catch (error) {
    console.error('Error updating property limit:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}