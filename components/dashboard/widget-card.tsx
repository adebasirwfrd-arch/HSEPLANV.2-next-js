"use client"

import { cn } from "@/lib/utils"
import type { LucideIcon } from "lucide-react"
import Link from "next/link"

type ColorVariant = "accent" | "success" | "warning" | "info"

interface WidgetCardProps {
    title: string
    description: string
    icon: LucideIcon
    href: string
    count?: number
    color?: ColorVariant
    compact?: boolean
}

const gradientStyles: Record<ColorVariant, string> = {
    accent: "from-[#667eea] to-[#764ba2]",
    success: "from-[#11998e] to-[#38ef7d]",
    warning: "from-[#f093fb] to-[#f5576c]",
    info: "from-[#fa709a] to-[#fee140]"
}

export function WidgetCard({ title, description, icon: Icon, href, count, color = "accent", compact }: WidgetCardProps) {
    const gradient = gradientStyles[color]

    return (
        <Link href={href} className="block">
            <div className={cn(
                "bg-gradient-to-br rounded-xl p-4 cursor-pointer transition-all duration-200",
                "hover:-translate-y-0.5 hover:shadow-lg",
                gradient,
                compact && "p-3"
            )}>
                <div className="flex justify-between items-center mb-3">
                    <Icon className="w-6 h-6 text-white" />
                    <span className="text-[10px] text-white/70">→</span>
                </div>
                <div className="text-2xl font-bold text-white">{count ?? 0}</div>
                <div className="text-xs text-white/80 mt-1">{title}</div>
                {!compact && <div className="text-[10px] text-white/60">{description}</div>}
            </div>
        </Link>
    )
}
