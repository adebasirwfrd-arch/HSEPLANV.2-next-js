"use client"

import { useState, createContext, useContext, type ReactNode } from "react"
import {
    Home, FileText, ListChecks, BarChart3, Calendar,
    FolderOpen, TrendingUp, Target, Grid, ClipboardList,
    Download, Settings, LogIn, LogOut, Menu, X, ChevronRight, Shield, User, Users
} from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { downloadFullReport } from "@/lib/export-report"
import { useAdmin } from "@/hooks/useAdmin"

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
    { href: "/community", label: "Community", icon: Users },
]

// Bottom nav for mobile - limited to key items
const mobileNavItems = [
    { href: "/", label: "Home", icon: Home },
    { href: "/otp", label: "OTP", icon: ClipboardList },
    { href: "/matrix", label: "Matrix", icon: Grid },
    { href: "/settings", label: "Profile", icon: User },
]

export function AppShell({ children }: { children: ReactNode }) {
    const [isDrawerOpen, setIsDrawerOpen] = useState(false)
    const pathname = usePathname()
    const router = useRouter()

    // Get real auth status from Supabase
    const { user, isAdmin, isAuthenticated, signOut, isLoading } = useAdmin()

    const handleAuthClick = async () => {
        if (isAuthenticated) {
            await signOut()
            router.push('/login')
        } else {
            router.push('/login')
        }
    }

    return (
        <AppShellContext.Provider value={{
            isDrawerOpen,
            openDrawer: () => setIsDrawerOpen(true),
            closeDrawer: () => setIsDrawerOpen(false),
            isAdmin,
            setIsAdmin: () => { } // No-op since auth is managed by Supabase
        }}>
            <div className="min-h-screen pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]">
                {/* ===== DESKTOP/TABLET FIXED SIDEBAR ===== */}
                {/* Desktop: 250px, Tablet: 70px */}
                <aside className={cn(
                    "fixed top-0 left-0 h-full bg-[var(--bg-secondary)] border-r border-[var(--border-light)] z-40",
                    "hidden md:flex flex-col",
                    "md:w-[70px] lg:w-[250px]",
                    "pl-[env(safe-area-inset-left)]"
                )}>
                    {/* Sidebar Header */}
                    <div className="p-3 lg:p-5 flex flex-col items-center lg:items-start gap-2 border-b border-[var(--border-light)]">
                        <div className="bg-gradient-to-br from-[var(--accent-blue)] to-[var(--accent-sky)] p-2 lg:px-4 lg:py-2 rounded-lg">
                            <span className="text-white font-bold text-sm hidden lg:block">HSE Plan</span>
                            <span className="text-white font-bold text-sm lg:hidden">HSE</span>
                        </div>
                        {/* Status Badge */}
                        {isAuthenticated && !isAdmin && (
                            <span className="text-[8px] lg:text-[9px] bg-[var(--warning-color)]/10 text-[var(--warning-color)] px-2 py-0.5 rounded-full font-medium hidden lg:block">
                                View-Only Mode
                            </span>
                        )}
                    </div>

                    {/* Nav Items */}
                    <div className="flex-1 overflow-y-auto py-2">
                        {navItems.map((item) => {
                            const isActive = pathname === item.href
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    title={item.label}
                                    className={cn(
                                        "flex items-center gap-3 px-3 lg:px-5 py-3 mx-2 rounded-lg transition-colors",
                                        isActive
                                            ? "text-[var(--accent-blue)] bg-[var(--accent-blue)]/10"
                                            : "text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]"
                                    )}
                                >
                                    <item.icon className="w-5 h-5 shrink-0" />
                                    <span className="text-sm font-medium hidden lg:block">{item.label}</span>
                                    {isActive && <ChevronRight className="w-4 h-4 ml-auto hidden lg:block" />}
                                </Link>
                            )
                        })}

                        {/* Divider */}
                        <div className="my-3 mx-3 lg:mx-5 border-t border-[var(--border-light)]" />

                        {/* Download */}
                        <button
                            onClick={() => downloadFullReport()}
                            title="Download Report"
                            className="flex items-center gap-3 px-3 lg:px-5 py-3 mx-2 rounded-lg w-[calc(100%-1rem)] text-left text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors"
                        >
                            <Download className="w-5 h-5 shrink-0" />
                            <span className="text-sm font-medium hidden lg:block">Download Report</span>
                        </button>

                        {/* Settings */}
                        <Link
                            href="/settings"
                            title="Settings"
                            className="flex items-center gap-3 px-3 lg:px-5 py-3 mx-2 rounded-lg text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors"
                        >
                            <Settings className="w-5 h-5 shrink-0" />
                            <span className="text-sm font-medium hidden lg:block">Settings</span>
                        </Link>

                        {/* Audit Logs */}
                        <Link
                            href="/audit-logs"
                            title="Audit Logs"
                            className="flex items-center gap-3 px-3 lg:px-5 py-3 mx-2 rounded-lg text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors"
                        >
                            <Shield className="w-5 h-5 shrink-0" />
                            <span className="text-sm font-medium hidden lg:block">Audit Logs</span>
                        </Link>
                    </div>

                    {/* Sidebar Footer */}
                    <div className="p-3 lg:p-4 border-t border-[var(--border-light)]">
                        <button
                            onClick={handleAuthClick}
                            title={isAuthenticated ? "Logout" : "Login"}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2 w-full rounded-lg transition-colors",
                                isAuthenticated
                                    ? "text-[var(--danger-color)] hover:bg-red-50"
                                    : "text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]"
                            )}
                        >
                            {isAuthenticated ? <LogOut className="w-5 h-5 shrink-0" /> : <LogIn className="w-5 h-5 shrink-0" />}
                            <span className="text-sm font-medium hidden lg:block">
                                {isAuthenticated ? (isAdmin ? "Admin" : "Logout") : "Login"}
                            </span>
                        </button>
                        {isAdmin && (
                            <div className="mt-2 px-2">
                                <span className="text-[9px] bg-[var(--success-color)] text-white px-2 py-0.5 rounded-full font-bold block text-center">
                                    ADMIN MODE
                                </span>
                            </div>
                        )}
                        <p className="text-[10px] text-[var(--text-muted)] text-center mt-2 hidden lg:block">HSE App v2.0</p>
                    </div>
                </aside>

                {/* ===== MOBILE HEADER ===== */}
                <header className="fixed top-0 left-0 right-0 h-[60px] bg-[var(--bg-primary)] flex md:hidden items-center justify-between px-4 z-50 border-b border-[var(--border-light)] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]">
                    <button
                        onClick={() => setIsDrawerOpen(true)}
                        className="p-2 text-[var(--accent-blue)] hover:bg-[var(--bg-tertiary)] rounded-lg transition-colors"
                    >
                        <Menu className="w-6 h-6" />
                    </button>
                    <div className="flex items-center gap-2">
                        <span className="font-semibold text-[var(--text-primary)]">HSE Plan</span>
                        {isAuthenticated && !isAdmin && (
                            <span className="text-[9px] bg-[var(--warning-color)]/10 text-[var(--warning-color)] px-2 py-0.5 rounded-full font-medium">
                                View-Only
                            </span>
                        )}
                        {isAdmin && (
                            <span className="text-[9px] bg-[var(--success-color)] text-white px-2 py-0.5 rounded-full font-bold">
                                ADMIN
                            </span>
                        )}
                    </div>
                    <div className="w-10" /> {/* Spacer for centering */}
                </header>

                {/* ===== MOBILE DRAWER OVERLAY ===== */}
                {isDrawerOpen && (
                    <div
                        className="fixed inset-0 bg-black/70 z-[200] md:hidden transition-opacity"
                        onClick={() => setIsDrawerOpen(false)}
                    />
                )}

                {/* ===== MOBILE DRAWER ===== */}
                <nav className={cn(
                    "fixed top-0 left-0 w-[280px] h-full bg-[var(--bg-secondary)] z-[201] flex flex-col md:hidden",
                    "transition-transform duration-300 ease-out",
                    "pl-[env(safe-area-inset-left)]",
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

                        {/* Auth Button */}
                        <button
                            onClick={() => {
                                setIsDrawerOpen(false)
                                handleAuthClick()
                            }}
                            className={cn(
                                "flex items-center gap-4 px-6 py-4 w-full text-left transition-colors",
                                isAuthenticated
                                    ? "text-[var(--danger-color)] hover:bg-red-50"
                                    : "text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]"
                            )}
                        >
                            {isAuthenticated ? <LogOut className="w-5 h-5" /> : <LogIn className="w-5 h-5" />}
                            <span className="text-sm font-medium">
                                {isAuthenticated ? (isAdmin ? "Admin Logout" : "Logout") : "Login"}
                            </span>
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

                {/* ===== MAIN CONTENT ===== */}
                {/* Adjust left margin based on sidebar width */}
                <main className={cn(
                    "min-h-screen transition-all",
                    "pt-[60px] pb-[80px]", // Mobile: header + bottom nav
                    "md:pt-4 md:pb-4 md:ml-[70px]", // Tablet: collapsed sidebar
                    "lg:ml-[250px]" // Desktop: full sidebar
                )}>
                    <div className="p-4 max-w-6xl mx-auto">
                        {children}
                    </div>
                </main>

                {/* ===== MOBILE BOTTOM NAVIGATION ===== */}
                <nav className="fixed bottom-0 left-0 right-0 h-[60px] bg-[var(--bg-primary)] border-t border-[var(--border-light)] z-50 md:hidden pb-[env(safe-area-inset-bottom)]">
                    <div className="flex items-center justify-around h-full px-2">
                        {mobileNavItems.map((item) => {
                            const isActive = pathname === item.href
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={cn(
                                        "flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors",
                                        isActive
                                            ? "text-[var(--accent-blue)] bg-[var(--accent-blue)]/10"
                                            : "text-[var(--text-muted)]"
                                    )}
                                >
                                    <item.icon className="w-5 h-5" />
                                    <span className="text-[10px] font-medium">{item.label}</span>
                                </Link>
                            )
                        })}
                    </div>
                </nav>
            </div>
        </AppShellContext.Provider>
    )
}
