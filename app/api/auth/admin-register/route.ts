// app/api/auth/admin-register/route.ts
// Create new admin accounts - Requires existing admin with manage_admins permission

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this'

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify the requesting user is an admin with manage_admins permission
    const decoded = jwt.verify(token, JWT_SECRET) as { 
      userId: string; 
      role: string;
      permissions: any 
    }

    if (decoded.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden. Admin access required.' }, { status: 403 })
    }

    // Check if the admin has permission to manage other admins
    if (!decoded.permissions?.canManageAdmins) {
      return NextResponse.json({ error: 'You do not have permission to create admin accounts.' }, { status: 403 })
    }

    const body = await request.json()
    const { email, phone, password, companyName, adminPermissions } = body

    // Validate required fields
    if (!email || !phone || !password) {
      return NextResponse.json({ error: 'Email, phone, and password are required' }, { status: 400 })
    }

    // Check if email already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { phone }
        ]
      }
    })

    if (existingUser) {
      return NextResponse.json({ error: 'User with this email or phone already exists' }, { status: 400 })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const newAdmin = await prisma.user.create({
      data: {
        email,
        phone,
        password: hashedPassword,
        role: 'ADMIN',
        companyName: companyName || null,
        registeredProperties: 0,
        isActive: true,
        isRestricted: false,
        adminPermissions: adminPermissions || {
          canManageAdmins: false,
          canManageLandlords: true,
          canViewAllData: true,
          canManageSystem: false
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: `Admin account created for ${email}`,
      admin: {
        id: newAdmin.id,
        email: newAdmin.email,
        companyName: newAdmin.companyName
      }
    })
  } catch (error) {
    console.error('Admin registration error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}