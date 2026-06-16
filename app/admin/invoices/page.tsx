// app/admin/invoices/page.tsx
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import jwt from 'jsonwebtoken'
import { prisma } from '@/lib/prisma'
import InvoicesClient from './InvoicesClient'

async function getInvoicesData() {
  try {
    const invoices = await prisma.subscriptionInvoice.findMany({
      include: {
        landlord: {
          select: {
            id: true,
            email: true,
            companyName: true,
            phone: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    const serializedInvoices = invoices.map(inv => ({
      id: inv.id,
      propertyCount: inv.propertyCount,
      amount: Number(inv.amount),
      billingPeriod: inv.billingPeriod,
      dueDate: inv.dueDate.toISOString(),
      paidAt: inv.paidAt?.toISOString() || null,
      status: inv.status,
      mpesaReceipt: inv.mpesaReceipt,
      createdAt: inv.createdAt.toISOString(),
      landlord: {
        id: inv.landlord.id,
        email: inv.landlord.email,
        companyName: inv.landlord.companyName,
        phone: inv.landlord.phone
      }
    }))

    return { invoices: serializedInvoices }
  } catch (error) {
    console.error('Error fetching invoices:', error)
    return { invoices: [] }
  }
}

export default async function AdminInvoicesPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('token')?.value

  if (!token) redirect('/admin-login')
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { role: string }
    if (decoded.role !== 'ADMIN') redirect('/dashboard')
    const data = await getInvoicesData()
    return <InvoicesClient initialData={data} />
  } catch (error) {
    redirect('/admin-login')
  }
}