// components/ui/Sidebar.tsx
// Premium sidebar with user info, email display, glassmorphism, and animations

'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { 
  LayoutDashboard, 
  Building2, 
  Users, 
  CreditCard, 
  Settings,
  Receipt,
  LogOut,
  Menu,
  X,
  HelpCircle,
  Crown,
  User,
  Mail
} from 'lucide-react'

interface UserData {
  email: string
  companyName: string
}

const navItems = [
  { name: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
  { name: 'Properties', icon: Building2, href: '/dashboard/properties' },
  { name: 'Tenants', icon: Users, href: '/dashboard/tenants' },
  { name: 'Payments', icon: CreditCard, href: '/dashboard/payments' },
  { name: 'Receipts', icon: Receipt, href: '/dashboard/receipts' },
  { name: 'Help Center', icon: HelpCircle, href: '/dashboard/help' },  // Add this line
  
  { name: 'Settings', icon: Settings, href: '/dashboard/settings' },
]

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [userData, setUserData] = useState<UserData | null>(null)
  const sidebarRef = useRef<HTMLDivElement>(null)
  const pathname = usePathname()
  const router = useRouter()

  // Fetch user data
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const res = await fetch('/api/auth/me')
        if (res.ok) {
          const data = await res.json()
          setUserData(data)
        }
      } catch (error) {
        console.error('Failed to fetch user data:', error)
      }
    }
    fetchUserData()
  }, [])

  // Check if screen is mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024
      setIsMobile(mobile)
      if (!mobile) {
        setIsOpen(true)
      } else {
        setIsOpen(false)
      }
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Close sidebar when clicking outside (mobile only)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isMobile && isOpen && sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isMobile, isOpen])

  // Close sidebar when navigating (mobile only)
  useEffect(() => {
    if (isMobile) {
      setIsOpen(false)
    }
  }, [pathname, isMobile])

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      router.push('/login')
    } catch (error) {
      console.error('Logout failed:', error)
      router.push('/login')
    }
  }

  const handleHelpCenter = () => {
    // We'll implement help center later
    alert('Help Center coming soon!')
  }

  // Sidebar content component
  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo Section with animated crown */}
      <div className="mb-8 px-6 pt-8">
        <div className="flex items-center gap-2 mb-2">
          <Crown className="text-gold-400 animate-glow-pulse" size={28} />
          <h2 className="font-serif text-2xl text-navy-700">Saliq</h2>
        </div>
        <p className="text-gold-500 text-sm mt-1 tracking-wide">Premium Management</p>
        <div className="h-px bg-gradient-to-r from-transparent via-gold-400 to-transparent mt-4" />
      </div>

      {/* User Info Section */}
      {userData && (
        <div className="mx-4 mb-6 p-4 rounded-xl bg-gradient-to-br from-gold-400/10 to-navy-700/5 border border-gold-400/20 animate-slide-in-left">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gold-400 to-gold-500 flex items-center justify-center">
              <User size={20} className="text-white" />
            </div>
            <div>
              <p className="text-navy-700 font-semibold text-sm">{userData.companyName}</p>
              <div className="flex items-center gap-1 mt-1">
                <Mail size={12} className="text-gold-500" />
                <p className="text-navy-500 text-xs truncate max-w-[150px]">{userData.email}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-4">
        {navItems.map((item, index) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              style={{ animationDelay: `${index * 50}ms` }}
              className={`
                group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 animate-slide-in-left
                ${isActive 
                  ? 'bg-gradient-to-r from-navy-700 to-navy-800 text-cream-100 shadow-lg' 
                  : 'text-navy-600 hover:bg-gold-400/10 hover:text-gold-500 hover:translate-x-1'
                }
              `}
            >
              <item.icon size={20} className="transition-transform group-hover:scale-110" />
              <span className="font-medium">{item.name}</span>
              {isActive && (
                <div className="ml-auto w-1 h-6 rounded-full bg-gold-400 animate-pulse" />
              )}
            </Link>
          )
        })}
      </nav>

      {/* Bottom Actions */}
      <div className="px-4 pb-8 space-y-2 mt-auto">
        <button
          onClick={handleHelpCenter}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gold-600 hover:bg-gold-400/10 transition-all duration-300 group"
        >
          <HelpCircle size={20} className="group-hover:rotate-12 transition-transform" />
          <span className="font-medium">Help Center</span>
        </button>
        
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 transition-all duration-300 group"
        >
          <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile Menu Button - Repositioned to avoid overlapping */}
      {isMobile && (
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="fixed top-6 left-6 z-50 p-3 rounded-xl glass-card lg:hidden hover:scale-105 transition-transform"
          aria-label="Toggle menu"
        >
          {isOpen ? <X size={22} className="text-navy-700" /> : <Menu size={22} className="text-navy-700" />}
        </button>
      )}

      {/* Backdrop Overlay (mobile only) */}
      {isMobile && isOpen && (
        <div 
          className="fixed inset-0 bg-navy-900/60 backdrop-blur-sm z-40 transition-all duration-300 lg:hidden animate-fade-in"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        ref={sidebarRef}
        className={`
          fixed top-0 left-0 h-full w-80 glass-card rounded-r-2xl z-50
          transition-all duration-500 ease-out
          ${isMobile && !isOpen ? '-translate-x-full' : 'translate-x-0'}
          ${isMobile ? 'shadow-2xl' : ''}
          lg:translate-x-0
          overflow-y-auto
        `}
      >
        <SidebarContent />
      </aside>
    </>
  )
}