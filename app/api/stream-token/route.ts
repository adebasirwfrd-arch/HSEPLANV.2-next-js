import { NextResponse } from "next/server"
import { connect } from "getstream"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
    try {
        // Use strict env var names
        const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY
        const appSecret = process.env.STREAM_API_SECRET
        const appId = process.env.NEXT_PUBLIC_STREAM_APP_ID

        if (!apiKey || !appSecret || !appId) {
            return NextResponse.json(
                { error: "Stream API credentials not configured" },
                { status: 500 }
            )
        }

        // Get user from Supabase session
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json(
                { error: "Not authenticated" },
                { status: 401 }
            )
        }

        // Extract user data from Google OAuth
        const userId = user.id.replace(/-/g, '')
        const userName = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'User'
        const userAvatar = user.user_metadata?.avatar_url || user.user_metadata?.picture
        const userEmail = user.email

        // Initialize Stream client with Singapore region
        const client = connect(apiKey, appSecret, appId, { location: 'singapore-east' })

        // Generate user token
        const userToken = client.createUserToken(userId)

        // Sync user identity to Stream
        try {
            const streamUser = client.user(userId)
            await streamUser.getOrCreate({
                name: userName,
                image: userAvatar,
                email: userEmail,
                id: userId
            })
            await streamUser.update({
                name: userName,
                image: userAvatar
            })
        } catch {
            // Non-critical
        }

        // Auto-follow: Ensure timeline follows user feed
        try {
            const timelineFeed = client.feed('timeline', userId)
            await timelineFeed.follow('user', userId)
        } catch {
            // Non-critical
        }

        return NextResponse.json({
            token: userToken,
            apiKey,
            appId,
            userId,
            user: {
                id: userId,
                name: userName,
                image: userAvatar,
                email: userEmail
            }
        })
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Failed to generate token"
        return NextResponse.json(
            { error: message },
            { status: 500 }
        )
    }
}
