// app/page.tsx
// Landing page for Saliq Rental Management

import Link from 'next/link'
import { Building2, CreditCard, Users, Smartphone, Shield, TrendingUp, CheckCircle, ArrowRight } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-cream-200 via-cream-100 to-cream-200">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="glass-orb w-[800px] h-[800px] -top-96 -right-96 animate-float" />
        <div className="glass-orb w-[600px] h-[600px] bottom-32 -left-48 animate-float" style={{ animationDelay: '2s' }} />
        
        <div className="container mx-auto px-6 py-20 md:py-32 relative z-10">
          <div className="max-w-4xl mx-auto text-center animate-fade-in">
            <div className="inline-flex items-center gap-2 bg-gold-400/10 backdrop-blur-sm px-4 py-2 rounded-full border border-gold-400/30 mb-6">
              <Shield size={16} className="text-gold-500" />
              <span className="text-gold-500 text-sm font-semibold">Kenya's Most Trusted Property Management Platform</span>
            </div>
            <h1 className="heading-premium text-5xl md:text-7xl mb-6">
              Smart Rental Management<br />for Kenyan Landlords
            </h1>
            <p className="text-navy-600 text-xl md:text-2xl mb-8 max-w-2xl mx-auto">
              Automate rent collection, track payments, and manage your properties all in one place.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register" className="btn-primary text-lg px-8 py-4">
                Get Started Free
              </Link>
              <Link href="#features" className="btn-secondary text-lg px-8 py-4">
                Learn More
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-navy-700/5">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <p className="text-4xl font-serif text-gold-500 font-bold">10K+</p>
              <p className="text-navy-600 mt-2">Properties Managed</p>
            </div>
            <div>
              <p className="text-4xl font-serif text-gold-500 font-bold">50K+</p>
              <p className="text-navy-600 mt-2">Happy Tenants</p>
            </div>
            <div>
              <p className="text-4xl font-serif text-gold-500 font-bold">KSh 2B+</p>
              <p className="text-navy-600 mt-2">Rent Collected</p>
            </div>
            <div>
              <p className="text-4xl font-serif text-gold-500 font-bold">99.9%</p>
              <p className="text-navy-600 mt-2">Uptime Guarantee</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="heading-premium text-4xl md:text-5xl mb-4">Everything You Need</h2>
            <p className="text-navy-600 text-lg max-w-2xl mx-auto">
              Powerful tools to streamline your rental business
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="glass-card p-8 text-center hover:scale-[1.02] transition-all duration-300">
              <div className="w-16 h-16 bg-gold-400/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Building2 size={32} className="text-gold-500" />
              </div>
              <h3 className="font-serif text-xl text-navy-700 mb-2">Property Management</h3>
              <p className="text-navy-500">Manage multiple properties, units, and floors with ease.</p>
            </div>
            <div className="glass-card p-8 text-center hover:scale-[1.02] transition-all duration-300">
              <div className="w-16 h-16 bg-gold-400/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Smartphone size={32} className="text-gold-500" />
              </div>
              <h3 className="font-serif text-xl text-navy-700 mb-2">Auto Rent Collection</h3>
              <p className="text-navy-500">M-Pesa integration for automatic payment recording.</p>
            </div>
            <div className="glass-card p-8 text-center hover:scale-[1.02] transition-all duration-300">
              <div className="w-16 h-16 bg-gold-400/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <CreditCard size={32} className="text-gold-500" />
              </div>
              <h3 className="font-serif text-xl text-navy-700 mb-2">Financial Reports</h3>
              <p className="text-navy-500">Real-time insights into your rental income.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="glass-card p-12 text-center max-w-4xl mx-auto">
            <h2 className="heading-premium text-3xl md:text-4xl mb-4">Ready to Get Started?</h2>
            <p className="text-navy-600 text-lg mb-8">
              Join thousands of landlords already using Saliq to manage their properties.
            </p>
            <Link href="/register" className="btn-primary text-lg px-8 py-4 inline-flex items-center gap-2">
              Start Free Trial <ArrowRight size={20} />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-navy-800 text-cream-100 py-12">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="font-serif text-xl mb-4">Saliq</h3>
              <p className="text-cream-200/70 text-sm">Premium property management for Kenyan landlords.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-cream-200/70">
                <li><Link href="#features">Features</Link></li>
                <li><Link href="/register">Pricing</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-cream-200/70">
                <li><Link href="#">About Us</Link></li>
                <li><Link href="#">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-cream-200/70">
                <li><Link href="#">Privacy Policy</Link></li>
                <li><Link href="#">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-cream-200/20 mt-8 pt-8 text-center text-sm text-cream-200/50">
            &copy; 2025 Saliq Software Solutions. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}