// app/dashboard/payments/page.tsx
// Server component - fetches payments and property analytics

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import jwt from 'jsonwebtoken'
import { prisma } from '@/lib/prisma'
import PaymentsClient from './PaymentsClient'

async function getPaymentsData(userId: string) {
  try {
    // Get all properties with their units and tenants
    const properties = await prisma.property.findMany({
      where: { landlordId: userId },
      include: {
        units: {
          include: {
            tenants: {
              where: { isActive: true },
              include: {
                payments: {
                  where: { status: 'COMPLETED' },
                  orderBy: { paymentDate: 'desc' },
                  take: 1
                }
              }
            }
          }
        }
      }
    })

    // Calculate property analytics
    const propertyAnalytics = properties.map(property => {
      const totalUnits = property.units.length
      const occupiedUnits = property.units.filter(u => u.tenants.length > 0).length
      const occupancyRate = totalUnits > 0 ? (occupiedUnits / totalUnits) * 100 : 0
      
      let expectedMonthlyRent = 0
      let collectedThisMonth = 0
      let overdueCount = 0
      let prepaidCount = 0
      
      const currentDate = new Date()
      const currentMonth = currentDate.getMonth()
      const currentYear = currentDate.getFullYear()
      
      property.units.forEach(unit => {
        if (unit.tenants.length > 0) {
          const tenant = unit.tenants[0]
          expectedMonthlyRent += Number(unit.rentAmount)
          
          // Check if tenant has paid for current month
          const lastPayment = tenant.payments[0]
          if (lastPayment) {
            const paidUntil = lastPayment.allocatedTo
            if (paidUntil && new Date(paidUntil) >= currentDate) {
              prepaidCount++
              collectedThisMonth += Number(unit.rentAmount)
            } else if (lastPayment.paymentDate.getMonth() === currentMonth && 
                       lastPayment.paymentDate.getFullYear() === currentYear) {
              collectedThisMonth += Number(unit.rentAmount)
            } else {
              overdueCount++
            }
          } else {
            overdueCount++
          }
        }
      })
      
      return {
        id: property.id,
        name: property.name,
        totalUnits,
        occupiedUnits,
        occupancyRate: Math.round(occupancyRate),
        expectedMonthlyRent,
        collectedThisMonth,
        collectionRate: expectedMonthlyRent > 0 ? Math.round((collectedThisMonth / expectedMonthlyRent) * 100) : 0,
        overdueCount,
        prepaidCount,
        paybillNumber: property.paybillNumber,
        tillNumber: property.tillNumber
      }
    })

    // Get all tenants with their credit information
    const tenants = await prisma.tenant.findMany({
      where: {
        unit: {
          property: {
            landlordId: userId
          }
        },
        isActive: true
      },
      include: {
        unit: {
          include: {
            property: {
              select: {
                id: true,
                name: true,
                paybillNumber: true,
                tillNumber: true
              }
            }
          }
        }
      },
      orderBy: { fullName: 'asc' }
    })

    // Get all payments
    const payments = await prisma.payment.findMany({
      where: {
        tenant: {
          unit: {
            property: {
              landlordId: userId
            }
          }
        }
      },
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
      },
      orderBy: { paymentDate: 'desc' },
      take: 100
    })

    // Serialize tenants
    const serializedTenants = tenants.map(t => ({
      id: t.id,
      fullName: t.fullName,
      phone: t.phone,
      email: t.email,
      rentAmount: Number(t.unit.rentAmount),
      propertyId: t.unit.property.id,
      propertyName: t.unit.property.name,
      propertyPaybill: t.unit.property.paybillNumber,
      propertyTill: t.unit.property.tillNumber,
      unitNumber: t.unit.unitNumber,
      rentCreditBalance: Number(t.rentCreditBalance),
      rentPaidUntil: t.rentPaidUntil?.toISOString() || null,
      isActive: t.isActive,
      leaseStartDate: t.leaseStartDate?.toISOString() || null,
      leaseEndDate: t.leaseEndDate?.toISOString() || null
    }))

    // Serialize payments
    const serializedPayments = payments.map(p => ({
      id: p.id,
      amount: Number(p.amount),
      status: p.status,
      paymentMethod: p.paymentMethod,
      mpesaReceipt: p.mpesaReceipt,
      paymentDate: p.paymentDate.toISOString(),
      allocatedFrom: p.allocatedFrom?.toISOString() || null,
      allocatedTo: p.allocatedTo?.toISOString() || null,
      monthsCovered: p.monthsCovered,
      remainingCredit: Number(p.remainingCredit),
      tenant: {
        fullName: p.tenant.fullName,
        phone: p.tenant.phone,
        unit: {
          unitNumber: p.tenant.unit.unitNumber,
          property: {
            name: p.tenant.unit.property.name
          }
        }
      }
    }))

    // Calculate overdue tenants
    const currentDate = new Date()
    const overdueTenants = serializedTenants.filter(t => {
      if (!t.rentPaidUntil) return true
      return new Date(t.rentPaidUntil) < currentDate
    })

    // Calculate prepaid tenants
    const prepaidTenants = serializedTenants.filter(t => {
      if (!t.rentPaidUntil) return false
      return new Date(t.rentPaidUntil) > currentDate
    })

    // Calculate monthly paying tenants (neither overdue nor prepaid)
    const monthlyPayingTenants = serializedTenants.filter(t => {
      if (!t.rentPaidUntil) return false
      const paidUntil = new Date(t.rentPaidUntil)
      const isPrepaid = paidUntil > currentDate
      const isOverdue = paidUntil < currentDate
      return !isPrepaid && !isOverdue
    })

    // Summary stats
    const summaryStats = {
      totalProperties: properties.length,
      totalUnits: properties.reduce((sum, p) => sum + p.units.length, 0),
      totalTenants: serializedTenants.length,
      totalExpectedRent: propertyAnalytics.reduce((sum, p) => sum + p.expectedMonthlyRent, 0),
      totalCollectedRent: propertyAnalytics.reduce((sum, p) => sum + p.collectedThisMonth, 0),
      totalOverdueTenants: overdueTenants.length,
      totalPrepaidTenants: prepaidTenants.length,
      totalMonthlyPaying: monthlyPayingTenants.length,
      overallCollectionRate: propertyAnalytics.reduce((sum, p) => sum + p.expectedMonthlyRent, 0) > 0 
        ? Math.round((propertyAnalytics.reduce((sum, p) => sum + p.collectedThisMonth, 0) / 
                      propertyAnalytics.reduce((sum, p) => sum + p.expectedMonthlyRent, 0)) * 100)
        : 0
    }

    return { 
      tenants: serializedTenants, 
      payments: serializedPayments,
      propertyAnalytics,
      summaryStats,
      overdueTenants,
      prepaidTenants,
      monthlyPayingTenants
    }
  } catch (error) {
    console.error('Error fetching payments:', error)
    return { 
      tenants: [], 
      payments: [], 
      propertyAnalytics: [],
      summaryStats: {},
      overdueTenants: [],
      prepaidTenants: [],
      monthlyPayingTenants: []
    }
  }
}

export default async function PaymentsPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('token')?.value
  
  if (!token) {
    redirect('/login')
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string }
    const data = await getPaymentsData(decoded.userId)
    
    return <PaymentsClient initialData={data} />
  } catch (error) {
    console.error('JWT verification failed:', error)
    redirect('/login')
  }
}