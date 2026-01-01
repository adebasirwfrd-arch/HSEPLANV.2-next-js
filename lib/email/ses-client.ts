import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses"

// Initialize SES Client
const sesClient = new SESClient({
    region: process.env.AWS_REGION || "us-east-1",
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
    },
})

interface SendSESEmailParams {
    to: string | string[]
    subject: string
    html: string
    from?: string
}

/**
 * Send email via AWS SES
 */
export async function sendSESEmail({
    to,
    subject,
    html,
    from,
}: SendSESEmailParams): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const sourceEmail = from || process.env.SES_FROM_EMAIL || "noreply@example.com"
    const toAddresses = Array.isArray(to) ? to : [to]

    try {
        const command = new SendEmailCommand({
            Source: sourceEmail,
            Destination: {
                ToAddresses: toAddresses,
            },
            Message: {
                Subject: {
                    Data: subject,
                    Charset: "UTF-8",
                },
                Body: {
                    Html: {
                        Data: html,
                        Charset: "UTF-8",
                    },
                },
            },
        })

        const response = await sesClient.send(command)

        console.log("✅ Email sent via AWS SES:", response.MessageId)

        return {
            success: true,
            messageId: response.MessageId,
        }
    } catch (error: any) {
        console.error("❌ AWS SES Error:", error.message)

        return {
            success: false,
            error: error.message || "Failed to send email via SES",
        }
    }
}

/**
 * Check if SES is properly configured
 */
export function isSESConfigured(): boolean {
    return !!(
        process.env.AWS_ACCESS_KEY_ID &&
        process.env.AWS_SECRET_ACCESS_KEY &&
        process.env.AWS_REGION
    )
}
