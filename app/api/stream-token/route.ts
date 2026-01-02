import { NextResponse } from "next/server"
import { connect } from "getstream"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
    // ============================================
    // DIAGNOSTIC: Credential Validation
    // ============================================
    console.log('=== STREAM TOKEN API AUDIT ===')
    console.log('DEBUG: KEY EXISTS:', !!process.env.NEXT_PUBLIC_STREAM_API_KEY)
    console.log('DEBUG: SECRET EXISTS:', !!process.env.STREAM_API_SECRET)
    console.log('DEBUG: APP ID EXISTS:', !!process.env.NEXT_PUBLIC_STREAM_APP_ID)

    // Also check alternate variable names (in case of typo)
    console.log('DEBUG: STREAM_APP_KEY EXISTS:', !!process.env.NEXT_PUBLIC_STREAM_APP_KEY)
    console.log('DEBUG: STREAM_SECRET_KEY EXISTS:', !!process.env.STREAM_SECRET_KEY)

    try {
        // Check multiple possible variable names
        const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY || process.env.NEXT_PUBLIC_STREAM_APP_KEY
        const appSecret = process.env.STREAM_API_SECRET || process.env.STREAM_SECRET_KEY
        const appId = process.env.NEXT_PUBLIC_STREAM_APP_ID

        console.log('DEBUG: Final apiKey exists:', !!apiKey)
        console.log('DEBUG: Final appSecret exists:', !!appSecret)
        console.log('DEBUG: Final appId:', appId)

        if (!apiKey || !appSecret || !appId) {
            const missing = []
            if (!apiKey) missing.push('API_KEY')
            if (!appSecret) missing.push('API_SECRET')
            if (!appId) missing.push('APP_ID')

            console.error('DEBUG: Missing credentials:', missing.join(', '))

            return NextResponse.json({
                error: "Stream API credentials not configured",
                missing: missing,
                hint: "Check Vercel env vars: NEXT_PUBLIC_STREAM_API_KEY, STREAM_API_SECRET, NEXT_PUBLIC_STREAM_APP_ID"
            }, { status: 500 })
        }

        // Get user from Supabase session
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError) {
            console.error('DEBUG: Supabase auth error:', authError)
            return NextResponse.json({
                error: "Authentication error",
                details: authError.message
            }, { status: 401 })
        }

        if (!user) {
            console.log('DEBUG: No authenticated user')
            return NextResponse.json({
                error: "Not authenticated",
                hint: "User must be logged in to get Stream token"
            }, { status: 401 })
        }

        console.log('DEBUG: User authenticated:', user.id)

        // Extract user data
        const userId = user.id.replace(/-/g, '')
        const userName = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'User'
        const userAvatar = user.user_metadata?.avatar_url || user.user_metadata?.picture
        const userEmail = user.email

        // ============================================
        // DIAGNOSTIC: Core Initialization Test
        // ============================================
        let client
        try {
            console.log('DEBUG: Attempting Stream connect...')
            client = connect(apiKey, appSecret, appId)
            console.log('DEBUG: Stream client created successfully')
        } catch (connectError: unknown) {
            const errorMsg = connectError instanceof Error ? connectError.message : String(connectError)
            console.error('DEBUG: Stream connect FAILED:', errorMsg)
            return NextResponse.json({
                error: "Stream connection failed",
                details: errorMsg,
                hint: "Check if API key, secret, and app ID are correct. Verify region settings."
            }, { status: 500 })
        }

        // Generate token
        let userToken
        try {
            userToken = client.createUserToken(userId)
            console.log('DEBUG: Token generated for userId:', userId)
        } catch (tokenError: unknown) {
            const errorMsg = tokenError instanceof Error ? tokenError.message : String(tokenError)
            console.error('DEBUG: Token generation FAILED:', errorMsg)
            return NextResponse.json({
                error: "Token generation failed",
                details: errorMsg
            }, { status: 500 })
        }

        // ============================================
        // DIAGNOSTIC: Feed Group Sanity Check
        // ============================================
        try {
            console.log('DEBUG: Testing feed access for user:', userId)
            const userFeed = client.feed('user', userId)
            const timelineFeed = client.feed('timeline', userId)

            // Test if we can access the feeds
            await userFeed.get({ limit: 1 })
            console.log('DEBUG: User feed accessible ✓')

            await timelineFeed.get({ limit: 1 })
            console.log('DEBUG: Timeline feed accessible ✓')
        } catch (feedError: unknown) {
            const errorMsg = feedError instanceof Error ? feedError.message : String(feedError)
            console.error('DEBUG: Feed access FAILED:', errorMsg)
            // Don't fail here, just log - token is still valid
        }

        // Sync user identity (non-blocking)
        try {
            const streamUser = client.user(userId)
            await streamUser.getOrCreate({
                name: userName,
                image: userAvatar,
                email: userEmail,
                id: userId
            })
            console.log('DEBUG: User synced to Stream')
        } catch (syncError: unknown) {
            console.error('DEBUG: User sync failed:', syncError instanceof Error ? syncError.message : syncError)
        }

        // Auto-follow (non-blocking)
        try {
            const timelineFeed = client.feed('timeline', userId)
            await timelineFeed.follow('user', userId)
            console.log('DEBUG: Timeline auto-follow set')
        } catch (followError: unknown) {
            console.error('DEBUG: Auto-follow failed:', followError instanceof Error ? followError.message : followError)
        }

        console.log('DEBUG: Token API completed successfully')

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
        const stack = error instanceof Error ? error.stack : undefined
        console.error('DEBUG: FATAL ERROR:', message)
        console.error('DEBUG: Stack:', stack)

        return NextResponse.json({
            error: message,
            stack: stack,
            hint: "Check Vercel logs for detailed error information"
        }, { status: 500 })
    }
}
