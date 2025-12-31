"use client"

import { useState, useEffect, useMemo } from "react"
import { motion } from "framer-motion"
import { AppShell } from "@/components/layout/app-shell"
import { GlassCard } from "@/components/ui/glass-card"
import { loadSettings, type AppSettings } from "@/lib/settings-store"
import { useHSEPrograms } from "@/hooks/useHSEPrograms"
import {
  AlertTriangle,
  TrendingUp,
  Target,
  Calendar,
  ChevronRight,
  Activity,
  Shield,
  Clock
} from "lucide-react"
import Link from "next/link"

// Animated Bento Card wrapper
function BentoCard({
  children,
  className = "",
  delay = 0
}: {
  children: React.ReactNode
  className?: string
  delay?: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ y: -4, boxShadow: "0 20px 40px -12px rgba(0,0,0,0.25)" }}
      className={`bg-[var(--bg-secondary)]/80 backdrop-blur-xl rounded-2xl border border-[var(--border-light)] overflow-hidden transition-shadow ${className}`}
    >
      {children}
    </motion.div>
  )
}

// Skeleton loader
function SkeletonPulse({ className = "" }: { className?: string }) {
  return (
    <div className={`bg-[var(--bg-tertiary)] animate-pulse rounded ${className}`} />
  )
}

// Progress Ring Component
function ComplianceRing({ value, isLoading }: { value: number; isLoading: boolean }) {
  const radius = 70
  const stroke = 10
  const normalizedRadius = radius - stroke / 2
  const circumference = normalizedRadius * 2 * Math.PI
  const strokeDashoffset = circumference - (value / 100) * circumference

  const getColor = () => {
    if (value >= 80) return 'var(--success-color)'
    if (value >= 50) return 'var(--warning-color)'
    return 'var(--danger-color)'
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <SkeletonPulse className="w-36 h-36 rounded-full" />
        <SkeletonPulse className="w-24 h-4 mt-4" />
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center p-6">
      <div className="relative">
        <svg height={radius * 2} width={radius * 2} className="transform -rotate-90">
          <circle
            stroke="var(--bg-tertiary)"
            fill="transparent"
            strokeWidth={stroke}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
          <motion.circle
            stroke={getColor()}
            fill="transparent"
            strokeWidth={stroke}
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            strokeLinecap="round"
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="text-4xl font-bold text-[var(--text-primary)]"
          >
            {value}%
          </motion.span>
          <span className="text-xs text-[var(--text-muted)]">Compliance</span>
        </div>
      </div>
      <div className="mt-4 text-center">
        <p className="text-lg font-semibold text-[var(--text-primary)]">Safety Score</p>
        <p className="text-xs text-[var(--text-muted)]">Based on OTP completion</p>
      </div>
    </div>
  )
}

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']
const MONTH_LABELS = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D']

export default function HomePage() {
  const [settings, setSettings] = useState<AppSettings | null>(null)

  // Fetch OTP data for dashboard metrics
  const { data: otpData, isLoading } = useHSEPrograms({
    region: 'indonesia',
    base: 'all',
    category: 'otp',
    year: 2026
  })

  useEffect(() => {
    setSettings(loadSettings())
    const handleSettingsChange = () => setSettings(loadSettings())
    window.addEventListener('settingsChanged', handleSettingsChange)
    return () => window.removeEventListener('settingsChanged', handleSettingsChange)
  }, [])

  // Calculate dashboard metrics
  const metrics = useMemo(() => {
    if (!otpData?.programs) {
      return { compliance: 0, overdue: [], monthlyData: Array(12).fill({ plan: 0, actual: 0 }) }
    }

    const programs = otpData.programs
    const totalProgress = programs.reduce((sum, p) => sum + (p.progress || 0), 0)
    const compliance = programs.length > 0 ? Math.round(totalProgress / programs.length) : 0

    // Find overdue items (plan > 0 but actual = 0 for past months)
    const currentMonth = new Date().getMonth()
    const overdue: { name: string; month: string; id: number }[] = []

    programs.forEach(prog => {
      MONTHS.slice(0, currentMonth + 1).forEach((month, idx) => {
        const data = prog.months[month]
        if (data && data.plan > 0 && data.actual === 0) {
          overdue.push({
            name: prog.name,
            month: month.toUpperCase(),
            id: prog.id
          })
        }
      })
    })

    // Monthly aggregate data
    const monthlyData = MONTHS.map(month => {
      let totalPlan = 0
      let totalActual = 0
      programs.forEach(prog => {
        const data = prog.months[month]
        if (data) {
          totalPlan += data.plan
          totalActual += data.actual
        }
      })
      return { plan: totalPlan, actual: totalActual }
    })

    return { compliance, overdue: overdue.slice(0, 5), monthlyData }
  }, [otpData])

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">
              {settings?.language === 'id' ? 'Dashboard HSE' : 'HSE Dashboard'}
            </h1>
            <p className="text-sm text-[var(--text-muted)]">
              {settings?.language === 'id' ? 'Ikhtisar Eksekutif' : 'Executive Overview'} • 2026
            </p>
          </div>
          <div className="flex items-center gap-2">
            {settings?.companyLogo && (
              <img src={settings.companyLogo} alt="Logo" className="w-10 h-10 object-contain" />
            )}
          </div>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Safety Compliance Score - Large Card */}
          <BentoCard className="md:col-span-1 md:row-span-2" delay={0}>
            <div className="p-4 border-b border-[var(--border-light)]">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-[var(--accent-blue)]" />
                <h3 className="font-semibold text-[var(--text-primary)]">Safety Compliance</h3>
              </div>
            </div>
            <ComplianceRing value={metrics.compliance} isLoading={isLoading} />
            <div className="px-4 pb-4">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2 bg-[var(--bg-tertiary)] rounded-lg">
                  <div className="text-lg font-bold text-[var(--success-color)]">
                    {isLoading ? '-' : otpData?.programs.filter(p => p.progress === 100).length || 0}
                  </div>
                  <div className="text-[10px] text-[var(--text-muted)]">Complete</div>
                </div>
                <div className="p-2 bg-[var(--bg-tertiary)] rounded-lg">
                  <div className="text-lg font-bold text-[var(--warning-color)]">
                    {isLoading ? '-' : otpData?.programs.filter(p => p.progress > 0 && p.progress < 100).length || 0}
                  </div>
                  <div className="text-[10px] text-[var(--text-muted)]">In Progress</div>
                </div>
                <div className="p-2 bg-[var(--bg-tertiary)] rounded-lg">
                  <div className="text-lg font-bold text-[var(--danger-color)]">
                    {isLoading ? '-' : metrics.overdue.length}
                  </div>
                  <div className="text-[10px] text-[var(--text-muted)]">Overdue</div>
                </div>
              </div>
            </div>
          </BentoCard>

          {/* Action Required - Medium Card */}
          <BentoCard className="md:col-span-2" delay={0.1}>
            <div className="p-4 border-b border-[var(--border-light)] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-[var(--danger-color)]" />
                <h3 className="font-semibold text-[var(--text-primary)]">Action Required</h3>
              </div>
              <span className="px-2 py-0.5 text-xs font-medium bg-[var(--danger-color)]/10 text-[var(--danger-color)] rounded-full">
                {isLoading ? '...' : metrics.overdue.length} items
              </span>
            </div>
            <div className="p-4">
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="flex items-center gap-3">
                      <SkeletonPulse className="w-8 h-8 rounded-lg" />
                      <SkeletonPulse className="flex-1 h-4" />
                    </div>
                  ))}
                </div>
              ) : metrics.overdue.length === 0 ? (
                <div className="text-center py-6 text-[var(--text-muted)]">
                  <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">All programs on track! 🎉</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {metrics.overdue.map((item, idx) => (
                    <Link
                      key={`${item.id}-${item.month}`}
                      href="/otp"
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors"
                    >
                      <div className="w-8 h-8 bg-[var(--danger-color)]/10 rounded-lg flex items-center justify-center text-xs font-bold text-[var(--danger-color)]">
                        {item.month}
                      </div>
                      <span className="flex-1 text-sm text-[var(--text-primary)] truncate">{item.name}</span>
                      <Clock className="w-4 h-4 text-[var(--danger-color)]" />
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </BentoCard>

          {/* 12-Month Trend - Wide Card */}
          <BentoCard className="md:col-span-2" delay={0.2}>
            <div className="p-4 border-b border-[var(--border-light)] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-[var(--success-color)]" />
                <h3 className="font-semibold text-[var(--text-primary)]">12-Month Trend</h3>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-[var(--accent-blue)]" /> Plan
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-[var(--success-color)]" /> Actual
                </span>
              </div>
            </div>
            <div className="p-4">
              {isLoading ? (
                <div className="flex items-end justify-between gap-2 h-32">
                  {Array(12).fill(0).map((_, i) => (
                    <SkeletonPulse key={i} className="flex-1 h-full" />
                  ))}
                </div>
              ) : (
                <div className="flex items-end justify-between gap-1 h-32">
                  {metrics.monthlyData.map((month, idx) => {
                    const maxVal = Math.max(...metrics.monthlyData.map(m => Math.max(m.plan, m.actual)), 1)
                    const planHeight = (month.plan / maxVal) * 100
                    const actualHeight = (month.actual / maxVal) * 100

                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                        <div className="w-full flex gap-0.5 items-end h-24">
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: `${planHeight}%` }}
                            transition={{ duration: 0.5, delay: idx * 0.05 }}
                            className="flex-1 bg-[var(--accent-blue)]/30 rounded-t"
                          />
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: `${actualHeight}%` }}
                            transition={{ duration: 0.5, delay: idx * 0.05 + 0.1 }}
                            className="flex-1 bg-[var(--success-color)] rounded-t"
                          />
                        </div>
                        <span className="text-[10px] text-[var(--text-muted)]">{MONTH_LABELS[idx]}</span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </BentoCard>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { title: 'OTP Programs', href: '/otp', icon: Target, color: 'accent-blue' },
            { title: 'Matrix', href: '/matrix', icon: TrendingUp, color: 'success-color' },
            { title: 'Calendar', href: '/calendar', icon: Calendar, color: 'warning-color' },
            { title: 'Settings', href: '/settings', icon: Shield, color: 'accent-purple' },
          ].map((action, idx) => (
            <motion.div
              key={action.href}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + idx * 0.05 }}
            >
              <Link
                href={action.href}
                className="flex items-center gap-3 p-4 bg-[var(--bg-secondary)]/60 backdrop-blur rounded-xl border border-[var(--border-light)] hover:bg-[var(--bg-tertiary)] transition-colors group"
              >
                <div className={`w-10 h-10 rounded-xl bg-[var(--${action.color})]/10 flex items-center justify-center`}>
                  <action.icon className={`w-5 h-5 text-[var(--${action.color})]`} />
                </div>
                <span className="flex-1 font-medium text-sm text-[var(--text-primary)]">{action.title}</span>
                <ChevronRight className="w-4 h-4 text-[var(--text-muted)] group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </AppShell>
  )
}
