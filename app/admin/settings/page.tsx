// app/admin/settings/page.tsx
// Admin System Settings with Pricing, Company Settings, and Admin Management

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import jwt from 'jsonwebtoken'
import { prisma } from '@/lib/prisma'
import AdminSettingsClient from './AdminSettingsClient'

async function getAdminSettings() {
  try {
    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: {
        id: true,
        email: true,
        phone: true,
        companyName: true,
        createdAt: true,
        adminPermissions: true
      }
    })

    // Get pricing settings
    const monthlyRateSetting = await prisma.systemSettings.findUnique({
      where: { key: 'MONTHLY_RATE_PER_PROPERTY' }
    })
    const yearlyRateSetting = await prisma.systemSettings.findUnique({
      where: { key: 'YEARLY_RATE_PER_PROPERTY' }
    })
    const currencySetting = await prisma.systemSettings.findUnique({
      where: { key: 'CURRENCY' }
    })

    // Get company settings
    let companySettings = await prisma.companySettings.findFirst()
    if (!companySettings) {
      companySettings = await prisma.companySettings.create({
        data: {
          companyName: 'Saliq Software Solutions',
          email: 'support@saliq.co.ke',
          phone: '+254700000000',
          supportHours: 'Monday - Friday: 9am - 5pm EAT'
        }
      })
    }

    const systemStats = {
      totalLandlords: await prisma.user.count({ where: { role: 'LANDLORD' } }),
      totalProperties: await prisma.property.count(),
      totalTenants: await prisma.tenant.count(),
      totalPayments: await prisma.payment.count(),
      totalCollected: (await prisma.payment.aggregate({ _sum: { amount: true } }))._sum.amount || 0
    }

    return {
      admins: admins.map(a => ({
        id: a.id,
        email: a.email,
        phone: a.phone,
        companyName: a.companyName,
        createdAt: a.createdAt.toISOString(),
        permissions: a.adminPermissions
      })),
      systemStats: {
        ...systemStats,
        totalCollected: Number(systemStats.totalCollected)
      },
      pricing: {
        monthlyRatePerProperty: monthlyRateSetting ? parseInt(monthlyRateSetting.value) : 1500,
        yearlyRatePerProperty: yearlyRateSetting ? parseInt(yearlyRateSetting.value) : 12000,
        currency: currencySetting?.value || 'KES'
      },
      companySettings: {
        id: companySettings.id,
        companyName: companySettings.companyName,
        email: companySettings.email,
        phone: companySettings.phone,
        phoneAlt: companySettings.phoneAlt,
        physicalAddress: companySettings.physicalAddress,
        facebookUrl: companySettings.facebookUrl,
        twitterUrl: companySettings.twitterUrl,
        instagramUrl: companySettings.instagramUrl,
        linkedinUrl: companySettings.linkedinUrl,
        youtubeUrl: companySettings.youtubeUrl,
        supportHours: companySettings.supportHours
      }
    }
  } catch (error) {
    console.error('Error fetching admin settings:', error)
    return { 
      admins: [], 
      systemStats: {}, 
      pricing: { monthlyRatePerProperty: 1500, yearlyRatePerProperty: 12000, currency: 'KES' },
      companySettings: {
        companyName: 'Saliq Software Solutions',
        email: 'support@saliq.co.ke',
        phone: '+254700000000',
        phoneAlt: null,
        physicalAddress: null,
        facebookUrl: null,
        twitterUrl: null,
        instagramUrl: null,
        linkedinUrl: null,
        youtubeUrl: null,
        supportHours: 'Monday - Friday: 9am - 5pm EAT'
      }
    }
  }
}

export default async function AdminSettingsPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('token')?.value

  if (!token) {
    redirect('/admin-login')
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string; role: string }
    
    if (decoded.role !== 'ADMIN') {
      redirect('/dashboard')
    }

    const data = await getAdminSettings()
    return <AdminSettingsClient initialData={data} />
  } catch (error) {
    console.error('JWT verification failed:', error)
    redirect('/admin-login')
  }
}