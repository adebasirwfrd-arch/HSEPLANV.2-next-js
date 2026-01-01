import { NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"
import type { DashboardSnapshot, AIAnalysisResult } from "@/types/ai-analytics"

// Initialize OpenAI client
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
    try {
        const { data } = await request.json() as { data: DashboardSnapshot }

        if (!data) {
            return NextResponse.json(
                { error: "Missing dashboard data" },
                { status: 400 }
            )
        }

        // Build the system prompt with context
        const systemPrompt = `You are a Senior HSE (Health, Safety & Environment) Manager with 20+ years of experience. Analyze this safety dashboard data and provide strategic insights.

Context from the HSE Dashboard:
- OTP Compliance: ${data.otp.compliance}%
- OTP Overdue Items: ${data.otp.overdueCount}
- Critical Items: ${data.otp.criticalItems.join(", ") || "None"}
- Matrix Compliance: ${data.matrix.compliance}%
- Total Matrix Programs: ${data.matrix.totalPrograms}
- Man Hours: ${data.kpi.manHours.toLocaleString()}
- TRIR (Total Recordable Incident Rate): ${data.kpi.trir}
- Incidents: ${data.kpi.incidents}
- Open Tasks: ${data.tasks.open}
- Completed Tasks: ${data.tasks.completed}
- Leading/Lagging Indicator Ratio: ${data.llIndicators.ratio}

Analyze this data and return a JSON response with the following structure:
{
  "summary": "A single sentence executive summary of the safety situation",
  "risk": "The single most critical safety risk identified based on the data",
  "actions": ["Action 1", "Action 2", "Action 3"],
  "score": 75,
  "tone": "good" | "warning" | "critical"
}

Guidelines:
- summary: Be concise but insightful
- risk: Focus on the most impactful risk to address immediately
- actions: 3 specific, actionable recommendations that can be implemented this week
- score: 0-100 where 80+ is good, 50-79 is concerning, below 50 is critical
- tone: "good" if score >= 80, "warning" if 50-79, "critical" if < 50

Respond ONLY with valid JSON matching this structure.`

        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: "Please analyze the dashboard data provided above and give your professional HSE assessment." }
            ],
            response_format: { type: "json_object" },
            temperature: 0.7,
            max_tokens: 500,
        })

        const responseText = completion.choices[0]?.message?.content || "{}"

        try {
            const result: AIAnalysisResult = JSON.parse(responseText)

            // Validate the response structure
            if (!result.summary || !result.risk || !result.actions || result.score === undefined || !result.tone) {
                throw new Error("Invalid response structure")
            }

            return NextResponse.json(result)
        } catch (parseError) {
            console.error("Failed to parse AI response:", responseText)
            return NextResponse.json(
                { error: "Failed to parse AI response" },
                { status: 500 }
            )
        }

    } catch (error: any) {
        console.error("AI Insight API Error:", error)

        // Handle specific OpenAI errors
        if (error?.status === 401) {
            return NextResponse.json(
                { error: "Invalid API key" },
                { status: 401 }
            )
        }

        if (error?.status === 429) {
            return NextResponse.json(
                { error: "Rate limit exceeded. Please try again later." },
                { status: 429 }
            )
        }

        return NextResponse.json(
            { error: error.message || "Internal server error" },
            { status: 500 }
        )
    }
}

// GET endpoint for health check
export async function GET() {
    const hasApiKey = !!process.env.OPENAI_API_KEY
    return NextResponse.json({
        status: "ok",
        configured: hasApiKey,
        message: hasApiKey ? "AI Insights API is ready" : "OPENAI_API_KEY not configured"
    })
}
