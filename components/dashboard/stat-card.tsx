"use client"

import { cn } from "@/lib/utils"
import { GlassCard } from "@/components/ui/glass-card"
import type { LucideIcon } from "lucide-react"

type ColorVariant = "accent" | "success" | "warning" | "danger" | "info"

interface StatCardProps {
    title: string
    value: number | string
    subtitle: string
    icon: LucideIcon
    color?: ColorVariant
    trend?: {
        value: number
        isPositive: boolean
    }
    onClick?: () => void
}

const colorStyles: Record<ColorVariant, { border: string; iconBg: string; iconColor: string }> = {
    accent: {
        border: "border-l-4 border-l-[var(--accent-blue)]",
        iconBg: "bg-[var(--accent-blue)]/10",
        iconColor: "text-[var(--accent-blue)]"
    },
    success: {
        border: "border-l-4 border-l-[var(--success-color)]",
        iconBg: "bg-[var(--success-color)]/10",
        iconColor: "text-[var(--success-color)]"
    },
    warning: {
        border: "border-l-4 border-l-[var(--warning-color)]",
        iconBg: "bg-[var(--warning-color)]/10",
        iconColor: "text-[var(--warning-color)]"
    },
    danger: {
        border: "border-l-4 border-l-[var(--danger-color)]",
        iconBg: "bg-[var(--danger-color)]/10",
        iconColor: "text-[var(--danger-color)]"
    },
    info: {
        border: "border-l-4 border-l-[var(--info-color)]",
        iconBg: "bg-[var(--info-color)]/10",
        iconColor: "text-[var(--info-color)]"
    }
}

export function StatCard({ title, value, subtitle, icon: Icon, color = "accent", trend, onClick }: StatCardProps) {
    const styles = colorStyles[color]

    return (
        <GlassCard
            className={cn(
                "p-4 cursor-pointer transition-transform hover:scale-[1.02]",
                styles.border
            )}
            onClick={onClick}
        >
            <div className="flex justify-between items-start">
                <div className="min-w-0 flex-1">
                    <p className="text-xs text-[var(--text-secondary)] truncate">{title}</p>
                    <p className="text-2xl font-extrabold text-[var(--text-primary)] my-1">{value}</p>
                    <p className="text-[11px] text-[var(--text-muted)]">{subtitle}</p>
                    {trend && (
                        <p className={cn(
                            "text-[11px] font-semibold mt-1",
                            trend.isPositive ? "text-[var(--success-color)]" : "text-[var(--danger-color)]"
                        )}>
                            {trend.isPositive ? "+" : ""}{trend.value}% from last month
                        </p>
                    )}
                </div>
                <div className={cn(
                    "w-11 h-11 rounded-xl flex items-center justify-center shrink-0",
                    styles.iconBg
                )}>
                    <Icon className={cn("w-5 h-5", styles.iconColor)} />
                </div>
            </div>
        </GlassCard>
    )
}
