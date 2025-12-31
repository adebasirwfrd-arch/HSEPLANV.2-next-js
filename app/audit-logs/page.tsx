"use client"

import { useState, useMemo } from "react"
import { motion } from "framer-motion"
import { AppShell } from "@/components/layout/app-shell"
import { GlassCard } from "@/components/ui/glass-card"
import { useAuditLogs, formatAction, getRelativeTime, formatTimestamp } from "@/hooks/useAuditLogs"
import {
    Search,
    Shield,
    ArrowUpRight,
    ArrowDownRight,
    Edit2,
    Trash2,
    Plus,
    Clock,
    User,
    Database,
    AlertTriangle
} from "lucide-react"
import { cn } from "@/lib/utils"

// Action badge component
function ActionBadge({ action }: { action: 'INSERT' | 'UPDATE' | 'DELETE' }) {
    const { label, color } = formatAction(action)

    const colorClasses = {
        success: 'bg-[var(--success-color)]/10 text-[var(--success-color)] border-[var(--success-color)]/20',
        info: 'bg-[var(--accent-blue)]/10 text-[var(--accent-blue)] border-[var(--accent-blue)]/20',
        danger: 'bg-[var(--danger-color)]/10 text-[var(--danger-color)] border-[var(--danger-color)]/20',
        muted: 'bg-[var(--bg-tertiary)] text-[var(--text-muted)] border-[var(--border-light)]'
    }

    const icons = {
        INSERT: Plus,
        UPDATE: Edit2,
        DELETE: Trash2
    }

    const Icon = icons[action] || Edit2

    return (
        <span className={cn(
            "inline-flex items-center gap-1.5 px-2 py-1 text-xs font-medium rounded-full border",
            colorClasses[color as keyof typeof colorClasses]
        )}>
            <Icon className="w-3 h-3" />
            {label}
        </span>
    )
}

// Skeleton row
function SkeletonRow() {
    return (
        <tr className="border-b border-[var(--border-light)]">
            {[1, 2, 3, 4, 5].map(i => (
                <td key={i} className="p-3">
                    <div className="h-4 bg-[var(--bg-tertiary)] rounded animate-pulse" />
                </td>
            ))}
        </tr>
    )
}

export default function AuditLogsPage() {
    const [search, setSearch] = useState("")
    const { data: logs, isLoading, isError } = useAuditLogs({ limit: 100 })

    // Filter logs based on search
    const filteredLogs = useMemo(() => {
        if (!logs) return []
        if (!search.trim()) return logs

        const searchLower = search.toLowerCase()
        return logs.filter(log =>
            (log.user_email || '').toLowerCase().includes(searchLower) ||
            (log.description || '').toLowerCase().includes(searchLower) ||
            log.target_table.toLowerCase().includes(searchLower) ||
            log.action.toLowerCase().includes(searchLower)
        )
    }, [logs, search])

    return (
        <AppShell>
            <div className="space-y-4">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-[var(--accent-purple)] to-[#6366f1] rounded-xl flex items-center justify-center">
                            <Shield className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-[var(--text-primary)]">Audit Logs</h1>
                            <p className="text-xs text-[var(--text-muted)]">Enterprise compliance tracking</p>
                        </div>
                    </div>
                    <div className="flex-1" />
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                        <input
                            type="text"
                            placeholder="Search logs..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9 pr-4 py-2 text-sm border border-[var(--border-light)] rounded-lg bg-[var(--bg-secondary)] focus:outline-none focus:border-[var(--accent-blue)] w-full sm:w-64"
                        />
                    </div>
                </div>

                {/* Stats Summary */}
                <div className="grid grid-cols-3 gap-3">
                    <GlassCard className="p-4 text-center">
                        <div className="w-10 h-10 mx-auto mb-2 bg-[var(--success-color)]/10 rounded-xl flex items-center justify-center">
                            <Plus className="w-5 h-5 text-[var(--success-color)]" />
                        </div>
                        <div className="text-2xl font-bold text-[var(--success-color)]">
                            {isLoading ? '-' : logs?.filter(l => l.action === 'INSERT').length || 0}
                        </div>
                        <div className="text-xs text-[var(--text-muted)]">Created</div>
                    </GlassCard>
                    <GlassCard className="p-4 text-center">
                        <div className="w-10 h-10 mx-auto mb-2 bg-[var(--accent-blue)]/10 rounded-xl flex items-center justify-center">
                            <Edit2 className="w-5 h-5 text-[var(--accent-blue)]" />
                        </div>
                        <div className="text-2xl font-bold text-[var(--accent-blue)]">
                            {isLoading ? '-' : logs?.filter(l => l.action === 'UPDATE').length || 0}
                        </div>
                        <div className="text-xs text-[var(--text-muted)]">Updated</div>
                    </GlassCard>
                    <GlassCard className="p-4 text-center">
                        <div className="w-10 h-10 mx-auto mb-2 bg-[var(--danger-color)]/10 rounded-xl flex items-center justify-center">
                            <Trash2 className="w-5 h-5 text-[var(--danger-color)]" />
                        </div>
                        <div className="text-2xl font-bold text-[var(--danger-color)]">
                            {isLoading ? '-' : logs?.filter(l => l.action === 'DELETE').length || 0}
                        </div>
                        <div className="text-xs text-[var(--text-muted)]">Deleted</div>
                    </GlassCard>
                </div>

                {/* Logs Table */}
                <GlassCard className="overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-[var(--bg-tertiary)]">
                                <tr>
                                    <th className="p-3 text-left font-semibold text-[var(--text-secondary)]">
                                        <div className="flex items-center gap-2">
                                            <Clock className="w-4 h-4" /> Date/Time
                                        </div>
                                    </th>
                                    <th className="p-3 text-left font-semibold text-[var(--text-secondary)]">
                                        <div className="flex items-center gap-2">
                                            <User className="w-4 h-4" /> Actor
                                        </div>
                                    </th>
                                    <th className="p-3 text-center font-semibold text-[var(--text-secondary)]">Action</th>
                                    <th className="p-3 text-left font-semibold text-[var(--text-secondary)]">
                                        <div className="flex items-center gap-2">
                                            <Database className="w-4 h-4" /> Target
                                        </div>
                                    </th>
                                    <th className="p-3 text-left font-semibold text-[var(--text-secondary)]">Description</th>
                                </tr>
                            </thead>
                            <tbody>
                                {isLoading ? (
                                    Array(5).fill(0).map((_, i) => <SkeletonRow key={i} />)
                                ) : isError ? (
                                    <tr>
                                        <td colSpan={5} className="p-8 text-center">
                                            <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-[var(--danger-color)]" />
                                            <p className="text-[var(--danger-color)]">Failed to load audit logs</p>
                                            <p className="text-xs text-[var(--text-muted)] mt-1">Only admins can view this page</p>
                                        </td>
                                    </tr>
                                ) : filteredLogs.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="p-8 text-center text-[var(--text-muted)]">
                                            {search ? 'No logs match your search' : 'No audit logs yet'}
                                        </td>
                                    </tr>
                                ) : (
                                    filteredLogs.map((log, idx) => (
                                        <motion.tr
                                            key={log.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.2, delay: idx * 0.02 }}
                                            className="border-b border-[var(--border-light)] hover:bg-[var(--bg-tertiary)]/30 transition-colors"
                                        >
                                            <td className="p-3">
                                                <div className="text-[var(--text-primary)]">{getRelativeTime(log.created_at)}</div>
                                                <div className="text-[10px] text-[var(--text-muted)]">{formatTimestamp(log.created_at)}</div>
                                            </td>
                                            <td className="p-3">
                                                <div className="text-[var(--text-primary)]">{log.user_email || 'System'}</div>
                                            </td>
                                            <td className="p-3 text-center">
                                                <ActionBadge action={log.action} />
                                            </td>
                                            <td className="p-3">
                                                <div className="text-[var(--text-primary)] font-medium">{log.target_table}</div>
                                                <div className="text-[10px] text-[var(--text-muted)]">ID: {log.target_id || '-'}</div>
                                            </td>
                                            <td className="p-3">
                                                <div className="text-[var(--text-secondary)] text-xs max-w-xs truncate" title={log.description || ''}>
                                                    {log.description || '-'}
                                                </div>
                                            </td>
                                        </motion.tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                    {filteredLogs.length > 0 && (
                        <div className="p-3 border-t border-[var(--border-light)] text-xs text-[var(--text-muted)] text-center">
                            Showing {filteredLogs.length} of {logs?.length || 0} logs
                        </div>
                    )}
                </GlassCard>
            </div>
        </AppShell>
    )
}
