"use client"

interface ProgressRingProps {
    value: number
    label?: string
    size?: number
    strokeWidth?: number
    color?: string
    textColor?: string
    trackColor?: string
}

export function ProgressRing({
    value,
    label,
    size = 80,
    strokeWidth = 3,
    color = "#3498db",
    textColor = "var(--text-primary)",
    trackColor = "rgba(0,0,0,0.1)"
}: ProgressRingProps) {
    const radius = 15.9
    const circumference = 2 * Math.PI * radius
    const progress = Math.min(Math.max(value, 0), 100)
    const strokeDasharray = `${(progress / 100) * circumference} ${circumference}`
    const displayValue = value > 100 ? value : progress

    return (
        <div className="relative" style={{ width: size, height: size }}>
            <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                {/* Background circle */}
                <circle
                    cx="18"
                    cy="18"
                    r={radius}
                    fill="transparent"
                    stroke={trackColor}
                    strokeWidth={strokeWidth}
                />
                {/* Progress circle */}
                <circle
                    cx="18"
                    cy="18"
                    r={radius}
                    fill="transparent"
                    stroke={color}
                    strokeWidth={strokeWidth}
                    strokeDasharray={strokeDasharray}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-lg font-extrabold" style={{ color: textColor }}>{displayValue}%</span>
                {label && <span className="text-[10px]" style={{ color: textColor, opacity: 0.8 }}>{label}</span>}
            </div>
        </div>
    )
}
