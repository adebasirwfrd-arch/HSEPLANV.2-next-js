// Settings Store - App settings with localStorage persistence

export type ThemeId = 'ocean-trust' | 'industrial-safety' | 'nordic-forest' | 'modern-corporate'
export type LanguageId = 'en' | 'id'

export interface Theme {
    id: ThemeId
    name: string
    description: string
    colors: {
        primary: string
        primaryEnd: string
        secondary: string
        accent: string
        success: string
        warning: string
        background: string
    }
}

export interface AppSettings {
    // Personalization
    theme: ThemeId
    language: LanguageId

    // Company Branding
    companyName: string
    companyLogo: string  // URL or base64
    heroBannerImage: string  // URL or base64

    // Notifications
    emailNotifications: boolean
    pushNotifications: boolean
    reminderDays: number  // Days before task for reminder

    // Display
    compactMode: boolean
    showWelcomeMessage: boolean
}

// Available themes based on Color Theme Recommendations
export const themes: Theme[] = [
    {
        id: 'ocean-trust',
        name: 'Ocean Trust',
        description: 'Professional, calming, trustworthy feel',
        colors: {
            primary: '#A1C4FD',
            primaryEnd: '#C2E9FB',
            secondary: '#3B82F6',
            accent: '#3B82F6',
            success: '#10B981',
            warning: '#F59E0B',
            background: '#F0F9FF'
        }
    },
    {
        id: 'industrial-safety',
        name: 'Industrial Safety',
        description: 'Oil & gas, drilling, heavy industry',
        colors: {
            primary: '#1E3A5F',
            primaryEnd: '#4A6FA5',
            secondary: '#4A6FA5',
            accent: '#FF6B35',
            success: '#059669',
            warning: '#EAB308',
            background: '#F1F5F9'
        }
    },
    {
        id: 'nordic-forest',
        name: 'Nordic Forest',
        description: 'Environmental focus, sustainability',
        colors: {
            primary: '#166534',
            primaryEnd: '#84CC16',
            secondary: '#84CC16',
            accent: '#D4A574',
            success: '#14B8A6',
            warning: '#FCD34D',
            background: '#FAFAF9'
        }
    },
    {
        id: 'modern-corporate',
        name: 'Modern Corporate',
        description: 'Clean, timeless, enterprise style',
        colors: {
            primary: '#1F2937',
            primaryEnd: '#6B7280',
            secondary: '#6B7280',
            accent: '#2563EB',
            success: '#22C55E',
            warning: '#F97316',
            background: '#FFFFFF'
        }
    }
]

// Translations
export const translations = {
    en: {
        dashboard: 'HSE Dashboard',
        subtitle: 'Health, Safety & Environment',
        description: 'Monitor your organization\'s HSE performance, track KPIs, and manage safety programs all in one place.',
        settings: 'Settings',
        personalization: 'Personalization',
        theme: 'Theme',
        language: 'Language',
        companyBranding: 'Company Branding',
        companyName: 'Company Name',
        companyLogo: 'Company Logo',
        heroBanner: 'Hero Banner Image',
        notifications: 'Notifications',
        emailNotifications: 'Email Notifications',
        pushNotifications: 'Push Notifications',
        reminderDays: 'Reminder Days Before Task',
        display: 'Display',
        compactMode: 'Compact Mode',
        showWelcome: 'Show Welcome Message',
        save: 'Save Settings',
        reset: 'Reset to Defaults',
        uploadImage: 'Upload Image',
        removeImage: 'Remove',
        totalPlans: 'Total Plans',
        completed: 'Completed',
        inProgress: 'In Progress',
        pending: 'Pending',
        programs: 'Programs',
        tasks: 'Tasks',
        stats: 'Stats',
        calendar: 'Calendar',
        docs: 'Docs',
        kpi: 'KPI',
        otp: 'OTP',
        matrix: 'Matrix',
        download: 'Download Report',
    },
    id: {
        dashboard: 'Dashboard HSE',
        subtitle: 'Kesehatan, Keselamatan & Lingkungan',
        description: 'Pantau kinerja HSE organisasi Anda, lacak KPI, dan kelola program keselamatan dalam satu tempat.',
        settings: 'Pengaturan',
        personalization: 'Personalisasi',
        theme: 'Tema',
        language: 'Bahasa',
        companyBranding: 'Identitas Perusahaan',
        companyName: 'Nama Perusahaan',
        companyLogo: 'Logo Perusahaan',
        heroBanner: 'Gambar Banner',
        notifications: 'Notifikasi',
        emailNotifications: 'Notifikasi Email',
        pushNotifications: 'Notifikasi Push',
        reminderDays: 'Hari Pengingat Sebelum Tugas',
        display: 'Tampilan',
        compactMode: 'Mode Ringkas',
        showWelcome: 'Tampilkan Pesan Selamat Datang',
        save: 'Simpan Pengaturan',
        reset: 'Reset ke Default',
        uploadImage: 'Unggah Gambar',
        removeImage: 'Hapus',
        totalPlans: 'Total Rencana',
        completed: 'Selesai',
        inProgress: 'Sedang Berjalan',
        pending: 'Tertunda',
        programs: 'Program',
        tasks: 'Tugas',
        stats: 'Statistik',
        calendar: 'Kalender',
        docs: 'Dokumen',
        kpi: 'KPI',
        otp: 'OTP',
        matrix: 'Matriks',
        download: 'Unduh Laporan',
    }
}

export type TranslationKey = keyof typeof translations.en

const STORAGE_KEY = 'hse-app-settings'

// Default settings
export const defaultSettings: AppSettings = {
    theme: 'ocean-trust',
    language: 'en',
    companyName: '',
    companyLogo: '',
    heroBannerImage: '',
    emailNotifications: true,
    pushNotifications: false,
    reminderDays: 7,
    compactMode: false,
    showWelcomeMessage: true
}

// Load settings from localStorage
export function loadSettings(): AppSettings {
    if (typeof window === 'undefined') return defaultSettings

    try {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored) {
            return { ...defaultSettings, ...JSON.parse(stored) }
        }
    } catch (e) {
        console.error('Error loading settings:', e)
    }

    return defaultSettings
}

// Save settings to localStorage
export function saveSettings(settings: AppSettings): void {
    if (typeof window === 'undefined') return
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))

    // Dispatch multiple events for cross-page sync
    // 1. Custom event for same-page components
    window.dispatchEvent(new CustomEvent('settingsChanged', { detail: settings }))

    // 2. Storage event workaround (doesn't fire in same tab, so we manually trigger)
    window.dispatchEvent(new StorageEvent('storage', {
        key: STORAGE_KEY,
        newValue: JSON.stringify(settings),
        storageArea: localStorage
    }))
}

// Get current theme
export function getCurrentTheme(): Theme {
    const settings = loadSettings()
    return themes.find(t => t.id === settings.theme) || themes[0]
}

// Get translation
export function t(key: TranslationKey): string {
    const settings = loadSettings()
    return translations[settings.language][key] || key
}

// Apply theme to CSS variables
export function applyTheme(theme: Theme): void {
    if (typeof document === 'undefined') return

    const root = document.documentElement
    root.style.setProperty('--theme-primary', theme.colors.primary)
    root.style.setProperty('--theme-primary-end', theme.colors.primaryEnd)
    root.style.setProperty('--theme-secondary', theme.colors.secondary)
    root.style.setProperty('--theme-accent', theme.colors.accent)
    root.style.setProperty('--theme-success', theme.colors.success)
    root.style.setProperty('--theme-warning', theme.colors.warning)
    root.style.setProperty('--theme-background', theme.colors.background)
}

// Convert file to base64
export function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = reject
        reader.readAsDataURL(file)
    })
}
