// app/api/payment/callback/route.ts
// M-Pesa webhook handler - auto-records payments using phone number (primary) and unit number (fallback)

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Extract callback data from M-Pesa
    const stkCallback = body.Body?.stkCallback
    if (!stkCallback) {
      return NextResponse.json({ success: false, message: 'Invalid callback data' })
    }

    const resultCode = stkCallback.ResultCode
    const resultDesc = stkCallback.ResultDesc
    const checkoutRequestId = stkCallback.CheckoutRequestID
    
    // Extract metadata from callback
    const metadata = stkCallback.CallbackMetadata?.Item || []
    
    let amount = 0
    let mpesaReceipt = ''
    let transactionDate = ''
    let phoneNumber = ''
    let accountReference = ''
    
    for (const item of metadata) {
      switch (item.Name) {
        case 'Amount':
          amount = item.Value
          break
        case 'MpesaReceiptNumber':
          mpesaReceipt = item.Value
          break
        case 'TransactionDate':
          transactionDate = item.Value
          break
        case 'PhoneNumber':
          phoneNumber = item.Value.toString()
          break
        case 'AccountReference':
          accountReference = item.Value?.toString() || ''
          break
      }
    }

    // Log the callback for debugging
    console.log('📞 M-Pesa Callback:', {
      resultCode,
      amount,
      mpesaReceipt,
      phoneNumber,
      accountReference,
      checkoutRequestId
    })

    if (resultCode !== 0) {
      console.log(`❌ Payment failed: ${resultDesc}`)
      return NextResponse.json({ success: false, message: resultDesc })
    }

    // Clean phone number (remove 0 or +254 prefix, get last 9 digits)
    const cleanPhone = phoneNumber.slice(-9)
    
    // STRATEGY 1: PRIMARY - Match by Phone Number
    let tenant = await prisma.tenant.findFirst({
      where: {
        phone: {
          contains: cleanPhone
        },
        isActive: true
      },
      include: {
        unit: {
          include: {
            property: true
          }
        }
      }
    })
    
    if (tenant) {
      console.log(`✅ Tenant found by PHONE: ${tenant.fullName} (${tenant.phone}) - Unit ${tenant.unit.unitNumber}`)
    }
    
    // STRATEGY 2: FALLBACK - Match by Account Reference (Unit Number)
    if (!tenant && accountReference) {
      const cleanedReference = accountReference.trim().toUpperCase()
      
      tenant = await prisma.tenant.findFirst({
        where: {
          unit: {
            unitNumber: {
              equals: cleanedReference,
              mode: 'insensitive'
            }
          },
          isActive: true
        },
        include: {
          unit: {
            include: {
              property: true
            }
          }
        }
      })
      
      if (tenant) {
        console.log(`✅ Tenant found by UNIT NUMBER (fallback): ${tenant.fullName} - Unit ${tenant.unit.unitNumber}`)
      }
    }
    
    // No tenant found - create unmatched payment record
    if (!tenant) {
      console.error(`❌ No tenant found for Phone: ${phoneNumber} (${cleanPhone}) | Account: ${accountReference}`)
      
      await prisma.unmatchedPayment.create({
        data: {
          amount: amount,
          mpesaReceipt: mpesaReceipt,
          phoneNumber: phoneNumber,
          accountReference: accountReference,
          transactionId: checkoutRequestId,
          status: 'PENDING'
        }
      })
      
      return NextResponse.json({ 
        success: true, 
        message: 'Payment received but tenant not matched. Manual review needed.'
      })
    }

    const monthlyRent = Number(tenant.unit.rentAmount)
    const paymentAmount = amount
    
    // Calculate months covered by this payment
    const monthsCovered = Math.floor(paymentAmount / monthlyRent)
    const exactRentAmount = monthsCovered * monthlyRent
    const extraCredit = paymentAmount - exactRentAmount

    // Calculate new paid-until date
    let newPaidUntil = new Date()
    let newCreditBalance = extraCredit

    if (tenant.rentPaidUntil && new Date(tenant.rentPaidUntil) > new Date()) {
      newPaidUntil = new Date(tenant.rentPaidUntil)
      newCreditBalance += Number(tenant.rentCreditBalance)
    }
    
    newPaidUntil.setMonth(newPaidUntil.getMonth() + monthsCovered)

    // Check if payment already exists (prevent duplicates)
    const existingPayment = await prisma.payment.findFirst({
      where: { mpesaReceipt }
    })

    if (!existingPayment) {
      // Create payment record and update tenant in transaction
      await prisma.$transaction([
        prisma.payment.create({
          data: {
            tenantId: tenant.id,
            amount: paymentAmount,
            status: 'COMPLETED',
            paymentDate: new Date(),
            allocatedFrom: tenant.rentPaidUntil || new Date(),
            allocatedTo: newPaidUntil,
            monthsCovered: monthsCovered,
            remainingCredit: newCreditBalance,
            mpesaReceipt: mpesaReceipt,
            transactionId: checkoutRequestId,
            paidAt: new Date()
          }
        }),
        prisma.tenant.update({
          where: { id: tenant.id },
          data: {
            rentCreditBalance: newCreditBalance,
            rentPaidUntil: newPaidUntil
          }
        })
      ])

      console.log(`💰 Payment recorded: ${tenant.fullName} (${tenant.unit.unitNumber}) paid KSh ${paymentAmount}, covered until ${newPaidUntil.toDateString()}`)
    } else {
      console.log(`🔄 Duplicate payment ignored: ${mpesaReceipt}`)
    }

    return NextResponse.json({ success: true, message: 'Payment processed successfully' })
  } catch (error) {
    console.error('❌ M-Pesa callback error:', error)
    // Always return 200 to prevent M-Pesa from retrying
    return NextResponse.json({ success: true, message: 'Webhook received' })
  }
}