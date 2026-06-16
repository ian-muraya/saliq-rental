// app/api/auth/admin-login/route.ts
// Admin login API

import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { prisma } from '@/lib/prisma'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    console.log('Admin login attempt for:', email)

    // Find admin user
    const admin = await prisma.user.findFirst({
      where: {
        email,
        role: 'ADMIN'
      }
    })

    if (!admin) {
      console.log('Admin not found:', email)
      return NextResponse.json(
        { error: 'Invalid admin credentials' },
        { status: 401 }
      )
    }

    console.log('Admin found:', admin.email, 'Role:', admin.role)

    // Check if account is restricted
    if (admin.isRestricted) {
      console.log('Admin account is restricted:', email)
      return NextResponse.json(
        { error: 'Account is restricted. Contact super admin.' },
        { status: 403 }
      )
    }

    // Verify password
    const isValid = await bcrypt.compare(password, admin.password)
    console.log('Password valid:', isValid)

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid admin credentials' },
        { status: 401 }
      )
    }

    // Generate JWT with role
    const token = jwt.sign(
      { 
        userId: admin.id, 
        email: admin.email, 
        role: admin.role
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    )

    console.log('Token generated for admin:', admin.email)

    // Create response with cookie
    const response = NextResponse.json({
      success: true,
      message: 'Admin login successful',
      admin: {
        id: admin.id,
        email: admin.email,
        companyName: admin.companyName,
        role: admin.role
      }
    })

    response.cookies.set({
      name: 'token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    })

    console.log('Cookie set, returning response')
    return response
  } catch (error) {
    console.error('Admin login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}