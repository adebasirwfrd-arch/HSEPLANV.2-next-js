"use client"

import { useState, useEffect } from "react"
import { Shield, Smile, Meh, Frown } from "lucide-react"

interface SafetyMascotProps {
    score: number
    className?: string
}

/**
 * Interactive Safety Mascot
 * Reacts to compliance score with different expressions
 * Uses animated emoji icons for reliability
 */
export function SafetyMascot({ score, className = "" }: SafetyMascotProps) {
    const [animate, setAnimate] = useState(false)

    // Trigger animation on score change
    useEffect(() => {
        setAnimate(true)
        const timer = setTimeout(() => setAnimate(false), 500)
        return () => clearTimeout(timer)
    }, [score])

    // Determine mascot state based on score
    const getMascotConfig = () => {
        if (score >= 80) {
            return {
                Icon: Smile,
                bgColor: "from-[#10b981] to-[#059669]",
                label: "Excellent!",
                pulse: "animate-[pulse_2s_infinite]"
            }
        } else if (score >= 50) {
            return {
                Icon: Meh,
                bgColor: "from-[#f59e0b] to-[#d97706]",
                label: "Needs Work",
                pulse: ""
            }
        } else {
            return {
                Icon: Frown,
                bgColor: "from-[#ef4444] to-[#dc2626]",
                label: "Critical!",
                pulse: "animate-[pulse_1s_infinite]"
            }
        }
    }

    const { Icon, bgColor, label, pulse } = getMascotConfig()

    return (
        <div className={`relative ${className}`}>
            {/* Mascot Circle */}
            <div
                className={`
                    w-full h-full 
                    bg-gradient-to-br ${bgColor} 
                    rounded-full 
                    flex items-center justify-center 
                    shadow-lg
                    ${pulse}
                    transition-transform duration-300
                    ${animate ? "scale-125" : "scale-100"}
                `}
            >
                <Icon className="w-1/2 h-1/2 text-white drop-shadow-md" />
            </div>

            {/* Score badge overlay */}
            <div className="absolute -bottom-1 -right-1 bg-white/95 backdrop-blur-sm rounded-full px-1.5 py-0.5 shadow-lg border border-[var(--border-light)]">
                <span className={`text-[10px] font-bold ${score >= 80 ? "text-[#10b981]" :
                        score >= 50 ? "text-[#f59e0b]" :
                            "text-[#ef4444]"
                    }`}>
                    {score}%
                </span>
            </div>

            {/* Tooltip on hover */}
            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 hover:opacity-100 transition-opacity">
                <span className="text-[10px] text-[var(--text-muted)] whitespace-nowrap bg-[var(--bg-secondary)] px-2 py-1 rounded shadow">
                    {label}
                </span>
            </div>
        </div>
    )
}
