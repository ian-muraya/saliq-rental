// Add this import at the top
import { createReceipt } from '@/lib/receipt'

// After the payment is created, inside the if (!existingPayment) block, add:
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

  // Get the payment ID of the created payment
  const createdPayment = await prisma.payment.findFirst({
    where: { mpesaReceipt }
  })

  if (createdPayment) {
    try {
      // Create receipt for the payment
      const receipt = await createReceipt(createdPayment.id)
      console.log(`📄 Receipt created: ${receipt.receiptNumber}`)
    } catch (receiptError) {
      console.error('Failed to create receipt:', receiptError)
    }
  }

  console.log(`💰 Payment recorded: ${tenant.fullName} (${tenant.unit.unitNumber}) paid KSh ${paymentAmount}, covered until ${newPaidUntil.toDateString()}`)
}