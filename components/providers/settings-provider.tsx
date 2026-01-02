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

        // Apply theme colors to CSS custom properties
        // Map theme colors to the variables used throughout the app
        root.style.setProperty('--accent-blue', theme.colors.accent)
        root.style.setProperty('--accent-sky', theme.colors.primaryEnd)
        root.style.setProperty('--accent-purple', theme.colors.secondary)
        root.style.setProperty('--success-color', theme.colors.success)
        root.style.setProperty('--warning-color', theme.colors.warning)
        root.style.setProperty('--danger-color', '#ef4444') // Keep red consistent

        // Apply gradient colors for header/hero areas
        root.style.setProperty('--theme-primary', theme.colors.primary)
        root.style.setProperty('--theme-primary-end', theme.colors.primaryEnd)
        root.style.setProperty('--theme-secondary', theme.colors.secondary)
        root.style.setProperty('--theme-accent', theme.colors.accent)
        root.style.setProperty('--theme-background', theme.colors.background)

        // Apply background tint based on theme
        if (theme.id === 'industrial-safety') {
            root.style.setProperty('--bg-gradient-start', '#e1e8f0')
            root.style.setProperty('--bg-gradient-end', '#d4e0ed')
            root.style.setProperty('--bg-primary', '#f1f5f9')
        } else if (theme.id === 'nordic-forest') {
            root.style.setProperty('--bg-gradient-start', '#ecfdf5')
            root.style.setProperty('--bg-gradient-end', '#d1fae5')
            root.style.setProperty('--bg-primary', '#f0fdf4')
        } else if (theme.id === 'modern-corporate') {
            root.style.setProperty('--bg-gradient-start', '#f8fafc')
            root.style.setProperty('--bg-gradient-end', '#f1f5f9')
            root.style.setProperty('--bg-primary', '#ffffff')
        } else {
            // ocean-trust (default)
            root.style.setProperty('--bg-gradient-start', '#e0f2fe')
            root.style.setProperty('--bg-gradient-end', '#bae6fd')
            root.style.setProperty('--bg-primary', '#f0f9ff')
        }

        console.log('[THEME] Applied:', theme.id)
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
