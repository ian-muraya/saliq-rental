// app/login/page.tsx (Server Component)
import { Metadata } from 'next'
import { Suspense } from 'react'
import LoginForm from './LoginForm'

export const metadata: Metadata = {
  title: 'Login | Saliq Rental Management',
  description: 'Access your premium dashboard',
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-cream-200 flex items-center justify-center">Loading...</div>}>
      <LoginForm />
    </Suspense>
  )
}