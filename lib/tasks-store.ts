// Tasks Store - HSE Tasks CRUD with localStorage and Program linking

export type TaskStatus = 'Upcoming' | 'In Progress' | 'Completed'
export type TaskFrequency = 'once' | 'monthly' | 'quarterly' | 'semi-annual' | 'annual'
export type TaskRegion = 'indonesia' | 'asia'
export type TaskBase = 'narogong' | 'balikpapan' | 'duri' | 'asia-hq'

export interface TaskAttachment {
    id: string
    filename: string
    driveFileId: string
    driveUrl: string
    uploadedAt: string
}

export interface Task {
    id: string
    programId: string
    programName: string
    code: string
    title: string
    implementationDate: string
    frequency: TaskFrequency
    picName: string
    picEmail: string
    status: TaskStatus
    region: TaskRegion
    base: TaskBase
    year: number
    wptsId?: string
    attachments?: TaskAttachment[]
    hasAttachment?: boolean
    createdAt: string
}

export interface TaskFilters {
    region: 'all' | TaskRegion
    base: 'all' | TaskBase
    year: 'all' | number
    status: 'all' | TaskStatus
}

const STORAGE_KEY = 'hse-tasks-data'

// Region options
export const regionOptions = [
    { value: 'all' as const, label: '🌍 All Regions' },
    { value: 'indonesia' as const, label: '🇮🇩 Indonesia' },
    { value: 'asia' as const, label: '🌏 Asia' },
]

// Base options by region
export const baseOptionsByRegion: Record<TaskRegion | 'all', { value: string; label: string }[]> = {
    'all': [
        { value: 'all', label: 'All Bases' },
        { value: 'narogong', label: '🏭 Narogong' },
        { value: 'balikpapan', label: '🏭 Balikpapan' },
        { value: 'duri', label: '🏭 Duri' },
        { value: 'asia-hq', label: '🏢 Asia HQ' },
    ],
    'indonesia': [
        { value: 'all', label: 'All Bases' },
        { value: 'narogong', label: '🏭 Narogong' },
        { value: 'balikpapan', label: '🏭 Balikpapan' },
        { value: 'duri', label: '🏭 Duri' },
    ],
    'asia': [
        { value: 'all', label: 'All Bases' },
        { value: 'asia-hq', label: '🏢 Asia HQ' },
    ],
}

// Frequency labels
export const frequencyLabels: Record<TaskFrequency, string> = {
    'once': 'Once (Ad-hoc)',
    'monthly': 'Monthly',
    'quarterly': 'Quarterly (Every 3 Months)',
    'semi-annual': 'Semi-Annual (Every 6 Months)',
    'annual': 'Annual (Yearly)'
}

// Status colors
export const taskStatusColors: Record<TaskStatus, string> = {
    'Upcoming': 'bg-[var(--warning-color)] text-black',
    'In Progress': 'bg-[var(--success-color)] text-white',
    'Completed': 'bg-[#4A90D9] text-white'
}

// Default tasks with region/base/year
const defaultTasks: Task[] = [
    {
        id: '1',
        programId: '1',
        programName: 'HSE Training Q1',
        code: 'HSE-001',
        title: 'Conduct Safety Induction Training',
        implementationDate: '2026-01-20',
        frequency: 'once',
        picName: 'John Doe',
        picEmail: 'john.doe@company.com',
        status: 'Completed',
        region: 'indonesia',
        base: 'narogong',
        year: 2026,
        hasAttachment: true,
        createdAt: '2026-01-01'
    },
    {
        id: '2',
        programId: '2',
        programName: 'Fire Drill Exercise',
        code: 'HSE-002',
        title: 'Fire Extinguisher Inspection',
        implementationDate: '2026-06-15',
        frequency: 'monthly',
        picName: 'Jane Smith',
        picEmail: 'jane.smith@company.com',
        status: 'In Progress',
        region: 'indonesia',
        base: 'balikpapan',
        year: 2026,
        hasAttachment: false,
        createdAt: '2026-06-01'
    },
    {
        id: '3',
        programId: '3',
        programName: 'RADAR Card Campaign',
        code: 'HSE-003',
        title: 'Hazard Identification Walk-through',
        implementationDate: '2026-07-05',
        frequency: 'quarterly',
        picName: 'Mike Chen',
        picEmail: 'mike.chen@company.com',
        status: 'Upcoming',
        region: 'indonesia',
        base: 'duri',
        year: 2026,
        hasAttachment: false,
        createdAt: '2026-06-15'
    },
    {
        id: '4',
        programId: '1',
        programName: 'HSE Training Q1',
        code: 'HSE-004',
        title: 'PPE Distribution & Training',
        implementationDate: '2026-02-10',
        frequency: 'annual',
        picName: 'Lisa Park',
        picEmail: 'lisa.park@company.com',
        status: 'Completed',
        region: 'asia',
        base: 'asia-hq',
        year: 2026,
        hasAttachment: true,
        createdAt: '2026-01-15'
    },
    {
        id: '5',
        programId: '2',
        programName: 'Fire Drill Exercise',
        code: 'HSE-005',
        title: 'Emergency Evacuation Drill',
        implementationDate: '2026-06-28',
        frequency: 'semi-annual',
        picName: 'Alex Wong',
        picEmail: 'alex.wong@company.com',
        status: 'Upcoming',
        region: 'indonesia',
        base: 'narogong',
        year: 2026,
        hasAttachment: false,
        createdAt: '2026-06-01'
    }
]

// Load tasks from localStorage
export function loadTasks(): Task[] {
    if (typeof window === 'undefined') return defaultTasks
    try {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (!stored) return defaultTasks
        const tasks = JSON.parse(stored)
        // Migrate old tasks without region/base/year
        return tasks.map((t: Task) => ({
            ...t,
            region: t.region || 'indonesia',
            base: t.base || 'narogong',
            year: t.year || new Date(t.implementationDate || t.createdAt).getFullYear() || 2026
        }))
    } catch {
        return defaultTasks
    }
}

// Save tasks to localStorage
export function saveTasks(tasks: Task[]): void {
    if (typeof window === 'undefined') return
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks))
        syncToCalendar(tasks)
    } catch (e) {
        console.error('Failed to save tasks:', e)
    }
}

// Filter tasks
export function filterTasks(tasks: Task[], filters: TaskFilters): Task[] {
    return tasks.filter(t => {
        if (filters.region !== 'all' && t.region !== filters.region) return false
        if (filters.base !== 'all' && t.base !== filters.base) return false
        if (filters.year !== 'all' && t.year !== filters.year) return false
        if (filters.status !== 'all' && t.status !== filters.status) return false
        return true
    })
}

// Add task
export function addTask(task: Omit<Task, 'id' | 'createdAt'>): Task {
    const tasks = loadTasks()
    const newTask: Task = {
        ...task,
        id: `task_${Date.now()}`,
        createdAt: new Date().toISOString().split('T')[0]
    }
    tasks.push(newTask)
    saveTasks(tasks)
    return newTask
}

// Update task
export function updateTask(id: string, updates: Partial<Task>): Task | null {
    const tasks = loadTasks()
    const index = tasks.findIndex(t => t.id === id)
    if (index === -1) return null
    tasks[index] = { ...tasks[index], ...updates }
    saveTasks(tasks)
    return tasks[index]
}

// Delete task
export function deleteTask(id: string): boolean {
    const tasks = loadTasks()
    const filtered = tasks.filter(t => t.id !== id)
    if (filtered.length === tasks.length) return false
    saveTasks(filtered)
    return true
}

// Get task by ID
export function getTask(id: string): Task | null {
    const tasks = loadTasks()
    return tasks.find(t => t.id === id) || null
}

// Get tasks by program ID
export function getTasksByProgram(programId: string): Task[] {
    const tasks = loadTasks()
    return tasks.filter(t => t.programId === programId)
}

// Sync to calendar localStorage
function syncToCalendar(tasks: Task[]): void {
    if (typeof window === 'undefined') return
    const events = tasks.map(t => ({
        id: t.id,
        source: 'task',
        programId: t.programId,
        programName: t.programName,
        code: t.code,
        title: t.title,
        implementationDate: t.implementationDate,
        frequency: t.frequency,
        picName: t.picName,
        wptsId: t.wptsId || '',
        status: t.status,
        region: t.region,
        base: t.base,
        year: t.year
    }))
    localStorage.setItem('hse-tasks-calendar', JSON.stringify(events))
    window.dispatchEvent(new Event('storage'))
}

// Calculate reminder dates based on frequency
export function calculateReminderDates(implementationDate: string, frequency: TaskFrequency): { twoWeeks: string; oneMonth: string } {
    const date = new Date(implementationDate)
    const twoWeeks = new Date(date)
    twoWeeks.setDate(twoWeeks.getDate() - 14)
    const oneMonth = new Date(date)
    oneMonth.setMonth(oneMonth.getMonth() - 1)

    return {
        twoWeeks: twoWeeks.toISOString().split('T')[0],
        oneMonth: oneMonth.toISOString().split('T')[0]
    }
}

// Get reminder hint text
export function getReminderHint(frequency: TaskFrequency): string {
    if (frequency === 'monthly') {
        return '📧 Email reminders sent 2 weeks before each implementation date'
    }
    return '📧 Email reminders sent 1 month and 2 weeks before implementation date'
}

// Generate CSV
export function generateTasksCSV(tasks: Task[]): string {
    let csv = 'Code,Title,Program,Region,Base,Year,Implementation Date,Frequency,PIC Name,PIC Email,Status\n'
    tasks.forEach(t => {
        csv += `"${t.code}","${t.title}","${t.programName}","${t.region}","${t.base}","${t.year}","${t.implementationDate}","${frequencyLabels[t.frequency]}","${t.picName}","${t.picEmail}","${t.status}"\n`
    })
    return csv
}

// Download CSV
export function downloadTasksCSV(tasks: Task[]): void {
    const csv = generateTasksCSV(tasks)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `HSE_Tasks_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
}
