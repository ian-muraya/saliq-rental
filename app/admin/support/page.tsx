// app/admin/support/page.tsx
// Admin Support Dashboard

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import jwt from 'jsonwebtoken'
import { prisma } from '@/lib/prisma'
import AdminSupportClient from './AdminSupportClient'

async function getAdminSupportData() {
  try {
    const tickets = await prisma.supportTicket.findMany({
      include: {
        landlord: {
          select: {
            id: true,
            email: true,
            companyName: true,
            phone: true
          }
        },
        replies: {
          orderBy: { createdAt: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    const companySettings = await prisma.companySettings.findFirst()

    const serializedTickets = tickets.map(t => ({
      id: t.id,
      subject: t.subject,
      message: t.message,
      category: t.category,
      priority: t.priority,
      status: t.status,
      adminNote: t.adminNote,
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
      resolvedAt: t.resolvedAt?.toISOString() || null,
      landlord: {
        id: t.landlord.id,
        email: t.landlord.email,
        companyName: t.landlord.companyName,
        phone: t.landlord.phone
      },
      replies: t.replies.map(r => ({
        id: r.id,
        message: r.message,
        isFromAdmin: r.isFromAdmin,
        createdAt: r.createdAt.toISOString()
      }))
    }))

    return { tickets: serializedTickets, companySettings }
  } catch (error) {
    console.error('Error fetching admin support data:', error)
    return { tickets: [], companySettings: null }
  }
}

export default async function AdminSupportPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('token')?.value

  if (!token) redirect('/admin-login')
  const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { role: string }
  if (decoded.role !== 'ADMIN') redirect('/dashboard')

  const data = await getAdminSupportData()
  return <AdminSupportClient initialData={data} />
}