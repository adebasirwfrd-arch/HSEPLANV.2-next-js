'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { AuditLog, AuditAction } from '@/types/supabase'

interface UseAuditLogsOptions {
    limit?: number
    enabled?: boolean
}

export function useAuditLogs({ limit = 100, enabled = true }: UseAuditLogsOptions = {}) {
    const supabase = createClient()

    return useQuery({
        queryKey: ['audit_logs', limit],
        queryFn: async (): Promise<AuditLog[]> => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data, error } = await (supabase as any)
                .from('audit_logs')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(limit)

            if (error) {
                throw new Error(error.message)
            }

            return data || []
        },
        enabled
    })
}

// Helper function to format action for display
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

// Helper function to format timestamp
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

// Helper to get relative time
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
