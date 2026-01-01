"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useHSEPrograms } from "@/hooks/useHSEPrograms"
import { loadKPIYear } from "@/lib/kpi-store"
import { loadTasks } from "@/lib/tasks-store"
import { loadLLData } from "@/lib/ll-indicator-store"
import { GlassCard } from "@/components/ui/glass-card"
import type { DashboardSnapshot, AIAnalysisResult } from "@/types/ai-analytics"
import {
    Bot,
    Sparkles,
    AlertTriangle,
    CheckCircle,
    TrendingUp,
    RefreshCw,
    ChevronDown,
    ChevronUp,
    Zap
} from "lucide-react"

export function AIConsultant() {
    const [isLoading, setIsLoading] = useState(false)
    const [analysis, setAnalysis] = useState<AIAnalysisResult | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [expanded, setExpanded] = useState(true)
    const [kpiData, setKpiData] = useState({ manHours: 0, trir: 0, incidents: 0 })
    const [taskData, setTaskData] = useState({ open: 0, completed: 0 })
    const [llData, setLLData] = useState({ ratio: "1:0" })

    // Fetch OTP data
    const { data: otpData, isLoading: otpLoading } = useHSEPrograms({
        region: 'indonesia',
        base: 'all',
        category: 'otp',
        year: 2026
    })

    // Matrix data state (calculated from programs)
    const [matrixData, setMatrixData] = useState({ compliance: 0, totalPrograms: 0 })
    const matrixLoading = false // No separate fetch needed

    // Load localStorage data on mount
    useEffect(() => {
        // KPI Data
        const kpi = loadKPIYear(2025)
        const trirMetric = kpi.metrics.find(m => m.name.toLowerCase().includes('trir'))
        const incidentMetric = kpi.metrics.find(m => m.name.toLowerCase().includes('incident'))
        setKpiData({
            manHours: kpi.manHours,
            trir: trirMetric?.result || 0,
            incidents: incidentMetric?.result || 0
        })

        // Task Data
        const tasks = loadTasks()
        setTaskData({
            open: tasks.filter(t => t.status !== 'Completed').length,
            completed: tasks.filter(t => t.status === 'Completed').length
        })

        // LL Data - use correct data structure (lagging/leading arrays)
        const ll = loadLLData(2025)
        if (ll) {
            const leadingCount = ll.leading?.length || 0
            const laggingCount = ll.lagging?.length || 0
            setLLData({ ratio: `${leadingCount || 1}:${laggingCount || 0}` })
        }
    }, [])

    // Gather all data into a snapshot
    const gatherData = useCallback((): DashboardSnapshot => {
        // Calculate OTP compliance and overdue items
        let otpCompliance = 0
        let overdueCount = 0
        const criticalItems: string[] = []

        if (otpData?.programs) {
            const totalProgress = otpData.programs.reduce((sum, p) => sum + (p.progress || 0), 0)
            otpCompliance = otpData.programs.length > 0 ? Math.round(totalProgress / otpData.programs.length) : 0

            // Find overdue items
            const currentMonth = new Date().getMonth()
            const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']

            otpData.programs.forEach(prog => {
                months.slice(0, currentMonth + 1).forEach(month => {
                    const data = prog.months[month]
                    if (data && data.plan > 0 && data.actual === 0) {
                        overdueCount++
                        if (criticalItems.length < 3) {
                            criticalItems.push(prog.name)
                        }
                    }
                })
            })
        }

        // Matrix data is already calculated in state
        const matrixCompliance = matrixData.compliance
        const matrixTotal = matrixData.totalPrograms

        return {
            otp: {
                compliance: otpCompliance,
                overdueCount,
                criticalItems
            },
            matrix: {
                compliance: matrixCompliance,
                totalPrograms: matrixTotal
            },
            kpi: kpiData,
            tasks: taskData,
            llIndicators: llData
        }
    }, [otpData, matrixData, kpiData, taskData, llData])

    // Handle analyze button click
    const handleAnalyze = async () => {
        setIsLoading(true)
        setError(null)

        try {
            const snapshot = gatherData()

            const response = await fetch('/api/ai-insight', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: snapshot })
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || 'Failed to get AI analysis')
            }

            const result: AIAnalysisResult = await response.json()
            setAnalysis(result)
            setExpanded(true)
        } catch (err: any) {
            setError(err.message || 'An error occurred')
        } finally {
            setIsLoading(false)
        }
    }

    // Get score color
    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-[#10b981]'
        if (score >= 50) return 'text-[#f59e0b]'
        return 'text-[#ef4444]'
    }

    const getToneIcon = (tone: string) => {
        switch (tone) {
            case 'good': return <CheckCircle className="w-5 h-5 text-[#10b981]" />
            case 'warning': return <AlertTriangle className="w-5 h-5 text-[#f59e0b]" />
            case 'critical': return <AlertTriangle className="w-5 h-5 text-[#ef4444]" />
            default: return <Bot className="w-5 h-5 text-[var(--accent-blue)]" />
        }
    }

    const isDataLoading = otpLoading || matrixLoading

    return (
        <GlassCard className="overflow-hidden">
            {/* Header */}
            <div
                className="p-4 flex items-center justify-between cursor-pointer hover:bg-[var(--bg-tertiary)]/50 transition-colors"
                onClick={() => analysis && setExpanded(!expanded)}
            >
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] rounded-xl flex items-center justify-center">
                        <Bot className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-[var(--text-primary)] flex items-center gap-2">
                            AI Safety Consultant
                            <Sparkles className="w-4 h-4 text-[#f59e0b]" />
                        </h3>
                        <p className="text-xs text-[var(--text-muted)]">
                            {analysis ? 'Analysis Complete' : 'Powered by GPT-4o'}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {analysis && (
                        <div className="flex items-center gap-1 mr-2">
                            {getToneIcon(analysis.tone)}
                            <span className={`text-lg font-bold ${getScoreColor(analysis.score)}`}>
                                {analysis.score}
                            </span>
                        </div>
                    )}

                    {!analysis ? (
                        <button
                            onClick={(e) => { e.stopPropagation(); handleAnalyze() }}
                            disabled={isLoading || isDataLoading}
                            className="px-4 py-2 bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-white rounded-lg text-sm font-semibold flex items-center gap-2 disabled:opacity-50 hover:shadow-lg hover:shadow-purple-500/20 transition-all"
                        >
                            {isLoading ? (
                                <>
                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                    Analyzing...
                                </>
                            ) : isDataLoading ? (
                                <>
                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                    Loading Data...
                                </>
                            ) : (
                                <>
                                    <Zap className="w-4 h-4" />
                                    Analyze Dashboard
                                </>
                            )}
                        </button>
                    ) : (
                        <>
                            <button
                                onClick={(e) => { e.stopPropagation(); handleAnalyze() }}
                                disabled={isLoading}
                                className="p-2 hover:bg-[var(--bg-tertiary)] rounded-lg transition-colors"
                                title="Re-analyze"
                            >
                                <RefreshCw className={`w-4 h-4 text-[var(--text-muted)] ${isLoading ? 'animate-spin' : ''}`} />
                            </button>
                            {expanded ? (
                                <ChevronUp className="w-4 h-4 text-[var(--text-muted)]" />
                            ) : (
                                <ChevronDown className="w-4 h-4 text-[var(--text-muted)]" />
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Error State */}
            {error && (
                <div className="px-4 pb-4">
                    <div className="p-3 bg-[var(--danger-color)]/10 rounded-lg text-sm text-[var(--danger-color)] flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" />
                        {error}
                    </div>
                </div>
            )}

            {/* Analysis Results */}
            <AnimatePresence>
                {analysis && expanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                    >
                        <div className="p-4 pt-0 space-y-4">
                            {/* Score Card */}
                            <div className={`p-4 rounded-xl ${analysis.tone === 'good' ? 'bg-[#10b981]/10' :
                                analysis.tone === 'warning' ? 'bg-[#f59e0b]/10' :
                                    'bg-[#ef4444]/10'
                                }`}>
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-sm font-medium text-[var(--text-secondary)]">Safety Health Score</span>
                                    <span className={`text-3xl font-bold ${getScoreColor(analysis.score)}`}>
                                        {analysis.score}/100
                                    </span>
                                </div>
                                <div className="w-full h-2 bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${analysis.score}%` }}
                                        transition={{ duration: 1, ease: 'easeOut' }}
                                        className={`h-full rounded-full ${analysis.tone === 'good' ? 'bg-[#10b981]' :
                                            analysis.tone === 'warning' ? 'bg-[#f59e0b]' :
                                                'bg-[#ef4444]'
                                            }`}
                                    />
                                </div>
                            </div>

                            {/* Executive Summary */}
                            <div>
                                <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-2 flex items-center gap-2">
                                    <TrendingUp className="w-4 h-4 text-[var(--accent-blue)]" />
                                    Executive Summary
                                </h4>
                                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                                    {analysis.summary}
                                </p>
                            </div>

                            {/* Critical Risk */}
                            <div>
                                <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-2 flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4 text-[#f59e0b]" />
                                    Primary Risk
                                </h4>
                                <p className="text-sm text-[var(--text-secondary)] leading-relaxed p-3 bg-[#f59e0b]/10 rounded-lg border-l-4 border-[#f59e0b]">
                                    {analysis.risk}
                                </p>
                            </div>

                            {/* Recommended Actions */}
                            <div>
                                <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-2 flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4 text-[#10b981]" />
                                    Recommended Actions
                                </h4>
                                <ul className="space-y-2">
                                    {analysis.actions.map((action, idx) => (
                                        <motion.li
                                            key={idx}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: idx * 0.1 }}
                                            className="text-sm text-[var(--text-secondary)] flex items-start gap-2 p-2 rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors"
                                        >
                                            <span className="w-5 h-5 bg-[#10b981]/20 text-[#10b981] rounded-full flex items-center justify-center text-xs font-bold shrink-0">
                                                {idx + 1}
                                            </span>
                                            {action}
                                        </motion.li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </GlassCard>
    )
}
