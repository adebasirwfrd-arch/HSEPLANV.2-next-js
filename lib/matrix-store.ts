// Matrix Store - State management for Matrix screen with localStorage persistence
import matrixAuditAll from "./matrix_audit_indonesia.json"
import matrixAuditNarogong from "./matrix_audit_indonesia_narogong.json"
import matrixAuditDuri from "./matrix_audit_indonesia_duri.json"
import matrixAuditBalikpapan from "./matrix_audit_indonesia_balikpapan.json"

import matrixTrainingAll from "./matrix_training_indonesia.json"
import matrixTrainingNarogong from "./matrix_training_indonesia_narogong.json"
import matrixTrainingDuri from "./matrix_training_indonesia_duri.json"
import matrixTrainingBalikpapan from "./matrix_training_indonesia_balikpapan.json"

import matrixDrillAll from "./matrix_drill_indonesia.json"
import matrixDrillNarogong from "./matrix_drill_indonesia_narogong.json"
import matrixDrillDuri from "./matrix_drill_indonesia_duri.json"
import matrixDrillBalikpapan from "./matrix_drill_indonesia_balikpapan.json"

import matrixMeetingAll from "./matrix_meeting_indonesia.json"
import matrixMeetingNarogong from "./matrix_meeting_indonesia_narogong.json"
import matrixMeetingDuri from "./matrix_meeting_indonesia_duri.json"
import matrixMeetingBalikpapan from "./matrix_meeting_indonesia_balikpapan.json"

const months = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"]
const monthLabels = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"]

export interface MatrixMonthData {
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

export interface MatrixProgram {
    id: number
    name: string
    reference?: string
    plan_type: string
    months: Record<string, MatrixMonthData>
    progress?: number
}

export interface MatrixData {
    year: number
    category: string
    region: string
    programs: MatrixProgram[]
}

export type MatrixCategory = "audit" | "training" | "drill" | "meeting"

// Calculate progress for a program - CAPPED AT 100%
export function calculateProgress(program: MatrixProgram): number {
    let totalPlan = 0
    let totalActual = 0
    months.forEach(m => {
        const monthData = program.months[m] || { plan: 0, actual: 0 }
        totalPlan += monthData.plan
        totalActual += monthData.actual
    })
    // Cap at 100% - if actual >= plan, program is 100% complete
    return totalPlan > 0 ? Math.min(100, Math.round((totalActual / totalPlan) * 100)) : 0
}

// Get data based on category and base
// PRIORITY: 1. localStorage (user-modified data) -> 2. Static JSON (defaults)
export function getMatrixData(category: MatrixCategory, base: string): MatrixData {
    // Try localStorage first for user-modified data
    if (typeof window !== 'undefined') {
        try {
            const stored = localStorage.getItem('hse-matrix-data')
            if (stored) {
                const allData = JSON.parse(stored)
                // Construct the key used in localStorage
                const dataKey = `${category}_${base}`
                if (allData[dataKey]) {
                    return allData[dataKey] as MatrixData
                }
            }
        } catch (e) {
            console.error('Error loading Matrix from localStorage:', e)
        }
    }

    // Fall back to static JSON files as defaults
    const dataMap: Record<MatrixCategory, Record<string, MatrixData>> = {
        audit: {
            all: matrixAuditAll as MatrixData,
            narogong: matrixAuditNarogong as MatrixData,
            duri: matrixAuditDuri as MatrixData,
            balikpapan: matrixAuditBalikpapan as MatrixData
        },
        training: {
            all: matrixTrainingAll as MatrixData,
            narogong: matrixTrainingNarogong as MatrixData,
            duri: matrixTrainingDuri as MatrixData,
            balikpapan: matrixTrainingBalikpapan as MatrixData
        },
        drill: {
            all: matrixDrillAll as MatrixData,
            narogong: matrixDrillNarogong as MatrixData,
            duri: matrixDrillDuri as MatrixData,
            balikpapan: matrixDrillBalikpapan as MatrixData
        },
        meeting: {
            all: matrixMeetingAll as MatrixData,
            narogong: matrixMeetingNarogong as MatrixData,
            duri: matrixMeetingDuri as MatrixData,
            balikpapan: matrixMeetingBalikpapan as MatrixData
        }
    }

    return dataMap[category][base] || dataMap[category].all
}

// LocalStorage key for persistence
const STORAGE_KEY = "hse-matrix-data"

// Load from localStorage if available
export function loadPersistedData(): Record<string, MatrixData> | null {
    if (typeof window === "undefined") return null
    try {
        const stored = localStorage.getItem(STORAGE_KEY)
        return stored ? JSON.parse(stored) : null
    } catch {
        return null
    }
}

// Save to localStorage
export function savePersistedData(data: Record<string, MatrixData>): void {
    if (typeof window === "undefined") return
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    } catch (e) {
        console.error("Failed to save Matrix data:", e)
    }
}

// Sync to calendar localStorage
export function syncToCalendar(allData: Record<string, MatrixData>): void {
    if (typeof window === "undefined") return
    const events: any[] = []

    Object.entries(allData).forEach(([key, data]) => {
        const [category, base] = key.includes("_") ? key.split("_") : [key, "all"]

        data.programs.forEach(prog => {
            Object.entries(prog.months).forEach(([month, monthData]) => {
                const planDate = monthData.plan_date || ""
                const implDate = monthData.impl_date || ""

                if (planDate || implDate) {
                    events.push({
                        id: prog.id,
                        source: "matrix",
                        category,
                        base,
                        program_name: prog.name,
                        month,
                        plan_date: planDate,
                        impl_date: implDate,
                        pic_name: monthData.pic_name || "",
                        plan_type: prog.plan_type || ""
                    })
                }
            })
        })
    })

    localStorage.setItem("hse-matrix-calendar", JSON.stringify(events))
    window.dispatchEvent(new Event("storage"))
}

// Generate CSV export
export function generateCSVExport(data: MatrixData, categoryLabel: string): string {
    let csv = "No,Program Name,Reference,Plan Type,"
    csv += monthLabels.map(m => `${m}_Plan,${m}_Actual,${m}_WPTS`).join(",")
    csv += ",Progress\n"

    data.programs.forEach((prog, idx) => {
        csv += `${idx + 1},"${prog.name.replace(/"/g, '""')}","${(prog.reference || "").replace(/"/g, '""')}","${prog.plan_type || ""}",`
        months.forEach(month => {
            const m = prog.months[month] || { plan: 0, actual: 0, wpts_id: "" }
            csv += `${m.plan},${m.actual},"${(m.wpts_id || "").replace(/"/g, '""')}",`
        })
        csv += `${calculateProgress(prog)}%\n`
    })

    return csv
}

// Download CSV file
export function downloadCSV(data: MatrixData, categoryLabel: string, base: string, year: number): void {
    const csv = generateCSVExport(data, categoryLabel)
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    const baseLabel = base === "all" ? "AllBases" : base.charAt(0).toUpperCase() + base.slice(1)
    link.download = `HSE_Matrix_${categoryLabel}_${baseLabel}_${year}.csv`
    link.click()
}

// Category labels
export const categoryLabels: Record<MatrixCategory, string> = {
    audit: "Audit",
    training: "Training",
    drill: "Emergency Drill",
    meeting: "Meeting"
}

// Category icons
export const categoryIcons: Record<MatrixCategory, string> = {
    audit: "📋",
    training: "📚",
    drill: "🚨",
    meeting: "🤝"
}

export { months, monthLabels }

// =====================================================
// SUPABASE SYNC - Auto-save Matrix data to cloud
// =====================================================
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null

// Sync a single program to Supabase
export async function syncProgramToSupabase(
    program: MatrixProgram,
    category: MatrixCategory,
    base: string
): Promise<boolean> {
    if (!supabase) {
        console.warn('Supabase not configured for Matrix sync')
        return false
    }

    try {
        // Generate unique ID for this program (category_base_localId)
        const supabaseId = 2000 + program.id +
            (category === 'audit' ? 0 : category === 'training' ? 63 : category === 'drill' ? 144 : 168) +
            (base === 'narogong' ? 0 : base === 'balikpapan' ? 21 : base === 'duri' ? 42 : 0)

        const { error } = await supabase
            .from('matrix_programs')
            .upsert({
                id: supabaseId,
                name: program.name,
                program_type: 'matrix',
                region: 'indonesia',
                base: base,
                category: category,
                plan_type: program.plan_type || '',
                reference_doc: program.reference || '',
                updated_at: new Date().toISOString()
            }, { onConflict: 'id' })

        if (error) {
            console.error('Error syncing Matrix program to Supabase:', error)
            return false
        }
        return true
    } catch (e) {
        console.error('Matrix Supabase sync error:', e)
        return false
    }
}

// Sync all Matrix data to Supabase
export async function syncAllMatrixToSupabase(allData: Record<string, MatrixData>): Promise<{
    success: number
    failed: number
}> {
    if (!supabase) {
        console.warn('Supabase not configured for Matrix sync')
        return { success: 0, failed: 0 }
    }

    let success = 0
    let failed = 0

    for (const [key, data] of Object.entries(allData)) {
        const [category, base] = key.includes('_') ? key.split('_') : [key, 'all']

        for (const program of data.programs) {
            const result = await syncProgramToSupabase(
                program,
                category as MatrixCategory,
                base
            )
            if (result) success++
            else failed++
        }
    }

    console.log(`Matrix Supabase sync: ${success} succeeded, ${failed} failed`)
    return { success, failed }
}

// Load Matrix programs from Supabase
export async function loadMatrixFromSupabase(
    category: MatrixCategory,
    base: string
): Promise<MatrixProgram[] | null> {
    if (!supabase) return null

    try {
        let query = supabase
            .from('matrix_programs')
            .select('*')
            .eq('category', category)

        if (base !== 'all') {
            query = query.eq('base', base)
        }

        const { data, error } = await query

        if (error) {
            console.error('Error loading Matrix from Supabase:', error)
            return null
        }

        // Convert Supabase format to local format
        return data?.map(row => ({
            id: row.id,
            name: row.name,
            reference: row.reference_doc || '',
            plan_type: row.plan_type || '',
            months: {}, // Monthly data is stored in localStorage
            progress: 0
        })) || null
    } catch (e) {
        console.error('Matrix Supabase load error:', e)
        return null
    }
}
