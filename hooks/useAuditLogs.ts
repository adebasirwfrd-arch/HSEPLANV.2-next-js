'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useAdmin } from './useAdmin'

// =====================================================
// Types
// =====================================================

export type AuditAction = 'INSERT' | 'UPDATE' | 'DELETE'

export interface AuditLog {
    id: string
    action: AuditAction
    entity_type: string
    entity_id: string | null
    actor_id: string | null
    actor_email: string | null
    description: string | null
    old_values: Record<string, any> | null
    new_values: Record<string, any> | null
    ip_address: string | null
    user_agent: string | null
    created_at: string
}

export interface AuditLogFilters {
    action?: AuditAction
    entity_type?: string
    actor_email?: string
    from_date?: string
    to_date?: string
    search?: string
}

export interface UseAuditLogsOptions {
    limit?: number
    filters?: AuditLogFilters
    realtime?: boolean
    enabled?: boolean
}

// =====================================================
// Hook
// =====================================================

export function useAuditLogs(options: UseAuditLogsOptions = {}) {
    const { limit = 50, filters = {}, realtime = false, enabled = true } = options
    const { isAdmin, isLoading: isAuthLoading } = useAdmin()
    const [page, setPage] = useState(1)

    // Memoize filter keys for checking changes
    const filterKey = JSON.stringify(filters)

    // React Query for caching
    const {
        data: queryData,
        isLoading,
        error: queryError,
        refetch
    } = useQuery({
        queryKey: ['audit_logs', page, limit, filterKey],
        queryFn: async () => {
            if (!isAdmin) throw new Error('Admin access required')

            const supabase = createClient()
            let query = supabase
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                .from('audit_logs' as any)
                .select('*', { count: 'exact' })
                .order('created_at', { ascending: false })
                .range((page - 1) * limit, page * limit - 1)

            // Apply filters
            if (filters.action) query = query.eq('action', filters.action)
            if (filters.entity_type) query = query.eq('entity_type', filters.entity_type)
            if (filters.actor_email) query = query.ilike('actor_email', `%${filters.actor_email}%`)
            if (filters.from_date) query = query.gte('created_at', filters.from_date)
            if (filters.to_date) query = query.lte('created_at', filters.to_date)
            if (filters.search) {
                // @ts-ignore
                query = query.or(`description.ilike.%${filters.search}%,entity_id.ilike.%${filters.search}%`)
            }

            const { data, error, count } = await query
            if (error) throw error

            return {
                logs: (data as AuditLog[]) || [],
                total: count || 0
            }
        },
        enabled: enabled && !isAuthLoading && isAdmin,
        staleTime: 1000 * 60 * 5, // 5 minutes
        gcTime: 1000 * 60 * 30, // 30 minutes
    })

    const logs = useMemo(() => queryData?.logs || [], [queryData?.logs])
    const total = queryData?.total || 0
    const error = queryError ? (queryError as Error).message : null

    // Realtime subscription
    useEffect(() => {
        if (!realtime || !isAdmin || !enabled) return

        const supabase = createClient()
        const channel = supabase
            .channel('audit_logs_changes')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'audit_logs' },
                () => {
                    refetch() // Simple invalidation on new event
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [realtime, isAdmin, enabled, refetch])

    // Pagination
    const nextPage = useCallback(() => {
        if (page * limit < total) setPage(p => p + 1)
    }, [page, limit, total])

    const prevPage = useCallback(() => {
        if (page > 1) setPage(p => p - 1)
    }, [page])

    const goToPage = useCallback((newPage: number) => {
        const maxPage = Math.ceil(total / limit)
        if (newPage >= 1 && newPage <= maxPage) setPage(newPage)
    }, [total, limit])

    // Stats calculation
    const stats = useMemo(() => {
        const actionCounts = logs.reduce((acc: Record<string, number>, log: AuditLog) => {
            acc[log.action] = (acc[log.action] || 0) + 1
            return acc
        }, {} as Record<string, number>)

        const entityCounts = logs.reduce((acc: Record<string, number>, log: AuditLog) => {
            acc[log.entity_type] = (acc[log.entity_type] || 0) + 1
            return acc
        }, {} as Record<string, number>)

        return {
            total,
            inserts: actionCounts.INSERT || 0,
            updates: actionCounts.UPDATE || 0,
            deletes: actionCounts.DELETE || 0,
            entityTypes: Object.keys(entityCounts),
            entityCounts
        }
    }, [logs, total])

    return {
        logs,
        isLoading: isLoading || isAuthLoading,
        error,
        total,
        page,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1,
        nextPage,
        prevPage,
        goToPage,
        refresh: refetch,
        stats
    }
}

// =====================================================
// Utility Functions
// =====================================================

/**
 * Format audit log action for display
 */
export function formatAction(action: AuditAction): { label: string; color: string } {
    switch (action) {
        case 'INSERT':
            return { label: 'Created', color: 'success' }
        case 'UPDATE':
            return { label: 'Updated', color: 'info' }
        case 'DELETE':
            return { label: 'Deleted', color: 'danger' }
        default:
            return { label: action, color: 'muted' }
    }
}

/**
 * Format entity type for display
 */
export function formatEntityType(type: string): string {
    const typeMap: Record<string, string> = {
        hse_tasks: 'Task',
        master_programs: 'OTP Program',
        matrix_programs: 'Matrix Program',
        safety_moments: 'Safety Moment',
        safety_moment_interactions: 'Interaction',
        safety_moment_comments: 'Comment',
        user_settings: 'User Settings'
    }
    return typeMap[type] || type
}

/**
 * Format timestamp for display
 */
export function formatTimestamp(timestamp: string): string {
    const date = new Date(timestamp)
    return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).format(date)
}

/**
 * Get relative time string
 */
export function getRelativeTime(timestamp: string): string {
    const now = new Date()
    const date = new Date(timestamp)
    const diff = now.getTime() - date.getTime()

    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    if (days < 7) return `${days}d ago`
    return formatTimestamp(timestamp)
}

/**
 * Get changes between old and new values
 */
export function getChanges(oldValues: Record<string, any> | null, newValues: Record<string, any> | null): { field: string; old: any; new: any }[] {
    if (!oldValues && !newValues) return []
    if (!oldValues) {
        return Object.entries(newValues!).map(([field, value]) => ({ field, old: null, new: value }))
    }
    if (!newValues) {
        return Object.entries(oldValues).map(([field, value]) => ({ field, old: value, new: null }))
    }

    const changes: { field: string; old: any; new: any }[] = []
    const allKeys = new Set([...Object.keys(oldValues), ...Object.keys(newValues)])

    allKeys.forEach(key => {
        const oldVal = oldValues[key]
        const newVal = newValues[key]

        // Skip internal fields
        if (['updated_at', 'created_at'].includes(key)) return

        if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
            changes.push({ field: key, old: oldVal, new: newVal })
        }
    })

    return changes
}
