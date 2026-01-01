"use client"

import { useState, useEffect, useMemo } from "react"
import { motion, useSpring, useTransform } from "framer-motion"
import { AppShell } from "@/components/layout/app-shell"
import { cn } from "@/lib/utils"
import { Download, Plus, X, Trash2, AlertTriangle, Calendar, Check } from "lucide-react"
import { PageTransition, PageHeader, PageContent } from "@/components/ui/page-transition"
import { BarChart, Card, Text, Flex, BadgeDelta } from "@tremor/react"
import {
    loadKPIYear,
    saveKPIYear,
    downloadKPICSV,
    calculateKPIStatus,
    getKPIYears,
    addKPIYear,
    kpiIconOptions,
    type KPIYearData,
    type KPIMetric
} from "@/lib/kpi-store"

const statusColors = {
    "achieved": "bg-[var(--success-color)] text-white",
    "on-track": "bg-[var(--warning-color)] text-black",
    "at-risk": "bg-[var(--danger-color)] text-white",
}

// Animated counter component
function AnimatedNumber({ value, duration = 1 }: { value: number; duration?: number }) {
    const spring = useSpring(0, { duration: duration * 1000 })
    const display = useTransform(spring, (current) => Math.round(current).toLocaleString())

    useEffect(() => {
        spring.set(value)
    }, [spring, value])

    return <motion.span>{display}</motion.span>
}

export default function HSEKPIPage() {
    const [availableYears, setAvailableYears] = useState<number[]>([])
    const [selectedYear, setSelectedYear] = useState(2025)
    const [data, setData] = useState<KPIYearData>({ year: 2025, manHours: 0, metrics: [] })
    const [editModal, setEditModal] = useState<{ metric: KPIMetric | null; isNew: boolean } | null>(null)
    const [deleteModal, setDeleteModal] = useState<{ id: string; name: string } | null>(null)
    const [addYearModal, setAddYearModal] = useState(false)
    const [manHoursEdit, setManHoursEdit] = useState(false)
    const [iconPicker, setIconPicker] = useState(false)
    const [selectedIcon, setSelectedIcon] = useState("📊")

    // Load available years and data
    useEffect(() => {
        const years = getKPIYears()
        setAvailableYears(years)
        if (years.length > 0 && !years.includes(selectedYear)) {
            setSelectedYear(years[0])
        }
    }, [])

    // Load data when year changes
    useEffect(() => {
        const yearData = loadKPIYear(selectedYear)
        setData(yearData)
    }, [selectedYear])

    const saveData = (newData: KPIYearData) => {
        setData(newData)
        saveKPIYear(selectedYear, newData)
    }

    const handleAddYear = (year: number) => {
        const newData = addKPIYear(year)
        setAvailableYears(getKPIYears())
        setSelectedYear(year)
        setData(newData)
        setAddYearModal(false)
    }

    const handleSaveMetric = (metric: KPIMetric, isNew: boolean) => {
        const newData = { ...data }
        if (isNew) {
            newData.metrics = [...newData.metrics, metric]
        } else {
            newData.metrics = newData.metrics.map(m => m.id === metric.id ? metric : m)
        }
        saveData(newData)
        setEditModal(null)
    }

    const handleDeleteMetric = (id: string) => {
        const newData = { ...data, metrics: data.metrics.filter(m => m.id !== id) }
        saveData(newData)
        setDeleteModal(null)
    }

    const handleManHoursSave = (hours: number) => {
        const newData = { ...data, manHours: hours }
        saveData(newData)
        setManHoursEdit(false)
    }

    // Calculate summary stats
    const achieved = data.metrics.filter(m => calculateKPIStatus(m.target, m.result, m.id) === "achieved").length
    const onTrack = data.metrics.filter(m => calculateKPIStatus(m.target, m.result, m.id) === "on-track").length
    const atRisk = data.metrics.filter(m => calculateKPIStatus(m.target, m.result, m.id) === "at-risk").length

    return (
        <AppShell>
            <PageTransition className="space-y-4">
                {/* Header */}
                <PageHeader className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-[#27ae60] to-[#2ecc71] rounded-xl flex items-center justify-center text-2xl">
                        📊
                    </div>
                    <div className="flex-1">
                        <h1 className="text-xl font-bold text-[var(--text-primary)]">HSE KPI Dashboard</h1>
                        <p className="text-xs text-[var(--text-muted)]">Key Performance Indicators - {selectedYear}</p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setAddYearModal(true)}
                            className="px-3 py-2 border border-[var(--accent-blue)] text-[var(--accent-blue)] rounded-lg text-xs font-semibold flex items-center gap-1 hover:bg-[var(--accent-blue)]/10"
                        >
                            <Calendar className="w-3 h-3" /> Add Year
                        </button>
                        <button
                            onClick={() => downloadKPICSV(data)}
                            className="px-3 py-2 bg-[#27ae60] text-white rounded-lg text-xs font-semibold flex items-center gap-1"
                        >
                            <Download className="w-3 h-3" /> Export CSV
                        </button>
                    </div>
                </PageHeader>

                {/* Year Tabs */}
                <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
                    {availableYears.map((year) => (
                        <button
                            key={year}
                            onClick={() => setSelectedYear(year)}
                            className={cn(
                                "px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
                                selectedYear === year
                                    ? "bg-[var(--accent-blue)] text-white"
                                    : "bg-[var(--bg-tertiary)] text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]/80"
                            )}
                        >
                            {year}
                        </button>
                    ))}
                </div>

                {/* Man Hours Card */}
                <motion.div
                    whileHover={{ scale: 1.02, y: -3 }}
                    transition={{ type: "spring", stiffness: 300 }}
                    className="p-4 bg-gradient-to-br from-[#667eea] to-[#764ba2] text-white rounded-2xl cursor-pointer shadow-lg shadow-purple-500/20"
                    onClick={() => setManHoursEdit(true)}
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-xs opacity-80">Man Hours {selectedYear}</div>
                            <div className="text-3xl font-bold"><AnimatedNumber value={data.manHours} /></div>
                        </div>
                        <div className="text-4xl opacity-50">⏱️</div>
                    </div>
                </motion.div>

                {/* Summary Cards */}
                <PageContent className="grid grid-cols-3 gap-3">
                    <motion.div
                        whileHover={{ scale: 1.02, y: -3 }}
                        transition={{ type: "spring", stiffness: 300 }}
                        className="p-4 text-center bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl cursor-pointer"
                    >
                        <div className="text-3xl font-bold bg-gradient-to-r from-[#27ae60] to-[#2ecc71] bg-clip-text text-transparent">
                            <AnimatedNumber value={achieved} />
                        </div>
                        <div className="text-xs text-[var(--text-muted)] mt-1">Achieved</div>
                    </motion.div>
                    <motion.div
                        whileHover={{ scale: 1.02, y: -3 }}
                        transition={{ type: "spring", stiffness: 300 }}
                        className="p-4 text-center bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl cursor-pointer"
                    >
                        <div className="text-3xl font-bold bg-gradient-to-r from-[#f39c12] to-[#e67e22] bg-clip-text text-transparent">
                            <AnimatedNumber value={onTrack} />
                        </div>
                        <div className="text-xs text-[var(--text-muted)] mt-1">On Track</div>
                    </motion.div>
                    <motion.div
                        whileHover={{ scale: 1.02, y: -3 }}
                        transition={{ type: "spring", stiffness: 300 }}
                        className="p-4 text-center bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl cursor-pointer"
                    >
                        <div className="text-3xl font-bold bg-gradient-to-r from-[#e74c3c] to-[#c0392b] bg-clip-text text-transparent">
                            <AnimatedNumber value={atRisk} />
                        </div>
                        <div className="text-xs text-[var(--text-muted)] mt-1">At Risk</div>
                    </motion.div>
                </PageContent>

                {/* KPI Metrics Bar Chart - Tremor */}
                {data.metrics.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 }}
                        className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-4 shadow-xl"
                    >
                        <Flex alignItems="center" justifyContent="between" className="mb-4">
                            <Text className="font-semibold text-[var(--text-primary)]">📊 Metrics Overview</Text>
                            <BadgeDelta
                                deltaType={achieved >= atRisk ? "increase" : "decrease"}
                                size="xs"
                            >
                                {achieved} of {data.metrics.length} achieved
                            </BadgeDelta>
                        </Flex>
                        <BarChart
                            data={data.metrics.map(m => ({
                                name: m.name.length > 20 ? m.name.substring(0, 20) + '...' : m.name,
                                Target: m.target,
                                Result: m.result,
                            }))}
                            index="name"
                            categories={["Target", "Result"]}
                            colors={["blue", "emerald"]}
                            className="h-64"
                            showAnimation={true}
                            showLegend={true}
                            showGridLines={false}
                            yAxisWidth={48}
                        />
                    </motion.div>
                )}

                {/* KPI Table */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden shadow-xl"
                >
                    <div className="flex items-center justify-between p-4 border-b border-[var(--border-light)]">
                        <h3 className="font-semibold text-[var(--text-primary)]">📈 Performance Metrics</h3>
                        <button
                            onClick={() => { setSelectedIcon("📊"); setEditModal({ metric: null, isNew: true }) }}
                            className="px-3 py-1 bg-[var(--accent-blue)] text-white rounded-lg text-xs font-semibold flex items-center gap-1"
                        >
                            <Plus className="w-3 h-3" /> Add Metric
                        </button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-[var(--bg-tertiary)]">
                                <tr>
                                    <th className="text-center p-3 font-semibold w-10">Icon</th>
                                    <th className="text-left p-3 font-semibold">Metric</th>
                                    <th className="text-center p-3 font-semibold">Target</th>
                                    <th className="text-center p-3 font-semibold">Result</th>
                                    <th className="text-center p-3 font-semibold">Status</th>
                                    <th className="text-center p-3 font-semibold w-16">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.metrics.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="p-8 text-center text-[var(--text-muted)]">
                                            No metrics. Click &quot;Add Metric&quot; to create one.
                                        </td>
                                    </tr>
                                ) : (
                                    data.metrics.map((metric, idx) => {
                                        const status = calculateKPIStatus(metric.target, metric.result, metric.id)
                                        return (
                                            <motion.tr
                                                key={metric.id}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: idx * 0.05, duration: 0.3 }}
                                                className="border-b border-white/5 hover:bg-white/5 cursor-pointer transition-colors"
                                                onClick={() => { setSelectedIcon(metric.icon); setEditModal({ metric, isNew: false }) }}
                                            >
                                                <td className="p-3 text-center text-lg">{metric.icon}</td>
                                                <td className="p-3 font-medium">{metric.name}</td>
                                                <td className="p-3 text-center">{metric.target}</td>
                                                <td className="p-3 text-center font-semibold">{metric.result}</td>
                                                <td className="p-3 text-center">
                                                    <span className={cn(
                                                        "px-2 py-1 rounded-full text-[10px] font-semibold uppercase",
                                                        statusColors[status]
                                                    )}>
                                                        {status.replace("-", " ")}
                                                    </span>
                                                </td>
                                                <td className="p-3 text-center">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            setDeleteModal({ id: metric.id, name: metric.name })
                                                        }}
                                                        className="p-1.5 text-[var(--danger-color)] hover:bg-[var(--danger-color)]/10 rounded transition-colors"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </td>
                                            </motion.tr>
                                        )
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </motion.div>

                {/* Formula Reference */}
                <div className="p-4 bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-light)]">
                    <h3 className="text-sm font-semibold text-[var(--text-muted)] mb-3">📐 Formula Reference</h3>
                    <div className="space-y-2 text-xs text-[var(--text-secondary)]">
                        <p>• <strong>TRIR</strong> = (Number of Recordable Incidents × 1,000,000) / Man-Hours</p>
                        <p>• <strong>2025 TRIR Target</strong> = 50% of 2024 TRIR Result (0.44)</p>
                        <p>• <strong>PVIR</strong> = (Volume of Incidents / Number of Vehicles) / MH</p>
                    </div>
                </div>

                {/* Add Year Modal */}
                {addYearModal && (
                    <div className="fixed inset-0 bg-black/50 z-[300] flex items-center justify-center p-4">
                        <div className="bg-[var(--bg-primary)] rounded-xl w-full max-w-sm">
                            <div className="p-4 border-b border-[var(--border-light)] flex justify-between items-center">
                                <h3 className="font-bold">Add New Year</h3>
                                <button onClick={() => setAddYearModal(false)} className="p-1 hover:bg-[var(--bg-tertiary)] rounded">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <form
                                onSubmit={(e) => {
                                    e.preventDefault()
                                    const form = e.target as HTMLFormElement
                                    const year = parseInt((form.elements.namedItem("year") as HTMLInputElement).value)
                                    if (year && !availableYears.includes(year)) {
                                        handleAddYear(year)
                                    }
                                }}
                                className="p-4 space-y-4"
                            >
                                <div>
                                    <label className="block text-xs font-medium mb-1">Year</label>
                                    <input
                                        name="year"
                                        type="number"
                                        required
                                        min={2020}
                                        max={2050}
                                        defaultValue={new Date().getFullYear() + 1}
                                        className="w-full p-2 border border-[var(--border-light)] rounded-lg bg-[var(--bg-secondary)] text-lg font-bold text-center"
                                    />
                                </div>
                                <div className="flex gap-2 pt-2">
                                    <button type="button" onClick={() => setAddYearModal(false)} className="flex-1 p-2 border border-[var(--border-light)] rounded-lg hover:bg-[var(--bg-tertiary)]">
                                        Cancel
                                    </button>
                                    <button type="submit" className="flex-1 p-2 bg-[var(--accent-blue)] text-white rounded-lg font-semibold">
                                        Add Year
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Man Hours Edit Modal */}
                {manHoursEdit && (
                    <div className="fixed inset-0 bg-black/50 z-[300] flex items-center justify-center p-4">
                        <div className="bg-[var(--bg-primary)] rounded-xl w-full max-w-sm">
                            <div className="p-4 border-b border-[var(--border-light)] flex justify-between items-center">
                                <h3 className="font-bold">Edit Man Hours</h3>
                                <button onClick={() => setManHoursEdit(false)} className="p-1 hover:bg-[var(--bg-tertiary)] rounded">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <form
                                onSubmit={(e) => {
                                    e.preventDefault()
                                    const form = e.target as HTMLFormElement
                                    const hours = parseInt((form.elements.namedItem("hours") as HTMLInputElement).value) || 0
                                    handleManHoursSave(hours)
                                }}
                                className="p-4 space-y-4"
                            >
                                <div>
                                    <label className="block text-xs font-medium mb-1">Man Hours for {selectedYear}</label>
                                    <input
                                        name="hours"
                                        type="number"
                                        required
                                        min={0}
                                        defaultValue={data.manHours}
                                        className="w-full p-2 border border-[var(--border-light)] rounded-lg bg-[var(--bg-secondary)] text-lg font-bold text-center"
                                    />
                                </div>
                                <div className="flex gap-2 pt-2">
                                    <button type="button" onClick={() => setManHoursEdit(false)} className="flex-1 p-2 border border-[var(--border-light)] rounded-lg hover:bg-[var(--bg-tertiary)]">
                                        Cancel
                                    </button>
                                    <button type="submit" className="flex-1 p-2 bg-[var(--accent-blue)] text-white rounded-lg font-semibold">
                                        Save
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Edit/Add Metric Modal */}
                {editModal && (
                    <div className="fixed inset-0 bg-black/50 z-[300] flex items-center justify-center p-4">
                        <div className="bg-[var(--bg-primary)] rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
                            <div className="p-4 border-b border-[var(--border-light)] flex justify-between items-center sticky top-0 bg-[var(--bg-primary)]">
                                <h3 className="font-bold">{editModal.isNew ? "Add" : "Edit"} KPI Metric</h3>
                                <button onClick={() => setEditModal(null)} className="p-1 hover:bg-[var(--bg-tertiary)] rounded">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <form
                                onSubmit={(e) => {
                                    e.preventDefault()
                                    const form = e.target as HTMLFormElement
                                    handleSaveMetric({
                                        id: editModal.metric?.id || `custom_${Date.now()}`,
                                        icon: selectedIcon,
                                        name: (form.elements.namedItem("name") as HTMLInputElement).value,
                                        target: parseFloat((form.elements.namedItem("target") as HTMLInputElement).value) || 0,
                                        result: parseFloat((form.elements.namedItem("result") as HTMLInputElement).value) || 0,
                                    }, editModal.isNew)
                                }}
                                className="p-4 space-y-4"
                            >
                                {/* Icon Picker */}
                                <div>
                                    <label className="block text-xs font-medium mb-1">Icon</label>
                                    <button
                                        type="button"
                                        onClick={() => setIconPicker(!iconPicker)}
                                        className="w-16 h-16 text-3xl border border-[var(--border-light)] rounded-lg bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] flex items-center justify-center"
                                    >
                                        {selectedIcon}
                                    </button>
                                    {iconPicker && (
                                        <div className="mt-2 p-2 border border-[var(--border-light)] rounded-lg bg-[var(--bg-secondary)] grid grid-cols-10 gap-1">
                                            {kpiIconOptions.map((icon, idx) => (
                                                <button
                                                    key={idx}
                                                    type="button"
                                                    onClick={() => { setSelectedIcon(icon); setIconPicker(false) }}
                                                    className={cn(
                                                        "w-8 h-8 text-lg rounded hover:bg-[var(--accent-blue)]/20",
                                                        selectedIcon === icon && "bg-[var(--accent-blue)]/30"
                                                    )}
                                                >
                                                    {icon}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-xs font-medium mb-1">Metric Name *</label>
                                    <input
                                        name="name"
                                        type="text"
                                        required
                                        defaultValue={editModal.metric?.name || ""}
                                        className="w-full p-2 border border-[var(--border-light)] rounded-lg bg-[var(--bg-secondary)]"
                                        placeholder="e.g. Total Recordable Injury Rate"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-medium mb-1">Target *</label>
                                        <input
                                            name="target"
                                            type="number"
                                            step="any"
                                            required
                                            defaultValue={editModal.metric?.target || 0}
                                            className="w-full p-2 border border-[var(--border-light)] rounded-lg bg-[var(--bg-secondary)]"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium mb-1">Result</label>
                                        <input
                                            name="result"
                                            type="number"
                                            step="any"
                                            defaultValue={editModal.metric?.result || 0}
                                            className="w-full p-2 border border-[var(--border-light)] rounded-lg bg-[var(--bg-secondary)]"
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-2 pt-2">
                                    <button type="button" onClick={() => setEditModal(null)} className="flex-1 p-2 border border-[var(--border-light)] rounded-lg hover:bg-[var(--bg-tertiary)]">
                                        Cancel
                                    </button>
                                    <button type="submit" className="flex-1 p-2 bg-[var(--accent-blue)] text-white rounded-lg font-semibold">
                                        {editModal.isNew ? "Add Metric" : "Save Changes"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Delete Modal */}
                {deleteModal && (
                    <div className="fixed inset-0 bg-black/50 z-[300] flex items-center justify-center p-4">
                        <div className="bg-[var(--bg-primary)] rounded-xl w-full max-w-sm">
                            <div className="p-6 text-center">
                                <div className="w-16 h-16 mx-auto mb-4 bg-[var(--danger-color)]/10 rounded-full flex items-center justify-center">
                                    <AlertTriangle className="w-8 h-8 text-[var(--danger-color)]" />
                                </div>
                                <h3 className="text-lg font-bold mb-2">Delete Metric?</h3>
                                <p className="text-sm text-[var(--text-muted)] mb-4">
                                    Are you sure you want to delete <strong>&quot;{deleteModal.name}&quot;</strong>?
                                </p>
                                <div className="flex gap-3">
                                    <button onClick={() => setDeleteModal(null)} className="flex-1 p-3 border border-[var(--border-light)] rounded-lg hover:bg-[var(--bg-tertiary)] font-medium">
                                        Cancel
                                    </button>
                                    <button onClick={() => handleDeleteMetric(deleteModal.id)} className="flex-1 p-3 bg-[var(--danger-color)] text-white rounded-lg font-semibold">
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </PageTransition>
        </AppShell>
    )
}
