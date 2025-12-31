// KPI Store - Multi-year KPI data management with localStorage
import kpiRawData from "./kpi_data.json"

export interface KPIMetric {
    id: string
    name: string
    icon: string
    target: number
    result: number
}

export interface KPIYearData {
    year: number
    manHours: number
    metrics: KPIMetric[]
}

export interface KPIStore {
    years: number[]
    data: Record<number, KPIYearData>
}

// Metric definitions with icons
const metricDefinitions: Record<string, { name: string; icon: string }> = {
    fatality: { name: "Fatality", icon: "💀" },
    trir: { name: "Total Recordable Injury Rate (TRIR)", icon: "🩹" },
    pvir: { name: "Preventable Vehicle Incident Rate (PVIR)", icon: "🚗" },
    environment: { name: "Environment Incidents", icon: "🌿" },
    fire: { name: "Fire Case", icon: "🔥" },
    firstaid: { name: "First Aid Case", icon: "🩺" },
    occupational: { name: "Occupational Health Incident", icon: "⚕️" }
}

// LocalStorage key
const STORAGE_KEY = "hse-kpi-data-v2"

// Convert raw JSON data to typed format
function parseRawData(): KPIStore {
    const years = Object.keys(kpiRawData.man_hours).map(Number).sort((a, b) => b - a)
    const data: Record<number, KPIYearData> = {}

    years.forEach(year => {
        const metrics: KPIMetric[] = []
        const yearKPI = (kpiRawData.kpi as Record<string, Record<string, { target: number; result: number }>>)[year.toString()]

        if (yearKPI) {
            Object.entries(yearKPI).forEach(([key, value]) => {
                const def = metricDefinitions[key]
                if (def) {
                    metrics.push({
                        id: key,
                        name: def.name,
                        icon: def.icon,
                        target: value.target,
                        result: value.result
                    })
                }
            })
        }

        data[year] = {
            year,
            manHours: (kpiRawData.man_hours as Record<string, number>)[year.toString()] || 0,
            metrics
        }
    })

    return { years, data }
}

// Load from localStorage or initial data
export function loadKPIStore(): KPIStore {
    if (typeof window === "undefined") return parseRawData()
    try {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored) {
            return JSON.parse(stored)
        }
        return parseRawData()
    } catch {
        return parseRawData()
    }
}

// Save to localStorage
export function saveKPIStore(store: KPIStore): void {
    if (typeof window === "undefined") return
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
    } catch (e) {
        console.error("Failed to save KPI data:", e)
    }
}

// Get data for specific year
export function loadKPIYear(year: number): KPIYearData {
    const store = loadKPIStore()
    return store.data[year] || { year, manHours: 0, metrics: [] }
}

// Save data for specific year
export function saveKPIYear(year: number, data: KPIYearData): void {
    const store = loadKPIStore()
    store.data[year] = data
    if (!store.years.includes(year)) {
        store.years.push(year)
        store.years.sort((a, b) => b - a)
    }
    saveKPIStore(store)
}

// Add new year
export function addKPIYear(year: number): KPIYearData {
    const store = loadKPIStore()
    if (!store.years.includes(year)) {
        store.years.push(year)
        store.years.sort((a, b) => b - a)
        // Create empty metrics with same structure
        store.data[year] = {
            year,
            manHours: 0,
            metrics: Object.entries(metricDefinitions).map(([id, def]) => ({
                id,
                name: def.name,
                icon: def.icon,
                target: 0,
                result: 0
            }))
        }
        saveKPIStore(store)
    }
    return store.data[year]
}

// Get available years
export function getKPIYears(): number[] {
    const store = loadKPIStore()
    return store.years.sort((a, b) => b - a)
}

// Calculate status based on target and result
export function calculateKPIStatus(target: number, result: number, metricId: string): "achieved" | "on-track" | "at-risk" {
    // For metrics where 0 is the target (fatality, fire, etc.)
    if (target === 0) {
        return result === 0 ? "achieved" : "at-risk"
    }
    // For rate metrics like TRIR
    if (result <= target) return "achieved"
    if (result <= target * 1.2) return "on-track"
    return "at-risk"
}

// Generate CSV export
export function generateKPICSV(data: KPIYearData): string {
    let csv = `KPI Report for ${data.year}\n`
    csv += `Man Hours,${data.manHours}\n\n`
    csv += "Icon,Metric,Target,Result,Status\n"

    data.metrics.forEach(m => {
        const status = calculateKPIStatus(m.target, m.result, m.id)
        csv += `"${m.icon}","${m.name}",${m.target},${m.result},${status}\n`
    })

    return csv
}

// Download CSV
export function downloadKPICSV(data: KPIYearData): void {
    const csv = generateKPICSV(data)
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = `HSE_KPI_${data.year}.csv`
    link.click()
}

// Icon options for KPI metrics
export const kpiIconOptions = [
    "💀", "🩹", "🚗", "🌿", "🔥", "🩺", "⚕️", "📊", "📈", "🎯",
    "🛡️", "⚠️", "✅", "❌", "🏥", "👷", "🦺", "🧯", "🚨", "💉"
]
