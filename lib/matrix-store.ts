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

// Calculate progress for a program
export function calculateProgress(program: MatrixProgram): number {
    let totalPlan = 0
    let totalActual = 0
    months.forEach(m => {
        const monthData = program.months[m] || { plan: 0, actual: 0 }
        totalPlan += monthData.plan
        totalActual += monthData.actual
    })
    return totalPlan > 0 ? Math.round((totalActual / totalPlan) * 100) : 0
}

// Get data based on category and base
export function getMatrixData(category: MatrixCategory, base: string): MatrixData {
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
