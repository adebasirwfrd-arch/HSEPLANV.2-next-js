import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createGoogleEvent, getGoogleCalendarClient } from '@/lib/google-calendar';

interface OTPProgram {
    id: number;
    name: string;
    region: string;
    base: string | null;
    months: Record<string, {
        plan_date?: string;
        impl_date?: string;
        pic_name?: string;
        wpts_id?: string;
    }>;
}

// Single event sync payload
interface SyncEventPayload {
    name: string;
    pic?: string;
    wpts_id?: string;
    plan_date?: string;
    source: 'otp' | 'task' | 'matrix' | 'program';
}

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
        const { action, event } = body; // action: 'enable' | 'disable' | 'sync_single', event: SyncEventPayload

        // Get user settings
        const { data: settings } = await supabase
            .from('user_settings')
            .select('google_access_token, google_refresh_token, is_google_sync_enabled')
            .eq('user_id', user.id)
            .single() as { data: { google_access_token: string | null; google_refresh_token: string | null; is_google_sync_enabled: boolean | null } | null; error: any };

        // Handle single event sync (from OTP/Task pages)
        if (action === 'sync_single' && event) {
            // Check if sync is enabled
            if (!settings?.is_google_sync_enabled) {
                return NextResponse.json({ success: false, message: 'Sync not enabled' });
            }
            if (!settings.google_access_token) {
                return NextResponse.json({ error: 'Google not connected' }, { status: 400 });
            }

            const eventPayload = event as SyncEventPayload;
            if (!eventPayload.plan_date) {
                return NextResponse.json({ success: false, message: 'No date provided' });
            }

            try {
                const eventData = {
                    title: `[HSE] ${eventPayload.name}`,
                    description: `PIC: ${eventPayload.pic || '-'} | WPTS: ${eventPayload.wpts_id || '-'} | Source: ${eventPayload.source}`,
                    startTime: new Date(eventPayload.plan_date + 'T09:00:00'),
                    endTime: new Date(eventPayload.plan_date + 'T10:00:00'),
                };

                await createGoogleEvent(
                    settings.google_access_token,
                    eventData,
                    settings.google_refresh_token ?? undefined
                );
                return NextResponse.json({ success: true, synced: true });
            } catch (err: any) {
                console.error('[Sync Single] Error:', err);
                return NextResponse.json({ success: false, error: err.message });
            }
        }

        if (action === 'disable') {
            // Bulk delete all [HSE] events from Google Calendar
            if (settings?.google_access_token) {
                try {
                    const calendar = getGoogleCalendarClient(
                        settings.google_access_token,
                        settings.google_refresh_token ?? undefined
                    );

                    // List events with [HSE] prefix
                    const eventsRes = await calendar.events.list({
                        calendarId: 'primary',
                        q: '[HSE]',
                        maxResults: 500,
                        singleEvents: true,
                    });

                    const hseEvents = eventsRes.data.items || [];
                    let deletedCount = 0;

                    for (const event of hseEvents) {
                        if (event.id && event.summary?.startsWith('[HSE]')) {
                            try {
                                await calendar.events.delete({
                                    calendarId: 'primary',
                                    eventId: event.id,
                                });
                                deletedCount++;
                            } catch {
                                // Skip failed deletes
                            }
                        }
                    }

                    console.log(`[Calendar Sync] Deleted ${deletedCount} HSE events`);
                } catch (err: any) {
                    console.error('[Bulk Delete] Error:', err);
                    // Continue to disable even if delete fails
                }
            }

            // Update the flag
            await (supabase
                .from('user_settings') as any)
                .upsert({
                    user_id: user.id,
                    is_google_sync_enabled: false,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'user_id' });

            return NextResponse.json({ success: true, syncEnabled: false });
        }

        // Action is 'enable' - need to bulk sync
        if (!settings?.google_access_token) {
            return NextResponse.json(
                { error: 'Google Calendar not connected. Please connect your Google account first.' },
                { status: 400 }
            );
        }

        // Get all OTP programs with dates
        const { data: programs, error: programsError } = await supabase
            .from('hse_programs')
            .select('id, name, region, base, months, program_type');

        if (programsError) {
            console.error('[Calendar Sync] Error fetching programs:', programsError);
            return NextResponse.json(
                { error: 'Failed to fetch programs' },
                { status: 500 }
            );
        }

        let syncedCount = 0;
        const errors: string[] = [];

        // Bulk sync all programs with dates (OTP and Matrix)
        for (const program of (programs || []) as (OTPProgram & { program_type: string })[]) {
            if (!program.months) continue;

            const sourceType = program.program_type === 'matrix' ? 'matrix' : 'otp';

            for (const [month, data] of Object.entries(program.months)) {
                if (!data.plan_date && !data.impl_date) continue;

                try {
                    const eventDate = data.impl_date || data.plan_date;
                    if (!eventDate) continue;

                    const eventData = {
                        title: `[HSE] ${program.name}`,
                        description: `PIC: ${data.pic_name || '-'} | WPTS: ${data.wpts_id || '-'} | Source: ${sourceType}`,
                        startTime: new Date(eventDate + 'T09:00:00'),
                        endTime: new Date(eventDate + 'T10:00:00'),
                    };

                    await createGoogleEvent(
                        settings.google_access_token,
                        eventData,
                        settings.google_refresh_token ?? undefined
                    );
                    syncedCount++;
                } catch (err: any) {
                    errors.push(`${program.name} (${month}): ${err.message}`);
                }
            }
        }

        // Update sync flag
        await (supabase
            .from('user_settings') as any)
            .upsert({
                user_id: user.id,
                is_google_sync_enabled: true,
                updated_at: new Date().toISOString()
            }, { onConflict: 'user_id' });

        return NextResponse.json({
            success: true,
            syncEnabled: true,
            syncedCount,
            errors: errors.length > 0 ? errors : undefined
        });

    } catch (error: any) {
        console.error('[Calendar Sync] Error:', error);
        return NextResponse.json(
            { error: 'Failed to sync calendar' },
            { status: 500 }
        );
    }
}

// GET endpoint to check sync status
export async function GET() {
    try {
        const supabase = await createClient();

        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ syncEnabled: false, connected: false, email: null });
        }

        const { data: settings } = await supabase
            .from('user_settings')
            .select('google_access_token, is_google_sync_enabled')
            .eq('user_id', user.id)
            .single() as { data: { google_access_token: string | null; is_google_sync_enabled: boolean | null } | null; error: any };

        return NextResponse.json({
            syncEnabled: settings?.is_google_sync_enabled ?? false,
            connected: !!settings?.google_access_token,
            email: user.email || null
        });

    } catch {
        return NextResponse.json({ syncEnabled: false, connected: false, email: null });
    }
}
