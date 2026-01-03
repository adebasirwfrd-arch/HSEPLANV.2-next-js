'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Calendar, Clock, ChevronRight, AlertTriangle, CheckCircle, Timer, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { loadTasks } from '@/lib/tasks-store'
import { getOTPData } from '@/lib/otp-store'
import { getMatrixData, type MatrixCategory } from '@/lib/matrix-store'

// =====================================================
// Types
// =====================================================

type UrgencyLevel = 'critical' | 'warning' | 'safe' | 'overdue'

interface UpcomingEvent {
    id: string
    title: string
    date: string
    source: 'task' | 'otp' | 'matrix'
    category?: string
    base?: string
    daysUntil: number
    urgency: UrgencyLevel
    link: string
    picName?: string
}

// =====================================================
// Helpers
// =====================================================

/**
 * Calculate urgency based on days until event
 */
function calculateUrgency(daysUntil: number): UrgencyLevel {
    if (daysUntil < 0) return 'overdue'
    if (daysUntil <= 3) return 'critical' // H-1 to H-3 = Red
    if (daysUntil <= 7) return 'warning'  // H-4 to H-7 = Yellow
    return 'safe' // H-8+ = Blue/Green
}

/**
 * Get relative time string
 */
function getRelativeTime(daysUntil: number): string {
    if (daysUntil < 0) return `${Math.abs(daysUntil)} days overdue`
    if (daysUntil === 0) return 'Today'
    if (daysUntil === 1) return 'Tomorrow'
    if (daysUntil <= 7) return `In ${daysUntil} days`
    if (daysUntil <= 14) return 'In 1-2 weeks'
    return `In ${Math.ceil(daysUntil / 7)} weeks`
}

/**
 * Get urgency color classes
 */
function getUrgencyColors(urgency: UrgencyLevel): {
    border: string
    bg: string
    text: string
    icon: string
} {
    switch (urgency) {
        case 'overdue':
            return {
                border: 'border-l-4 border-l-red-600',
                bg: 'bg-red-500/10',
                text: 'text-red-500',
                icon: 'text-red-500'
            }
        case 'critical':
            return {
                border: 'border-l-4 border-l-red-500',
                bg: 'bg-red-500/5',
                text: 'text-red-400',
                icon: 'text-red-400'
            }
        case 'warning':
            return {
                border: 'border-l-4 border-l-yellow-500',
                bg: 'bg-yellow-500/5',
                text: 'text-yellow-500',
                icon: 'text-yellow-500'
            }
        case 'safe':
        default:
            return {
                border: 'border-l-4 border-l-green-500',
                bg: 'bg-green-500/5',
                text: 'text-green-500',
                icon: 'text-green-500'
            }
    }
}

/**
 * Get source badge
 */
function getSourceBadge(source: string, category?: string): { label: string; color: string } {
    switch (source) {
        case 'task':
            return { label: 'Task', color: 'bg-purple-500/20 text-purple-400' }
        case 'otp':
            return { label: 'OTP', color: 'bg-blue-500/20 text-blue-400' }
        case 'matrix':
            return {
                label: category ? category.charAt(0).toUpperCase() + category.slice(1) : 'Matrix',
                color: 'bg-indigo-500/20 text-indigo-400'
            }
        default:
            return { label: source, color: 'bg-gray-500/20 text-gray-400' }
    }
}

// =====================================================
// Event Item Component
// =====================================================

function EventItem({ event, index }: { event: UpcomingEvent; index: number }) {
    const colors = getUrgencyColors(event.urgency)
    const sourceBadge = getSourceBadge(event.source, event.category)

    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ delay: index * 0.08, duration: 0.3 }}
            layout
        >
            <Link href={event.link}>
                <motion.div
                    className={`relative p-3 rounded-xl ${colors.border} ${colors.bg} hover:bg-[var(--bg-tertiary)] transition-all cursor-pointer group`}
                    whileHover={{ scale: 1.02, x: 4 }}
                    whileTap={{ scale: 0.98 }}
                >
                    {/* Shimmer effect for critical items */}
                    {event.urgency === 'critical' && (
                        <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-transparent via-red-500/10 to-transparent rounded-xl"
                            initial={{ x: '-100%' }}
                            animate={{ x: '200%' }}
                            transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                        />
                    )}

                    <div className="relative flex items-start gap-3">
                        {/* Urgency Icon */}
                        <div className={`mt-0.5 ${colors.icon}`}>
                            {event.urgency === 'overdue' || event.urgency === 'critical' ? (
                                <AlertTriangle className="w-4 h-4" />
                            ) : event.urgency === 'warning' ? (
                                <Timer className="w-4 h-4" />
                            ) : (
                                <CheckCircle className="w-4 h-4" />
                            )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-semibold text-[var(--text-primary)] truncate text-sm">
                                    {event.title}
                                </h4>
                                <span className={`px-1.5 py-0.5 text-[10px] rounded-full ${sourceBadge.color}`}>
                                    {sourceBadge.label}
                                </span>
                            </div>

                            <div className="flex items-center gap-3 text-xs text-[var(--text-muted)]">
                                <span className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {new Date(event.date).toLocaleDateString('en-US', {
                                        month: 'short',
                                        day: 'numeric'
                                    })}
                                </span>
                                <span className={`flex items-center gap-1 font-medium ${colors.text}`}>
                                    <Clock className="w-3 h-3" />
                                    {getRelativeTime(event.daysUntil)}
                                </span>
                                {event.base && (
                                    <span className="text-[var(--text-muted)]">
                                        📍 {event.base.charAt(0).toUpperCase() + event.base.slice(1)}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Arrow */}
                        <ChevronRight className="w-4 h-4 text-[var(--text-muted)] group-hover:text-[var(--accent-blue)] transition-colors" />
                    </div>
                </motion.div>
            </Link>
        </motion.div>
    )
}

// =====================================================
// Main Component
// =====================================================

interface UpcomingEventsCardProps {
    maxItems?: number
    className?: string
}

export function UpcomingEventsCard({ maxItems = 5, className = '' }: UpcomingEventsCardProps) {
    const [showAll, setShowAll] = useState(false)

    // Collect all upcoming events
    const events = useMemo(() => {
        const allEvents: UpcomingEvent[] = []
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']
        const bases = ['narogong', 'balikpapan', 'duri'] as const

        // 1. Tasks
        const tasks = loadTasks()
        tasks.forEach(task => {
            if (!task.implementationDate || task.status === 'Completed') return
            const taskDate = new Date(task.implementationDate)
            const daysUntil = Math.ceil((taskDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

            // Only show events within next 30 days or overdue
            if (daysUntil > 30) return

            allEvents.push({
                id: `task-${task.id}`,
                title: task.title,
                date: task.implementationDate,
                source: 'task',
                base: task.base,
                daysUntil,
                urgency: calculateUrgency(daysUntil),
                link: `/tasks?id=${task.id}`,
                picName: task.picName
            })
        })

        // 2. OTP Programs
        bases.forEach(base => {
            const otpData = getOTPData('indonesia', base)
            otpData.programs.forEach(prog => {
                months.forEach(month => {
                    const monthData = prog.months[month]
                    if (!monthData?.plan_date || monthData.actual >= monthData.plan) return

                    const planDate = new Date(monthData.plan_date)
                    const daysUntil = Math.ceil((planDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

                    if (daysUntil > 30 || daysUntil < -7) return

                    allEvents.push({
                        id: `otp-${prog.id}-${month}`,
                        title: prog.name,
                        date: monthData.plan_date,
                        source: 'otp',
                        base,
                        daysUntil,
                        urgency: calculateUrgency(daysUntil),
                        link: `/otp?base=${base}&program=${prog.id}`,
                        picName: monthData.pic_name
                    })
                })
            })
        })

        // 3. Matrix Programs
        const categories: MatrixCategory[] = ['audit', 'training', 'drill', 'meeting']
        bases.forEach(base => {
            categories.forEach(category => {
                const matrixData = getMatrixData(category, base)
                matrixData.programs.forEach(prog => {
                    months.forEach(month => {
                        const monthData = prog.months[month]
                        if (!monthData?.plan_date || monthData.actual >= monthData.plan) return

                        const planDate = new Date(monthData.plan_date)
                        const daysUntil = Math.ceil((planDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

                        if (daysUntil > 30 || daysUntil < -7) return

                        allEvents.push({
                            id: `matrix-${prog.id}-${month}`,
                            title: prog.name,
                            date: monthData.plan_date,
                            source: 'matrix',
                            category,
                            base,
                            daysUntil,
                            urgency: calculateUrgency(daysUntil),
                            link: `/matrix?category=${category}&base=${base}`,
                            picName: monthData.pic_name
                        })
                    })
                })
            })
        })

        // Sort by urgency (overdue first, then by days until)
        allEvents.sort((a, b) => {
            const urgencyOrder = { overdue: 0, critical: 1, warning: 2, safe: 3 }
            if (urgencyOrder[a.urgency] !== urgencyOrder[b.urgency]) {
                return urgencyOrder[a.urgency] - urgencyOrder[b.urgency]
            }
            return a.daysUntil - b.daysUntil
        })

        return allEvents
    }, [])

    const displayedEvents = showAll ? events : events.slice(0, maxItems)
    const criticalCount = events.filter(e => e.urgency === 'critical' || e.urgency === 'overdue').length

    return (
        <motion.div
            className={`bg-[var(--bg-secondary)] border border-[var(--border-light)] rounded-2xl p-4 shadow-lg ${className}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <motion.div
                        animate={{ rotate: [0, 10, -10, 0] }}
                        transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 5 }}
                    >
                        <Calendar className="w-5 h-5 text-[var(--accent-blue)]" />
                    </motion.div>
                    <h3 className="font-semibold text-[var(--text-primary)]">Upcoming Events</h3>
                    {criticalCount > 0 && (
                        <motion.span
                            className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs rounded-full"
                            animate={{ scale: [1, 1.1, 1] }}
                            transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
                        >
                            {criticalCount} urgent
                        </motion.span>
                    )}
                </div>
                <Link href="/calendar">
                    <motion.button
                        className="text-xs text-[var(--accent-blue)] hover:underline flex items-center gap-1"
                        whileHover={{ x: 2 }}
                    >
                        View Calendar
                        <ExternalLink className="w-3 h-3" />
                    </motion.button>
                </Link>
            </div>

            {/* Events List */}
            <AnimatePresence mode="popLayout">
                {events.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center py-6 text-[var(--text-muted)]"
                    >
                        <CheckCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No upcoming events in the next 30 days!</p>
                    </motion.div>
                ) : (
                    <div className="space-y-2">
                        {displayedEvents.map((event, index) => (
                            <EventItem key={event.id} event={event} index={index} />
                        ))}
                    </div>
                )}
            </AnimatePresence>

            {/* Show More Button */}
            {events.length > maxItems && (
                <motion.button
                    className="w-full mt-3 py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-[var(--bg-tertiary)]/50 hover:bg-[var(--bg-tertiary)] rounded-lg transition-colors flex items-center justify-center gap-1"
                    onClick={() => setShowAll(!showAll)}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                >
                    {showAll ? 'Show Less' : `Show All (${events.length})`}
                    <motion.div animate={{ rotate: showAll ? -90 : 90 }}>
                        <ChevronRight className="w-4 h-4" />
                    </motion.div>
                </motion.button>
            )}

            {/* Legend */}
            <div className="mt-4 pt-3 border-t border-[var(--border-light)] flex flex-wrap gap-3 text-xs text-[var(--text-muted)]">
                <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-red-500" /> H-1 to H-3
                </span>
                <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-yellow-500" /> H-4 to H-7
                </span>
                <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-green-500" /> H-8+
                </span>
            </div>
        </motion.div>
    )
}
