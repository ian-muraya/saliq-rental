// app/api/public/pricing/route.ts
// Public API for pricing - no authentication required

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Get pricing settings from database
    const monthlySetting = await prisma.systemSettings.findUnique({
      where: { key: 'MONTHLY_RATE_PER_PROPERTY' }
    })
    const yearlySetting = await prisma.systemSettings.findUnique({
      where: { key: 'YEARLY_RATE_PER_PROPERTY' }
    })
    const currencySetting = await prisma.systemSettings.findUnique({
      where: { key: 'CURRENCY' }
    })
    
    return NextResponse.json({
      monthlyRatePerProperty: monthlySetting ? parseInt(monthlySetting.value) : 1500,
      yearlyRatePerProperty: yearlySetting ? parseInt(yearlySetting.value) : 12000,
      currency: currencySetting?.value || 'KES'
    })
  } catch (error) {
    console.error('Error fetching public pricing:', error)
    // Return default values if database error
    return NextResponse.json({
      monthlyRatePerProperty: 1500,
      yearlyRatePerProperty: 12000,
      currency: 'KES'
    })
  }
}