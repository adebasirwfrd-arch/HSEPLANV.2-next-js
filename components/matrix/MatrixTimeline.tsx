"use client"

import { useMemo } from "react"
import { useEpg, Epg, Layout } from "planby"

// Types for Matrix Program matching the page
interface MatrixMonthData {
    plan: number
    actual: number
    wpts_id?: string
    plan_date?: string
    impl_date?: string
    pic_name?: string
    pic_email?: string
}

interface MatrixProgram {
    id: number
    name: string
    reference?: string
    plan_type: string
    months: Record<string, MatrixMonthData>
    progress?: number
}

interface MatrixTimelineProps {
    programs: MatrixProgram[]
    year: number
}

// Month utilities
const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']

// Get last day of month
function getLastDayOfMonth(year: number, monthIndex: number): number {
    return new Date(year, monthIndex + 1, 0).getDate()
}

// Get color based on plan/actual values
function getStatusColor(plan: number, actual: number): string {
    if (actual >= plan && plan > 0) return "#10b981" // Emerald - Complete
    if (actual > 0 && actual < plan) return "#f59e0b" // Amber - In Progress
    if (plan > 0 && actual === 0) return "#ef4444" // Red - Not Started
    return "#e2e8f0" // Gray - No Activity
}

export function MatrixTimeline({ programs, year }: MatrixTimelineProps) {
    // Transform programs to Planby channels format
    const channels = useMemo(() => {
        return programs.map((program, index) => ({
            uuid: String(program.id),
            logo: "",
            title: program.name,
            position: {
                top: index * 60,
                height: 50
            }
        }))
    }, [programs])

    // Transform program months to Planby EPG (events) format
    const epg = useMemo(() => {
        const events: Array<{
            id: string
            channelUuid: string
            title: string
            description: string
            since: string
            till: string
            image: string
            color: string
        }> = []

        programs.forEach(program => {
            MONTHS.forEach((month, monthIndex) => {
                const monthData = program.months[month]
                if (!monthData || (monthData.plan === 0 && monthData.actual === 0)) {
                    return
                }

                const startDate = new Date(year, monthIndex, 1)
                const endDate = new Date(year, monthIndex, getLastDayOfMonth(year, monthIndex), 23, 59, 59)

                events.push({
                    id: `${program.id}-${month}`,
                    channelUuid: String(program.id),
                    title: `${monthData.actual}/${monthData.plan}`,
                    description: program.reference || program.plan_type || "",
                    since: startDate.toISOString(),
                    till: endDate.toISOString(),
                    image: "",
                    color: getStatusColor(monthData.plan, monthData.actual)
                })
            })
        })

        return events
    }, [programs, year])

    // Planby hook with Matrix teal theme
    const { getEpgProps, getLayoutProps } = useEpg({
        channels,
        epg,
        dayWidth: 120,
        sidebarWidth: 220,
        itemHeight: 50,
        isSidebar: true,
        isTimeline: true,
        isLine: false,
        startDate: `${year}-01-01T00:00:00`,
        endDate: `${year}-12-31T23:59:59`,
        theme: {
            primary: {
                600: "#16a085",
                900: "#0d5c4d"
            },
            grey: { 300: "#e5e7eb" },
            white: "#ffffff",
            green: { 300: "#1abc9c" },
            scrollbar: {
                border: "#ffffff",
                thumb: { bg: "#4b5563" }
            },
            loader: {
                teal: "#16a085",
                purple: "#8b5cf6",
                pink: "#ec4899",
                bg: "#1e293b"
            },
            gradient: {
                blue: {
                    300: "#16a085",
                    600: "#1abc9c",
                    900: "#0d5c4d"
                }
            },
            text: {
                grey: {
                    300: "#9ca3af",
                    500: "#6b7280"
                }
            },
            timeline: {
                divider: { bg: "#374151" }
            }
        }
    })

    if (programs.length === 0) {
        return (
            <div className="h-[500px] flex items-center justify-center text-[var(--text-muted)]">
                No programs to display in timeline
            </div>
        )
    }

    return (
        <div className="h-[500px] rounded-2xl overflow-hidden border border-[var(--border-light)] bg-[var(--bg-secondary)]/50 backdrop-blur-xl">
            <Epg {...getEpgProps()}>
                <Layout
                    {...getLayoutProps()}
                    renderProgram={({ program, ...rest }) => {
                        const programData = program.data as {
                            id: string
                            title: string
                            description: string
                            color?: string
                        }

                        // Extract position from rest with type assertion
                        const pos = (rest as { position?: { left?: number; top?: number; width?: number; height?: number } }).position

                        return (
                            <div
                                key={programData.id}
                                style={{
                                    position: 'absolute',
                                    left: pos?.left ?? 0,
                                    top: pos?.top ?? 0,
                                    width: pos?.width ?? 100,
                                    height: pos?.height ?? 40,
                                    backgroundColor: programData.color || "#16a085",
                                    borderRadius: "8px",
                                    padding: "4px 8px",
                                    overflow: "hidden",
                                    cursor: "pointer",
                                    transition: "all 0.2s ease",
                                    border: "1px solid rgba(255,255,255,0.2)"
                                }}
                                className="hover:scale-105 hover:z-10"
                            >
                                <div className="text-[10px] font-bold text-white truncate">
                                    {programData.title}
                                </div>
                                <div className="text-[8px] text-white/70 truncate">
                                    {programData.description}
                                </div>
                            </div>
                        )
                    }}
                    renderChannel={({ channel }) => (
                        <div
                            key={channel.uuid}
                            className="flex items-center h-full px-3 bg-[var(--bg-tertiary)] border-b border-[var(--border-light)]"
                        >
                            <span className="text-xs font-medium text-[var(--text-primary)] truncate">
                                {channel.title}
                            </span>
                        </div>
                    )}
                />
            </Epg>
        </div>
    )
}
