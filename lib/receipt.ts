// lib/receipt.ts
// Receipt generation utilities

import { prisma } from './prisma'

export function generateReceiptNumber(): string {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const random = String(Math.floor(Math.random() * 10000)).padStart(4, '0')
  return `RCP-${year}${month}${day}-${random}`
}

export async function createReceipt(paymentId: string) {
  try {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
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
    })

    if (!payment || !payment.tenant) {
      throw new Error('Payment or tenant not found')
    }

    const tenant = payment.tenant
    const unit = tenant.unit
    const property = unit.property

    const existingReceipt = await prisma.receipt.findUnique({
      where: { paymentId }
    })

    if (existingReceipt) {
      return existingReceipt
    }

    const receiptNumber = generateReceiptNumber()

    const monthPaid = new Date(payment.paymentDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long'
    })

    // Use transactionId or mpesaReceipt as transaction code
    const transactionCode = payment.mpesaReceipt || payment.transactionId || 'N/A'

    const receipt = await prisma.receipt.create({
      data: {
        paymentId: payment.id,
        receiptNumber,
        tenantName: tenant.fullName,
        propertyName: property.name,
        unitNumber: unit.unitNumber,
        amountPaid: Number(payment.amount),
        monthPaid,
        transactionCode,
        pdfUrl: null
      }
    })

    return receipt
  } catch (error) {
    console.error('Error creating receipt:', error)
    throw error
  }
}

export async function getReceiptByNumber(receiptNumber: string) {
  return prisma.receipt.findUnique({
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
}

export function getReceiptDownloadUrl(receiptNumber: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
  return `${baseUrl}/receipts/${receiptNumber}/download`
}