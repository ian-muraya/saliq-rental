// app/api/admin/restrict-access/route.ts
// Admin API to restrict or allow landlord access

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
    const { landlordId, action } = body

    const isRestricted = action === 'restrict'

    // Update the landlord's restriction status
    const landlord = await prisma.user.update({
      where: { id: landlordId, role: 'LANDLORD' },
      data: { isRestricted }
    })

    console.log(`Landlord ${landlord.email} restriction set to: ${isRestricted}`)

    return NextResponse.json({
      success: true,
      message: isRestricted ? 'Account restricted' : 'Account access restored',
      landlord: {
        id: landlord.id,
        email: landlord.email,
        isRestricted: landlord.isRestricted
      }
    })
  } catch (error) {
    console.error('Error updating landlord access:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}