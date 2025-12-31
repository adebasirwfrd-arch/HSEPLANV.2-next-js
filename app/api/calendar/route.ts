import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/calendar
 * Fetch calendar events from Supabase using the get_calendar_events function
 * 
 * Query params:
 * - year: number (default: 2026)
 */
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { searchParams } = new URL(request.url)
        const year = parseInt(searchParams.get('year') || '2026')

        // Call the database function
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error } = await (supabase as any)
            .rpc('get_calendar_events', { p_year: year })

        if (error) {
            console.error('Supabase error:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        // Transform to frontend format
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const events = (data || []).map((event: any) => ({
            id: event.program_id,
            source: event.program_type.startsWith('matrix_') ? 'matrix' : 'otp',
            category: event.program_type.replace('matrix_', ''),
            region: event.region,
            base: event.base,
            program_name: event.program_title,
            month: event.month,
            plan_date: event.plan_date || '',
            impl_date: event.impl_date || '',
            pic_name: event.pic_name || '',
            plan_type: '',
            plan_value: event.plan_value,
            actual_value: event.actual_value,
            status: event.status
        }))

        return NextResponse.json(events)
    } catch (error) {
        console.error('API error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
