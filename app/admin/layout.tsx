// app/admin/layout.tsx
// Admin layout with AdminSidebar

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import jwt from 'jsonwebtoken'
import AdminSidebar from '@/components/ui/AdminSidebar'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies()
  const token = cookieStore.get('token')?.value

  if (!token) {
    redirect('/admin-login')
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { role: string }
    if (decoded.role !== 'ADMIN') {
      redirect('/dashboard')
    }
  } catch (error) {
    redirect('/admin-login')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream-200 via-cream-100 to-cream-200">
      <AdminSidebar />
      <main className="lg:ml-80">
        {children}
      </main>
    </div>
  )
}