import { NextResponse } from "next/server"
import { connect } from "getstream"

export async function GET() {
    try {
        const apiKey = process.env.NEXT_PUBLIC_STREAM_APP_KEY
        const appSecret = process.env.STREAM_APP_SECRET
        const appId = process.env.NEXT_PUBLIC_STREAM_APP_ID

        if (!apiKey || !appSecret) {
            return NextResponse.json(
                { error: "Stream API credentials not configured" },
                { status: 500 }
            )
        }

        // Initialize Stream client
        const client = connect(apiKey, appSecret, appId)

        // Use a demo user ID (replace with actual user ID when auth is implemented)
        const userId = "user_demo"

        // Generate user token
        const userToken = client.createUserToken(userId)

        return NextResponse.json({
            token: userToken,
            apiKey,
            appId,
            userId
        })
    } catch (error: any) {
        console.error("Stream Token API Error:", error)
        return NextResponse.json(
            { error: error.message || "Failed to generate token" },
            { status: 500 }
        )
    }
}
