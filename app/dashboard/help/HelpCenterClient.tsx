// app/dashboard/help/HelpCenterClient.tsx
// Help Center with support tickets, knowledge base, and company contact info

'use client'

import { useState, useEffect } from 'react'
import { 
  HelpCircle, 
  Ticket, 
  BookOpen, 
  Plus, 
  Send, 
  X,
  CheckCircle,
  Clock,
  AlertCircle,
  ChevronRight,
  Search,
  ThumbsUp,
  ThumbsDown,
  MessageCircle,
  Phone,
  Mail,
  Building2,
  Clock as ClockIcon,
  Globe,
  Link as LinkIcon
} from 'lucide-react'
import Sidebar from '@/components/ui/Sidebar'

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
  createdAt: string
  updatedAt: string
  resolvedAt: string | null
  replies: Reply[]
}

interface KnowledgeBase {
  id: string
  title: string
  content: string
  category: string
  tags: string[]
  viewCount: number
  helpfulCount: number
  notHelpfulCount: number
}

interface CompanySettings {
  companyName: string
  email: string
  phone: string
  phoneAlt: string | null
  physicalAddress: string | null
  facebookUrl: string | null
  twitterUrl: string | null
  instagramUrl: string | null
  linkedinUrl: string | null
  youtubeUrl: string | null
  supportHours: string | null
}

interface HelpCenterClientProps {
  initialData: {
    tickets: Ticket[]
    knowledgeBase: KnowledgeBase[]
  }
  userRole: string
}

export default function HelpCenterClient({ initialData, userRole }: HelpCenterClientProps) {
  const [activeTab, setActiveTab] = useState<'tickets' | 'knowledge'>('tickets')
  const [isNewTicketModalOpen, setIsNewTicketModalOpen] = useState(false)
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [isTicketDetailOpen, setIsTicketDetailOpen] = useState(false)
  const [replyMessage, setReplyMessage] = useState('')
  const [sendingReply, setSendingReply] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [tickets, setTickets] = useState(initialData.tickets)
  const [knowledgeBase, setKnowledgeBase] = useState(initialData.knowledgeBase)
  const [newTicketForm, setNewTicketForm] = useState({
    subject: '',
    message: '',
    category: 'TECHNICAL',
    priority: 'MEDIUM'
  })
  const [submitting, setSubmitting] = useState(false)
  const [companySettings, setCompanySettings] = useState<CompanySettings | null>(null)

  // Fetch company settings
  useEffect(() => {
    const fetchCompanySettings = async () => {
      try {
        const res = await fetch('/api/public/company-settings')
        if (res.ok) {
          const data = await res.json()
          setCompanySettings(data)
        }
      } catch (error) {
        console.error('Failed to fetch company settings:', error)
      }
    }
    fetchCompanySettings()
  }, [])

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

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const res = await fetch('/api/landlord/support/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTicketForm)
      })
      if (res.ok) {
        const newTicket = await res.json()
        setTickets([newTicket, ...tickets])
        setIsNewTicketModalOpen(false)
        setNewTicketForm({ subject: '', message: '', category: 'TECHNICAL', priority: 'MEDIUM' })
        alert('Ticket created successfully!')
      } else {
        const error = await res.json()
        alert(error.error || 'Failed to create ticket')
      }
    } catch (error) {
      alert('Failed to create ticket')
    } finally {
      setSubmitting(false)
    }
  }

  const handleAddReply = async (ticketId: string) => {
    if (!replyMessage.trim()) return
    setSendingReply(true)
    try {
      const res = await fetch(`/api/landlord/support/tickets/${ticketId}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: replyMessage })
      })
      if (res.ok) {
        const newReply = await res.json()
        setSelectedTicket({
          ...selectedTicket!,
          replies: [...(selectedTicket?.replies || []), newReply],
          updatedAt: new Date().toISOString()
        })
        setReplyMessage('')
        const ticketsRes = await fetch('/api/landlord/support/tickets')
        if (ticketsRes.ok) {
          const updatedTickets = await ticketsRes.json()
          setTickets(updatedTickets)
        }
      } else {
        const error = await res.json()
        alert(error.error || 'Failed to send reply')
      }
    } catch (error) {
      alert('Failed to send reply')
    } finally {
      setSendingReply(false)
    }
  }

  const handleHelpful = async (articleId: string, isHelpful: boolean) => {
    try {
      await fetch('/api/landlord/support/knowledge/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ articleId, isHelpful })
      })
    } catch (error) {
      console.error('Failed to record feedback:', error)
    }
  }

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.message.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || ticket.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const filteredKnowledge = knowledgeBase.filter(article =>
    article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    article.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    article.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const categories = ['all', 'TECHNICAL', 'BILLING', 'FEATURE_REQUEST', 'PROPERTY_MANAGEMENT', 'PAYMENT_ISSUE', 'ACCOUNT_ISSUE']

  // Helper to get social media icon color and label
  const getSocialInfo = (url: string | null, platform: string) => {
    if (!url) return null
    return { url, platform }
  }

  const socialLinks = [
    { platform: 'Facebook', url: companySettings?.facebookUrl, color: 'bg-blue-600' },
    { platform: 'Twitter', url: companySettings?.twitterUrl, color: 'bg-sky-500' },
    { platform: 'Instagram', url: companySettings?.instagramUrl, color: 'bg-pink-600' },
    { platform: 'LinkedIn', url: companySettings?.linkedinUrl, color: 'bg-blue-700' },
    { platform: 'YouTube', url: companySettings?.youtubeUrl, color: 'bg-red-600' }
  ].filter(s => s.url)

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream-200 via-cream-100 to-cream-200 relative overflow-x-hidden">
      <div className="glass-orb w-[600px] h-[600px] -top-48 -right-48 animate-float" />
      <div className="glass-orb w-[500px] h-[500px] bottom-32 -left-48 animate-float" style={{ animationDelay: '2s' }} />
      
      <Sidebar />
      
      <main className="lg:ml-80 p-6 md:p-10 transition-all duration-300 relative z-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-10 animate-fade-in">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <HelpCircle className="text-gold-500" size={28} />
              <h1 className="heading-premium">Help Center</h1>
            </div>
            <p className="text-navy-500 mt-2">Get support, browse articles, or contact our team</p>
            <div className="h-px w-24 bg-gradient-to-r from-gold-400 to-transparent mt-4" />
          </div>
        </div>

        {/* Company Contact Card */}
        {companySettings && (
          <div className="glass-card p-5 mb-8 animate-slide-up">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h3 className="font-semibold text-navy-700 flex items-center gap-2">
                  <Building2 size={18} className="text-gold-500" /> {companySettings.companyName}
                </h3>
                <div className="flex flex-wrap gap-4 mt-2 text-sm">
                  <span className="flex items-center gap-1 text-navy-600">
                    <Mail size={14} className="text-gold-500" /> 
                    <a href={`mailto:${companySettings.email}`} className="hover:text-gold-600">{companySettings.email}</a>
                  </span>
                  <span className="flex items-center gap-1 text-navy-600">
                    <Phone size={14} className="text-gold-500" /> 
                    <a href={`tel:${companySettings.phone}`} className="hover:text-gold-600">{companySettings.phone}</a>
                  </span>
                  {companySettings.phoneAlt && (
                    <span className="flex items-center gap-1 text-navy-600">
                      <Phone size={14} className="text-gold-500" /> 
                      <a href={`tel:${companySettings.phoneAlt}`} className="hover:text-gold-600">{companySettings.phoneAlt}</a>
                    </span>
                  )}
                  {companySettings.supportHours && (
                    <span className="flex items-center gap-1 text-navy-600">
                      <ClockIcon size={14} className="text-gold-500" /> {companySettings.supportHours}
                    </span>
                  )}
                </div>
                {companySettings.physicalAddress && (
                  <p className="text-xs text-navy-400 mt-2">{companySettings.physicalAddress}</p>
                )}
              </div>
              {socialLinks.length > 0 && (
                <div className="flex gap-2">
                  {socialLinks.map((social) => (
                    <a
                      key={social.platform}
                      href={social.url!}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`p-2 rounded-lg ${social.color} bg-opacity-10 hover:bg-opacity-20 transition-all duration-300`}
                      title={social.platform}
                    >
                      <Globe size={18} className="text-gold-500" />
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-8 border-b border-gold-200/30">
          <button onClick={() => setActiveTab('tickets')} className={`px-6 py-3 rounded-t-lg transition-all duration-300 flex items-center gap-2 ${activeTab === 'tickets' ? 'bg-gold-400/10 text-gold-600 border-b-2 border-gold-500' : 'text-navy-500 hover:text-gold-500'}`}>
            <Ticket size={18} /> My Tickets
          </button>
          <button onClick={() => setActiveTab('knowledge')} className={`px-6 py-3 rounded-t-lg transition-all duration-300 flex items-center gap-2 ${activeTab === 'knowledge' ? 'bg-gold-400/10 text-gold-600 border-b-2 border-gold-500' : 'text-navy-500 hover:text-gold-500'}`}>
            <BookOpen size={18} /> Knowledge Base
          </button>
          <button onClick={() => setIsNewTicketModalOpen(true)} className="btn-primary text-sm py-2 px-4 ml-auto">
            <Plus size={16} className="inline mr-1" /> New Ticket
          </button>
        </div>

        {/* Search Bar */}
        <div className="mb-6 animate-slide-up">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gold-500" size={20} />
            <input
              type="text"
              placeholder={activeTab === 'tickets' ? "Search tickets by subject or message..." : "Search articles by title, content, or tags..."}
              className="input-field pl-12"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* TICKETS VIEW */}
        {activeTab === 'tickets' && (
          <div>
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 rounded-full text-sm transition-all duration-300 ${selectedCategory === cat ? 'bg-gold-500 text-white' : 'bg-gold-400/10 text-navy-600 hover:bg-gold-400/20'}`}
                >
                  {cat === 'all' ? 'All' : cat.replace('_', ' ')}
                </button>
              ))}
            </div>

            {filteredTickets.length === 0 ? (
              <div className="glass-card p-16 text-center">
                <Ticket size={64} className="mx-auto text-gold-400 mb-6" />
                <h3 className="font-serif text-2xl text-navy-700 mb-3">No Tickets Found</h3>
                <p className="text-navy-500 mb-6">Create a new support ticket to get help</p>
                <button onClick={() => setIsNewTicketModalOpen(true)} className="btn-primary">Create New Ticket</button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredTickets.map((ticket) => {
                  const status = getStatusBadge(ticket.status)
                  const StatusIcon = status.icon
                  return (
                    <div
                      key={ticket.id}
                      className="glass-card p-5 cursor-pointer hover:bg-gold-400/5 transition-all duration-300"
                      onClick={() => { setSelectedTicket(ticket); setIsTicketDetailOpen(true); }}
                    >
                      <div className="flex items-center justify-between flex-wrap gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 flex-wrap">
                            <h3 className="font-semibold text-navy-700">{ticket.subject}</h3>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${getPriorityBadge(ticket.priority)}`}>
                              {ticket.priority}
                            </span>
                            <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${status.bg} ${status.text}`}>
                              <StatusIcon size={12} /> {status.label}
                            </span>
                          </div>
                          <p className="text-sm text-navy-500 mt-2 line-clamp-2">{ticket.message}</p>
                          <div className="flex items-center gap-4 mt-3 text-xs text-navy-400">
                            <span>Category: {ticket.category.replace('_', ' ')}</span>
                            <span>Created: {formatDate(ticket.createdAt)}</span>
                            {ticket.replies.length > 0 && (
                              <span className="flex items-center gap-1">
                                <MessageCircle size={12} /> {ticket.replies.length} replies
                              </span>
                            )}
                          </div>
                        </div>
                        <ChevronRight size={20} className="text-gold-500" />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* KNOWLEDGE BASE VIEW */}
        {activeTab === 'knowledge' && (
          <div className="space-y-4">
            {filteredKnowledge.length === 0 ? (
              <div className="glass-card p-16 text-center">
                <BookOpen size={64} className="mx-auto text-gold-400 mb-6" />
                <h3 className="font-serif text-2xl text-navy-700 mb-3">No Articles Found</h3>
                <p className="text-navy-500">Try a different search term</p>
              </div>
            ) : (
              filteredKnowledge.map((article) => (
                <div key={article.id} className="glass-card p-5">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold text-navy-700 text-lg">{article.title}</h3>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-gold-400/10 text-gold-600">
                          {article.category}
                        </span>
                        {article.tags.map(tag => (
                          <span key={tag} className="text-xs text-navy-400">#{tag}</span>
                        ))}
                      </div>
                      <p className="text-navy-600 mt-3 line-clamp-3">{article.content}</p>
                      <div className="flex items-center gap-4 mt-4 pt-3 border-t border-gold-200/30">
                        <button onClick={() => handleHelpful(article.id, true)} className="flex items-center gap-1 text-sm text-green-600 hover:text-green-700">
                          <ThumbsUp size={14} /> Helpful ({article.helpfulCount})
                        </button>
                        <button onClick={() => handleHelpful(article.id, false)} className="flex items-center gap-1 text-sm text-red-600 hover:text-red-700">
                          <ThumbsDown size={14} /> Not Helpful ({article.notHelpfulCount})
                        </button>
                        <span className="text-xs text-navy-400">{article.viewCount} views</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </main>

      {/* New Ticket Modal */}
      {isNewTicketModalOpen && (
        <div className="fixed inset-0 bg-navy-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto" onClick={() => setIsNewTicketModalOpen(false)}>
          <div className="glass-card max-w-md w-full p-6 animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-serif text-2xl text-navy-700">Create Support Ticket</h2>
              <button onClick={() => setIsNewTicketModalOpen(false)} className="p-1 hover:bg-gold-400/10 rounded-lg"><X size={20} /></button>
            </div>
            <form onSubmit={handleCreateTicket} className="space-y-4">
              <div>
                <label className="label">Subject *</label>
                <input type="text" required className="input-field" value={newTicketForm.subject} onChange={(e) => setNewTicketForm({ ...newTicketForm, subject: e.target.value })} />
              </div>
              <div>
                <label className="label">Category *</label>
                <select className="input-field" value={newTicketForm.category} onChange={(e) => setNewTicketForm({ ...newTicketForm, category: e.target.value })}>
                  <option value="TECHNICAL">Technical Issue</option>
                  <option value="BILLING">Billing Question</option>
                  <option value="FEATURE_REQUEST">Feature Request</option>
                  <option value="PROPERTY_MANAGEMENT">Property Management</option>
                  <option value="PAYMENT_ISSUE">Payment Issue</option>
                  <option value="ACCOUNT_ISSUE">Account Issue</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div>
                <label className="label">Priority *</label>
                <select className="input-field" value={newTicketForm.priority} onChange={(e) => setNewTicketForm({ ...newTicketForm, priority: e.target.value })}>
                  <option value="LOW">Low - General question</option>
                  <option value="MEDIUM">Medium - Need assistance</option>
                  <option value="HIGH">High - Urgent issue</option>
                  <option value="URGENT">Urgent - Critical problem</option>
                </select>
              </div>
              <div>
                <label className="label">Message *</label>
                <textarea required rows={5} className="input-field" value={newTicketForm.message} onChange={(e) => setNewTicketForm({ ...newTicketForm, message: e.target.value })} placeholder="Please describe your issue in detail..." />
              </div>
              <button type="submit" disabled={submitting} className="btn-primary w-full">{submitting ? 'Creating...' : 'Create Ticket'}</button>
            </form>
          </div>
        </div>
      )}

      {/* Ticket Detail Modal */}
      {isTicketDetailOpen && selectedTicket && (
        <div className="fixed inset-0 bg-navy-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto" onClick={() => setIsTicketDetailOpen(false)}>
          <div className="glass-card max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-serif text-2xl text-navy-700">{selectedTicket.subject}</h2>
              <button onClick={() => setIsTicketDetailOpen(false)} className="p-1 hover:bg-gold-400/10 rounded-lg"><X size={20} /></button>
            </div>
            <div className="flex items-center gap-3 mb-4">
              <span className={`text-xs px-2 py-0.5 rounded-full ${getPriorityBadge(selectedTicket.priority)}`}>{selectedTicket.priority}</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-gold-400/10 text-gold-600">{selectedTicket.category.replace('_', ' ')}</span>
              <span className="text-xs text-navy-400">Created: {formatDate(selectedTicket.createdAt)}</span>
            </div>
            
            <div className="bg-gold-400/5 rounded-lg p-4 mb-4">
              <p className="text-navy-700 whitespace-pre-wrap">{selectedTicket.message}</p>
            </div>

            {selectedTicket.replies.length > 0 && (
              <div className="space-y-3 mb-4">
                <h3 className="font-semibold text-navy-700">Replies</h3>
                {selectedTicket.replies.map((reply) => (
                  <div key={reply.id} className={`p-3 rounded-lg ${reply.isFromAdmin ? 'bg-blue-500/5 border border-blue-500/30 ml-4' : 'bg-gold-400/5'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-xs font-semibold ${reply.isFromAdmin ? 'text-blue-600' : 'text-gold-600'}`}>
                        {reply.isFromAdmin ? 'Support Team' : 'You'}
                      </span>
                      <span className="text-xs text-navy-400">{formatDate(reply.createdAt)}</span>
                    </div>
                    <p className="text-navy-700 text-sm whitespace-pre-wrap">{reply.message}</p>
                  </div>
                ))}
              </div>
            )}

            {selectedTicket.status !== 'RESOLVED' && selectedTicket.status !== 'CLOSED' && (
              <div className="mt-4">
                <label className="label">Add Reply</label>
                <textarea
                  rows={3}
                  className="input-field"
                  placeholder="Type your reply here..."
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                />
                <button onClick={() => handleAddReply(selectedTicket.id)} disabled={sendingReply} className="btn-primary mt-3 flex items-center gap-2">
                  <Send size={16} /> {sendingReply ? 'Sending...' : 'Send Reply'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}