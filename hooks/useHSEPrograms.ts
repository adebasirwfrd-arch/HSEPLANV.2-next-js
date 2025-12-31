'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Month, ProgramType, ProgramProgress } from '@/types/supabase'

// ============================================================================
// Types
// ============================================================================

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
    evidence_url?: string
    status?: string
}

interface Program {
    id: number
    name: string
    plan_type: string
    due_date: string | null
    reference?: string
    months: Record<string, MonthData>
    progress: number
}

interface ProgramsData {
    year: number
    programs: Program[]
    region: string
    base: string
    category: string
}

interface UpdateMonthParams {
    programId: number
    month: Month
    year?: number
    data: Partial<MonthData>
}

interface CreateProgramParams {
    title: string
    program_type: ProgramType
    region?: string
    base?: string
    plan_type?: string
    reference_doc?: string
    due_date?: string
}

// ============================================================================
// Constants
// ============================================================================

const MONTHS: Month[] = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']

// ============================================================================
// Query Keys Factory
// ============================================================================

export const programKeys = {
    all: ['programs'] as const,
    lists: () => [...programKeys.all, 'list'] as const,
    list: (region: string, base: string, category: string) =>
        [...programKeys.lists(), region, base, category] as const,
}

// ============================================================================
// Transform Function
// ============================================================================

function transformToNestedFormat(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    programs: any[],
    year: number
): Program[] {
    return programs.map(program => {
        // Initialize months with zeros
        const months: Record<string, MonthData> = {}
        MONTHS.forEach(month => {
            months[month] = { plan: 0, actual: 0 }
        })

        // Fill in data from program_progress
        const progressData = program.program_progress || []
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
                    evidence_url: p.evidence_url || undefined,
                    status: p.status || undefined,
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
            id: program.id,
            name: program.title,
            plan_type: program.plan_type || '',
            due_date: program.due_date,
            reference: program.reference_doc || undefined,
            months,
            progress
        }
    })
}

// ============================================================================
// Fetch Hook
// ============================================================================

interface UseHSEProgramsOptions {
    region?: string
    base?: string
    category?: 'otp' | 'audit' | 'training' | 'drill' | 'meeting'
    year?: number
    enabled?: boolean
}

export function useHSEPrograms({
    region = 'indonesia',
    base = 'all',
    category = 'otp',
    year = 2026,
    enabled = true
}: UseHSEProgramsOptions = {}) {
    const supabase = createClient()
    const queryClient = useQueryClient()

    // Determine program_type for query
    const programType: ProgramType = category === 'otp' ? 'otp' : `matrix_${category}` as ProgramType

    // Query for fetching programs
    const query = useQuery({
        queryKey: programKeys.list(region, base, category),
        queryFn: async (): Promise<ProgramsData> => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            let queryBuilder = (supabase as any)
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
            evidence_url,
            status
          )
        `)
                .eq('program_type', programType)
                .eq('region', region)

            // Filter by base if not 'all'
            if (base !== 'all') {
                queryBuilder = queryBuilder.or(`base.eq.${base},base.eq.all`)
            }

            const { data, error } = await queryBuilder

            if (error) {
                throw new Error(error.message)
            }

            return {
                year,
                programs: transformToNestedFormat(data || [], year),
                region,
                base,
                category
            }
        },
        enabled
    })

    // ============================================================================
    // Real-time Subscription
    // ============================================================================

    useEffect(() => {
        if (!enabled) return

        const channel = supabase
            .channel('program_progress_changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'program_progress'
                },
                () => {
                    // Invalidate queries when data changes
                    queryClient.invalidateQueries({ queryKey: programKeys.all })
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [supabase, queryClient, enabled])

    return query
}

// ============================================================================
// Mutation Hooks
// ============================================================================

/**
 * Update a specific month's progress for a program
 */
export function useUpdateProgramMonth() {
    const supabase = createClient()
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async ({ programId, month, year = 2026, data }: UpdateMonthParams) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { error } = await (supabase as any)
                .from('program_progress')
                .upsert(
                    {
                        program_id: programId,
                        month,
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
                        status: data.status || 'pending'
                    },
                    { onConflict: 'program_id,month,year' }
                )

            if (error) throw new Error(error.message)
        },
        onSuccess: () => {
            // Invalidate all program queries to refresh UI
            queryClient.invalidateQueries({ queryKey: programKeys.all })
        }
    })
}

/**
 * Create a new program
 */
export function useCreateProgram() {
    const supabase = createClient()
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (params: CreateProgramParams) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data, error } = await (supabase as any)
                .from('master_programs')
                .insert({
                    title: params.title,
                    program_type: params.program_type,
                    region: params.region || 'indonesia',
                    base: params.base || 'all',
                    plan_type: params.plan_type,
                    reference_doc: params.reference_doc,
                    due_date: params.due_date
                })
                .select()
                .single()

            if (error) throw new Error(error.message)
            return data
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: programKeys.all })
        }
    })
}

/**
 * Delete a program
 */
export function useDeleteProgram() {
    const supabase = createClient()
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (programId: number) => {
            const { error } = await supabase
                .from('master_programs')
                .delete()
                .eq('id', programId)

            if (error) throw new Error(error.message)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: programKeys.all })
        }
    })
}

// ============================================================================
// Calendar Events Hook
// ============================================================================

export function useCalendarEvents(year: number = 2026) {
    const supabase = createClient()

    return useQuery({
        queryKey: ['calendar', year],
        queryFn: async () => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data, error } = await (supabase as any)
                .rpc('get_calendar_events', { p_year: year })

            if (error) throw new Error(error.message)

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return (data || []).map((event: any) => ({
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
                plan_value: event.plan_value,
                actual_value: event.actual_value,
                status: event.status
            }))
        }
    })
}
