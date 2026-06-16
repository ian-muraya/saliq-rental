// app/receipts/[receiptNumber]/download/page.tsx
// app/receipts/[receiptNumber]/download/page.tsx
// Public receipt download page - no login required

import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import ReceiptDownloadClient from './ReceiptDownloadClient'

async function getReceiptData(receiptNumber: string) {
  try {
    const receipt = await prisma.receipt.findUnique({
      where: { receiptNumber },
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
      }
    })

    if (!receipt) return null

    return {
      id: receipt.id,
      receiptNumber: receipt.receiptNumber,
      tenantName: receipt.tenantName,
      propertyName: receipt.propertyName,
      unitNumber: receipt.unitNumber,
      amountPaid: Number(receipt.amountPaid),
      monthPaid: receipt.monthPaid,
      transactionCode: receipt.transactionCode,
      generatedAt: receipt.generatedAt.toISOString(),
      payment: {
        mpesaReceipt: receipt.payment?.mpesaReceipt,
        paymentDate: receipt.payment?.paymentDate?.toISOString()
      }
    }
  } catch (error) {
    console.error('Error fetching receipt:', error)
    return null
  }
}

export default async function ReceiptDownloadPage({
  params
}: {
  params: { receiptNumber: string }
}) {
  const { receiptNumber } = await params
  const receipt = await getReceiptData(receiptNumber)

  if (!receipt) {
    notFound()
  }

  // Update download count
  await prisma.receipt.update({
    where: { id: receipt.id },
    data: {
      downloadCount: { increment: 1 },
      lastDownloaded: new Date()
    }
  })

  return <ReceiptDownloadClient receipt={receipt} />
}