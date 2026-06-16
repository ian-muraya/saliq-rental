// app/api/admin/settings/pricing/route.ts
// Admin API to manage pricing settings

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import { prisma } from '@/lib/prisma'

// Default pricing values
const DEFAULT_PRICES = {
  MONTHLY_RATE_PER_PROPERTY: '1500',
  YEARLY_RATE_PER_PROPERTY: '12000',
  CURRENCY: 'KES'
}

async function getSetting(key: string): Promise<string> {
  const setting = await prisma.systemSettings.findUnique({
    where: { key }
  })
  return setting?.value || DEFAULT_PRICES[key as keyof typeof DEFAULT_PRICES] || '0'
}

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

    const monthlyRate = await getSetting('MONTHLY_RATE_PER_PROPERTY')
    const yearlyRate = await getSetting('YEARLY_RATE_PER_PROPERTY')
    const currency = await getSetting('CURRENCY')

    return NextResponse.json({
      monthlyRatePerProperty: parseInt(monthlyRate),
      yearlyRatePerProperty: parseInt(yearlyRate),
      currency
    })
  } catch (error) {
    console.error('Error fetching pricing settings:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
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

    const body = await request.json()
    const { monthlyRatePerProperty, yearlyRatePerProperty, currency } = body

    // Update or create settings
    const operations = [
      prisma.systemSettings.upsert({
        where: { key: 'MONTHLY_RATE_PER_PROPERTY' },
        update: { value: monthlyRatePerProperty.toString(), updatedBy: decoded.userId },
        create: { key: 'MONTHLY_RATE_PER_PROPERTY', value: monthlyRatePerProperty.toString(), updatedBy: decoded.userId, description: 'Monthly subscription rate per property' }
      }),
      prisma.systemSettings.upsert({
        where: { key: 'YEARLY_RATE_PER_PROPERTY' },
        update: { value: yearlyRatePerProperty.toString(), updatedBy: decoded.userId },
        create: { key: 'YEARLY_RATE_PER_PROPERTY', value: yearlyRatePerProperty.toString(), updatedBy: decoded.userId, description: 'Yearly subscription rate per property' }
      })
    ]

    if (currency) {
      operations.push(
        prisma.systemSettings.upsert({
          where: { key: 'CURRENCY' },
          update: { value: currency, updatedBy: decoded.userId },
          create: { key: 'CURRENCY', value: currency, updatedBy: decoded.userId, description: 'Currency for subscription fees' }
        })
      )
    }

    await prisma.$transaction(operations)

    return NextResponse.json({
      success: true,
      message: 'Pricing settings updated successfully',
      data: {
        monthlyRatePerProperty: parseInt(monthlyRatePerProperty),
        yearlyRatePerProperty: parseInt(yearlyRatePerProperty),
        currency: currency || 'KES'
      }
    })
  } catch (error) {
    console.error('Error updating pricing settings:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}