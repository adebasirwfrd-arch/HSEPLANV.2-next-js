"use client"

import { useState, useMemo, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { AppShell } from "@/components/layout/app-shell"
import { GlassCard } from "@/components/ui/glass-card"
import { useAuditLogs, formatAction, getRelativeTime, formatTimestamp, type AuditLog } from "@/hooks/useAuditLogs"
import { useAdmin } from "@/hooks/useAdmin"
import {
    Search,
    Shield,
    ShieldCheck,
    ShieldAlert,
    ShieldX,
    Edit2,
    Trash2,
    Plus,
    Clock,
    User,
    Database,
    AlertTriangle,
    X,
    Code,
    Lock,
    Filter,
    ChevronDown,
    Loader2
} from "lucide-react"
import { cn } from "@/lib/utils"

// Action badge component with premium security icons
function ActionBadge({ action }: { action: 'INSERT' | 'UPDATE' | 'DELETE' }) {
    const { label, color } = formatAction(action)

    const colorClasses = {
        success: 'bg-[var(--success-color)]/10 text-[var(--success-color)] border-[var(--success-color)]/20',
        info: 'bg-[var(--accent-blue)]/10 text-[var(--accent-blue)] border-[var(--accent-blue)]/20',
        danger: 'bg-[var(--danger-color)]/10 text-[var(--danger-color)] border-[var(--danger-color)]/20',
        muted: 'bg-[var(--bg-tertiary)] text-[var(--text-muted)] border-[var(--border-light)]'
    }

    // Premium security icons
    const icons = {
        INSERT: ShieldCheck, // Green shield with check for creation
        UPDATE: Edit2,       // Edit for updates
        DELETE: ShieldAlert  // Alert shield for deletions
    }

    const Icon = icons[action] || Edit2

    return (
        <span className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full border",
            colorClasses[color as keyof typeof colorClasses]
        )}>
            <Icon className="w-3.5 h-3.5" />
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

// JSON Viewer Modal for forensics
function JSONViewerModal({
    isOpen,
    onClose,
    oldData,
    newData,
    action,
    description
}: {
    isOpen: boolean
    onClose: () => void
    oldData: Record<string, unknown> | null
    newData: Record<string, unknown> | null
    action: string
    description: string
}) {
    if (!isOpen) return null

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-[var(--bg-secondary)] rounded-2xl shadow-2xl border border-[var(--border-light)] max-w-3xl w-full max-h-[80vh] overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-[var(--border-light)]">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-[var(--accent-purple)]/10 rounded-xl flex items-center justify-center">
                                <Code className="w-5 h-5 text-[var(--accent-purple)]" />
                            </div>
                            <div>
                                <h3 className="font-bold text-[var(--text-primary)]">Data Forensics</h3>
                                <p className="text-xs text-[var(--text-muted)]">{description}</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-[var(--bg-tertiary)] rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5 text-[var(--text-muted)]" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-4 overflow-y-auto max-h-[60vh]">
                        <div className="grid md:grid-cols-2 gap-4">
                            {/* Old Data */}
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-3 h-3 rounded-full bg-[var(--danger-color)]" />
                                    <span className="text-sm font-semibold text-[var(--text-primary)]">Before</span>
                                </div>
                                <pre className="bg-[var(--bg-tertiary)] p-4 rounded-xl text-xs font-mono overflow-x-auto border border-[var(--border-light)]">
                                    {oldData ? JSON.stringify(oldData, null, 2) : 'No previous data'}
                                </pre>
                            </div>

                            {/* New Data */}
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-3 h-3 rounded-full bg-[var(--success-color)]" />
                                    <span className="text-sm font-semibold text-[var(--text-primary)]">After</span>
                                </div>
                                <pre className="bg-[var(--bg-tertiary)] p-4 rounded-xl text-xs font-mono overflow-x-auto border border-[var(--border-light)]">
                                    {newData ? JSON.stringify(newData, null, 2) : 'No new data'}
                                </pre>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    )
}

// Access Denied Component
function AccessDenied() {
    const router = useRouter()

    return (
        <AppShell>
            <div className="flex items-center justify-center min-h-[60vh]">
                <GlassCard className="p-8 max-w-md text-center">
                    <div className="w-16 h-16 mx-auto mb-4 bg-[var(--danger-color)]/10 rounded-2xl flex items-center justify-center">
                        <ShieldX className="w-8 h-8 text-[var(--danger-color)]" />
                    </div>
                    <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2">🔒 Administrator Access Required</h2>
                    <p className="text-[var(--text-muted)] mb-6">
                        You don't have permission to view Audit Logs. This page is restricted to administrators only.
                    </p>
                    <button
                        onClick={() => router.push('/')}
                        className="px-6 py-2.5 bg-gradient-to-r from-[var(--accent-blue)] to-[var(--accent-sky)] text-white rounded-xl font-medium hover:opacity-90 transition-opacity"
                    >
                        Return to Dashboard
                    </button>
                </GlassCard>
            </div>
        </AppShell>
    )
}

export default function AuditLogsPage() {
    const router = useRouter()
    const { isAdmin, isLoading: authLoading, isAuthenticated } = useAdmin()
    const [search, setSearch] = useState("")
    const [actorFilter, setActorFilter] = useState<string>("all")
    const [showActorDropdown, setShowActorDropdown] = useState(false)
    const [selectedLog, setSelectedLog] = useState<{
        oldData: Record<string, unknown> | null
        newData: Record<string, unknown> | null
        action: string
        description: string
    } | null>(null)

    const { logs, isLoading, error } = useAuditLogs({ limit: 100 })

    // Get unique actors for filter
    const uniqueActors = useMemo(() => {
        if (!logs) return []
        const actors = [...new Set(logs.map(log => log.actor_email || 'System'))]
        return actors.sort()
    }, [logs])

    // Filter logs based on search and actor
    const filteredLogs = useMemo(() => {
        if (!logs) return []

        let result = logs

        // Filter by actor
        if (actorFilter !== "all") {
            result = result.filter(log => (log.actor_email || 'System') === actorFilter)
        }

        // Filter by search
        if (search.trim()) {
            const searchLower = search.toLowerCase()
            result = result.filter(log =>
                (log.actor_email || '').toLowerCase().includes(searchLower) ||
                (log.description || '').toLowerCase().includes(searchLower) ||
                log.entity_type.toLowerCase().includes(searchLower) ||
                log.action.toLowerCase().includes(searchLower)
            )
        }

        return result
    }, [logs, search, actorFilter])

    // Handle row click for JSON viewer
    const handleRowClick = (log: AuditLog) => {
        if (log.action === 'UPDATE' && (log.old_values || log.new_values)) {
            setSelectedLog({
                oldData: log.old_values,
                newData: log.new_values,
                action: log.action,
                description: log.description || `Updated ${log.entity_type}`
            })
        }
    }

    // Show loading while checking auth
    if (authLoading) {
        return (
            <AppShell>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <Loader2 className="w-8 h-8 animate-spin text-[var(--accent-blue)]" />
                </div>
            </AppShell>
        )
    }

    // Redirect non-admins
    if (!isAdmin) {
        return <AccessDenied />
    }

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

                    {/* Actor Filter Dropdown */}
                    <div className="relative">
                        <button
                            onClick={() => setShowActorDropdown(!showActorDropdown)}
                            className="flex items-center gap-2 px-3 py-2 text-sm border border-[var(--border-light)] rounded-lg bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] transition-colors"
                        >
                            <Filter className="w-4 h-4 text-[var(--text-muted)]" />
                            <span className="text-[var(--text-primary)]">
                                {actorFilter === 'all' ? 'All Actors' : actorFilter}
                            </span>
                            <ChevronDown className="w-4 h-4 text-[var(--text-muted)]" />
                        </button>
                        {showActorDropdown && (
                            <div className="absolute right-0 mt-2 w-64 bg-[var(--bg-secondary)] border border-[var(--border-light)] rounded-lg shadow-xl z-10 py-1 max-h-60 overflow-y-auto">
                                <button
                                    onClick={() => { setActorFilter('all'); setShowActorDropdown(false); }}
                                    className={cn(
                                        "w-full px-4 py-2 text-left text-sm hover:bg-[var(--bg-tertiary)] transition-colors",
                                        actorFilter === 'all' && "bg-[var(--accent-blue)]/10 text-[var(--accent-blue)]"
                                    )}
                                >
                                    All Actors
                                </button>
                                {uniqueActors.map(actor => (
                                    <button
                                        key={actor}
                                        onClick={() => { setActorFilter(actor); setShowActorDropdown(false); }}
                                        className={cn(
                                            "w-full px-4 py-2 text-left text-sm hover:bg-[var(--bg-tertiary)] transition-colors truncate",
                                            actorFilter === actor && "bg-[var(--accent-blue)]/10 text-[var(--accent-blue)]"
                                        )}
                                    >
                                        {actor}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Search */}
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
                            <ShieldCheck className="w-5 h-5 text-[var(--success-color)]" />
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
                            <ShieldAlert className="w-5 h-5 text-[var(--danger-color)]" />
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
                                ) : error ? (
                                    <tr>
                                        <td colSpan={5} className="p-8 text-center">
                                            <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-[var(--danger-color)]" />
                                            <p className="text-[var(--danger-color)]">Failed to load audit logs</p>
                                        </td>
                                    </tr>
                                ) : filteredLogs.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="p-8 text-center text-[var(--text-muted)]">
                                            {search || actorFilter !== 'all' ? 'No logs match your filters' : 'No audit logs yet'}
                                        </td>
                                    </tr>
                                ) : (
                                    filteredLogs.map((log, idx) => (
                                        <motion.tr
                                            key={log.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.2, delay: idx * 0.02 }}
                                            onClick={() => handleRowClick(log)}
                                            className={cn(
                                                "border-b border-[var(--border-light)] hover:bg-[var(--bg-tertiary)]/30 transition-colors",
                                                log.action === 'UPDATE' && (log.old_values || log.new_values) && "cursor-pointer"
                                            )}
                                        >
                                            <td className="p-3">
                                                <div className="text-[var(--text-primary)]">{getRelativeTime(log.created_at)}</div>
                                                <div className="text-[10px] text-[var(--text-muted)]">{formatTimestamp(log.created_at)}</div>
                                            </td>
                                            <td className="p-3">
                                                <div className="text-[var(--text-primary)]">{log.actor_email || 'System'}</div>
                                            </td>
                                            <td className="p-3 text-center">
                                                <ActionBadge action={log.action} />
                                            </td>
                                            <td className="p-3">
                                                <div className="text-[var(--text-primary)] font-medium">{log.entity_type}</div>
                                                <div className="text-[10px] text-[var(--text-muted)]">ID: {log.entity_id || '-'}</div>
                                            </td>
                                            <td className="p-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="text-[var(--text-secondary)] text-xs max-w-xs truncate" title={log.description || ''}>
                                                        {log.description || '-'}
                                                    </div>
                                                    {log.action === 'UPDATE' && (log.old_values || log.new_values) && (
                                                        <Code className="w-3.5 h-3.5 text-[var(--accent-purple)]" />
                                                    )}
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
                            {actorFilter !== 'all' && ` (filtered by ${actorFilter})`}
                        </div>
                    )}
                </GlassCard>
            </div>

            {/* JSON Viewer Modal */}
            <JSONViewerModal
                isOpen={!!selectedLog}
                onClose={() => setSelectedLog(null)}
                oldData={selectedLog?.oldData || null}
                newData={selectedLog?.newData || null}
                action={selectedLog?.action || ''}
                description={selectedLog?.description || ''}
            />
        </AppShell>
    )
}
