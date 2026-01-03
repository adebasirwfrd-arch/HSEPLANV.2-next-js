
import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"

export interface NotificationLog {
    id: string
    item_type: 'otp' | 'matrix' | 'task'
    item_name: string
    recipient_email: string
    status: 'pending' | 'sent' | 'failed' | 'skipped'
    created_at: string
    error_message?: string
}

export function useNotifications() {
    const [notifications, setNotifications] = useState<NotificationLog[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [unreadCount, setUnreadCount] = useState(0)
    const supabase = createClient()

    useEffect(() => {
        fetchNotifications()
    }, [])

    const fetchNotifications = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user?.email) return

            const { data, error } = await supabase
                .from('notification_logs')
                .select('*')
                .eq('recipient_email', user.email)
                .order('created_at', { ascending: false })
                .limit(20)

            if (error) {
                console.error('Error fetching notifications:', error)
                return
            }

            setNotifications((data as NotificationLog[]) || [])
            // For now, assume pending/sent recently are "unread" or just show count of latest
            // A real unread system needs a separate tracking column or table
            setUnreadCount((data as NotificationLog[])?.filter(n => n.status === 'pending' || n.status === 'failed').length || 0)
        } catch (error) {
            console.error('Error in useNotifications:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const markAsRead = () => {
        setUnreadCount(0)
    }

    return {
        notifications,
        isLoading,
        unreadCount,
        refetch: fetchNotifications,
        markAsRead
    }
}
