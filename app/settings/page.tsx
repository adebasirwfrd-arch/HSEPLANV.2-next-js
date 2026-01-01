"use client"

import { useState, useEffect, useRef } from "react"
import { AppShell } from "@/components/layout/app-shell"
import { GlassCard } from "@/components/ui/glass-card"
import {
    Palette, Globe, Building2, Bell, Monitor, Save, RotateCcw,
    Upload, X, Check, Image as ImageIcon, User
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
    loadSettings,
    saveSettings,
    themes,
    defaultSettings,
    fileToBase64,
    type AppSettings,
    type ThemeId,
    type LanguageId
} from "@/lib/settings-store"

export default function SettingsPage() {
    const [settings, setSettings] = useState<AppSettings>(defaultSettings)
    const [saved, setSaved] = useState(false)
    const logoInputRef = useRef<HTMLInputElement>(null)
    const bannerInputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        setSettings(loadSettings())
    }, [])

    const updateSetting = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
        setSettings(prev => ({ ...prev, [key]: value }))
        setSaved(false)
    }

    const handleSave = () => {
        saveSettings(settings)
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
    }

    const handleReset = () => {
        setSettings(defaultSettings)
        saveSettings(defaultSettings)
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
    }

    const handleImageUpload = async (file: File, type: 'companyLogo' | 'heroBannerImage') => {
        try {
            const base64 = await fileToBase64(file)
            updateSetting(type, base64)
        } catch (e) {
            console.error('Upload error:', e)
        }
    }

    const selectedTheme = themes.find(t => t.id === settings.theme) || themes[0]

    return (
        <AppShell>
            <div className="space-y-4 pb-8">
                {/* Header */}
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] rounded-xl flex items-center justify-center text-2xl">
                        ⚙️
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-[var(--text-primary)]">Settings</h1>
                        <p className="text-xs text-[var(--text-muted)]">Customize your experience</p>
                    </div>
                </div>

                {/* Personalization */}
                <GlassCard className="p-4">
                    <div className="flex items-center gap-2 mb-4">
                        <Palette className="w-5 h-5 text-[var(--accent-blue)]" />
                        <h2 className="font-semibold text-[var(--text-primary)]">Personalization</h2>
                    </div>

                    {/* Theme Selection */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-2">Color Theme</label>
                        <div className="grid grid-cols-2 gap-3">
                            {themes.map(theme => (
                                <button
                                    key={theme.id}
                                    onClick={() => updateSetting('theme', theme.id)}
                                    className={cn(
                                        "p-3 rounded-xl border-2 text-left transition-all",
                                        settings.theme === theme.id
                                            ? "border-[var(--accent-blue)] bg-[var(--accent-blue)]/5"
                                            : "border-[var(--border-light)] hover:border-[var(--accent-blue)]/50"
                                    )}
                                >
                                    <div className="flex items-center gap-2 mb-2">
                                        <div
                                            className="w-8 h-8 rounded-lg"
                                            style={{ background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.primaryEnd})` }}
                                        />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold truncate">{theme.name}</p>
                                        </div>
                                        {settings.theme === theme.id && (
                                            <Check className="w-4 h-4 text-[var(--accent-blue)]" />
                                        )}
                                    </div>
                                    <p className="text-[10px] text-[var(--text-muted)] line-clamp-1">{theme.description}</p>
                                    {/* Color swatches */}
                                    <div className="flex gap-1 mt-2">
                                        {Object.entries(theme.colors).slice(0, 5).map(([key, color]) => (
                                            <div
                                                key={key}
                                                className="w-4 h-4 rounded-full border border-white/20"
                                                style={{ backgroundColor: color }}
                                                title={key}
                                            />
                                        ))}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Language Selection */}
                    <div>
                        <label className="block text-sm font-medium mb-2">
                            <Globe className="w-4 h-4 inline mr-1" />
                            Language
                        </label>
                        <div className="flex gap-2">
                            <button
                                onClick={() => updateSetting('language', 'en')}
                                className={cn(
                                    "flex-1 p-3 rounded-xl border-2 transition-all flex items-center justify-center gap-2",
                                    settings.language === 'en'
                                        ? "border-[var(--accent-blue)] bg-[var(--accent-blue)]/5"
                                        : "border-[var(--border-light)]"
                                )}
                            >
                                <span className="text-xl">🇺🇸</span>
                                <span className="font-medium">English</span>
                            </button>
                            <button
                                onClick={() => updateSetting('language', 'id')}
                                className={cn(
                                    "flex-1 p-3 rounded-xl border-2 transition-all flex items-center justify-center gap-2",
                                    settings.language === 'id'
                                        ? "border-[var(--accent-blue)] bg-[var(--accent-blue)]/5"
                                        : "border-[var(--border-light)]"
                                )}
                            >
                                <span className="text-xl">🇮🇩</span>
                                <span className="font-medium">Bahasa Indonesia</span>
                            </button>
                        </div>
                    </div>
                </GlassCard>

                {/* Company Branding */}
                <GlassCard className="p-4">
                    <div className="flex items-center gap-2 mb-4">
                        <Building2 className="w-5 h-5 text-[var(--success-color)]" />
                        <h2 className="font-semibold text-[var(--text-primary)]">Company Branding</h2>
                    </div>

                    {/* Company Name */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-2">Company Name</label>
                        <input
                            type="text"
                            value={settings.companyName}
                            onChange={(e) => updateSetting('companyName', e.target.value)}
                            placeholder="e.g. PT. YOUR COMPANY"
                            className="w-full p-3 border border-[var(--border-light)] rounded-xl bg-[var(--bg-secondary)] focus:outline-none focus:border-[var(--accent-blue)]"
                        />
                        <p className="text-xs text-[var(--text-muted)] mt-1">Displayed above HSE Dashboard title</p>
                    </div>

                    {/* Company Logo */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-2">
                            <User className="w-4 h-4 inline mr-1" />
                            Company Logo
                        </label>
                        <div className="flex items-center gap-4">
                            <div
                                onClick={() => logoInputRef.current?.click()}
                                className={cn(
                                    "w-20 h-20 rounded-xl border-2 border-dashed flex items-center justify-center cursor-pointer transition-all overflow-hidden",
                                    settings.companyLogo
                                        ? "border-[var(--success-color)]"
                                        : "border-[var(--border-light)] hover:border-[var(--accent-blue)]"
                                )}
                            >
                                {settings.companyLogo ? (
                                    <img src={settings.companyLogo} alt="Logo" className="w-full h-full object-contain" />
                                ) : (
                                    <Upload className="w-6 h-6 text-[var(--text-muted)]" />
                                )}
                            </div>
                            <div className="flex-1">
                                <button
                                    onClick={() => logoInputRef.current?.click()}
                                    className="px-4 py-2 bg-[var(--accent-blue)] text-white rounded-lg text-sm font-medium"
                                >
                                    Upload Logo
                                </button>
                                {settings.companyLogo && (
                                    <button
                                        onClick={() => updateSetting('companyLogo', '')}
                                        className="ml-2 px-4 py-2 border border-[var(--border-light)] rounded-lg text-sm"
                                    >
                                        Remove
                                    </button>
                                )}
                                <p className="text-xs text-[var(--text-muted)] mt-1">PNG or JPG, max 500KB</p>
                            </div>
                        </div>
                        <input
                            ref={logoInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'companyLogo')}
                        />
                    </div>

                    {/* Hero Banner */}
                    <div>
                        <label className="block text-sm font-medium mb-2">
                            <ImageIcon className="w-4 h-4 inline mr-1" />
                            Hero Banner Image
                        </label>
                        <div
                            onClick={() => bannerInputRef.current?.click()}
                            className={cn(
                                "w-full h-32 rounded-xl border-2 border-dashed flex items-center justify-center cursor-pointer transition-all overflow-hidden",
                                settings.heroBannerImage
                                    ? "border-[var(--success-color)]"
                                    : "border-[var(--border-light)] hover:border-[var(--accent-blue)]"
                            )}
                        >
                            {settings.heroBannerImage ? (
                                <div className="relative w-full h-full">
                                    <img src={settings.heroBannerImage} alt="Banner" className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-gradient-to-r from-[#3b82f6]/70 via-[#0ea5e9]/60 to-[#14b8a6]/50" />
                                    <p className="absolute bottom-2 left-2 text-white text-xs font-medium">Banner Preview</p>
                                </div>
                            ) : (
                                <div className="text-center">
                                    <Upload className="w-8 h-8 mx-auto mb-2 text-[var(--text-muted)]" />
                                    <p className="text-sm text-[var(--text-muted)]">Click to upload banner image</p>
                                </div>
                            )}
                        </div>
                        {settings.heroBannerImage && (
                            <button
                                onClick={() => updateSetting('heroBannerImage', '')}
                                className="mt-2 text-sm text-[var(--danger-color)]"
                            >
                                Remove Banner
                            </button>
                        )}
                        <input
                            ref={bannerInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'heroBannerImage')}
                        />
                        <p className="text-xs text-[var(--text-muted)] mt-1">Image will have gradient overlay for professional look</p>
                    </div>
                </GlassCard>

                {/* Notifications */}
                <GlassCard className="p-4">
                    <div className="flex items-center gap-2 mb-4">
                        <Bell className="w-5 h-5 text-[var(--warning-color)]" />
                        <h2 className="font-semibold text-[var(--text-primary)]">Notifications</h2>
                    </div>

                    <div className="space-y-4">
                        <label className="flex items-center justify-between cursor-pointer">
                            <span className="text-sm">Email Notifications</span>
                            <div
                                onClick={() => updateSetting('emailNotifications', !settings.emailNotifications)}
                                className={cn(
                                    "w-12 h-6 rounded-full transition-all relative",
                                    settings.emailNotifications ? "bg-[var(--success-color)]" : "bg-[var(--border-light)]"
                                )}
                            >
                                <div className={cn(
                                    "absolute w-5 h-5 bg-white rounded-full top-0.5 transition-all shadow",
                                    settings.emailNotifications ? "left-6" : "left-0.5"
                                )} />
                            </div>
                        </label>

                        <label className="flex items-center justify-between cursor-pointer">
                            <span className="text-sm">Push Notifications</span>
                            <div
                                onClick={() => updateSetting('pushNotifications', !settings.pushNotifications)}
                                className={cn(
                                    "w-12 h-6 rounded-full transition-all relative",
                                    settings.pushNotifications ? "bg-[var(--success-color)]" : "bg-[var(--border-light)]"
                                )}
                            >
                                <div className={cn(
                                    "absolute w-5 h-5 bg-white rounded-full top-0.5 transition-all shadow",
                                    settings.pushNotifications ? "left-6" : "left-0.5"
                                )} />
                            </div>
                        </label>

                        <div>
                            <label className="block text-sm mb-2">Reminder Days Before Task</label>
                            <div className="flex gap-2">
                                {[3, 7, 14, 30].map(days => (
                                    <button
                                        key={days}
                                        onClick={() => updateSetting('reminderDays', days)}
                                        className={cn(
                                            "flex-1 py-2 rounded-lg text-sm font-medium transition-all",
                                            settings.reminderDays === days
                                                ? "bg-[var(--accent-blue)] text-white"
                                                : "bg-[var(--bg-tertiary)] text-[var(--text-secondary)]"
                                        )}
                                    >
                                        {days}d
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </GlassCard>

                {/* Display */}
                <GlassCard className="p-4">
                    <div className="flex items-center gap-2 mb-4">
                        <Monitor className="w-5 h-5 text-[var(--accent-purple)]" />
                        <h2 className="font-semibold text-[var(--text-primary)]">Display</h2>
                    </div>

                    <div className="space-y-4">
                        <label className="flex items-center justify-between cursor-pointer">
                            <span className="text-sm">Compact Mode</span>
                            <div
                                onClick={() => updateSetting('compactMode', !settings.compactMode)}
                                className={cn(
                                    "w-12 h-6 rounded-full transition-all relative",
                                    settings.compactMode ? "bg-[var(--success-color)]" : "bg-[var(--border-light)]"
                                )}
                            >
                                <div className={cn(
                                    "absolute w-5 h-5 bg-white rounded-full top-0.5 transition-all shadow",
                                    settings.compactMode ? "left-6" : "left-0.5"
                                )} />
                            </div>
                        </label>

                        <label className="flex items-center justify-between cursor-pointer">
                            <span className="text-sm">Show Welcome Message</span>
                            <div
                                onClick={() => updateSetting('showWelcomeMessage', !settings.showWelcomeMessage)}
                                className={cn(
                                    "w-12 h-6 rounded-full transition-all relative",
                                    settings.showWelcomeMessage ? "bg-[var(--success-color)]" : "bg-[var(--border-light)]"
                                )}
                            >
                                <div className={cn(
                                    "absolute w-5 h-5 bg-white rounded-full top-0.5 transition-all shadow",
                                    settings.showWelcomeMessage ? "left-6" : "left-0.5"
                                )} />
                            </div>
                        </label>
                    </div>
                </GlassCard>

                {/* Developer Zone */}
                <GlassCard className="p-4 border-l-4 border-[var(--warning-color)]">
                    <div className="flex items-center gap-2 mb-4">
                        <span className="text-xl">🛠️</span>
                        <h2 className="font-semibold text-[var(--text-primary)]">Developer Zone</h2>
                    </div>

                    <p className="text-xs text-[var(--text-muted)] mb-4">
                        Advanced tools for development and testing
                    </p>

                    <div className="space-y-3">
                        <button
                            onClick={async () => {
                                try {
                                    const response = await fetch('/api/seed-otp', { method: 'POST' })
                                    const data = await response.json()
                                    if (response.ok) {
                                        alert('✅ ' + (data.message || 'OTP data seeded successfully!'))
                                    } else {
                                        alert('❌ ' + (data.error || 'Failed to seed data'))
                                    }
                                } catch (error: any) {
                                    alert('❌ Error: ' + error.message)
                                }
                            }}
                            className="w-full py-3 bg-[var(--success-color)]/10 text-[var(--success-color)] rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-[var(--success-color)]/20 transition-all"
                        >
                            🌱 Seed OTP Data
                        </button>

                        <button
                            onClick={async () => {
                                try {
                                    const response = await fetch('/api/ai-insight')
                                    const data = await response.json()
                                    alert(data.configured
                                        ? '✅ AI is configured and ready!'
                                        : '⚠️ AI not configured. Set OPENAI_API_KEY in .env.local')
                                } catch (error: any) {
                                    alert('❌ Error: ' + error.message)
                                }
                            }}
                            className="w-full py-3 bg-[var(--accent-purple)]/10 text-[var(--accent-purple)] rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-[var(--accent-purple)]/20 transition-all"
                        >
                            🤖 Test AI Connection
                        </button>
                    </div>
                </GlassCard>

                {/* Action Buttons */}
                <div className="flex gap-3">
                    <button
                        onClick={handleReset}
                        className="flex-1 py-3 border border-[var(--border-light)] rounded-xl font-medium flex items-center justify-center gap-2"
                    >
                        <RotateCcw className="w-4 h-4" />
                        Reset
                    </button>
                    <button
                        onClick={handleSave}
                        className={cn(
                            "flex-1 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all",
                            saved
                                ? "bg-[var(--success-color)] text-white"
                                : "bg-gradient-to-r from-[var(--accent-blue)] to-[var(--accent-sky)] text-white"
                        )}
                    >
                        {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                        {saved ? 'Saved!' : 'Save Settings'}
                    </button>
                </div>
            </div>
        </AppShell>
    )
}
