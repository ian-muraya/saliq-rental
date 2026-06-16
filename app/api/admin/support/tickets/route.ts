// app/api/admin/support/tickets/route.ts
// Admin API for managing support tickets

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

    const tickets = await prisma.supportTicket.findMany({
      include: {
        landlord: {
          select: {
            id: true,
            email: true,
            companyName: true,
            phone: true
          }
        },
        replies: {
          orderBy: { createdAt: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    const serializedTickets = tickets.map(t => ({
      id: t.id,
      subject: t.subject,
      message: t.message,
      category: t.category,
      priority: t.priority,
      status: t.status,
      adminNote: t.adminNote,
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
      resolvedAt: t.resolvedAt?.toISOString() || null,
      landlord: {
        id: t.landlord.id,
        email: t.landlord.email,
        companyName: t.landlord.companyName,
        phone: t.landlord.phone
      },
      replies: t.replies.map(r => ({
        id: r.id,
        message: r.message,
        isFromAdmin: r.isFromAdmin,
        createdAt: r.createdAt.toISOString()
      }))
    }))

    return NextResponse.json(serializedTickets)
  } catch (error) {
    console.error('Error fetching admin tickets:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}