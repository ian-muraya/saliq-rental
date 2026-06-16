// app/api/landlord/invoices/route.ts
// API for fetching landlord subscription invoices

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

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string }

    const invoices = await prisma.subscriptionInvoice.findMany({
      where: { landlordId: decoded.userId },
      orderBy: { createdAt: 'desc' }
    })

    const serializedInvoices = invoices.map(i => ({
      id: i.id,
      propertyCount: i.propertyCount,
      amount: Number(i.amount),
      billingPeriod: i.billingPeriod,
      dueDate: i.dueDate.toISOString(),
      paidAt: i.paidAt?.toISOString() || null,
      status: i.status,
      mpesaReceipt: i.mpesaReceipt
    }))

    return NextResponse.json(serializedInvoices)
  } catch (error) {
    console.error('Error fetching invoices:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}