import { cn } from "@/lib/utils"
import type { ReactNode } from "react"

interface GlassCardProps {
    children: ReactNode
    className?: string
    onClick?: () => void
}

export function GlassCard({ children, className, onClick }: GlassCardProps) {
    return (
        <div
            className={cn("glass-card", className)}
            onClick={onClick}
            role={onClick ? "button" : undefined}
            tabIndex={onClick ? 0 : undefined}
        >
            {children}
        </div>
    )
}
