import { NextResponse } from "next/server"
import { connect } from "getstream"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
    try {
        const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY
        const appSecret = process.env.STREAM_API_SECRET
        const appId = process.env.NEXT_PUBLIC_STREAM_APP_ID

        // Pastikan variabel environment terbaca
        if (!apiKey || !appSecret || !appId) {
            return NextResponse.json(
                { error: "Stream API credentials not configured" },
                { status: 500 }
            )
        }

        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json(
                { error: "Not authenticated" },
                { status: 401 }
            )
        }

        const userId = user.id.replace(/-/g, '')
        const userName = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'User'
        const userAvatar = user.user_metadata?.avatar_url || user.user_metadata?.picture
        const userEmail = user.email

        /**
         * PERBAIKAN UTAMA: 
         * Menggunakan format inisialisasi yang benar untuk region 'singapore'.
         * SDK akan otomatis menangani pembentukan URL yang valid.
         */
        const client = connect(apiKey, appSecret, appId, 'singapore');

        const userToken = client.createUserToken(userId)

        // Sinkronisasi identitas user
        try {
            await client.user(userId).getOrCreate({
                name: userName,
                image: userAvatar,
                email: userEmail
            })
        } catch (e) {
            console.error("Stream Identity Sync Error:", e)
        }

        // Auto-follow: Memastikan timeline menarik data dari feed user
        try {
            const timelineFeed = client.feed('timeline', userId)
            await timelineFeed.follow('user', userId)
        } catch (e) {
            console.error("Stream Auto-follow Error:", e)
        }

        return NextResponse.json({
            token: userToken,
            apiKey,
            appId,
            userId,
            user: {
                id: userId,
                name: userName,
                image: userAvatar
            }
        })
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Failed to generate token"
        return NextResponse.json({ error: message }, { status: 500 })
    }
}