// app/api/receipts/[receiptNumber]/route.ts
// Public API for downloading receipts (no auth required)

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getReceiptByNumber } from '@/lib/receipt'

export async function GET(
  request: NextRequest,
  { params }: { params: { receiptNumber: string } }
) {
  try {
    const { receiptNumber } = await params

    const receipt = await getReceiptByNumber(receiptNumber)

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

    return NextResponse.json(receipt)
  } catch (error) {
    console.error('Error fetching receipt:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}