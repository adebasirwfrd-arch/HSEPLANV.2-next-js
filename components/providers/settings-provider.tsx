"use client"

import { useEffect, useState, createContext, useContext } from "react"
import {
    loadSettings,
    saveSettings,
    themes,
    defaultSettings,
    type AppSettings,
    type Theme
} from "@/lib/settings-store"

interface SettingsContextType {
    settings: AppSettings
    theme: Theme
    updateSettings: (newSettings: Partial<AppSettings>) => void
}

const SettingsContext = createContext<SettingsContextType | null>(null)

export function useSettings(): SettingsContextType {
    const context = useContext(SettingsContext)
    // Return defaults during SSR or when outside provider (for prerendering)
    if (!context) {
        return {
            settings: defaultSettings,
            theme: themes[0],
            updateSettings: () => { } // No-op during SSR
        }
    }
    return context
}

export function SettingsProvider({ children }: { children: React.ReactNode }) {
    const [settings, setSettings] = useState<AppSettings>(loadSettings)
    const [mounted, setMounted] = useState(false)

    // Current theme object
    const theme = themes.find(t => t.id === settings.theme) || themes[0]

    // Apply theme to CSS variables
    useEffect(() => {
        setMounted(true)
    }, [])

    // Apply CSS variables when theme changes
    useEffect(() => {
        if (!mounted) return

        const root = document.documentElement

        // ========================================
        // COMPREHENSIVE THEME APPLICATION
        // ========================================

        // Primary accent colors (buttons, links, highlights)
        root.style.setProperty('--accent-blue', theme.colors.accent)
        root.style.setProperty('--accent-dark', theme.colors.primary)
        root.style.setProperty('--accent-light', theme.colors.primaryEnd)
        root.style.setProperty('--accent-sky', theme.colors.primaryEnd)
        root.style.setProperty('--accent-purple', theme.colors.secondary)

        // Status colors
        root.style.setProperty('--success-color', theme.colors.success)
        root.style.setProperty('--warning-color', theme.colors.warning)
        root.style.setProperty('--info-color', theme.colors.accent)

        // Theme identity colors
        root.style.setProperty('--theme-primary', theme.colors.primary)
        root.style.setProperty('--theme-primary-end', theme.colors.primaryEnd)
        root.style.setProperty('--theme-secondary', theme.colors.secondary)
        root.style.setProperty('--theme-accent', theme.colors.accent)

        // Chart colors based on theme
        root.style.setProperty('--chart-1', theme.colors.accent)
        root.style.setProperty('--chart-2', theme.colors.success)
        root.style.setProperty('--chart-3', theme.colors.warning)
        root.style.setProperty('--chart-4', theme.colors.secondary)
        root.style.setProperty('--chart-5', theme.colors.primaryEnd)

        // Ocean gradient for sidebar (theme-specific)
        if (theme.id === 'industrial-safety') {
            // Industrial - Dark blue steel
            root.style.setProperty('--ocean-start', '#1E3A5F')
            root.style.setProperty('--ocean-end', '#4A6FA5')
            root.style.setProperty('--bg-primary', '#f1f5f9')
            root.style.setProperty('--bg-secondary', '#ffffff')
            root.style.setProperty('--bg-tertiary', '#e2e8f0')
            root.style.setProperty('--border-light', '#cbd5e1')
            root.style.setProperty('--glass-white', 'rgba(255, 255, 255, 0.95)')
            root.style.setProperty('--card-shadow', '0 4px 24px rgba(30, 58, 95, 0.1)')
        } else if (theme.id === 'nordic-forest') {
            // Forest - Deep greens
            root.style.setProperty('--ocean-start', '#166534')
            root.style.setProperty('--ocean-end', '#84CC16')
            root.style.setProperty('--bg-primary', '#f0fdf4')
            root.style.setProperty('--bg-secondary', '#ffffff')
            root.style.setProperty('--bg-tertiary', '#dcfce7')
            root.style.setProperty('--border-light', '#bbf7d0')
            root.style.setProperty('--glass-white', 'rgba(255, 255, 255, 0.95)')
            root.style.setProperty('--card-shadow', '0 4px 24px rgba(22, 101, 52, 0.1)')
        } else if (theme.id === 'modern-corporate') {
            // Corporate - Neutral grays
            root.style.setProperty('--ocean-start', '#1F2937')
            root.style.setProperty('--ocean-end', '#6B7280')
            root.style.setProperty('--bg-primary', '#f9fafb')
            root.style.setProperty('--bg-secondary', '#ffffff')
            root.style.setProperty('--bg-tertiary', '#f3f4f6')
            root.style.setProperty('--border-light', '#e5e7eb')
            root.style.setProperty('--glass-white', 'rgba(255, 255, 255, 0.98)')
            root.style.setProperty('--card-shadow', '0 4px 24px rgba(0, 0, 0, 0.08)')
        } else {
            // Ocean Trust (default) - Blue ocean
            root.style.setProperty('--ocean-start', '#a1c4fd')
            root.style.setProperty('--ocean-end', '#c2e9fb')
            root.style.setProperty('--bg-primary', '#f0f9ff')
            root.style.setProperty('--bg-secondary', '#ffffff')
            root.style.setProperty('--bg-tertiary', '#e0f2fe')
            root.style.setProperty('--border-light', '#bae6fd')
            root.style.setProperty('--glass-white', 'rgba(255, 255, 255, 0.95)')
            root.style.setProperty('--card-shadow', '0 4px 24px rgba(59, 130, 246, 0.08)')
        }

        console.log('[THEME] Applied complete theme:', theme.id, theme.colors)
    }, [theme, mounted])

    // Listen for settings changes from other components/pages
    useEffect(() => {
        if (!mounted) return

        const handleSettingsChange = (e: CustomEvent<AppSettings>) => {
            setSettings(e.detail || loadSettings())
        }

        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'hse-app-settings') {
                setSettings(loadSettings())
            }
        }

        window.addEventListener('settingsChanged', handleSettingsChange as EventListener)
        window.addEventListener('storage', handleStorageChange)

        return () => {
            window.removeEventListener('settingsChanged', handleSettingsChange as EventListener)
            window.removeEventListener('storage', handleStorageChange)
        }
    }, [mounted])

    // Update settings function
    const updateSettings = (newSettings: Partial<AppSettings>) => {
        const updated = { ...settings, ...newSettings }
        setSettings(updated)
        saveSettings(updated)
    }

    // Prevent hydration mismatch by not rendering until mounted
    if (!mounted) {
        return <>{children}</>
    }

    return (
        <SettingsContext.Provider value={{ settings, theme, updateSettings }}>
            {children}
        </SettingsContext.Provider>
    )
}
