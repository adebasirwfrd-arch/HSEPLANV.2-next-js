import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import type { Month } from '@/types/supabase'

/**
 * PUT /api/programs/[id]/progress
 * Update or create progress for a specific month
 * 
 * Body:
 * - month: 'jan' | 'feb' | ... | 'dec'
 * - year: number
 * - plan_value: number
 * - actual_value: number
 * - wpts_id?: string
 * - plan_date?: string (ISO date)
 * - impl_date?: string (ISO date)
 * - pic_name?: string
 * - pic_email?: string
 * - pic_manager?: string
 * - pic_manager_email?: string
 * - status?: 'pending' | 'in_progress' | 'completed' | 'overdue' | 'cancelled'
 */
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = await createClient()
        const { id } = await params
        const programId = parseInt(id)
        const body = await request.json()

        const month = body.month as Month
        const year = body.year || 2026

        // Upsert progress data (insert or update based on unique constraint)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error } = await (supabase as any)
            .from('program_progress')
            .upsert(
                {
                    program_id: programId,
                    month,
                    year,
                    plan_value: body.plan_value ?? 0,
                    actual_value: body.actual_value ?? 0,
                    wpts_id: body.wpts_id || null,
                    plan_date: body.plan_date || null,
                    impl_date: body.impl_date || null,
                    pic_name: body.pic_name || null,
                    pic_email: body.pic_email || null,
                    pic_manager: body.pic_manager || null,
                    pic_manager_email: body.pic_manager_email || null,
                    evidence_url: body.evidence_url || null,
                    status: body.status || 'pending',
                    notes: body.notes || null
                },
                {
                    onConflict: 'program_id,month,year'
                }
            )
            .select()
            .single()

        if (error) {
            console.error('Supabase error:', error)
            return NextResponse.json({ error: error.message }, { status: 400 })
        }

        return NextResponse.json(data)
    } catch (error) {
        console.error('API error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

/**
 * POST /api/programs/[id]/progress
 * Bulk update progress for multiple months
 * 
 * Body:
 * - year: number
 * - months: Record<string, { plan: number, actual: number, ... }>
 */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = await createClient()
        const { id } = await params
        const programId = parseInt(id)
        const body = await request.json()

        const year = body.year || 2026
        const monthsData = body.months as Record<string, any>

        // Build upsert array for all months
        const upsertData = Object.entries(monthsData).map(([month, data]) => ({
            program_id: programId,
            month: month as Month,
            year,
            plan_value: data.plan ?? 0,
            actual_value: data.actual ?? 0,
            wpts_id: data.wpts_id || null,
            plan_date: data.plan_date || null,
            impl_date: data.impl_date || null,
            pic_name: data.pic_name || null,
            pic_email: data.pic_email || null,
            pic_manager: data.pic_manager || null,
            pic_manager_email: data.pic_manager_email || null,
            evidence_url: data.evidence_url || null,
            status: data.status || 'pending',
            notes: data.notes || null
        }))

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error } = await (supabase as any)
            .from('program_progress')
            .upsert(upsertData, { onConflict: 'program_id,month,year' })
            .select()

        if (error) {
            console.error('Supabase error:', error)
            return NextResponse.json({ error: error.message }, { status: 400 })
        }

        return NextResponse.json({ success: true, updated: data?.length || 0 })
    } catch (error) {
        console.error('API error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
