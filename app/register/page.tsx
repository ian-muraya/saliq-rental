// app/register/page.tsx (Server Component - no 'use client')
import { Metadata } from 'next'
import RegisterForm from './RegisterForm'

export const metadata: Metadata = {
  title: 'Register | Saliq Rental Management',
  description: 'Create your premium landlord account',
}

export default function RegisterPage() {
  return <RegisterForm />
}