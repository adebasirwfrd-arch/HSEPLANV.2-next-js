"use client"

import { useRef, useEffect } from 'react'

interface ProgressBarProps {
    segments: Array<{
        value: number
        color: string
        label: string
    }>
    height?: number
    animated?: boolean
}

export function ProgressBar({ segments, height = 24, animated = true }: ProgressBarProps) {
    const total = segments.reduce((acc, seg) => acc + seg.value, 0)
    const barRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (animated && barRef.current) {
            const segmentElements = barRef.current.querySelectorAll('.segment')
            segmentElements.forEach((el, index) => {
                const htmlEl = el as HTMLElement
                const targetWidth = htmlEl.dataset.width
                htmlEl.style.width = '0%'
                setTimeout(() => {
                    htmlEl.style.width = targetWidth || '0%'
                }, 100 + index * 100)
            })
        }
    }, [animated, segments])

    return (
        <div>
            <div
                ref={barRef}
                className="flex rounded-full overflow-hidden"
                style={{ height, background: 'var(--glass-white)' }}
            >
                {segments.map((segment, index) => {
                    const percentage = (segment.value / total) * 100
                    if (percentage === 0) return null

                    return (
                        <div
                            key={index}
                            className="segment flex items-center justify-center text-xs font-semibold text-white transition-all duration-700 ease-out"
                            data-width={`${percentage}%`}
                            style={{
                                width: animated ? '0%' : `${percentage}%`,
                                backgroundColor: segment.color,
                            }}
                        >
                            {percentage >= 10 && `${Math.round(percentage)}%`}
                        </div>
                    )
                })}
            </div>
            <div className="flex flex-wrap gap-4 mt-4">
                {segments.map((segment, index) => (
                    <div key={index} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: segment.color }} />
                        <span className="text-sm text-[var(--text-secondary)]">
                            {segment.label} ({segment.value})
                        </span>
                    </div>
                ))}
            </div>
        </div>
    )
}
