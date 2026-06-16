// app/admin/support/AdminSupportClient.tsx
// Admin Support Dashboard Client Component

'use client'

import { useState } from 'react'
import { 
  Ticket, 
  Search, 
  Eye, 
  X,
  CheckCircle,
  Clock,
  AlertCircle,
  ChevronRight,
  Send,
  MessageCircle,
  User,
  Mail,
  Phone,
  Building2,
  Filter,
  Settings
} from 'lucide-react'

interface Reply {
  id: string
  message: string
  isFromAdmin: boolean
  createdAt: string
}

interface Ticket {
  id: string
  subject: string
  message: string
  category: string
  priority: string
  status: string
  adminNote: string | null
  createdAt: string
  updatedAt: string
  resolvedAt: string | null
  landlord: {
    id: string
    email: string
    companyName: string | null
    phone: string
  }
  replies: Reply[]
}

interface CompanySettings {
  id: string
  companyName: string
  email: string
  phone: string
  phoneAlt: string | null
  physicalAddress: string | null
  supportHours: string | null
}

interface AdminSupportClientProps {
  initialData: {
    tickets: Ticket[]
    companySettings: CompanySettings | null
  }
}

export default function AdminSupportClient({ initialData }: AdminSupportClientProps) {
  const [tickets, setTickets] = useState(initialData.tickets)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false)
  const [replyMessage, setReplyMessage] = useState('')
  const [sendingReply, setSendingReply] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [adminNote, setAdminNote] = useState('')

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'OPEN':
        return { bg: 'bg-yellow-500/10', text: 'text-yellow-600', icon: Clock, label: 'Open' }
      case 'IN_PROGRESS':
        return { bg: 'bg-blue-500/10', text: 'text-blue-600', icon: AlertCircle, label: 'In Progress' }
      case 'RESOLVED':
        return { bg: 'bg-green-500/10', text: 'text-green-600', icon: CheckCircle, label: 'Resolved' }
      case 'CLOSED':
        return { bg: 'bg-gray-500/10', text: 'text-gray-600', icon: CheckCircle, label: 'Closed' }
      default:
        return { bg: 'bg-gray-500/10', text: 'text-gray-600', icon: Clock, label: status }
    }
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return 'bg-red-500/10 text-red-600'
      case 'HIGH':
        return 'bg-orange-500/10 text-orange-600'
      case 'MEDIUM':
        return 'bg-yellow-500/10 text-yellow-600'
      default:
        return 'bg-gray-500/10 text-gray-600'
    }
  }

  const handleSendReply = async () => {
    if (!selectedTicket || !replyMessage.trim()) return
    setSendingReply(true)
    try {
      const res = await fetch(`/api/admin/support/tickets/${selectedTicket.id}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: replyMessage })
      })
      if (res.ok) {
        const newReply = await res.json()
        setSelectedTicket({
          ...selectedTicket,
          replies: [...selectedTicket.replies, newReply],
          updatedAt: new Date().toISOString()
        })
        setReplyMessage('')
        // Refresh tickets list
        const ticketsRes = await fetch('/api/admin/support/tickets')
        if (ticketsRes.ok) {
          const updatedTickets = await ticketsRes.json()
          setTickets(updatedTickets)
        }
      } else {
        alert('Failed to send reply')
      }
    } catch (error) {
      alert('Failed to send reply')
    } finally {
      setSendingReply(false)
    }
  }

  const handleUpdateTicket = async (status?: string, priority?: string) => {
    if (!selectedTicket) return
    setUpdatingStatus(true)
    try {
      const res = await fetch(`/api/admin/support/tickets/${selectedTicket.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: status || selectedTicket.status,
          priority: priority || selectedTicket.priority,
          adminNote: adminNote || selectedTicket.adminNote
        })
      })
      if (res.ok) {
        const updated = await res.json()
        setSelectedTicket({
          ...selectedTicket,
          status: updated.status,
          priority: updated.priority,
          adminNote: updated.adminNote
        })
        // Refresh tickets list
        const ticketsRes = await fetch('/api/admin/support/tickets')
        if (ticketsRes.ok) {
          const updatedTickets = await ticketsRes.json()
          setTickets(updatedTickets)
        }
      } else {
        alert('Failed to update ticket')
      }
    } catch (error) {
      alert('Failed to update ticket')
    } finally {
      setUpdatingStatus(false)
    }
  }

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.landlord.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.landlord.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter
    const matchesPriority = priorityFilter === 'all' || ticket.priority === priorityFilter
    return matchesSearch && matchesStatus && matchesPriority
  })

  const stats = {
    total: tickets.length,
    open: tickets.filter(t => t.status === 'OPEN').length,
    inProgress: tickets.filter(t => t.status === 'IN_PROGRESS').length,
    resolved: tickets.filter(t => t.status === 'RESOLVED').length,
    urgent: tickets.filter(t => t.priority === 'URGENT').length
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream-200 via-cream-100 to-cream-200">
      <div className="glass-orb w-[600px] h-[600px] -top-48 -right-48 animate-float" />
      <div className="glass-orb w-[500px] h-[500px] bottom-32 -left-48 animate-float" style={{ animationDelay: '2s' }} />
      
      <main className="p-6 md:p-10 transition-all duration-300 relative z-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-10 animate-fade-in">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Ticket className="text-gold-500" size={28} />
              <h1 className="heading-premium">Support Tickets</h1>
            </div>
            <p className="text-navy-500 mt-2">Manage customer support requests</p>
            <div className="h-px w-24 bg-gradient-to-r from-gold-400 to-transparent mt-4" />
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8 animate-slide-up">
          <div className="glass-card p-3 text-center">
            <Ticket size={18} className="mx-auto mb-1 text-navy-600" />
            <p className="text-navy-500 text-xs">Total</p>
            <p className="font-serif text-xl font-bold text-navy-700">{stats.total}</p>
          </div>
          <div className="glass-card p-3 text-center">
            <Clock size={18} className="mx-auto mb-1 text-yellow-500" />
            <p className="text-navy-500 text-xs">Open</p>
            <p className="font-serif text-xl font-bold text-yellow-600">{stats.open}</p>
          </div>
          <div className="glass-card p-3 text-center">
            <AlertCircle size={18} className="mx-auto mb-1 text-blue-500" />
            <p className="text-navy-500 text-xs">In Progress</p>
            <p className="font-serif text-xl font-bold text-blue-600">{stats.inProgress}</p>
          </div>
          <div className="glass-card p-3 text-center">
            <CheckCircle size={18} className="mx-auto mb-1 text-green-500" />
            <p className="text-navy-500 text-xs">Resolved</p>
            <p className="font-serif text-xl font-bold text-green-600">{stats.resolved}</p>
          </div>
          <div className="glass-card p-3 text-center">
            <AlertCircle size={18} className="mx-auto mb-1 text-red-500" />
            <p className="text-navy-500 text-xs">Urgent</p>
            <p className="font-serif text-xl font-bold text-red-600">{stats.urgent}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6 animate-slide-up">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gold-500" size={20} />
            <input
              type="text"
              placeholder="Search by subject, message, or landlord..."
              className="input-field pl-12"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select className="input-field w-full sm:w-40" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">All Status</option>
            <option value="OPEN">Open</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
          </select>
          <select className="input-field w-full sm:w-40" value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
            <option value="all">All Priority</option>
            <option value="URGENT">Urgent</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>

        {/* Tickets Table */}
        {filteredTickets.length === 0 ? (
          <div className="glass-card p-16 text-center animate-slide-up">
            <Ticket size={64} className="mx-auto text-gold-400 mb-6" />
            <h3 className="font-serif text-2xl text-navy-700 mb-3">No Tickets Found</h3>
            <p className="text-navy-500">No support tickets match your filters</p>
          </div>
        ) : (
          <div className="glass-card overflow-hidden animate-slide-up">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gold-200/30 bg-gold-400/5">
                    <th className="text-left py-4 px-6">Subject</th>
                    <th className="text-left py-4 px-6">Landlord</th>
                    <th className="text-left py-4 px-6">Category</th>
                    <th className="text-left py-4 px-6">Priority</th>
                    <th className="text-left py-4 px-6">Status</th>
                    <th className="text-left py-4 px-6">Created</th>
                    <th className="text-left py-4 px-6"></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTickets.map((ticket) => {
                    const status = getStatusBadge(ticket.status)
                    const StatusIcon = status.icon
                    return (
                      <tr key={ticket.id} className="border-b border-gold-200/20 hover:bg-gold-400/5 transition-colors cursor-pointer" onClick={() => { setSelectedTicket(ticket); setIsTicketModalOpen(true); }}>
                        <td className="py-4 px-6 font-semibold text-navy-700">{ticket.subject}</td>
                        <td className="py-4 px-6">
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-navy-700">{ticket.landlord.companyName || 'Individual'}</span>
                            <span className="text-xs text-navy-500">{ticket.landlord.email}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-navy-600">{ticket.category.replace('_', ' ')}</td>
                        <td className="py-4 px-6">
                          <span className={`text-xs px-2 py-1 rounded-full ${getPriorityBadge(ticket.priority)}`}>
                            {ticket.priority}
                          </span>
                         </td>
                        <td className="py-4 px-6">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${status.bg} ${status.text}`}>
                            <StatusIcon size={12} /> {status.label}
                          </span>
                         </td>
                        <td className="py-4 px-6 text-navy-500 text-sm">{formatDate(ticket.createdAt)}</td>
                        <td className="py-4 px-6"><ChevronRight size={18} className="text-gold-500" /></td>
                       </tr>
                    )
                  })}
                </tbody>
               </table>
            </div>
          </div>
        )}
      </main>

      {/* Ticket Detail Modal */}
      {isTicketModalOpen && selectedTicket && (
        <div className="fixed inset-0 bg-navy-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto" onClick={() => setIsTicketModalOpen(false)}>
          <div className="glass-card max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-serif text-2xl text-navy-700">{selectedTicket.subject}</h2>
              <button onClick={() => setIsTicketModalOpen(false)} className="p-1 hover:bg-gold-400/10 rounded-lg"><X size={20} /></button>
            </div>

            {/* Landlord Info */}
            <div className="bg-gold-400/5 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-2 mb-2">
                <User size={16} className="text-gold-500" />
                <span className="font-semibold text-navy-700">Landlord Information</span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-navy-500">Company:</span> <span className="text-navy-700">{selectedTicket.landlord.companyName || 'Individual'}</span></div>
                <div><span className="text-navy-500">Email:</span> <span className="text-navy-700">{selectedTicket.landlord.email}</span></div>
                <div><span className="text-navy-500">Phone:</span> <span className="text-navy-700">{selectedTicket.landlord.phone}</span></div>
                <div><span className="text-navy-500">Ticket ID:</span> <span className="font-mono text-gold-600">{selectedTicket.id.slice(0, 8)}</span></div>
              </div>
            </div>

            {/* Ticket Details */}
            <div className="flex flex-wrap gap-3 mb-4">
              <span className={`text-xs px-2 py-1 rounded-full ${getPriorityBadge(selectedTicket.priority)}`}>
                Priority: {selectedTicket.priority}
              </span>
              <span className="text-xs px-2 py-1 rounded-full bg-gold-400/10 text-gold-600">
                Category: {selectedTicket.category.replace('_', ' ')}
              </span>
              <span className="text-xs text-navy-400">Created: {formatDate(selectedTicket.createdAt)}</span>
            </div>

            {/* Status Update */}
            <div className="flex gap-3 mb-4">
              <select
                className="input-field py-2 text-sm w-40"
                value={selectedTicket.status}
                onChange={(e) => handleUpdateTicket(e.target.value)}
                disabled={updatingStatus}
              >
                <option value="OPEN">Open</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="RESOLVED">Resolved</option>
                <option value="CLOSED">Closed</option>
              </select>
              <select
                className="input-field py-2 text-sm w-40"
                value={selectedTicket.priority}
                onChange={(e) => handleUpdateTicket(undefined, e.target.value)}
                disabled={updatingStatus}
              >
                <option value="LOW">Low Priority</option>
                <option value="MEDIUM">Medium Priority</option>
                <option value="HIGH">High Priority</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>

            {/* Original Message */}
            <div className="bg-gold-400/5 rounded-lg p-4 mb-4">
              <p className="text-navy-700 whitespace-pre-wrap">{selectedTicket.message}</p>
            </div>

            {/* Admin Note */}
            <div className="mb-4">
              <label className="label">Internal Admin Note</label>
              <textarea
                rows={2}
                className="input-field"
                placeholder="Add internal notes (not visible to landlord)"
                value={adminNote !== undefined ? adminNote : (selectedTicket.adminNote || '')}
                onChange={(e) => setAdminNote(e.target.value)}
                onBlur={() => {
                  if (adminNote !== selectedTicket.adminNote) {
                    handleUpdateTicket()
                  }
                }}
              />
            </div>

            {/* Replies */}
            {selectedTicket.replies.length > 0 && (
              <div className="space-y-3 mb-4">
                <h3 className="font-semibold text-navy-700">Conversation History</h3>
                {selectedTicket.replies.map((reply) => (
                  <div key={reply.id} className={`p-3 rounded-lg ${reply.isFromAdmin ? 'bg-blue-500/5 border border-blue-500/30' : 'bg-gold-400/5'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-xs font-semibold ${reply.isFromAdmin ? 'text-blue-600' : 'text-gold-600'}`}>
                        {reply.isFromAdmin ? 'Support Team (You)' : selectedTicket.landlord.companyName || 'Landlord'}
                      </span>
                      <span className="text-xs text-navy-400">{formatDate(reply.createdAt)}</span>
                    </div>
                    <p className="text-navy-700 text-sm whitespace-pre-wrap">{reply.message}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Reply Form */}
            <div className="mt-4">
              <label className="label">Reply to Landlord</label>
              <textarea
                rows={3}
                className="input-field"
                placeholder="Type your reply here..."
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
              />
              <button onClick={handleSendReply} disabled={sendingReply} className="btn-primary mt-3 flex items-center gap-2">
                <Send size={16} /> {sendingReply ? 'Sending...' : 'Send Reply'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}