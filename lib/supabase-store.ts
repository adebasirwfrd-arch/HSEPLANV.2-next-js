/**
 * Supabase Data Store
 * Client-side utility for fetching and updating data via API routes
 * This replaces the JSON file-based stores with Supabase-backed data
 */

import type { ProgramType, Month } from '@/types/supabase'

// Frontend-compatible types (matching existing stores)
export interface MonthData {
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

export interface ProgramData {
    id: number
    name: string
    plan_type: string
    due_date: string | null
    reference?: string
    months: Record<string, MonthData>
    progress?: number
}

export interface DataResponse {
    year: number
    programs: ProgramData[]
    region?: string
    category?: string
}

export interface CalendarEvent {
    id: number
    source: 'otp' | 'matrix'
    category: string
    region: string
    base: string
    program_name: string
    month: string
    plan_date: string
    impl_date: string
    pic_name: string
    plan_type: string
    plan_value: number
    actual_value: number
    status: string
}

const MONTHS: Month[] = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']

/**
 * Fetch programs from Supabase
 */
export async function fetchPrograms(
    type: ProgramType,
    region: string = 'indonesia',
    base: string = 'all',
    year: number = 2026
): Promise<DataResponse> {
    const params = new URLSearchParams({
        type,
        region,
        base,
        year: year.toString()
    })

    const response = await fetch(`/api/programs?${params}`)

    if (!response.ok) {
        throw new Error(`Failed to fetch programs: ${response.statusText}`)
    }

    return response.json()
}

/**
 * Fetch OTP programs (convenience wrapper)
 */
export async function fetchOTPData(
    region: string = 'indonesia',
    base: string = 'all',
    year: number = 2026
): Promise<DataResponse> {
    return fetchPrograms('otp', region, base, year)
}

/**
 * Fetch Matrix programs by category
 */
export async function fetchMatrixData(
    category: 'audit' | 'training' | 'drill' | 'meeting',
    base: string = 'all',
    year: number = 2026
): Promise<DataResponse> {
    return fetchPrograms(`matrix_${category}` as ProgramType, 'indonesia', base, year)
}

/**
 * Update a specific month's progress for a program
 */
export async function updateProgramProgress(
    programId: number,
    month: Month,
    data: Partial<MonthData> & { year?: number }
): Promise<void> {
    const response = await fetch(`/api/programs/${programId}/progress`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            month,
            year: data.year || 2026,
            plan_value: data.plan,
            actual_value: data.actual,
            wpts_id: data.wpts_id,
            plan_date: data.plan_date,
            impl_date: data.impl_date,
            pic_name: data.pic_name,
            pic_email: data.pic_email,
            pic_manager: data.pic_manager,
            pic_manager_email: data.pic_manager_email
        })
    })

    if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update progress')
    }
}

/**
 * Bulk update all months for a program
 */
export async function updateAllProgress(
    programId: number,
    months: Record<string, MonthData>,
    year: number = 2026
): Promise<void> {
    const response = await fetch(`/api/programs/${programId}/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ year, months })
    })

    if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update progress')
    }
}

/**
 * Create a new program
 */
export async function createProgram(program: {
    title: string
    program_type: ProgramType
    region?: string
    base?: string
    plan_type?: string
    reference_doc?: string
    due_date?: string
}): Promise<{ id: number }> {
    const response = await fetch('/api/programs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(program)
    })

    if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create program')
    }

    return response.json()
}

/**
 * Delete a program
 */
export async function deleteProgram(programId: number): Promise<void> {
    const response = await fetch(`/api/programs/${programId}`, {
        method: 'DELETE'
    })

    if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete program')
    }
}

/**
 * Fetch calendar events
 */
export async function fetchCalendarEvents(year: number = 2026): Promise<CalendarEvent[]> {
    const response = await fetch(`/api/calendar?year=${year}`)

    if (!response.ok) {
        throw new Error(`Failed to fetch calendar: ${response.statusText}`)
    }

    return response.json()
}

/**
 * Calculate progress percentage for a program
 */
export function calculateProgress(months: Record<string, MonthData>): number {
    let totalPlan = 0
    let totalActual = 0

    MONTHS.forEach(m => {
        const data = months[m] || { plan: 0, actual: 0 }
        totalPlan += data.plan
        totalActual += data.actual
    })

    return totalPlan > 0 ? Math.round((totalActual / totalPlan) * 100) : 0
}

/**
 * Generate CSV export from program data
 */
export function generateCSVExport(data: DataResponse, label: string): string {
    const monthLabels = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']

    let csv = `No,Program Name,Plan Type,`
    csv += monthLabels.map(m => `${m}_Plan,${m}_Actual,${m}_WPTS`).join(',')
    csv += `,Progress\n`

    data.programs.forEach((prog, idx) => {
        csv += `${idx + 1},"${prog.name.replace(/"/g, '""')}","${prog.plan_type || ''}",`
        MONTHS.forEach(month => {
            const m = prog.months[month] || { plan: 0, actual: 0, wpts_id: '' }
            csv += `${m.plan},${m.actual},"${(m.wpts_id || '').replace(/"/g, '""')}",`
        })
        csv += `${prog.progress || calculateProgress(prog.months)}%\n`
    })

    return csv
}

/**
 * Download data as CSV file
 */
export function downloadCSV(data: DataResponse, label: string): void {
    const csv = generateCSVExport(data, label)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `HSE_${label}_${data.year}.csv`
    link.click()
}
