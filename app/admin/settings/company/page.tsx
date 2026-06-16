// app/admin/settings/company/page.tsx
// Admin Company Settings Page

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import jwt from 'jsonwebtoken'
import { prisma } from '@/lib/prisma'
import CompanySettingsClient from './CompanySettingsClient'

async function getCompanySettings() {
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
  return settings
}

export default async function CompanySettingsPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('token')?.value

  if (!token) redirect('/admin-login')
  const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { role: string }
  if (decoded.role !== 'ADMIN') redirect('/dashboard')

  const settings = await getCompanySettings()
  return <CompanySettingsClient initialData={settings} />
}