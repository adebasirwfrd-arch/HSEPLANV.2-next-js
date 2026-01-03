"use client"

import { useState, useRef } from "react"
import { AppShell } from "@/components/layout/app-shell"
import { GlassCard } from "@/components/ui/glass-card"
import {
    Palette, Building2, Save, RotateCcw,
    Upload, Check, Image as ImageIcon, User
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
    themes,
    defaultSettings,
    fileToBase64,
    type AppSettings,
    type ThemeId,
    type LanguageId
} from "@/lib/settings-store"
import { useSettings } from "@/components/providers/settings-provider"

export default function SettingsPage() {
    const { settings, updateSettings } = useSettings()
    const [localSettings, setLocalSettings] = useState<AppSettings>(settings)
    const [saved, setSaved] = useState(false)
    const logoInputRef = useRef<HTMLInputElement>(null)
    const bannerInputRef = useRef<HTMLInputElement>(null)

    // Update local settings (doesn't save until Save button clicked)
    const updateLocalSetting = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
        setLocalSettings(prev => ({ ...prev, [key]: value }))
        setSaved(false)

        // Apply theme changes immediately for preview
        if (key === 'theme') {
            updateSettings({ theme: value as ThemeId })
        }
    }

    const handleSave = () => {
        // Save all settings using the provider (which also applies theme)
        updateSettings(localSettings)
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
    }

    const handleReset = () => {
        setLocalSettings(defaultSettings)
        updateSettings(defaultSettings)
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
    }

    const handleImageUpload = async (file: File, type: 'companyLogo' | 'heroBannerImage') => {
        try {
            const base64 = await fileToBase64(file)
            updateLocalSetting(type, base64)
        } catch (e) {
            console.error('Upload error:', e)
        }
    }

    const selectedTheme = themes.find(t => t.id === localSettings.theme) || themes[0]


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
                                    onClick={() => updateLocalSetting('theme', theme.id)}
                                    className={cn(
                                        "p-3 rounded-xl border-2 text-left transition-all",
                                        localSettings.theme === theme.id
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
                                        {localSettings.theme === theme.id && (
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
                            value={localSettings.companyName}
                            onChange={(e) => updateLocalSetting('companyName', e.target.value)}
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
                                    localSettings.companyLogo
                                        ? "border-[var(--success-color)]"
                                        : "border-[var(--border-light)] hover:border-[var(--accent-blue)]"
                                )}
                            >
                                {localSettings.companyLogo ? (
                                    <img src={localSettings.companyLogo} alt="Logo" className="w-full h-full object-contain" />
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
                                {localSettings.companyLogo && (
                                    <button
                                        onClick={() => updateLocalSetting('companyLogo', '')}
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
                                localSettings.heroBannerImage
                                    ? "border-[var(--success-color)]"
                                    : "border-[var(--border-light)] hover:border-[var(--accent-blue)]"
                            )}
                        >
                            {localSettings.heroBannerImage ? (
                                <div className="relative w-full h-full">
                                    <img src={localSettings.heroBannerImage} alt="Banner" className="w-full h-full object-cover" />
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
                        {localSettings.heroBannerImage && (
                            <button
                                onClick={() => updateLocalSetting('heroBannerImage', '')}
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
