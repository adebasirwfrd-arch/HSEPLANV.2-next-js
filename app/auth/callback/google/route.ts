import { google } from 'googleapis';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code) {
        return NextResponse.json({ error: 'No code provided' }, { status: 400 });
    }

    const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI
    );

    try {
        // Exchange code for tokens
        const { tokens } = await oauth2Client.getToken(code);
        oauth2Client.setCredentials(tokens);

        // Get user info from Google
        let googleEmail: string | null = null;
        try {
            const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
            const userInfo = await oauth2.userinfo.get();
            googleEmail = userInfo.data.email || null;
        } catch (e) {
            console.error('Error fetching Google user info:', e);
        }

        // Save tokens to Supabase user_settings
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
            console.log('[Google OAuth] Saving tokens for user:', user.id);

            const { error: upsertError } = await (supabase
                .from('user_settings') as any)
                .upsert({
                    user_id: user.id,
                    google_access_token: tokens.access_token,
                    google_refresh_token: tokens.refresh_token,
                    is_google_sync_enabled: false, // Will be enabled when user clicks Sync Now
                    updated_at: new Date().toISOString(),
                }, { onConflict: 'user_id' });

            if (upsertError) {
                console.error('[Google OAuth] Error saving tokens:', upsertError);
            } else {
                console.log('[Google OAuth] Tokens saved successfully for user:', user.id);
            }
        } else {
            console.error('[Google OAuth] No authenticated user found');
        }

        // Redirect to Calendar with success indicator after OAuth
        return NextResponse.redirect(new URL('/calendar?connection=success', request.url));
    } catch (error) {
        console.error('Error exchanging code for token:', error);
        return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
    }
}