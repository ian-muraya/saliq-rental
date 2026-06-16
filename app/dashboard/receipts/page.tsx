// app/dashboard/receipts/page.tsx
// Server component - fetches receipts data

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import jwt from 'jsonwebtoken'
import { prisma } from '@/lib/prisma'
import ReceiptsClient from './ReceiptsClient'

async function getReceiptsData(userId: string) {
  try {
    const receipts = await prisma.receipt.findMany({
      where: {
        payment: {
          tenant: {
            unit: {
              property: {
                landlordId: userId
              }
            }
          }
        }
      },
      include: {
        payment: {
          include: {
            tenant: {
              include: {
                unit: {
                  include: {
                    property: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: { generatedAt: 'desc' }
    })

    const serializedReceipts = receipts.map(r => ({
      id: r.id,
      receiptNumber: r.receiptNumber,
      generatedAt: r.generatedAt.toISOString(),
      tenantName: r.tenantName,
      propertyName: r.propertyName,
      unitNumber: r.unitNumber,
      amountPaid: Number(r.amountPaid),
      monthPaid: r.monthPaid,
      transactionCode: r.transactionCode,
      pdfUrl: r.pdfUrl,
      payment: {
        id: r.payment.id,
        paymentDate: r.payment.paymentDate.toISOString(),
        mpesaReceipt: r.payment.mpesaReceipt,
        monthsCovered: r.payment.monthsCovered
      }
    }))

    return { receipts: serializedReceipts }
  } catch (error) {
    console.error('Error fetching receipts:', error)
    return { receipts: [] }
  }
}

export default async function ReceiptsPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('token')?.value
  
  if (!token) {
    redirect('/login')
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string }
    const data = await getReceiptsData(decoded.userId)
    
    return <ReceiptsClient initialData={data} />
  } catch (error) {
    console.error('JWT verification failed:', error)
    redirect('/login')
  }
}