// app/api/admin/update-landlord/route.ts
// Admin API to update landlord information

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import { prisma } from '@/lib/prisma'

export async function PUT(request: NextRequest) {
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

    const body = await request.json()
    const { 
      landlordId, 
      companyName, 
      email, 
      phone, 
      businessRegNo, 
      physicalAddress, 
      registeredProperties,
      subscriptionStatus 
    } = body

    // Check if email is already taken by another user
    if (email) {
      const existingUser = await prisma.user.findFirst({
        where: {
          email,
          id: { not: landlordId }
        }
      })
      if (existingUser) {
        return NextResponse.json({ error: 'Email already in use' }, { status: 400 })
      }
    }

    // Update user and profile in transaction
    const [updatedUser, updatedProfile] = await prisma.$transaction([
      prisma.user.update({
        where: { id: landlordId },
        data: {
          companyName: companyName !== undefined ? companyName : undefined,
          email: email !== undefined ? email : undefined,
          phone: phone !== undefined ? phone : undefined,
          registeredProperties: registeredProperties !== undefined ? registeredProperties : undefined
        }
      }),
      prisma.landlordProfile.upsert({
        where: { userId: landlordId },
        update: {
          businessRegNo: businessRegNo !== undefined ? businessRegNo : undefined,
          physicalAddress: physicalAddress !== undefined ? physicalAddress : undefined,
          subscriptionStatus: subscriptionStatus !== undefined ? subscriptionStatus : undefined
        },
        create: {
          userId: landlordId,
          businessRegNo: businessRegNo || null,
          physicalAddress: physicalAddress || null,
          subscriptionStatus: subscriptionStatus || 'ACTIVE',
          propertyCount: 0
        }
      })
    ])

    return NextResponse.json({
      success: true,
      message: 'Landlord updated successfully',
      landlord: {
        id: updatedUser.id,
        email: updatedUser.email,
        phone: updatedUser.phone,
        companyName: updatedUser.companyName,
        registeredProperties: updatedUser.registeredProperties,
        landlordProfile: {
          businessRegNo: updatedProfile.businessRegNo,
          physicalAddress: updatedProfile.physicalAddress,
          subscriptionStatus: updatedProfile.subscriptionStatus
        }
      }
    })
  } catch (error) {
    console.error('Error updating landlord:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}