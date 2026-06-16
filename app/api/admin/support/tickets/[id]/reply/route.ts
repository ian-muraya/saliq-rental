// app/api/admin/support/tickets/[id]/reply/route.ts
// Admin reply to support ticket

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { id } = await params
    const body = await request.json()
    const { message, status, adminNote } = body

    // Add reply
    const reply = await prisma.supportReply.create({
      data: {
        ticketId: id,
        message,
        isFromAdmin: true,
        senderId: decoded.userId
      }
    })

    // Update ticket status if provided
    if (status) {
      await prisma.supportTicket.update({
        where: { id },
        data: { 
          status,
          ...(status === 'RESOLVED' ? { resolvedAt: new Date() } : {}),
          ...(adminNote !== undefined ? { adminNote } : {})
        }
      })
    }

    return NextResponse.json({
      id: reply.id,
      message: reply.message,
      isFromAdmin: reply.isFromAdmin,
      createdAt: reply.createdAt.toISOString()
    })
  } catch (error) {
    console.Error('Error adding admin reply:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}