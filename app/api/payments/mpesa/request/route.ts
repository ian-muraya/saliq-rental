// app/api/payments/mpesa/request/route.ts
// API endpoint to send STK Push payment request to tenant

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import { prisma } from '@/lib/prisma'
import { mpesa } from '@/lib/mpesa'

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string }
    const body = await request.json()
    const { tenantId, amount, phone } = body

    // Verify tenant belongs to this landlord
    const tenant = await prisma.tenant.findFirst({
      where: {
        id: tenantId,
        unit: {
          property: {
            landlordId: decoded.userId
          }
        }
      },
      include: {
        unit: {
          include: {
            property: true
          }
        }
      }
    })

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
    }

    const paymentAmount = amount || Number(tenant.unit.rentAmount)
    const propertyName = tenant.unit.property.name.slice(0, 12)
    const accountRef = `${tenant.unit.unitNumber}-${propertyName}`.slice(0, 12)

    // Initiate STK Push
    const response = await mpesa.stkPush(
      phone || tenant.phone,
      paymentAmount,
      accountRef,
      `Rent: ${tenant.unit.unitNumber}`
    )

    if (response.ResponseCode === '0') {
      // Create a pending payment record - REMOVED paymentMethod field
      await prisma.payment.create({
        data: {
          tenantId: tenant.id,
          amount: paymentAmount,
          status: 'PENDING',
          transactionId: response.CheckoutRequestID,
          paymentDate: new Date()
        }
      })
      
      return NextResponse.json({
        success: true,
        message: 'Payment request sent successfully',
        checkoutRequestId: response.CheckoutRequestID
      })
    } else {
      return NextResponse.json({
        error: response.ResponseDescription || 'Failed to send payment request'
      }, { status: 400 })
    }
  } catch (error) {
    console.error('Failed to send M-Pesa request:', error)
    return NextResponse.json({ error: 'Failed to send payment request' }, { status: 500 })
  }
}