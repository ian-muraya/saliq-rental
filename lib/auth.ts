// lib/auth.ts
// Centralized auth configuration

export const JWT_SECRET = process.env.JWT_SECRET || 'CRISSY_14@_2027'

export interface JWTPayload {
  userId: string
  email: string
  role: string
  isRestricted?: boolean
}