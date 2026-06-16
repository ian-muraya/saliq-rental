// app/api/landlord/profile/route.ts
// API for landlord profile management - Email cannot be changed by landlord

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import { prisma } from '@/lib/prisma'

// GET - Fetch landlord profile
export async function GET() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        landlordProfile: true,
        properties: {
          select: {
            id: true,
            name: true,
            paybillNumber: true,
            tillNumber: true
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const profile = {
      id: user.id,
      email: user.email,
      phone: user.phone,
      companyName: user.companyName,
      registeredProperties: user.registeredProperties,
      paybillNumber: user.paybillNumber,
      tillNumber: user.tillNumber,
      landlordProfile: {
        businessRegNo: user.landlordProfile?.businessRegNo,
        physicalAddress: user.landlordProfile?.physicalAddress,
        subscriptionStatus: user.landlordProfile?.subscriptionStatus,
        subscriptionExpiresAt: user.landlordProfile?.subscriptionExpiresAt?.toISOString() || null,
        propertyCount: user.landlordProfile?.propertyCount
      },
      properties: user.properties
    }

    return NextResponse.json(profile)
  } catch (error) {
    console.error('Error fetching profile:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT - Update landlord profile (email cannot be changed)
export async function PUT(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string }
    const body = await request.json()
    
    const {
      companyName,
      phone,
      businessRegNo,
      physicalAddress,
      paybillNumber,
      tillNumber
    } = body

    // Email is NOT allowed to be changed by landlord - removed from schema

    // Check if phone is already taken by another user
    if (phone) {
      const existingUser = await prisma.user.findFirst({
        where: {
          phone,
          id: { not: decoded.userId }
        }
      })
      if (existingUser) {
        return NextResponse.json({ error: 'Phone number already in use' }, { status: 400 })
      }
    }

    // Update user and profile in transaction
    const [updatedUser, updatedProfile] = await prisma.$transaction([
      prisma.user.update({
        where: { id: decoded.userId },
        data: {
          companyName: companyName !== undefined ? companyName : undefined,
          phone: phone !== undefined ? phone : undefined,
          paybillNumber: paybillNumber !== undefined ? paybillNumber : undefined,
          tillNumber: tillNumber !== undefined ? tillNumber : undefined
        }
      }),
      prisma.landlordProfile.upsert({
        where: { userId: decoded.userId },
        update: {
          businessRegNo: businessRegNo !== undefined ? businessRegNo : undefined,
          physicalAddress: physicalAddress !== undefined ? physicalAddress : undefined
        },
        create: {
          userId: decoded.userId,
          businessRegNo: businessRegNo || null,
          physicalAddress: physicalAddress || null,
          propertyCount: 0,
          subscriptionStatus: 'ACTIVE'
        }
      })
    ])

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        phone: updatedUser.phone,
        companyName: updatedUser.companyName,
        paybillNumber: updatedUser.paybillNumber,
        tillNumber: updatedUser.tillNumber,
        landlordProfile: {
          businessRegNo: updatedProfile.businessRegNo,
          physicalAddress: updatedProfile.physicalAddress
        }
      }
    })
  } catch (error) {
    console.error('Error updating profile:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}