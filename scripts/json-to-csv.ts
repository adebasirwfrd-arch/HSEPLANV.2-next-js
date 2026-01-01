/**
 * JSON to CSV Converter for Supabase Import
 * Converts OTP, Matrix, KPI JSON files to CSV format
 */

import * as fs from 'fs'
import * as path from 'path'

const LIB_DIR = path.join(__dirname, '../lib')
const OUTPUT_DIR = path.join(__dirname, '../csv_export')

// Create output directory
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true })
}

// ============================================================
// 1. MASTER_PROGRAMS CSV (from OTP and Matrix data)
// ============================================================
interface Program {
    id: number
    name: string
    plan_type: string
    due_date: string | null
}

interface OTPData {
    year: number
    programs: Program[]
}

let programId = 1
const masterPrograms: string[] = ['id,name,program_type,region,base,plan_type,due_date']
const programProgress: string[] = ['program_id,month,year,plan_value,actual_value,status']

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']

function escapeCSV(value: string | null | undefined): string {
    if (!value) return ''
    const str = String(value)
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`
    }
    return str
}

// Process OTP files
const OTP_FILES = [
    { file: 'otp_indonesia_narogong.json', region: 'indonesia', base: 'narogong' },
    { file: 'otp_indonesia_duri.json', region: 'indonesia', base: 'duri' },
    { file: 'otp_indonesia_balikpapan.json', region: 'indonesia', base: 'balikpapan' },
    { file: 'otp_asia_data.json', region: 'asia', base: 'all' },
]

console.log('Converting OTP files...')
for (const { file, region, base } of OTP_FILES) {
    const filePath = path.join(LIB_DIR, file)
    if (!fs.existsSync(filePath)) continue

    const data: OTPData = JSON.parse(fs.readFileSync(filePath, 'utf8'))

    for (const program of data.programs) {
        // Add to master_programs
        masterPrograms.push([
            programId,
            escapeCSV(program.name),
            'otp',
            region,
            base,
            escapeCSV(program.plan_type),
            program.due_date || ''
        ].join(','))

        // Add progress rows
        const months = (program as any).months || {}
        for (const month of MONTHS) {
            const m = months[month] || { plan: 0, actual: 0 }
            const status = m.actual >= m.plan && m.plan > 0 ? 'completed' : 'pending'
            programProgress.push([
                programId,
                month,
                data.year,
                m.plan || 0,
                m.actual || 0,
                status
            ].join(','))
        }

        programId++
    }
}

// Process Matrix files
const MATRIX_TYPES = ['audit', 'training', 'drill', 'meeting']
const BASES = ['', '_narogong', '_duri', '_balikpapan']

console.log('Converting Matrix files...')
for (const type of MATRIX_TYPES) {
    for (const baseSuffix of BASES) {
        const fileName = `matrix_${type}_indonesia${baseSuffix}.json`
        const filePath = path.join(LIB_DIR, fileName)
        if (!fs.existsSync(filePath)) continue

        const base = baseSuffix.replace('_', '') || 'all'
        const data: OTPData = JSON.parse(fs.readFileSync(filePath, 'utf8'))

        for (const program of data.programs) {
            masterPrograms.push([
                programId,
                escapeCSV(program.name),
                `matrix_${type}`,
                'indonesia',
                base,
                escapeCSV(program.plan_type),
                program.due_date || ''
            ].join(','))

            const months = (program as any).months || {}
            for (const month of MONTHS) {
                const m = months[month] || { plan: 0, actual: 0 }
                const status = m.actual >= m.plan && m.plan > 0 ? 'completed' : 'pending'
                programProgress.push([
                    programId,
                    month,
                    data.year,
                    m.plan || 0,
                    m.actual || 0,
                    status
                ].join(','))
            }

            programId++
        }
    }
}

// Write master_programs.csv
fs.writeFileSync(
    path.join(OUTPUT_DIR, 'master_programs.csv'),
    masterPrograms.join('\n'),
    'utf8'
)
console.log(`✅ master_programs.csv: ${masterPrograms.length - 1} rows`)

// Write program_progress.csv
fs.writeFileSync(
    path.join(OUTPUT_DIR, 'program_progress.csv'),
    programProgress.join('\n'),
    'utf8'
)
console.log(`✅ program_progress.csv: ${programProgress.length - 1} rows`)

// ============================================================
// 2. HSE_KPI_YEARS and HSE_KPI_METRICS CSV
// ============================================================

const kpiFilePath = path.join(LIB_DIR, 'kpi_data.json')
if (fs.existsSync(kpiFilePath)) {
    console.log('Converting KPI data...')
    const kpiData = JSON.parse(fs.readFileSync(kpiFilePath, 'utf8'))

    const kpiYears: string[] = ['id,year,man_hours']
    const kpiMetrics: string[] = ['year_id,name,target,result,icon']

    const manHours = kpiData.man_hours || {}
    const kpiByYear = kpiData.kpi || {}

    let yearId = 1
    for (const year of Object.keys(manHours)) {
        kpiYears.push([yearId, year, manHours[year] || 0].join(','))

        const yearKpi = kpiByYear[year] || {}
        for (const [metric, values] of Object.entries(yearKpi) as [string, any][]) {
            const iconMap: Record<string, string> = {
                fatality: '💀',
                trir: '📊',
                pvir: '🚗',
                environment: '🌿',
                fire: '🔥',
                firstaid: '🩹',
                occupational: '👷'
            }
            kpiMetrics.push([
                yearId,
                escapeCSV(metric.toUpperCase()),
                values.target || 0,
                values.result || 0,
                iconMap[metric] || '📌'
            ].join(','))
        }
        yearId++
    }

    fs.writeFileSync(path.join(OUTPUT_DIR, 'hse_kpi_years.csv'), kpiYears.join('\n'), 'utf8')
    console.log(`✅ hse_kpi_years.csv: ${kpiYears.length - 1} rows`)

    fs.writeFileSync(path.join(OUTPUT_DIR, 'hse_kpi_metrics.csv'), kpiMetrics.join('\n'), 'utf8')
    console.log(`✅ hse_kpi_metrics.csv: ${kpiMetrics.length - 1} rows`)
}

// ============================================================
// 3. LL_INDICATOR CSV (if needed separately)
// ============================================================

const llFilePath = path.join(LIB_DIR, 'll_indicator.json')
if (fs.existsSync(llFilePath)) {
    console.log('Converting LL Indicator data...')
    const llData = JSON.parse(fs.readFileSync(llFilePath, 'utf8'))

    const llRows: string[] = ['year,indicator_name,category,value,unit']

    for (const [year, indicators] of Object.entries(llData) as [string, any][]) {
        for (const [name, value] of Object.entries(indicators)) {
            llRows.push([year, escapeCSV(name), 'leading', value || 0, 'count'].join(','))
        }
    }

    fs.writeFileSync(path.join(OUTPUT_DIR, 'll_indicator.csv'), llRows.join('\n'), 'utf8')
    console.log(`✅ ll_indicator.csv: ${llRows.length - 1} rows`)
}

console.log('\n📁 All CSV files saved to:', OUTPUT_DIR)
