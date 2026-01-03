'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Activity, Clock, User, Database, Plus, Edit2, Trash2, ChevronRight, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useAdmin } from '@/hooks/useAdmin'

// =====================================================
// Types
// =====================================================

interface AuditLog {
    id: string
    action: 'INSERT' | 'UPDATE' | 'DELETE'
    entity_type: string
    entity_id: string | null
    actor_email: string | null
    description: string | null
    created_at: string
}

// =====================================================
// Helpers
// =====================================================

function formatEntityType(type: string): string {
    const typeMap: Record<string, string> = {
        hse_tasks: 'Task',
        master_programs: 'OTP Program',
        matrix_programs: 'Matrix Program',
        safety_moments: 'Safety Moment',
        safety_moment_interactions: 'Interaction',
        safety_moment_comments: 'Comment',
        user_settings: 'Settings'
    }
    return typeMap[type] || type
}

function getActionInfo(action: string): { icon: typeof Plus; color: string; label: string } {
    switch (action) {
        case 'INSERT':
            return { icon: Plus, color: 'text-green-500 bg-green-500/10', label: 'created' }
        case 'UPDATE':
            return { icon: Edit2, color: 'text-blue-500 bg-blue-500/10', label: 'updated' }
        case 'DELETE':
            return { icon: Trash2, color: 'text-red-500 bg-red-500/10', label: 'deleted' }
        default:
            return { icon: Activity, color: 'text-gray-500 bg-gray-500/10', label: action.toLowerCase() }
    }
}

function timeAgo(dateStr: string): string {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// =====================================================
// Activity Item Component
// =====================================================

function ActivityItem({ log, index }: { log: AuditLog; index: number }) {
    const actionInfo = getActionInfo(log.action)
    const Icon = actionInfo.icon
    const actorName = log.actor_email?.split('@')[0] || 'System'

    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ delay: index * 0.05, duration: 0.2 }}
            className="flex items-start gap-3 p-2 rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors"
        >
            {/* Icon */}
            <div className={`w-7 h-7 rounded-full flex items-center justify-center ${actionInfo.color}`}>
                <Icon className="w-3.5 h-3.5" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <p className="text-xs text-[var(--text-primary)]">
                    <span className="font-semibold">{actorName}</span>
                    <span className="text-[var(--text-muted)]"> {actionInfo.label} </span>
                    <span className="font-medium">{formatEntityType(log.entity_type)}</span>
                </p>
                <p className="text-[10px] text-[var(--text-muted)] flex items-center gap-1 mt-0.5">
                    <Clock className="w-3 h-3" />
                    {timeAgo(log.created_at)}
                </p>
            </div>
        </motion.div>
    )
}

// =====================================================
// Main Component
// =====================================================

interface RecentActivitySidebarProps {
    maxItems?: number
    className?: string
}

export function RecentActivitySidebar({ maxItems = 5, className = '' }: RecentActivitySidebarProps) {
    const { isAdmin, isLoading: isAuthLoading } = useAdmin()
    const [logs, setLogs] = useState<AuditLog[]>([])
    const [isLoading, setIsLoading] = useState(true)

    // Fetch logs
    useEffect(() => {
        if (!isAdmin || isAuthLoading) return

        const fetchLogs = async () => {
            const supabase = createClient()
            const { data } = await supabase
                .from('audit_logs' as any)
                .select('id, action, entity_type, entity_id, actor_email, description, created_at')
                .order('created_at', { ascending: false })
                .limit(maxItems)

            setLogs((data as AuditLog[]) || [])
            setIsLoading(false)
        }

        fetchLogs()

        // Realtime subscription
        const supabase = createClient()
        const channel = supabase
            .channel('recent_activity')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'audit_logs' },
                (payload) => {
                    setLogs(prev => [payload.new as AuditLog, ...prev].slice(0, maxItems))
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [isAdmin, isAuthLoading, maxItems])

    // Don't show for non-admins
    if (!isAdmin && !isAuthLoading) {
        return null
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className={`bg-[var(--bg-secondary)] border border-[var(--border-light)] rounded-2xl p-4 shadow-lg ${className}`}
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <motion.div
                        animate={{ rotate: [0, 360] }}
                        transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                    >
                        <Activity className="w-4 h-4 text-[var(--accent-purple)]" />
                    </motion.div>
                    <h3 className="font-semibold text-sm text-[var(--text-primary)]">Recent Activity</h3>
                </div>
                <Link href="/audit-logs">
                    <motion.button
                        className="text-[10px] text-[var(--accent-blue)] hover:underline flex items-center gap-0.5"
                        whileHover={{ x: 2 }}
                    >
                        View All
                        <ChevronRight className="w-3 h-3" />
                    </motion.button>
                </Link>
            </div>

            {/* Content */}
            {isLoading || isAuthLoading ? (
                <div className="flex justify-center py-4">
                    <Loader2 className="w-5 h-5 animate-spin text-[var(--text-muted)]" />
                </div>
            ) : logs.length === 0 ? (
                <div className="text-center py-4 text-xs text-[var(--text-muted)]">
                    <Database className="w-6 h-6 mx-auto mb-1 opacity-50" />
                    No activity yet
                </div>
            ) : (
                <AnimatePresence mode="popLayout">
                    <div className="space-y-1">
                        {logs.map((log, index) => (
                            <ActivityItem key={log.id} log={log} index={index} />
                        ))}
                    </div>
                </AnimatePresence>
            )}
        </motion.div>
    )
}
