// app/admin/page.tsx
// Admin dashboard - Server component with tab routing support

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import jwt from 'jsonwebtoken'
import { prisma } from '@/lib/prisma'
import AdminClient from './AdminClient'

async function getAdminData() {
  try {
    // Get all landlords with complete data
    const landlords = await prisma.user.findMany({
      where: { role: 'LANDLORD' },
      include: {
        landlordProfile: true,
        properties: {
          include: {
            floors: true,
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
              },
              orderBy: { unitNumber: 'asc' }
            }
          },
          orderBy: { createdAt: 'desc' }
        },
        subscriptionInvoices: {
          orderBy: { createdAt: 'desc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Get all payments for total collected
    const allPayments = await prisma.payment.findMany()
    const totalCollected = allPayments.reduce((sum, p) => sum + Number(p.amount), 0)

    // Get pending invoices count
    const pendingInvoices = await prisma.subscriptionInvoice.count({
      where: { status: 'PENDING' }
    })

    // Serialize all data
    const serializedLandlords = landlords.map(landlord => {
      const properties = landlord.properties.map(property => {
        const units = property.units.map(unit => ({
          id: unit.id,
          unitNumber: unit.unitNumber,
          unitType: unit.unitType,
          rentAmount: Number(unit.rentAmount),
          isOccupied: unit.isOccupied,
          status: unit.status,
          tenants: unit.tenants.map(tenant => ({
            id: tenant.id,
            fullName: tenant.fullName,
            phone: tenant.phone,
            email: tenant.email,
            isActive: tenant.isActive,
            leaseStartDate: tenant.leaseStartDate?.toISOString() || null,
            leaseEndDate: tenant.leaseEndDate?.toISOString() || null,
            rentPaidUntil: tenant.rentPaidUntil?.toISOString() || null,
            rentCreditBalance: Number(tenant.rentCreditBalance),
            lastPayment: tenant.payments[0] ? {
              amount: Number(tenant.payments[0].amount),
              paymentDate: tenant.payments[0].paymentDate.toISOString(),
              allocatedTo: tenant.payments[0].allocatedTo?.toISOString() || null
            } : null
          }))
        }))

        return {
          id: property.id,
          name: property.name,
          location: property.location,
          totalUnits: property.totalUnits,
          occupiedUnits: units.filter(u => u.isOccupied).length,
          paybillNumber: property.paybillNumber,
          tillNumber: property.tillNumber,
          status: property.status,
          units: units
        }
      })

      return {
        id: landlord.id,
        email: landlord.email,
        phone: landlord.phone,
        companyName: landlord.companyName,
        registeredProperties: landlord.registeredProperties,
        isActive: landlord.isActive,
        isRestricted: landlord.isRestricted,
        createdAt: landlord.createdAt.toISOString(),
        landlordProfile: {
          businessRegNo: landlord.landlordProfile?.businessRegNo,
          physicalAddress: landlord.landlordProfile?.physicalAddress,
          subscriptionStatus: landlord.landlordProfile?.subscriptionStatus,
          subscriptionExpiresAt: landlord.landlordProfile?.subscriptionExpiresAt?.toISOString() || null,
          propertyCount: landlord.landlordProfile?.propertyCount
        },
        properties: properties,
        invoices: landlord.subscriptionInvoices.map(inv => ({
          id: inv.id,
          propertyCount: inv.propertyCount,
          amount: Number(inv.amount),
          billingPeriod: inv.billingPeriod,
          dueDate: inv.dueDate.toISOString(),
          paidAt: inv.paidAt?.toISOString() || null,
          status: inv.status,
          mpesaReceipt: inv.mpesaReceipt
        }))
      }
    })

    // Calculate totals
    const totalProperties = serializedLandlords.reduce((sum, l) => sum + (l.properties?.length || 0), 0)
    const totalUnits = serializedLandlords.reduce((sum, l) => 
      sum + (l.properties?.reduce((ps, p) => ps + (p.totalUnits || 0), 0) || 0), 0)
    const totalTenants = serializedLandlords.reduce((sum, l) => 
      sum + (l.properties?.reduce((ps, p) => ps + (p.occupiedUnits || 0), 0) || 0), 0)

    return {
      landlords: serializedLandlords,
      totalLandlords: landlords.length,
      totalProperties: totalProperties,
      totalUnits: totalUnits,
      totalTenants: totalTenants,
      totalCollected: totalCollected,
      pendingInvoices: pendingInvoices,
      properties: serializedLandlords.flatMap(l => l.properties),
      invoices: serializedLandlords.flatMap(l => l.invoices)
    }
  } catch (error) {
    console.error('Error fetching admin data:', error)
    return {
      landlords: [],
      totalLandlords: 0,
      totalProperties: 0,
      totalUnits: 0,
      totalTenants: 0,
      totalCollected: 0,
      pendingInvoices: 0,
      properties: [],
      invoices: []
    }
  }
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const cookieStore = await cookies()
  const token = cookieStore.get('token')?.value

  if (!token) {
    redirect('/admin-login')
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string; role: string }
    
    if (decoded.role !== 'ADMIN') {
      redirect('/dashboard')
    }

    const data = await getAdminData()
    const resolvedSearchParams = await searchParams
    const activeTab = resolvedSearchParams.tab || 'landlords'
    
    return <AdminClient initialData={data} activeTab={activeTab} />
  } catch (error) {
    console.error('JWT verification failed:', error)
    redirect('/admin-login')
  }
}