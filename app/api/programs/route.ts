import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import type { MasterProgram, ProgramProgress, Month } from '@/types/supabase'

// Month order for proper sequencing
const MONTHS: Month[] = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']

// Frontend-compatible types (matching otp-store.ts structure)
interface MonthData {
    plan: number
    actual: number
    wpts_id?: string
    plan_date?: string
    impl_date?: string
    pic_name?: string
    pic_email?: string
    pic_manager?: string
    pic_manager_email?: string
}

interface FrontendProgram {
    id: number
    name: string
    plan_type: string
    due_date: string | null
    reference?: string
    months: Record<string, MonthData>
    progress?: number
}

interface FrontendData {
    year: number
    programs: FrontendProgram[]
    region?: string
    category?: string
}

/**
 * GET /api/programs
 * Fetch programs from Supabase and transform to frontend format
 * 
 * Query params:
 * - type: 'otp' | 'matrix_audit' | 'matrix_training' | 'matrix_drill' | 'matrix_meeting'
 * - region: string (default: 'indonesia')
 * - base: string (default: 'all')
 * - year: number (default: 2026)
 */
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { searchParams } = new URL(request.url)

        const programType = searchParams.get('type') || 'otp'
        const region = searchParams.get('region') || 'indonesia'
        const base = searchParams.get('base') || 'all'
        const year = parseInt(searchParams.get('year') || '2026')

        // Fetch programs with their progress data
        let query = supabase
            .from('master_programs')
            .select(`
        id,
        title,
        program_type,
        region,
        base,
        plan_type,
        reference_doc,
        due_date,
        program_progress (
          id,
          month,
          year,
          plan_value,
          actual_value,
          wpts_id,
          plan_date,
          impl_date,
          pic_name,
          pic_email,
          pic_manager,
          pic_manager_email,
          status
        )
      `)
            .eq('program_type', programType)
            .eq('region', region)

        // Filter by base if not 'all'
        if (base !== 'all') {
            query = query.or(`base.eq.${base},base.eq.all`)
        }

        const { data: programs, error } = await query

        if (error) {
            console.error('Supabase error:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        // Transform to frontend format
        const frontendPrograms: FrontendProgram[] = (programs || []).map(program => {
            // Build months object from progress data
            const months: Record<string, MonthData> = {}

            // Initialize all months with zeros
            MONTHS.forEach(month => {
                months[month] = { plan: 0, actual: 0 }
            })

            // Fill in actual data from program_progress
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const progressData = (program as any).program_progress || []
            progressData
                .filter((p: ProgramProgress) => p.year === year)
                .forEach((p: ProgramProgress) => {
                    months[p.month] = {
                        plan: p.plan_value,
                        actual: p.actual_value,
                        wpts_id: p.wpts_id || undefined,
                        plan_date: p.plan_date || undefined,
                        impl_date: p.impl_date || undefined,
                        pic_name: p.pic_name || undefined,
                        pic_email: p.pic_email || undefined,
                        pic_manager: p.pic_manager || undefined,
                        pic_manager_email: p.pic_manager_email || undefined,
                    }
                })

            // Calculate progress
            let totalPlan = 0
            let totalActual = 0
            MONTHS.forEach(m => {
                totalPlan += months[m].plan
                totalActual += months[m].actual
            })
            const progress = totalPlan > 0 ? Math.round((totalActual / totalPlan) * 100) : 0

            return {
                id: (program as any).id,
                name: (program as any).title,
                plan_type: (program as any).plan_type || '',
                due_date: (program as any).due_date,
                reference: (program as any).reference_doc || undefined,
                months,
                progress
            }
        })

        const response: FrontendData = {
            year,
            programs: frontendPrograms,
            region,
            category: programType.replace('matrix_', '')
        }

        return NextResponse.json(response)
    } catch (error) {
        console.error('API error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

/**
 * POST /api/programs
 * Create a new program
 */
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()
        const body = await request.json()

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error } = await (supabase as any)
            .from('master_programs')
            .insert({
                title: body.title,
                program_type: body.program_type,
                region: body.region || 'indonesia',
                base: body.base || 'all',
                plan_type: body.plan_type,
                reference_doc: body.reference_doc,
                due_date: body.due_date
            })
            .select()
            .single()

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 400 })
        }

        return NextResponse.json(data, { status: 201 })
    } catch (error) {
        console.error('API error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
