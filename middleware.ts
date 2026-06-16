// middleware.ts

import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

const JWT_SECRET = process.env.JWT_SECRET || 'CRISSY_14@_2027'
const secret = new TextEncoder().encode(JWT_SECRET)

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value
  const { pathname } = request.nextUrl

  console.log('Middleware - Path:', pathname)
  console.log('Middleware - Token exists:', !!token)

  // Try to verify token if it exists
  let decoded = null
  let isValid = false

  if (token) {
    try {
      const { payload } = await jwtVerify(token, secret)
      decoded = payload
      isValid = true
      console.log('Middleware - Token verified, role:', decoded.role)
    } catch (err) {
      console.log('Middleware - Token verification failed:', err.message)
    }
  }

  // ==================== ADMIN ROUTES ====================
  
  if (pathname === '/admin-login') {
    if (isValid && decoded.role === 'ADMIN') {
      return NextResponse.redirect(new URL('/admin', request.url))
    }
    return NextResponse.next()
  }

  if (pathname.startsWith('/admin') && pathname !== '/admin-login') {
    if (!isValid) {
      return NextResponse.redirect(new URL('/admin-login', request.url))
    }
    if (decoded.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    return NextResponse.next()
  }

  // ==================== LANDLORD ROUTES ====================

  const publicPaths = ['/login', '/register']
  const isPublicPath = publicPaths.includes(pathname)

  if (pathname === '/') {
    return NextResponse.next()
  }

  // Dashboard access
  if (pathname.startsWith('/dashboard')) {
    if (!isValid) {
      console.log('Dashboard - No valid token, redirecting to login')
      return NextResponse.redirect(new URL('/login', request.url))
    }

    if (decoded.role === 'ADMIN') {
      return NextResponse.redirect(new URL('/admin', request.url))
    }

    if (decoded.isRestricted === true) {
      const response = NextResponse.redirect(new URL('/login?error=restricted', request.url))
      response.cookies.delete('token')
      return response
    }

    if (decoded.role === 'LANDLORD') {
      console.log('Dashboard - Access granted to landlord')
      return NextResponse.next()
    }

    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Logged in users on public paths
  if (isValid && isPublicPath) {
    if (decoded.role === 'ADMIN') {
      return NextResponse.redirect(new URL('/admin', request.url))
    }
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // No token on protected route
  if (!isValid && !isPublicPath && pathname !== '/') {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/',
    '/dashboard/:path*',
    '/admin/:path*',
    '/admin-login',
    '/login',
    '/register',
  ],
}