'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, TrendingUp, Users, Award, ChevronRight, Sparkles } from 'lucide-react'
import { loadTasks, type Task } from '@/lib/tasks-store'
import { getOTPData } from '@/lib/otp-store'
import { getMatrixData, type MatrixCategory } from '@/lib/matrix-store'

interface PICPerformance {
    name: string
    email: string
    completedTasks: number
    totalTasks: number
    completedPrograms: number
    totalPrograms: number
    score: number // Overall performance score (0-100)
    rank: number
}

interface LeaderboardProps {
    year?: number
    className?: string
    maxItems?: number
}

// Animated counter hook
function useCountUp(endValue: number, duration: number = 1000): number {
    const [count, setCount] = useState(0)

    useEffect(() => {
        if (endValue === 0) {
            setCount(0)
            return
        }

        const startTime = Date.now()
        const startValue = 0

        const animate = () => {
            const now = Date.now()
            const progress = Math.min((now - startTime) / duration, 1)
            const eased = 1 - Math.pow(1 - progress, 3) // Ease out cubic
            const current = Math.round(startValue + (endValue - startValue) * eased)
            setCount(current)

            if (progress < 1) {
                requestAnimationFrame(animate)
            }
        }

        requestAnimationFrame(animate)
    }, [endValue, duration])

    return count
}

// Get gradient color based on percentage
function getProgressGradient(percentage: number): string {
    if (percentage >= 80) {
        return 'linear-gradient(90deg, #22c55e, #10b981, #34d399)' // Green gradient
    } else if (percentage >= 50) {
        return 'linear-gradient(90deg, #eab308, #facc15, #fde047)' // Yellow gradient
    } else {
        return 'linear-gradient(90deg, #ef4444, #f87171, #fca5a5)' // Red gradient
    }
}

// Animated Progress Bar Component
function AnimatedProgressBar({ percentage, delay = 0 }: { percentage: number; delay?: number }) {
    const animatedPercentage = useCountUp(percentage, 1200)

    return (
        <div className="relative w-full h-2 bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
            <motion.div
                className="h-full rounded-full"
                style={{ background: getProgressGradient(percentage) }}
                initial={{ width: 0 }}
                animate={{ width: `${percentage}%` }}
                transition={{
                    type: 'spring',
                    stiffness: 100,
                    damping: 20,
                    delay: delay
                }}
            />
            <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                initial={{ x: '-100%' }}
                animate={{ x: '200%' }}
                transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    repeatDelay: 2,
                    delay: delay + 0.5
                }}
            />
        </div>
    )
}

// Rank Badge Component
function RankBadge({ rank }: { rank: number }) {
    const badges = [
        { emoji: '🥇', color: 'from-yellow-400 to-orange-500' },
        { emoji: '🥈', color: 'from-gray-300 to-gray-400' },
        { emoji: '🥉', color: 'from-amber-600 to-amber-700' }
    ]

    if (rank <= 3) {
        return (
            <motion.div
                className={`w-8 h-8 rounded-full bg-gradient-to-br ${badges[rank - 1].color} flex items-center justify-center text-lg shadow-lg`}
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 200, damping: 10 }}
            >
                {badges[rank - 1].emoji}
            </motion.div>
        )
    }

    return (
        <motion.div
            className="w-8 h-8 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center text-sm font-bold text-[var(--text-secondary)]"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: rank * 0.1 }}
        >
            {rank}
        </motion.div>
    )
}

export function PICLeaderboardSidebar({ year = new Date().getFullYear(), className = '', maxItems = 5 }: LeaderboardProps) {
    const [isExpanded, setIsExpanded] = useState(false)

    // Calculate PIC performance from tasks and programs
    const leaderboard = useMemo(() => {
        const picMap = new Map<string, PICPerformance>()
        const currentYear = year

        // 1. Process Tasks
        const tasks = loadTasks()
        tasks.forEach(task => {
            // Filter by year - check implementationDate
            const taskDate = new Date(task.implementationDate)
            if (taskDate.getFullYear() !== currentYear) return
            if (!task.picEmail) return

            const key = task.picEmail.toLowerCase()
            const existing = picMap.get(key) || {
                name: task.picName || 'Unknown',
                email: task.picEmail,
                completedTasks: 0,
                totalTasks: 0,
                completedPrograms: 0,
                totalPrograms: 0,
                score: 0,
                rank: 0
            }

            existing.totalTasks++
            if (task.status === 'Completed') {
                existing.completedTasks++
            }

            picMap.set(key, existing)
        })

        // 2. Process OTP Programs
        const bases = ['narogong', 'balikpapan', 'duri'] as const
        const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']

        bases.forEach(base => {
            const otpData = getOTPData('indonesia', base)
            otpData.programs.forEach(prog => {
                months.forEach(month => {
                    const monthData = prog.months[month]
                    if (!monthData?.pic_email) return

                    // Check if plan_date is in current year
                    if (monthData.plan_date) {
                        const planDate = new Date(monthData.plan_date)
                        if (planDate.getFullYear() !== currentYear) return
                    }

                    const key = monthData.pic_email.toLowerCase()
                    const existing = picMap.get(key) || {
                        name: monthData.pic_name || 'Unknown',
                        email: monthData.pic_email,
                        completedTasks: 0,
                        totalTasks: 0,
                        completedPrograms: 0,
                        totalPrograms: 0,
                        score: 0,
                        rank: 0
                    }

                    if (monthData.plan > 0) {
                        existing.totalPrograms += monthData.plan
                        existing.completedPrograms += Math.min(monthData.actual, monthData.plan)
                    }

                    picMap.set(key, existing)
                })
            })
        })

        // 3. Process Matrix Programs
        const categories: MatrixCategory[] = ['audit', 'training', 'drill', 'meeting']

        bases.forEach(base => {
            categories.forEach(category => {
                const matrixData = getMatrixData(category, base)
                matrixData.programs.forEach(prog => {
                    months.forEach(month => {
                        const monthData = prog.months[month]
                        if (!monthData?.pic_email) return

                        // Check if plan_date is in current year
                        if (monthData.plan_date) {
                            const planDate = new Date(monthData.plan_date)
                            if (planDate.getFullYear() !== currentYear) return
                        }

                        const key = monthData.pic_email.toLowerCase()
                        const existing = picMap.get(key) || {
                            name: monthData.pic_name || 'Unknown',
                            email: monthData.pic_email,
                            completedTasks: 0,
                            totalTasks: 0,
                            completedPrograms: 0,
                            totalPrograms: 0,
                            score: 0,
                            rank: 0
                        }

                        if (monthData.plan > 0) {
                            existing.totalPrograms += monthData.plan
                            existing.completedPrograms += Math.min(monthData.actual, monthData.plan)
                        }

                        picMap.set(key, existing)
                    })
                })
            })
        })

        // 4. Calculate scores and ranks
        const entries = Array.from(picMap.values())
        entries.forEach(entry => {
            const taskScore = entry.totalTasks > 0
                ? (entry.completedTasks / entry.totalTasks) * 50
                : 0
            const programScore = entry.totalPrograms > 0
                ? (entry.completedPrograms / entry.totalPrograms) * 50
                : 0
            entry.score = Math.round(taskScore + programScore)
        })

        // Sort by score descending
        entries.sort((a, b) => b.score - a.score)

        // Assign ranks
        entries.forEach((entry, idx) => {
            entry.rank = idx + 1
        })

        return entries
    }, [year])

    const displayedItems = isExpanded ? leaderboard : leaderboard.slice(0, maxItems)

    if (leaderboard.length === 0) {
        return (
            <div className={`bg-[var(--bg-secondary)] border border-[var(--border-light)] p-4 rounded-2xl shadow-lg ${className}`}>
                <div className="flex items-center gap-2 mb-4">
                    <Trophy className="w-5 h-5 text-yellow-500" />
                    <h3 className="font-semibold text-[var(--text-primary)]">PIC Leaderboard</h3>
                </div>
                <p className="text-sm text-[var(--text-muted)]">No data available for {year}</p>
            </div>
        )
    }

    return (
        <motion.div
            className={`bg-[var(--bg-secondary)] border border-[var(--border-light)] p-4 rounded-2xl overflow-hidden shadow-lg ${className}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <motion.div
                        animate={{ rotate: [0, 10, -10, 0] }}
                        transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 3 }}
                    >
                        <Trophy className="w-5 h-5 text-yellow-500" />
                    </motion.div>
                    <h3 className="font-semibold text-[var(--text-primary)]">PIC Leaderboard</h3>
                    <Sparkles className="w-4 h-4 text-yellow-500/50" />
                </div>
                <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-[var(--bg-tertiary)] rounded-full text-xs text-[var(--text-secondary)]">
                        Year: {year}
                    </span>
                </div>
            </div>

            {/* Performance Year Label */}
            <div className="mb-3 px-2 py-1 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-lg">
                <p className="text-xs text-[var(--text-secondary)] text-center">
                    📊 Performance Year: <span className="font-bold text-[var(--text-primary)]">{year}</span>
                </p>
            </div>

            {/* Leaderboard List */}
            <AnimatePresence mode="popLayout">
                <div className="space-y-3">
                    {displayedItems.map((pic, index) => (
                        <motion.div
                            key={pic.email}
                            className="relative p-3 bg-[var(--bg-tertiary)]/50 hover:bg-[var(--bg-tertiary)] rounded-xl transition-colors"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ delay: index * 0.1 }}
                            layout
                        >
                            <div className="flex items-center gap-3">
                                {/* Rank Badge */}
                                <RankBadge rank={pic.rank} />

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <p className="font-medium text-[var(--text-primary)] truncate">{pic.name}</p>
                                        {pic.rank === 1 && (
                                            <motion.span
                                                animate={{ scale: [1, 1.2, 1] }}
                                                transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
                                                className="text-xs"
                                            >
                                                ⭐
                                            </motion.span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] mt-0.5">
                                        <span>Tasks: {pic.completedTasks}/{pic.totalTasks}</span>
                                        <span>•</span>
                                        <span>Programs: {pic.completedPrograms}/{pic.totalPrograms}</span>
                                    </div>

                                    {/* Animated Progress Bar */}
                                    <div className="mt-2">
                                        <AnimatedProgressBar percentage={pic.score} delay={index * 0.15} />
                                    </div>
                                </div>

                                {/* Score */}
                                <div className="text-right">
                                    <motion.p
                                        className="text-lg font-bold text-[var(--accent-blue)]"
                                        key={pic.score}
                                    >
                                        {pic.score}%
                                    </motion.p>
                                    <p className="text-xs text-[var(--text-muted)]">score</p>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </AnimatePresence>

            {/* Show More Button */}
            {leaderboard.length > maxItems && (
                <motion.button
                    className="w-full mt-3 py-2 flex items-center justify-center gap-1 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-[var(--bg-tertiary)]/50 hover:bg-[var(--bg-tertiary)] rounded-lg transition-colors"
                    onClick={() => setIsExpanded(!isExpanded)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                >
                    {isExpanded ? 'Show Less' : `Show All (${leaderboard.length})`}
                    <motion.div
                        animate={{ rotate: isExpanded ? 90 : 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <ChevronRight className="w-4 h-4" />
                    </motion.div>
                </motion.button>
            )}

            {/* Summary Stats */}
            <div className="mt-4 pt-4 border-t border-[var(--border-light)] grid grid-cols-3 gap-2">
                <div className="text-center">
                    <Users className="w-4 h-4 mx-auto text-blue-500 mb-1" />
                    <p className="text-lg font-bold text-[var(--text-primary)]">{leaderboard.length}</p>
                    <p className="text-xs text-[var(--text-muted)]">PICs</p>
                </div>
                <div className="text-center">
                    <TrendingUp className="w-4 h-4 mx-auto text-green-500 mb-1" />
                    <p className="text-lg font-bold text-[var(--text-primary)]">
                        {leaderboard.length > 0 ? Math.round(leaderboard.reduce((sum, p) => sum + p.score, 0) / leaderboard.length) : 0}%
                    </p>
                    <p className="text-xs text-[var(--text-muted)]">Avg</p>
                </div>
                <div className="text-center">
                    <Award className="w-4 h-4 mx-auto text-yellow-500 mb-1" />
                    <p className="text-lg font-bold text-[var(--text-primary)]">
                        {leaderboard.filter(p => p.score >= 80).length}
                    </p>
                    <p className="text-xs text-[var(--text-muted)]">Top Performers</p>
                </div>
            </div>
        </motion.div>
    )
}
