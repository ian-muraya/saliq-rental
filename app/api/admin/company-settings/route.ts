// app/api/admin/company-settings/route.ts
// Admin API for company settings

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { role: string }
    if (decoded.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    let settings = await prisma.companySettings.findFirst()
    
    if (!settings) {
      settings = await prisma.companySettings.create({
        data: {
          companyName: 'Saliq Software Solutions',
          email: 'support@saliq.co.ke',
          phone: '+254700000000',
          supportHours: 'Monday - Friday: 9am - 5pm EAT'
        }
      })
    }

    return NextResponse.json(settings)
  } catch (error) {
    console.error('Error fetching company settings:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string; role: string }
    if (decoded.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const {
      companyName,
      email,
      phone,
      phoneAlt,
      physicalAddress,
      facebookUrl,
      twitterUrl,
      instagramUrl,
      linkedinUrl,
      youtubeUrl,
      supportHours
    } = body

    let settings = await prisma.companySettings.findFirst()
    
    if (settings) {
      settings = await prisma.companySettings.update({
        where: { id: settings.id },
        data: {
          companyName: companyName ?? undefined,
          email: email ?? undefined,
          phone: phone ?? undefined,
          phoneAlt: phoneAlt ?? undefined,
          physicalAddress: physicalAddress ?? undefined,
          facebookUrl: facebookUrl ?? undefined,
          twitterUrl: twitterUrl ?? undefined,
          instagramUrl: instagramUrl ?? undefined,
          linkedinUrl: linkedinUrl ?? undefined,
          youtubeUrl: youtubeUrl ?? undefined,
          supportHours: supportHours ?? undefined,
          updatedBy: decoded.userId
        }
      })
    } else {
      settings = await prisma.companySettings.create({
        data: {
          companyName: companyName || 'Saliq Software Solutions',
          email: email || 'support@saliq.co.ke',
          phone: phone || '+254700000000',
          supportHours: supportHours || 'Monday - Friday: 9am - 5pm EAT'
        }
      })
    }

    return NextResponse.json({ success: true, settings })
  } catch (error) {
    console.error('Error updating company settings:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}