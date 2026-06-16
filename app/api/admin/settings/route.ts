// app/api/admin/settings/route.ts
// Admin settings API

import { NextResponse } from 'next/server'
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

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string; role: string }
    
    if (decoded.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: {
        id: true,
        email: true,
        phone: true,
        companyName: true,
        createdAt: true,
        adminPermissions: true
      }
    })

    return NextResponse.json({
      admins: admins.map(a => ({
        id: a.id,
        email: a.email,
        phone: a.phone,
        companyName: a.companyName,
        createdAt: a.createdAt.toISOString(),
        permissions: a.adminPermissions
      }))
    })
  } catch (error) {
    console.error('Error fetching admin settings:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}