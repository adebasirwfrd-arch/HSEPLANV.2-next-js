// Programs Store - HSE Programs CRUD with OTP/Matrix integration and localStorage persistence

import { getOTPData, OTPProgram, calculateProgress as calcOTPProgress } from './otp-store'
import { getMatrixData, MatrixProgram, MatrixCategory, calculateProgress as calcMatrixProgress } from './matrix-store'

export type ProgramSource = 'otp' | 'matrix' | 'manual'
export type ProgramRegion = 'indonesia' | 'asia'
export type ProgramBase = 'all' | 'narogong' | 'balikpapan' | 'duri'
export type ProgramCategory = 'hse-training' | 'emergency-drill' | 'observation-card' | 'safety-meeting' | 'inspection' | 'audit' | 'training' | 'drill' | 'meeting' | 'other'
export type ProgramStatus = 'Upcoming' | 'InProgress' | 'Completed' | 'OnHold' | 'Canceled'

export interface UnifiedProgram {
    id: string
    name: string
    description: string
    source: ProgramSource
    region: ProgramRegion
    base: ProgramBase
    category: ProgramCategory
    status: ProgramStatus
    planType: string
    reference?: string
    progress: number
    planDate?: string
    implDate?: string
    picName?: string
    picEmail?: string
    startDate: string
    targetDate: string
    endDate: string
    assignedTo: string
    createdAt: string
}

// Legacy interface for backwards compatibility
export interface Program {
    id: string
    name: string
    description: string
    category: ProgramCategory
    status: ProgramStatus
    startDate: string
    targetDate: string
    endDate: string
    assignedTo: string
    picEmail: string
    picManagerEmail?: string
    createdAt: string
}

const STORAGE_KEY = 'hse-programs-data'

// Category labels
export const categoryLabels: Record<string, string> = {
    'hse-training': 'HSE Training',
    'emergency-drill': 'Emergency Drill',
    'observation-card': 'Observation Card (RADAR)',
    'safety-meeting': 'Safety Meeting',
    'inspection': 'Inspection',
    'audit': 'Audit',
    'training': 'Training',
    'drill': 'Drill',
    'meeting': 'Meeting',
    'other': 'Other'
}

// Category icons
export const categoryIcons: Record<string, string> = {
    'hse-training': '📚',
    'emergency-drill': '🚨',
    'observation-card': '📋',
    'safety-meeting': '🤝',
    'inspection': '🔍',
    'audit': '📋',
    'training': '📚',
    'drill': '🚨',
    'meeting': '🤝',
    'other': '📦'
}

// Status colors
export const statusColors: Record<ProgramStatus, string> = {
    'Upcoming': 'bg-[var(--warning-color)] text-black',
    'InProgress': 'bg-[var(--success-color)] text-white',
    'Completed': 'bg-[#4A90D9] text-white',
    'OnHold': 'bg-[#9B59B6] text-white',
    'Canceled': 'bg-[var(--text-muted)] text-white'
}

// Source colors
export const sourceColors: Record<ProgramSource, string> = {
    'otp': 'bg-[#3498db] text-white',
    'matrix': 'bg-[#9b59b6] text-white',
    'manual': 'bg-[#27ae60] text-white'
}

// Convert OTP program to unified format
function otpToUnified(prog: OTPProgram, region: ProgramRegion, base: ProgramBase): UnifiedProgram {
    const progress = calcOTPProgress(prog)
    const status: ProgramStatus = progress >= 100 ? 'Completed' : progress > 0 ? 'InProgress' : 'Upcoming'

    // Find first month with plan_date or impl_date
    let planDate = ''
    let implDate = ''
    let picName = ''
    let picEmail = ''

    const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']
    for (const m of months) {
        const md = prog.months[m]
        if (md) {
            if (!planDate && md.plan_date) planDate = md.plan_date
            if (!implDate && md.impl_date) implDate = md.impl_date
            if (!picName && md.pic_name) picName = md.pic_name
            if (!picEmail && md.pic_email) picEmail = md.pic_email
        }
    }

    return {
        id: `otp_${region}_${base}_${prog.id}`,
        name: prog.name,
        description: prog.plan_type || '',
        source: 'otp',
        region,
        base,
        category: 'other',
        status,
        planType: prog.plan_type || '',
        progress,
        planDate,
        implDate,
        picName,
        picEmail,
        startDate: planDate || '',
        targetDate: prog.due_date || '',
        endDate: implDate || '',
        assignedTo: picName || 'HSE Team',
        createdAt: '2024-01-01'
    }
}

// Convert Matrix program to unified format
function matrixToUnified(prog: MatrixProgram, category: MatrixCategory, base: ProgramBase): UnifiedProgram {
    const progress = calcMatrixProgress(prog)
    const status: ProgramStatus = progress >= 100 ? 'Completed' : progress > 0 ? 'InProgress' : 'Upcoming'

    // Find first month with plan_date or impl_date
    let planDate = ''
    let implDate = ''
    let picName = ''
    let picEmail = ''

    const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']
    for (const m of months) {
        const md = prog.months[m]
        if (md) {
            if (!planDate && md.plan_date) planDate = md.plan_date
            if (!implDate && md.impl_date) implDate = md.impl_date
            if (!picName && md.pic_name) picName = md.pic_name
            if (!picEmail && md.pic_email) picEmail = md.pic_email
        }
    }

    return {
        id: `matrix_${category}_${base}_${prog.id}`,
        name: prog.name,
        description: prog.reference || prog.plan_type || '',
        source: 'matrix',
        region: 'indonesia',
        base,
        category: category as ProgramCategory,
        status,
        planType: prog.plan_type || '',
        reference: prog.reference,
        progress,
        planDate,
        implDate,
        picName,
        picEmail,
        startDate: planDate || '',
        targetDate: '',
        endDate: implDate || '',
        assignedTo: picName || 'HSE Team',
        createdAt: '2024-01-01'
    }
}

// Load all unified programs from OTP and Matrix
export function loadUnifiedPrograms(): UnifiedProgram[] {
    const programs: UnifiedProgram[] = []

    // Load OTP Indonesia - Narogong
    try {
        const otpNarogong = getOTPData('indonesia', 'narogong')
        otpNarogong.programs.forEach(prog => {
            programs.push(otpToUnified(prog, 'indonesia', 'narogong'))
        })
    } catch (e) { console.error('Error loading OTP Narogong:', e) }

    // Load OTP Indonesia - Balikpapan
    try {
        const otpBalikpapan = getOTPData('indonesia', 'balikpapan')
        otpBalikpapan.programs.forEach(prog => {
            programs.push(otpToUnified(prog, 'indonesia', 'balikpapan'))
        })
    } catch (e) { console.error('Error loading OTP Balikpapan:', e) }

    // Load OTP Indonesia - Duri
    try {
        const otpDuri = getOTPData('indonesia', 'duri')
        otpDuri.programs.forEach(prog => {
            programs.push(otpToUnified(prog, 'indonesia', 'duri'))
        })
    } catch (e) { console.error('Error loading OTP Duri:', e) }

    // Load OTP Asia
    try {
        const otpAsia = getOTPData('asia', '')
        otpAsia.programs.forEach(prog => {
            programs.push(otpToUnified(prog, 'asia', 'all'))
        })
    } catch (e) { console.error('Error loading OTP Asia:', e) }

    // Load Matrix programs for each category and base
    const matrixCategories: MatrixCategory[] = ['audit', 'training', 'drill', 'meeting']
    const matrixBases: ProgramBase[] = ['narogong', 'balikpapan', 'duri']

    matrixCategories.forEach(category => {
        matrixBases.forEach(base => {
            try {
                const matrixData = getMatrixData(category, base)
                matrixData.programs.forEach(prog => {
                    programs.push(matrixToUnified(prog, category, base))
                })
            } catch (e) { console.error(`Error loading Matrix ${category} ${base}:`, e) }
        })
    })

    return programs
}

// Update a unified program and sync back to OTP/Matrix localStorage
export interface ProgramUpdate {
    wptsId?: string
    planDate?: string
    implDate?: string
    picName?: string
    picEmail?: string
    month?: string // Which month to update (jan, feb, mar, etc.)
}

export function updateUnifiedProgram(programId: string, update: ProgramUpdate): boolean {
    if (typeof window === 'undefined') return false

    // Parse program ID to determine source
    // Format: otp_region_base_id or matrix_category_base_id
    const parts = programId.split('_')
    if (parts.length < 4) return false

    const source = parts[0] // 'otp' or 'matrix'

    if (source === 'otp') {
        return updateOTPProgram(programId, update)
    } else if (source === 'matrix') {
        return updateMatrixProgram(programId, update)
    }

    return false
}

// Update OTP program in localStorage
function updateOTPProgram(programId: string, update: ProgramUpdate): boolean {
    try {
        const parts = programId.split('_')
        const region = parts[1] as ProgramRegion
        const base = parts[2] as ProgramBase
        const origId = parseInt(parts[3])

        // Get storage key for this region/base
        const storageKey = 'hse-otp-data'
        const stored = localStorage.getItem(storageKey)
        const allData = stored ? JSON.parse(stored) : {}

        // Determine data key
        let dataKey = region === 'asia' ? 'asia' : `indonesia_${base}`

        // Get or initialize data for this region/base
        if (!allData[dataKey]) {
            const defaultData = getOTPData(region, base)
            allData[dataKey] = defaultData
        }

        // Find and update the program
        const programs = allData[dataKey].programs || []
        const progIndex = programs.findIndex((p: OTPProgram) => p.id === origId)

        if (progIndex === -1) return false

        // Determine which month to update (use provided or derive from planDate)
        let targetMonth = update.month
        if (!targetMonth && update.planDate) {
            const date = new Date(update.planDate)
            const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']
            targetMonth = monthNames[date.getMonth()]
        }
        if (!targetMonth && update.implDate) {
            const date = new Date(update.implDate)
            const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']
            targetMonth = monthNames[date.getMonth()]
        }

        if (!targetMonth) targetMonth = 'jan' // Default to January if no month specified

        // Initialize month data if not exists
        if (!programs[progIndex].months[targetMonth]) {
            programs[progIndex].months[targetMonth] = { plan: 0, actual: 0 }
        }

        // Apply updates to the target month
        const monthData = programs[progIndex].months[targetMonth]
        if (update.wptsId !== undefined) monthData.wpts_id = update.wptsId
        if (update.planDate !== undefined) monthData.plan_date = update.planDate
        if (update.implDate !== undefined) {
            monthData.impl_date = update.implDate
            // If implementation date is set, mark as actual = 1
            if (update.implDate) {
                monthData.actual = monthData.plan || 1
            }
        }
        if (update.picName !== undefined) monthData.pic_name = update.picName
        if (update.picEmail !== undefined) monthData.pic_email = update.picEmail

        // Save back to localStorage
        localStorage.setItem(storageKey, JSON.stringify(allData))

        // Trigger storage event to refresh OTP screen
        window.dispatchEvent(new Event('storage'))

        console.log(`[SYNC] Updated OTP program ${programId} in month ${targetMonth}`)
        return true
    } catch (e) {
        console.error('Error updating OTP program:', e)
        return false
    }
}

// Update Matrix program in localStorage
function updateMatrixProgram(programId: string, update: ProgramUpdate): boolean {
    try {
        const parts = programId.split('_')
        const category = parts[1] as MatrixCategory
        const base = parts[2] as ProgramBase
        const origId = parseInt(parts[3])

        const storageKey = 'hse-matrix-data'
        const stored = localStorage.getItem(storageKey)
        const allData = stored ? JSON.parse(stored) : {}

        // Data key for matrix
        const dataKey = `${category}_${base}`

        // Get or initialize data
        if (!allData[dataKey]) {
            const defaultData = getMatrixData(category, base)
            allData[dataKey] = defaultData
        }

        // Find and update the program
        const programs = allData[dataKey].programs || []
        const progIndex = programs.findIndex((p: MatrixProgram) => p.id === origId)

        if (progIndex === -1) return false

        // Determine which month to update
        let targetMonth = update.month
        if (!targetMonth && update.planDate) {
            const date = new Date(update.planDate)
            const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']
            targetMonth = monthNames[date.getMonth()]
        }
        if (!targetMonth && update.implDate) {
            const date = new Date(update.implDate)
            const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']
            targetMonth = monthNames[date.getMonth()]
        }

        if (!targetMonth) targetMonth = 'jan'

        // Initialize month data if not exists
        if (!programs[progIndex].months[targetMonth]) {
            programs[progIndex].months[targetMonth] = { plan: 0, actual: 0 }
        }

        // Apply updates
        const monthData = programs[progIndex].months[targetMonth]
        if (update.wptsId !== undefined) monthData.wpts_id = update.wptsId
        if (update.planDate !== undefined) monthData.plan_date = update.planDate
        if (update.implDate !== undefined) {
            monthData.impl_date = update.implDate
            if (update.implDate) {
                monthData.actual = monthData.plan || 1
            }
        }
        if (update.picName !== undefined) monthData.pic_name = update.picName
        if (update.picEmail !== undefined) monthData.pic_email = update.picEmail

        // Save back
        localStorage.setItem(storageKey, JSON.stringify(allData))

        // Trigger storage event to refresh Matrix screen
        window.dispatchEvent(new Event('storage'))

        console.log(`[SYNC] Updated Matrix program ${programId} in month ${targetMonth}`)
        return true
    } catch (e) {
        console.error('Error updating Matrix program:', e)
        return false
    }
}

// Filter unified programs
export interface ProgramFilters {
    region?: ProgramRegion | 'all'
    base?: ProgramBase | 'all'
    source?: ProgramSource | 'all'
    status?: ProgramStatus | 'all'
    search?: string
}

export function filterPrograms(programs: UnifiedProgram[], filters: ProgramFilters): UnifiedProgram[] {
    return programs.filter(p => {
        if (filters.region && filters.region !== 'all' && p.region !== filters.region) return false
        if (filters.base && filters.base !== 'all' && p.base !== filters.base) return false
        if (filters.source && filters.source !== 'all' && p.source !== filters.source) return false
        if (filters.status && filters.status !== 'all' && p.status !== filters.status) return false
        if (filters.search) {
            const search = filters.search.toLowerCase()
            if (!p.name.toLowerCase().includes(search) &&
                !p.description.toLowerCase().includes(search) &&
                !(p.picName || '').toLowerCase().includes(search)) {
                return false
            }
        }
        return true
    })
}

// Calculate stats from programs
export function calculateProgramStats(programs: UnifiedProgram[]) {
    const total = programs.length
    const completed = programs.filter(p => p.status === 'Completed').length
    const inProgress = programs.filter(p => p.status === 'InProgress').length
    const upcoming = programs.filter(p => p.status === 'Upcoming').length
    const otpCount = programs.filter(p => p.source === 'otp').length
    const matrixCount = programs.filter(p => p.source === 'matrix').length
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0

    return { total, completed, inProgress, upcoming, otpCount, matrixCount, completionRate }
}

// Generate CSV for unified programs
export function generateUnifiedCSV(programs: UnifiedProgram[]): string {
    let csv = 'ID,Name,Description,Source,Region,Base,Category,Status,Plan Type,Reference,Progress,Plan Date,Impl Date,PIC Name,PIC Email\n'
    programs.forEach(p => {
        csv += `"${p.id}","${p.name.replace(/"/g, '""')}","${(p.description || '').replace(/"/g, '""')}","${p.source}","${p.region}","${p.base}","${p.category}","${p.status}","${p.planType}","${p.reference || ''}","${p.progress}%","${p.planDate || ''}","${p.implDate || ''}","${p.picName || ''}","${p.picEmail || ''}"\n`
    })
    return csv
}

// Download unified CSV
export function downloadUnifiedCSV(programs: UnifiedProgram[], filters: ProgramFilters): void {
    const csv = generateUnifiedCSV(programs)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    const filterLabel = [
        filters.region !== 'all' ? filters.region : '',
        filters.base !== 'all' ? filters.base : '',
        filters.source !== 'all' ? filters.source?.toUpperCase() : ''
    ].filter(Boolean).join('_') || 'All'
    link.download = `HSE_Programs_${filterLabel}_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
}

// ===== Legacy functions for backwards compatibility =====

// Default programs
const defaultPrograms: Program[] = [
    {
        id: '1',
        name: 'HSE Training Q1',
        description: 'Quarterly HSE Training Program for all staff',
        category: 'hse-training',
        status: 'Completed',
        startDate: '2024-01-15',
        targetDate: '2024-03-01',
        endDate: '2024-03-15',
        assignedTo: 'HSE Team',
        picEmail: 'hse@company.com',
        createdAt: '2024-01-01'
    }
]

// Load programs from localStorage
export function loadPrograms(): Program[] {
    if (typeof window === 'undefined') return defaultPrograms
    try {
        const stored = localStorage.getItem(STORAGE_KEY)
        return stored ? JSON.parse(stored) : defaultPrograms
    } catch {
        return defaultPrograms
    }
}

// Save programs to localStorage
export function savePrograms(programs: Program[]): void {
    if (typeof window === 'undefined') return
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(programs))
        syncToCalendar(programs)
    } catch (e) {
        console.error('Failed to save programs:', e)
    }
}

// Add program
export function addProgram(program: Omit<Program, 'id' | 'createdAt'>): Program {
    const programs = loadPrograms()
    const newProgram: Program = {
        ...program,
        id: `prog_${Date.now()}`,
        createdAt: new Date().toISOString().split('T')[0]
    }
    programs.push(newProgram)
    savePrograms(programs)
    return newProgram
}

// Update program
export function updateProgram(id: string, updates: Partial<Program>): Program | null {
    const programs = loadPrograms()
    const index = programs.findIndex(p => p.id === id)
    if (index === -1) return null
    programs[index] = { ...programs[index], ...updates }
    savePrograms(programs)
    return programs[index]
}

// Delete program
export function deleteProgram(id: string): boolean {
    const programs = loadPrograms()
    const filtered = programs.filter(p => p.id !== id)
    if (filtered.length === programs.length) return false
    savePrograms(filtered)
    return true
}

// Get program by ID
export function getProgram(id: string): Program | null {
    const programs = loadPrograms()
    return programs.find(p => p.id === id) || null
}

// Sync to calendar localStorage
function syncToCalendar(programs: Program[]): void {
    if (typeof window === 'undefined') return
    const events = programs.map(p => ({
        id: p.id,
        source: 'program',
        name: p.name,
        category: p.category,
        status: p.status,
        startDate: p.startDate,
        targetDate: p.targetDate,
        endDate: p.endDate
    }))
    localStorage.setItem('hse-programs-calendar', JSON.stringify(events))
    window.dispatchEvent(new Event('storage'))
}

// Generate CSV
export function generateProgramsCSV(programs: Program[]): string {
    let csv = 'ID,Name,Description,Category,Status,Start Date,Target Date,End Date,Assigned To,PIC Email\n'
    programs.forEach(p => {
        csv += `"${p.id}","${p.name}","${p.description}","${categoryLabels[p.category] || p.category}","${p.status}","${p.startDate}","${p.targetDate}","${p.endDate}","${p.assignedTo}","${p.picEmail}"\n`
    })
    return csv
}

// Download CSV
export function downloadProgramsCSV(programs: Program[]): void {
    const csv = generateProgramsCSV(programs)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `HSE_Programs_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
}
