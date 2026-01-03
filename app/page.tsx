"use client"

import { useState, useEffect, useMemo } from "react"
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
import { PostComposer } from "@/components/feed/post-composer"
import { PostCard, type PostData } from "@/components/feed/post-card"
import { useAdmin } from "@/hooks/useAdmin"
import { streamService } from "@/lib/stream-service"



// GSAP Animated Bento Card wrapper
function BentoCard({
  children,
  className = "",
}: {
  children: React.ReactNode
  className?: string
  delay?: number
}) {
  return (
    <div
      className={`gsap-card bg-[var(--bg-secondary)]/80 backdrop-blur-xl rounded-2xl border border-[var(--border-light)] overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1 ${className}`}
    >
      {children}
    </div>
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
  const [posts, setPosts] = useState<PostData[]>([])
  const [isFeedLoading, setIsFeedLoading] = useState(true)

  // Fetch OTP data for dashboard metrics
  const { data: otpData, isLoading } = useHSEPrograms({
    region: 'indonesia',
    base: 'all',
    category: 'otp',
    year: 2026
  })

  // Get user data for PostComposer
  const { user } = useAdmin()
  const userName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'User'
  const userAvatar = user?.user_metadata?.avatar_url || user?.user_metadata?.picture

  useEffect(() => {
    setSettings(loadSettings())
    const handleSettingsChange = () => setSettings(loadSettings())
    window.addEventListener('settingsChanged', handleSettingsChange)

    // Initial feed fetch
    fetchPosts()

    return () => window.removeEventListener('settingsChanged', handleSettingsChange)
  }, [])

  const fetchPosts = async () => {
    try {
      if (!streamService.isConnected()) {
        await streamService.connect()
      }

      const activities = await streamService.getTimelineActivities({ refresh: true }) as any[]

      const mappedPosts: PostData[] = activities.map(activity => ({
        id: activity.id,
        author: activity.actor?.data?.name || activity.actor?.id || 'Unknown',
        authorAvatar: activity.actor?.data?.image || activity.actor?.data?.picture,
        authorRole: 'Team Member', // Default role
        time: new Date(activity.time).toLocaleDateString(),
        content: activity.content || activity.object,
        category: activity.category,
        likes: activity.reaction_counts?.like || 0,
        comments: [], // Comments would need separate fetch or enrichment
        shares: 0,
        media: activity.attachments?.map((url: string) => ({
          type: url.match(/\.(mp4|mov|webm)$/i) ? 'video' : 'image',
          url: url
        })) || []
      }))

      setPosts(mappedPosts)
    } catch (error) {
      console.error("Failed to fetch posts:", error)
    } finally {
      setIsFeedLoading(false)
    }
  }

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
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 pb-20 md:pb-0">
        {/* Main Content */}
        <div className="xl:col-span-9 space-y-6 min-w-0">
          {/* Hero Header with Company Branding */}
          <div className="relative rounded-2xl overflow-hidden bg-[var(--bg-secondary)] shadow-lg">
            {/* Hero Banner Image with Gradient Overlay */}
            {settings?.heroBannerImage ? (
              <div className="absolute inset-0">
                <img
                  src={settings.heroBannerImage}
                  alt="Hero Banner"
                  className="w-full h-full object-cover"
                />
                {/* Theme-colored gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-[var(--ocean-start)]/90 via-[var(--ocean-end)]/80 to-[var(--accent-blue)]/70" />
              </div>
            ) : (
              /* Default gradient when no banner */
              <div className="absolute inset-0 bg-gradient-to-r from-[var(--ocean-start)] via-[var(--ocean-end)] to-[var(--accent-blue)]/50" />
            )}

            {/* Content over banner */}
            <div className="relative z-10 p-6 md:p-8">
              <div className="flex items-center gap-4">
                {/* Company Logo */}
                {settings?.companyLogo && (
                  <div className="w-16 h-16 md:w-20 md:h-20 bg-white/90 rounded-xl shadow-lg flex items-center justify-center p-2 backdrop-blur-sm shrink-0">
                    <img
                      src={settings.companyLogo}
                      alt="Company Logo"
                      className="w-full h-full object-contain"
                    />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  {/* Company Name */}
                  {settings?.companyName && (
                    <p className={`text-sm md:text-base font-semibold mb-1 truncate ${settings?.heroBannerImage ? 'text-white/90' : 'text-white'}`}>
                      {settings.companyName}
                    </p>
                  )}

                  {/* HSE Dashboard Title */}
                  <h1 className={`text-2xl md:text-3xl font-bold ${settings?.heroBannerImage ? 'text-white' : 'text-white'}`}>
                    {settings?.language === 'id' ? 'Dashboard HSE' : 'HSE Dashboard'}
                  </h1>
                  <p className={`text-sm ${settings?.heroBannerImage ? 'text-white/80' : 'text-white/90'}`}>
                    {settings?.language === 'id' ? 'Ikhtisar Eksekutif' : 'Executive Overview'} • 2026
                  </p>
                </div>

                {/* Right side - Quick Stats Badge */}
                <div className="hidden md:flex items-center gap-3">
                  <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2 text-center">
                    <p className="text-2xl font-bold text-white">{isLoading ? '...' : metrics.compliance}%</p>
                    <p className="text-xs text-white/80">Compliance</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* AI Safety Consultant */}
          <div className="mb-2">
            <AIConsultant />
          </div>

          {/* HSE Feed - Share Updates */}


          {/* Tremor Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            <BentoCard delay={0}>
              <Card className="!bg-transparent !shadow-none !ring-0 !p-3 md:!p-6">
                <Flex alignItems="start">
                  <div>
                    <Text className="text-xs md:text-sm">Compliance Score</Text>
                    <Metric className="text-lg md:text-2xl">{isLoading ? '...' : `${metrics.compliance}%`}</Metric>
                  </div>
                  <BadgeDelta deltaType={metrics.trend >= 0 ? "increase" : "decrease"} size="xs">
                    {metrics.trend >= 0 ? '+' : ''}{metrics.trend}%
                  </BadgeDelta>
                </Flex>
              </Card>
            </BentoCard>

            <BentoCard delay={0.05}>
              <Card className="!bg-transparent !shadow-none !ring-0 !p-3 md:!p-6">
                <Text className="text-xs md:text-sm">Total Programs</Text>
                <Metric className="text-lg md:text-2xl">{isLoading ? '...' : otpData?.programs.length || 0}</Metric>
                <Text className="mt-1 text-[10px] md:text-xs">Active OTP programs</Text>
              </Card>
            </BentoCard>

            <BentoCard delay={0.1}>
              <Card className="!bg-transparent !shadow-none !ring-0 !p-3 md:!p-6">
                <Text className="text-xs md:text-sm">Completed</Text>
                <Metric className="text-[#10b981] text-lg md:text-2xl">
                  {isLoading ? '...' : otpData?.programs.filter(p => p.progress === 100).length || 0}
                </Metric>
                <Text className="mt-1 text-[10px] md:text-xs">100% progress</Text>
              </Card>
            </BentoCard>

            <BentoCard delay={0.15}>
              <Card className="!bg-transparent !shadow-none !ring-0 !p-3 md:!p-6">
                <Text className="text-xs md:text-sm">Action Required</Text>
                <Metric className="text-[#ef4444] text-lg md:text-2xl">
                  {isLoading ? '...' : metrics.overdue.length}
                </Metric>
                <Text className="mt-1 text-[10px] md:text-xs">Overdue items</Text>
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
              <div key={action.href} className="gsap-card">
                <Link
                  href={action.href}
                  className="flex items-center gap-3 p-4 bg-[var(--bg-secondary)]/60 backdrop-blur rounded-xl border border-[var(--border-light)] hover:bg-[var(--bg-tertiary)] transition-all hover:-translate-y-1 group"
                >
                  <div className={`w-10 h-10 rounded-xl bg-[var(--${action.color})]/10 flex items-center justify-center`}>
                    <action.icon className={`w-5 h-5 text-[var(--${action.color})]`} />
                  </div>
                  <span className="flex-1 font-medium text-sm text-[var(--text-primary)]">{action.title}</span>
                  <ChevronRight className="w-4 h-4 text-[var(--text-muted)] group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            ))}
          </div>

          {/* HSE Feed - Share Updates */}
          <div className="mb-4 space-y-4">
            <PostComposer
              userName={userName}
              userAvatar={userAvatar}
              onPost={async (content, category, files) => {
                try {
                  await streamService.connect()
                  await streamService.post({ content, category, files })

                  // Sync to Google Calendar for eligible categories
                  const syncCategories = ['observation', 'incident', 'near_miss', 'toolbox_talk']
                  if (syncCategories.includes(category)) {
                    try {
                      await fetch('/api/calendar/create', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          title: `${category.replace('_', ' ').toUpperCase()} Report`,
                          description: content,
                          category
                        })
                      })
                    } catch {
                      // Silent fail for calendar sync
                    }
                  }

                  // Refresh feed immediately after posting
                  await new Promise(resolve => setTimeout(resolve, 800))
                  await fetchPosts()
                } catch {
                  // Silent fail
                }
              }}
            />

            {/* Feed List */}
            {isFeedLoading ? (
              <div className="space-y-4">
                {[1, 2].map(i => (
                  <SkeletonPulse key={i} className="h-48 rounded-2xl" />
                ))}
              </div>
            ) : posts.length > 0 ? (
              <div className="space-y-4">
                {posts.map(post => (
                  <PostCard
                    key={post.id}
                    post={post}
                    canDelete={user?.email === 'ade.basirwfrd@gmail.com' || post.author === userName}
                    onDelete={async (postId) => {
                      try {
                        const success = await streamService.deleteActivity(postId)
                        if (success) {
                          setPosts(prev => prev.filter(p => p.id !== postId))
                        } else {
                          alert('Failed to delete post')
                        }
                      } catch (error) {
                        console.error('Delete error:', error)
                        alert('Error deleting post')
                      }
                    }}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-[var(--text-muted)] bg-[var(--bg-secondary)]/50 rounded-2xl">
                <p>No updates yet. Be the first to post!</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar - Bottom on mobile/tablet, Right on Desktop */}
        <div className="xl:col-span-3 space-y-6">
          <RightSidebar />
        </div>
      </div>
    </AppShell>
  )
}
