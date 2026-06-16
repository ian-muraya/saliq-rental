// lib/pdf-generator.ts
// PDF generation using pdf-lib

import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'

interface ReceiptData {
  receiptNumber: string
  tenantName: string
  propertyName: string
  unitNumber: string
  amountPaid: number
  monthPaid: string
  mpesaReceipt: string | null
  paymentDate: Date
  transactionCode: string
}

export async function generateReceiptPDF(receiptData: ReceiptData): Promise<Buffer> {
  // Create a new PDF document
  const pdfDoc = await PDFDocument.create()
  const page = pdfDoc.addPage([595, 842]) // A4 size in points
  const { width, height } = page.getSize()

  // Embed fonts
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  // Helper to draw text
  const drawText = (text: string, x: number, y: number, size: number = 12, isBold: boolean = false) => {
    page.drawText(text, {
      x,
      y,
      size,
      font: isBold ? fontBold : font,
      color: rgb(0.04, 0.1, 0.18) // #0A192F
    })
  }

  // Helper to draw label
  const drawLabel = (label: string, x: number, y: number) => {
    page.drawText(label, {
      x,
      y,
      size: 10,
      font,
      color: rgb(0.33, 0.47, 0.68) // #5579AD
    })
  }

  // Helper to draw value
  const drawValue = (value: string, x: number, y: number) => {
    page.drawText(value, {
      x,
      y,
      size: 12,
      font: fontBold,
      color: rgb(0.04, 0.1, 0.18) // #0A192F
    })
  }

  let y = height - 100

  // Header
  drawText('SALIQ RENTAL MANAGEMENT', 150, y, 20, true)
  y -= 25
  drawText('Official Rent Receipt', 170, y, 14, false)
  y -= 20
  drawText(`Receipt #${receiptData.receiptNumber}`, 200, y, 10, false)
  y -= 40

  // Separator
  page.drawLine({
    start: { x: 50, y },
    end: { x: width - 50, y },
    thickness: 1,
    color: rgb(0.77, 0.63, 0.35) // #C5A059
  })
  y -= 30

  // Tenant & Property
  drawLabel('Tenant', 50, y)
  drawValue(receiptData.tenantName, 250, y)
  y -= 25

  drawLabel('Property', 50, y)
  drawValue(receiptData.propertyName, 250, y)
  y -= 25

  drawLabel('Unit Number', 50, y)
  drawValue(receiptData.unitNumber, 250, y)
  y -= 40

  // Separator
  page.drawLine({
    start: { x: 50, y },
    end: { x: width - 50, y },
    thickness: 1,
    color: rgb(0.9, 0.8, 0.7) // #E5CEB2
  })
  y -= 30

  // Payment Details
  drawLabel('Month Paid', 50, y)
  drawValue(receiptData.monthPaid, 250, y)
  y -= 25

  drawLabel('Amount Paid', 50, y)
  page.drawText(`KSh ${receiptData.amountPaid.toLocaleString()}`, {
    x: 250,
    y,
    size: 20,
    font: fontBold,
    color: rgb(0.77, 0.63, 0.35) // #C5A059
  })
  y -= 25

  drawLabel('Payment Date', 50, y)
  drawValue(new Date(receiptData.paymentDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }), 250, y)
  y -= 25

  if (receiptData.mpesaReceipt) {
    drawLabel('M-Pesa Code', 50, y)
    drawValue(receiptData.mpesaReceipt, 250, y)
    y -= 25
  }

  drawLabel('Transaction Reference', 50, y)
  drawValue(receiptData.transactionCode, 250, y)
  y -= 40

  // Separator
  page.drawLine({
    start: { x: 50, y },
    end: { x: width - 50, y },
    thickness: 1,
    color: rgb(0.9, 0.8, 0.7) // #E5CEB2
  })
  y -= 30

  // Footer
  page.drawText(
    `This is a computer-generated receipt. Generated on ${new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })}`,
    {
      x: 150,
      y: 80,
      size: 9,
      font,
      color: rgb(0.66, 0.7, 0.76) // #A9B3C1
    }
  )

  // Serialize the PDF to bytes
  const pdfBytes = await pdfDoc.save()
  return Buffer.from(pdfBytes)
}