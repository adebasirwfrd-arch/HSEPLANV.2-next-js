// Export Report Utility - Generate multi-sheet Excel file with all HSE data
import * as XLSX from 'xlsx'
import { loadUnifiedPrograms, type UnifiedProgram } from './programs-store'
import { loadTasks, type Task } from './tasks-store'
import { getOTPData, type OTPProgram } from './otp-store'
import { getMatrixData, type MatrixProgram, type MatrixCategory } from './matrix-store'
import { loadDocuments, type RelatedDocument } from './docs-store'

const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']
const monthLabels = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']

// Programs sheet data
function getProgramsData(): Record<string, unknown>[] {
    const programs = loadUnifiedPrograms()
    return programs.map((p: UnifiedProgram) => ({
        'ID': p.id,
        'Name': p.name,
        'Description': p.description,
        'Source': p.source.toUpperCase(),
        'Region': p.region,
        'Base': p.base,
        'Category': p.category,
        'Status': p.status,
        'Plan Type': p.planType,
        'Progress': `${p.progress}%`,
        'Plan Date': p.planDate || '',
        'Implementation Date': p.implDate || '',
        'PIC Name': p.picName || '',
        'PIC Email': p.picEmail || '',
        'Start Date': p.startDate,
        'Target Date': p.targetDate,
        'Created': p.createdAt
    }))
}

// Tasks sheet data
function getTasksData(): Record<string, unknown>[] {
    const tasks = loadTasks()
    return tasks.map((t: Task) => ({
        'ID': t.id,
        'Code': t.code,
        'Title': t.title,
        'Program': t.programName,
        'Region': t.region,
        'Base': t.base,
        'Year': t.year,
        'Implementation Date': t.implementationDate,
        'Frequency': t.frequency,
        'PIC Name': t.picName,
        'PIC Email': t.picEmail,
        'Status': t.status,
        'Has Attachment': t.hasAttachment ? 'Yes' : 'No',
        'WPTS ID': t.wptsId || '',
        'Created': t.createdAt
    }))
}

// OTP sheet data - combines Indonesia and Asia
function getOTPSheetData(): Record<string, unknown>[] {
    const rows: Record<string, unknown>[] = []

    // Indonesia data
    const indonesiaData = getOTPData('indonesia', 'all')
    indonesiaData.programs.forEach((prog: OTPProgram) => {
        const row: Record<string, unknown> = {
            'Region': 'Indonesia',
            'ID': prog.id,
            'Program Name': prog.name,
            'Plan Type': prog.plan_type,
        }
        months.forEach((m, idx) => {
            const monthData = prog.months[m] || { plan: 0, actual: 0 }
            row[`${monthLabels[idx]}_Plan`] = monthData.plan
            row[`${monthLabels[idx]}_Actual`] = monthData.actual
            row[`${monthLabels[idx]}_WPTS`] = monthData.wpts_id || ''
        })
        rows.push(row)
    })

    // Asia data
    const asiaData = getOTPData('asia', 'all')
    asiaData.programs.forEach((prog: OTPProgram) => {
        const row: Record<string, unknown> = {
            'Region': 'Asia',
            'ID': prog.id,
            'Program Name': prog.name,
            'Plan Type': prog.plan_type,
        }
        months.forEach((m, idx) => {
            const monthData = prog.months[m] || { plan: 0, actual: 0 }
            row[`${monthLabels[idx]}_Plan`] = monthData.plan
            row[`${monthLabels[idx]}_Actual`] = monthData.actual
            row[`${monthLabels[idx]}_WPTS`] = monthData.wpts_id || ''
        })
        rows.push(row)
    })

    return rows
}

// Matrix sheet data - all categories
function getMatrixSheetData(): Record<string, unknown>[] {
    const rows: Record<string, unknown>[] = []
    const categories: MatrixCategory[] = ['audit', 'training', 'drill', 'meeting']

    categories.forEach(category => {
        const data = getMatrixData(category, 'all')
        data.programs.forEach((prog: MatrixProgram) => {
            const row: Record<string, unknown> = {
                'Category': category.charAt(0).toUpperCase() + category.slice(1),
                'ID': prog.id,
                'Program Name': prog.name,
                'Reference': prog.reference || '',
                'Plan Type': prog.plan_type,
            }
            months.forEach((m, idx) => {
                const monthData = prog.months[m] || { plan: 0, actual: 0 }
                row[`${monthLabels[idx]}_Plan`] = monthData.plan
                row[`${monthLabels[idx]}_Actual`] = monthData.actual
            })
            rows.push(row)
        })
    })

    return rows
}

// Statistics summary sheet
function getStatisticsData(): Record<string, unknown>[] {
    const programs = loadUnifiedPrograms()
    const tasks = loadTasks()

    // OTP stats
    const otpIndonesia = getOTPData('indonesia', 'all')
    const otpAsia = getOTPData('asia', 'all')

    let totalOTPPlan = 0, totalOTPActual = 0
        ;[...otpIndonesia.programs, ...otpAsia.programs].forEach(prog => {
            months.forEach(m => {
                const monthData = prog.months[m] || { plan: 0, actual: 0 }
                totalOTPPlan += monthData.plan
                totalOTPActual += monthData.actual
            })
        })

    // Matrix stats
    const categories: MatrixCategory[] = ['audit', 'training', 'drill', 'meeting']
    let totalMatrixPlan = 0, totalMatrixActual = 0
    categories.forEach(cat => {
        const data = getMatrixData(cat, 'all')
        data.programs.forEach(prog => {
            months.forEach(m => {
                const monthData = prog.months[m] || { plan: 0, actual: 0 }
                totalMatrixPlan += monthData.plan
                totalMatrixActual += monthData.actual
            })
        })
    })

    return [
        { 'Metric': 'Total Programs', 'Value': programs.length },
        { 'Metric': 'Total Tasks', 'Value': tasks.length },
        { 'Metric': 'OTP Programs (Indonesia)', 'Value': otpIndonesia.programs.length },
        { 'Metric': 'OTP Programs (Asia)', 'Value': otpAsia.programs.length },
        { 'Metric': 'OTP Total Plan', 'Value': totalOTPPlan },
        { 'Metric': 'OTP Total Actual', 'Value': totalOTPActual },
        { 'Metric': 'OTP Completion Rate', 'Value': totalOTPPlan > 0 ? `${Math.round((totalOTPActual / totalOTPPlan) * 100)}%` : '0%' },
        { 'Metric': 'Matrix Total Plan', 'Value': totalMatrixPlan },
        { 'Metric': 'Matrix Total Actual', 'Value': totalMatrixActual },
        { 'Metric': 'Matrix Completion Rate', 'Value': totalMatrixPlan > 0 ? `${Math.round((totalMatrixActual / totalMatrixPlan) * 100)}%` : '0%' },
        { 'Metric': 'Tasks Completed', 'Value': tasks.filter(t => t.status === 'Completed').length },
        { 'Metric': 'Tasks In Progress', 'Value': tasks.filter(t => t.status === 'In Progress').length },
        { 'Metric': 'Tasks Upcoming', 'Value': tasks.filter(t => t.status === 'Upcoming').length },
    ]
}

// KPI sheet data (derived from programs/tasks)
function getKPIData(): Record<string, unknown>[] {
    const programs = loadUnifiedPrograms()

    // Group by category
    const byCategory: Record<string, { total: number; completed: number }> = {}
    programs.forEach(p => {
        if (!byCategory[p.category]) {
            byCategory[p.category] = { total: 0, completed: 0 }
        }
        byCategory[p.category].total++
        if (p.status === 'Completed') byCategory[p.category].completed++
    })

    return Object.entries(byCategory).map(([category, stats]) => ({
        'Category': category,
        'Total Programs': stats.total,
        'Completed': stats.completed,
        'Completion Rate': stats.total > 0 ? `${Math.round((stats.completed / stats.total) * 100)}%` : '0%'
    }))
}

// LL Indicator data (derived from OTP/Matrix data for lagging/leading indicators)
function getLLData(): Record<string, unknown>[] {
    const otpData = getOTPData('indonesia', 'all')

    return otpData.programs.map(prog => {
        let totalPlan = 0, totalActual = 0
        months.forEach(m => {
            const monthData = prog.months[m] || { plan: 0, actual: 0 }
            totalPlan += monthData.plan
            totalActual += monthData.actual
        })

        const progress = totalPlan > 0 ? Math.round((totalActual / totalPlan) * 100) : 0
        const status = progress >= 100 ? 'On Track' : progress >= 75 ? 'At Risk' : 'Behind'

        return {
            'Program': prog.name,
            'Plan Type': prog.plan_type,
            'Total Plan': totalPlan,
            'Total Actual': totalActual,
            'Progress': `${progress}%`,
            'Status': status
        }
    })
}

// Documents sheet data
function getDocumentsData(): Record<string, unknown>[] {
    const docs = loadDocuments()
    return docs.map((d: RelatedDocument) => ({
        'ID': d.id,
        'Name': d.name,
        'Type': d.type,
        'WPTS ID': d.wptsId,
        'Size': d.size,
        'Has Attachment': d.attachment ? 'Yes' : 'No',
        'Drive URL': d.attachment?.driveUrl || '',
        'Created': d.createdAt
    }))
}

// Main export function - generates and downloads Excel file
export function downloadFullReport(): void {
    const workbook = XLSX.utils.book_new()

    // Add sheets in order
    const sheetsData: { name: string; data: Record<string, unknown>[] }[] = [
        { name: 'Programs', data: getProgramsData() },
        { name: 'Tasks', data: getTasksData() },
        { name: 'Statistics', data: getStatisticsData() },
        { name: 'LL Indicator', data: getLLData() },
        { name: 'KPI', data: getKPIData() },
        { name: 'OTP', data: getOTPSheetData() },
        { name: 'Matrix', data: getMatrixSheetData() },
        { name: 'Documents', data: getDocumentsData() },
    ]

    sheetsData.forEach(({ name, data }) => {
        if (data.length === 0) {
            // Add empty sheet with header
            data = [{ 'Note': 'No data available' }]
        }
        const worksheet = XLSX.utils.json_to_sheet(data)
        XLSX.utils.book_append_sheet(workbook, worksheet, name)
    })

    // Generate file with date
    const date = new Date().toISOString().split('T')[0]
    XLSX.writeFile(workbook, `HSE_Report_${date}.xlsx`)
}
