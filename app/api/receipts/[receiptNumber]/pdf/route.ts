// app/api/receipts/[receiptNumber]/pdf/route.ts
// API to generate PDF receipt

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateReceiptPDF } from '@/lib/pdf-generator'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ receiptNumber: string }> }
) {
  try {
    const { receiptNumber } = await params

    // Get receipt data
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

    // Prepare data for PDF
    const receiptData = {
      receiptNumber: receipt.receiptNumber,
      tenantName: receipt.tenantName,
      propertyName: receipt.propertyName,
      unitNumber: receipt.unitNumber,
      amountPaid: Number(receipt.amountPaid),
      monthPaid: receipt.monthPaid,
      mpesaReceipt: receipt.payment?.mpesaReceipt || null,
      paymentDate: receipt.payment?.paymentDate || new Date(),
      transactionCode: receipt.transactionCode
    }

    // Generate PDF
    const pdfBuffer = await generateReceiptPDF(receiptData)

    // Return PDF as downloadable file
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=receipt-${receipt.receiptNumber}.pdf`
      }
    })
  } catch (error) {
    console.error('PDF generation error:', error)
    return NextResponse.json({ error: 'Failed to generate PDF: ' + (error as Error).message }, { status: 500 })
  }
}