import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/calendar
 * Fetch calendar events from Supabase programs table
 * Falls back to direct query if RPC function doesn't exist
 * 
 * Query params:
 * - year: number (default: 2026)
 */
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { searchParams } = new URL(request.url)
        const year = parseInt(searchParams.get('year') || '2026')

        // Direct query to programs table (more reliable than RPC)
        const { data, error } = await supabase
            .from('programs')
            .select('*')
            .gte('plan_date', `${year}-01-01`)
            .lte('plan_date', `${year}-12-31`)
            .order('plan_date', { ascending: true })

        if (error) {
            console.error('Supabase query error:', error)
            // Return empty array instead of error for better UX
            return NextResponse.json([])
        }

        // Transform to calendar event format
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const events = (data || []).map((program: any) => ({
            id: program.id,
            source: program.program_type?.startsWith('matrix_') ? 'matrix' : 'otp',
            category: program.program_type?.replace('matrix_', '') || 'general',
            region: program.region || '',
            base: program.base || '',
            program_name: program.program_title || program.title || '',
            month: program.plan_date ? new Date(program.plan_date).getMonth() + 1 : 1,
            plan_date: program.plan_date || '',
            impl_date: program.impl_date || '',
            pic_name: program.pic_name || program.pic || '',
            plan_type: program.plan_type || '',
            plan_value: program.plan_value || 0,
            actual_value: program.actual_value || 0,
            status: program.status || 'planned'
        }))

        return NextResponse.json(events)
    } catch (error) {
        console.error('Calendar API error:', error)
        // Return empty array on error for graceful degradation
        return NextResponse.json([])
    }
}
