// app/admin/landlords/page.tsx
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import jwt from 'jsonwebtoken'
import { prisma } from '@/lib/prisma'
import LandlordsClient from './LandlordsClient'

async function getLandlordsData() {
  try {
    const landlords = await prisma.user.findMany({
      where: { role: 'LANDLORD' },
      include: {
        landlordProfile: true,
        properties: {
          include: {
            units: {
              include: {
                tenants: {
                  where: { isActive: true }
                }
              }
            }
          }
        },
        subscriptionInvoices: true
      },
      orderBy: { createdAt: 'desc' }
    })

    const serializedLandlords = landlords.map(landlord => ({
      id: landlord.id,
      email: landlord.email,
      phone: landlord.phone,
      companyName: landlord.companyName,
      registeredProperties: landlord.registeredProperties,
      isRestricted: landlord.isRestricted,
      createdAt: landlord.createdAt.toISOString(),
      landlordProfile: {
        businessRegNo: landlord.landlordProfile?.businessRegNo,
        physicalAddress: landlord.landlordProfile?.physicalAddress,
        subscriptionStatus: landlord.landlordProfile?.subscriptionStatus,
        propertyCount: landlord.landlordProfile?.propertyCount
      },
      properties: landlord.properties.map(property => ({
        id: property.id,
        name: property.name,
        location: property.location,
        totalUnits: property.totalUnits,
        occupiedUnits: property.units.filter(u => u.isOccupied).length,
        paybillNumber: property.paybillNumber
      })),
      invoices: landlord.subscriptionInvoices.map(inv => ({
        id: inv.id,
        amount: Number(inv.amount),
        status: inv.status,
        dueDate: inv.dueDate.toISOString()
      }))
    }))

    return { landlords: serializedLandlords }
  } catch (error) {
    console.error('Error fetching landlords:', error)
    return { landlords: [] }
  }
}

export default async function AdminLandlordsPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('token')?.value

  if (!token) redirect('/admin-login')
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { role: string }
    if (decoded.role !== 'ADMIN') redirect('/dashboard')
    const data = await getLandlordsData()
    return <LandlordsClient initialData={data} />
  } catch (error) {
    redirect('/admin-login')
  }
}