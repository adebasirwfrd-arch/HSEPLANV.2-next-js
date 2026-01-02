import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createGoogleEvent } from '@/lib/google-calendar';

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();

        // Get current user
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Parse request body
        const body = await request.json();
        const { title, description, category, plan_date } = body;

        if (!title || !description) {
            return NextResponse.json(
                { error: 'Title and description are required' },
                { status: 400 }
            );
        }

        // Check if category qualifies for calendar sync
        // Added 'otp' and 'task' to allow sync from those pages
        const syncCategories = ['observation', 'incident', 'near_miss', 'toolbox_talk', 'otp', 'task'];
        if (category && !syncCategories.includes(category)) {
            return NextResponse.json(
                { message: 'Category does not require calendar sync', skipped: true },
                { status: 200 }
            );
        }

        // Get Google access token from user_settings table
        const { data: settings, error: settingsError } = await supabase
            .from('user_settings')
            .select('google_access_token, google_refresh_token')
            .eq('user_id', user.id)
            .single() as { data: { google_access_token: string | null; google_refresh_token: string | null } | null; error: any };

        if (settingsError || !settings?.google_access_token) {
            return NextResponse.json(
                { error: 'Google Calendar not connected. Please connect your Google account first.' },
                { status: 400 }
            );
        }

        // Create calendar event with optional plan_date
        const eventDate = plan_date ? new Date(plan_date + 'T09:00:00') : undefined;
        const eventData = {
            title: `[HSE] ${title}`,
            description: description,
            startTime: eventDate,
            endTime: eventDate ? new Date(eventDate.getTime() + 60 * 60 * 1000) : undefined,
        };

        const event = await createGoogleEvent(
            settings.google_access_token,
            eventData,
            settings.google_refresh_token ?? undefined
        );

        return NextResponse.json({
            success: true,
            eventId: event.id,
            eventLink: event.htmlLink,
        });

    } catch (error: any) {
        console.error('[Calendar Create] Error:', error);

        // Handle token expiration
        if (error.code === 401 || error.message?.includes('invalid_grant')) {
            return NextResponse.json(
                { error: 'Google token expired. Please reconnect your Google account.' },
                { status: 401 }
            );
        }

        return NextResponse.json(
            { error: 'Failed to create calendar event' },
            { status: 500 }
        );
    }
}
