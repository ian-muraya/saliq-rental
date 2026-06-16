// app/api/admin/landlords/route.ts
// Admin API to fetch all landlords with complete data

import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string; role: string }
    
    if (decoded.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

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

    const serializedLandlords = landlords.map(landlord => {
      const properties = landlord.properties.map(property => ({
        id: property.id,
        name: property.name,
        location: property.location,
        totalUnits: property.totalUnits,
        occupiedUnits: property.units.filter(u => u.isOccupied).length,
        paybillNumber: property.paybillNumber,
        tillNumber: property.tillNumber,
        status: property.status,
        units: property.units.map(unit => ({
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
            rentCreditBalance: Number(tenant.rentCreditBalance)
          }))
        }))
      }))

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

    return NextResponse.json(serializedLandlords)
  } catch (error) {
    console.error('Error fetching landlords:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}