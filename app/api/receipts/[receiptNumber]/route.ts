// app/api/receipts/[receiptNumber]/route.ts
// Public API for fetching receipt data

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ receiptNumber: string }> }
) {
  try {
    const { receiptNumber } = await params

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

    if (!receipt) {
      return NextResponse.json({ error: 'Receipt not found' }, { status: 404 })
    }

    // Update download count
    await prisma.receipt.update({
      where: { id: receipt.id },
      data: {
        downloadCount: { increment: 1 },
        lastDownloaded: new Date()
      }
    })

    return NextResponse.json({
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
    })
  } catch (error) {
    console.error('Error fetching receipt:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}