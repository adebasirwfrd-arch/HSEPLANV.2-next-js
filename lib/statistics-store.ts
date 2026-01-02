// Statistics Store - Comprehensive analytics for OTP and Matrix programs
// Reads directly from OTP and Matrix data to aggregate monthly plan/actual counts

import { getOTPData, OTPProgram, OTPData, loadPersistedData as loadOTPPersisted } from './otp-store'
import { getMatrixData, MatrixProgram, MatrixData, MatrixCategory, loadPersistedData as loadMatrixPersisted } from './matrix-store'

const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']
const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export interface MonthlyStats {
    month: string
    label: string
    planned: number
    completed: number
    completionRate: number
    overdue: number
}

export interface CategoryStats {
    category: string
    label: string
    total: number
    completed: number
    inProgress: number
    upcoming: number
    completionRate: number
    color: string
}

export interface OverallStats {
    total: number
    completed: number
    inProgress: number
    upcoming: number
    overdue: number
    completionRate: number
    otpCount: number
    otpCompleted: number
    matrixCount: number
    matrixCompleted: number
}

export interface TrendData {
    label: string
    value: number
    previousValue?: number
    change?: number
}

export interface PeriodStats {
    period: string
    planned: number
    completed: number
    completionRate: number
}

export interface AllProgramData {
    otpPrograms: { program: OTPProgram; region: string; base: string }[]
    matrixPrograms: { program: MatrixProgram; category: string; base: string }[]
}

// Load all OTP and Matrix program data
export function loadAllProgramData(): AllProgramData {
    const otpPrograms: AllProgramData['otpPrograms'] = []
    const matrixPrograms: AllProgramData['matrixPrograms'] = []

    // Check for persisted OTP data first
    const persistedOTP = typeof window !== 'undefined' ? loadOTPPersisted() : null

    // Load OTP Indonesia - all 3 bases
    const bases = ['narogong', 'balikpapan', 'duri'] as const
    bases.forEach(base => {
        try {
            let data: OTPData
            if (persistedOTP && persistedOTP[`indonesia_${base}`]) {
                data = persistedOTP[`indonesia_${base}`]
            } else {
                data = getOTPData('indonesia', base)
            }
            data.programs.forEach(prog => {
                otpPrograms.push({ program: prog, region: 'indonesia', base })
            })
        } catch (e) { console.error(`Error loading OTP ${base}:`, e) }
    })

    // Load OTP Asia
    try {
        let asiaData: OTPData
        if (persistedOTP && persistedOTP['asia']) {
            asiaData = persistedOTP['asia']
        } else {
            asiaData = getOTPData('asia', '')
        }
        asiaData.programs.forEach(prog => {
            otpPrograms.push({ program: prog, region: 'asia', base: 'all' })
        })
    } catch (e) { console.error('Error loading OTP Asia:', e) }

    // Check for persisted Matrix data
    const persistedMatrix = typeof window !== 'undefined' ? loadMatrixPersisted() : null

    // Load Matrix - all categories × all bases
    const categories: MatrixCategory[] = ['audit', 'training', 'drill', 'meeting']
    categories.forEach(category => {
        bases.forEach(base => {
            try {
                let data: MatrixData
                const key = `${category}_${base}`
                if (persistedMatrix && persistedMatrix[key]) {
                    data = persistedMatrix[key]
                } else {
                    data = getMatrixData(category, base)
                }
                data.programs.forEach(prog => {
                    matrixPrograms.push({ program: prog, category, base })
                })
            } catch (e) { console.error(`Error loading Matrix ${category} ${base}:`, e) }
        })
    })

    return { otpPrograms, matrixPrograms }
}

// Calculate monthly stats - COUNT PROGRAMS, not sum of plan/actual values
export function calculateMonthlyStats(data: AllProgramData): MonthlyStats[] {
    return months.map((month, idx) => {
        let planned = 0
        let completed = 0

        // Count OTP programs with activity in this month
        data.otpPrograms.forEach(({ program }) => {
            const monthData = program.months[month]
            if (monthData && (monthData.plan || 0) > 0) {
                planned++
                if ((monthData.actual || 0) >= (monthData.plan || 0)) {
                    completed++
                }
            }
        })

        // Count Matrix programs with activity in this month
        data.matrixPrograms.forEach(({ program }) => {
            const monthData = program.months[month]
            if (monthData && (monthData.plan || 0) > 0) {
                planned++
                if ((monthData.actual || 0) >= (monthData.plan || 0)) {
                    completed++
                }
            }
        })

        // Overdue: planned > completed for past months
        const today = new Date()
        const currentMonth = today.getMonth()
        const overdue = idx < currentMonth ? Math.max(0, planned - completed) : 0

        return {
            month,
            label: monthLabels[idx],
            planned,
            completed,
            completionRate: planned > 0 ? Math.min(100, Math.round((completed / planned) * 100)) : 0,
            overdue
        }
    })
}

// Calculate overall stats - COUNT PROGRAMS, not sum of plan/actual values
export function calculateOverallStats(data: AllProgramData): OverallStats {
    // Count unique programs
    const otpProgramCount = data.otpPrograms.length
    const matrixProgramCount = data.matrixPrograms.length
    const totalPrograms = otpProgramCount + matrixProgramCount

    // Calculate completion status for each program based on progress
    // Progress = sum(actual) / sum(plan) * 100 for all months
    const calculateProgramProgress = (months: Record<string, { plan?: number; actual?: number }>) => {
        let totalPlan = 0
        let totalActual = 0
        Object.values(months).forEach(m => {
            if (m) {
                totalPlan += m.plan || 0
                totalActual += m.actual || 0
            }
        })
        return totalPlan > 0 ? Math.round((totalActual / totalPlan) * 100) : 0
    }

    // OTP stats
    let otpCompleted = 0
    let otpInProgress = 0
    data.otpPrograms.forEach(({ program }) => {
        const progress = calculateProgramProgress(program.months)
        if (progress >= 100) otpCompleted++
        else if (progress > 0) otpInProgress++
    })

    // Matrix stats
    let matrixCompleted = 0
    let matrixInProgress = 0
    data.matrixPrograms.forEach(({ program }) => {
        const progress = calculateProgramProgress(program.months)
        if (progress >= 100) matrixCompleted++
        else if (progress > 0) matrixInProgress++
    })

    const totalCompleted = otpCompleted + matrixCompleted
    const totalInProgress = otpInProgress + matrixInProgress
    const totalUpcoming = totalPrograms - totalCompleted - totalInProgress

    // Calculate overdue (programs that are in progress or upcoming past their due date)
    const today = new Date()
    let overdue = 0

    // For OTP programs
    data.otpPrograms.forEach(({ program }) => {
        const progress = calculateProgramProgress(program.months)
        if (progress < 100 && program.due_date) {
            const dueDate = new Date(program.due_date)
            if (dueDate < today) overdue++
        }
    })

    // For Matrix programs  
    data.matrixPrograms.forEach(({ program }) => {
        const progress = calculateProgramProgress(program.months)
        const dueDate = (program as any).due_date
        if (progress < 100 && dueDate) {
            if (new Date(dueDate) < today) overdue++
        }
    })

    return {
        total: totalPrograms,
        completed: totalCompleted,
        inProgress: totalInProgress,
        upcoming: totalUpcoming,
        overdue,
        completionRate: totalPrograms > 0 ? Math.min(100, Math.round((totalCompleted / totalPrograms) * 100)) : 0,
        otpCount: otpProgramCount,
        otpCompleted,
        matrixCount: matrixProgramCount,
        matrixCompleted
    }
}

// Calculate quarterly statistics
export function calculateQuarterlyStats(data: AllProgramData): PeriodStats[] {
    const quarters = [
        { label: 'Q1', months: ['jan', 'feb', 'mar'] },
        { label: 'Q2', months: ['apr', 'may', 'jun'] },
        { label: 'Q3', months: ['jul', 'aug', 'sep'] },
        { label: 'Q4', months: ['oct', 'nov', 'dec'] }
    ]

    return quarters.map(q => {
        let planned = 0
        let completed = 0

        q.months.forEach(m => {
            data.otpPrograms.forEach(({ program }) => {
                const md = program.months[m]
                if (md) {
                    planned += md.plan || 0
                    completed += md.actual || 0
                }
            })
            data.matrixPrograms.forEach(({ program }) => {
                const md = program.months[m]
                if (md) {
                    planned += md.plan || 0
                    completed += md.actual || 0
                }
            })
        })

        return {
            period: q.label,
            planned,
            completed,
            completionRate: planned > 0 ? Math.round((completed / planned) * 100) : 0
        }
    })
}

// Calculate semester statistics  
export function calculateSemesterStats(data: AllProgramData): PeriodStats[] {
    const semesters = [
        { label: 'H1', months: ['jan', 'feb', 'mar', 'apr', 'may', 'jun'] },
        { label: 'H2', months: ['jul', 'aug', 'sep', 'oct', 'nov', 'dec'] }
    ]

    return semesters.map(s => {
        let planned = 0
        let completed = 0

        s.months.forEach(m => {
            data.otpPrograms.forEach(({ program }) => {
                const md = program.months[m]
                if (md) {
                    planned += md.plan || 0
                    completed += md.actual || 0
                }
            })
            data.matrixPrograms.forEach(({ program }) => {
                const md = program.months[m]
                if (md) {
                    planned += md.plan || 0
                    completed += md.actual || 0
                }
            })
        })

        return {
            period: s.label,
            planned,
            completed,
            completionRate: planned > 0 ? Math.round((completed / planned) * 100) : 0
        }
    })
}

// Calculate category statistics (Matrix categories) - COUNT PROGRAMS
export function calculateCategoryStats(data: AllProgramData): CategoryStats[] {
    const categories = [
        { key: 'otp', label: '🎯 OTP Programs', color: '#3498db' },
        { key: 'audit', label: '📋 Audit', color: '#667eea' },
        { key: 'training', label: '📚 Training', color: '#11998e' },
        { key: 'meeting', label: '🤝 Meeting', color: '#f5576c' },
        { key: 'drill', label: '🚨 Drill', color: '#fa709a' }
    ]

    const calculateProgress = (months: Record<string, { plan?: number; actual?: number }>) => {
        let totalPlan = 0
        let totalActual = 0
        Object.values(months).forEach(m => {
            if (m) {
                totalPlan += m.plan || 0
                totalActual += m.actual || 0
            }
        })
        return totalPlan > 0 ? Math.round((totalActual / totalPlan) * 100) : 0
    }

    return categories.map(cat => {
        let total = 0
        let completed = 0
        let inProgress = 0

        if (cat.key === 'otp') {
            total = data.otpPrograms.length
            data.otpPrograms.forEach(({ program }) => {
                const progress = calculateProgress(program.months)
                if (progress >= 100) completed++
                else if (progress > 0) inProgress++
            })
        } else {
            const filtered = data.matrixPrograms.filter(p => p.category === cat.key)
            total = filtered.length
            filtered.forEach(({ program }) => {
                const progress = calculateProgress(program.months)
                if (progress >= 100) completed++
                else if (progress > 0) inProgress++
            })
        }

        return {
            category: cat.key,
            label: cat.label,
            total,
            completed,
            inProgress,
            upcoming: total - completed - inProgress,
            completionRate: total > 0 ? Math.min(100, Math.round((completed / total) * 100)) : 0,
            color: cat.color
        }
    }).filter(c => c.total > 0)
}

// Calculate base statistics - COUNT PROGRAMS
export function calculateBaseStats(data: AllProgramData): CategoryStats[] {
    const bases = [
        { key: 'narogong', label: '🏭 Narogong', color: '#e74c3c' },
        { key: 'balikpapan', label: '🏭 Balikpapan', color: '#2ecc71' },
        { key: 'duri', label: '🏭 Duri', color: '#f39c12' },
        { key: 'asia', label: '🌏 Asia', color: '#9b59b6' }
    ]

    const calculateProgress = (months: Record<string, { plan?: number; actual?: number }>) => {
        let totalPlan = 0
        let totalActual = 0
        Object.values(months).forEach(m => {
            if (m) {
                totalPlan += m.plan || 0
                totalActual += m.actual || 0
            }
        })
        return totalPlan > 0 ? Math.round((totalActual / totalPlan) * 100) : 0
    }

    return bases.map(base => {
        let total = 0
        let completed = 0
        let inProgress = 0

        // OTP programs for this base
        const otpFiltered = data.otpPrograms.filter(p => base.key === 'asia' ? p.region === 'asia' : p.base === base.key)
        total += otpFiltered.length
        otpFiltered.forEach(({ program }) => {
            const progress = calculateProgress(program.months)
            if (progress >= 100) completed++
            else if (progress > 0) inProgress++
        })

        // Matrix programs for this base (Matrix doesn't have Asia)
        if (base.key !== 'asia') {
            const matrixFiltered = data.matrixPrograms.filter(p => p.base === base.key)
            total += matrixFiltered.length
            matrixFiltered.forEach(({ program }) => {
                const progress = calculateProgress(program.months)
                if (progress >= 100) completed++
                else if (progress > 0) inProgress++
            })
        }

        return {
            category: base.key,
            label: base.label,
            total,
            completed,
            inProgress,
            upcoming: total - completed - inProgress,
            completionRate: total > 0 ? Math.min(100, Math.round((completed / total) * 100)) : 0,
            color: base.color
        }
    }).filter(b => b.total > 0)
}

// Calculate cumulative completion trend - COUNT PROGRAMS COMPLETED
export function calculateCompletionTrend(data: AllProgramData): TrendData[] {
    // Calculate how many programs are completed by checking their progress
    const isCompleted = (months: Record<string, { plan?: number; actual?: number }>) => {
        let totalPlan = 0
        let totalActual = 0
        Object.values(months).forEach(m => {
            if (m) {
                totalPlan += m.plan || 0
                totalActual += m.actual || 0
            }
        })
        return totalPlan > 0 && totalActual >= totalPlan
    }

    // Count total completed programs
    let totalCompleted = 0
    data.otpPrograms.forEach(({ program }) => {
        if (isCompleted(program.months)) totalCompleted++
    })
    data.matrixPrograms.forEach(({ program }) => {
        if (isCompleted(program.months)) totalCompleted++
    })

    // For the trend, show progressive completion over months
    // This is approximated by distributing completions evenly or using actual data
    const totalPrograms = data.otpPrograms.length + data.matrixPrograms.length

    return monthLabels.map((label, idx) => {
        // Estimate cumulative progress: assume even distribution of completions
        const monthFraction = (idx + 1) / 12
        const estimatedCompleted = Math.round(totalCompleted * monthFraction)
        const previousEstimated = idx === 0 ? 0 : Math.round(totalCompleted * (idx / 12))

        return {
            label,
            value: estimatedCompleted,
            previousValue: previousEstimated,
            change: estimatedCompleted - previousEstimated
        }
    })
}

// Filter interface
export interface StatsFilters {
    region?: string
    base?: string
    source?: string
    category?: string
}

// Apply filters to data
export function filterProgramData(data: AllProgramData, filters: StatsFilters): AllProgramData {
    let otpPrograms = [...data.otpPrograms]
    let matrixPrograms = [...data.matrixPrograms]

    // Filter by source
    if (filters.source === 'otp') matrixPrograms = []
    if (filters.source === 'matrix') otpPrograms = []

    // Filter by region (OTP only)
    if (filters.region && filters.region !== 'all') {
        otpPrograms = otpPrograms.filter(p => p.region === filters.region)
        if (filters.region === 'asia') matrixPrograms = [] // Matrix is Indonesia only
    }

    // Filter by base
    if (filters.base && filters.base !== 'all') {
        otpPrograms = otpPrograms.filter(p => p.base === filters.base)
        matrixPrograms = matrixPrograms.filter(p => p.base === filters.base)
    }

    // Filter by Matrix category
    if (filters.category && filters.category !== 'all') {
        matrixPrograms = matrixPrograms.filter(p => p.category === filters.category)
    }

    return { otpPrograms, matrixPrograms }
}

// Generate comprehensive statistics
export function generateStatistics(filters: StatsFilters = {}) {
    const allData = loadAllProgramData()
    const filteredData = filterProgramData(allData, filters)

    return {
        overall: calculateOverallStats(filteredData),
        monthly: calculateMonthlyStats(filteredData),
        quarterly: calculateQuarterlyStats(filteredData),
        semester: calculateSemesterStats(filteredData),
        byCategory: calculateCategoryStats(filteredData),
        bySource: [
            {
                category: 'otp',
                label: '🎯 OTP',
                ...calculateOverallStatsForSource(filteredData.otpPrograms),
                color: '#3498db'
            },
            {
                category: 'matrix',
                label: '📊 Matrix',
                ...calculateOverallStatsForSource(filteredData.matrixPrograms),
                color: '#9b59b6'
            }
        ],
        byBase: calculateBaseStats(filteredData),
        completionTrend: calculateCompletionTrend(filteredData),
        programCounts: {
            otpPrograms: allData.otpPrograms.length,
            matrixPrograms: allData.matrixPrograms.length
        }
    }
}

// Helper for source stats - COUNT PROGRAMS
function calculateOverallStatsForSource(programs: { program: OTPProgram | MatrixProgram }[]) {
    const total = programs.length
    let completed = 0
    let inProgress = 0

    const calculateProgress = (months: Record<string, { plan?: number; actual?: number }>) => {
        let totalPlan = 0
        let totalActual = 0
        Object.values(months).forEach(m => {
            if (m) {
                totalPlan += m.plan || 0
                totalActual += m.actual || 0
            }
        })
        return totalPlan > 0 ? Math.round((totalActual / totalPlan) * 100) : 0
    }

    programs.forEach(({ program }) => {
        const progress = calculateProgress(program.months)
        if (progress >= 100) completed++
        else if (progress > 0) inProgress++
    })

    return {
        total,
        completed,
        inProgress,
        upcoming: total - completed - inProgress,
        completionRate: total > 0 ? Math.min(100, Math.round((completed / total) * 100)) : 0
    }
}

// Chart color gradients
export const chartGradients = {
    blue: ['#667eea', '#764ba2'],
    green: ['#11998e', '#38ef7d'],
    pink: ['#f093fb', '#f5576c'],
    orange: ['#fa709a', '#fee140'],
    purple: ['#a18cd1', '#fbc2eb'],
    teal: ['#4dc9e6', '#016795'],
    sunset: ['#f12711', '#f5af19'],
    ocean: ['#2193b0', '#6dd5ed'],
    forest: ['#134e5e', '#71b280'],
    cherry: ['#eb3349', '#f45c43']
}

// Get gradient for chart
export function getGradientColors(index: number): string[] {
    const gradients = Object.values(chartGradients)
    return gradients[index % gradients.length]
}

// Generate CSV report
export function generateCSVReport(stats: ReturnType<typeof generateStatistics>): string {
    let csv = 'HSE Analytics Report\n\n'

    // Overall Stats
    csv += 'Overall Statistics\n'
    csv += 'Metric,Value\n'
    csv += `Total Planned,${stats.overall.total}\n`
    csv += `Total Completed,${stats.overall.completed}\n`
    csv += `Completion Rate,${stats.overall.completionRate}%\n`
    csv += `In Progress,${stats.overall.inProgress}\n`
    csv += `Overdue,${stats.overall.overdue}\n\n`

    // Monthly Stats
    csv += 'Monthly Statistics\n'
    csv += 'Month,Planned,Completed,Rate\n'
    stats.monthly.forEach(m => {
        csv += `${m.label},${m.planned},${m.completed},${m.completionRate}%\n`
    })
    csv += '\n'

    // Quarterly Stats
    csv += 'Quarterly Statistics\n'
    csv += 'Quarter,Planned,Completed,Rate\n'
    stats.quarterly.forEach(q => {
        csv += `${q.period},${q.planned},${q.completed},${q.completionRate}%\n`
    })
    csv += '\n'

    // Category Stats
    csv += 'Category Statistics\n'
    csv += 'Category,Total,Completed,Rate\n'
    stats.byCategory.forEach(c => {
        csv += `${c.label.replace(/[^\w\s]/g, '')},${c.total},${c.completed},${c.completionRate}%\n`
    })
    csv += '\n'

    // Base Stats
    csv += 'Base Statistics\n'
    csv += 'Base,Total,Completed,Rate\n'
    stats.byBase.forEach(b => {
        csv += `${b.label.replace(/[^\w\s]/g, '')},${b.total},${b.completed},${b.completionRate}%\n`
    })

    return csv
}

// Download CSV
export function downloadCSVReport(stats: ReturnType<typeof generateStatistics>, filters: StatsFilters): void {
    const csv = generateCSVReport(stats)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    const date = new Date().toISOString().split('T')[0]
    link.download = `HSE_Analytics_Report_${date}.csv`
    link.click()
}
