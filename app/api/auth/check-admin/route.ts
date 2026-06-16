// app/api/auth/check-admin/route.ts
// Check if current user is admin and has permissions

import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this'

export async function GET() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('token')?.value

    if (!token) {
      return NextResponse.json({ isAdmin: false }, { status: 200 })
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { 
      userId: string; 
      role: string;
      permissions: any 
    }

    return NextResponse.json({
      isAdmin: decoded.role === 'ADMIN',
      canManageAdmins: decoded.permissions?.canManageAdmins || false,
      permissions: decoded.permissions
    })
  } catch (error) {
    return NextResponse.json({ isAdmin: false }, { status: 200 })
  }
}