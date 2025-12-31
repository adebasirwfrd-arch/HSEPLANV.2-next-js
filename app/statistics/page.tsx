"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { gsap } from "gsap"
import { useGSAP } from "@gsap/react"
import { AppShell } from "@/components/layout/app-shell"
import { GlassCard } from "@/components/ui/glass-card"
import { AreaChartComponent } from "@/components/charts/area-chart"
import { BarChartComponent } from "@/components/charts/bar-chart"
import { DonutChart } from "@/components/charts/donut-chart"
import { ProgressBar } from "@/components/charts/progress-bar"
import { ProgressRing } from "@/components/dashboard/progress-ring"
import { cn } from "@/lib/utils"
import { Download, RefreshCw, TrendingUp, AlertTriangle, CheckCircle, Target, BarChart3, FileText, ExternalLink } from "lucide-react"
import {
    generateStatistics,
    downloadCSVReport,
    StatsFilters
} from "@/lib/statistics-store"

gsap.registerPlugin(useGSAP)

type PeriodView = 'monthly' | 'quarterly' | 'semester' | 'annual'

const regionOptions = [
    { value: "all", label: "🌍 All Regions" },
    { value: "indonesia", label: "🇮🇩 Indonesia" },
    { value: "asia", label: "🌏 Asia" },
]

const baseOptions = [
    { value: "all", label: "All Bases" },
    { value: "narogong", label: "Narogong" },
    { value: "balikpapan", label: "Balikpapan" },
    { value: "duri", label: "Duri" },
]

const sourceOptions = [
    { value: "all", label: "All Sources" },
    { value: "otp", label: "🎯 OTP" },
    { value: "matrix", label: "📊 Matrix" },
]

const matrixCategoryOptions = [
    { value: "all", label: "All Categories" },
    { value: "audit", label: "📋 Audit" },
    { value: "training", label: "📚 Training" },
    { value: "meeting", label: "🤝 Meeting" },
    { value: "drill", label: "🚨 Drill" },
]

const periodOptions: { value: PeriodView; label: string }[] = [
    { value: "monthly", label: "Monthly" },
    { value: "quarterly", label: "Quarterly" },
    { value: "semester", label: "Semester" },
    { value: "annual", label: "Annual" },
]

// Animated Counter Component
function AnimatedCounter({ value, duration = 1.5, suffix = "" }: { value: number; duration?: number; suffix?: string }) {
    const countRef = useRef<HTMLSpanElement>(null)
    const [displayed, setDisplayed] = useState(0)

    useEffect(() => {
        const element = countRef.current
        if (!element) return

        gsap.to({ val: 0 }, {
            val: value,
            duration,
            ease: "power2.out",
            onUpdate: function () {
                setDisplayed(Math.round(this.targets()[0].val))
            }
        })
    }, [value, duration])

    return <span ref={countRef}>{displayed}{suffix}</span>
}

export default function StatisticsPage() {
    const router = useRouter()
    const containerRef = useRef<HTMLDivElement>(null)
    const [filters, setFilters] = useState<StatsFilters>({
        region: 'all',
        base: 'all',
        source: 'all',
        category: 'all'
    })
    const [periodView, setPeriodView] = useState<PeriodView>('monthly')
    const [stats, setStats] = useState<ReturnType<typeof generateStatistics> | null>(null)
    const [year, setYear] = useState(2026)

    // GSAP entrance animations
    useGSAP(() => {
        if (!containerRef.current) return

        gsap.fromTo(
            ".stats-card",
            { opacity: 0, y: 30 },
            {
                opacity: 1,
                y: 0,
                duration: 0.6,
                stagger: 0.1,
                ease: "power3.out"
            }
        )
    }, { scope: containerRef, dependencies: [stats] })

    // Load statistics
    useEffect(() => {
        const data = generateStatistics(filters)
        setStats(data)
    }, [filters])

    // Refresh data
    const handleRefresh = () => {
        const data = generateStatistics(filters)
        setStats(data)
    }

    // Download report
    const handleDownload = () => {
        if (stats) {
            downloadCSVReport(stats, filters)
        }
    }

    // Navigation handlers
    const navigateToOTP = () => router.push('/otp')
    const navigateToMatrix = () => router.push('/matrix')
    const navigateToPrograms = () => router.push('/hse-programs')

    if (!stats) {
        return (
            <AppShell>
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin w-8 h-8 border-4 border-[var(--accent-blue)] border-t-transparent rounded-full" />
                </div>
            </AppShell>
        )
    }

    const { overall, monthly, quarterly, semester, byCategory, byBase, completionTrend } = stats

    // Prepare chart data
    const trendChartData = completionTrend.map(d => ({ name: d.label, value: d.value }))

    const categoryChartData = byCategory.map(c => ({
        name: c.label.replace(/[^\w\s]/g, '').trim(),
        value: c.total,
        color: c.color
    }))

    const statusData = [
        { name: "Completed", value: overall.completed, color: "#55EFC4" },
        { name: "In Progress", value: overall.inProgress, color: "#74B9FF" },
        { name: "Overdue", value: overall.overdue, color: "#FF7675" },
    ]

    const progressSegments = [
        { value: overall.completed, color: "#55EFC4", label: "Completed" },
        { value: overall.inProgress, color: "#74B9FF", label: "In Progress" },
        { value: overall.overdue, color: "#FF7675", label: "Overdue" },
    ]

    // Get period data
    const getPeriodData = () => {
        switch (periodView) {
            case 'quarterly': return quarterly.map(q => ({ name: q.period, value: q.completed }))
            case 'semester': return semester.map(s => ({ name: s.period, value: s.completed }))
            case 'annual': return [{ name: String(year), value: overall.completed }]
            default: return monthly.map(m => ({ name: m.label, value: m.completed }))
        }
    }

    const periodData = getPeriodData()

    // Calculate rates for display
    const otpRate = overall.otpCount > 0 ? Math.round((overall.otpCompleted / overall.otpCount) * 100) : 0
    const matrixRate = overall.matrixCount > 0 ? Math.round((overall.matrixCompleted / overall.matrixCount) * 100) : 0

    return (
        <AppShell>
            <div ref={containerRef} className="space-y-6">
                {/* Header */}
                <div className="stats-card flex items-center gap-3">
                    <div className="w-14 h-14 bg-gradient-to-br from-[var(--ocean-start)] to-[var(--accent-blue)] rounded-2xl flex items-center justify-center shadow-lg">
                        <BarChart3 className="w-7 h-7 text-white" />
                    </div>
                    <div className="flex-1">
                        <h1 className="text-2xl font-bold text-[var(--text-primary)]">HSE Analytics</h1>
                        <p className="text-sm text-[var(--text-muted)]">Comprehensive OTP & Matrix Statistics</p>
                    </div>
                    <button
                        onClick={handleRefresh}
                        className="p-3 rounded-xl transition-all hover:scale-105 active:scale-95"
                        style={{ background: 'var(--glass-white)' }}
                        title="Refresh"
                    >
                        <RefreshCw className="w-5 h-5 text-[var(--text-secondary)]" />
                    </button>
                    <button
                        onClick={handleDownload}
                        className="p-3 bg-gradient-to-br from-[var(--accent-blue)] to-[var(--ocean-start)] text-white rounded-xl shadow-lg transition-all hover:scale-105 active:scale-95"
                        title="Download Report"
                    >
                        <Download className="w-5 h-5" />
                    </button>
                </div>

                {/* Filter Bar */}
                <GlassCard className="stats-card p-4">
                    <div className="flex flex-wrap gap-3">
                        {[
                            { value: filters.region, onChange: (v: string) => setFilters(f => ({ ...f, region: v })), options: regionOptions, disabled: false },
                            { value: filters.base, onChange: (v: string) => setFilters(f => ({ ...f, base: v })), options: baseOptions, disabled: filters.region === 'asia' },
                            { value: filters.source, onChange: (v: string) => setFilters(f => ({ ...f, source: v })), options: sourceOptions, disabled: false },
                            { value: filters.category, onChange: (v: string) => setFilters(f => ({ ...f, category: v })), options: matrixCategoryOptions, disabled: filters.source === 'otp' },
                        ].map((filter, i) => (
                            <select
                                key={i}
                                value={filter.value}
                                onChange={(e) => filter.onChange(e.target.value)}
                                disabled={filter.disabled}
                                className={cn(
                                    "px-4 py-2.5 rounded-xl text-sm font-medium border-0 transition-all hover:scale-[1.02]",
                                    filter.disabled ? "opacity-50" : ""
                                )}
                                style={{ background: 'var(--glass-white)' }}
                            >
                                {filter.options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                            </select>
                        ))}
                        <select
                            value={year}
                            onChange={(e) => setYear(parseInt(e.target.value))}
                            className="px-4 py-2.5 rounded-xl text-sm font-medium border-0 transition-all hover:scale-[1.02]"
                            style={{ background: 'var(--glass-white)' }}
                        >
                            {[2024, 2025, 2026, 2027, 2028, 2029, 2030].map(y => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>
                    </div>
                </GlassCard>

                {/* Bento Grid - KPI Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Total - Glass Card */}
                    <GlassCard className="stats-card p-5 hover:scale-[1.02] transition-all cursor-pointer" onClick={navigateToPrograms}>
                        <div className="flex items-center gap-2 mb-3">
                            <Target className="w-5 h-5 text-[var(--accent-blue)]" />
                            <span className="text-xs font-medium text-[var(--text-muted)]">Total Plan</span>
                        </div>
                        <div className="text-3xl font-bold text-[var(--text-primary)]">
                            <AnimatedCounter value={overall.total} />
                        </div>
                        <div className="text-[11px] text-[var(--text-muted)] mt-1">Activities planned</div>
                    </GlassCard>

                    {/* Hero Card - Completion Rate */}
                    <div className="stats-card p-5 rounded-2xl bg-gradient-to-br from-[var(--success-color)] to-[#059669] text-white shadow-lg hover:scale-[1.02] transition-all cursor-pointer" onClick={navigateToPrograms}>
                        <div className="flex items-center gap-2 mb-3 opacity-90">
                            <CheckCircle className="w-5 h-5" />
                            <span className="text-xs font-medium">Completion Rate</span>
                        </div>
                        <div className="text-4xl font-bold">
                            <AnimatedCounter value={overall.completionRate} suffix="%" />
                        </div>
                        <div className="text-[11px] opacity-80 mt-1">{overall.completed} completed</div>
                    </div>

                    {/* In Progress */}
                    <GlassCard className="stats-card p-5 hover:scale-[1.02] transition-all cursor-pointer" onClick={navigateToPrograms}>
                        <div className="flex items-center gap-2 mb-3">
                            <TrendingUp className="w-5 h-5 text-[#74B9FF]" />
                            <span className="text-xs font-medium text-[var(--text-muted)]">In Progress</span>
                        </div>
                        <div className="text-3xl font-bold text-[var(--text-primary)]">
                            <AnimatedCounter value={overall.inProgress} />
                        </div>
                        <div className="text-[11px] text-[var(--text-muted)] mt-1">Remaining tasks</div>
                    </GlassCard>

                    {/* Overdue */}
                    <GlassCard className="stats-card p-5 hover:scale-[1.02] transition-all cursor-pointer" onClick={navigateToPrograms}>
                        <div className="flex items-center gap-2 mb-3">
                            <AlertTriangle className="w-5 h-5 text-[#FF7675]" />
                            <span className="text-xs font-medium text-[var(--text-muted)]">Overdue</span>
                        </div>
                        <div className="text-3xl font-bold text-[#FF7675]">
                            <AnimatedCounter value={overall.overdue} />
                        </div>
                        <div className="text-[11px] text-[var(--text-muted)] mt-1">Need attention</div>
                    </GlassCard>
                </div>

                {/* Period Toggle */}
                <div className="stats-card flex gap-1 p-1.5 rounded-xl w-fit" style={{ background: 'var(--glass-white)' }}>
                    {periodOptions.map(p => (
                        <button
                            key={p.value}
                            onClick={() => setPeriodView(p.value)}
                            className={cn(
                                "px-5 py-2.5 rounded-lg text-sm font-medium transition-all",
                                periodView === p.value
                                    ? "bg-gradient-to-r from-[var(--accent-blue)] to-[var(--ocean-start)] text-white shadow-md"
                                    : "text-[var(--text-secondary)] hover:bg-white/50"
                            )}
                        >
                            {p.label}
                        </button>
                    ))}
                </div>

                {/* Charts Grid - Bento Style */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Completion Trend - Area Chart */}
                    <GlassCard className="stats-card p-6 hover:shadow-lg transition-all cursor-pointer" onClick={navigateToPrograms}>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-[var(--text-primary)]">📈 Completion Trend</h3>
                            <ExternalLink className="w-4 h-4 text-[var(--text-muted)]" />
                        </div>
                        <AreaChartComponent
                            data={trendChartData}
                            color="#55EFC4"
                            height={220}
                        />
                    </GlassCard>

                    {/* Period Breakdown - Bar Chart */}
                    <GlassCard className="stats-card p-6 hover:shadow-lg transition-all cursor-pointer" onClick={navigateToPrograms}>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-[var(--text-primary)]">📊 {periodView.charAt(0).toUpperCase() + periodView.slice(1)} Breakdown</h3>
                            <ExternalLink className="w-4 h-4 text-[var(--text-muted)]" />
                        </div>
                        <BarChartComponent
                            data={periodData}
                            gradientColors={['#74B9FF', '#0984E3']}
                            height={220}
                        />
                    </GlassCard>

                    {/* Status Distribution - Donut Chart */}
                    <GlassCard className="stats-card p-6 hover:shadow-lg transition-all cursor-pointer" onClick={navigateToPrograms}>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-[var(--text-primary)]">🍩 Status Distribution</h3>
                            <ExternalLink className="w-4 h-4 text-[var(--text-muted)]" />
                        </div>
                        <DonutChart
                            data={statusData}
                            centerValue={overall.total}
                            centerLabel="Total"
                        />
                        <div className="flex flex-wrap justify-center gap-4 mt-4">
                            {statusData.map((item, index) => (
                                <div key={index} className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                                    <span className="text-sm text-[var(--text-secondary)]">{item.name}: {item.value}</span>
                                </div>
                            ))}
                        </div>
                    </GlassCard>

                    {/* Category Breakdown - Bar Chart */}
                    <GlassCard className="stats-card p-6 hover:shadow-lg transition-all cursor-pointer" onClick={navigateToMatrix}>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-[var(--text-primary)]">📋 Category Breakdown</h3>
                            <ExternalLink className="w-4 h-4 text-[var(--text-muted)]" />
                        </div>
                        <BarChartComponent
                            data={categoryChartData}
                            barColor="#74B9FF"
                            height={220}
                        />
                    </GlassCard>
                </div>

                {/* Progress Overview */}
                <GlassCard className="stats-card p-6 hover:shadow-lg transition-all">
                    <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">🎯 Implementation Progress</h2>
                    <ProgressBar segments={progressSegments} height={32} />
                </GlassCard>

                {/* Program Progress Rings */}
                <GlassCard className="stats-card p-6 hover:shadow-lg transition-all">
                    <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-6">🏭 Base Performance</h3>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                        {byBase.length > 0 ? byBase.map((base, i) => (
                            <div key={base.category} className="flex flex-col items-center cursor-pointer hover:scale-105 transition-all" onClick={navigateToOTP}>
                                <ProgressRing
                                    value={base.completionRate}
                                    size={100}
                                    color={base.color}
                                    label={`${base.completionRate}%`}
                                />
                                <p className="mt-2 text-sm font-medium text-[var(--text-primary)]">{base.label.replace(/[^\w\s]/g, '').trim()}</p>
                                <p className="text-xs text-[var(--text-muted)]">{base.completed}/{base.total}</p>
                            </div>
                        )) : (
                            <div className="col-span-4 text-center text-[var(--text-muted)] py-8">
                                No base data available. Visit OTP or Matrix screens to load data.
                            </div>
                        )}
                    </div>
                </GlassCard>

                {/* OTP vs Matrix Comparison */}
                <div className="grid grid-cols-2 gap-4">
                    <GlassCard className="stats-card p-5 hover:scale-[1.02] transition-all cursor-pointer" onClick={navigateToOTP}>
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-[#3498db] to-[#2980b9] rounded-xl flex items-center justify-center">
                                <span className="text-lg">🎯</span>
                            </div>
                            <div>
                                <div className="text-sm font-medium text-[var(--text-muted)]">OTP Programs</div>
                                <div className="text-2xl font-bold text-[var(--text-primary)]">
                                    <AnimatedCounter value={overall.otpCount} />
                                </div>
                            </div>
                            <ExternalLink className="w-4 h-4 text-[var(--text-muted)] ml-auto" />
                        </div>
                        <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'var(--glass-white)' }}>
                            <div
                                className="h-full bg-gradient-to-r from-[#3498db] to-[#2ecc71] rounded-full transition-all duration-1000"
                                style={{ width: `${otpRate}%` }}
                            />
                        </div>
                        <div className="text-xs text-[var(--text-muted)] mt-2">
                            {overall.otpCompleted} completed ({otpRate}%)
                        </div>
                    </GlassCard>

                    <GlassCard className="stats-card p-5 hover:scale-[1.02] transition-all cursor-pointer" onClick={navigateToMatrix}>
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-[#9b59b6] to-[#8e44ad] rounded-xl flex items-center justify-center">
                                <span className="text-lg">📊</span>
                            </div>
                            <div>
                                <div className="text-sm font-medium text-[var(--text-muted)]">Matrix Programs</div>
                                <div className="text-2xl font-bold text-[var(--text-primary)]">
                                    <AnimatedCounter value={overall.matrixCount} />
                                </div>
                            </div>
                            <ExternalLink className="w-4 h-4 text-[var(--text-muted)] ml-auto" />
                        </div>
                        <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'var(--glass-white)' }}>
                            <div
                                className="h-full bg-gradient-to-r from-[#9b59b6] to-[#e74c3c] rounded-full transition-all duration-1000"
                                style={{ width: `${matrixRate}%` }}
                            />
                        </div>
                        <div className="text-xs text-[var(--text-muted)] mt-2">
                            {overall.matrixCompleted} completed ({matrixRate}%)
                        </div>
                    </GlassCard>
                </div>

                {/* Quick Summary Footer */}
                <div className="stats-card p-5 rounded-2xl" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                    <div className="flex items-center gap-3 mb-3">
                        <FileText className="w-5 h-5 text-white" />
                        <span className="font-semibold text-white text-lg">Quick Summary</span>
                    </div>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                        <div className="flex items-center gap-2 cursor-pointer hover:scale-105 transition-all bg-white/20 rounded-lg p-3" onClick={navigateToOTP}>
                            <TrendingUp className="w-5 h-5 text-green-300" />
                            <div>
                                <div className="text-white/70 text-xs">OTP Rate</div>
                                <div className="text-white font-bold text-lg">{otpRate}%</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 cursor-pointer hover:scale-105 transition-all bg-white/20 rounded-lg p-3" onClick={navigateToMatrix}>
                            <TrendingUp className="w-5 h-5 text-purple-300" />
                            <div>
                                <div className="text-white/70 text-xs">Matrix Rate</div>
                                <div className="text-white font-bold text-lg">{matrixRate}%</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 bg-white/20 rounded-lg p-3">
                            <CheckCircle className="w-5 h-5 text-green-300" />
                            <div>
                                <div className="text-white/70 text-xs">Completed</div>
                                <div className="text-white font-bold text-lg">{overall.completed}</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 bg-white/20 rounded-lg p-3">
                            <AlertTriangle className="w-5 h-5 text-orange-300" />
                            <div>
                                <div className="text-white/70 text-xs">Overdue</div>
                                <div className="text-white font-bold text-lg">{overall.overdue}</div>
                            </div>
                        </div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-white/20 text-xs text-white/80 flex items-center gap-2">
                        <span>📊</span>
                        <span>Data from <strong className="text-white">{stats.programCounts.otpPrograms}</strong> OTP programs + <strong className="text-white">{stats.programCounts.matrixPrograms}</strong> Matrix programs</span>
                    </div>
                </div>
            </div>
        </AppShell>
    )
}
