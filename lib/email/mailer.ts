import { sendSESEmail, isSESConfigured } from "./ses-client"

// Email provider types
type EmailProvider = "SES" | "BREVO" | "SMTP"

interface SendEmailParams {
    to: string | string[]
    subject: string
    html: string
    from?: string
}

interface SendEmailResult {
    success: boolean
    provider: EmailProvider
    messageId?: string
    error?: string
}

/**
 * Unified email sending function
 * Automatically routes to the correct provider based on EMAIL_PROVIDER env var
 */
export async function sendEmail(params: SendEmailParams): Promise<SendEmailResult> {
    const provider = (process.env.EMAIL_PROVIDER || "BREVO") as EmailProvider

    switch (provider) {
        case "SES":
            console.log("🚀 Sending via AWS SES...")
            if (!isSESConfigured()) {
                return {
                    success: false,
                    provider: "SES",
                    error: "AWS SES is not configured. Please set AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, and AWS_REGION.",
                }
            }
            const sesResult = await sendSESEmail(params)
            return {
                ...sesResult,
                provider: "SES",
            }

        case "BREVO":
            console.log("📧 Sending via Brevo...")
            return await sendViaBrevo(params)

        case "SMTP":
            console.log("📬 Sending via SMTP...")
            return await sendViaSMTP(params)

        default:
            console.log("📧 Defaulting to Brevo...")
            return await sendViaBrevo(params)
    }
}

/**
 * Send email via Brevo (Sendinblue) API
 */
async function sendViaBrevo(params: SendEmailParams): Promise<SendEmailResult> {
    const apiKey = process.env.BREVO_API_KEY

    if (!apiKey) {
        // Fallback: Log the email instead of sending (for development)
        console.log("⚠️ Brevo not configured. Email would be sent to:", params.to)
        console.log("Subject:", params.subject)
        return {
            success: true,
            provider: "BREVO",
            messageId: `dev-${Date.now()}`,
        }
    }

    try {
        const response = await fetch("https://api.brevo.com/v3/smtp/email", {
            method: "POST",
            headers: {
                "api-key": apiKey,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                sender: {
                    email: process.env.BREVO_FROM_EMAIL || "noreply@hse-app.com",
                    name: process.env.BREVO_FROM_NAME || "HSE Plan App",
                },
                to: Array.isArray(params.to)
                    ? params.to.map((email) => ({ email }))
                    : [{ email: params.to }],
                subject: params.subject,
                htmlContent: params.html,
            }),
        })

        if (!response.ok) {
            const error = await response.text()
            throw new Error(error)
        }

        const data = await response.json()
        console.log("✅ Email sent via Brevo:", data.messageId)

        return {
            success: true,
            provider: "BREVO",
            messageId: data.messageId,
        }
    } catch (error: any) {
        console.error("❌ Brevo Error:", error.message)
        return {
            success: false,
            provider: "BREVO",
            error: error.message,
        }
    }
}

/**
 * Send email via generic SMTP (using nodemailer-style fetch)
 * Placeholder for future SMTP implementation
 */
async function sendViaSMTP(params: SendEmailParams): Promise<SendEmailResult> {
    // Placeholder - would use nodemailer or similar
    console.log("⚠️ SMTP not fully implemented. Email details:")
    console.log("To:", params.to)
    console.log("Subject:", params.subject)

    return {
        success: true,
        provider: "SMTP",
        messageId: `smtp-placeholder-${Date.now()}`,
    }
}

/**
 * Send OTP reminder email
 */
export async function sendOTPReminderEmail(
    to: string,
    programName: string,
    dueDate: string
): Promise<SendEmailResult> {
    const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #3b82f6, #0ea5e9); padding: 20px; border-radius: 12px 12px 0 0;">
        <h1 style="color: white; margin: 0;">⚠️ OTP Reminder</h1>
      </div>
      <div style="padding: 24px; background: #f8fafc; border-radius: 0 0 12px 12px;">
        <p style="font-size: 16px; color: #334155;">
          This is a reminder that the following program requires attention:
        </p>
        <div style="background: white; padding: 16px; border-radius: 8px; margin: 16px 0; border-left: 4px solid #f59e0b;">
          <h3 style="margin: 0 0 8px 0; color: #1e293b;">${programName}</h3>
          <p style="margin: 0; color: #64748b;">Due Date: <strong>${dueDate}</strong></p>
        </div>
        <p style="color: #64748b; font-size: 14px;">
          Please update the program status in the HSE Plan application.
        </p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://hse-app.vercel.app'}/otp" 
           style="display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin-top: 16px;">
          View OTP Dashboard
        </a>
      </div>
    </div>
  `

    return sendEmail({
        to,
        subject: `⚠️ OTP Reminder: ${programName}`,
        html,
    })
}
