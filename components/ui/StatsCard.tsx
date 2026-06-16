// components/ui/StatsCard.tsx
// Premium statistics card with hover effects

'use client'

interface StatsCardProps {
  title: string
  value: string | number
  icon: React.ReactNode
  trend?: number
  prefix?: string
}

export default function StatsCard({ title, value, icon, trend, prefix = 'KSh' }: StatsCardProps) {
  return (
    <div className="glass-card p-6 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl">
      <div className="flex items-center justify-between mb-4">
        <div className="p-3 rounded-xl bg-gold-400/10 text-gold-500">
          {icon}
        </div>
        {trend !== undefined && (
          <span className={`text-sm font-semibold ${trend >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
        )}
      </div>
      <h3 className="text-navy-500 text-sm font-medium mb-1">{title}</h3>
      <p className="font-serif text-3xl text-navy-700">
        {prefix} {typeof value === 'number' ? value.toLocaleString() : value}
      </p>
    </div>
  )
}