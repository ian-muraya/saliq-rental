// app/api/auth/register/route.ts
// Updated registration API with dynamic pricing

import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

// Helper function to get current pricing from database
async function getCurrentPricing() {
  const monthlySetting = await prisma.systemSettings.findUnique({
    where: { key: 'MONTHLY_RATE_PER_PROPERTY' }
  })
  const yearlySetting = await prisma.systemSettings.findUnique({
    where: { key: 'YEARLY_RATE_PER_PROPERTY' }
  })
  
  return {
    monthlyRate: monthlySetting ? parseInt(monthlySetting.value) : 1500,
    yearlyRate: yearlySetting ? parseInt(yearlySetting.value) : 12000,
    currency: 'KES'
  }
}

export async function POST(request: NextRequest) {
  try {
    const { email, phone, password, companyName, propertyCount, billingPeriod = 'MONTHLY' } = await request.json()

    // Validate required fields
    if (!email || !phone || !password || !companyName) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      )
    }

    if (!propertyCount || propertyCount < 1) {
      return NextResponse.json(
        { error: 'At least one property is required' },
        { status: 400 }
      )
    }

    // Check if user exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { phone }
        ]
      }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email or phone already exists' },
        { status: 400 }
      )
    }

    // Get current pricing from database (dynamic)
    const pricing = await getCurrentPricing()
    
    // Calculate subscription fee based on selected billing period
    let subscriptionFee: number
    let billingPeriodSelected: string
    
    if (billingPeriod === 'YEARLY') {
      subscriptionFee = propertyCount * pricing.yearlyRate
      billingPeriodSelected = 'YEARLY'
    } else {
      subscriptionFee = propertyCount * pricing.monthlyRate
      billingPeriodSelected = 'MONTHLY'
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        phone,
        password: hashedPassword,
        companyName,
        registeredProperties: propertyCount,
        role: 'LANDLORD',
        landlordProfile: {
          create: {
            propertyCount: 0,
            subscriptionStatus: 'PENDING_PAYMENT'
          }
        }
      }
    })

    // Create subscription invoice with dynamic amount
    await prisma.subscriptionInvoice.create({
      data: {
        landlordId: user.id,
        propertyCount: propertyCount,
        amount: subscriptionFee,
        billingPeriod: billingPeriodSelected,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        status: 'PENDING'
      }
    })

    return NextResponse.json({
      success: true,
      message: `Registration successful. Please complete payment of ${pricing.currency} ${subscriptionFee.toLocaleString()} within 7 days.`,
      userId: user.id,
      pricing: {
        monthlyRate: pricing.monthlyRate,
        yearlyRate: pricing.yearlyRate,
        selectedAmount: subscriptionFee,
        billingPeriod: billingPeriodSelected
      }
    })
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Internal server error. Please try again.' },
      { status: 500 }
    )
  }
}