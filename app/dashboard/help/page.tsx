// app/dashboard/help/page.tsx
// Help Center - Support tickets and knowledge base

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import jwt from 'jsonwebtoken'
import { prisma } from '@/lib/prisma'
import HelpCenterClient from './HelpCenterClient'

async function getHelpData(userId: string) {
  try {
    const tickets = await prisma.supportTicket.findMany({
      where: { landlordId: userId },
      include: {
        replies: {
          orderBy: { createdAt: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    const knowledgeBase = await prisma.knowledgeBase.findMany({
      where: { isPublished: true },
      orderBy: { viewCount: 'desc' }
    })

    const serializedTickets = tickets.map(t => ({
      id: t.id,
      subject: t.subject,
      message: t.message,
      category: t.category,
      priority: t.priority,
      status: t.status,
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
      resolvedAt: t.resolvedAt?.toISOString() || null,
      replies: t.replies.map(r => ({
        id: r.id,
        message: r.message,
        isFromAdmin: r.isFromAdmin,
        createdAt: r.createdAt.toISOString()
      }))
    }))

    const serializedKB = knowledgeBase.map(k => ({
      id: k.id,
      title: k.title,
      content: k.content,
      category: k.category,
      tags: k.tags?.split(',') || [],
      viewCount: k.viewCount,
      helpfulCount: k.helpfulCount,
      notHelpfulCount: k.notHelpfulCount
    }))

    return { tickets: serializedTickets, knowledgeBase: serializedKB }
  } catch (error) {
    console.error('Error fetching help data:', error)
    return { tickets: [], knowledgeBase: [] }
  }
}

export default async function HelpCenterPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('token')?.value

  if (!token) {
    redirect('/login')
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string; role: string }
    const data = await getHelpData(decoded.userId)
    return <HelpCenterClient initialData={data} userRole={decoded.role} />
  } catch (error) {
    console.error('JWT verification failed:', error)
    redirect('/login')
  }
}