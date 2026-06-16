// app/dashboard/settings/page.tsx
// Server component - fetches user settings

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import jwt from 'jsonwebtoken'
import { prisma } from '@/lib/prisma'
import SettingsClient from './SettingsClient'

async function getSettingsData(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { landlordProfile: true }
    })

    const properties = await prisma.property.findMany({
      where: { landlordId: userId },
      select: { id: true, name: true, paybillNumber: true, tillNumber: true }
    })

    const invoices = await prisma.subscriptionInvoice.findMany({
      where: { landlordId: userId },
      orderBy: { createdAt: 'desc' },
      take: 6
    })

    const serializedUser = {
      id: user?.id,
      email: user?.email,
      phone: user?.phone,
      companyName: user?.companyName,
      registeredProperties: user?.registeredProperties,
      paybillNumber: user?.paybillNumber,
      tillNumber: user?.tillNumber,
      landlordProfile: {
        businessRegNo: user?.landlordProfile?.businessRegNo,
        physicalAddress: user?.landlordProfile?.physicalAddress,
        subscriptionStatus: user?.landlordProfile?.subscriptionStatus,
        subscriptionExpiresAt: user?.landlordProfile?.subscriptionExpiresAt?.toISOString() || null
      }
    }

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

    return { user: serializedUser, properties, invoices: serializedInvoices }
  } catch (error) {
    console.error('Error fetching settings:', error)
    return { user: null, properties: [], invoices: [] }
  }
}

export default async function SettingsPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('token')?.value
  
  if (!token) {
    redirect('/login')
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string }
    const data = await getSettingsData(decoded.userId)
    
    return <SettingsClient initialData={data} />
  } catch (error) {
    console.error('JWT verification failed:', error)
    redirect('/login')
  }
}