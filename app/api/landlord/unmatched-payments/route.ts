// app/api/landlord/unmatched-payments/route.ts
// API for managing unmatched payments - paymentMethod REMOVED

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

    const unmatched = await prisma.unmatchedPayment.findMany({
      where: {
        status: 'PENDING'
      },
      orderBy: { createdAt: 'desc' }
    })

    const tenants = await prisma.tenant.findMany({
      where: {
        unit: {
          property: {
            landlordId: decoded.userId
          }
        },
        isActive: true
      },
      include: {
        unit: {
          include: {
            property: true
          }
        }
      },
      orderBy: { fullName: 'asc' }
    })

    const serializedTenants = tenants.map(t => ({
      id: t.id,
      fullName: t.fullName,
      phone: t.phone,
      propertyName: t.unit.property.name,
      unitNumber: t.unit.unitNumber,
      rentAmount: Number(t.unit.rentAmount)
    }))

    return NextResponse.json({ unmatched, tenants: serializedTenants })
  } catch (error) {
    console.error('Error fetching unmatched payments:', error)
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
    const { unmatchedId, tenantId, action } = body

    if (action === 'ignore') {
      await prisma.unmatchedPayment.update({
        where: { id: unmatchedId },
        data: { status: 'IGNORED', resolvedAt: new Date(), resolvedBy: decoded.userId }
      })
      return NextResponse.json({ success: true })
    }

    if (action === 'assign' && tenantId) {
      const unmatched = await prisma.unmatchedPayment.findUnique({
        where: { id: unmatchedId }
      })

      if (!unmatched) {
        return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
      }

      const tenant = await prisma.tenant.findFirst({
        where: {
          id: tenantId,
          unit: {
            property: {
              landlordId: decoded.userId
            }
          }
        },
        include: { unit: true }
      })

      if (!tenant) {
        return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
      }

      const monthlyRent = Number(tenant.unit.rentAmount)
      const paymentAmount = Number(unmatched.amount)
      
      const monthsCovered = Math.floor(paymentAmount / monthlyRent)
      const exactRentAmount = monthsCovered * monthlyRent
      const extraCredit = paymentAmount - exactRentAmount

      let newPaidUntil = new Date()
      let newCreditBalance = extraCredit

      if (tenant.rentPaidUntil && new Date(tenant.rentPaidUntil) > new Date()) {
        newPaidUntil = new Date(tenant.rentPaidUntil)
        newCreditBalance += Number(tenant.rentCreditBalance)
      }
      
      newPaidUntil.setMonth(newPaidUntil.getMonth() + monthsCovered)

      // Create payment and update tenant - paymentMethod REMOVED
      await prisma.$transaction([
        prisma.payment.create({
          data: {
            tenantId: tenant.id,
            amount: paymentAmount,
            status: 'COMPLETED',
            paymentDate: new Date(),
            allocatedFrom: tenant.rentPaidUntil || new Date(),
            allocatedTo: newPaidUntil,
            monthsCovered: monthsCovered,
            remainingCredit: newCreditBalance,
            mpesaReceipt: unmatched.mpesaReceipt,
            transactionId: unmatched.transactionId,
            paidAt: new Date()
          }
        }),
        prisma.tenant.update({
          where: { id: tenant.id },
          data: {
            rentCreditBalance: newCreditBalance,
            rentPaidUntil: newPaidUntil
          }
        }),
        prisma.unmatchedPayment.update({
          where: { id: unmatchedId },
          data: {
            status: 'RESOLVED',
            resolvedAt: new Date(),
            resolvedBy: decoded.userId,
            assignedTenantId: tenantId
          }
        })
      ])

      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Error processing unmatched payment:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}