// Unified Export Service - PDF & CSV generation for HSE Reports
// Consolidates Matrix, OTP, and Task data into professional reports

import { getOTPData, type OTPProgram, calculateProgress as calcOTPProgress } from './otp-store'
import { getMatrixData, type MatrixProgram, type MatrixCategory, calculateProgress as calcMatrixProgress } from './matrix-store'
import { loadTasks, type Task } from './tasks-store'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

// Data types for export
export interface ExportData {
    otpPrograms: { program: OTPProgram; region: string; base: string; progress: number }[]
    matrixPrograms: { program: MatrixProgram; category: MatrixCategory; base: string; progress: number }[]
    tasks: Task[]
    summary: {
        totalPrograms: number
        completedPrograms: number
        inProgressPrograms: number
        upcomingPrograms: number
        completionRate: number
        totalTasks: number
        completedTasks: number
    }
}

// Month labels
const monthLabels = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']
const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']

/**
 * Load all export data from OTP, Matrix, and Tasks
 */
export function loadExportData(): ExportData {
    const otpPrograms: ExportData['otpPrograms'] = []
    const matrixPrograms: ExportData['matrixPrograms'] = []

    // Load OTP programs
    const otpConfigs = [
        { region: 'indonesia', base: 'narogong' },
        { region: 'indonesia', base: 'balikpapan' },
        { region: 'indonesia', base: 'duri' },
        { region: 'asia', base: '' }
    ]

    otpConfigs.forEach(({ region, base }) => {
        try {
            const data = getOTPData(region as 'indonesia' | 'asia', base)
            data.programs.forEach(prog => {
                otpPrograms.push({
                    program: prog,
                    region,
                    base: base || 'asia',
                    progress: calcOTPProgress(prog)
                })
            })
        } catch (e) {
            console.error(`Error loading OTP ${region}-${base}:`, e)
        }
    })

    // Load Matrix programs
    const categories: MatrixCategory[] = ['audit', 'training', 'drill', 'meeting']
    const bases = ['narogong', 'balikpapan', 'duri']

    categories.forEach(category => {
        bases.forEach(base => {
            try {
                const data = getMatrixData(category, base)
                data.programs.forEach(prog => {
                    matrixPrograms.push({
                        program: prog,
                        category,
                        base,
                        progress: calcMatrixProgress(prog)
                    })
                })
            } catch (e) {
                console.error(`Error loading Matrix ${category}-${base}:`, e)
            }
        })
    })

    // Load tasks
    const tasks = loadTasks()

    // Calculate summary
    const allPrograms = [...otpPrograms, ...matrixPrograms]
    const totalPrograms = allPrograms.length
    const completedPrograms = allPrograms.filter(p => p.progress >= 100).length
    const inProgressPrograms = allPrograms.filter(p => p.progress > 0 && p.progress < 100).length
    const upcomingPrograms = allPrograms.filter(p => p.progress === 0).length
    const completionRate = totalPrograms > 0 ? Math.round((completedPrograms / totalPrograms) * 100) : 0

    const totalTasks = tasks.length
    const completedTasks = tasks.filter(t => t.status === 'Completed').length

    return {
        otpPrograms,
        matrixPrograms,
        tasks,
        summary: {
            totalPrograms,
            completedPrograms,
            inProgressPrograms,
            upcomingPrograms,
            completionRate,
            totalTasks,
            completedTasks
        }
    }
}

/**
 * Generate Executive PDF Report
 */
export async function generateExecutivePDF(): Promise<void> {
    const data = loadExportData()
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })

    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const margin = 15
    let yPos = margin

    // Colors
    const primaryColor: [number, number, number] = [102, 126, 234] // #667eea
    const successColor: [number, number, number] = [39, 174, 96] // #27ae60
    const warningColor: [number, number, number] = [243, 156, 18] // #f39c12
    const darkText: [number, number, number] = [30, 30, 30]

    // ===== HEADER =====
    doc.setFillColor(...primaryColor)
    doc.rect(0, 0, pageWidth, 25, 'F')

    doc.setTextColor(255, 255, 255)
    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    doc.text('HSE EXECUTIVE REPORT', margin, 16)

    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    doc.text(`Generated: ${dateStr}`, pageWidth - margin - 60, 16)

    yPos = 35

    // ===== EXECUTIVE SUMMARY =====
    doc.setTextColor(...darkText)
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('Executive Summary', margin, yPos)
    yPos += 8

    // KPI Cards
    const cardWidth = (pageWidth - margin * 2 - 30) / 4
    const cardHeight = 25
    const cards = [
        { label: 'Total Programs', value: data.summary.totalPrograms.toString(), color: primaryColor },
        { label: 'Compliance Rate', value: `${data.summary.completionRate}%`, color: successColor },
        { label: 'Completed', value: data.summary.completedPrograms.toString(), color: successColor },
        { label: 'In Progress', value: data.summary.inProgressPrograms.toString(), color: warningColor }
    ]

    cards.forEach((card, i) => {
        const x = margin + i * (cardWidth + 10)
        doc.setFillColor(...card.color)
        doc.roundedRect(x, yPos, cardWidth, cardHeight, 3, 3, 'F')

        doc.setTextColor(255, 255, 255)
        doc.setFontSize(16)
        doc.setFont('helvetica', 'bold')
        doc.text(card.value, x + cardWidth / 2, yPos + 12, { align: 'center' })

        doc.setFontSize(8)
        doc.setFont('helvetica', 'normal')
        doc.text(card.label, x + cardWidth / 2, yPos + 20, { align: 'center' })
    })

    yPos += cardHeight + 15

    // ===== OTP PROGRAMS TABLE =====
    doc.setTextColor(...darkText)
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text(`OTP Programs (${data.otpPrograms.length})`, margin, yPos)
    yPos += 5

    const otpTableData = data.otpPrograms.slice(0, 15).map((item, idx) => [
        (idx + 1).toString(),
        item.program.name.substring(0, 40),
        item.base.charAt(0).toUpperCase() + item.base.slice(1),
        item.program.plan_type || 'N/A',
        `${item.progress}%`
    ])

    autoTable(doc, {
        startY: yPos,
        head: [['#', 'Program Name', 'Base', 'Type', 'Progress']],
        body: otpTableData,
        theme: 'grid',
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: primaryColor, textColor: [255, 255, 255], fontStyle: 'bold' },
        columnStyles: {
            0: { cellWidth: 10 },
            1: { cellWidth: 100 },
            2: { cellWidth: 30 },
            3: { cellWidth: 30 },
            4: { cellWidth: 25 }
        },
        margin: { left: margin, right: margin }
    })

    // @ts-ignore
    yPos = doc.lastAutoTable.finalY + 10

    // Check if we need a new page
    if (yPos > pageHeight - 60) {
        doc.addPage()
        yPos = margin
    }

    // ===== MATRIX PROGRAMS TABLE =====
    doc.setTextColor(...darkText)
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text(`Matrix Programs (${data.matrixPrograms.length})`, margin, yPos)
    yPos += 5

    const matrixTableData = data.matrixPrograms.slice(0, 15).map((item, idx) => [
        (idx + 1).toString(),
        item.program.name.substring(0, 40),
        item.category.charAt(0).toUpperCase() + item.category.slice(1),
        item.base.charAt(0).toUpperCase() + item.base.slice(1),
        `${item.progress}%`
    ])

    autoTable(doc, {
        startY: yPos,
        head: [['#', 'Program Name', 'Category', 'Base', 'Progress']],
        body: matrixTableData,
        theme: 'grid',
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [155, 89, 182], textColor: [255, 255, 255], fontStyle: 'bold' },
        columnStyles: {
            0: { cellWidth: 10 },
            1: { cellWidth: 100 },
            2: { cellWidth: 30 },
            3: { cellWidth: 30 },
            4: { cellWidth: 25 }
        },
        margin: { left: margin, right: margin }
    })

    // ===== FOOTER =====
    const totalPages = doc.getNumberOfPages()
    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i)
        doc.setFontSize(8)
        doc.setTextColor(150, 150, 150)
        doc.text(`Page ${i} of ${totalPages}`, pageWidth / 2, pageHeight - 10, { align: 'center' })
        doc.text('HSE Management System - Confidential', margin, pageHeight - 10)
    }

    // Download
    doc.save(`HSE_Executive_Report_${new Date().toISOString().split('T')[0]}.pdf`)
}

/**
 * Generate Raw Data CSV
 */
export function generateRawDataCSV(): void {
    const data = loadExportData()

    let csv = 'HSE PROGRAMS RAW DATA EXPORT\n'
    csv += `Generated: ${new Date().toISOString()}\n\n`

    // OTP Programs Section
    csv += '=== OTP PROGRAMS ===\n'
    csv += 'ID,Program Name,Region,Base,Plan Type,Progress'
    months.forEach(m => {
        csv += `,${m.toUpperCase()}_Plan,${m.toUpperCase()}_Actual`
    })
    csv += '\n'

    data.otpPrograms.forEach(item => {
        csv += `${item.program.id},"${item.program.name.replace(/"/g, '""')}",${item.region},${item.base},"${item.program.plan_type || ''}",${item.progress}%`
        months.forEach(m => {
            const md = item.program.months[m] || { plan: 0, actual: 0 }
            csv += `,${md.plan || 0},${md.actual || 0}`
        })
        csv += '\n'
    })

    csv += '\n=== MATRIX PROGRAMS ===\n'
    csv += 'ID,Program Name,Category,Base,Reference,Plan Type,Progress'
    months.forEach(m => {
        csv += `,${m.toUpperCase()}_Plan,${m.toUpperCase()}_Actual`
    })
    csv += '\n'

    data.matrixPrograms.forEach(item => {
        csv += `${item.program.id},"${item.program.name.replace(/"/g, '""')}",${item.category},${item.base},"${(item.program.reference || '').replace(/"/g, '""')}","${item.program.plan_type || ''}",${item.progress}%`
        months.forEach(m => {
            const md = item.program.months[m] || { plan: 0, actual: 0 }
            csv += `,${md.plan || 0},${md.actual || 0}`
        })
        csv += '\n'
    })

    csv += '\n=== TASKS ===\n'
    csv += 'ID,Code,Title,Program,Status,Region,Base,Year,PIC Name,PIC Email,Implementation Date,Frequency,WPTS ID\n'

    data.tasks.forEach(task => {
        csv += `"${task.id}","${task.code}","${task.title.replace(/"/g, '""')}","${task.programName.replace(/"/g, '""')}","${task.status}","${task.region}","${task.base}",${task.year},"${task.picName}","${task.picEmail}","${task.implementationDate}","${task.frequency}","${task.wptsId || ''}"\n`
    })

    csv += '\n=== SUMMARY ===\n'
    csv += `Total Programs,${data.summary.totalPrograms}\n`
    csv += `Completed Programs,${data.summary.completedPrograms}\n`
    csv += `In Progress Programs,${data.summary.inProgressPrograms}\n`
    csv += `Upcoming Programs,${data.summary.upcomingPrograms}\n`
    csv += `Completion Rate,${data.summary.completionRate}%\n`
    csv += `Total Tasks,${data.summary.totalTasks}\n`
    csv += `Completed Tasks,${data.summary.completedTasks}\n`

    // Download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `HSE_Raw_Data_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
}

/**
 * Get summary for modal display
 */
export function getExportSummary(): ExportData['summary'] {
    const data = loadExportData()
    return data.summary
}
