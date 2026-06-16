// app/api/landlord/support/tickets/route.ts
// Support tickets API

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

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string }

    const tickets = await prisma.supportTicket.findMany({
      where: { landlordId: decoded.userId },
      include: {
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
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
      resolvedAt: t.resolvedAt?.toISOString() || null,
      replies: t.replies.map(r => ({
        id: r.id,
        message: r.message,
        isFromAdmin: r.isFromAdmin,
        createdAt: r.createdAt.toISOString()
      }))
    }))

    return NextResponse.json(serializedTickets)
  } catch (error) {
    console.error('Error fetching tickets:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string }
    const body = await request.json()
    const { subject, message, category, priority } = body

    if (!subject || !message) {
      return NextResponse.json({ error: 'Subject and message are required' }, { status: 400 })
    }

    const ticket = await prisma.supportTicket.create({
      data: {
        landlordId: decoded.userId,
        subject,
        message,
        category: category || 'OTHER',
        priority: priority || 'MEDIUM',
        status: 'OPEN'
      },
      include: { replies: true }
    })

    return NextResponse.json({
      id: ticket.id,
      subject: ticket.subject,
      message: ticket.message,
      category: ticket.category,
      priority: ticket.priority,
      status: ticket.status,
      createdAt: ticket.createdAt.toISOString(),
      replies: []
    })
  } catch (error) {
    console.error('Error creating ticket:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}