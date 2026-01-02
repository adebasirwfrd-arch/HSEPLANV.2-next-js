"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import { motion } from "framer-motion"
import { AppShell } from "@/components/layout/app-shell"
import { GlassCard } from "@/components/ui/glass-card"
import { cn } from "@/lib/utils"
import { Plus, Download, X, Trash2, AlertTriangle, Paperclip, Upload, FileText, ExternalLink, Search, CheckCircle, Clock, PlayCircle, Filter } from "lucide-react"
import {
    loadTasks,
    addTask,
    updateTask,
    deleteTask,
    downloadTasksCSV,
    filterTasks,
    frequencyLabels,
    taskStatusColors,
    getReminderHint,
    regionOptions,
    baseOptionsByRegion,
    type Task,
    type TaskStatus,
    type TaskFrequency,
    type TaskAttachment,
    type TaskRegion,
    type TaskBase,
    type TaskFilters
} from "@/lib/tasks-store"
import { loadPrograms, type Program } from "@/lib/programs-store"
import { getOTPData, type OTPProgram } from "@/lib/otp-store"

type FilterStatus = 'all' | TaskStatus

const statusFilters: { value: FilterStatus; label: string }[] = [
    { value: "all", label: "All" },
    { value: "Upcoming", label: "Planned" },
    { value: "In Progress", label: "In Progress" },
    { value: "Completed", label: "Implemented" },
]

const yearOptions = [2024, 2025, 2026, 2027, 2028, 2029, 2030]

export default function TasksPage() {
    const [tasks, setTasks] = useState<Task[]>([])
    const [programs, setPrograms] = useState<Program[]>([])
    const [filters, setFilters] = useState<TaskFilters>({
        region: 'all',
        base: 'all',
        year: 'all',
        status: 'all'
    })
    const [searchQuery, setSearchQuery] = useState("")
    const [createModal, setCreateModal] = useState(false)
    const [editModal, setEditModal] = useState<Task | null>(null)
    const [deleteModal, setDeleteModal] = useState<{ id: string; title: string } | null>(null)

    useEffect(() => {
        setTasks(loadTasks())
        setPrograms(loadPrograms())
    }, [])

    // Get base options based on selected region
    const currentBaseOptions = baseOptionsByRegion[filters.region as TaskRegion | 'all'] || baseOptionsByRegion['all']

    // Filter and search tasks
    const filteredTasks = filterTasks(tasks, filters).filter(t => {
        if (searchQuery === "") return true
        const q = searchQuery.toLowerCase()
        return t.title.toLowerCase().includes(q) ||
            t.code.toLowerCase().includes(q) ||
            t.programName.toLowerCase().includes(q) ||
            t.picName.toLowerCase().includes(q)
    })

    // Dashboard stats (from all tasks)
    const totalTasks = tasks.length
    const completedTasks = tasks.filter(t => t.status === 'Completed').length
    const inProgressTasks = tasks.filter(t => t.status === 'In Progress').length
    const upcomingTasks = tasks.filter(t => t.status === 'Upcoming').length
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

    // Filtered counts
    const getFilteredCounts = (status: FilterStatus) => {
        const filtered = filterTasks(tasks, { ...filters, status: 'all' })
        if (status === "all") return filtered.length
        return filtered.filter(t => t.status === status).length
    }

    const handleCreate = async (data: Omit<Task, 'id' | 'createdAt'>) => {
        addTask(data)
        setTasks(loadTasks())
        setCreateModal(false)

        // Auto-sync to Google Calendar if has implementation date
        if (data.implementationDate) {
            try {
                await fetch('/api/calendar/sync', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        action: 'sync_single',
                        event: {
                            name: `${data.code}: ${data.title}`,
                            pic: data.picName || '-',
                            wpts_id: data.wptsId || '-',
                            plan_date: data.implementationDate,
                            source: 'task'
                        }
                    })
                })
            } catch {
                // Silent fail
            }
        }
    }

    const handleUpdate = async (id: string, data: Partial<Task>) => {
        updateTask(id, data)
        setTasks(loadTasks())
        setEditModal(null)

        // Auto-sync to Google Calendar if has implementation date
        if (data.implementationDate) {
            try {
                const fullTask = tasks.find(t => t.id === id)
                await fetch('/api/calendar/sync', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        action: 'sync_single',
                        event: {
                            name: `${data.code || fullTask?.code || ''}: ${data.title || fullTask?.title || ''}`,
                            pic: data.picName || fullTask?.picName || '-',
                            wpts_id: data.wptsId || fullTask?.wptsId || '-',
                            plan_date: data.implementationDate,
                            source: 'task'
                        }
                    })
                })
            } catch {
                // Silent fail
            }
        }
    }

    const handleDelete = (id: string) => {
        deleteTask(id)
        setTasks(loadTasks())
        setDeleteModal(null)
    }

    const TaskForm = ({ task, onSave, onCancel, title }: {
        task?: Task
        onSave: (data: Omit<Task, 'id' | 'createdAt'>) => void
        onCancel: () => void
        title: string
    }) => {
        const [status, setStatus] = useState<TaskStatus>(task?.status || 'Upcoming')
        const [frequency, setFrequency] = useState<TaskFrequency>(task?.frequency || 'once')
        const [selectedProgramId, setSelectedProgramId] = useState(task?.programId || '')
        const [wptsId, setWptsId] = useState(task?.wptsId || '')
        const [attachments, setAttachments] = useState<TaskAttachment[]>(task?.attachments || [])
        const [uploading, setUploading] = useState(false)
        const fileInputRef = useRef<HTMLInputElement>(null)
        const [taskCode, setTaskCode] = useState(task?.code || '')
        const [taskRegion, setTaskRegion] = useState<TaskRegion>(task?.region || 'indonesia')
        const [taskBase, setTaskBase] = useState<TaskBase>(task?.base || 'narogong')
        const [taskYear, setTaskYear] = useState(task?.year || 2026)

        // Load OTP programs dynamically based on region and base
        const otpPrograms = useMemo(() => {
            try {
                // Map task base to OTP base format
                const otpBase = taskRegion === 'asia' ? '' : (taskBase === 'asia-hq' ? '' : taskBase)
                const data = getOTPData(taskRegion === 'asia' ? 'asia' : 'indonesia', otpBase)
                return data.programs.map(p => ({
                    id: `otp_${taskRegion}_${taskBase}_${p.id}`,
                    name: p.name,
                    originalId: p.id
                }))
            } catch (e) {
                console.error('Error loading OTP programs:', e)
                return []
            }
        }, [taskRegion, taskBase])

        const selectedProgram = otpPrograms.find(p => p.id === selectedProgramId)
        const formBaseOptions = baseOptionsByRegion[taskRegion] || baseOptionsByRegion['indonesia']

        // Reset base and program when region changes
        useEffect(() => {
            if (taskRegion === 'asia') {
                setTaskBase('asia-hq')
            } else if (taskBase === 'asia-hq') {
                setTaskBase('narogong')
            }
            setSelectedProgramId('') // Reset program selection when region changes
        }, [taskRegion])

        // Reset program selection when base changes
        useEffect(() => {
            setSelectedProgramId('')
        }, [taskBase])

        const handleFileUpload = async (files: FileList | null) => {
            if (!files || files.length === 0 || !selectedProgram) return

            setUploading(true)
            const newAttachments: TaskAttachment[] = []

            for (const file of Array.from(files)) {
                try {
                    const formData = new FormData()
                    formData.append('file', file)
                    formData.append('programName', selectedProgram.name)
                    formData.append('taskCode', taskCode)

                    const res = await fetch('/api/drive', {
                        method: 'POST',
                        body: formData
                    })

                    if (res.ok) {
                        const data = await res.json()
                        newAttachments.push(data.file)
                    } else {
                        const errorText = await res.text()
                        console.error('Upload failed:', errorText)
                        alert(`Upload failed: ${errorText}`)
                    }
                } catch (error) {
                    console.error('Upload error:', error)
                    alert(`Upload error: ${error}`)
                }
            }

            setAttachments([...attachments, ...newAttachments])
            setUploading(false)
            if (fileInputRef.current) fileInputRef.current.value = ''
        }

        const removeAttachment = (id: string) => {
            setAttachments(attachments.filter(a => a.id !== id))
        }

        return (
            <div className="fixed inset-0 bg-black/50 z-[300] flex items-center justify-center p-4">
                <div className="bg-[var(--bg-primary)] rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
                    <div className="p-4 border-b border-[var(--border-light)] flex justify-between items-center sticky top-0 bg-[var(--bg-primary)]">
                        <h3 className="font-bold">{title}</h3>
                        <button onClick={onCancel} className="p-1 hover:bg-[var(--bg-tertiary)] rounded">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    <form
                        onSubmit={(e) => {
                            e.preventDefault()
                            const form = e.target as HTMLFormElement
                            onSave({
                                programId: selectedProgramId,
                                programName: selectedProgram?.name || 'Unknown Program',
                                code: taskCode,
                                title: (form.elements.namedItem("taskTitle") as HTMLTextAreaElement).value,
                                implementationDate: (form.elements.namedItem("implementationDate") as HTMLInputElement).value,
                                frequency,
                                picName: (form.elements.namedItem("picName") as HTMLInputElement).value,
                                picEmail: (form.elements.namedItem("picEmail") as HTMLInputElement).value,
                                status,
                                region: taskRegion,
                                base: taskBase,
                                year: taskYear,
                                wptsId,
                                attachments,
                                hasAttachment: attachments.length > 0,
                            })
                        }}
                        className="p-4 space-y-4"
                    >
                        {/* Region / Base / Year Row */}
                        <div className="grid grid-cols-3 gap-2">
                            <div>
                                <label className="block text-xs font-medium mb-1">Region *</label>
                                <select
                                    value={taskRegion}
                                    onChange={(e) => setTaskRegion(e.target.value as TaskRegion)}
                                    className="w-full p-2 border border-[var(--border-light)] rounded-lg bg-[var(--bg-secondary)] text-sm"
                                >
                                    <option value="indonesia">🇮🇩 Indonesia</option>
                                    <option value="asia">🌏 Asia</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium mb-1">Base *</label>
                                <select
                                    value={taskBase}
                                    onChange={(e) => setTaskBase(e.target.value as TaskBase)}
                                    className="w-full p-2 border border-[var(--border-light)] rounded-lg bg-[var(--bg-secondary)] text-sm"
                                >
                                    {formBaseOptions.filter(b => b.value !== 'all').map(b => (
                                        <option key={b.value} value={b.value}>{b.label.replace(/[^\w\s]/g, '')}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium mb-1">Year *</label>
                                <select
                                    value={taskYear}
                                    onChange={(e) => setTaskYear(parseInt(e.target.value))}
                                    className="w-full p-2 border border-[var(--border-light)] rounded-lg bg-[var(--bg-secondary)] text-sm"
                                >
                                    {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-medium mb-1">HSE Program * ({otpPrograms.length} programs)</label>
                            <select
                                value={selectedProgramId}
                                onChange={(e) => setSelectedProgramId(e.target.value)}
                                required
                                className="w-full p-2 border border-[var(--border-light)] rounded-lg bg-[var(--bg-secondary)]"
                            >
                                <option value="">Select Program</option>
                                {otpPrograms.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-medium mb-1">Task ID/Code *</label>
                            <input
                                name="code"
                                type="text"
                                required
                                value={taskCode}
                                onChange={(e) => setTaskCode(e.target.value)}
                                className="w-full p-2 border border-[var(--border-light)] rounded-lg bg-[var(--bg-secondary)]"
                                placeholder="e.g. T-001"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium mb-1">Task Description *</label>
                            <textarea name="taskTitle" rows={2} required defaultValue={task?.title || ""} className="w-full p-2 border border-[var(--border-light)] rounded-lg bg-[var(--bg-secondary)]" placeholder="Describe the task..." />
                        </div>

                        <div>
                            <label className="block text-xs font-medium mb-1">Implementation Plan Date *</label>
                            <input name="implementationDate" type="date" required defaultValue={task?.implementationDate || ""} className="w-full p-2 border border-[var(--border-light)] rounded-lg bg-[var(--bg-secondary)]" />
                        </div>

                        <div>
                            <label className="block text-xs font-medium mb-1">Frequency *</label>
                            <select value={frequency} onChange={(e) => setFrequency(e.target.value as TaskFrequency)} className="w-full p-2 border border-[var(--border-light)] rounded-lg bg-[var(--bg-secondary)]">
                                {Object.entries(frequencyLabels).map(([key, label]) => (
                                    <option key={key} value={key}>{label}</option>
                                ))}
                            </select>
                            <p className="text-xs text-[var(--text-muted)] mt-1">{getReminderHint(frequency)}</p>
                        </div>

                        <div>
                            <label className="block text-xs font-medium mb-1">PIC Name *</label>
                            <input name="picName" type="text" required defaultValue={task?.picName || ""} className="w-full p-2 border border-[var(--border-light)] rounded-lg bg-[var(--bg-secondary)]" placeholder="Person in Charge name" />
                        </div>

                        <div>
                            <label className="block text-xs font-medium mb-1">PIC Email *</label>
                            <input name="picEmail" type="email" required defaultValue={task?.picEmail || ""} className="w-full p-2 border border-[var(--border-light)] rounded-lg bg-[var(--bg-secondary)]" placeholder="email@company.com" />
                            <p className="text-xs text-[var(--text-muted)] mt-1">Email notifications will be sent to this address</p>
                        </div>

                        <div>
                            <label className="block text-xs font-medium mb-1">Status</label>
                            <div className="flex flex-wrap gap-2">
                                {(['Upcoming', 'In Progress', 'Completed'] as TaskStatus[]).map(s => (
                                    <button key={s} type="button" onClick={() => setStatus(s)} className={cn("px-3 py-1.5 rounded-full text-xs font-medium transition-all", status === s ? taskStatusColors[s] : "bg-[var(--bg-tertiary)] text-[var(--text-secondary)]")}>
                                        {s === 'Upcoming' ? 'Planned' : s === 'Completed' ? 'Implemented' : s}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* WPTS ID Field */}
                        <div>
                            <label className="block text-xs font-medium mb-1">WPTS ID</label>
                            <input
                                type="text"
                                value={wptsId}
                                onChange={(e) => setWptsId(e.target.value)}
                                className="w-full p-2 border border-[var(--border-light)] rounded-lg bg-[var(--bg-secondary)]"
                                placeholder="Enter WPTS ID (optional)"
                            />
                        </div>

                        {/* Attachment Upload */}
                        <div>
                            <label className="block text-xs font-medium mb-1">Attachments</label>
                            <div
                                onClick={() => selectedProgramId && taskCode && fileInputRef.current?.click()}
                                className={cn(
                                    "border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-all",
                                    selectedProgramId && taskCode
                                        ? "border-[var(--accent-blue)] hover:bg-[var(--accent-blue)]/5"
                                        : "border-[var(--border-light)] opacity-50 cursor-not-allowed"
                                )}
                            >
                                {uploading ? (
                                    <div className="text-[var(--accent-blue)]">
                                        <p className="font-medium">Uploading...</p>
                                        <p className="text-xs">Please wait</p>
                                    </div>
                                ) : (
                                    <>
                                        <Upload className="w-6 h-6 mx-auto mb-2 text-[var(--text-muted)]" />
                                        <p className="text-sm text-[var(--text-secondary)]">Click to upload files</p>
                                        <p className="text-xs text-[var(--text-muted)]">Files stored in Google Drive</p>
                                    </>
                                )}
                            </div>
                            <input
                                ref={fileInputRef}
                                type="file"
                                multiple
                                className="hidden"
                                onChange={(e) => handleFileUpload(e.target.files)}
                                disabled={!selectedProgramId || !taskCode || uploading}
                            />
                            {(!selectedProgramId || !taskCode) && (
                                <p className="text-xs text-[var(--warning-color)] mt-1">Select a program and enter task code first</p>
                            )}
                        </div>

                        {/* Attachment List */}
                        {attachments.length > 0 && (
                            <div>
                                <label className="block text-xs font-medium mb-1">Uploaded Files ({attachments.length})</label>
                                <div className="space-y-2 max-h-32 overflow-y-auto">
                                    {attachments.map(a => (
                                        <div key={a.id} className="flex items-center gap-2 p-2 bg-[var(--bg-tertiary)] rounded-lg">
                                            <FileText className="w-4 h-4 text-[var(--success-color)]" />
                                            <span className="flex-1 text-sm truncate">{a.filename}</span>
                                            <a
                                                href={a.driveUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                onClick={(e) => e.stopPropagation()}
                                                className="p-1 text-[var(--accent-blue)] hover:bg-[var(--accent-blue)]/10 rounded"
                                            >
                                                <ExternalLink className="w-3 h-3" />
                                            </a>
                                            <button
                                                type="button"
                                                onClick={() => removeAttachment(a.id)}
                                                className="p-1 text-[var(--danger-color)] hover:bg-[var(--danger-color)]/10 rounded"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="flex gap-2 pt-2">
                            <button type="button" onClick={onCancel} className="flex-1 p-2 border border-[var(--border-light)] rounded-lg hover:bg-[var(--bg-tertiary)]">Cancel</button>
                            <button type="submit" className="flex-1 p-2 bg-[var(--accent-blue)] text-white rounded-lg font-semibold">{task ? 'Save Changes' : 'Save Task'}</button>
                        </div>
                    </form>
                </div>
            </div>
        )
    }

    return (
        <AppShell>
            <div className="space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-[var(--accent-blue)] to-[var(--accent-sky)] rounded-xl flex items-center justify-center">
                            <CheckCircle className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-[var(--text-primary)]">Tasks</h1>
                            <p className="text-xs text-[var(--text-muted)]">HSE Implementation Tasks</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => downloadTasksCSV(filteredTasks)} className="px-3 py-2 border border-[#27ae60] text-[#27ae60] rounded-lg text-xs font-semibold flex items-center gap-1 hover:bg-[#27ae60]/10">
                            <Download className="w-3 h-3" /> Export
                        </button>
                        <button onClick={() => setCreateModal(true)} className="bg-gradient-to-r from-[var(--accent-blue)] to-[var(--accent-sky)] text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2">
                            <Plus className="w-4 h-4" /> Create Task
                        </button>
                    </div>
                </div>

                {/* Dashboard Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <motion.div whileHover={{ y: -5, scale: 1.02 }} transition={{ type: "spring", stiffness: 300 }}>
                        <GlassCard className="p-4 cursor-pointer shadow-inner">
                            <div className="flex items-center gap-2 mb-2">
                                <CheckCircle className="w-5 h-5 text-[var(--accent-blue)]" />
                                <span className="text-sm text-[var(--text-secondary)] font-medium">Completion</span>
                            </div>
                            <div className="text-2xl font-bold text-[var(--text-primary)]">{completionRate}%</div>
                            <div className="w-full h-2 bg-[var(--accent-blue)]/20 rounded-full mt-2">
                                <div className="h-full bg-[var(--accent-blue)] rounded-full transition-all" style={{ width: `${completionRate}%` }} />
                            </div>
                        </GlassCard>
                    </motion.div>
                    <motion.div whileHover={{ y: -5, scale: 1.02 }} transition={{ type: "spring", stiffness: 300 }}>
                        <GlassCard className="p-4 cursor-pointer">
                            <div className="flex items-center gap-2 mb-2">
                                <CheckCircle className="w-5 h-5 text-[#27ae60]" />
                                <span className="text-xs text-[var(--text-muted)]">Completed</span>
                            </div>
                            <div className="text-xl font-bold text-[#27ae60]">{completedTasks}</div>
                        </GlassCard>
                    </motion.div>
                    <motion.div whileHover={{ y: -5, scale: 1.02 }} transition={{ type: "spring", stiffness: 300 }}>
                        <GlassCard className="p-4 cursor-pointer">
                            <div className="flex items-center gap-2 mb-2">
                                <PlayCircle className="w-5 h-5 text-[#3498db]" />
                                <span className="text-xs text-[var(--text-muted)]">In Progress</span>
                            </div>
                            <div className="text-xl font-bold text-[#3498db]">{inProgressTasks}</div>
                        </GlassCard>
                    </motion.div>
                    <motion.div whileHover={{ y: -5, scale: 1.02 }} transition={{ type: "spring", stiffness: 300 }}>
                        <GlassCard className="p-4 cursor-pointer">
                            <div className="flex items-center gap-2 mb-2">
                                <Clock className="w-5 h-5 text-[#f39c12]" />
                                <span className="text-xs text-[var(--text-muted)]">Upcoming</span>
                            </div>
                            <div className="text-xl font-bold text-[#f39c12]">{upcomingTasks}</div>
                        </GlassCard>
                    </motion.div>
                </div>

                {/* Filter Bar */}
                <GlassCard className="p-3">
                    <div className="flex items-center gap-2 mb-2">
                        <Filter className="w-4 h-4 text-[var(--text-muted)]" />
                        <span className="text-xs font-medium text-[var(--text-muted)]">Filters</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <select
                            value={filters.region}
                            onChange={(e) => {
                                const newRegion = e.target.value as TaskFilters['region']
                                setFilters(f => ({ ...f, region: newRegion, base: 'all' }))
                            }}
                            className="px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-light)] rounded-lg text-xs font-medium"
                        >
                            {regionOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                        <select
                            value={filters.base}
                            onChange={(e) => setFilters(f => ({ ...f, base: e.target.value as TaskFilters['base'] }))}
                            className="px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-light)] rounded-lg text-xs font-medium"
                            disabled={filters.region === 'asia'}
                        >
                            {currentBaseOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                        <select
                            value={filters.year === 'all' ? 'all' : filters.year}
                            onChange={(e) => setFilters(f => ({ ...f, year: e.target.value === 'all' ? 'all' : parseInt(e.target.value) }))}
                            className="px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-light)] rounded-lg text-xs font-medium"
                        >
                            <option value="all">All Years</option>
                            {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                    </div>
                </GlassCard>

                {/* Search Bar */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                    <input
                        type="text"
                        placeholder="Search tasks by title, code, program, or PIC..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-[var(--bg-secondary)] border border-[var(--border-light)] rounded-xl text-sm"
                    />
                </div>

                {/* Status Filters */}
                <div className="flex flex-wrap gap-2 pb-2 overflow-x-auto hide-scrollbar">
                    {statusFilters.map((filter) => (
                        <button
                            key={filter.value}
                            onClick={() => setFilters(f => ({ ...f, status: filter.value }))}
                            className={cn(
                                "flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap",
                                filters.status === filter.value
                                    ? "bg-[var(--accent-blue)] text-white"
                                    : "bg-[var(--bg-tertiary)] text-[var(--text-secondary)]"
                            )}
                        >
                            <span className={cn("w-2 h-2 rounded-full", filters.status === filter.value ? "bg-white" : "bg-[var(--text-muted)]")} />
                            {filter.label}
                            <span className="opacity-70">({getFilteredCounts(filter.value)})</span>
                        </button>
                    ))}
                </div>

                {/* Tasks List */}
                <div className="space-y-3">
                    {filteredTasks.length === 0 ? (
                        <GlassCard className="p-8 text-center">
                            <p className="text-[var(--text-muted)]">
                                {searchQuery ? "No tasks match your search." : "No tasks found. Click \"Create Task\" to add one."}
                            </p>
                        </GlassCard>
                    ) : (
                        filteredTasks.map((task) => (
                            <GlassCard key={task.id} className="p-4 hover:translate-x-1 transition-transform cursor-pointer" onClick={() => setEditModal(task)}>
                                <div className="flex items-start justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[var(--accent-blue)] font-semibold text-sm">{task.code}</span>
                                        <span className="text-[10px] px-1.5 py-0.5 bg-[var(--bg-tertiary)] rounded text-[var(--text-muted)]">
                                            {task.region === 'indonesia' ? '🇮🇩' : '🌏'} {task.base}
                                        </span>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setDeleteModal({ id: task.id, title: task.title }) }}
                                            className="p-1 text-[var(--text-muted)] hover:text-[var(--danger-color)] hover:bg-[var(--danger-color)]/10 rounded transition-colors"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                    <span className={cn("px-2 py-1 rounded-full text-[10px] font-semibold uppercase", taskStatusColors[task.status])}>
                                        {task.status === 'Upcoming' ? 'Planned' : task.status === 'Completed' ? 'Implemented' : task.status}
                                    </span>
                                </div>
                                <h3 className="font-semibold text-[var(--text-primary)] mb-2">{task.title}</h3>
                                <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
                                    <span className="bg-[var(--bg-tertiary)] px-2 py-1 rounded">{task.programName}</span>
                                    <div className="flex items-center gap-3">
                                        {task.attachments && task.attachments.length > 0 && (
                                            <span className="flex items-center gap-1 text-[var(--success-color)]">
                                                <Paperclip className="w-3 h-3" /> {task.attachments.length}
                                            </span>
                                        )}
                                        {task.wptsId && (
                                            <span className="text-[var(--success-color)] font-medium">WPTS: {task.wptsId}</span>
                                        )}
                                        <span>{task.implementationDate}</span>
                                    </div>
                                </div>
                                <div className="mt-2 text-xs text-[var(--text-muted)]">
                                    <span className="inline-block bg-[var(--accent-blue)]/10 text-[var(--accent-blue)] px-2 py-0.5 rounded">{frequencyLabels[task.frequency]}</span>
                                    <span className="ml-2">PIC: {task.picName}</span>
                                    <span className="ml-2 text-[var(--text-muted)]">({task.year})</span>
                                </div>
                            </GlassCard>
                        ))
                    )}
                </div>

                {/* Create Modal */}
                {createModal && (
                    <TaskForm title="Create New Task" onSave={(data) => handleCreate(data)} onCancel={() => setCreateModal(false)} />
                )}

                {/* Edit Modal */}
                {editModal && (
                    <div className="fixed inset-0 bg-black/50 z-[300] flex items-center justify-center p-4">
                        <div className="bg-[var(--bg-primary)] rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
                            <div className="p-4 border-b border-[var(--border-light)] flex justify-between items-center sticky top-0 bg-[var(--bg-primary)]">
                                <h3 className="font-bold">Edit Task</h3>
                                <div className="flex gap-2">
                                    <button onClick={() => setDeleteModal({ id: editModal.id, title: editModal.title })} className="p-1 text-[var(--danger-color)] hover:bg-[var(--danger-color)]/10 rounded">
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                    <button onClick={() => setEditModal(null)} className="p-1 hover:bg-[var(--bg-tertiary)] rounded">
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                            <TaskForm task={editModal} title="" onSave={(data) => handleUpdate(editModal.id, data)} onCancel={() => setEditModal(null)} />
                        </div>
                    </div>
                )}

                {/* Delete Modal */}
                {deleteModal && (
                    <div className="fixed inset-0 bg-black/50 z-[400] flex items-center justify-center p-4">
                        <div className="bg-[var(--bg-primary)] rounded-xl w-full max-w-sm">
                            <div className="p-6 text-center">
                                <div className="w-16 h-16 mx-auto mb-4 bg-[var(--danger-color)]/10 rounded-full flex items-center justify-center">
                                    <AlertTriangle className="w-8 h-8 text-[var(--danger-color)]" />
                                </div>
                                <h3 className="text-lg font-bold mb-2">Delete Task?</h3>
                                <p className="text-sm text-[var(--text-muted)] mb-4">Are you sure you want to delete <strong>&quot;{deleteModal.title}&quot;</strong>?</p>
                                <div className="flex gap-3">
                                    <button onClick={() => setDeleteModal(null)} className="flex-1 p-3 border border-[var(--border-light)] rounded-lg hover:bg-[var(--bg-tertiary)] font-medium">Cancel</button>
                                    <button onClick={() => { handleDelete(deleteModal.id); setEditModal(null) }} className="flex-1 p-3 bg-[var(--danger-color)] text-white rounded-lg font-semibold">Delete</button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AppShell>
    )
}
