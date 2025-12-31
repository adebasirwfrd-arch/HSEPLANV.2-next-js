"use client"

import { useState, createContext, useContext, type ReactNode } from "react"
import {
    Home, FileText, ListChecks, BarChart3, Calendar,
    FolderOpen, TrendingUp, Target, Grid, ClipboardList,
    Download, Settings, LogIn, LogOut, Menu, X, ChevronRight, Shield
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { downloadFullReport } from "@/lib/export-report"

interface AppShellContextType {
    isDrawerOpen: boolean
    openDrawer: () => void
    closeDrawer: () => void
    isAdmin: boolean
    setIsAdmin: (value: boolean) => void
}

const AppShellContext = createContext<AppShellContextType | null>(null)

export function useAppShell() {
    const context = useContext(AppShellContext)
    if (!context) throw new Error("useAppShell must be used within AppShell")
    return context
}

const navItems = [
    { href: "/", label: "Home", icon: Home },
    { href: "/hse-programs", label: "HSE Programs", icon: FileText },
    { href: "/tasks", label: "Tasks", icon: ListChecks },
    { href: "/statistics", label: "Statistics", icon: BarChart3 },
    { href: "/calendar", label: "Calendar", icon: Calendar },
    { href: "/related-docs", label: "Related Docs", icon: FolderOpen },
    { href: "/hse-kpi", label: "HSE KPI", icon: TrendingUp },
    { href: "/ll-indicator", label: "LL Indicator", icon: Target },
    { href: "/otp", label: "HSE OTP", icon: ClipboardList },
    { href: "/matrix", label: "Matrix", icon: Grid },
]

const bottomNavItems = [
    { href: "/", label: "Home", icon: Home },
    { href: "/hse-programs", label: "Programs", icon: FileText },
    { href: "/tasks", label: "Tasks", icon: ListChecks },
    { href: "/statistics", label: "Stats", icon: BarChart3 },
    { href: "/calendar", label: "Calendar", icon: Calendar },
    { href: "/related-docs", label: "Docs", icon: FolderOpen },
    { href: "/hse-kpi", label: "KPI", icon: TrendingUp },
    { href: "/ll-indicator", label: "LL", icon: Target },
    { href: "/otp", label: "OTP", icon: ClipboardList },
    { href: "/matrix", label: "Matrix", icon: Grid },
]

export function AppShell({ children }: { children: ReactNode }) {
    const [isDrawerOpen, setIsDrawerOpen] = useState(false)
    const [isAdmin, setIsAdmin] = useState(false)
    const pathname = usePathname()

    return (
        <AppShellContext.Provider value={{
            isDrawerOpen,
            openDrawer: () => setIsDrawerOpen(true),
            closeDrawer: () => setIsDrawerOpen(false),
            isAdmin,
            setIsAdmin
        }}>
            <div className="min-h-screen">
                {/* Header */}
                <header className="fixed top-0 left-0 right-0 h-[60px] bg-[var(--bg-primary)] flex items-center justify-between px-4 z-50 border-b border-[var(--border-light)]">
                    <button
                        onClick={() => setIsDrawerOpen(true)}
                        className="p-2 text-[var(--accent-blue)] hover:bg-[var(--bg-tertiary)] rounded-lg transition-colors"
                    >
                        <Menu className="w-6 h-6" />
                    </button>
                    <div className="font-semibold text-[var(--text-primary)]">HSE Plan</div>
                    <div className="w-10" /> {/* Spacer for centering */}
                </header>

                {/* Drawer Overlay */}
                {isDrawerOpen && (
                    <div
                        className="fixed inset-0 bg-black/70 z-[200] transition-opacity"
                        onClick={() => setIsDrawerOpen(false)}
                    />
                )}

                {/* Side Drawer */}
                <nav className={cn(
                    "fixed top-0 left-0 w-[280px] h-full bg-[var(--bg-secondary)] z-[201] flex flex-col",
                    "transition-transform duration-300 ease-out",
                    isDrawerOpen ? "translate-x-0" : "-translate-x-full"
                )}>
                    {/* Drawer Header */}
                    <div className="p-5 flex justify-between items-start border-b border-[var(--border-light)]">
                        <div className="bg-gradient-to-br from-[var(--accent-blue)] to-[var(--accent-sky)] px-4 py-2 rounded-lg">
                            <span className="text-white font-bold text-sm">HSE Plan</span>
                        </div>
                        <button
                            onClick={() => setIsDrawerOpen(false)}
                            className="p-1 text-[var(--accent-blue)] hover:bg-[var(--bg-tertiary)] rounded-lg"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Nav Items */}
                    <div className="flex-1 overflow-y-auto py-4">
                        {navItems.map((item) => {
                            const isActive = pathname === item.href
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setIsDrawerOpen(false)}
                                    className={cn(
                                        "flex items-center gap-4 px-6 py-4 transition-colors",
                                        isActive
                                            ? "text-[var(--accent-blue)] bg-[var(--bg-tertiary)]"
                                            : "text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]"
                                    )}
                                >
                                    <item.icon className="w-5 h-5" />
                                    <span className="text-sm font-medium">{item.label}</span>
                                    {isActive && <ChevronRight className="w-4 h-4 ml-auto" />}
                                </Link>
                            )
                        })}

                        {/* Divider */}
                        <div className="my-4 mx-6 border-t border-[var(--border-light)]" />

                        {/* Download */}
                        <button
                            onClick={() => {
                                setIsDrawerOpen(false)
                                downloadFullReport()
                            }}
                            className="flex items-center gap-4 px-6 py-4 w-full text-left text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors"
                        >
                            <Download className="w-5 h-5" />
                            <span className="text-sm font-medium">Download Report</span>
                        </button>

                        {/* Settings */}
                        <Link
                            href="/settings"
                            onClick={() => setIsDrawerOpen(false)}
                            className="flex items-center gap-4 px-6 py-4 w-full text-left text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors"
                        >
                            <Settings className="w-5 h-5" />
                            <span className="text-sm font-medium">Settings</span>
                        </Link>

                        {/* Audit Logs */}
                        <Link
                            href="/audit-logs"
                            onClick={() => setIsDrawerOpen(false)}
                            className="flex items-center gap-4 px-6 py-4 w-full text-left text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors"
                        >
                            <Shield className="w-5 h-5" />
                            <span className="text-sm font-medium">Audit Logs</span>
                            <span className="ml-auto text-[9px] bg-[var(--accent-purple)]/10 text-[var(--accent-purple)] px-2 py-0.5 rounded-full font-medium">
                                Admin
                            </span>
                        </Link>

                        {/* Admin Toggle */}
                        <button
                            onClick={() => setIsAdmin(!isAdmin)}
                            className={cn(
                                "flex items-center gap-4 px-6 py-4 w-full text-left transition-colors",
                                isAdmin
                                    ? "text-[var(--danger-color)] hover:bg-red-50"
                                    : "text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]"
                            )}
                        >
                            {isAdmin ? <LogOut className="w-5 h-5" /> : <LogIn className="w-5 h-5" />}
                            <span className="text-sm font-medium">{isAdmin ? "Logout" : "Admin Login"}</span>
                            {isAdmin && (
                                <span className="ml-auto text-[10px] bg-[var(--success-color)] text-white px-2 py-0.5 rounded-full font-bold">
                                    ADMIN
                                </span>
                            )}
                        </button>
                    </div>

                    {/* Drawer Footer */}
                    <div className="p-5 text-center border-t border-[var(--border-light)]">
                        <p className="text-xs text-[var(--text-muted)]">HSE App v2.0</p>
                        {isAdmin && (
                            <p className="text-[10px] text-[var(--success-color)] mt-1">✓ Admin Mode Active</p>
                        )}
                    </div>
                </nav>

                {/* Main Content */}
                <main className="pt-[60px] pb-[80px] min-h-screen">
                    <div className="p-4 max-w-4xl mx-auto">
                        {children}
                    </div>
                </main>

                {/* Bottom Navigation */}
                <nav className="fixed bottom-0 left-0 right-0 h-[60px] bg-[var(--bg-primary)] border-t border-[var(--border-light)] z-50 overflow-x-auto hide-scrollbar">
                    <div className="flex items-center h-full px-2 min-w-max">
                        {bottomNavItems.map((item) => {
                            const isActive = pathname === item.href
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={cn(
                                        "flex flex-col items-center gap-1 px-3 py-2 min-w-[56px] transition-colors flex-shrink-0",
                                        isActive ? "text-[var(--accent-blue)]" : "text-[var(--text-muted)]"
                                    )}
                                >
                                    <item.icon className="w-5 h-5" />
                                    <span className="text-[9px] font-medium whitespace-nowrap">{item.label}</span>
                                </Link>
                            )
                        })}
                    </div>
                </nav>
            </div>
        </AppShellContext.Provider>
    )
}

