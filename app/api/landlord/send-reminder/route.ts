// app/api/landlord/send-reminder/route.ts
// API endpoint for sending email reminders to tenants using Resend

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import { prisma } from '@/lib/prisma'
import { Resend } from 'resend'

// Initialize Resend with your API key
const resend = new Resend(process.env.RESEND_API_KEY)

// Helper to generate HTML email template
function generateReminderEmail(tenant: any, message: string) {
  const today = new Date()
  const paidUntil = tenant.rentPaidUntil ? new Date(tenant.rentPaidUntil) : null
  const daysOverdue = paidUntil ? Math.floor((today.getTime() - paidUntil.getTime()) / (1000 * 60 * 60 * 24)) : 0

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #0A192F; color: #FDFBF7; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .header h1 { margin: 0; font-size: 24px; }
        .content { background: #FDFBF7; padding: 30px; border: 1px solid #E5CEB2; border-top: none; border-radius: 0 0 8px 8px; }
        .details { background: #F5F2EB; padding: 15px; border-radius: 8px; margin: 15px 0; }
        .details p { margin: 5px 0; }
        .footer { text-align: center; margin-top: 20px; color: #888; font-size: 12px; }
        .btn { display: inline-block; background: #C5A059; color: #0A192F; padding: 10px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; }
        .highlight { color: #C5A059; font-weight: bold; }
        .overdue { color: #dc3545; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🏠 Rent Payment Reminder</h1>
      </div>
      <div class="content">
        <p>Dear <strong>${tenant.fullName}</strong>,</p>
        
        <p>${message}</p>
        
        <div class="details">
          <p><strong>📋 Property:</strong> ${tenant.unit.property.name}</p>
          <p><strong>🏠 Unit:</strong> ${tenant.unit.unitNumber}</p>
          <p><strong>💰 Monthly Rent:</strong> KSh ${Number(tenant.unit.rentAmount).toLocaleString()}</p>
          ${daysOverdue > 0 ? `<p><strong>⏰ Days Overdue:</strong> <span class="overdue">${daysOverdue} days</span></p>` : ''}
          ${tenant.rentPaidUntil ? `<p><strong>📅 Last Payment:</strong> ${new Date(tenant.rentPaidUntil).toLocaleDateString()}</p>` : ''}
        </div>

        ${tenant.unit.property.paybillNumber ? `
        <div class="details" style="background: #E5CEB2;">
          <p><strong>💳 Payment Details:</strong></p>
          <p><strong>Paybill:</strong> ${tenant.unit.property.paybillNumber}</p>
          <p><strong>Account Number:</strong> ${tenant.unit.unitNumber}</p>
        </div>
        ` : ''}

        <p style="text-align: center; margin-top: 20px;">
          <a href="#" class="btn">View My Account</a>
        </p>
        
        <p style="font-size: 14px; color: #666; margin-top: 20px;">
          If you have already made this payment, please disregard this message.
        </p>
        
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} ${tenant.unit.property.name}. All rights reserved.</p>
          <p>This is an automated message from your property management system.</p>
        </div>
      </div>
    </body>
    </html>
  `
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string }
    const body = await request.json()
    const { tenantId, email, subject, message } = body

    if (!tenantId || !email || !subject || !message) {
      return NextResponse.json(
        { error: 'Tenant ID, email, subject, and message are required' },
        { status: 400 }
      )
    }

    // Verify tenant belongs to this landlord
    const tenant = await prisma.tenant.findFirst({
      where: {
        id: tenantId,
        unit: {
          property: {
            landlordId: decoded.userId
          }
        }
      },
      include: {
        unit: {
          include: {
            property: true
          }
        }
      }
    })

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
    }

    // Generate HTML email
    const html = generateReminderEmail(tenant, message)

    // Send email using Resend
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'Saliq <noreply@saliq.co.ke>',
      to: [email],
      subject: subject,
      html: html,
    })

    if (error) {
      console.error('Resend error:', error)
      return NextResponse.json(
        { error: 'Failed to send email: ' + error.message },
        { status: 500 }
      )
    }

    console.log('✅ Email sent successfully:', data)

    return NextResponse.json({
      success: true,
      message: `Reminder sent to ${tenant.fullName} at ${email}`,
      data
    })
  } catch (error) {
    console.error('Error sending reminder:', error)
    return NextResponse.json({ error: 'Failed to send reminder' }, { status: 500 })
  }
}