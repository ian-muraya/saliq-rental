// app/api/auth/me/route.ts

import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import { prisma } from '@/lib/prisma'

const JWT_SECRET = process.env.JWT_SECRET || 'CRISSY_14@_2027'
const secret = new TextEncoder().encode(JWT_SECRET)

export async function GET() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('token')?.value

    console.log('Auth me - Token exists:', !!token)

    if (!token) {
      return NextResponse.json({ error: 'No token' }, { status: 401 })
    }

    let decoded
    try {
      const { payload } = await jwtVerify(token, secret)
      decoded = payload
      console.log('Auth me - Decoded role:', decoded.role)
    } catch (err) {
      console.error('Auth me - Token verification failed:', err)
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId as string },
      select: {
        id: true,
        email: true,
        companyName: true,
        role: true,
        isRestricted: true
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (user.role === 'LANDLORD' && user.isRestricted === true) {
      return NextResponse.json({ error: 'Account restricted' }, { status: 403 })
    }

    return NextResponse.json({
      id: user.id,
      email: user.email,
      companyName: user.companyName,
      role: user.role
    })
  } catch (error) {
    console.error('Auth me error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}