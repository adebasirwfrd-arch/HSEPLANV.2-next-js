// Unified Notification Service for HSE Program & Task Reminders
// Supports Email (Brevo) and WhatsApp notifications

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null

// Brevo API Configuration
const BREVO_API_KEY = process.env.NEXT_PUBLIC_BREVO_API_KEY || process.env.BREVO_API_KEY || ''
const SENDER_EMAIL = process.env.NEXT_PUBLIC_SENDER_EMAIL || 'hse-system@company.com'
const SENDER_NAME = 'HSE Management System'

// App URL for links
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://hse-plan.vercel.app'

// Reminder types
export type ReminderFrequency = 'Monthly' | 'Annually' | 'Quarterly' | 'Semesterly' | 'Per Semester' | 'Per Semester / Base' | string

export interface HSEAlertData {
    itemName: string
    picEmail: string
    picName: string
    planDate: string
    frequency: ReminderFrequency
    itemType: 'otp' | 'matrix' | 'task'
    programName?: string // For tasks, the parent program name
    taskId?: string // For task-specific links
    base?: string
    region?: string
}

export interface ReminderResult {
    sent: boolean
    channel: 'email' | 'whatsapp' | 'both' | 'none'
    daysUntilDue: number
    error?: string
}

/**
 * Calculate days until due date
 */
export function calculateDaysUntilDue(planDate: string): number {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const due = new Date(planDate)
    due.setHours(0, 0, 0, 0)
    return Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

/**
 * Determine if reminder should be sent based on frequency (Ade Basir Rules)
 * Monthly: H-14, H-7, H-3
 * Annually/Quarterly/Semesterly: H-30, H-14, H-7, H-3
 */
export function shouldSendReminder(daysUntilDue: number, frequency: ReminderFrequency): boolean {
    // Normalize frequency
    const normalizedFreq = frequency.toLowerCase()

    // Monthly rule: H-14, H-7, H-3
    if (normalizedFreq.includes('monthly') || normalizedFreq.includes('month')) {
        return [14, 7, 3].includes(daysUntilDue)
    }

    // Annually/Quarterly/Semesterly rule: H-30, H-14, H-7, H-3
    if (
        normalizedFreq.includes('annual') ||
        normalizedFreq.includes('yearly') ||
        normalizedFreq.includes('quarterly') ||
        normalizedFreq.includes('semester') ||
        normalizedFreq.includes('semi')
    ) {
        return [30, 14, 7, 3].includes(daysUntilDue)
    }

    // Default: use monthly rule
    return [14, 7, 3].includes(daysUntilDue)
}

/**
 * Get reminder day label in Indonesian
 */
export function getReminderLabel(daysUntilDue: number): string {
    if (daysUntilDue === 30) return 'H-30 (1 bulan)'
    if (daysUntilDue === 14) return 'H-14 (2 minggu)'
    if (daysUntilDue === 7) return 'H-7 (1 minggu)'
    if (daysUntilDue === 3) return 'H-3 (3 hari)'
    if (daysUntilDue === 1) return 'H-1 (besok)'
    if (daysUntilDue === 0) return 'Hari ini'
    if (daysUntilDue < 0) return `Terlambat ${Math.abs(daysUntilDue)} hari`
    return `H-${daysUntilDue}`
}

/**
 * Generate email HTML for reminder
 */
export function generateReminderEmailHTML(data: HSEAlertData, daysUntilDue: number): string {
    const reminderLabel = getReminderLabel(daysUntilDue)
    const itemTypeLabel = data.itemType === 'task' ? 'Tugas' : data.itemType === 'otp' ? 'Program OTP' : 'Program Matrix'
    const linkUrl = data.itemType === 'task' && data.taskId
        ? `${APP_URL}/tasks?id=${data.taskId}`
        : `${APP_URL}/${data.itemType}`

    const programInfo = data.programName
        ? `<p style="color: #666; font-size: 14px;"><strong>Bagian dari Program:</strong> ${data.programName}</p>`
        : ''

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 15px 15px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">🔔 Pengingat HSE</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">${reminderLabel}</p>
        </div>
        
        <div style="background: white; padding: 30px; border-radius: 0 0 15px 15px; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
            <p style="font-size: 16px; color: #333;">Halo <strong>${data.picName}</strong>,</p>
            
            <p style="font-size: 16px; color: #333; line-height: 1.6;">
                Ini adalah pengingat <strong>${reminderLabel}</strong> untuk ${itemTypeLabel}:
            </p>
            
            <div style="background: #f8f9fa; border-left: 4px solid #667eea; padding: 15px 20px; margin: 20px 0; border-radius: 0 8px 8px 0;">
                <h3 style="margin: 0 0 10px 0; color: #333; font-size: 18px;">${data.itemName}</h3>
                ${programInfo}
                <p style="margin: 5px 0; color: #666; font-size: 14px;">
                    <strong>📅 Rencana Tanggal:</strong> ${new Date(data.planDate).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
                ${data.base ? `<p style="margin: 5px 0; color: #666; font-size: 14px;"><strong>📍 Base:</strong> ${data.base.charAt(0).toUpperCase() + data.base.slice(1)}</p>` : ''}
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="${linkUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; padding: 15px 40px; border-radius: 30px; font-weight: bold; font-size: 16px;">
                    ${data.itemType === 'task' ? 'Lihat & Upload Lampiran' : 'Lihat Detail Program'}
                </a>
            </div>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            
            <p style="color: #999; font-size: 12px; text-align: center;">
                Email ini dikirim secara otomatis oleh HSE Management System.<br>
                Jika ada pertanyaan, hubungi tim HSE.
            </p>
        </div>
    </body>
    </html>
    `
}

/**
 * Generate WhatsApp message text
 */
export function generateWhatsAppMessage(data: HSEAlertData, daysUntilDue: number): string {
    const reminderLabel = getReminderLabel(daysUntilDue)
    const itemTypeLabel = data.itemType === 'task' ? 'Tugas' : data.itemType === 'otp' ? 'Program OTP' : 'Program Matrix'
    const linkUrl = data.itemType === 'task' && data.taskId
        ? `${APP_URL}/tasks?id=${data.taskId}`
        : `${APP_URL}/${data.itemType}`

    const programInfo = data.programName ? `\n📂 Bagian dari: ${data.programName}` : ''

    return `🔔 *Pengingat HSE - ${reminderLabel}*

Halo ${data.picName},

Ini adalah pengingat *${reminderLabel}* untuk ${itemTypeLabel}:

📋 *${data.itemName}*${programInfo}
📅 Rencana: ${new Date(data.planDate).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
${data.base ? `📍 Base: ${data.base.charAt(0).toUpperCase() + data.base.slice(1)}` : ''}

🔗 Lihat detail: ${linkUrl}

_Pesan otomatis dari HSE Management System_`
}

/**
 * Send email via Brevo API
 */
export async function sendBrevoEmail(
    toEmail: string,
    toName: string,
    subject: string,
    htmlContent: string
): Promise<boolean> {
    if (!BREVO_API_KEY) {
        console.warn('Brevo API key not configured')
        return false
    }

    try {
        const response = await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'api-key': BREVO_API_KEY,
                'content-type': 'application/json'
            },
            body: JSON.stringify({
                sender: { name: SENDER_NAME, email: SENDER_EMAIL },
                to: [{ email: toEmail, name: toName }],
                subject: subject,
                htmlContent: htmlContent
            })
        })

        if (!response.ok) {
            const error = await response.text()
            console.error('Brevo API error:', error)
            return false
        }

        return true
    } catch (e) {
        console.error('Failed to send email:', e)
        return false
    }
}

/**
 * Main function: Process HSE Alert
 * Determines if reminder should be sent and sends via appropriate channel
 */
export async function processHSEAlert(data: HSEAlertData): Promise<ReminderResult> {
    const daysUntilDue = calculateDaysUntilDue(data.planDate)

    // Check if we should send reminder today
    if (!shouldSendReminder(daysUntilDue, data.frequency)) {
        return {
            sent: false,
            channel: 'none',
            daysUntilDue,
            error: 'Not a reminder day'
        }
    }

    // Skip if email is invalid or empty
    if (!data.picEmail || !data.picEmail.includes('@')) {
        return {
            sent: false,
            channel: 'none',
            daysUntilDue,
            error: 'Invalid or missing email'
        }
    }

    // Generate email content
    const reminderLabel = getReminderLabel(daysUntilDue)
    const subject = `🔔 [${reminderLabel}] Pengingat: ${data.itemName}`
    const htmlContent = generateReminderEmailHTML(data, daysUntilDue)

    // Send email
    const emailSent = await sendBrevoEmail(
        data.picEmail,
        data.picName,
        subject,
        htmlContent
    )

    // Log to Supabase (optional)
    if (supabase) {
        try {
            await supabase.from('notification_logs').insert({
                item_type: data.itemType,
                item_name: data.itemName,
                recipient_email: data.picEmail,
                recipient_name: data.picName,
                days_until_due: daysUntilDue,
                status: emailSent ? 'sent' : 'failed',
                created_at: new Date().toISOString()
            })
        } catch (e) {
            console.error('Failed to log notification:', e)
        }
    }

    return {
        sent: emailSent,
        channel: emailSent ? 'email' : 'none',
        daysUntilDue,
        error: emailSent ? undefined : 'Email send failed'
    }
}

/**
 * Process multiple alerts at once (for batch cron jobs)
 */
export async function processMultipleAlerts(alerts: HSEAlertData[]): Promise<{
    total: number
    sent: number
    skipped: number
    failed: number
}> {
    let sent = 0
    let skipped = 0
    let failed = 0

    for (const alert of alerts) {
        const result = await processHSEAlert(alert)

        if (result.sent) {
            sent++
        } else if (result.error === 'Not a reminder day') {
            skipped++
        } else {
            failed++
        }
    }

    return {
        total: alerts.length,
        sent,
        skipped,
        failed
    }
}

/**
 * Get user notification preferences from Supabase
 */
export async function getUserNotificationPreferences(userEmail: string): Promise<{
    emailEnabled: boolean
    whatsappEnabled: boolean
    calendarSyncEnabled: boolean
} | null> {
    if (!supabase) return null

    try {
        const { data, error } = await supabase
            .from('user_settings')
            .select('email_notifications, whatsapp_notifications, calendar_sync_enabled')
            .eq('email', userEmail)
            .single()

        if (error || !data) return null

        return {
            emailEnabled: data.email_notifications ?? true,
            whatsappEnabled: data.whatsapp_notifications ?? false,
            calendarSyncEnabled: data.calendar_sync_enabled ?? false
        }
    } catch (e) {
        console.error('Failed to get user preferences:', e)
        return null
    }
}
