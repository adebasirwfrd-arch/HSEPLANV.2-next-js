// Edge Config Helper - Ultra-fast configuration from Vercel Edge Config
// For maintenance mode, feature flags, and security controls

import { createClient, type EdgeConfigClient } from '@vercel/edge-config'

// Edge Config client (initialized lazily)
let edgeConfigClient: EdgeConfigClient | null = null

function getEdgeConfigClient(): EdgeConfigClient | null {
    if (edgeConfigClient) return edgeConfigClient

    const connectionString = process.env.EDGE_CONFIG
    if (!connectionString) {
        console.warn('EDGE_CONFIG environment variable not set')
        return null
    }

    edgeConfigClient = createClient(connectionString)
    return edgeConfigClient
}

// =====================================================
// Configuration Types
// =====================================================

export interface EdgeConfigData {
    isMaintenanceMode: boolean
    maintenanceMessage?: string
    allowedAdminEmails: string[]
    blockedIPs: string[]
    allowedRegions: string[]
    featureFlags: {
        enableAIInsights: boolean
        enableCommunityFeed: boolean
        enableEmailReminders: boolean
        enableGoogleCalendarSync: boolean
    }
    securitySettings: {
        maxLoginAttempts: number
        sessionTimeoutMinutes: number
        enforceHttps: boolean
    }
}

// Default configuration (used when Edge Config is unavailable)
export const defaultConfig: EdgeConfigData = {
    isMaintenanceMode: false,
    maintenanceMessage: 'System is under maintenance. Please try again later.',
    allowedAdminEmails: ['ade.basirwfrd@gmail.com'],
    blockedIPs: [],
    allowedRegions: [], // Empty means all regions allowed
    featureFlags: {
        enableAIInsights: true,
        enableCommunityFeed: true,
        enableEmailReminders: true,
        enableGoogleCalendarSync: true
    },
    securitySettings: {
        maxLoginAttempts: 5,
        sessionTimeoutMinutes: 60,
        enforceHttps: true
    }
}

// =====================================================
// Edge Config Functions
// =====================================================

/**
 * Get a single value from Edge Config
 */
export async function getEdgeConfigValue<T>(key: string, defaultValue: T): Promise<T> {
    try {
        const client = getEdgeConfigClient()
        if (!client) return defaultValue

        const value = await client.get<T>(key)
        return value ?? defaultValue
    } catch (error) {
        console.error('Error reading Edge Config:', error)
        return defaultValue
    }
}

/**
 * Get all configuration values
 */
export async function getFullConfig(): Promise<EdgeConfigData> {
    try {
        const client = getEdgeConfigClient()
        if (!client) return defaultConfig

        const config = await client.getAll<EdgeConfigData>()
        return { ...defaultConfig, ...config }
    } catch (error) {
        console.error('Error reading full Edge Config:', error)
        return defaultConfig
    }
}

/**
 * Check if maintenance mode is enabled
 */
export async function isMaintenanceMode(): Promise<boolean> {
    return getEdgeConfigValue('isMaintenanceMode', false)
}

/**
 * Check if an email is an admin
 */
export async function isAdminEmail(email: string): Promise<boolean> {
    const admins = await getEdgeConfigValue<string[]>('allowedAdminEmails', defaultConfig.allowedAdminEmails)
    return admins.includes(email.toLowerCase())
}

/**
 * Check if an IP is blocked
 */
export async function isIPBlocked(ip: string): Promise<boolean> {
    const blockedIPs = await getEdgeConfigValue<string[]>('blockedIPs', [])
    return blockedIPs.includes(ip)
}

/**
 * Check if a feature is enabled
 */
export async function isFeatureEnabled(feature: keyof EdgeConfigData['featureFlags']): Promise<boolean> {
    const flags = await getEdgeConfigValue<EdgeConfigData['featureFlags']>(
        'featureFlags',
        defaultConfig.featureFlags
    )
    return flags[feature] ?? true
}

/**
 * Get maintenance message
 */
export async function getMaintenanceMessage(): Promise<string> {
    return getEdgeConfigValue('maintenanceMessage', defaultConfig.maintenanceMessage!)
}

// =====================================================
// Security Headers
// =====================================================

/**
 * Generate security headers for responses
 */
export function getSecurityHeaders(): Record<string, string> {
    return {
        // Strict Transport Security - Force HTTPS
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',

        // Content Security Policy
        'Content-Security-Policy': [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live https://*.vercel-scripts.com",
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
            "font-src 'self' https://fonts.gstatic.com",
            "img-src 'self' data: blob: https://*.unsplash.com https://*.supabase.co https://*.googleusercontent.com",
            "connect-src 'self' https://*.supabase.co https://*.vercel.app wss://*.supabase.co https://api.brevo.com https://getstream.io https://*.stream-io-api.com",
            "frame-ancestors 'none'",
            "form-action 'self'",
            "base-uri 'self'"
        ].join('; '),

        // Prevent MIME type sniffing
        'X-Content-Type-Options': 'nosniff',

        // XSS Protection (legacy but still useful)
        'X-XSS-Protection': '1; mode=block',

        // Prevent clickjacking
        'X-Frame-Options': 'DENY',

        // Referrer Policy
        'Referrer-Policy': 'strict-origin-when-cross-origin',

        // Permissions Policy
        'Permissions-Policy': 'camera=(), microphone=(), geolocation=(self), interest-cohort=()'
    }
}

/**
 * Apply security headers to a response
 */
export function applySecurityHeaders(response: Response): Response {
    const headers = getSecurityHeaders()
    const newResponse = new Response(response.body, response)

    Object.entries(headers).forEach(([key, value]) => {
        newResponse.headers.set(key, value)
    })

    return newResponse
}
