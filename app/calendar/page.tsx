"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { AppShell } from "@/components/layout/app-shell"
import { GlassCard } from "@/components/ui/glass-card"
import { cn } from "@/lib/utils"
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, ExternalLink } from "lucide-react"
import { loadPersistedData, getCalendarEvents, getOTPData, OTPData } from "@/lib/otp-store"

type ViewMode = "weekly" | "monthly"

const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

interface CalendarEvent {
    id: number
    source: string
    region: string
    base: string | null
    program_name: string
    month: string
    plan_date: string
    impl_date: string
    pic_name: string
    plan_type: string
}

export default function CalendarPage() {
    const router = useRouter()
    const [viewMode, setViewMode] = useState<ViewMode>("monthly")
    const [currentDate, setCurrentDate] = useState(new Date())
    const [events, setEvents] = useState<CalendarEvent[]>([])
    const [selectedDate, setSelectedDate] = useState<string | null>(null)

    const currentMonth = currentDate.getMonth()
    const currentYear = currentDate.getFullYear()
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay()
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()

    // Load events from OTP and Tasks localStorage
    useEffect(() => {
        const loadEvents = () => {
            const allEvents: CalendarEvent[] = []

            // Load OTP/Matrix events
            const persisted = loadPersistedData()
            if (persisted) {
                const otpEvents = getCalendarEvents(persisted)
                allEvents.push(...otpEvents)
            } else {
                const defaultData: Record<string, OTPData> = {
                    "asia": getOTPData("asia", ""),
                    "indonesia_all": getOTPData("indonesia", "all"),
                    "indonesia_narogong": getOTPData("indonesia", "narogong"),
                    "indonesia_duri": getOTPData("indonesia", "duri"),
                    "indonesia_balikpapan": getOTPData("indonesia", "balikpapan"),
                }
                const otpEvents = getCalendarEvents(defaultData)
                allEvents.push(...otpEvents)
            }

            // Load Task events
            try {
                const taskCalendar = localStorage.getItem('hse-tasks-calendar')
                if (taskCalendar) {
                    const taskEvents = JSON.parse(taskCalendar)
                    taskEvents.forEach((t: { id: string; source: string; programName: string; title: string; code: string; implementationDate: string; picName: string; wptsId?: string; status: string }) => {
                        allEvents.push({
                            id: parseInt(t.id.replace(/\D/g, '')) || 0,
                            source: 'task',
                            region: 'task',
                            base: null,
                            program_name: `${t.code}: ${t.title}`,
                            month: '',
                            plan_date: t.implementationDate,
                            impl_date: t.status === 'Completed' ? t.implementationDate : '',
                            pic_name: t.wptsId ? `${t.picName} • WPTS: ${t.wptsId}` : t.picName,
                            plan_type: 'task'
                        })
                    })
                }
            } catch (e) {
                console.error('Error loading task calendar:', e)
            }

            setEvents(allEvents)
        }

        loadEvents()

        const handleStorage = () => loadEvents()
        window.addEventListener("storage", handleStorage)

        // Also refresh on focus
        const handleFocus = () => loadEvents()
        window.addEventListener("focus", handleFocus)

        return () => {
            window.removeEventListener("storage", handleStorage)
            window.removeEventListener("focus", handleFocus)
        }
    }, [])

    const changeMonth = (delta: number) => {
        setCurrentDate(new Date(currentYear, currentMonth + delta, 1))
    }

    const getEventsForDay = (day: number) => {
        const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
        return events.filter(e => e.plan_date === dateStr || e.impl_date === dateStr)
    }

    const today = new Date()
    const isToday = (day: number) =>
        today.getDate() === day &&
        today.getMonth() === currentMonth &&
        today.getFullYear() === currentYear

    // Get all events for current month for default display
    const currentMonthEvents = useMemo(() => {
        return events.filter(e => {
            const planMonth = e.plan_date ? new Date(e.plan_date + "T00:00:00").getMonth() : -1
            const planYear = e.plan_date ? new Date(e.plan_date + "T00:00:00").getFullYear() : -1
            const implMonth = e.impl_date ? new Date(e.impl_date + "T00:00:00").getMonth() : -1
            const implYear = e.impl_date ? new Date(e.impl_date + "T00:00:00").getFullYear() : -1
            return (planMonth === currentMonth && planYear === currentYear) ||
                (implMonth === currentMonth && implYear === currentYear)
        }).sort((a, b) => {
            const dateA = a.plan_date || a.impl_date || ""
            const dateB = b.plan_date || b.impl_date || ""
            return dateA.localeCompare(dateB)
        })
    }, [events, currentMonth, currentYear])

    // Get events for selected date or all current month events
    const displayEvents = useMemo(() => {
        if (selectedDate) {
            return events.filter(e => e.plan_date === selectedDate || e.impl_date === selectedDate)
        }
        return currentMonthEvents
    }, [selectedDate, events, currentMonthEvents])

    const handleDayClick = (day: number) => {
        const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
        setSelectedDate(dateStr)
    }

    const navigateToOTP = (event?: CalendarEvent) => {
        router.push("/otp")
    }

    // Truncate text for calendar cells
    const truncateText = (text: string, maxLen: number) => {
        if (text.length <= maxLen) return text
        return text.substring(0, maxLen - 2) + ".."
    }

    return (
        <AppShell>
            <div className="space-y-4">
                {/* Header */}
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-[#9b59b6] to-[#8e44ad] rounded-xl flex items-center justify-center text-2xl">
                        📅
                    </div>
                    <div className="flex-1">
                        <h1 className="text-xl font-bold text-[var(--text-primary)]">HSE Plan</h1>
                        <p className="text-xs text-[var(--text-muted)]">OTP & Matrix Program Schedule</p>
                    </div>
                    <motion.div
                        whileHover={{ scale: 1.05 }}
                        transition={{ type: "spring", stiffness: 300 }}
                        className="text-xs text-[var(--text-muted)] bg-[var(--bg-secondary)] px-3 py-1.5 rounded-lg cursor-pointer"
                    >
                        📊 {currentMonthEvents.length} events this month
                    </motion.div>
                </div>

                {/* Calendar Card */}
                <GlassCard className="p-4">
                    {/* View Toggle */}
                    <div className="flex justify-between items-center mb-4">
                        <div className="font-semibold text-[var(--accent-blue)] flex items-center gap-2">
                            <CalendarIcon className="w-4 h-4" /> Calendar
                        </div>
                        <div className="flex gap-1">
                            <button
                                onClick={() => setViewMode("weekly")}
                                className={cn(
                                    "px-3 py-1 rounded-md text-xs font-semibold transition-colors",
                                    viewMode === "weekly"
                                        ? "bg-[var(--accent-blue)] text-white"
                                        : "bg-[var(--bg-tertiary)] text-[var(--text-primary)]"
                                )}
                            >
                                Weekly
                            </button>
                            <button
                                onClick={() => setViewMode("monthly")}
                                className={cn(
                                    "px-3 py-1 rounded-md text-xs font-semibold transition-colors",
                                    viewMode === "monthly"
                                        ? "bg-[var(--accent-blue)] text-white"
                                        : "bg-[var(--bg-tertiary)] text-[var(--text-primary)]"
                                )}
                            >
                                Monthly
                            </button>
                        </div>
                    </div>

                    {/* Month Navigation */}
                    <div className="flex justify-between items-center mb-4">
                        <button
                            onClick={() => changeMonth(-1)}
                            className="p-2 bg-[var(--bg-tertiary)] rounded-lg hover:bg-[var(--bg-tertiary)]/80 transition-colors"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <h2 className="text-lg font-bold text-[var(--text-primary)]">
                            {monthNames[currentMonth]} {currentYear}
                        </h2>
                        <button
                            onClick={() => changeMonth(1)}
                            className="p-2 bg-[var(--bg-tertiary)] rounded-lg hover:bg-[var(--bg-tertiary)]/80 transition-colors"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Day Headers */}
                    <div className="grid grid-cols-7 gap-0.5 mb-2">
                        {dayNames.map((day) => (
                            <div key={day} className="text-center text-xs font-semibold text-[var(--text-muted)] py-2">
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* Calendar Grid - with event names */}
                    <div className="grid grid-cols-7 gap-0.5">
                        {/* Empty cells for days before month starts */}
                        {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                            <div key={`empty-${i}`} className="min-h-[80px]" />
                        ))}

                        {/* Day cells with events */}
                        {Array.from({ length: daysInMonth }).map((_, i) => {
                            const day = i + 1
                            const dayEvents = getEventsForDay(day)
                            const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                            const isSelected = selectedDate === dateStr

                            return (
                                <div
                                    key={day}
                                    onClick={() => handleDayClick(day)}
                                    className={cn(
                                        "min-h-[80px] p-1 rounded-lg cursor-pointer transition-all relative overflow-hidden",
                                        isToday(day)
                                            ? "bg-[var(--accent-blue)]/20 ring-2 ring-[var(--accent-blue)]"
                                            : isSelected
                                                ? "bg-[var(--bg-tertiary)] ring-2 ring-[var(--accent-blue)]/50"
                                                : dayEvents.length > 0
                                                    ? "bg-[var(--bg-tertiary)]/30 hover:bg-[var(--bg-tertiary)]"
                                                    : "hover:bg-[var(--bg-tertiary)]/50"
                                    )}
                                >
                                    <span className={cn(
                                        "text-xs font-semibold",
                                        isToday(day) ? "text-[var(--accent-blue)]" : ""
                                    )}>{day}</span>

                                    {/* Event names stacked */}
                                    <div className="mt-0.5 space-y-0.5 overflow-hidden">
                                        {dayEvents.slice(0, 3).map((event, idx) => {
                                            const isPlanDate = event.plan_date === dateStr
                                            return (
                                                <div
                                                    key={idx}
                                                    className={cn(
                                                        "text-[8px] px-1 py-0.5 rounded truncate",
                                                        isPlanDate
                                                            ? "bg-[#f1c40f]/20 text-[#b8860b]"
                                                            : "bg-[#27ae60]/20 text-[#27ae60]"
                                                    )}
                                                    title={`${event.program_name}${event.pic_name ? ` - PIC: ${event.pic_name}` : ""}`}
                                                >
                                                    {truncateText(event.program_name, 12)}
                                                    {event.pic_name && (
                                                        <span className="opacity-70"> • {truncateText(event.pic_name, 6)}</span>
                                                    )}
                                                </div>
                                            )
                                        })}
                                        {dayEvents.length > 3 && (
                                            <div className="text-[8px] text-[var(--text-muted)] px-1">
                                                +{dayEvents.length - 3} more
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>

                    {/* Legend */}
                    <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-[var(--border-light)] text-xs">
                        <div className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 bg-[#f1c40f] rounded" />
                            📋 Plan Date
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 bg-[#27ae60] rounded" />
                            ✅ Implemented
                        </div>
                        <div className="flex items-center gap-1.5 border-l border-[var(--border-light)] pl-4">
                            <span className="w-2 h-2 bg-[#3498db] rounded-full" />
                            OTP
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 bg-[#9b59b6] rounded-full" />
                            Matrix
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 bg-[#e74c3c] rounded-full" />
                            Task
                        </div>
                    </div>
                </GlassCard>

                {/* Event List - Always Shown with Month Events */}
                <GlassCard className="p-4">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="font-bold text-[var(--text-primary)]">
                            {selectedDate
                                ? `Events for ${new Date(selectedDate + "T00:00:00").toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`
                                : `Scheduled Events - ${monthNames[currentMonth]} ${currentYear}`
                            }
                        </h3>
                        {selectedDate && (
                            <button
                                onClick={() => setSelectedDate(null)}
                                className="text-xs text-[var(--accent-blue)] hover:underline"
                            >
                                Show all month
                            </button>
                        )}
                    </div>

                    {displayEvents.length === 0 ? (
                        <div className="text-center py-8 text-[var(--text-muted)]">
                            <CalendarIcon className="w-12 h-12 mx-auto mb-2 opacity-30" />
                            <p className="text-sm">No scheduled events</p>
                            <p className="text-xs mt-1">Add plan dates in OTP to see them here</p>
                        </div>
                    ) : (
                        <div className="space-y-2 max-h-[400px] overflow-y-auto">
                            {displayEvents.map((event, idx) => (
                                <div
                                    key={idx}
                                    onClick={() => navigateToOTP(event)}
                                    className="p-3 bg-[var(--bg-tertiary)]/50 rounded-lg cursor-pointer hover:bg-[var(--bg-tertiary)] transition-colors group"
                                >
                                    <div className="flex items-start gap-3">
                                        <div className={cn(
                                            "w-10 h-10 rounded-lg flex items-center justify-center text-white text-sm font-bold shrink-0",
                                            event.source === "otp" ? "bg-[#3498db]"
                                                : event.source === "task" ? "bg-[#e74c3c]"
                                                    : "bg-[#9b59b6]"
                                        )}>
                                            {event.source === "otp" ? "O" : event.source === "task" ? "T" : "M"}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-medium text-sm text-[var(--text-primary)] leading-tight">{event.program_name}</div>
                                            <div className="text-xs text-[var(--text-muted)] flex flex-wrap gap-x-2 gap-y-0.5 mt-1">
                                                {event.source === "task" ? (
                                                    <span>📋 Task</span>
                                                ) : (
                                                    <span>{event.region === "asia" ? "🌏 Asia" : `🇮🇩 ${event.base || "All"}`}</span>
                                                )}
                                                {event.month && <span>• {event.month.toUpperCase()}</span>}
                                                {event.pic_name && <span>• 👤 {event.pic_name}</span>}
                                            </div>
                                            <div className="flex gap-2 mt-2">
                                                {event.plan_date && (
                                                    <span className="px-2 py-0.5 bg-[#f1c40f]/20 text-[#b8860b] text-[10px] rounded flex items-center gap-1">
                                                        📋 {event.plan_date}
                                                    </span>
                                                )}
                                                {event.impl_date && (
                                                    <span className="px-2 py-0.5 bg-[#27ae60]/20 text-[#27ae60] text-[10px] rounded flex items-center gap-1">
                                                        ✅ {event.impl_date}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="text-xs text-[var(--accent-blue)] opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                                            <ExternalLink className="w-3 h-3" /> OTP
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </GlassCard>
            </div>
        </AppShell>
    )
}
