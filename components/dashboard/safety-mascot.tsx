"use client"

import { useEffect } from "react"
import { useRive, useStateMachineInput, Layout, Fit, Alignment } from "@rive-app/react-canvas"
import { Shield } from "lucide-react"

interface SafetyMascotProps {
    score: number
    className?: string
}

/**
 * Interactive Safety Mascot using Rive Animation
 * Reacts to compliance score with different expressions
 */
export function SafetyMascot({ score, className = "" }: SafetyMascotProps) {
    // Initialize Rive instance
    const { rive, RiveComponent } = useRive({
        src: "https://cdn.rive.app/animations/vehicles.riv",
        stateMachines: "bumpy",
        autoplay: true,
        layout: new Layout({
            fit: Fit.Contain,
            alignment: Alignment.Center,
        }),
        onLoadError: (err) => {
            console.warn("Rive load error:", err)
        },
    })

    // Get state machine input for controlling animation speed/intensity
    const levelInput = useStateMachineInput(rive, "bumpy", "level")

    // Update animation based on score
    useEffect(() => {
        if (levelInput) {
            // Map score (0-100) to level input
            // High score = smoother (lower level), Low score = bumpier (higher level)
            if (score >= 80) {
                levelInput.value = 1 // Smooth/Happy
            } else if (score >= 50) {
                levelInput.value = 2 // Medium/Neutral
            } else {
                levelInput.value = 3 // Bumpy/Warning
            }
        }
    }, [score, levelInput])

    // Fallback if Rive fails to load
    if (!rive) {
        return (
            <div className={`flex items-center justify-center ${className}`}>
                <div className="w-16 h-16 bg-gradient-to-br from-[var(--accent-blue)] to-[var(--accent-sky)] rounded-full flex items-center justify-center animate-pulse">
                    <Shield className="w-8 h-8 text-white" />
                </div>
            </div>
        )
    }

    return (
        <div className={`relative ${className}`}>
            <RiveComponent className="w-full h-full" />

            {/* Score badge overlay */}
            <div className="absolute -bottom-1 -right-1 bg-white/90 backdrop-blur-sm rounded-full px-2 py-0.5 shadow-lg border border-[var(--border-light)]">
                <span className={`text-xs font-bold ${score >= 80 ? "text-[var(--success-color)]" :
                        score >= 50 ? "text-[var(--warning-color)]" :
                            "text-[var(--danger-color)]"
                    }`}>
                    {score}%
                </span>
            </div>
        </div>
    )
}
