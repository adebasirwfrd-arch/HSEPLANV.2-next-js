"use client"

import { useState, useEffect, useCallback, ReactNode } from "react"
import { Responsive, WidthProvider, Layout } from "react-grid-layout"
import debounce from "lodash.debounce"
import { GripVertical, Lock, Unlock } from "lucide-react"

const ResponsiveGridLayout = WidthProvider(Responsive)

// Layout storage key
const LAYOUT_STORAGE_KEY = "hse-dashboard-layout"

// Default layout configuration
const DEFAULT_LAYOUTS: { [key: string]: Layout[] } = {
    lg: [
        { i: "compliance", x: 0, y: 0, w: 1, h: 2 },
        { i: "total", x: 1, y: 0, w: 1, h: 1 },
        { i: "completed", x: 2, y: 0, w: 1, h: 1 },
        { i: "action", x: 3, y: 0, w: 1, h: 1 },
        { i: "progress", x: 0, y: 2, w: 1, h: 3 },
        { i: "trend", x: 1, y: 1, w: 2, h: 3 },
        { i: "overdue", x: 0, y: 5, w: 2, h: 2 },
        { i: "status", x: 2, y: 5, w: 2, h: 2 },
    ],
    md: [
        { i: "compliance", x: 0, y: 0, w: 2, h: 1 },
        { i: "total", x: 2, y: 0, w: 2, h: 1 },
        { i: "completed", x: 0, y: 1, w: 2, h: 1 },
        { i: "action", x: 2, y: 1, w: 2, h: 1 },
        { i: "progress", x: 0, y: 2, w: 2, h: 2 },
        { i: "trend", x: 2, y: 2, w: 2, h: 2 },
        { i: "overdue", x: 0, y: 4, w: 2, h: 2 },
        { i: "status", x: 2, y: 4, w: 2, h: 2 },
    ],
    sm: [
        { i: "compliance", x: 0, y: 0, w: 2, h: 1 },
        { i: "total", x: 0, y: 1, w: 1, h: 1 },
        { i: "completed", x: 1, y: 1, w: 1, h: 1 },
        { i: "action", x: 0, y: 2, w: 2, h: 1 },
        { i: "progress", x: 0, y: 3, w: 2, h: 2 },
        { i: "trend", x: 0, y: 5, w: 2, h: 2 },
        { i: "overdue", x: 0, y: 7, w: 2, h: 2 },
        { i: "status", x: 0, y: 9, w: 2, h: 2 },
    ],
}

interface DashboardWidgetProps {
    id: string
    children: ReactNode
    title?: string
    isEditing?: boolean
}

// Widget wrapper with drag handle
export function DashboardWidget({ children, title, isEditing }: DashboardWidgetProps) {
    return (
        <div className="h-full bg-[var(--bg-secondary)]/80 backdrop-blur-xl rounded-2xl border border-[var(--border-light)] overflow-hidden relative group">
            {/* Drag handle - only visible when editing */}
            {isEditing && (
                <div className="absolute top-2 left-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity cursor-move drag-handle">
                    <div className="bg-[var(--bg-tertiary)] rounded-lg p-1">
                        <GripVertical className="w-4 h-4 text-[var(--text-muted)]" />
                    </div>
                </div>
            )}
            {title && (
                <div className="px-4 pt-3 pb-1">
                    <h3 className="text-sm font-semibold text-[var(--text-primary)]">{title}</h3>
                </div>
            )}
            <div className="h-full">{children}</div>
        </div>
    )
}

interface DraggableDashboardProps {
    children: ReactNode[]
    widgetIds: string[]
}

export function DraggableDashboard({ children, widgetIds }: DraggableDashboardProps) {
    const [isEditing, setIsEditing] = useState(false)
    const [layouts, setLayouts] = useState(DEFAULT_LAYOUTS)
    const [mounted, setMounted] = useState(false)

    // Load saved layouts from localStorage
    useEffect(() => {
        setMounted(true)
        const savedLayouts = localStorage.getItem(LAYOUT_STORAGE_KEY)
        if (savedLayouts) {
            try {
                setLayouts(JSON.parse(savedLayouts))
            } catch {
                setLayouts(DEFAULT_LAYOUTS)
            }
        }
    }, [])

    // Save layouts to localStorage (debounced)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const saveLayouts = useCallback(
        debounce((newLayouts: { [key: string]: Layout[] }) => {
            localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(newLayouts))
        }, 500),
        []
    )

    const handleLayoutChange = (_: Layout[], allLayouts: { [key: string]: Layout[] }) => {
        setLayouts(allLayouts)
        saveLayouts(allLayouts)
    }

    const resetLayout = () => {
        setLayouts(DEFAULT_LAYOUTS)
        localStorage.removeItem(LAYOUT_STORAGE_KEY)
    }

    if (!mounted) {
        // Prevent SSR hydration mismatch
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {children}
            </div>
        )
    }

    return (
        <div className="relative">
            {/* Edit mode toggle */}
            <div className="absolute -top-10 right-0 z-20 flex items-center gap-2">
                <button
                    onClick={() => setIsEditing(!isEditing)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${isEditing
                            ? "bg-[var(--accent-blue)] text-white"
                            : "bg-[var(--bg-tertiary)] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                        }`}
                >
                    {isEditing ? (
                        <>
                            <Unlock className="w-3.5 h-3.5" />
                            Editing
                        </>
                    ) : (
                        <>
                            <Lock className="w-3.5 h-3.5" />
                            Customize
                        </>
                    )}
                </button>
                {isEditing && (
                    <button
                        onClick={resetLayout}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--bg-tertiary)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-all"
                    >
                        Reset
                    </button>
                )}
            </div>

            <ResponsiveGridLayout
                className="layout"
                layouts={layouts}
                breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
                cols={{ lg: 4, md: 4, sm: 2, xs: 2, xxs: 1 }}
                rowHeight={100}
                isDraggable={isEditing}
                isResizable={isEditing}
                draggableHandle=".drag-handle"
                onLayoutChange={handleLayoutChange}
                margin={[16, 16]}
                containerPadding={[0, 0]}
            >
                {children.map((child, index) => (
                    <div key={widgetIds[index] || `widget-${index}`}>
                        {child}
                    </div>
                ))}
            </ResponsiveGridLayout>
        </div>
    )
}
