import { NextResponse } from "next/server"
import { connect } from "getstream"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
    console.log('=== STREAM TOKEN API DEBUG ===')
    console.log('Timestamp:', new Date().toISOString())

    try {
        const apiKey = process.env.NEXT_PUBLIC_STREAM_APP_KEY
        const appSecret = process.env.STREAM_SECRET_KEY
        const appId = process.env.NEXT_PUBLIC_STREAM_APP_ID

        console.log('[Stream] API Key exists:', !!apiKey)
        console.log('[Stream] App Secret exists:', !!appSecret)
        console.log('[Stream] App ID:', appId)

        if (!apiKey || !appSecret) {
            console.error('[Stream] Missing credentials')
            return NextResponse.json(
                { error: "Stream API credentials not configured" },
                { status: 500 }
            )
        }

        // Get user from Supabase session
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            console.error('[Stream] No authenticated user')
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

        console.log('[Stream] User ID (Supabase):', user.id)
        console.log('[Stream] User ID (Stream format):', userId)
        console.log('[Stream] User Name:', userName)
        console.log('[Stream] User Email:', userEmail)
        console.log('[Stream] User Avatar:', userAvatar ? 'present' : 'none')

        // Initialize Stream client
        const client = connect(apiKey, appSecret, appId)
        console.log('[Stream] Client initialized')

        // Generate user token
        const userToken = client.createUserToken(userId)
        console.log('[Stream] Token generated for:', userId)

        // ============================================
        // SANITY CHECKS & SELF-HEALING SYSTEM
        // ============================================

        const diagnostics = {
            userSynced: false,
            timelineFollowsUser: false,
            followVerified: false,
            notificationClean: false
        }

        // 1. IDENTITY AUTO-UPDATE & VERIFICATION
        try {
            console.log('[Stream] Step 1: Syncing user identity...')
            const streamUser = client.user(userId)

            const userData = {
                name: userName,
                image: userAvatar,
                email: userEmail,
                id: userId
            }

            await streamUser.getOrCreate(userData)
            await streamUser.update({
                name: userName,
                image: userAvatar
            })

            // Verify the sync
            const userProfile = await streamUser.get()
            console.log('[Stream] User profile synced:', JSON.stringify(userProfile.data, null, 2))
            diagnostics.userSynced = true
        } catch (updateError) {
            console.error("[Stream] Failed to sync user profile:", updateError)
        }

        // 2. FORCE TIMELINE FOLLOW (Self-Healing)
        try {
            console.log('[Stream] Step 2: Setting up timeline follow...')
            const timelineFeed = client.feed('timeline', userId)
            const userFeed = client.feed('user', userId)

            // Check current follows
            const following = await timelineFeed.following({ limit: 100 })
            console.log('[Stream] Timeline currently follows:', following.results?.length || 0, 'feeds')

            const isFollowingUser = following.results?.some(
                f => f.target_id === `user:${userId}`
            )

            if (!isFollowingUser) {
                console.log('[Stream] Timeline NOT following user feed - FORCING follow...')
                await timelineFeed.follow('user', userId)
                console.log('[Stream] FORCED follow: timeline -> user')
            } else {
                console.log('[Stream] Timeline already follows user feed ✓')
            }

            diagnostics.timelineFollowsUser = true
        } catch (followError) {
            console.error("[Stream] Failed to setup timeline follow:", followError)
        }

        // 3. VERIFY FOLLOW RELATIONSHIP
        try {
            console.log('[Stream] Step 3: Verifying follow relationship...')
            const timelineFeed = client.feed('timeline', userId)
            const verifyFollowing = await timelineFeed.following({ limit: 100 })

            const verified = verifyFollowing.results?.some(
                f => f.target_id === `user:${userId}`
            )

            console.log('[Stream] Follow verification:', verified ? 'PASSED ✓' : 'FAILED ✗')
            console.log('[Stream] All follows:', verifyFollowing.results?.map(f => f.target_id))
            diagnostics.followVerified = verified || false
        } catch (verifyError) {
            console.error('[Stream] Verification failed:', verifyError)
        }

        // 4. NOTIFICATION FEED CHECK
        try {
            console.log('[Stream] Step 4: Checking notification feed...')
            const notificationFeed = client.feed('notification', userId)

            // Try to get activities to verify feed is accessible
            const activities = await notificationFeed.get({ limit: 5 })
            console.log('[Stream] Notification feed accessible, activities:', activities.results?.length || 0)
            diagnostics.notificationClean = true
        } catch (notifError) {
            console.error('[Stream] Notification feed issue:', notifError)
        }

        console.log('[Stream] === DIAGNOSTICS SUMMARY ===')
        console.log(JSON.stringify(diagnostics, null, 2))

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
            },
            diagnostics // Include diagnostics in response for debugging
        })
    } catch (error: unknown) {
        console.error("[Stream] Token API FATAL Error:", error)
        const message = error instanceof Error ? error.message : "Failed to generate token"
        return NextResponse.json(
            { error: message, stack: error instanceof Error ? error.stack : undefined },
            { status: 500 }
        )
    }
}
