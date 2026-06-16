// app/api/admin/invoices/route.ts
// Admin API to fetch all subscription invoices

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

    const invoices = await prisma.subscriptionInvoice.findMany({
      include: {
        landlord: {
          select: {
            id: true,
            email: true,
            companyName: true,
            phone: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    const serializedInvoices = invoices.map(inv => ({
      id: inv.id,
      propertyCount: inv.propertyCount,
      amount: Number(inv.amount),
      billingPeriod: inv.billingPeriod,
      dueDate: inv.dueDate.toISOString(),
      paidAt: inv.paidAt?.toISOString() || null,
      status: inv.status,
      mpesaReceipt: inv.mpesaReceipt,
      createdAt: inv.createdAt.toISOString(),
      landlord: {
        id: inv.landlord.id,
        email: inv.landlord.email,
        companyName: inv.landlord.companyName,
        phone: inv.landlord.phone
      }
    }))

    return NextResponse.json(serializedInvoices)
  } catch (error) {
    console.error('Error fetching invoices:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}