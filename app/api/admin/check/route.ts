// app/api/admin/check/route.ts
// Check if admin exists

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: { id: true, email: true, role: true, companyName: true }
    })
    
    return NextResponse.json({ 
      adminCount: admins.length,
      admins: admins.map(a => ({ email: a.email, role: a.role }))
    })
  } catch (error) {
    return NextResponse.json({ error: 'Error checking admins' }, { status: 500 })
  }
}