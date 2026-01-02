import { NextResponse } from "next/server"
import { connect } from "getstream"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
    try {
        const apiKey = process.env.NEXT_PUBLIC_STREAM_APP_KEY
        const appSecret = process.env.STREAM_SECRET_KEY
        const appId = process.env.NEXT_PUBLIC_STREAM_APP_ID

        if (!apiKey || !appSecret) {
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
        const userId = user.id.replace(/-/g, '') // Stream requires alphanumeric IDs
        const userName = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'User'
        const userAvatar = user.user_metadata?.avatar_url || user.user_metadata?.picture
        const userEmail = user.email

        // Initialize Stream client
        const client = connect(apiKey, appSecret, appId)

        // Generate user token
        const userToken = client.createUserToken(userId)

        // Update user profile in Stream to sync Google profile data
        try {
            const streamUser = client.user(userId)
            await streamUser.getOrCreate({
                name: userName,
                profileImage: userAvatar,
                email: userEmail,
                id: userId
            })
        } catch (updateError) {
            console.error("Failed to update Stream user profile:", updateError)
            // Continue even if profile update fails
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
        console.error("Stream Token API Error:", error)
        const message = error instanceof Error ? error.message : "Failed to generate token"
        return NextResponse.json(
            { error: message },
            { status: 500 }
        )
    }
}
