
"use client"

import { motion, AnimatePresence } from "framer-motion"
import { Bell, Check, AlertCircle, Clock, X } from "lucide-react"
import { useNotifications, type NotificationLog } from "@/hooks/useNotifications"
import { cn } from "@/lib/utils"
import { formatDistanceToNow } from "date-fns"

interface NotificationDropdownProps {
    isOpen: boolean
    onClose: () => void
}

export function NotificationDropdown({ isOpen, onClose }: NotificationDropdownProps) {
    const { notifications, isLoading, unreadCount, markAsRead } = useNotifications()

    if (!isOpen) return null

    return (
        <>
            {/* Backdrop */}
            <div className="fixed inset-0 z-40 bg-black/5 md:bg-transparent" onClick={onClose} />

            <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="absolute right-0 mt-2 w-80 md:w-96 bg-[var(--bg-secondary)] border border-[var(--border-light)] rounded-xl shadow-2xl z-50 overflow-hidden"
            >
                {/* Header */}
                <div className="p-4 border-b border-[var(--border-light)] flex items-center justify-between bg-[var(--bg-tertiary)]/50 backdrop-blur-sm">
                    <div className="flex items-center gap-2">
                        <Bell className="w-4 h-4 text-[var(--accent-blue)]" />
                        <h3 className="font-semibold text-sm text-[var(--text-primary)]">Notifications</h3>
                        {unreadCount > 0 && (
                            <span className="px-1.5 py-0.5 text-[10px] font-bold bg-[var(--danger-color)] text-white rounded-full">
                                {unreadCount}
                            </span>
                        )}
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-[var(--bg-tertiary)] rounded-lg transition-colors">
                        <X className="w-4 h-4 text-[var(--text-muted)]" />
                    </button>
                </div>

                {/* Content */}
                <div className="max-h-[400px] overflow-y-auto">
                    {isLoading ? (
                        <div className="p-8 text-center space-y-3">
                            <div className="w-8 h-8 mx-auto border-2 border-[var(--accent-blue)] border-t-transparent rounded-full animate-spin" />
                            <p className="text-xs text-[var(--text-muted)]">Loading notifications...</p>
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="p-8 text-center space-y-3">
                            <div className="w-12 h-12 mx-auto bg-[var(--bg-tertiary)] rounded-full flex items-center justify-center">
                                <Bell className="w-6 h-6 text-[var(--text-muted)] opacity-50" />
                            </div>
                            <p className="text-sm font-medium text-[var(--text-secondary)]">No notifications</p>
                            <p className="text-xs text-[var(--text-muted)]">You're all caught up!</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-[var(--border-light)]">
                            {notifications.map((notif) => (
                                <NotificationItem key={notif.id} notification={notif} />
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                {notifications.length > 0 && (
                    <div className="p-3 border-t border-[var(--border-light)] bg-[var(--bg-tertiary)]/30">
                        <button
                            onClick={markAsRead}
                            className="w-full py-1.5 text-xs font-medium text-[var(--accent-blue)] hover:bg-[var(--accent-blue)]/10 rounded-lg transition-colors"
                        >
                            Mark all as read
                        </button>
                    </div>
                )}
            </motion.div>
        </>
    )
}

function NotificationItem({ notification }: { notification: NotificationLog }) {
    const isError = notification.status === 'failed'
    const isSent = notification.status === 'sent'

    return (
        <div className="p-4 hover:bg-[var(--bg-tertiary)]/50 transition-colors flex gap-3 group">
            <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                isError ? "bg-[var(--danger-color)]/10 text-[var(--danger-color)]" :
                    isSent ? "bg-[var(--success-color)]/10 text-[var(--success-color)]" :
                        "bg-[var(--accent-blue)]/10 text-[var(--accent-blue)]"
            )}>
                {isError ? <AlertCircle className="w-4 h-4" /> :
                    isSent ? <Check className="w-4 h-4" /> :
                        <Clock className="w-4 h-4" />}
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                    {notification.item_type === 'otp' ? 'HSE OTP Alert' :
                        notification.item_type === 'matrix' ? 'Matrix Program' :
                            'Task Update'}
                </p>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5 line-clamp-2">
                    {notification.item_name}
                </p>
                {notification.error_message && (
                    <p className="text-[10px] text-[var(--danger-color)] mt-1">
                        Failed: {notification.error_message}
                    </p>
                )}
                <p className="text-[10px] text-[var(--text-muted)] mt-1.5">
                    {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                </p>
            </div>
        </div>
    )
}
