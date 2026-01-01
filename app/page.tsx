"use client"

import { useState, useEffect, useMemo } from "react"
import { motion } from "framer-motion"
import { AppShell } from "@/components/layout/app-shell"
import { loadSettings, type AppSettings } from "@/lib/settings-store"
import { useHSEPrograms } from "@/hooks/useHSEPrograms"
import {
  Card,
  Metric,
  Text,
  Flex,
  ProgressCircle,
  BadgeDelta,
  BarChart,
  DonutChart
} from "@tremor/react"
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
import { AIConsultant } from "@/components/dashboard/ai-consultant"
import { LottieDisplay } from "@/components/ui/lottie-display"
import { RightSidebar } from "@/components/dashboard/right-sidebar"
import { SafetyMascot } from "@/components/dashboard/safety-mascot"

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

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']
const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

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
      return {
        compliance: 0,
        overdue: [],
        monthlyData: MONTHS.map((m, i) => ({ month: MONTH_LABELS[i], Plan: 0, Actual: 0 })),
        statusData: [],
        trend: 0
      }
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

    // Monthly aggregate data for Tremor BarChart
    const monthlyData = MONTHS.map((month, idx) => {
      let totalPlan = 0
      let totalActual = 0
      programs.forEach(prog => {
        const data = prog.months[month]
        if (data) {
          totalPlan += data.plan
          totalActual += data.actual
        }
      })
      return { month: MONTH_LABELS[idx], Plan: totalPlan, Actual: totalActual }
    })

    // Status data for DonutChart
    const complete = programs.filter(p => p.progress === 100).length
    const inProgress = programs.filter(p => p.progress > 0 && p.progress < 100).length
    const notStarted = programs.filter(p => p.progress === 0).length

    const statusData = [
      { name: 'Complete', value: complete },
      { name: 'In Progress', value: inProgress },
      { name: 'Not Started', value: notStarted },
    ]

    // Calculate trend (compare current month vs previous)
    const prevMonthData = monthlyData[Math.max(0, currentMonth - 1)]
    const currMonthData = monthlyData[currentMonth]
    const trend = prevMonthData.Actual > 0
      ? Math.round(((currMonthData.Actual - prevMonthData.Actual) / prevMonthData.Actual) * 100)
      : 0

    return { compliance, overdue: overdue.slice(0, 5), monthlyData, statusData, trend }
  }, [otpData])

  return (
    <AppShell>
      <div className="flex gap-6">
        {/* Main Content */}
        <div className="flex-1 space-y-6 min-w-0">
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

          {/* AI Safety Consultant */}
          <div className="mb-2">
            <AIConsultant />
          </div>

          {/* Tremor Metric Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <BentoCard delay={0}>
              <Card className="!bg-transparent !shadow-none !ring-0">
                <Flex alignItems="start">
                  <div>
                    <Text>Compliance Score</Text>
                    <Metric>{isLoading ? '...' : `${metrics.compliance}%`}</Metric>
                  </div>
                  <BadgeDelta deltaType={metrics.trend >= 0 ? "increase" : "decrease"} size="xs">
                    {metrics.trend >= 0 ? '+' : ''}{metrics.trend}%
                  </BadgeDelta>
                </Flex>
              </Card>
            </BentoCard>

            <BentoCard delay={0.05}>
              <Card className="!bg-transparent !shadow-none !ring-0">
                <Text>Total Programs</Text>
                <Metric>{isLoading ? '...' : otpData?.programs.length || 0}</Metric>
                <Text className="mt-1 text-xs">Active OTP programs</Text>
              </Card>
            </BentoCard>

            <BentoCard delay={0.1}>
              <Card className="!bg-transparent !shadow-none !ring-0">
                <Text>Completed</Text>
                <Metric className="text-[#10b981]">
                  {isLoading ? '...' : otpData?.programs.filter(p => p.progress === 100).length || 0}
                </Metric>
                <Text className="mt-1 text-xs">100% progress</Text>
              </Card>
            </BentoCard>

            <BentoCard delay={0.15}>
              <Card className="!bg-transparent !shadow-none !ring-0">
                <Text>Action Required</Text>
                <Metric className="text-[#ef4444]">
                  {isLoading ? '...' : metrics.overdue.length}
                </Metric>
                <Text className="mt-1 text-xs">Overdue items</Text>
              </Card>
            </BentoCard>
          </div>

          {/* Main Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Progress Circle */}
            <BentoCard className="p-6 relative" delay={0.2}>
              {/* Safety Mascot positioned in top-right */}
              <div className="absolute top-3 right-3">
                {isLoading ? (
                  <SkeletonPulse className="w-16 h-16 rounded-full" />
                ) : (
                  <SafetyMascot score={metrics.compliance} className="w-16 h-16" />
                )}
              </div>

              <div className="flex flex-col items-center">
                <Text className="mb-4 font-semibold">Safety Compliance</Text>
                {isLoading ? (
                  <SkeletonPulse className="w-40 h-40 rounded-full" />
                ) : (
                  <ProgressCircle
                    value={metrics.compliance}
                    size="xl"
                    color={metrics.compliance >= 80 ? "emerald" : metrics.compliance >= 50 ? "yellow" : "red"}
                  >
                    <span className="text-2xl font-bold text-[var(--text-primary)]">
                      {metrics.compliance}%
                    </span>
                  </ProgressCircle>
                )}
                <Flex justifyContent="center" className="mt-4 gap-4">
                  <div className="text-center">
                    <Text className="text-xs text-[var(--text-muted)]">Complete</Text>
                    <Text className="font-bold text-[#10b981]">
                      {isLoading ? '-' : metrics.statusData[0]?.value || 0}
                    </Text>
                  </div>
                  <div className="text-center">
                    <Text className="text-xs text-[var(--text-muted)]">In Progress</Text>
                    <Text className="font-bold text-[#f59e0b]">
                      {isLoading ? '-' : metrics.statusData[1]?.value || 0}
                    </Text>
                  </div>
                  <div className="text-center">
                    <Text className="text-xs text-[var(--text-muted)]">Not Started</Text>
                    <Text className="font-bold text-[#ef4444]">
                      {isLoading ? '-' : metrics.statusData[2]?.value || 0}
                    </Text>
                  </div>
                </Flex>
              </div>
            </BentoCard>

            {/* 12-Month Trend Chart */}
            <BentoCard className="md:col-span-2 p-4" delay={0.25}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-[var(--success-color)]" />
                  <Text className="font-semibold">12-Month Trend</Text>
                </div>
                <BadgeDelta deltaType={metrics.trend >= 0 ? "increase" : "decrease"} size="xs">
                  {metrics.trend >= 0 ? '+' : ''}{metrics.trend}% vs prev month
                </BadgeDelta>
              </div>
              {isLoading ? (
                <div className="h-48 flex items-center justify-center">
                  <LottieDisplay type="loading" className="w-24 h-24" />
                </div>
              ) : (
                <BarChart
                  data={metrics.monthlyData}
                  index="month"
                  categories={["Plan", "Actual"]}
                  colors={["blue", "emerald"]}
                  className="h-48"
                  showAnimation={true}
                  showLegend={true}
                  showGridLines={false}
                />
              )}
            </BentoCard>
          </div>

          {/* Action Required + Status Distribution */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Action Required */}
            <BentoCard className="p-4" delay={0.3}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-[var(--danger-color)]" />
                  <Text className="font-semibold">Action Required</Text>
                </div>
                <span className="px-2 py-0.5 text-xs font-medium bg-[var(--danger-color)]/10 text-[var(--danger-color)] rounded-full">
                  {isLoading ? '...' : metrics.overdue.length} items
                </span>
              </div>
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
                <div className="text-center py-4 text-[var(--text-muted)]">
                  <LottieDisplay type="success" className="w-24 h-24 mx-auto" loop={false} />
                  <p className="text-sm">All programs on track! 🎉</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
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
            </BentoCard>

            {/* Status Distribution */}
            <BentoCard className="p-4" delay={0.35}>
              <div className="flex items-center gap-2 mb-4">
                <Shield className="w-5 h-5 text-[var(--accent-blue)]" />
                <Text className="font-semibold">Status Distribution</Text>
              </div>
              {isLoading ? (
                <div className="flex items-center justify-center h-40">
                  <SkeletonPulse className="w-32 h-32 rounded-full" />
                </div>
              ) : (
                <DonutChart
                  data={metrics.statusData}
                  category="value"
                  index="name"
                  colors={["emerald", "yellow", "red"]}
                  className="h-40"
                  showAnimation={true}
                  showLabel={true}
                  label={`${otpData?.programs.length || 0} Total`}
                />
              )}
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
                transition={{ delay: 0.4 + idx * 0.05 }}
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

        {/* Right Sidebar - Hidden on mobile/tablet, visible on xl+ */}
        <div className="hidden xl:block shrink-0">
          <RightSidebar />
        </div>
      </div>
    </AppShell>
  )
}
