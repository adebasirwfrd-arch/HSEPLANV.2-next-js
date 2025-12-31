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

// Calculate monthly stats from raw program data
export function calculateMonthlyStats(data: AllProgramData): MonthlyStats[] {
    return months.map((month, idx) => {
        let planned = 0
        let completed = 0

        // Sum OTP monthly plan/actual
        data.otpPrograms.forEach(({ program }) => {
            const monthData = program.months[month]
            if (monthData) {
                planned += monthData.plan || 0
                completed += monthData.actual || 0
            }
        })

        // Sum Matrix monthly plan/actual
        data.matrixPrograms.forEach(({ program }) => {
            const monthData = program.months[month]
            if (monthData) {
                planned += monthData.plan || 0
                completed += monthData.actual || 0
            }
        })

        // Overdue: planned > actual for past months
        const today = new Date()
        const currentMonth = today.getMonth()
        const overdue = idx < currentMonth ? Math.max(0, planned - completed) : 0

        return {
            month,
            label: monthLabels[idx],
            planned,
            completed,
            completionRate: planned > 0 ? Math.round((completed / planned) * 100) : 0,
            overdue
        }
    })
}

// Calculate overall stats
export function calculateOverallStats(data: AllProgramData): OverallStats {
    let totalPlanned = 0
    let totalCompleted = 0
    let otpPlanned = 0
    let otpCompleted = 0
    let matrixPlanned = 0
    let matrixCompleted = 0

    // OTP stats
    data.otpPrograms.forEach(({ program }) => {
        months.forEach(m => {
            const md = program.months[m]
            if (md) {
                otpPlanned += md.plan || 0
                otpCompleted += md.actual || 0
            }
        })
    })

    // Matrix stats
    data.matrixPrograms.forEach(({ program }) => {
        months.forEach(m => {
            const md = program.months[m]
            if (md) {
                matrixPlanned += md.plan || 0
                matrixCompleted += md.actual || 0
            }
        })
    })

    totalPlanned = otpPlanned + matrixPlanned
    totalCompleted = otpCompleted + matrixCompleted

    const inProgress = totalPlanned - totalCompleted
    const today = new Date()
    const currentMonth = today.getMonth()

    // Calculate overdue (sum of uncompleted from past months)
    let overdue = 0
    months.forEach((m, idx) => {
        if (idx < currentMonth) {
            let monthPlanned = 0
            let monthCompleted = 0

            data.otpPrograms.forEach(({ program }) => {
                const md = program.months[m]
                if (md) {
                    monthPlanned += md.plan || 0
                    monthCompleted += md.actual || 0
                }
            })
            data.matrixPrograms.forEach(({ program }) => {
                const md = program.months[m]
                if (md) {
                    monthPlanned += md.plan || 0
                    monthCompleted += md.actual || 0
                }
            })

            overdue += Math.max(0, monthPlanned - monthCompleted)
        }
    })

    return {
        total: totalPlanned,
        completed: totalCompleted,
        inProgress: Math.max(0, totalPlanned - totalCompleted),
        upcoming: 0, // Future months not yet due
        overdue,
        completionRate: totalPlanned > 0 ? Math.round((totalCompleted / totalPlanned) * 100) : 0,
        otpCount: otpPlanned,
        otpCompleted,
        matrixCount: matrixPlanned,
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

// Calculate category statistics (Matrix categories)
export function calculateCategoryStats(data: AllProgramData): CategoryStats[] {
    const categories = [
        { key: 'otp', label: '🎯 OTP Programs', color: '#3498db' },
        { key: 'audit', label: '📋 Audit', color: '#667eea' },
        { key: 'training', label: '📚 Training', color: '#11998e' },
        { key: 'meeting', label: '🤝 Meeting', color: '#f5576c' },
        { key: 'drill', label: '🚨 Drill', color: '#fa709a' }
    ]

    return categories.map(cat => {
        let total = 0
        let completed = 0

        if (cat.key === 'otp') {
            data.otpPrograms.forEach(({ program }) => {
                months.forEach(m => {
                    const md = program.months[m]
                    if (md) {
                        total += md.plan || 0
                        completed += md.actual || 0
                    }
                })
            })
        } else {
            data.matrixPrograms
                .filter(p => p.category === cat.key)
                .forEach(({ program }) => {
                    months.forEach(m => {
                        const md = program.months[m]
                        if (md) {
                            total += md.plan || 0
                            completed += md.actual || 0
                        }
                    })
                })
        }

        return {
            category: cat.key,
            label: cat.label,
            total,
            completed,
            inProgress: Math.max(0, total - completed),
            upcoming: 0,
            completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
            color: cat.color
        }
    }).filter(c => c.total > 0)
}

// Calculate base statistics
export function calculateBaseStats(data: AllProgramData): CategoryStats[] {
    const bases = [
        { key: 'narogong', label: '🏭 Narogong', color: '#e74c3c' },
        { key: 'balikpapan', label: '🏭 Balikpapan', color: '#2ecc71' },
        { key: 'duri', label: '🏭 Duri', color: '#f39c12' },
        { key: 'asia', label: '🌏 Asia', color: '#9b59b6' }
    ]

    return bases.map(base => {
        let total = 0
        let completed = 0

        // OTP data for this base
        data.otpPrograms
            .filter(p => base.key === 'asia' ? p.region === 'asia' : p.base === base.key)
            .forEach(({ program }) => {
                months.forEach(m => {
                    const md = program.months[m]
                    if (md) {
                        total += md.plan || 0
                        completed += md.actual || 0
                    }
                })
            })

        // Matrix data for this base (Matrix doesn't have Asia)
        if (base.key !== 'asia') {
            data.matrixPrograms
                .filter(p => p.base === base.key)
                .forEach(({ program }) => {
                    months.forEach(m => {
                        const md = program.months[m]
                        if (md) {
                            total += md.plan || 0
                            completed += md.actual || 0
                        }
                    })
                })
        }

        return {
            category: base.key,
            label: base.label,
            total,
            completed,
            inProgress: Math.max(0, total - completed),
            upcoming: 0,
            completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
            color: base.color
        }
    }).filter(b => b.total > 0)
}

// Calculate cumulative completion trend
export function calculateCompletionTrend(data: AllProgramData): TrendData[] {
    let cumulative = 0
    return monthLabels.map((label, idx) => {
        const month = months[idx]
        let completedThisMonth = 0

        data.otpPrograms.forEach(({ program }) => {
            const md = program.months[month]
            if (md) completedThisMonth += md.actual || 0
        })
        data.matrixPrograms.forEach(({ program }) => {
            const md = program.months[month]
            if (md) completedThisMonth += md.actual || 0
        })

        cumulative += completedThisMonth
        return {
            label,
            value: cumulative,
            previousValue: cumulative - completedThisMonth
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

// Helper for source stats
function calculateOverallStatsForSource(programs: { program: OTPProgram | MatrixProgram }[]) {
    let total = 0
    let completed = 0

    programs.forEach(({ program }) => {
        months.forEach(m => {
            const md = program.months[m]
            if (md) {
                total += md.plan || 0
                completed += md.actual || 0
            }
        })
    })

    return {
        total,
        completed,
        inProgress: Math.max(0, total - completed),
        upcoming: 0,
        completionRate: total > 0 ? Math.round((completed / total) * 100) : 0
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
