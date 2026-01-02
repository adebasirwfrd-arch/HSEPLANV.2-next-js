// OTP Store - State management for OTP screen with localStorage persistence and calendar sync
import otpIndonesiaData from "./otp-data.json"
import otpAsiaData from "./otp_asia_data.json"
import otpNarogong from "./otp_indonesia_narogong.json"
import otpDuri from "./otp_indonesia_duri.json"
import otpBalikpapan from "./otp_indonesia_balikpapan.json"

const months = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"]
const monthLabels = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"]

export interface MonthData {
    plan: number
    actual: number
    wpts_id?: string
    plan_date?: string
    impl_date?: string
    pic_name?: string
    pic_email?: string
    pic_manager?: string
    pic_manager_email?: string
}

export interface OTPProgram {
    id: number
    name: string
    plan_type: string
    due_date: string | null
    months: Record<string, MonthData>
    progress?: number
}

export interface OTPData {
    year: number
    programs: OTPProgram[]
}

// Calculate progress for a program - CAPPED AT 100%
export function calculateProgress(program: OTPProgram): number {
    let totalPlan = 0
    let totalActual = 0
    months.forEach(m => {
        const monthData = program.months[m] || { plan: 0, actual: 0 }
        totalPlan += monthData.plan
        totalActual += monthData.actual
    })
    // Cap at 100% - if actual >= plan, program is 100% complete
    return totalPlan > 0 ? Math.min(100, Math.round((totalActual / totalPlan) * 100)) : 0
}

// Merge programs from multiple OTPData sources, avoiding duplicates by name
function mergeOTPData(...dataSources: OTPData[]): OTPData {
    const seenNames = new Set<string>()
    const mergedPrograms: OTPProgram[] = []
    let year = 2026

    dataSources.forEach(data => {
        if (data.year) year = data.year
        data.programs.forEach(prog => {
            // Use name as unique identifier to avoid duplicates
            if (!seenNames.has(prog.name)) {
                seenNames.add(prog.name)
                mergedPrograms.push({ ...prog, id: mergedPrograms.length + 1 })
            }
        })
    })

    return { year, programs: mergedPrograms }
}

// Get data based on region and base
// PRIORITY: 1. localStorage (user-modified data) -> 2. Static JSON (defaults)
export function getOTPData(region: string, base: string): OTPData {
    // Try localStorage first for user-modified data
    if (typeof window !== 'undefined') {
        try {
            const stored = localStorage.getItem('hse-otp-data')
            if (stored) {
                const allData = JSON.parse(stored)
                // Construct the key used in localStorage
                const dataKey = base === 'all' ? region : `${region}_${base}`
                if (allData[dataKey]) {
                    return allData[dataKey] as OTPData
                }
            }
        } catch (e) {
            console.error('Error loading from localStorage:', e)
        }
    }

    // Fall back to static JSON files as defaults
    if (region === "asia") {
        return otpAsiaData as OTPData
    }

    // Indonesia region with base filtering
    if (base === "narogong") return otpNarogong as OTPData
    if (base === "duri") return otpDuri as OTPData
    if (base === "balikpapan") return otpBalikpapan as OTPData

    // All bases: merge data from Narogong, Duri, and Balikpapan
    return mergeOTPData(
        otpNarogong as OTPData,
        otpDuri as OTPData,
        otpBalikpapan as OTPData
    )
}

// LocalStorage key for persistence
const STORAGE_KEY = "hse-otp-data"

// Load from localStorage if available
export function loadPersistedData(): Record<string, OTPData> | null {
    if (typeof window === "undefined") return null
    try {
        const stored = localStorage.getItem(STORAGE_KEY)
        return stored ? JSON.parse(stored) : null
    } catch {
        return null
    }
}

// Save to localStorage
export function savePersistedData(data: Record<string, OTPData>): void {
    if (typeof window === "undefined") return
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    } catch (e) {
        console.error("Failed to save OTP data:", e)
    }
}

// Generate CSV export
export function generateCSVExport(data: OTPData, regionLabel: string): string {
    let csv = "No,Program Name,Plan Type,"
    csv += monthLabels.map(m => `${m}_Plan,${m}_Actual,${m}_WPTS`).join(",")
    csv += ",Progress\n"

    data.programs.forEach((prog, idx) => {
        csv += `${idx + 1},"${prog.name.replace(/"/g, '""')}","${prog.plan_type || ""}",`
        months.forEach(month => {
            const m = prog.months[month] || { plan: 0, actual: 0, wpts_id: "" }
            csv += `${m.plan},${m.actual},"${(m.wpts_id || "").replace(/"/g, '""')}",`
        })
        csv += `${calculateProgress(prog)}%\n`
    })

    return csv
}

// Download CSV file
export function downloadCSV(data: OTPData, regionLabel: string, year: number): void {
    const csv = generateCSVExport(data, regionLabel)
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = `HSE_OTP_${regionLabel}_${year}.csv`
    link.click()
}

// Brevo Email API - Configure via environment variables or HuggingFace Secrets
// Set NEXT_PUBLIC_BREVO_API_KEY in your environment
const BREVO_API_KEY = process.env.NEXT_PUBLIC_BREVO_API_KEY || ""
const SENDER_EMAIL = process.env.NEXT_PUBLIC_SENDER_EMAIL || "ade.basirwfrd@gmail.com"
const SENDER_NAME = "HSE Management System"

export async function sendBrevoEmail(
    toEmail: string,
    subject: string,
    htmlBody: string
): Promise<boolean> {
    if (!toEmail || !toEmail.trim()) {
        console.log("[EMAIL SKIPPED] No email address provided")
        return false
    }

    try {
        const response = await fetch("https://api.brevo.com/v3/smtp/email", {
            method: "POST",
            headers: {
                "accept": "application/json",
                "api-key": BREVO_API_KEY,
                "content-type": "application/json"
            },
            body: JSON.stringify({
                sender: { name: SENDER_NAME, email: SENDER_EMAIL },
                to: [{ email: toEmail }],
                subject: subject,
                htmlContent: htmlBody
            })
        })

        if (response.ok) {
            console.log(`[EMAIL SENT] To: ${toEmail}, Subject: ${subject}`)
            return true
        } else {
            const errText = await response.text()
            console.error(`[EMAIL ERROR] API returned ${response.status}: ${errText}`)
            return false
        }
    } catch (e) {
        console.error(`[EMAIL ERROR] Failed to send to ${toEmail}:`, e)
        return false
    }
}

// Generate reminder email HTML
export function generateReminderEmailHtml(
    programName: string,
    planDate: string,
    month: string,
    picName: string,
    source: string
): string {
    const today = new Date()
    const planDateObj = new Date(planDate)
    const daysRemaining = Math.ceil((planDateObj.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    const urgencyColor = daysRemaining <= 7 ? "#dc3545" : "#ffc107"
    const urgencyText = daysRemaining <= 7 ? "⚠️ URGENT" : "🔔 Reminder"

    return `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="font-family: 'Segoe UI', Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
    <div style="background: linear-gradient(135deg, #0a84ff, #0055cc); padding: 30px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 24px;">🔔 HSE Program Reminder</h1>
    </div>
    <div style="padding: 30px;">
      <div style="background: ${urgencyColor}22; border-left: 4px solid ${urgencyColor}; padding: 15px; margin: 0 0 20px 0; border-radius: 4px;">
        <strong style="color: ${urgencyColor};">${urgencyText}: ${daysRemaining} Days Remaining</strong>
      </div>
      <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 8px 0;"><span style="font-weight: 600; color: #666; display: inline-block; width: 100px;">Program:</span> <span style="color: #333; font-weight: 600;">${programName}</span></p>
        <p style="margin: 8px 0;"><span style="font-weight: 600; color: #666; display: inline-block; width: 100px;">Source:</span> <span style="color: #333;">${source}</span></p>
        <p style="margin: 8px 0;"><span style="font-weight: 600; color: #666; display: inline-block; width: 100px;">Plan Date:</span> <span style="color: #0a84ff; font-weight: 600;">${planDate}</span></p>
        <p style="margin: 8px 0;"><span style="font-weight: 600; color: #666; display: inline-block; width: 100px;">Month:</span> <span style="color: #333;">${month.toUpperCase()}</span></p>
        <p style="margin: 8px 0;"><span style="font-weight: 600; color: #666; display: inline-block; width: 100px;">PIC:</span> <span style="color: #333;">${picName || "N/A"}</span></p>
      </div>
    </div>
    <div style="background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666;">
      <p style="margin: 0;">HSE Management System | Automated Reminder</p>
    </div>
  </div>
</body>
</html>
`
}

// Get calendar events from OTP data
export function getCalendarEvents(allData: Record<string, OTPData>): Array<{
    id: number
    source: string
    region: string
    base: string | null
    program_name: string
    month: string
    plan_date: string
    impl_date: string
    pic_name: string
    plan_type: string
}> {
    const events: any[] = []

    Object.entries(allData).forEach(([key, data]) => {
        const [region, base] = key.includes("_") ? key.split("_") : [key, null]

        data.programs.forEach(prog => {
            Object.entries(prog.months).forEach(([month, monthData]) => {
                const planDate = monthData.plan_date || ""
                const implDate = monthData.impl_date || ""

                if (planDate || implDate) {
                    events.push({
                        id: prog.id,
                        source: "otp",
                        region,
                        base,
                        program_name: prog.name,
                        month,
                        plan_date: planDate,
                        impl_date: implDate,
                        pic_name: monthData.pic_name || "",
                        plan_type: prog.plan_type || ""
                    })
                }
            })
        })
    })

    return events
}

export { months, monthLabels }
