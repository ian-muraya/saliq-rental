// app/api/admin/support/tickets/[id]/route.ts
// Admin update ticket status

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import { prisma } from '@/lib/prisma'

export async function PUT(
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
    const { status, priority, adminNote } = body

    const updateData: any = {}
    if (status) updateData.status = status
    if (priority) updateData.priority = priority
    if (adminNote !== undefined) updateData.adminNote = adminNote
    if (status === 'RESOLVED') updateData.resolvedAt = new Date()

    const ticket = await prisma.supportTicket.update({
      where: { id },
      data: updateData,
      include: {
        landlord: {
          select: { email: true, companyName: true }
        }
      }
    })

    return NextResponse.json({
      id: ticket.id,
      status: ticket.status,
      priority: ticket.priority,
      adminNote: ticket.adminNote
    })
  } catch (error) {
    console.Error('Error updating ticket:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}