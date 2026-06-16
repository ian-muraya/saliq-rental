// app/api/public/company-settings/route.ts
// Public API for company settings (no auth required)

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    let settings = await prisma.companySettings.findFirst()
    
    if (!settings) {
      settings = await prisma.companySettings.create({
        data: {
          companyName: 'Saliq Software Solutions',
          email: 'support@saliq.co.ke',
          phone: '+254700000000',
          supportHours: 'Monday - Friday: 9am - 5pm EAT'
        }
      })
    }

    return NextResponse.json({
      companyName: settings.companyName,
      email: settings.email,
      phone: settings.phone,
      phoneAlt: settings.phoneAlt,
      physicalAddress: settings.physicalAddress,
      facebookUrl: settings.facebookUrl,
      twitterUrl: settings.twitterUrl,
      instagramUrl: settings.instagramUrl,
      linkedinUrl: settings.linkedinUrl,
      youtubeUrl: settings.youtubeUrl,
      supportHours: settings.supportHours
    })
  } catch (error) {
    console.error('Error fetching company settings:', error)
    return NextResponse.json({
      companyName: 'Saliq Software Solutions',
      email: 'support@saliq.co.ke',
      phone: '+254700000000',
      supportHours: 'Monday - Friday: 9am - 5pm EAT'
    })
  }
}