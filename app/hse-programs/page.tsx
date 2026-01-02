"use client"

import { useState, useEffect, useMemo } from "react"
import { motion } from "framer-motion"
import { AppShell } from "@/components/layout/app-shell"
import { GlassCard } from "@/components/ui/glass-card"
import { cn } from "@/lib/utils"
import { Search, Download, Edit2, X, Save } from "lucide-react"
import {
    UnifiedProgram,
    ProgramFilters,
    ProgramSource,
    ProgramRegion,
    ProgramBase,
    ProgramStatus,
    ProgramUpdate,
    loadUnifiedPrograms,
    filterPrograms,
    calculateProgramStats,
    downloadUnifiedCSV,
    updateUnifiedProgram,
    categoryLabels,
    categoryIcons,
    statusColors
} from "@/lib/programs-store"

type FilterStatus = ProgramStatus | 'all'

const statusFilters: { value: FilterStatus; label: string }[] = [
    { value: "all", label: "All" },
    { value: "Upcoming", label: "Upcoming" },
    { value: "InProgress", label: "In Progress" },
    { value: "Completed", label: "Completed" },
    { value: "OnHold", label: "On Hold" },
]

const regionOptions = [
    { value: "all", label: "🌍 All Regions" },
    { value: "indonesia", label: "🇮🇩 Indonesia" },
    { value: "asia", label: "🌏 Asia" },
]

const baseOptions = [
    { value: "all", label: "All Bases" },
    { value: "narogong", label: "Narogong" },
    { value: "balikpapan", label: "Balikpapan" },
    { value: "duri", label: "Duri" },
]

const sourceOptions = [
    { value: "all", label: "All Sources" },
    { value: "otp", label: "🎯 OTP" },
    { value: "matrix", label: "📊 Matrix" },
]

const monthOptions = [
    { value: "jan", label: "January" },
    { value: "feb", label: "February" },
    { value: "mar", label: "March" },
    { value: "apr", label: "April" },
    { value: "may", label: "May" },
    { value: "jun", label: "June" },
    { value: "jul", label: "July" },
    { value: "aug", label: "August" },
    { value: "sep", label: "September" },
    { value: "oct", label: "October" },
    { value: "nov", label: "November" },
    { value: "dec", label: "December" },
]

export default function ProgramsPage() {
    const [allPrograms, setAllPrograms] = useState<UnifiedProgram[]>([])
    const [filters, setFilters] = useState<ProgramFilters>({
        region: 'all',
        base: 'all',
        source: 'all',
        status: 'all',
        search: ''
    })
    const [selectedProgram, setSelectedProgram] = useState<UnifiedProgram | null>(null)
    const [showModal, setShowModal] = useState(false)
    const [isEditing, setIsEditing] = useState(false)
    const [editForm, setEditForm] = useState<ProgramUpdate>({})
    const [selectedMonth, setSelectedMonth] = useState('jan')
    const [isSaving, setIsSaving] = useState(false)

    // Load programs on mount and listen for storage events
    useEffect(() => {
        const loadPrograms = () => {
            const programs = loadUnifiedPrograms()
            setAllPrograms(programs)
        }

        loadPrograms()

        // Listen for storage events to refresh when OTP/Matrix updates
        const handleStorage = () => loadPrograms()
        window.addEventListener('storage', handleStorage)
        window.addEventListener('focus', handleStorage)

        return () => {
            window.removeEventListener('storage', handleStorage)
            window.removeEventListener('focus', handleStorage)
        }
    }, [])

    // Filtered programs
    const filteredPrograms = useMemo(() => {
        return filterPrograms(allPrograms, filters)
    }, [allPrograms, filters])

    // Stats
    const stats = useMemo(() => calculateProgramStats(filteredPrograms), [filteredPrograms])

    const handleDownload = () => {
        downloadUnifiedCSV(filteredPrograms, filters)
    }

    const handleOpenModal = (program: UnifiedProgram) => {
        setSelectedProgram(program)
        setEditForm({
            wptsId: '',
            planDate: program.planDate || '',
            implDate: program.implDate || '',
            picName: program.picName || '',
            picEmail: program.picEmail || ''
        })
        // Default to current month
        const currentMonth = new Date().getMonth()
        setSelectedMonth(monthOptions[currentMonth].value)
        setShowModal(true)
        setIsEditing(false)
    }

    const handleSave = async () => {
        if (!selectedProgram) return

        setIsSaving(true)

        const success = await updateUnifiedProgram(selectedProgram.id, {
            ...editForm,
            month: selectedMonth
        })

        if (success) {
            // Reload programs to show updated data
            const programs = loadUnifiedPrograms()
            setAllPrograms(programs)

            setShowModal(false)
            setIsEditing(false)
        }

        setIsSaving(false)
    }

    const getStatusLabel = (status: ProgramStatus): string => {
        return status === 'InProgress' ? 'In Progress' : status === 'OnHold' ? 'On Hold' : status
    }

    const getBaseLabel = (base: ProgramBase): string => {
        return base === 'all' ? 'All Bases' : base.charAt(0).toUpperCase() + base.slice(1)
    }

    return (
        <AppShell>
            <div className="space-y-4">
                {/* Header */}
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-[#27ae60] to-[#2ecc71] rounded-xl flex items-center justify-center text-2xl">
                        📋
                    </div>
                    <div className="flex-1">
                        <h1 className="text-xl font-bold text-[var(--text-primary)]">HSE Programs</h1>
                        <p className="text-xs text-[var(--text-muted)]">OTP & Matrix Program Tracker</p>
                    </div>
                </div>

                {/* Filter Toolbar */}
                <GlassCard className="p-3">
                    <div className="flex flex-wrap items-center gap-2">
                        {/* Region */}
                        <select
                            value={filters.region}
                            onChange={(e) => setFilters(f => ({ ...f, region: e.target.value as ProgramRegion | 'all' }))}
                            className="px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-light)] rounded-lg text-sm font-medium"
                        >
                            {regionOptions.map(o => (
                                <option key={o.value} value={o.value}>{o.label}</option>
                            ))}
                        </select>

                        {/* Base */}
                        <select
                            value={filters.base}
                            onChange={(e) => setFilters(f => ({ ...f, base: e.target.value as ProgramBase | 'all' }))}
                            className="px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-light)] rounded-lg text-sm font-medium"
                            disabled={filters.region === 'asia'}
                        >
                            {baseOptions.map(o => (
                                <option key={o.value} value={o.value}>{o.label}</option>
                            ))}
                        </select>

                        {/* Source */}
                        <select
                            value={filters.source}
                            onChange={(e) => setFilters(f => ({ ...f, source: e.target.value as ProgramSource | 'all' }))}
                            className="px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-light)] rounded-lg text-sm font-medium"
                        >
                            {sourceOptions.map(o => (
                                <option key={o.value} value={o.value}>{o.label}</option>
                            ))}
                        </select>

                        <div className="flex-1" />

                        {/* Download */}
                        <button
                            onClick={handleDownload}
                            className="px-4 py-2 bg-[#27ae60] text-white rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-[#219a52] transition-colors"
                        >
                            <Download className="w-4 h-4" /> Export
                        </button>
                    </div>

                    {/* Search */}
                    <div className="mt-2 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                        <input
                            type="text"
                            placeholder="Search programs..."
                            value={filters.search}
                            onChange={(e) => setFilters(f => ({ ...f, search: e.target.value }))}
                            className="w-full pl-10 pr-4 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-light)] rounded-lg text-sm"
                        />
                    </div>
                </GlassCard>

                {/* Dashboard Cards */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    <motion.div
                        whileHover={{ y: -5, scale: 1.02 }}
                        transition={{ type: "spring", stiffness: 300 }}
                    >
                        <GlassCard className="p-3 text-center cursor-pointer">
                            <div className="text-2xl font-bold text-[var(--accent-blue)]">{stats.completionRate}%</div>
                            <div className="text-xs text-[var(--text-muted)]">Completion</div>
                            <div className="mt-2 h-1.5 bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
                                <div className="h-full bg-[var(--accent-blue)] rounded-full" style={{ width: `${stats.completionRate}%` }} />
                            </div>
                        </GlassCard>
                    </motion.div>
                    <motion.div
                        whileHover={{ y: -5, scale: 1.02 }}
                        transition={{ type: "spring", stiffness: 300 }}
                    >
                        <GlassCard className="p-3 text-center cursor-pointer">
                            <div className="text-2xl font-bold text-[var(--text-primary)]">{stats.total}</div>
                            <div className="text-xs text-[var(--text-muted)]">Total Programs</div>
                        </GlassCard>
                    </motion.div>
                    <motion.div
                        whileHover={{ y: -5, scale: 1.02 }}
                        transition={{ type: "spring", stiffness: 300 }}
                    >
                        <GlassCard className="p-3 text-center cursor-pointer">
                            <div className="text-2xl font-bold text-[#3498db]">{stats.otpCount}</div>
                            <div className="text-xs text-[var(--text-muted)]">🎯 OTP</div>
                        </GlassCard>
                    </motion.div>
                    <motion.div
                        whileHover={{ y: -5, scale: 1.02 }}
                        transition={{ type: "spring", stiffness: 300 }}
                    >
                        <GlassCard className="p-3 text-center cursor-pointer">
                            <div className="text-2xl font-bold text-[#9b59b6]">{stats.matrixCount}</div>
                            <div className="text-xs text-[var(--text-muted)]">📊 Matrix</div>
                        </GlassCard>
                    </motion.div>
                    <motion.div
                        whileHover={{ y: -5, scale: 1.02 }}
                        transition={{ type: "spring", stiffness: 300 }}
                    >
                        <GlassCard className="p-3 text-center cursor-pointer">
                            <div className="text-2xl font-bold text-[var(--success-color)]">{stats.completed}</div>
                            <div className="text-xs text-[var(--text-muted)]">✅ Completed</div>
                        </GlassCard>
                    </motion.div>
                </div>

                {/* Status Filters */}
                <div className="flex flex-wrap gap-2">
                    {statusFilters.map(sf => {
                        const count = sf.value === 'all'
                            ? filteredPrograms.length
                            : filteredPrograms.filter(p => p.status === sf.value).length
                        return (
                            <button
                                key={sf.value}
                                onClick={() => setFilters(f => ({ ...f, status: sf.value }))}
                                className={cn(
                                    "px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                                    filters.status === sf.value
                                        ? "bg-[var(--accent-blue)] text-white"
                                        : "bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]/80"
                                )}
                            >
                                {sf.label} ({count})
                            </button>
                        )
                    })}
                </div>

                {/* Program Cards */}
                <div className="space-y-3">
                    {filteredPrograms.length === 0 ? (
                        <GlassCard className="p-8 text-center">
                            <div className="text-4xl mb-2">📋</div>
                            <p className="text-[var(--text-muted)]">No programs found</p>
                        </GlassCard>
                    ) : (
                        filteredPrograms.map(program => (
                            <GlassCard
                                key={program.id}
                                className="p-4 cursor-pointer hover:bg-[var(--bg-tertiary)]/50 transition-colors"
                                onClick={() => handleOpenModal(program)}
                            >
                                <div className="flex items-start gap-3">
                                    {/* Source Badge */}
                                    <div className={cn(
                                        "w-10 h-10 rounded-lg flex items-center justify-center text-white text-sm font-bold shrink-0",
                                        program.source === 'otp' ? "bg-[#3498db]" : "bg-[#9b59b6]"
                                    )}>
                                        {program.source === 'otp' ? 'O' : 'M'}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2">
                                            <div>
                                                <h3 className="font-medium text-[var(--text-primary)] text-sm leading-tight">{program.name}</h3>
                                                <div className="flex flex-wrap gap-1 mt-1">
                                                    {/* Region/Base Tag */}
                                                    <span className="px-2 py-0.5 bg-[var(--bg-tertiary)] text-[var(--text-muted)] text-[10px] rounded">
                                                        {program.region === 'asia' ? '🌏 Asia' : `🇮🇩 ${getBaseLabel(program.base)}`}
                                                    </span>
                                                    {/* Category Tag */}
                                                    {program.category !== 'other' && (
                                                        <span className="px-2 py-0.5 bg-[var(--bg-tertiary)] text-[var(--text-muted)] text-[10px] rounded">
                                                            {categoryIcons[program.category] || '📦'} {categoryLabels[program.category] || program.category}
                                                        </span>
                                                    )}
                                                    {/* Plan Type */}
                                                    {program.planType && (
                                                        <span className="px-2 py-0.5 bg-[var(--bg-tertiary)] text-[var(--text-muted)] text-[10px] rounded">
                                                            {program.planType}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            {/* Status Badge */}
                                            <span className={cn(
                                                "px-2 py-0.5 rounded text-[10px] font-medium shrink-0",
                                                statusColors[program.status]
                                            )}>
                                                {getStatusLabel(program.status)}
                                            </span>
                                        </div>

                                        {/* Meta Info */}
                                        <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-[10px] text-[var(--text-muted)]">
                                            {program.planDate && (
                                                <span>📅 Plan: {program.planDate}</span>
                                            )}
                                            {program.implDate && (
                                                <span>✅ Impl: {program.implDate}</span>
                                            )}
                                            {program.picName && (
                                                <span>👤 {program.picName}</span>
                                            )}
                                        </div>

                                        {/* Progress Bar */}
                                        <div className="mt-2">
                                            <div className="flex justify-between text-[10px] text-[var(--text-muted)] mb-0.5">
                                                <span>Progress</span>
                                                <span>{program.progress}%</span>
                                            </div>
                                            <div className="h-1.5 bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
                                                <div
                                                    className={cn(
                                                        "h-full rounded-full transition-all",
                                                        program.progress >= 100 ? "bg-[var(--success-color)]" :
                                                            program.progress > 0 ? "bg-[var(--accent-blue)]" :
                                                                "bg-[var(--warning-color)]"
                                                    )}
                                                    style={{ width: `${Math.min(program.progress, 100)}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </GlassCard>
                        ))
                    )}
                </div>

                {/* Program Edit Modal */}
                {showModal && selectedProgram && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <GlassCard className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
                            <div className="p-4 border-b border-[var(--border-light)] flex items-center justify-between">
                                <h2 className="font-bold text-lg">{isEditing ? 'Edit Program' : 'Program Details'}</h2>
                                <div className="flex items-center gap-2">
                                    {!isEditing && (
                                        <button
                                            onClick={() => setIsEditing(true)}
                                            className="p-2 bg-[var(--accent-blue)] text-white rounded-lg hover:bg-[var(--accent-blue)]/80"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                    )}
                                    <button onClick={() => { setShowModal(false); setIsEditing(false) }} className="p-2 hover:bg-[var(--bg-tertiary)] rounded-lg">
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                            <div className="p-4 space-y-4">
                                {/* Header */}
                                <div className="flex items-start gap-3">
                                    <div className={cn(
                                        "w-12 h-12 rounded-lg flex items-center justify-center text-white text-lg font-bold",
                                        selectedProgram.source === 'otp' ? "bg-[#3498db]" : "bg-[#9b59b6]"
                                    )}>
                                        {selectedProgram.source === 'otp' ? 'OTP' : 'MTX'}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-[var(--text-primary)]">{selectedProgram.name}</h3>
                                        <p className="text-sm text-[var(--text-muted)]">{selectedProgram.description || selectedProgram.planType}</p>
                                    </div>
                                </div>

                                {/* Info Grid (View Mode) */}
                                {!isEditing && (
                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                        <div>
                                            <label className="text-xs text-[var(--text-muted)]">Source</label>
                                            <div className="font-medium">{selectedProgram.source.toUpperCase()}</div>
                                        </div>
                                        <div>
                                            <label className="text-xs text-[var(--text-muted)]">Region</label>
                                            <div className="font-medium">{selectedProgram.region === 'asia' ? 'Asia' : 'Indonesia'}</div>
                                        </div>
                                        <div>
                                            <label className="text-xs text-[var(--text-muted)]">Base</label>
                                            <div className="font-medium">{getBaseLabel(selectedProgram.base)}</div>
                                        </div>
                                        <div>
                                            <label className="text-xs text-[var(--text-muted)]">Category</label>
                                            <div className="font-medium">{categoryLabels[selectedProgram.category] || selectedProgram.category}</div>
                                        </div>
                                        <div>
                                            <label className="text-xs text-[var(--text-muted)]">Status</label>
                                            <div className={cn("inline-block px-2 py-0.5 rounded text-xs font-medium", statusColors[selectedProgram.status])}>
                                                {getStatusLabel(selectedProgram.status)}
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-xs text-[var(--text-muted)]">Progress</label>
                                            <div className="font-medium">{selectedProgram.progress}%</div>
                                        </div>
                                        {selectedProgram.planDate && (
                                            <div>
                                                <label className="text-xs text-[var(--text-muted)]">Plan Date</label>
                                                <div className="font-medium">{selectedProgram.planDate}</div>
                                            </div>
                                        )}
                                        {selectedProgram.implDate && (
                                            <div>
                                                <label className="text-xs text-[var(--text-muted)]">Implementation Date</label>
                                                <div className="font-medium">{selectedProgram.implDate}</div>
                                            </div>
                                        )}
                                        {selectedProgram.picName && (
                                            <div className="col-span-2">
                                                <label className="text-xs text-[var(--text-muted)]">PIC</label>
                                                <div className="font-medium">{selectedProgram.picName}</div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Edit Form */}
                                {isEditing && (
                                    <div className="space-y-4">
                                        <div className="p-3 bg-[var(--bg-tertiary)] rounded-lg text-xs text-[var(--text-muted)]">
                                            ℹ️ Changes will sync back to {selectedProgram.source === 'otp' ? 'OTP' : 'Matrix'} screen for the selected month.
                                        </div>

                                        {/* Target Month */}
                                        <div>
                                            <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Target Month *</label>
                                            <select
                                                value={selectedMonth}
                                                onChange={(e) => setSelectedMonth(e.target.value)}
                                                className="w-full px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-light)] rounded-lg text-sm"
                                            >
                                                {monthOptions.map(m => (
                                                    <option key={m.value} value={m.value}>{m.label}</option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* WPTS ID */}
                                        <div>
                                            <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">WPTS ID</label>
                                            <input
                                                type="text"
                                                value={editForm.wptsId || ''}
                                                onChange={(e) => setEditForm(f => ({ ...f, wptsId: e.target.value }))}
                                                placeholder="Enter WPTS ID"
                                                className="w-full px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-light)] rounded-lg text-sm"
                                            />
                                        </div>

                                        {/* Plan Date */}
                                        <div>
                                            <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Plan Date</label>
                                            <input
                                                type="date"
                                                value={editForm.planDate || ''}
                                                onChange={(e) => setEditForm(f => ({ ...f, planDate: e.target.value }))}
                                                className="w-full px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-light)] rounded-lg text-sm"
                                            />
                                        </div>

                                        {/* Implementation Date */}
                                        <div>
                                            <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Implementation Date</label>
                                            <input
                                                type="date"
                                                value={editForm.implDate || ''}
                                                onChange={(e) => setEditForm(f => ({ ...f, implDate: e.target.value }))}
                                                className="w-full px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-light)] rounded-lg text-sm"
                                            />
                                            <p className="text-[10px] text-[var(--text-muted)] mt-1">Setting this will mark the program as completed for this month</p>
                                        </div>

                                        {/* PIC Name */}
                                        <div>
                                            <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">PIC Name</label>
                                            <input
                                                type="text"
                                                value={editForm.picName || ''}
                                                onChange={(e) => setEditForm(f => ({ ...f, picName: e.target.value }))}
                                                placeholder="Enter PIC name"
                                                className="w-full px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-light)] rounded-lg text-sm"
                                            />
                                        </div>

                                        {/* PIC Email */}
                                        <div>
                                            <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">PIC Email</label>
                                            <input
                                                type="email"
                                                value={editForm.picEmail || ''}
                                                onChange={(e) => setEditForm(f => ({ ...f, picEmail: e.target.value }))}
                                                placeholder="Enter PIC email"
                                                className="w-full px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-light)] rounded-lg text-sm"
                                            />
                                        </div>

                                        {/* Save Button */}
                                        <div className="flex gap-2 pt-2">
                                            <button
                                                onClick={() => setIsEditing(false)}
                                                className="flex-1 px-4 py-2 bg-[var(--bg-tertiary)] text-[var(--text-primary)] rounded-lg text-sm font-medium"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={handleSave}
                                                disabled={isSaving}
                                                className="flex-1 px-4 py-2 bg-[var(--accent-blue)] text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                                            >
                                                <Save className="w-4 h-4" />
                                                {isSaving ? 'Saving...' : 'Save & Sync'}
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Progress Bar (View Mode) */}
                                {!isEditing && (
                                    <div>
                                        <div className="flex justify-between text-xs text-[var(--text-muted)] mb-1">
                                            <span>Overall Progress</span>
                                            <span>{selectedProgram.progress}%</span>
                                        </div>
                                        <div className="h-2 bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
                                            <div
                                                className={cn(
                                                    "h-full rounded-full",
                                                    selectedProgram.progress >= 100 ? "bg-[var(--success-color)]" :
                                                        selectedProgram.progress > 0 ? "bg-[var(--accent-blue)]" :
                                                            "bg-[var(--warning-color)]"
                                                )}
                                                style={{ width: `${Math.min(selectedProgram.progress, 100)}%` }}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </GlassCard>
                    </div>
                )}
            </div>
        </AppShell>
    )
}
