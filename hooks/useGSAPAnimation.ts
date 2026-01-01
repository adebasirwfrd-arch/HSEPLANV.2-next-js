"use client"

import { useRef, useEffect, RefObject } from "react"
import { gsap } from "gsap"

/**
 * Reusable GSAP entrance animation hook
 * Animates elements with specified selector on mount
 * 
 * Usage:
 * ```tsx
 * const containerRef = useGSAPAnimation()
 * 
 * return (
 *   <div ref={containerRef}>
 *     <div className="gsap-card">Card 1</div>
 *     <div className="gsap-card">Card 2</div>
 *   </div>
 * )
 * ```
 */
export function useGSAPAnimation<T extends HTMLElement = HTMLDivElement>(
    options: {
        selector?: string
        delay?: number
        duration?: number
        stagger?: number
        y?: number
        ease?: string
        dependencies?: unknown[]
    } = {}
): RefObject<T | null> {
    const {
        selector = ".gsap-card",
        delay = 0,
        duration = 0.6,
        stagger = 0.1,
        y = 30,
        ease = "power3.out",
        dependencies = []
    } = options

    const containerRef = useRef<T>(null)

    useEffect(() => {
        if (!containerRef.current) return

        const elements = containerRef.current.querySelectorAll(selector)
        if (elements.length === 0) return

        // Set initial state
        gsap.set(elements, { opacity: 0, y })

        // Animate in
        gsap.to(elements, {
            opacity: 1,
            y: 0,
            duration,
            stagger,
            delay,
            ease,
        })

        // Cleanup
        return () => {
            gsap.killTweensOf(elements)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selector, delay, duration, stagger, y, ease, ...dependencies])

    return containerRef
}
